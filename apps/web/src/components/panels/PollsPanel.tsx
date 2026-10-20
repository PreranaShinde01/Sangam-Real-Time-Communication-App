import React, { useState } from 'react';
import { Plus, BarChart2, CheckCircle2, Lock, X, Play } from 'lucide-react';
import { useRoomStore } from '../../store/useRoomStore';

interface PollsPanelProps {
  onCreatePoll: (question: string, options: string[], isAnonymous: boolean) => void;
  onVote: (pollId: string, optionId: string) => void;
  onEndPoll: (pollId: string) => void;
  onClose: () => void;
}

export const PollsPanel: React.FC<PollsPanelProps> = ({
  onCreatePoll,
  onVote,
  onEndPoll,
  onClose,
}) => {
  const { polls, myParticipant } = useRoomStore();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [isAnonymous, setIsAnonymous] = useState(false);

  const handleAddOption = () => {
    if (options.length < 5) setOptions([...options, '']);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const validOpts = options.filter((o) => o.trim().length > 0);
    if (!question.trim() || validOpts.length < 2) return;

    onCreatePoll(question.trim(), validOpts, isAnonymous);
    setQuestion('');
    setOptions(['', '']);
    setShowCreateForm(false);
  };

  return (
    <div className="w-80 sm:w-96 h-full bg-slate-900 border-l border-slate-800 flex flex-col z-30 shrink-0">
      {/* Header */}
      <div className="h-16 px-4 border-b border-slate-800 flex items-center justify-between shrink-0">
        <div>
          <h3 className="font-bold text-slate-100 text-sm">Polls & Quizzes</h3>
          <span className="text-xs text-slate-400">{polls.length} total</span>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Create Poll Button or Form */}
        {!showCreateForm ? (
          <button
            onClick={() => setShowCreateForm(true)}
            className="w-full py-2.5 px-3 rounded-xl bg-brand-600/20 border border-brand-500/40 text-brand-300 hover:bg-brand-600 hover:text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Poll</span>
          </button>
        ) : (
          <form
            onSubmit={handleCreate}
            className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200">New Poll</span>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="text-slate-500 hover:text-slate-300 text-xs"
              >
                Cancel
              </button>
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Question</label>
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="What should we decide on?"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 outline-none focus:border-brand-500"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] text-slate-400 block">Options</label>
              {options.map((opt, i) => (
                <input
                  key={i}
                  type="text"
                  value={opt}
                  onChange={(e) => {
                    const copy = [...options];
                    copy[i] = e.target.value;
                    setOptions(copy);
                  }}
                  placeholder={`Option ${i + 1}`}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 outline-none focus:border-brand-500"
                  required
                />
              ))}
              {options.length < 5 && (
                <button
                  type="button"
                  onClick={handleAddOption}
                  className="text-[11px] text-brand-400 hover:text-brand-300"
                >
                  + Add Option
                </button>
              )}
            </div>

            <div className="flex items-center space-x-2 pt-1">
              <input
                type="checkbox"
                id="anon"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="rounded border-slate-700 text-brand-600 focus:ring-0"
              />
              <label htmlFor="anon" className="text-[11px] text-slate-300">
                Anonymous voting
              </label>
            </div>

            <button
              type="submit"
              className="w-full py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition-colors"
            >
              Launch Poll
            </button>
          </form>
        )}

        {/* Polls List */}
        {polls.length === 0 && !showCreateForm ? (
          <div className="h-48 flex flex-col items-center justify-center text-center p-6 text-slate-500 text-xs">
            <BarChart2 className="w-8 h-8 mb-2 opacity-40" />
            <p>No active polls.</p>
          </div>
        ) : (
          polls.map((poll) => {
            const totalVotes = poll.options.reduce((sum, o) => sum + o.voterIds.length, 0);
            const userVotedOptionId = poll.options.find((o) =>
              o.voterIds.includes(myParticipant?.id || '')
            )?.id;

            return (
              <div
                key={poll.id}
                className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-xs font-bold text-slate-200">{poll.question}</h4>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      poll.status === 'active'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {poll.status === 'active' ? 'Active' : 'Ended'}
                  </span>
                </div>

                {/* Options List */}
                <div className="space-y-1.5">
                  {poll.options.map((opt) => {
                    const percent =
                      totalVotes > 0 ? Math.round((opt.voterIds.length / totalVotes) * 100) : 0;
                    const isMyVote = userVotedOptionId === opt.id;

                    return (
                      <button
                        key={opt.id}
                        onClick={() => poll.status === 'active' && onVote(poll.id, opt.id)}
                        disabled={poll.status !== 'active'}
                        className={`w-full text-left p-2 rounded-xl text-xs relative overflow-hidden transition-all ${
                          isMyVote
                            ? 'border border-brand-500 bg-brand-500/10'
                            : 'border border-slate-800 hover:border-slate-700 bg-slate-900/60'
                        }`}
                      >
                        {/* Percentage fill bar */}
                        <div
                          className="absolute inset-y-0 left-0 bg-brand-500/20 transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        />

                        <div className="relative z-10 flex items-center justify-between">
                          <span className="font-medium text-slate-200 flex items-center gap-1.5">
                            {isMyVote && <CheckCircle2 className="w-3.5 h-3.5 text-brand-400" />}
                            {opt.text}
                          </span>
                          <span className="text-[11px] font-mono font-bold text-slate-400">
                            {percent}% ({opt.voterIds.length})
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                  <span>{totalVotes} votes total</span>
                  {poll.status === 'active' &&
                    (myParticipant?.isHost || poll.createdBy === myParticipant?.id) && (
                      <button
                        onClick={() => onEndPoll(poll.id)}
                        className="text-red-400 hover:text-red-300 font-semibold"
                      >
                        End Poll
                      </button>
                    )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
