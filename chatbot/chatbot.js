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
