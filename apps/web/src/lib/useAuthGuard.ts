'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getMe, type User } from './api';

/** Redireciona para /login se não houver sessão. Retorna o usuário quando logado. */
export function useAuthGuard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    getMe()
      .then(setUser)
      .catch(() => router.replace('/login'))
      .finally(() => setChecking(false));
  }, [router]);

  return { user, checking };
}
