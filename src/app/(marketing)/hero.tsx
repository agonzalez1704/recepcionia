"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, Menu, X, Check, CheckCheck } from "lucide-react";

const HLS_SRC = "https://stream.mux.com/tLkHO1qZoaaQOUeVWo8hEBeGQfySP02EPS02BmnNFyXys.m3u8";

const NAV = [
  { label: "Cómo funciona", href: "#como-funciona" },
  { label: "Precios", href: "#precios" },
  { label: "FAQ", href: "#faq" },
];

// Conversación real (condensada) de la base de datos — triage + reagendado + confirmación.
type Burbuja = { de: "paciente" | "asistente"; texto: string; hora: string };
const CHAT: Burbuja[] = [
  { de: "paciente", texto: "Buenas tardes, me gustaría sacar una cita con el dr memo para mañana", hora: "18:47" },
  {
    de: "asistente",
    texto:
      "Revisé de nuevo y el Dr. Guillermo Carmona sí tiene lugar mañana jueves 28. Te puedo ofrecer 9:00, 11:30 o 15:00. ¿Cuál preferís? 😊",
    hora: "18:51",
  },
  { de: "paciente", texto: "11:30 perfecto", hora: "18:52" },
  {
    de: "asistente",
    texto: "¡Listo! Te agendé con el Dr. Carmona mañana 28 a las 11:30 hs. Te esperamos 🙌",
    hora: "18:52",
  },
];

function VideoFondo() {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = HLS_SRC;
      void video.play().catch(() => {});
      return;
    }
    let hls: import("hls.js").default | null = null;
    let cancelado = false;
    (async () => {
      const Hls = (await import("hls.js")).default;
      if (cancelado) return;
      if (Hls.isSupported()) {
        hls = new Hls({ enableWorker: false });
        hls.loadSource(HLS_SRC);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => void video.play().catch(() => {}));
      }
    })();
    return () => {
      cancelado = true;
      hls?.destroy();
    };
  }, []);

  return (
    <video
      ref={ref}
      muted
      loop
      playsInline
      autoPlay
      preload="auto"
      className="absolute inset-0 h-full w-full object-cover opacity-60"
    />
  );
}

