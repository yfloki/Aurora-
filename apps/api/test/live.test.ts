import { describe, it, expect, vi } from 'vitest';
import { EventEmitter } from 'node:events';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createLiveManager } from '../src/live';

function fakeProc() {
  const p: any = new EventEmitter();
  p.kill = vi.fn();
  p.stderr = new EventEmitter();
  return p;
}

describe('live manager', () => {
  it('status começa inativo', () => {
    const m = createLiveManager({ hlsDir: mkdtempSync(path.join(tmpdir(), 'live-')) });
    expect(m.getStatus()).toEqual({ active: false, key: null, hlsPath: null, startedAt: null });
  });

  it('onPublish ativa e aponta o hlsPath; onDone desativa e mata o ffmpeg', () => {
    const proc = fakeProc();
    const spawnFfmpeg = vi.fn(() => proc);
    const m = createLiveManager({
      hlsDir: mkdtempSync(path.join(tmpdir(), 'live-')), spawnFfmpeg: spawnFfmpeg as any,
    });
    m.onPublish('aula01');
    const st = m.getStatus();
    expect(st.active).toBe(true);
    expect(st.key).toBe('aula01');
    expect(st.hlsPath).toBe('hls/live/aula01/index.m3u8');
    expect(spawnFfmpeg).toHaveBeenCalledOnce();
    m.onDone('aula01');
    expect(proc.kill).toHaveBeenCalled();
    expect(m.getStatus().active).toBe(false);
  });
});
