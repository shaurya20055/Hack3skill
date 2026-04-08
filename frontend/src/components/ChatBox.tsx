import { useRef, useEffect } from 'react';
import { MessageCircle, Send, User } from 'lucide-react';
import type { ChatMsg } from '../store';

interface ChatBoxProps {
  messages: ChatMsg[];
  alertId: number | null;
  chatInput: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
}

export const ChatBox = ({ messages, alertId, chatInput, onInputChange, onSend }: ChatBoxProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const filtered = alertId ? messages.filter((m) => m.alert_id === alertId) : [];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [filtered.length]);

  return (
    <div className="flex flex-col">
      <h4 className="text-[10px] text-[#8892b0] uppercase tracking-[0.15em] font-semibold mb-2 flex items-center gap-1.5 font-mono">
        <MessageCircle className="w-3 h-3 text-[#0af0ff]" /> Live Chat
        {filtered.length > 0 && (
          <span className="ml-auto text-[#4a5577]">{filtered.length} messages</span>
        )}
      </h4>

      <div ref={scrollRef} className="max-h-36 overflow-y-auto space-y-1.5 mb-2.5">
        {filtered.length === 0 ? (
          <div className="text-[11px] text-[#4a5577] text-center py-4 font-mono">
            No messages yet
          </div>
        ) : (
          filtered.map((m, i) => (
            <div
              key={i}
              className={`text-[11px] px-3 py-2 rounded-xl transition-all ${
                m.sender_role === 'staff'
                  ? 'bg-[#0af0ff]/[0.06] border border-[#0af0ff]/10 text-[#0af0ff]/80 ml-6'
                  : 'bg-white/[0.03] border border-white/[0.04] text-[#8892b0] mr-6'
              }`}
            >
              <div className="flex items-center gap-1.5 mb-0.5">
                <User className="w-2.5 h-2.5" />
                <span className="font-semibold text-[10px]">{m.sender_name}</span>
                <span className="text-[#4a5577] text-[9px] ml-auto font-mono">
                  {new Date(m.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              {m.message}
            </div>
          ))
        )}
      </div>

      <div className="flex gap-2">
        <input
          value={chatInput}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSend()}
          placeholder="Message to guest..."
          className="flex-1 bg-white/[0.03] border border-white/[0.06] text-white rounded-xl px-3 py-2 text-[11px] focus:outline-none focus:border-[#0af0ff]/30 transition-all placeholder:text-[#4a5577] font-mono"
        />
        <button
          onClick={onSend}
          className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0af0ff] to-[#00b4d8] text-[#060a13] flex items-center justify-center btn-command shadow-[0_0_15px_rgba(10,240,255,0.15)]"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