function ChatWhatsApp() {
  return (
    <div className="liquid-glass relative w-full max-w-sm overflow-hidden rounded-3xl">
      {/* Barra superior estilo WhatsApp */}
      <div className="flex items-center gap-3 border-b border-white/10 bg-white/[0.03] px-4 py-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-nest-azul/20 text-sm font-bold text-nest-azul">
          C
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">Clínica Carmona</p>
          <p className="text-[11px] text-nest-azul">en línea</p>
        </div>
      </div>

      {/* Mensajes */}
      <div className="space-y-2 px-3 py-4">
        {CHAT.map((b, i) => {
          const esPaciente = b.de === "paciente";
          return (
            <div key={i} className={`flex ${esPaciente ? "justify-start" : "justify-end"}`}>
              <div
                className={`max-w-[82%] rounded-2xl px-3 py-2 text-[13px] leading-snug ${
                  esPaciente ? "bg-white/10 text-white/90" : "bg-nest-azul/20 text-white"
                }`}
              >
                <p className="whitespace-pre-wrap">{b.texto}</p>
                <span className="mt-1 flex items-center justify-end gap-1 text-[10px] text-white/40">
                  {b.hora}
                  {!esPaciente && <CheckCheck className="h-3 w-3 text-nest-azul" />}
                  {esPaciente && <Check className="h-3 w-3" />}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function Hero() {
  const [menuAbierto, setMenuAbierto] = useState(false);

  return (
    <header className="relative isolate min-h-[100svh] overflow-hidden bg-nest-fondo text-white">
      <VideoFondo />

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-nest-fondo via-nest-fondo/40 to-transparent" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-nest-fondo via-nest-fondo/20 to-transparent" />

      {/* Glow SVG */}
      <svg
        className="pointer-events-none absolute left-1/2 top-[-10%] h-[480px] w-[900px] -translate-x-1/2"
        viewBox="0 0 900 480"
        aria-hidden
      >
        <defs>
          <filter id="glowBlur" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="25" />
          </filter>
          <radialGradient id="glowGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.45" />
            <stop offset="55%" stopColor="#1e3a8a" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#070b0a" stopOpacity="0" />
          </radialGradient>
        </defs>
        <ellipse cx="450" cy="240" rx="400" ry="150" fill="url(#glowGrad)" filter="url(#glowBlur)" />
      </svg>

      {/* Grid lines */}
      <div className="pointer-events-none absolute inset-0 hidden md:block">
        <div className="absolute inset-y-0 left-1/4 w-px bg-white/10" />
        <div className="absolute inset-y-0 left-1/2 w-px bg-white/10" />
        <div className="absolute inset-y-0 left-3/4 w-px bg-white/10" />
      </div>

      {/* Nav */}
      <nav className="relative z-20 mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <Link href="/" className="font-inter text-lg font-bold tracking-tight text-white">
          Recepción<span className="text-nest-azul">.</span>IA
        </Link>
        <div className="hidden items-center gap-8 md:flex">
          {NAV.map((l) => (
            <a key={l.href} href={l.href} className="font-inter text-base text-white/80 transition hover:text-nest-azul">
              {l.label}
            </a>
          ))}
          <Link href="/sign-in" className="font-inter text-base text-white/80 transition hover:text-nest-azul">
            Iniciar sesión
          </Link>
        </div>
        <button onClick={() => setMenuAbierto(true)} className="text-white md:hidden" aria-label="Abrir menú">
          <Menu className="h-6 w-6" />
        </button>
      </nav>

      {/* Menú mobile */}
      {menuAbierto && (
        <div className="fixed inset-0 z-50 flex flex-col bg-nest-fondo/98 backdrop-blur-md md:hidden">
          <div className="flex items-center justify-between px-6 py-6">
            <span className="font-inter text-lg font-bold">
              Recepción<span className="text-nest-azul">.</span>IA
            </span>
            <button onClick={() => setMenuAbierto(false)} aria-label="Cerrar menú">
              <X className="h-6 w-6 text-white" />
            </button>
          </div>
          <div className="flex flex-1 flex-col items-center justify-center gap-8">
            {NAV.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setMenuAbierto(false)}
                className="font-inter text-2xl text-white/90 hover:text-nest-azul"
              >
                {l.label}
              </a>
            ))}
            <Link href="/sign-in" onClick={() => setMenuAbierto(false)} className="font-inter text-2xl text-white/90 hover:text-nest-azul">
              Iniciar sesión
            </Link>
            <Link
              href="/sign-up"
              onClick={() => setMenuAbierto(false)}
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-nest-azul px-6 py-3 font-inter font-bold uppercase text-nest-fondo"
            >
              Probar gratis <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}

      {/* Contenido: dos columnas en desktop */}
      <div className="relative z-10 mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-6 pb-24 pt-8 lg:grid-cols-2 lg:gap-8 lg:pt-12">
        {/* Columna izquierda */}
        <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
          {/* Liquid glass card */}
          <div className="liquid-glass relative mb-2 flex h-[200px] w-[200px] -translate-y-[50px] flex-col items-center justify-center rounded-2xl p-5 text-center lg:mx-0">
            <span className="font-inter text-[14px] tracking-widest text-white/70">[ 2026 ]</span>
            <p className="mt-2 font-inter text-[18px] leading-tight text-white">
              Atendido por <span className="font-serif italic">IA</span> entrenada en tu clínica
            </p>
            <span className="mt-2 font-inter text-[11px] text-white/50">Responde como vos, 24/7</span>
          </div>

          <p className="-mt-6 font-sans text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: "#38bdf8" }}>
            Atención médica sin interrupciones
          </p>

          <h1 className="mt-4 max-w-2xl font-inter text-[40px] font-extrabold uppercase leading-[1.05] tracking-tight sm:text-6xl lg:text-[64px]">
            Tu consultorio, siempre disponible<span className="text-nest-azul">.</span>
          </h1>

          <p className="mt-6 max-w-[512px] font-inter text-[14px] leading-relaxed text-white/70">
            Una recepcionista con IA que atiende a tus pacientes por WhatsApp, deriva al especialista correcto, agenda
            turnos y sincroniza tu calendario — automáticamente, las 24 horas.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
            <Link
              href="/sign-up"
              className="inline-flex items-center gap-2 rounded-full bg-nest-azul px-7 py-3 font-inter font-bold uppercase text-nest-fondo transition hover:brightness-110"
            >
              Probar gratis <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#como-funciona"
              className="rounded-full border border-white/20 px-7 py-3 font-inter font-medium text-white/90 transition hover:border-nest-azul hover:text-nest-azul"
            >
              Ver cómo funciona
            </a>
          </div>
        </div>

        {/* Columna derecha: chat real */}
        <div className="flex justify-center lg:justify-end">
          <ChatWhatsApp />
        </div>
      </div>
    </header>
  );
}
