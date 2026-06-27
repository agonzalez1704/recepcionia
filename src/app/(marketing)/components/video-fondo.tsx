"use client";

import { useEffect, useRef } from "react";

const HLS_SRC = "https://stream.mux.com/tLkHO1qZoaaQOUeVWo8hEBeGQfySP02EPS02BmnNFyXys.m3u8";

export function VideoFondo() {
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
      className="absolute inset-0 h-full w-full object-cover opacity-[0.6]"
    />
  );
}
