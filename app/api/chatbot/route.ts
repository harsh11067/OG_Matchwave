// app/api/chatbot/route.ts
import { NextRequest, NextResponse } from 'next/server';

type ChatbotRequest = {
  message: string;
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

async function tryOpenAI(message: string): Promise<string | null> {
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
          { role: 'system', content: 'You are a helpful assistant for a recruiting app using 0G Storage/Compute. Be concise. Do not give unsafe instructions.' },
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
  } catch (err) {
    console.error('tryOpenAI error:', err);
    return null;
  }
}

async function tryZeroGJob(message: string): Promise<string | null> {
  // Support two styles of env: either the base endpoint or the full job URL.
  const base = process.env.NEXT_PUBLIC_0G_CHATBOT_ENDPOINT || process.env.NEXT_PUBLIC_0G_ENDPOINT || '';
  const fallback = 'https://compute.0g.xyz/jobs/chatbot';
  let jobUrl = fallback;
  if (base) {
    // If base looks like a full jobs path, respect it; otherwise append path.
    if (base.includes('/jobs/')) jobUrl = base;
    else jobUrl = base.replace(/\/$/, '') + '/jobs/chatbot';
  }

  try {
    const res = await fetch(jobUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    });
    if (!res.ok) {
      console.warn(`0G job returned ${res.status} ${res.statusText}`);
      return null;
    }
    const data = await res.json();
    const reply: string | undefined = data?.reply || data?.message || data?.result || data?.output;
    return reply || null;
  } catch (err) {
    console.error('tryZeroGJob error:', err);
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ChatbotRequest;
    const message = body?.message?.toString?.() ?? '';
    if (!message || typeof message !== 'string') {
      return NextResponse.json({ success: false, error: 'Invalid message' }, { status: 400 });
    }

    // 1) Rules-based quick reply (fast, deterministic)
    const rules = rulesBasedReply(message);
    if (rules) return NextResponse.json({ success: true, reply: rules, source: 'rules' });

    // 2) Try 0G job reply (server -> 0G compute)
    const zeroG = await tryZeroGJob(message);
    if (zeroG) return NextResponse.json({ success: true, reply: zeroG, source: '0g' });

    // 3) Fallback to OpenAI if configured
    const openai = await tryOpenAI(message);
    if (openai) return NextResponse.json({ success: true, reply: openai, source: 'openai' });

    // 4) Final fallback
    return NextResponse.json({ success: true, reply: "I'm not sure about that yet. Could you rephrase?", source: 'fallback' });
  } catch (err) {
    console.error('api/chatbot POST error:', err);
    return NextResponse.json({ success: false, error: 'Chatbot error' }, { status: 500 });
  }
}
