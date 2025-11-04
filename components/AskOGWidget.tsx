'use client';

import { useState } from 'react';
import { sendChatbotMessage } from '../lib/chatbot-client';

export default function AskOGWidget() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<{ sender: 'user' | 'bot'; text: string }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<'recruiter' | 'candidate'>('candidate');

  async function onSend() {
    if (!input.trim() || loading) return;
    const userText = input.trim();
    setMessages((m) => [...m, { sender: 'user', text: userText }]);
    setInput('');
    setLoading(true);
    try {
      // Send message with role context
      const res = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userText, role })
      });
      const data = await res.json();
      setMessages((m) => [...m, { sender: 'bot', text: data.reply || 'Sorry, something went wrong.' }]);
    } catch (e) {
      setMessages((m) => [...m, { sender: 'bot', text: 'Sorry, something went wrong.' }]);
    } finally {
      setLoading(false);
    }
  }

  if (!isExpanded) {
    return (
      <button
        onClick={() => setIsExpanded(true)}
        className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-full shadow-2xl flex items-center justify-center text-2xl transition-all duration-300 hover:scale-110 z-50"
        title="Ask OG Assistant"
      >
        🤖
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-80 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-2xl shadow-2xl overflow-hidden z-50">
      <div className="px-4 py-3 border-b bg-gradient-to-r from-blue-50 to-indigo-50 flex items-center justify-between">
        <div className="flex-1">
          <div className="font-bold text-gray-900 flex items-center">
            <span className="mr-2">🤖</span>
            AskOG
          </div>
          <div className="text-xs text-gray-500 mt-1">AI Assistant</div>
        </div>
        <div className="mx-3">
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as 'recruiter' | 'candidate')}
            className="text-xs px-2 py-1 border border-gray-300 rounded bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="candidate">👤 Candidate</option>
            <option value="recruiter">💼 Recruiter</option>
          </select>
        </div>
        <button
          onClick={() => setIsExpanded(false)}
          className="w-6 h-6 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center text-gray-600 hover:text-gray-800 transition-colors duration-200"
        >
          ✕
        </button>
      </div>
      
      <div className="h-64 overflow-y-auto p-3 space-y-2">
        {messages.map((m, i) => (
          <div key={i} className={m.sender === 'user' ? 'text-right' : 'text-left'}>
            <span className={
              m.sender === 'user'
                ? 'inline-block px-3 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg'
                : 'inline-block px-3 py-2 bg-gray-100 text-gray-800 rounded-lg'
            }>
              {m.text}
            </span>
          </div>
        ))}
        {messages.length === 0 && (
          <div className="text-sm text-gray-500 text-center">Ask me anything about jobs, resumes, or 0G!</div>
        )}
      </div>
      
      <div className="p-3 border-t flex items-center space-x-2">
        <input
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          placeholder="Type your message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSend();
          }}
        />
        <button
          className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg disabled:opacity-50 text-sm"
          onClick={onSend}
          disabled={loading}
        >
          {loading ? '...' : 'Send'}
        </button>
      </div>
    </div>
  );
}
