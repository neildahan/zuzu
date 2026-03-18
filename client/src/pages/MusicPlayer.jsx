import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Play, Pause, SkipForward, SkipBack, Music, Volume2, Flame } from 'lucide-react';

const PLAYLISTS = [
  {
    id: 'gym-hype',
    titleEn: 'Gym Hype',
    titleHe: 'מוטיבציה',
    icon: '🔥',
    color: 'from-red-500 to-orange-500',
    videoId: 'gYOEyzBFYa4',
  },
  {
    id: 'beast-mode',
    titleEn: 'Beast Mode',
    titleHe: 'מצב חיה',
    icon: '💪',
    color: 'from-purple-500 to-pink-500',
    videoId: 'n1WpP7iowLc',
  },
  {
    id: 'rap-workout',
    titleEn: 'Rap Workout',
    titleHe: 'ראפ לאימון',
    icon: '🎤',
    color: 'from-gray-800 to-gray-600',
    videoId: 'RBumgq5yVrA',
  },
  {
    id: 'edm-pump',
    titleEn: 'EDM Pump',
    titleHe: 'אלקטרוני',
    icon: '⚡',
    color: 'from-cyan-500 to-blue-500',
    videoId: 'HQnC1UHBvWA',
  },
  {
    id: 'rock-power',
    titleEn: 'Rock Power',
    titleHe: 'רוק כוח',
    icon: '🎸',
    color: 'from-red-700 to-red-500',
    videoId: 'pAgnJDJN4VA',
  },
  {
    id: 'cardio-hits',
    titleEn: 'Cardio Hits',
    titleHe: 'קרדיו להיטים',
    icon: '💓',
    color: 'from-pink-500 to-rose-400',
    videoId: 'lTRiuFIWV54',
  },
];

export default function MusicPlayer() {
  const { t, i18n } = useTranslation();
  const isHe = i18n.language === 'he';
  const [activePlaylist, setActivePlaylist] = useState(null);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
          <Music size={20} className="text-accent" />
        </div>
        <div>
          <h1 className="text-xl font-extrabold">{t('music.title')}</h1>
          <p className="text-xs text-gray-400 font-medium">{t('music.subtitle')}</p>
        </div>
      </div>

      {/* Now Playing */}
      {activePlaylist && (
        <div className="rounded-2xl overflow-hidden bg-gray-900">
          <div className="aspect-video">
            <iframe
              src={`https://www.youtube.com/embed/${activePlaylist.videoId}?autoplay=1&loop=1`}
              title={isHe ? activePlaylist.titleHe : activePlaylist.titleEn}
              allow="autoplay; encrypted-media"
              allowFullScreen
              className="w-full h-full"
            />
          </div>
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{activePlaylist.icon}</span>
              <div>
                <p className="text-white font-bold">
                  {isHe ? activePlaylist.titleHe : activePlaylist.titleEn}
                </p>
                <p className="text-gray-500 text-xs font-medium">{t('music.nowPlaying')}</p>
              </div>
            </div>
            <button
              onClick={() => setActivePlaylist(null)}
              className="text-gray-500 hover:text-white transition-colors"
            >
              <Pause size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Playlist Grid */}
      <div className="grid grid-cols-2 gap-3">
        {PLAYLISTS.map((pl) => {
          const isActive = activePlaylist?.id === pl.id;
          return (
            <button
              key={pl.id}
              onClick={() => setActivePlaylist(isActive ? null : pl)}
              className={`relative rounded-2xl p-4 text-white text-start overflow-hidden transition-all active:scale-[0.97] ${
                isActive ? 'ring-2 ring-accent ring-offset-2' : ''
              }`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${pl.color}`} />
              <div className="relative z-10">
                <span className="text-2xl">{pl.icon}</span>
                <p className="font-bold mt-2 text-sm">
                  {isHe ? pl.titleHe : pl.titleEn}
                </p>
                {isActive && (
                  <div className="flex items-center gap-1 mt-1">
                    <Volume2 size={12} className="animate-pulse" />
                    <span className="text-[10px] font-semibold opacity-80">{t('music.playing')}</span>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
