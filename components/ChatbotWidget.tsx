'use client';

import { useState } from 'react';
import { sendChatbotMessage } from '@/lib/chatbot-client';

export default function ChatbotWidget() {
  const [messages, setMessages] = useState<{ sender: 'user' | 'bot'; text: string }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSend() {
    if (!input.trim() || loading) return;
    const userText = input.trim();
    setMessages((m) => [...m, { sender: 'user', text: userText }]);
    setInput('');
    setLoading(true);
    try {
      const { reply } = await sendChatbotMessage(userText);
      setMessages((m) => [...m, { sender: 'bot', text: reply }]);
    } catch (e) {
      setMessages((m) => [...m, { sender: 'bot', text: 'Sorry, something went wrong.' }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed bottom-6 right-6 w-80 bg-white/90 backdrop-blur-sm border border-gray-200 rounded-xl shadow-2xl overflow-hidden z-40">
      <div className="px-4 py-3 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="font-semibold text-gray-900">Assistant</div>
        <div className="text-xs text-gray-500">Ask about resumes, jobs, or 0G setup</div>
      </div>
      <div className="h-64 overflow-y-auto p-3 space-y-2">
        {messages.map((m, i) => (
          <div key={i} className={m.sender === 'user' ? 'text-right' : 'text-left'}>
            <span className={
              m.sender === 'user'
                ? 'inline-block px-3 py-2 bg-blue-600 text-white rounded-lg'
                : 'inline-block px-3 py-2 bg-gray-100 text-gray-800 rounded-lg'
            }>
              {m.text}
            </span>
          </div>
        ))}
        {messages.length === 0 && (
          <div className="text-sm text-gray-500 text-center">Say hi to get started.</div>
        )}
      </div>
      <div className="p-3 border-t flex items-center space-x-2">
        <input
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Type your message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSend();
          }}
        />
        <button
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:bg-blue-300"
          onClick={onSend}
          disabled={loading}
        >
          {loading ? '...' : 'Send'}
        </button>
      </div>
    </div>
  );
}


