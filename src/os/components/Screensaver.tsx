import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useOSStore } from '../store/useOSStore';

const Screensaver: React.FC = () => {
  const { isSleeping, setIsSleeping, user } = useOSStore();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Wake up on any activity — but ignore the very first mousemove that
  // triggers instantly after the Sleep button click
  useEffect(() => {
    if (!isSleeping) return;

    let ready = false;
    const allow = setTimeout(() => { ready = true; }, 1200);

    const wakeUp = () => {
      if (!ready) return;
      setIsSleeping(false);
    };

    window.addEventListener('mousemove', wakeUp);
    window.addEventListener('keydown', wakeUp);
    window.addEventListener('mousedown', wakeUp);
    window.addEventListener('touchstart', wakeUp);

    return () => {
      clearTimeout(allow);
      window.removeEventListener('mousemove', wakeUp);
      window.removeEventListener('keydown', wakeUp);
      window.removeEventListener('mousedown', wakeUp);
      window.removeEventListener('touchstart', wakeUp);
    };
  }, [isSleeping, setIsSleeping]);

  return (
    <AnimatePresence>
      {isSleeping && (
        <motion.div
          key="screensaver"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: '#000',
            zIndex: 200000,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            cursor: 'none',
          }}
        >
          {user.screensaverType === 'particles' && <ParticleField />}
          {user.screensaverType === 'matrix' && <MatrixRain />}
          {user.screensaverType === 'nebula' && <NebulaFlow />}
          {user.screensaverType === 'bubbles' && <FloatingBubbles />}

          {/* Floating clock */}
          <motion.div
            animate={{
              x: [0, 80, -80, 40, -40, 0],
              y: [0, -40, 60, -20, 30, 0],
            }}
            transition={{
              duration: 30,
              repeat: Infinity,
              ease: 'linear',
            }}
            style={{
              position: 'absolute',
              textAlign: 'center',
              pointerEvents: 'none',
              userSelect: 'none',
            }}
          >
            <h1 style={{
              fontSize: '80px',
              fontWeight: 100,
              margin: 0,
              color: 'rgba(255,255,255,0.85)',
              letterSpacing: '-2px',
              textShadow: '0 0 40px rgba(255,255,255,0.2)',
              fontFamily: '"Segoe UI", system-ui, sans-serif',
            }}>
              {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </h1>
            <p style={{
              fontSize: '18px',
              opacity: 0.5,
              margin: '4px 0 0',
              color: 'white',
              fontWeight: 300,
              letterSpacing: '0.5px',
            }}>
              {time.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
            <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', marginTop: '16px' }}>
              Move mouse or press any key to wake
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ─── Particle Field ───────────────────────────────────────────────────────────
const ParticleField = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let particles: { x: number; y: number; vx: number; vy: number; size: number; alpha: number; hue: number }[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    for (let i = 0; i < 180; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8,
        size: Math.random() * 2.5 + 0.5,
        alpha: Math.random() * 0.6 + 0.2,
        hue: Math.random() * 60 + 200, // blue-purple range
      });
    }

    const draw = () => {
      ctx.fillStyle = 'rgba(0,0,0,0.04)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 80%, 65%, ${p.alpha})`;
        ctx.fill();

        // Draw connections
        for (let j = i + 1; j < particles.length; j++) {
          const dx = p.x - particles[j].x;
          const dy = p.y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 100) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `hsla(${p.hue}, 70%, 60%, ${0.15 * (1 - dist / 100)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      });

      animId = requestAnimationFrame(draw);
    };

    draw();
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animId);
    };
  }, []);

  return <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0 }} />;
};

// ─── Matrix Rain ──────────────────────────────────────────────────────────────
const MatrixRain = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789$+-*/=%"\'#&_(),.;:?!\\|{}<>[]^~アイウエオカキクケコ';
    const fontSize = 15;
    const columns = Math.floor(canvas.width / fontSize);
    const drops: number[] = Array(columns).fill(1);

    let timeoutId: ReturnType<typeof setTimeout>;

    const draw = () => {
      ctx.fillStyle = 'rgba(0,0,0,0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < drops.length; i++) {
        const char = chars[Math.floor(Math.random() * chars.length)];
        // Leading character is bright white, rest are green
        const isLeading = drops[i] * fontSize > canvas.height * 0.4 && Math.random() > 0.9;
        ctx.fillStyle = isLeading ? '#fff' : `hsl(${120 + Math.random() * 20}, 100%, ${40 + Math.random() * 25}%)`;
        ctx.font = `${fontSize}px monospace`;
        ctx.fillText(char, i * fontSize, drops[i] * fontSize);
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
      }

      timeoutId = setTimeout(() => requestAnimationFrame(draw), 30);
    };

    draw();
    return () => clearTimeout(timeoutId);
  }, []);

  return <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, opacity: 0.9 }} />;
};

// ─── Nebula Flow ──────────────────────────────────────────────────────────────
const NebulaFlow = () => (
  <div style={{
    position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
    background: 'radial-gradient(ellipse at 50% 50%, #0f0c29 0%, #302b63 50%, #24243e 100%)',
    overflow: 'hidden',
  }}>
    {[
      { c: 'rgba(99,102,241,0.25)', d: 25, x: '30%', y: '40%', s: 1.4 },
      { c: 'rgba(168,85,247,0.2)', d: 35, x: '70%', y: '60%', s: 1.2 },
      { c: 'rgba(236,72,153,0.15)', d: 20, x: '50%', y: '20%', s: 1.6 },
      { c: 'rgba(34,211,238,0.12)', d: 40, x: '20%', y: '70%', s: 1.1 },
    ].map((orb, i) => (
      <motion.div
        key={i}
        animate={{ scale: [1, orb.s, 1], rotate: [0, 180, 360] }}
        transition={{ duration: orb.d, repeat: Infinity, ease: 'linear' }}
        style={{
          position: 'absolute',
          left: orb.x, top: orb.y,
          width: '60vmax', height: '60vmax',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${orb.c} 0%, transparent 70%)`,
          transform: 'translate(-50%, -50%)',
          filter: 'blur(60px)',
        }}
      />
    ))}
    {/* Stars */}
    {Array.from({ length: 80 }).map((_, i) => (
      <motion.div
        key={`star-${i}`}
        animate={{ opacity: [0.2, 1, 0.2] }}
        transition={{ duration: Math.random() * 3 + 1, repeat: Infinity, delay: Math.random() * 3 }}
        style={{
          position: 'absolute',
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          width: Math.random() * 2 + 1,
          height: Math.random() * 2 + 1,
          borderRadius: '50%',
          background: 'white',
        }}
      />
    ))}
  </div>
);

