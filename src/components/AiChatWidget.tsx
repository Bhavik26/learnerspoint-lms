"use client";

import React, { useState, useEffect } from 'react';

export default function AiChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ sender: 'user' | 'ai'; text: string }[]>([
    { sender: 'ai', text: 'Hello! I am your LearnersPoint AI Guide. How can I assist you with your courses today?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState('');

  // Resolve user session from localStorage cache on client browser mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem("user");
      if (cached) {
        try {
          const userObj = JSON.parse(cached);
          if (userObj && userObj.id) {
            setUserId(userObj.id);
          }
        } catch (e) {}
      }
    }
  }, []);

  const handleSendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input;
    setMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: userMsg,
          userId: userId || 'Guest'
        })
      });
      const data = await response.json();
      if (data.success) {
        setMessages(prev => [...prev, { sender: 'ai', text: data.text }]);
      } else {
        setMessages(prev => [...prev, { sender: 'ai', text: data.error || 'Cognitive grid offline. Please try again.' }]);
      }
    } catch (err) {
      console.error("AI Bridge error:", err);
      setMessages(prev => [...prev, { sender: 'ai', text: 'Network bridge failure. Please check your internet connection.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] font-sans pointer-events-auto">
      {/* Floating Toggle Icon Trigger */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 bg-[#0B58CA] hover:bg-[#3DBFF2] text-white rounded-full flex items-center justify-center shadow-2xl transition-all transform hover:scale-110 active:scale-95 border border-[#3DBFF2]/30 cursor-pointer"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
        </button>
      )}

      {/* Actual Expanded Chat Window Context */}
      {isOpen && (
        <div className="w-[85vw] sm:w-80 md:w-96 h-[450px] bg-slate-900 border border-[#3DBFF2]/40 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-fade-in">
          {/* Header Panel */}
          <div className="bg-[#0B58CA] p-4 flex justify-between items-center border-b border-[#3DBFF2]/20">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
              <span className="text-white font-bold text-sm">LearnersPoint AI Core</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-slate-300 hover:text-white transition cursor-pointer">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>

          {/* Interactive Message Output Content View */}
          <div className="flex-grow p-4 overflow-y-auto space-y-3 bg-slate-950/50">
            {messages.map((msg, index) => (
              <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] p-3 rounded-xl text-xs sm:text-sm ${
                  msg.sender === 'user' 
                    ? 'bg-[#0B58CA] text-white rounded-br-none' 
                    : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-bl-none'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-slate-800 text-slate-400 border border-slate-750 p-3 rounded-xl rounded-bl-none text-xs flex items-center gap-1.5 animate-pulse">
                  <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce" />
                  <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <div className="w-1.5 h-1.5 bg-slate-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                  <span>Thinking...</span>
                </div>
              </div>
            )}
          </div>

          {/* User Text Form Field Group */}
          <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center space-x-2">
            <input
              type="text"
              value={input}
              disabled={loading}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Ask anything about your dashboard..."
              className="flex-grow bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs sm:text-sm focus:outline-none focus:border-[#3DBFF2] transition disabled:opacity-55"
            />
            <button 
              onClick={handleSendMessage}
              disabled={loading}
              className="p-2 bg-[#0B58CA] text-white rounded-lg hover:bg-[#3DBFF2] transition cursor-pointer disabled:opacity-55"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
