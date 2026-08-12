import type { Title, Profile, ProgressEntry, Job, LiveStatus } from '@aurora/shared';
import { API_URL } from './config';

export function qs(params: Record<string, string | undefined>): string {
  const entries = Object.entries(params).filter(([, v]) => v);
  if (!entries.length) return '';
  return '?' + entries.map(([k, v]) => `${k}=${encodeURIComponent(v!)}`).join('&');
}

async function j<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error(`API ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

export const getTitles = (p: { query?: string; genre?: string } = {}) =>
  fetch(`${API_URL}/api/titles${qs(p)}`).then((r) => j<Title[]>(r));
export const getTitle = (id: string) =>
  fetch(`${API_URL}/api/titles/${id}`).then((r) => j<Title>(r));
export const getProfiles = () =>
  fetch(`${API_URL}/api/profiles`).then((r) => j<Profile[]>(r));
export const createProfile = (name: string, avatar: string) =>
  fetch(`${API_URL}/api/profiles`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, avatar }),
  }).then((r) => j<Profile>(r));
export const getProgress = (profileId: string) =>
  fetch(`${API_URL}/api/profiles/${profileId}/progress`).then((r) => j<ProgressEntry[]>(r));
export const putProgress = (profileId: string, titleId: string, positionS: number, durationS: number) =>
  fetch(`${API_URL}/api/profiles/${profileId}/progress/${titleId}`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ positionS, durationS }),
  });
export const getMyList = (profileId: string) =>
  fetch(`${API_URL}/api/profiles/${profileId}/list`).then((r) => j<string[]>(r));
export const toggleMyList = (profileId: string, titleId: string, inList: boolean) =>
  fetch(`${API_URL}/api/profiles/${profileId}/list/${titleId}`, {
    method: inList ? 'DELETE' : 'PUT',
  });
export const getJobs = () => fetch(`${API_URL}/api/jobs`).then((r) => j<Job[]>(r));
export const getLiveStatus = () =>
  fetch(`${API_URL}/api/live/status`).then((r) => j<LiveStatus>(r));
export const uploadTitle = (form: FormData) =>
  fetch(`${API_URL}/api/upload`, { method: 'POST', body: form }).then((r) => j<{ title: Title }>(r));
