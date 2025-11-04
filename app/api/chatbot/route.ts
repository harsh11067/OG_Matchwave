// app/api/chatbot/route.ts
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

type ChatbotRequest = {
  message: string;
  role?: 'recruiter' | 'candidate';
  context?: Record<string, unknown>;
};

function rulesBasedReply(message: string): string | null {
  const text = message.toLowerCase().trim();
  if (!text) return 'Please type your question.';
  if (/^(hi|hello|hey)\b/.test(text)) return 'Hello! How can I help you today?';
  if (text.includes('help')) {
    return 'I can help with resume analysis, posting jobs, matching candidates, and 0G setup questions. Ask me anything!';
  }
  if (text.includes('private key') || text.includes('connect wallet')) {
    return 'To use 0G features, set your private key in the Dashboard. Click Connect Wallet, paste your dev key (never a real one in production), and save.';
  }
  if (text.includes('resume') && (text.includes('analyze') || text.includes('analysis'))) {
    return 'To analyze a resume, upload it in Candidate Flow. The app extracts text, analyzes skills and experience, and stores a report via 0G.';
  }
  if (text.includes('match') || text.includes('matching')) {
    return 'To match candidates, create a job in Recruiter Flow, then click Find Matches. The app ranks candidates by skills, experience, location, salary, and education.';
  }
  if (text.includes('hardhat') || text.includes('ethers')) {
    return 'Contracts are configured with Hardhat and Ethers v6. Ensure your .env PRIVATE_KEY is set for deployments and tests.';
  }
  return null;
}

async function tryOpenAI(message: string, systemPrompt?: string): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt || 'You are a helpful assistant for a recruiting app using 0G Storage/Compute. Be concise. Do not give unsafe instructions.' },
          { role: 'user', content: message },
        ],
        temperature: 0.2,
        max_tokens: 300,
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const content: string | undefined = data?.choices?.[0]?.message?.content ?? data?.choices?.[0]?.text;
    return content || null;
  } catch (err: any) {
    console.error('tryOpenAI error:', err?.message || err);
    return null;
  }
}

