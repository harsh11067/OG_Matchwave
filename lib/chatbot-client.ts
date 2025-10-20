// chatbot-client.ts
export async function sendChatbotMessage(
  message: string
): Promise<{ reply: string; source?: string }> {
  try {
    const res = await fetch('/api/chatbot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`Chatbot API error: ${res.status} ${res.statusText} ${text}`);
    }

    const data = await res.json();
    return {
      reply: data?.reply ?? data?.result ?? 'No response',
      source: data?.source ?? 'api',
    };
  } catch (error) {
    console.error('sendChatbotMessage error:', error);
    return {
      reply: 'Sorry, something went wrong while contacting the chatbot.',
      source: 'error',
    };
  }
}