// ─── Floating Bubbles ─────────────────────────────────────────────────────────
const FloatingBubbles = () => {
  const bubbles = useRef(
    Array.from({ length: 25 }).map((_, i) => ({
      id: i,
      size: Math.random() * 80 + 20,
      x: Math.random() * 100,
      duration: Math.random() * 12 + 8,
      delay: Math.random() * 15,
      hue: Math.floor(Math.random() * 360),
    }))
  ).current;

  return (
    <div style={{
      position: 'absolute', width: '100%', height: '100%',
      background: 'radial-gradient(ellipse at bottom, #1a0a2e 0%, #000 100%)',
      overflow: 'hidden',
    }}>
      {bubbles.map(b => (
        <motion.div
          key={b.id}
          initial={{ y: '110vh', x: `${b.x}vw` }}
          animate={{ y: '-20vh', x: [`${b.x}vw`, `${b.x + (Math.random() * 20 - 10)}vw`] }}
          transition={{ duration: b.duration, repeat: Infinity, ease: 'linear', delay: b.delay }}
          style={{
            position: 'absolute',
            bottom: 0,
            width: b.size,
            height: b.size,
            borderRadius: '50%',
            background: `radial-gradient(circle at 35% 35%, hsla(${b.hue}, 80%, 80%, 0.4), hsla(${b.hue}, 60%, 40%, 0.1))`,
            border: `1px solid hsla(${b.hue}, 80%, 70%, 0.3)`,
            backdropFilter: 'blur(2px)',
          }}
        />
      ))}
    </div>
  );
};

export default Screensaver;
