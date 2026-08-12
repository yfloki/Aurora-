'use client';
import { useMemo, useRef, useState } from 'react';
import type { Title } from '@aurora/shared';
import { findThumbCue, type ThumbCue } from './ThumbStrip';
import type { QualityLevel, AudioTrackInfo } from './usePlayer';

function fmt(s: number): string {
  if (!isFinite(s) || s < 0) s = 0;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  const mm = h > 0 ? String(m).padStart(2, '0') : String(m);
  const ss = String(sec).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

interface ControlsProps {
  visible: boolean;
  title: Title;
  isLive: boolean;
  playing: boolean;
  position: number;
  duration: number;
  buffered: number;
  volume: number;
  muted: boolean;
  levels: QualityLevel[];
  currentLevel: number;
  autoLevel: number;
  audioTracks: AudioTrackInfo[];
  currentAudio: number;
  onSetAudio: (id: number) => void;
  thumbCues: ThumbCue[];
  thumbsBaseUrl: string;
  activeSubtitle: string | null;
  fullscreen: boolean;
  onTogglePlay: () => void;
  onSeek: (t: number) => void;
  onSeekBy: (d: number) => void;
  onSetVolume: (v: number) => void;
  onToggleMute: () => void;
  onSetLevel: (idx: number) => void;
  onSetSubtitle: (lang: string | null) => void;
  onToggleFullscreen: () => void;
  onBack: () => void;
}

export function Controls(props: ControlsProps) {
  const {
    visible, title, isLive, playing, position, duration, buffered, volume, muted,
    levels, currentLevel, autoLevel, audioTracks, currentAudio, onSetAudio,
    thumbCues, thumbsBaseUrl, activeSubtitle, fullscreen,
    onTogglePlay, onSeek, onSeekBy, onSetVolume, onToggleMute, onSetLevel, onSetSubtitle,
    onToggleFullscreen, onBack,
  } = props;

  const barRef = useRef<HTMLDivElement>(null);
  const [hoverPct, setHoverPct] = useState<number | null>(null);
  const [qualityOpen, setQualityOpen] = useState(false);
  const [subsOpen, setSubsOpen] = useState(false);
  const [audioOpen, setAudioOpen] = useState(false);

  const pct = duration > 0 ? (position / duration) * 100 : 0;
  const bufferedPct = duration > 0 ? (buffered / duration) * 100 : 0;

  const hoverCue = useMemo(() => {
    if (hoverPct === null || !thumbCues.length || !duration) return null;
    return findThumbCue(thumbCues, (hoverPct / 100) * duration) ?? null;
  }, [hoverPct, thumbCues, duration]);

  const pctFromEvent = (e: React.MouseEvent): number => {
    const bar = barRef.current;
    if (!bar) return 0;
    const rect = bar.getBoundingClientRect();
    return Math.min(100, Math.max(0, ((e.clientX - rect.left) / rect.width) * 100));
  };

  const activeIdx = currentLevel === -1 ? autoLevel : currentLevel;
  const activeLevel = levels.find((l) => l.index === activeIdx);
  const qualityLabel = currentLevel === -1
    ? `Auto${activeLevel ? ` (${activeLevel.height}p)` : ''}`
    : activeLevel ? `${activeLevel.height}p` : 'Auto';

  return (
    <div className={`pointer-events-none absolute inset-0 flex flex-col justify-between
      bg-gradient-to-t from-black/85 via-transparent to-black/50 transition-opacity duration-300
      ${visible ? 'opacity-100' : 'opacity-0'}`}>
      <div className="pointer-events-auto flex items-center gap-4 p-6">
        <button onClick={onBack} aria-label="Voltar" className="text-2xl leading-none">←</button>
        <div>
          <p className="font-display text-lg font-bold">{title.name}</p>
          {isLive && (
            <span className="rounded bg-red-600 px-2 py-0.5 text-xs font-bold">● AO VIVO</span>
          )}
        </div>
      </div>

      <button onClick={onTogglePlay} aria-label={playing ? 'Pausar' : 'Reproduzir'}
        className="pointer-events-auto mx-auto grid size-16 place-items-center rounded-full bg-black/40 text-3xl">
        {playing ? '❚❚' : '▶'}
      </button>

      <div className="pointer-events-auto flex flex-col gap-2 p-6">
        {!isLive && (
          <div className="relative">
            {hoverCue && (
              <div
                className="glass pointer-events-none absolute bottom-8 -translate-x-1/2 overflow-hidden rounded-lg border border-(--accent)"
                style={{ left: `${hoverPct}%`, width: hoverCue.w, height: hoverCue.h }}
              >
                <div
                  style={{
                    backgroundImage: `url(${thumbsBaseUrl}${hoverCue.sprite})`,
                    backgroundPosition: `-${hoverCue.x}px -${hoverCue.y}px`,
                    width: hoverCue.w,
                    height: hoverCue.h,
                  }}
                />
              </div>
            )}
            <div
              ref={barRef}
              onMouseMove={(e) => setHoverPct(pctFromEvent(e))}
              onMouseLeave={() => setHoverPct(null)}
              onClick={(e) => onSeek((pctFromEvent(e) / 100) * duration)}
              className="group relative h-1.5 w-full cursor-pointer rounded-full bg-white/20 transition-all hover:h-2.5"
            >
              <div className="absolute inset-y-0 left-0 rounded-full bg-white/30" style={{ width: `${bufferedPct}%` }} />
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-(--accent) to-(--accent2)"
                style={{ width: `${pct}%` }}
              />
              <div
                className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-fg opacity-0 group-hover:opacity-100"
                style={{ left: `${pct}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex items-center gap-4">
          <button onClick={onTogglePlay} aria-label={playing ? 'Pausar' : 'Reproduzir'} className="text-xl leading-none">
            {playing ? '❚❚' : '▶'}
          </button>
          {!isLive && (
            <>
              <button onClick={() => onSeekBy(-10)} aria-label="Voltar 10 segundos" className="text-lg leading-none">⏪</button>
              <button onClick={() => onSeekBy(10)} aria-label="Avançar 10 segundos" className="text-lg leading-none">⏩</button>
            </>
          )}

          <div className="group/vol flex items-center gap-2">
            <button onClick={onToggleMute} aria-label={muted ? 'Ativar som' : 'Mudo'} className="text-lg leading-none">
              {muted || volume === 0 ? '🔇' : '🔊'}
            </button>
            <input
              type="range" min={0} max={1} step={0.05} value={muted ? 0 : volume}
              onChange={(e) => onSetVolume(Number(e.target.value))}
              aria-label="Volume"
              className="w-0 accent-(--accent) opacity-0 transition-all group-hover/vol:w-20 group-hover/vol:opacity-100"
            />
          </div>

          {!isLive && (
            <span className="text-sm text-muted">{fmt(position)} / {fmt(duration)}</span>
          )}

          <div className="ml-auto flex items-center gap-4">
            {audioTracks.length > 1 && (
              <div className="relative">
                <button
                  onClick={() => { setAudioOpen((v) => !v); setSubsOpen(false); setQualityOpen(false); }}
                  aria-label="Áudio" className="text-lg leading-none"
                >
                  🎧
                </button>
                {audioOpen && (
                  <div className="glass absolute bottom-8 right-0 min-w-44 rounded-lg p-2 text-sm">
                    <p className="px-3 py-1 text-xs text-muted">Áudio</p>
                    {audioTracks.map((t) => (
                      <button
                        key={t.id}
                        onClick={() => { onSetAudio(t.id); setAudioOpen(false); }}
                        className={`block w-full rounded px-3 py-1.5 text-left hover:bg-white/10 ${currentAudio === t.id ? 'text-(--accent2)' : ''}`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {title.subtitles.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => { setSubsOpen((v) => !v); setQualityOpen(false); setAudioOpen(false); }}
                  aria-label="Legendas" className="text-lg leading-none"
                >
                  💬
                </button>
                {subsOpen && (
                  <div className="glass absolute bottom-8 right-0 min-w-36 rounded-lg p-2 text-sm">
                    <button
                      onClick={() => { onSetSubtitle(null); setSubsOpen(false); }}
                      className={`block w-full rounded px-3 py-1.5 text-left hover:bg-white/10 ${!activeSubtitle ? 'text-(--accent2)' : ''}`}
                    >
                      Desligadas
                    </button>
                    {title.subtitles.map((s) => (
                      <button
                        key={s.lang}
                        onClick={() => { onSetSubtitle(s.lang); setSubsOpen(false); }}
                        className={`block w-full rounded px-3 py-1.5 text-left hover:bg-white/10 ${activeSubtitle === s.lang ? 'text-(--accent2)' : ''}`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {levels.length > 1 && (
              <div className="relative">
                <button
                  onClick={() => { setQualityOpen((v) => !v); setSubsOpen(false); }}
                  className="text-sm font-semibold"
                >
                  {qualityLabel}
                </button>
                {qualityOpen && (
                  <div className="glass absolute bottom-8 right-0 min-w-32 rounded-lg p-2 text-sm">
                    <button
                      onClick={() => { onSetLevel(-1); setQualityOpen(false); }}
                      className={`block w-full rounded px-3 py-1.5 text-left hover:bg-white/10 ${currentLevel === -1 ? 'text-(--accent2)' : ''}`}
                    >
                      Auto
                    </button>
                    {levels.map((l) => (
                      <button
                        key={l.index}
                        onClick={() => { onSetLevel(l.index); setQualityOpen(false); }}
                        className={`block w-full rounded px-3 py-1.5 text-left hover:bg-white/10 ${currentLevel === l.index ? 'text-(--accent2)' : ''}`}
                      >
                        {l.height}p
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <button onClick={onToggleFullscreen} aria-label="Tela cheia" className="text-lg leading-none">
              {fullscreen ? '⤢' : '⛶'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
