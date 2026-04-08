import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, X, Sparkles } from 'lucide-react';
import gsap from 'gsap';

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
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (containerRef.current && isOpen) {
      gsap.fromTo(containerRef.current,
        { opacity: 0, y: 20, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.35, ease: 'power3.out' }
      );
    }
  }, [isOpen]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg: Message = { role: 'user', content: input.trim(), timestamp: new Date().toISOString() };
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
        { role: 'assistant', content: data.response || 'Sorry, I could not process that.', timestamp: data.timestamp || new Date().toISOString() },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: '⚠️ Unable to reach the AI server. Please try again.', timestamp: new Date().toISOString() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = ['What to do in a fire?', 'First aid for bleeding', 'Earthquake safety', 'How to evacuate?'];

  if (floating && !isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-[#bf5af2] to-[#9745c7] text-white flex items-center justify-center shadow-[0_0_30px_rgba(191,90,242,0.3)] hover:scale-110 transition-transform cursor-pointer btn-command"
        id="ai-chat-toggle"
      >
        <Sparkles className="w-6 h-6" />
      </button>
    );
  }

  const chatContent = (
    <div className={`flex flex-col ${floating ? 'h-[500px] w-[380px]' : 'h-full w-full'}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.04] flex-shrink-0 bg-gradient-to-r from-[#bf5af2]/[0.06] to-transparent">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#bf5af2] to-[#9745c7] flex items-center justify-center shadow-[0_0_15px_rgba(191,90,242,0.2)]">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">AI Assistant</h3>
            <p className="text-[9px] text-[#30d158] flex items-center gap-1 font-mono uppercase tracking-wider">
              <span className="live-dot live-dot-safe" /> Gemini Active
            </p>
          </div>
        </div>
        {floating && (
          <button onClick={() => setIsOpen(false)} className="text-[#4a5577] hover:text-white transition-colors cursor-pointer p-1 rounded-lg hover:bg-white/[0.04]">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${
              msg.role === 'user' ? 'bg-[#0af0ff]/10 text-[#0af0ff]' : 'bg-[#bf5af2]/10 text-[#bf5af2]'
            }`}>
              {msg.role === 'user' ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
            </div>
            <div className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-[12px] leading-relaxed whitespace-pre-wrap ${
              msg.role === 'user'
                ? 'bg-[#0af0ff]/[0.08] border border-[#0af0ff]/15 text-white rounded-br-md'
                : 'bg-white/[0.03] border border-white/[0.04] text-[#c8cee0] rounded-bl-md'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-2">
            <div className="w-6 h-6 rounded-lg bg-[#bf5af2]/10 text-[#bf5af2] flex items-center justify-center flex-shrink-0">
              <Bot className="w-3 h-3" />
            </div>
            <div className="bg-white/[0.03] border border-white/[0.04] px-3.5 py-2.5 rounded-2xl rounded-bl-md">
              <div className="flex gap-1.5">
                <span className="w-1.5 h-1.5 bg-[#bf5af2] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-[#bf5af2] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-[#bf5af2] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
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
                const userMsg: Message = { role: 'user', content: q, timestamp: new Date().toISOString() };
                setMessages((prev) => [...prev, userMsg]);
                setLoading(true);
                fetch(API_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: q, context }) })
                  .then((r) => r.json())
                  .then((data) => setMessages((prev) => [...prev, { role: 'assistant', content: data.response || 'Error.', timestamp: new Date().toISOString() }]))
                  .catch(() => setMessages((prev) => [...prev, { role: 'assistant', content: '⚠️ Server unreachable.', timestamp: new Date().toISOString() }]))
                  .finally(() => setLoading(false));
              }}
              className="text-[10px] px-3 py-1.5 rounded-lg bg-[#bf5af2]/[0.06] border border-[#bf5af2]/15 text-[#bf5af2]/80 hover:text-[#bf5af2] hover:bg-[#bf5af2]/10 transition-all cursor-pointer font-mono"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="p-3 border-t border-white/[0.04] flex-shrink-0">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Ask about emergency procedures..."
            className="flex-1 bg-white/[0.03] border border-white/[0.06] text-white rounded-xl px-3.5 py-2.5 text-[12px] focus:outline-none focus:border-[#bf5af2]/30 transition-all placeholder:text-[#4a5577] font-mono"
          />
          <button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            className="w-10 h-10 rounded-xl btn-ai disabled:opacity-20 disabled:cursor-not-allowed text-white flex items-center justify-center btn-command"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  if (floating) {
    return (
      <div ref={containerRef} className="fixed bottom-6 right-6 z-50 rounded-2xl glass-panel float-panel overflow-hidden border border-white/[0.06]">
        {chatContent}
      </div>
    );
  }

  return chatContent;
};
