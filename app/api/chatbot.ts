// pages/api/chatbot.ts
import type { NextApiRequest, NextApiResponse } from "next";
import fs from "fs/promises";
import path from "path";

async function call0GBroker(endpoint: string, payload: any) {
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type":"application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error(`0G broker error ${res.status}`);
  return res.json();
}

async function callOpenAI(apiKey: string, messages: any[]) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type":"application/json", "Authorization": `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "gpt-4o-mini", // or a supported model in your account
      messages,
      max_tokens: 400
    })
  });
  if (!res.ok) throw new Error("OpenAI error: " + (await res.text()));
  const j = await res.json();
  const content = j.choices?.[0]?.message?.content ?? j.choices?.[0]?.text;
  return content;
}

// Export for 0G Compute deployment
export async function POST(req: any) {
  if (req.method && req.method !== "POST") {
    return { success: false, error: "Use POST" };
  }
  const { role = "user", message, params = {} } = req.body || {};
  return await handlerInternal({ role, message, params });
}

async function handlerInternal({ role = "user", message, params = {} }: any) {
  // 1. Try 0G compute broker (fast path)
  try {
    const brokerUrl = process.env.NEXT_PUBLIC_0G_CHATBOT_ENDPOINT;
    if (brokerUrl) {
      const payload = { task: "chat", input: { role, message, params } };
      try {
        const brokerRes = await call0GBroker(brokerUrl, payload);
        if (brokerRes) return { success: true, source: "0g-broker", reply: brokerRes.reply ?? brokerRes };
      } catch (err: any) {
        console.warn("0G broker failed:", err?.message || err);
      }
    }
  } catch (err: any) {
    console.warn("0G attempt error:", err?.message || err);
  }

  // 2. Fallback: OpenAI if key present
  try {
    const key = process.env.OPENAI_API_KEY;
    if (key) {
      const reply = await callOpenAI(key, [{ role: "user", content: message }]);
      return { success: true, source: "openai", reply };
    }
  } catch (err: any) {
    console.warn("OpenAI fallback failed:", err?.message || err);
  }

  // 3. Local fallback: try to answer recruiter queries by searching local candidate store
  try {
    const dataPath = path.join(process.cwd(), "data", "candidates.json");
    const raw = await fs.readFile(dataPath, "utf8").catch(() => "[]");
    const candidates = JSON.parse(raw || "[]");
    // If query looks for "skill X in region Y", do a simple filter
    const msg = (message || "").toLowerCase();
    let skillMatch = msg.match(/(?:skill|skills|for)\s+([a-zA-Z\+\#0-9\.\s]+)/);
    let regionMatch = msg.match(/in\s+([A-Za-z\-\s]+)/);
    const skill = skillMatch ? skillMatch[1].trim() : params.skill || null;
    const region = regionMatch ? regionMatch[1].trim() : params.location || null;

    if (skill) {
      const filtered = candidates.filter((c: any) => {
        const s = (c.analysis?.skills?.found || []).map((x:string)=>x.toLowerCase());
        const loc = (c.preferences?.location || c.profile?.location || "").toLowerCase();
        const skillOk = s.some((x:string)=> x.includes(skill.toLowerCase()));
        const locOk = region ? loc.includes(region.toLowerCase()) : true;
        return skillOk && locOk;
      }).slice(0, 10);
      const reply = filtered.length ? `Found ${filtered.length} candidate(s) matching ${skill}${region ? " in " + region : ""}. Top 3:\n` + filtered.slice(0,3).map((f:any,i:number)=> `${i+1}. ${f.name || f.id} — skills: ${(f.analysis?.skills?.found || []).join(", ")}`).join("\n")
        : `No local candidate found for skill "${skill}"${region ? " in " + region : ""}.`;
      return { success: true, source: "local-search", reply };
    }

    // Generic fallback answer
    const generic = "I couldn't reach compute endpoints. Provide more details (skills, region, seniority) and I'll search local candidates or explain how to craft a targeted query.";
    return { success: true, source: "fallback", reply: generic };
  } catch (err: any) {
    console.error("chatbot fallback error:", err?.message || err);
    return { success: false, error: err?.message || 'Unknown error' };
  }
}

// Next.js API route handler
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ success: false, error: "Use POST" });
  const { role = "user", message, params = {} } = req.body || {};
  const result = await handlerInternal({ role, message, params });
  return res.json(result);
}
