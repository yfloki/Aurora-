'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

const FEATURES = [
  { icon: '📺', title: 'Streaming adaptativo de verdade',
    text: 'HLS com 4 qualidades que se ajustam à sua internet em tempo real — de 1080p a 360p sem travar.' },
  { icon: '🎧', title: 'Dublado, legendado, do seu jeito',
    text: 'Áudio em português e inglês, legendas em três idiomas. Troque no meio do filme, sem pausar.' },
  { icon: '🔴', title: 'Transmissões ao vivo',
    text: 'Lives via OBS direto na plataforma — com retransmissão simultânea para o YouTube.' },
  { icon: '👤', title: 'Perfis para todo mundo',
    text: 'Cada pessoa com sua lista, seu progresso e seu "continuar assistindo".' },
];

const FAQ = [
  { q: 'O que é o AURORA+?',
    a: 'Uma plataforma de streaming completa: catálogo de filmes abertos em alta qualidade, player adaptativo, múltiplos idiomas, perfis e transmissões ao vivo.' },
  { q: 'Quanto custa?',
    a: 'Nada. O AURORA+ é um projeto acadêmico da disciplina de Sistemas de Multimídia — crie sua conta e assista à vontade.' },
  { q: 'Onde posso assistir?',
    a: 'Em qualquer navegador moderno, no computador ou no celular. É só entrar com a sua conta.' },
  { q: 'Como funciona a troca de qualidade?',
    a: 'O player mede sua banda em tempo real e escolhe a melhor qualidade automaticamente (ABR). Você também pode fixar a qualidade manualmente — e até ver as métricas ao vivo apertando D.' },
  { q: 'Posso transmitir ao vivo?',
    a: 'Sim! Aponte o OBS para o nosso ingest RTMP e sua transmissão aparece na home de todos os usuários — com opção de simulcast para o YouTube.' },
];

export function Landing() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [open, setOpen] = useState<number | null>(null);

  const start = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`/login?mode=register${email ? `&email=${encodeURIComponent(email)}` : ''}`);
  };

  return (
    <main className="min-h-screen">
      {/* hero */}
      <section className="relative flex min-h-[85vh] flex-col overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-(--accent)/30 via-(--bg) to-(--accent2)/20" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,transparent_0%,var(--bg)_75%)]" />

        <header className="relative z-10 flex items-center justify-between px-8 py-5 md:px-16">
          <span className="font-display text-3xl font-extrabold">
            AURORA<span className="text-gradient">+</span>
          </span>
          <Link href="/login"
            className="rounded-lg bg-gradient-to-r from-(--accent) to-(--accent2) px-5 py-2 font-semibold">
            Entrar
          </Link>
        </header>

        <div className="relative z-10 mx-auto flex max-w-3xl flex-1 flex-col items-center justify-center px-6 text-center">
          <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
            className="font-display text-4xl font-extrabold leading-tight md:text-6xl">
            Filmes, ao vivo e muito mais
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }} className="mt-4 text-xl text-fg/85">
            Assista onde quiser. Dublado ou legendado. De graça.
          </motion.p>
          <motion.p initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }} className="mt-6 text-muted">
            Pronto para assistir? Informe seu e-mail para criar sua conta.
          </motion.p>
          <motion.form initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }} onSubmit={start}
            className="mt-4 flex w-full max-w-xl flex-col gap-3 sm:flex-row">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="E-mail"
              className="glass flex-1 rounded-lg px-5 py-4 text-lg outline-none focus:ring-2 focus:ring-(--accent)" />
            <button type="submit"
              className="glow rounded-lg bg-gradient-to-r from-(--accent) to-(--accent2) px-8 py-4 text-xl font-bold">
              Vamos lá ›
            </button>
          </motion.form>
        </div>

        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-(--bg) to-transparent" />
      </section>

      {/* features */}
      <section className="mx-auto grid max-w-6xl gap-6 px-8 py-16 md:grid-cols-2">
        {FEATURES.map((f, i) => (
          <motion.div key={f.title}
            initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ delay: i * 0.05 }}
            className="glass rounded-2xl p-8">
            <div className="mb-3 text-4xl">{f.icon}</div>
            <h2 className="font-display mb-2 text-2xl font-bold">{f.title}</h2>
            <p className="text-muted">{f.text}</p>
          </motion.div>
        ))}
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-8 pb-16">
        <h2 className="font-display mb-8 text-center text-3xl font-extrabold">
          Perguntas frequentes
        </h2>
        <div className="flex flex-col gap-2">
          {FAQ.map((item, i) => (
            <div key={item.q} className="overflow-hidden rounded-xl bg-surface2">
              <button onClick={() => setOpen(open === i ? null : i)}
                className="flex w-full items-center justify-between px-6 py-5 text-left text-lg font-semibold hover:bg-white/5">
                {item.q}
                <span className={`text-2xl transition-transform ${open === i ? 'rotate-45' : ''}`}>+</span>
              </button>
              {open === i && (
                <p className="border-t border-white/10 px-6 py-5 text-fg/85">{item.a}</p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* CTA final + rodapé */}
      <section className="px-8 pb-8 text-center">
        <p className="mb-4 text-muted">Pronto para assistir?</p>
        <Link href="/login?mode=register"
          className="glow inline-block rounded-lg bg-gradient-to-r from-(--accent) to-(--accent2) px-10 py-4 text-xl font-bold">
          Criar minha conta ›
        </Link>
        <p className="mt-12 pb-8 text-sm text-muted">
          AURORA+ · Projeto acadêmico de Sistemas de Multimídia · Conteúdo: filmes abertos da Blender Foundation (CC-BY)
        </p>
      </section>
    </main>
  );
}
