'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';

export interface QualityLevel {
  index: number;
  height: number;
  bitrate: number;
}

export interface AudioTrackInfo {
  id: number;
  lang: string;
  label: string;
}

const AUDIO_LANG_LABELS: Record<string, string> = {
  por: 'Português (dublado)', pt: 'Português (dublado)',
  eng: 'Inglês (original)', en: 'Inglês (original)',
  und: 'Áudio original',
};

function audioLabel(name: string | undefined, lang: string | undefined, idx: number): string {
  if (lang && AUDIO_LANG_LABELS[lang]) return AUDIO_LANG_LABELS[lang];
  if (name) return name.replace(/[-_]/g, ' ');
  return `Faixa ${idx + 1}`;
}

export function usePlayer(src: string | null, startPositionS = 0) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const fatalErrorCount = useRef(0);

  const [levels, setLevels] = useState<QualityLevel[]>([]);
  const [currentLevel, setCurrentLevel] = useState(-1); // -1 = auto
  const [autoLevel, setAutoLevel] = useState(-1); // nível que o ABR escolheu quando em auto
  const [playing, setPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolumeState] = useState(1);
  const [muted, setMuted] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryTick, setRetryTick] = useState(0);
  const [audioTracks, setAudioTracks] = useState<AudioTrackInfo[]>([]);
  const [currentAudio, setCurrentAudio] = useState(-1);

  useEffect(() => {
    const video = videoRef.current;
    if (!src || !video) return;
    setReady(false);
    setError(null);
    setLevels([]);
    setCurrentLevel(-1);
    setAutoLevel(-1);
    fatalErrorCount.current = 0;

    if (Hls.isSupported()) {
      const hls = new Hls({ capLevelToPlayerSize: false });
      hlsRef.current = hls;
      hls.loadSource(src);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setLevels(
          hls.levels
            .map((l, i) => ({ index: i, height: l.height, bitrate: l.bitrate }))
            .sort((a, b) => b.height - a.height),
        );
        setReady(true);
        if (startPositionS > 0) video.currentTime = startPositionS;
      });
      hls.on(Hls.Events.LEVEL_SWITCHED, (_e, data) => setAutoLevel(data.level));
      hls.on(Hls.Events.AUDIO_TRACKS_UPDATED, () => {
        setAudioTracks(hls.audioTracks.map((t, i) => ({
          id: i, lang: t.lang ?? '', label: audioLabel(t.name, t.lang, i),
        })));
        setCurrentAudio(hls.audioTrack);
      });
      hls.on(Hls.Events.AUDIO_TRACK_SWITCHED, (_e, data) => setCurrentAudio(data.id));
      hls.on(Hls.Events.ERROR, (_e, data) => {
        if (!data.fatal) return;
        fatalErrorCount.current += 1;
        if (fatalErrorCount.current >= 2) {
          setError('Não foi possível reproduzir este título.');
          hls.destroy();
          return;
        }
        switch (data.type) {
          case Hls.ErrorTypes.NETWORK_ERROR:
            hls.startLoad();
            break;
          case Hls.ErrorTypes.MEDIA_ERROR:
            hls.recoverMediaError();
            break;
          default:
            setError('Não foi possível reproduzir este título.');
            hls.destroy();
        }
      });

      return () => {
        hls.destroy();
        hlsRef.current = null;
      };
    }

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = src;
      const onLoaded = () => {
        setReady(true);
        if (startPositionS > 0) video.currentTime = startPositionS;
      };
      video.addEventListener('loadedmetadata', onLoaded);
      return () => video.removeEventListener('loadedmetadata', onLoaded);
    }

    setError('Seu navegador não suporta reprodução HLS.');
    return undefined;
  }, [src, startPositionS, retryTick]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onTime = () => setPosition(video.currentTime);
    const onDur = () => setDuration(video.duration || 0);
    const onProgress = () => {
      if (video.buffered.length) setBuffered(video.buffered.end(video.buffered.length - 1));
    };
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onVolume = () => { setVolumeState(video.volume); setMuted(video.muted); };
    video.addEventListener('timeupdate', onTime);
    video.addEventListener('durationchange', onDur);
    video.addEventListener('progress', onProgress);
    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('volumechange', onVolume);
    return () => {
      video.removeEventListener('timeupdate', onTime);
      video.removeEventListener('durationchange', onDur);
      video.removeEventListener('progress', onProgress);
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('volumechange', onVolume);
    };
  }, []);

  const play = useCallback(() => { videoRef.current?.play().catch(() => {}); }, []);
  const pause = useCallback(() => { videoRef.current?.pause(); }, []);
  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) v.play().catch(() => {});
    else v.pause();
  }, []);
  const seek = useCallback((t: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.max(0, Math.min(t, v.duration || t));
  }, []);
  const seekBy = useCallback((delta: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.max(0, Math.min(v.currentTime + delta, v.duration || Infinity));
  }, []);
  const setVolume = useCallback((v: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.volume = Math.max(0, Math.min(1, v));
    if (video.volume > 0 && video.muted) video.muted = false;
  }, []);
  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
  }, []);
  const setLevel = useCallback((idx: number) => {
    const hls = hlsRef.current;
    if (!hls) return;
    hls.currentLevel = idx; // -1 = auto
    setCurrentLevel(idx);
  }, []);
  const retry = useCallback(() => {
    setError(null);
    fatalErrorCount.current = 0;
    setRetryTick((t) => t + 1);
  }, []);
  const setAudioTrack = useCallback((id: number) => {
    const hls = hlsRef.current;
    if (!hls) return;
    hls.audioTrack = id;
    setCurrentAudio(id);
  }, []);

  return {
    videoRef, hlsRef, levels, currentLevel, autoLevel, setLevel,
    audioTracks, currentAudio, setAudioTrack,
    playing, position, duration, buffered, volume, muted,
    play, pause, togglePlay, seek, seekBy, setVolume, toggleMute,
    ready, error, retry,
  };
}
