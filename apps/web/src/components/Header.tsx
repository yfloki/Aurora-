'use client';
import Link from 'next/link';
import { useProfile } from '@/lib/profile';
import { AvatarBadge } from './AvatarBadge';
import { SearchBox } from './SearchBox';

export function Header() {
  const { profile } = useProfile();
  return (
    <header className="glass fixed inset-x-0 top-0 z-40 flex items-center gap-6 px-8 py-3">
      <Link href="/" className="font-display text-2xl font-extrabold">
        AURORA<span className="text-gradient">+</span>
      </Link>
      <div className="ml-auto flex items-center gap-4">
        <SearchBox />
        <Link href="/admin" className="text-sm text-muted hover:text-fg">Estúdio</Link>
        {profile && (
          <Link href="/profiles" title="Trocar perfil">
            <AvatarBadge avatar={profile.avatar} name={profile.name} size={36} />
          </Link>
        )}
      </div>
    </header>
  );
}
