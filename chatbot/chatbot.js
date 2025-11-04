import { createServer } from "@0glabs/0g-serving-broker";
import fetch from "node-fetch";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const chatbotData = {
  trending_skills: ["Web3 development", "AI prompt engineering", "Blockchain security", "Rust programming"],
  market_news: [
    "Web3 job market is growing rapidly in 2025",
    "AI tools adoption has increased by 70% in last year"
  ],
  places: ["Bangalore", "San Francisco", "Berlin", "London"]
};

function getRulesBasedReply(message) {
  message = message.toLowerCase();

  if (message.includes("skills")) {
    return "Trending skills: " + chatbotData.trending_skills.join(", ");
  } else if (message.includes("market")) {
    return chatbotData.market_news[Math.floor(Math.random() * chatbotData.market_news.length)];
  } else if (message.includes("places")) {
    return "Top places: " + chatbotData.places.join(", ");
  }
  return null;
}

async function getLiveDataReply(message) {
  try {
    // Example: GitHub Jobs API call
    const res = await fetch("https://jobs.github.com/positions.json?search=web3");
    const jobs = await res.json();
    if (jobs.length > 0) {
      return `Latest job: ${jobs[0].title} at ${jobs[0].company}`;
    }
  } catch (err) {
    console.error("Error fetching jobs:", err);
  }
  return null;
}

async function getOpenAIReply(message) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are a helpful job assistant." },
        { role: "user", content: message }
      ],
      max_tokens: 150
    });
    return response.choices[0].message.content;
  } catch (err) {
    console.error("OpenAI error:", err);
    return "Sorry, I cannot process that right now.";
  }
}

const server = createServer(async (req) => {
  const { message } = await req.json();

  // Step 1: Rules-based reply
  const ruleReply = getRulesBasedReply(message);
  if (ruleReply) return { reply: ruleReply };

  // Step 2: Try live data
  const liveReply = await getLiveDataReply(message);
  if (liveReply) return { reply: liveReply };

  // Step 3: Fallback to OpenAI
  const aiReply = await getOpenAIReply(message);
  return { reply: aiReply };
});

server.listen();

// /pages/api/chatbot.ts
import { NextApiRequest, NextApiResponse } from "next";
import { Broker } from "@0glabs/0g-serving-broker";

const broker = new Broker({
  url: process.env.NEXT_PUBLIC_0G_COMPUTE_BROKER_URL || "https://compute.0g.ai",
  apiKey: process.env.OG_COMPUTE_API_KEY || "",
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { query, role } = req.body; // role: "recruiter" | "candidate"

    // Add dynamic prompt routing
    let prompt = "";
    if (role === "recruiter") {
      prompt = `Find top candidates skilled in ${query.skill} from region ${query.region}. Rank them by match score and experience.`;
    } else {
      prompt = `Suggest jobs matching ${query.skills.join(", ")} in ${query.region}.`;
    }

    const response = await broker.submitJob({
      jobType: "chat",
      model: "gpt-4o-mini",
      input: prompt,
    });

    const result = await broker.waitForJob(response.jobId);

    res.status(200).json({
      success: true,
      output: result.output_text,
    });
  } catch (err: any) {
    console.error("Chatbot error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
}
