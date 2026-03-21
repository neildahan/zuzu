import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Pause, Play, SkipForward, Plus, Minus } from 'lucide-react';

export default function RestTimerOverlay({ seconds, onComplete, onDismiss }) {
  const { t } = useTranslation();
  const endTimeRef = useRef(Date.now() + seconds * 1000);
  const [remaining, setRemaining] = useState(seconds);
  const [paused, setPaused] = useState(false);
  const pausedRemainingRef = useRef(0);
  const intervalRef = useRef(null);
  const onCompleteRef = useRef(onComplete);
  const total = useRef(seconds);
  onCompleteRef.current = onComplete;

  const progress = remaining / total.current;

  const startTimer = () => {
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      const now = Date.now();
      const left = Math.ceil((endTimeRef.current - now) / 1000);
      if (left <= 0) {
        clearInterval(intervalRef.current);
        setRemaining(0);
        if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
        onCompleteRef.current();
      } else {
        setRemaining(left);
      }
    }, 250); // Check more frequently for accuracy
  };

  useEffect(() => {
    startTimer();
    return () => clearInterval(intervalRef.current);
  }, []);

  const togglePause = () => {
    if (paused) {
      // Resume: set new end time based on remaining
      endTimeRef.current = Date.now() + pausedRemainingRef.current * 1000;
      startTimer();
    } else {
      // Pause: save remaining and stop
      pausedRemainingRef.current = remaining;
      clearInterval(intervalRef.current);
    }
    setPaused(!paused);
  };

  const adjust = (delta) => {
    endTimeRef.current += delta * 1000;
    if (paused) pausedRemainingRef.current = Math.max(0, pausedRemainingRef.current + delta);
    setRemaining(prev => {
      const next = Math.max(0, prev + delta);
      total.current = Math.max(total.current, next);
      return next;
    });
  };

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;

  // SVG circle
  const size = 140;
  const stroke = 6;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashoffset = circumference * (1 - progress);

  return (
    <div className="fixed inset-0 z-[60]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30" onClick={onDismiss} />

      {/* Bottom sheet */}
      <div className="absolute bottom-0 inset-x-0 bg-gray-900 rounded-t-3xl px-6 pt-6 pb-8 animate-slide-up">
        <div className="flex flex-col items-center">
          {/* Drag handle */}
          <div className="w-10 h-1 rounded-full bg-gray-700 mb-5" />

          {/* Circular timer */}
          <div className="relative mb-4">
            <svg width={size} height={size} className="-rotate-90">
              <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#1F2937" strokeWidth={stroke} />
              <circle
                cx={size / 2} cy={size / 2} r={radius} fill="none"
                stroke={paused ? '#6B7280' : '#F97316'} strokeWidth={stroke} strokeLinecap="round"
                strokeDasharray={circumference} strokeDashoffset={dashoffset}
                className="transition-all duration-1000 ease-linear"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-black text-white tabular-nums">
                {mins}:{secs.toString().padStart(2, '0')}
              </span>
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mt-1">
                {paused ? t('client.paused') || 'Paused' : t('client.resting') || 'Rest'}
              </span>
            </div>
          </div>

          {/* Adjust buttons */}
          <div className="flex items-center gap-3 mb-5">
            <button
              onClick={() => adjust(-15)}
              className="flex items-center gap-1 px-3 py-2 rounded-xl bg-white/5 text-gray-400 text-xs font-bold active:scale-95 transition-transform"
            >
              <Minus size={14} /> 15s
            </button>
            <button
              onClick={togglePause}
              className={`w-14 h-14 rounded-full flex items-center justify-center active:scale-95 transition-transform ${
                paused ? 'bg-accent text-white' : 'bg-white/10 text-white'
              }`}
            >
              {paused ? <Play size={24} /> : <Pause size={24} />}
            </button>
            <button
              onClick={() => adjust(15)}
              className="flex items-center gap-1 px-3 py-2 rounded-xl bg-white/5 text-gray-400 text-xs font-bold active:scale-95 transition-transform"
            >
              <Plus size={14} /> 15s
            </button>
          </div>

          {/* Skip */}
          <button
            onClick={onDismiss}
            className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-white/[0.06] text-gray-400 font-bold text-sm active:scale-95 transition-transform"
          >
            <SkipForward size={16} />
            {t('client.skipRest') || 'Skip Rest'}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slide-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-slide-up { animation: slide-up 0.3s ease-out; }
      `}</style>
    </div>
  );
}
