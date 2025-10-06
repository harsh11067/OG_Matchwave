export async function sendChatbotMessage(message: string): Promise<{ reply: string; source: string }> {
  const res = await fetch('/api/chatbot', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message }),
  });
  if (!res.ok) throw new Error('Chatbot request failed');
  const data = await res.json();
  return { reply: data.reply, source: data.source };
}


