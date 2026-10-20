import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Video,
  Calendar,
  Key,
  ShieldCheck,
  Plus,
  Clock,
  ArrowRight,
  Download,
  Copy,
  Check,
  Lock,
} from 'lucide-react';
import { Navbar } from '../components/layout/Navbar';
import { useAuthStore } from '../store/useAuthStore';

export const DashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const [meetings, setMeetings] = useState<any[]>([]);
  const [joinCode, setJoinCode] = useState('');
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [twoFactorData, setTwoFactorData] = useState<{ secret: string; qrCodeDataUrl: string } | null>(null);
  const [totpVerifyCode, setTotpVerifyCode] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Schedule Meeting Form
  const [scheduleTitle, setScheduleTitle] = useState('Sangam Strategy Meeting');
  const [scheduleDate, setScheduleDate] = useState('');
  const [schedulePasscode, setSchedulePasscode] = useState('');
  const [waitingRoom, setWaitingRoom] = useState(false);

  useEffect(() => {
    fetchMeetings();
  }, []);

  const fetchMeetings = async () => {
    try {
      const res = await fetch('/api/rooms/my-meetings', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('sangam_token')}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setMeetings(data.meetings || []);
      }
    } catch {}
  };

  const handleStartInstant = async () => {
    try {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('sangam_token')}`,
        },
        body: JSON.stringify({
          title: `${user?.name || 'Instant'} Meeting`,
        }),
      });

      const room = await res.json();
      navigate(`/room/${room.roomCode}/prejoin`);
    } catch (err: any) {
      alert(`Failed to create meeting: ${err.message}`);
    }
  };

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('sangam_token')}`,
        },
        body: JSON.stringify({
          title: scheduleTitle,
          passcode: schedulePasscode || undefined,
          waitingRoomEnabled: waitingRoom,
          scheduledStart: scheduleDate ? new Date(scheduleDate).toISOString() : undefined,
        }),
      });

      const room = await res.json();
      setShowScheduleModal(false);
      fetchMeetings();
    } catch (err: any) {
      alert(`Scheduling failed: ${err.message}`);
    }
  };

  const handleStart2FASetup = async () => {
    try {
      const res = await fetch('/api/auth/2fa/setup', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('sangam_token')}`,
        },
      });
      const data = await res.json();
      setTwoFactorData(data);
      setShow2FAModal(true);
    } catch (err: any) {
      alert(`2FA setup failed: ${err.message}`);
    }
  };

  const handleVerify2FA = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/auth/2fa/enable', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('sangam_token')}`,
        },
        body: JSON.stringify({ code: totpVerifyCode }),
      });

      if (!res.ok) throw new Error('Invalid code');

      alert('2FA enabled successfully!');
      setShow2FAModal(false);
      if (user) user.twoFactorEnabled = true;
    } catch (err: any) {
      alert(`Verification failed: ${err.message}`);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-8">
        {/* Welcome Banner & Quick Actions */}
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-6 shadow-2xl">
          <div>
            <div className="flex items-center space-x-2 text-brand-400 text-xs font-bold uppercase tracking-wider mb-1">
              <ShieldCheck className="w-4 h-4" />
              <span>Secure Dashboard</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100">
              Welcome back, {user?.name}
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1">
              Host instant encrypted meetings or schedule collaboration sessions with your team.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleStartInstant}
              className="py-3 px-5 rounded-2xl bg-gradient-to-r from-brand-600 to-cyan-600 hover:from-brand-500 hover:to-cyan-500 text-white font-bold text-sm shadow-lg shadow-brand-500/25 flex items-center gap-2 transition-all"
            >
              <Video className="w-4 h-4" />
              <span>Instant Meeting</span>
            </button>

            <button
              onClick={() => setShowScheduleModal(true)}
              className="py-3 px-5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm border border-slate-700 flex items-center gap-2 transition-colors"
            >
              <Calendar className="w-4 h-4" />
              <span>Schedule Meeting</span>
            </button>

            {!user?.twoFactorEnabled && (
              <button
                onClick={handleStart2FASetup}
                className="py-3 px-4 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <Key className="w-4 h-4" />
                <span>Enable 2FA</span>
              </button>
            )}
          </div>
        </div>

        {/* Join by Code bar */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-400">
            Have a meeting invite code or link? Join directly:
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (joinCode.trim()) navigate(`/room/${joinCode.trim()}/prejoin`);
            }}
            className="flex items-center gap-2 w-full sm:w-80"
          >
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              placeholder="e.g. san-gam-demo"
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none focus:border-brand-500"
            />
            <button
              type="submit"
              disabled={!joinCode.trim()}
              className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-40 text-white text-xs font-bold transition-colors"
            >
              Join
            </button>
          </form>
        </div>

        {/* Hosted Meetings / History List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Clock className="w-4 h-4 text-brand-400" />
              <span>Your Meetings & History</span>
            </h2>
          </div>

          {meetings.length === 0 ? (
            <div className="p-12 text-center rounded-3xl bg-slate-900/40 border border-slate-800/80 text-slate-500 text-xs">
              <Calendar className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p>No meetings found yet.</p>
              <p className="mt-1">Click "Instant Meeting" or "Schedule Meeting" to create one.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {meetings.map((m) => (
                <div
                  key={m.id}
                  className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-bold text-sm text-slate-100 truncate">{m.title}</h3>
                      {m.passcode && (
                        <span className="p-1 rounded bg-slate-800 text-amber-400 text-[10px] shrink-0" title="Passcode Protected">
                          <Lock className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-mono text-brand-400 flex items-center gap-1.5 mb-3">
                      <span>{m.roomCode}</span>
                      <button
                        onClick={() => copyCode(m.roomCode)}
                        className="text-slate-400 hover:text-white"
                        title="Copy code"
                      >
                        {copiedCode === m.roomCode ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                    <span className="text-[11px] text-slate-500 block">
                      Created: {new Date(m.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                    <a
                      href={`/api/rooms/${m.id}/calendar.ics`}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
                      title="Download .ics Calendar Invite"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                    <button
                      onClick={() => navigate(`/room/${m.roomCode}/prejoin`)}
                      className="flex-1 py-2 px-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <span>Join Room</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Schedule Meeting Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-100 mb-4">Schedule a Meeting</h3>
            <form onSubmit={handleScheduleSubmit} className="space-y-4">
              <div>
                <label className="text-xs text-slate-300 block mb-1">Meeting Title</label>
                <input
                  type="text"
                  value={scheduleTitle}
                  onChange={(e) => setScheduleTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none focus:border-brand-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">Date & Time</label>
                <input
                  type="datetime-local"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">
                  Passcode (Optional)
                </label>
                <input
                  type="text"
                  value={schedulePasscode}
                  onChange={(e) => setSchedulePasscode(e.target.value)}
                  placeholder="e.g. 123456"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 outline-none focus:border-brand-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="sched-wait"
                  checked={waitingRoom}
                  onChange={(e) => setWaitingRoom(e.target.checked)}
                  className="rounded border-slate-700 text-brand-600 focus:ring-0"
                />
                <label htmlFor="sched-wait" className="text-xs text-slate-300">
                  Enable Waiting Room (Host must admit participants)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="py-2 px-4 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2 px-5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition-colors"
                >
                  Create Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2FA Setup Modal */}
      {show2FAModal && twoFactorData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-center">
            <h3 className="text-base font-bold text-slate-100 mb-2">Enable Two-Factor Auth</h3>
            <p className="text-xs text-slate-400 mb-4">
              Scan this QR code using Google Authenticator or Authy:
            </p>

            <div className="p-3 bg-white rounded-2xl w-fit mx-auto mb-4">
              <img src={twoFactorData.qrCodeDataUrl} alt="2FA QR Code" className="w-40 h-40" />
            </div>

            <form onSubmit={handleVerify2FA} className="space-y-3">
              <input
                type="text"
                maxLength={6}
                value={totpVerifyCode}
                onChange={(e) => setTotpVerifyCode(e.target.value)}
                placeholder="000000"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl text-center py-2 text-lg font-mono tracking-widest text-brand-400 outline-none focus:border-brand-500"
                required
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShow2FAModal(false)}
                  className="flex-1 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold transition-colors"
                >
                  Verify & Activate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