async function tryZeroGJob(message: string, role: string = 'candidate'): Promise<string | null> {
  // Support two styles of env: either the base endpoint or the full job URL.
  const base = process.env.NEXT_PUBLIC_0G_CHATBOT_ENDPOINT || process.env.NEXT_PUBLIC_0G_ENDPOINT || '';
  const fallback = 'https://compute.0g.xyz/jobs/chatbot';
  let jobUrl = fallback;
  if (base) {
    // If base looks like a full jobs path, respect it; otherwise append path.
    if (base.includes('/jobs/')) jobUrl = base;
    else jobUrl = base.replace(/\/$/, '') + '/jobs/chatbot';
  }

  // Fetch candidates for context
  let candidatesContext = '';
  try {
    const candidatesRes = await fetch(`${process.env.NEXT_PUBLIC_SITE_ORIGIN || 'http://localhost:3000'}/api/get-candidates`);
    if (candidatesRes.ok) {
      const candidatesData = await candidatesRes.json();
      const candidates = candidatesData.candidates || [];
      if (candidates.length > 0) {
        candidatesContext = `\n\nAvailable candidates (${candidates.length}): ${candidates.map((c: any) => `${c.name} (${c.email})`).join(', ')}`;
      }
    }
  } catch (err) {
    // Ignore errors fetching candidates
  }

  try {
    const res = await fetch(jobUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        message: message + (role === 'recruiter' ? candidatesContext : ''),
        role 
      }),
    });
    if (!res.ok) {
      console.warn(`0G job returned ${res.status} ${res.statusText}`);
      return null;
    }
    const data = await res.json();
    const reply: string | undefined = data?.reply || data?.message || data?.result || data?.output;
    return reply || null;
  } catch (err: any) {
    console.error('tryZeroGJob error:', err?.message || err);
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ChatbotRequest;
    const message = body?.message?.toString?.() ?? '';
    const role = body?.role || 'candidate';
    
    if (!message || typeof message !== 'string') {
      return NextResponse.json({ success: false, error: 'Invalid message' }, { status: 400 });
    }

    // Role-based prompt enhancement
    let enhancedMessage = message;
    if (role === 'recruiter') {
      if (message.toLowerCase().includes('best candidates') || message.toLowerCase().includes('find candidates')) {
        enhancedMessage = `As a recruiter: ${message}. Focus on matching candidates by skills and location.`;
      }
    } else if (role === 'candidate') {
      if (message.toLowerCase().includes('jobs') || message.toLowerCase().includes('find jobs')) {
        enhancedMessage = `As a candidate: ${message}. Focus on matching jobs by my skills and preferred location.`;
      }
    }

    // 1) Rules-based quick reply (fast, deterministic)
    const rules = rulesBasedReply(enhancedMessage);
    if (rules) return NextResponse.json({ success: true, reply: rules, source: 'rules' });

    // 2) Try 0G job reply (server -> 0G compute)
    const zeroG = await tryZeroGJob(enhancedMessage, role);
    if (zeroG) return NextResponse.json({ success: true, reply: zeroG, source: '0g' });

    // 3) Fallback to OpenAI if configured (with role context)
    const openaiPrompt = role === 'recruiter' 
      ? `You are a helpful recruiting assistant. Recruiters ask about finding candidates by skills/regions. Be concise.`
      : `You are a helpful job search assistant. Candidates ask about finding jobs matching their skills. Be concise.`;
    
    const openai = await tryOpenAI(enhancedMessage, openaiPrompt);
    if (openai) return NextResponse.json({ success: true, reply: openai, source: 'openai' });

    // 4) Local search fallback (from chatbot.ts)
    try {
      const dataPath = path.join(process.cwd(), "data", "candidates.json");
      const raw = await fs.readFile(dataPath, "utf8").catch(() => "[]");
      const candidates = JSON.parse(raw || "[]");
      
      const msg = (message || "").toLowerCase();
      let skillMatch = msg.match(/(?:skill|skills|for)\s+([a-zA-Z\+\#0-9\.\s]+)/);
      let regionMatch = msg.match(/in\s+([A-Za-z\-\s]+)/);
      const skill = skillMatch ? skillMatch[1].trim() : body.context?.skill || null;
      const region = regionMatch ? regionMatch[1].trim() : body.context?.location || null;

      if (skill && typeof skill === 'string') {
        const skillLower = skill.toLowerCase();
        const regionLower = region ? (typeof region === 'string' ? region.toLowerCase() : '') : '';
        const filtered = candidates.filter((c: any) => {
          const s = (c.analysis?.skills?.found || []).map((x: string) => String(x || '').toLowerCase());
          const loc = String(c.preferences?.location || c.profile?.location || "").toLowerCase();
          const skillOk = s.some((x: string) => x.includes(skillLower));
          const locOk = regionLower ? loc.includes(regionLower) : true;
          return skillOk && locOk;
        }).slice(0, 10);
        
        const reply = filtered.length 
          ? `Found ${filtered.length} candidate(s) matching ${skill}${region ? " in " + region : ""}. Top 3:\n` + 
            filtered.slice(0,3).map((f: any, i: number) => 
              `${i+1}. ${f.name || f.id} — skills: ${(f.analysis?.skills?.found || []).join(", ")}`
            ).join("\n")
          : `No local candidate found for skill "${skill}"${region ? " in " + region : ""}.`;
        
        return NextResponse.json({ success: true, source: "local-search", reply });
      }
    } catch (err: any) {
      console.error("chatbot local search error:", err);
    }

    // 5) Final fallback
    return NextResponse.json({ success: true, reply: "I'm not sure about that yet. Could you rephrase?", source: 'fallback' });
  } catch (err: any) {
    console.error('api/chatbot POST error:', err?.message || err);
    return NextResponse.json({ success: false, error: 'Chatbot error' }, { status: 500 });
  }
}
