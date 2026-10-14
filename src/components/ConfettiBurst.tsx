"use client";

import { useEffect, useRef } from "react";

export default function ConfettiBurst({ trigger }: { trigger: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!trigger || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = "100vw";
    canvas.style.height = "100vh";
    context.scale(dpr, dpr);
    const colors = ["#FF6B5E", "#FFE08A", "#7BD389", "#CFE6FB"];
    const particles = Array.from({ length: 36 }, (_, index) => ({
      x: window.innerWidth / 2,
      y: window.innerHeight * 0.34,
      vx: (index % 2 ? 1 : -1) * (2 + Math.random() * 5),
      vy: -7 - Math.random() * 5,
      rotation: Math.random() * Math.PI,
      color: colors[index % colors.length],
    }));
    let frame = 0;
    let animation = 0;
    let cancelled = false;
    const draw = () => {
      if (cancelled) return;
      context.clearRect(0, 0, window.innerWidth, window.innerHeight);
      particles.forEach((particle) => {
        particle.x += particle.vx;
        particle.vy += 0.22;
        particle.y += particle.vy;
        particle.rotation += 0.15;
        context.save();
        context.translate(particle.x, particle.y);
        context.rotate(particle.rotation);
        context.fillStyle = particle.color;
        context.fillRect(-4, -2, 8, 4);
        context.restore();
      });
      frame += 1;
      if (frame < 55) animation = requestAnimationFrame(draw);
      else context.clearRect(0, 0, window.innerWidth, window.innerHeight);
    };
    animation = requestAnimationFrame(draw);
    return () => {
      cancelled = true;
      cancelAnimationFrame(animation);
      context.clearRect(0, 0, window.innerWidth, window.innerHeight);
    };
  }, [trigger]);

  return <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none fixed inset-0 z-[100]" />;
}
