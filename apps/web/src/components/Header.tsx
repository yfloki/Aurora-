'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useProfile } from '@/lib/profile';
import { logout } from '@/lib/api';
import { AvatarBadge } from './AvatarBadge';
import { SearchBox } from './SearchBox';

export function Header() {
  const router = useRouter();
  const { profile, clear } = useProfile();
  const sair = async () => {
    await logout().catch(() => {});
    clear();
    router.push('/login');
  };
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
        <button onClick={sair} className="text-sm text-muted hover:text-fg">Sair</button>
      </div>
    </header>
  );
}
