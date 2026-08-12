'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import type { Title, ProgressEntry } from '@aurora/shared';
import { mediaUrl } from '@/lib/config';

export function TitleCard({ title, progress, live = false }:
  { title: Title; progress?: ProgressEntry; live?: boolean }) {
  const pct = progress && progress.durationS > 0
    ? Math.min(100, (progress.positionS / progress.durationS) * 100) : 0;
  const href = live ? '/watch/live' : `/title/${title.id}`;
  return (
    <motion.div whileHover={{ scale: 1.12, zIndex: 20 }} transition={{ duration: 0.18 }}
      className="relative w-40 shrink-0 snap-start">
      <Link href={href} className="group block overflow-hidden rounded-(--radius) bg-surface">
        <div className="aspect-[2/3] w-full">
          {title.poster ? (
            <img src={mediaUrl(title.poster)} alt={title.name}
              className="size-full object-cover" loading="lazy" />
          ) : (
            <div className="grid size-full place-items-center bg-gradient-to-br from-(--accent) to-(--accent2) p-2 text-center font-display font-bold">
              {title.name}
            </div>
          )}
        </div>
        {live && (
          <span className="absolute left-2 top-2 rounded bg-red-600 px-2 py-0.5 text-xs font-bold">
            ● AO VIVO
          </span>
        )}
        <div className="absolute inset-x-0 bottom-0 translate-y-full bg-black/80 p-2 text-xs
          transition group-hover:translate-y-0">
          <p className="font-semibold">{title.name}</p>
          <p className="text-muted">{title.year || ''} {title.rating ? `· ★ ${title.rating}` : ''}</p>
        </div>
        {pct > 0 && (
          <div className="absolute inset-x-0 bottom-0 h-1 bg-white/20">
            <div className="h-full bg-gradient-to-r from-(--accent) to-(--accent2)"
              style={{ width: `${pct}%` }} />
          </div>
        )}
      </Link>
    </motion.div>
  );
}
