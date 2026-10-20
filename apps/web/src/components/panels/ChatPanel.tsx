import React, { useState, useRef, useEffect } from 'react';
import { Send, Lock, Globe, X } from 'lucide-react';
import { useRoomStore } from '../../store/useRoomStore';

interface ChatPanelProps {
  onSendMessage: (text: string, recipientId?: string) => void;
  onClose: () => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ onSendMessage, onClose }) => {
  const { chatMessages, participants, myParticipant } = useRoomStore();
  const [inputText, setInputText] = useState('');
  const [targetRecipientId, setTargetRecipientId] = useState<string>('everyone');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const recipientId = targetRecipientId === 'everyone' ? undefined : targetRecipientId;
    onSendMessage(inputText.trim(), recipientId);
    setInputText('');
  };

  const remoteParticipants = Object.values(participants).filter(
    (p) => p.id !== myParticipant?.id && !p.inWaitingRoom
  );

  return (
    <div className="w-80 sm:w-96 h-full bg-slate-900 border-l border-slate-800 flex flex-col z-30 shrink-0">
      {/* Header */}
      <div className="h-16 px-4 border-b border-slate-800 flex items-center justify-between shrink-0">
        <h3 className="font-bold text-slate-100 text-sm">Meeting Chat</h3>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {chatMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500 text-xs">
            <Globe className="w-8 h-8 mb-2 opacity-40" />
            <p>No messages yet.</p>
            <p className="mt-1">Send a message to everyone or privately to someone.</p>
          </div>
        ) : (
          chatMessages.map((msg) => {
            const isMe = msg.senderId === myParticipant?.id;
            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center space-x-1.5 text-[11px] text-slate-400 mb-1 px-1">
                  <span className="font-semibold text-slate-300">
                    {isMe ? 'You' : msg.senderName}
                  </span>
                  {msg.isPrivate && (
                    <span className="flex items-center gap-0.5 text-amber-400 font-medium">
                      <Lock className="w-2.5 h-2.5" />
                      <span>Direct</span>
                    </span>
                  )}
                  <span>
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm break-words ${
                    isMe
                      ? msg.isPrivate
                        ? 'bg-amber-600/30 border border-amber-500/40 text-amber-100'
                        : 'bg-brand-600 text-white'
                      : msg.isPrivate
                      ? 'bg-amber-500/10 border border-amber-500/30 text-amber-200'
                      : 'bg-slate-800 text-slate-100'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Recipient Selector & Input */}
      <form onSubmit={handleSend} className="p-3 border-t border-slate-800 bg-slate-950/50">
        {/* Recipient Dropdown */}
        <div className="flex items-center space-x-1.5 mb-2 text-xs">
          <span className="text-slate-400">To:</span>
          <select
            value={targetRecipientId}
            onChange={(e) => setTargetRecipientId(e.target.value)}
            className="bg-slate-800 text-slate-200 rounded-lg px-2 py-1 text-xs border border-slate-700 outline-none focus:border-brand-500"
          >
            <option value="everyone">Everyone (Public)</option>
            {remoteParticipants.map((p) => (
              <option key={p.id} value={p.id}>
                🔒 {p.name} (Direct)
              </option>
            ))}
          </select>
        </div>

        {/* Text Input */}
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-slate-800 text-slate-100 rounded-xl px-3.5 py-2 text-sm border border-slate-700/80 outline-none focus:border-brand-500 placeholder-slate-500"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="p-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-40 text-white transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
