import { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, Bot, User, X, Sparkles } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface AIChatProps {
  context?: string;
  floating?: boolean;
}

const API_URL = 'http://127.0.0.1:8000/api/ai-chat/';

export const AIChat = ({ context = '', floating = true }: AIChatProps) => {
  const [isOpen, setIsOpen] = useState(!floating);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "🤖 I'm your emergency AI assistant. I can help with:\n• 🔥 Fire safety and evacuation\n• 🏥 First aid and medical guidance\n• 🔒 Security threat protocols\n• 🌍 Natural disaster response\n\nHow can I help you?",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg.content, context }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.response || 'Sorry, I could not process that.',
          timestamp: data.timestamp || new Date().toISOString(),
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: '⚠️ Unable to reach the AI server. Please try again.',
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    'What to do in a fire?',
    'First aid for bleeding',
    'Earthquake safety',
    'How to evacuate?',
  ];

  if (floating && !isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-2xl shadow-indigo-600/30 hover:scale-110 transition-transform cursor-pointer"
        id="ai-chat-toggle"
      >
        <Sparkles className="w-6 h-6" />
      </button>
    );
  }

  const chatContent = (
    <div className={`flex flex-col ${floating ? 'h-[500px] w-[380px]' : 'h-full w-full'}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06] bg-gradient-to-r from-indigo-600/10 to-purple-600/10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">AI Assistant</h3>
            <p className="text-[10px] text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Powered by Gemini
            </p>
          </div>
        </div>
        {floating && (
          <button
            onClick={() => setIsOpen(false)}
            className="text-[#64748b] hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                msg.role === 'user'
                  ? 'bg-indigo-500/20 text-indigo-400'
                  : 'bg-purple-500/20 text-purple-400'
              }`}
            >
              {msg.role === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
            </div>
            <div
              className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-indigo-600/20 border border-indigo-500/20 text-white rounded-br-md'
                  : 'bg-white/[0.04] border border-white/[0.06] text-[#e2e8f0] rounded-bl-md'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center flex-shrink-0">
              <Bot className="w-3.5 h-3.5" />
            </div>
            <div className="bg-white/[0.04] border border-white/[0.06] px-4 py-3 rounded-2xl rounded-bl-md">
              <div className="flex gap-1.5">
                <span className="w-2 h-2 bg-[#475569] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-[#475569] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-[#475569] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      {messages.length <= 1 && (
        <div className="px-4 pb-2 flex flex-wrap gap-1.5">
          {quickActions.map((q, i) => (
            <button
              key={i}
              onClick={() => {
                setInput(q);
                setTimeout(() => {
                  setInput('');
                  const userMsg: Message = { role: 'user', content: q, timestamp: new Date().toISOString() };
                  setMessages((prev) => [...prev, userMsg]);
                  setLoading(true);
                  fetch(API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: q, context }),
                  })
                    .then((r) => r.json())
                    .then((data) => {
                      setMessages((prev) => [
                        ...prev,
                        { role: 'assistant', content: data.response || 'Error.', timestamp: new Date().toISOString() },
                      ]);
                    })
                    .catch(() => {
                      setMessages((prev) => [
                        ...prev,
                        { role: 'assistant', content: '⚠️ Server unreachable.', timestamp: new Date().toISOString() },
                      ]);
                    })
                    .finally(() => setLoading(false));
                }, 0);
              }}
              className="text-xs px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-[#94a3b8] hover:text-white hover:bg-white/[0.08] hover:border-white/[0.15] transition-all cursor-pointer"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="p-3 border-t border-white/[0.06]">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Ask about emergency procedures..."
            className="flex-1 bg-white/[0.04] border border-white/[0.08] text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 transition-all placeholder:text-[#475569]"
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="w-10 h-10 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed text-white flex items-center justify-center transition-all cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  if (floating) {
    return (
      <div className="fixed bottom-6 right-6 z-50 rounded-2xl border border-white/[0.08] bg-[#0f1420] shadow-2xl shadow-black/50 overflow-hidden animate-float-up">
        {chatContent}
      </div>
    );
  }

  return chatContent;
};
