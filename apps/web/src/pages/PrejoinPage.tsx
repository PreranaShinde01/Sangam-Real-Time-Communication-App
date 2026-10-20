import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Settings,
  ShieldCheck,
  Lock,
  ArrowRight,
  User,
  Volume2,
} from 'lucide-react';
import { Navbar } from '../components/layout/Navbar';
import { useAuthStore } from '../store/useAuthStore';
import { useRoomStore } from '../store/useRoomStore';

export const PrejoinPage: React.FC = () => {
  const { roomCode } = useParams<{ roomCode: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { setAudioEnabled, setVideoEnabled } = useRoomStore();

  const [displayName, setDisplayName] = useState(user?.name || '');
  const [passcode, setPasscode] = useState('');
  const [roomInfo, setRoomInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // AV State
  const [audioOn, setAudioOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);
  const [devices, setDevices] = useState<{
    audioInputs: MediaDeviceInfo[];
    videoInputs: MediaDeviceInfo[];
  }>({ audioInputs: [], videoInputs: [] });
  const [selectedAudioId, setSelectedAudioId] = useState<string>('');
  const [selectedVideoId, setSelectedVideoId] = useState<string>('');
  const [audioLevel, setAudioLevel] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    fetchRoomInfo();
    return () => {
      stopLocalStream();
    };
  }, [roomCode]);

  // Load Room Details
  const fetchRoomInfo = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/rooms/${roomCode}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch room');
      setRoomInfo(data);
      initMediaPreview();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Initialize Media Devices & Stream
  const initMediaPreview = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // Enumerate available devices
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = allDevices.filter((d) => d.kind === 'audioinput');
      const videoInputs = allDevices.filter((d) => d.kind === 'videoinput');
      setDevices({ audioInputs, videoInputs });

      if (audioInputs[0]) setSelectedAudioId(audioInputs[0].deviceId);
      if (videoInputs[0]) setSelectedVideoId(videoInputs[0].deviceId);

      setupAudioLevelMeter(stream);
    } catch {
      // User might have denied permissions or no camera available
    }
  };

  const setupAudioLevelMeter = (stream: MediaStream) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtx();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateLevel = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) sum += dataArray[i];
        const avg = sum / bufferLength;
        setAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));
        animFrameRef.current = requestAnimationFrame(updateLevel);
      };

      updateLevel();
    } catch {}
  };

  const toggleMic = () => {
    if (streamRef.current) {
      const aTrack = streamRef.current.getAudioTracks()[0];
      if (aTrack) {
        aTrack.enabled = !audioOn;
        setAudioOn(aTrack.enabled);
        setAudioEnabled(aTrack.enabled);
      }
    } else {
      setAudioOn(!audioOn);
    }
  };

  const toggleCam = () => {
    if (streamRef.current) {
      const vTrack = streamRef.current.getVideoTracks()[0];
      if (vTrack) {
        vTrack.enabled = !videoOn;
        setVideoOn(vTrack.enabled);
        setVideoEnabled(vTrack.enabled);
      }
    } else {
      setVideoOn(!videoOn);
    }
  };

  const stopLocalStream = () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) return;

    // If guest name entered and no user, save guest session
    if (!user) {
      const guestRes = await fetch('/api/auth/guest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: displayName.trim() }),
      });
      const guestData = await guestRes.json();
      localStorage.setItem('sangam_token', guestData.accessToken);
    }

    // Stop preview stream before entering main meeting room
    stopLocalStream();

    // Navigate to room page with query params
    const query = new URLSearchParams();
    if (passcode) query.set('passcode', passcode);
    query.set('audio', audioOn ? '1' : '0');
    query.set('video', videoOn ? '1' : '0');
    query.set('name', displayName);

    navigate(`/room/${roomCode}?${query.toString()}`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col lg:flex-row gap-8">
          {/* Left Column: Green Room Video & Mic Preview */}
          <div className="flex-1 flex flex-col">
            <div className="flex items-center space-x-2 text-brand-400 text-xs font-bold uppercase tracking-wider mb-3">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Green Room Audio/Video Test</span>
            </div>

            {/* Video Preview Box */}
            <div className="relative aspect-video bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center shadow-inner">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover scale-x-[-1] ${
                  videoOn ? 'opacity-100' : 'opacity-0'
                }`}
              />

              {!videoOn && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950">
                  <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 text-2xl font-bold">
                    {displayName ? displayName.charAt(0).toUpperCase() : '?'}
                  </div>
                  <span className="text-xs text-slate-500 mt-2">Camera is turned off</span>
                </div>
              )}

              {/* In-preview Floating Buttons */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center space-x-3 bg-slate-950/80 backdrop-blur-md px-4 py-2 rounded-2xl border border-slate-800/80">
                <button
                  type="button"
                  onClick={toggleMic}
                  className={`p-3 rounded-xl transition-colors ${
                    audioOn ? 'bg-slate-800 text-white' : 'bg-red-500 text-white'
                  }`}
                >
                  {audioOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={toggleCam}
                  className={`p-3 rounded-xl transition-colors ${
                    videoOn ? 'bg-slate-800 text-white' : 'bg-red-500 text-white'
                  }`}
                >
                  {videoOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Audio Volume Bar */}
            <div className="mt-4 flex items-center space-x-3 text-xs text-slate-400">
              <Volume2 className="w-4 h-4 shrink-0 text-slate-400" />
              <div className="flex-1 bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
                <div
                  className="bg-emerald-500 h-full transition-all duration-75"
                  style={{ width: `${audioOn ? audioLevel : 0}%` }}
                />
              </div>
              <span className="font-mono text-[10px] w-8">{audioOn ? `${audioLevel}%` : 'MUTED'}</span>
            </div>
          </div>

          {/* Right Column: Room Details & Join Form */}
          <div className="w-full lg:w-80 flex flex-col justify-between space-y-6">
            <div>
              {roomInfo && (
                <div className="mb-6 pb-4 border-b border-slate-800">
                  <h2 className="text-xl font-bold text-slate-100">{roomInfo.title}</h2>
                  <div className="flex items-center space-x-2 text-xs text-slate-400 mt-1">
                    <span>Host: {roomInfo.hostName}</span>
                    <span>•</span>
                    <span className="font-mono text-brand-400">{roomInfo.roomCode}</span>
                  </div>
                  {roomInfo.waitingRoomEnabled && (
                    <div className="mt-2 text-[11px] text-amber-400 flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      <span>Waiting room enabled (Host will admit you)</span>
                    </div>
                  )}
                </div>
              )}

              {error && (
                <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                  {error}
                </div>
              )}

              <form onSubmit={handleJoin} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Your Display Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="e.g. Maya Patel"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3 py-2.5 text-xs text-slate-100 outline-none focus:border-brand-500"
                      required
                    />
                  </div>
                </div>

                {roomInfo?.hasPasscode && (
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Meeting Passcode
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                      <input
                        type="password"
                        value={passcode}
                        onChange={(e) => setPasscode(e.target.value)}
                        placeholder="Required to join"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3 py-2.5 text-xs text-slate-100 outline-none focus:border-brand-500"
                        required
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={!displayName.trim()}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-brand-600 to-cyan-600 hover:from-brand-500 hover:to-cyan-500 text-white font-bold text-sm shadow-xl shadow-brand-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  <span>Join Meeting Now</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>

            <div className="text-[11px] text-slate-500 text-center">
              Protected by WebRTC DTLS-SRTP end-to-end media encryption.
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
