import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useGame } from "@/contexts/GameContext";

export default function Clicker() {
  const { state, incrementClickCount } = useGame();
  const [clicks, setClicks] = useState<{ id: number; x: number; y: number; val: number }[]>([]);
  const [rainbowHue, setRainbowHue] = useState(0);
  const clickerRef = useRef<HTMLButtonElement>(null);

  // Rainbow animation
  useEffect(() => {
    if (!state.activeCosmetics.rainbowClicker) return;
    
    const interval = setInterval(() => {
      setRainbowHue((prev) => (prev + 2) % 360);
    }, 30);
    
    return () => clearInterval(interval);
  }, [state.activeCosmetics.rainbowClicker]);

  const handleClick = (e: React.MouseEvent) => {
    incrementClickCount();

    // Add floating text
    const rect = clickerRef.current?.getBoundingClientRect();
    if (rect) {
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const newClick = { id: Date.now(), x, y, val: state.clickValue };
      setClicks((prev) => [...prev, newClick]);

      // Cleanup old clicks
      setTimeout(() => {
        setClicks((prev) => prev.filter((c) => c.id !== newClick.id));
      }, 1000);
    }

    // Confetti effect if active
    if (state.activeCosmetics.confettiClick) {
      const colors = ["#FF6B6B", "#4ECDC4", "#FFE66D", "#A8E6CF", "#FF8B94"];
      for (let i = 0; i < 8; i++) {
        const particle = document.createElement("div");
        particle.style.position = "fixed";
        particle.style.left = `${e.clientX}px`;
        particle.style.top = `${e.clientY}px`;
        particle.style.width = "8px";
        particle.style.height = "8px";
        particle.style.borderRadius = "50%";
        particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        particle.style.pointerEvents = "none";
        particle.style.zIndex = "9999";
        document.body.appendChild(particle);

        const angle = (Math.PI * 2 * i) / 8;
        const velocity = 50 + Math.random() * 50;
        const vx = Math.cos(angle) * velocity;
        const vy = Math.sin(angle) * velocity;

        let x = e.clientX;
        let y = e.clientY;
        let opacity = 1;

        const animate = () => {
          x += vx * 0.016;
          y += vy * 0.016 + 2;
          opacity -= 0.02;

          particle.style.left = `${x}px`;
          particle.style.top = `${y}px`;
          particle.style.opacity = `${opacity}`;

          if (opacity > 0) {
            requestAnimationFrame(animate);
          } else {
            document.body.removeChild(particle);
          }
        };
        requestAnimationFrame(animate);
      }
    }

    // Fireworks effect on big wins (>$100)
    if (state.activeCosmetics.fireworksEffect && state.clickValue > 100) {
      for (let i = 0; i < 12; i++) {
        const firework = document.createElement("div");
        firework.style.position = "fixed";
        firework.style.left = `${e.clientX}px`;
        firework.style.top = `${e.clientY}px`;
        firework.style.width = "6px";
        firework.style.height = "6px";
        firework.style.borderRadius = "50%";
        firework.style.backgroundColor = `hsl(${Math.random() * 360}, 100%, 50%)`;
        firework.style.pointerEvents = "none";
        firework.style.zIndex = "9999";
        firework.style.boxShadow = `0 0 10px currentColor`;
        document.body.appendChild(firework);

        const angle = (Math.PI * 2 * i) / 12;
        const velocity = 100 + Math.random() * 100;
        const vx = Math.cos(angle) * velocity;
        const vy = Math.sin(angle) * velocity;

        let x = e.clientX;
        let y = e.clientY;
        let opacity = 1;

        const animate = () => {
          x += vx * 0.016;
          y += vy * 0.016 + 3;
          opacity -= 0.015;

          firework.style.left = `${x}px`;
          firework.style.top = `${y}px`;
          firework.style.opacity = `${opacity}`;

          if (opacity > 0) {
            requestAnimationFrame(animate);
          } else {
            document.body.removeChild(firework);
          }
        };
        requestAnimationFrame(animate);
      }
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center p-8">
      <div className="mb-8 text-center">
        <h2 className="text-4xl font-bold text-amber-400 font-display drop-shadow-lg">
          ${state.coins.toLocaleString()}
        </h2>
        <p className="text-amber-200/60 text-sm uppercase tracking-widest mt-1">Current Balance</p>
      </div>

      <motion.button
        ref={clickerRef}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleClick}
        className="relative group cursor-pointer outline-none"
      >
        {/* Rainbow Clicker Border */}
        {state.activeCosmetics.rainbowClicker && (
          <div
            className="absolute inset-0 rounded-full blur-2xl opacity-60 group-hover:opacity-100 transition-opacity"
            style={{
              background: `conic-gradient(from ${rainbowHue}deg, red, yellow, lime, cyan, blue, magenta, red)`,
              width: "280px",
              height: "280px",
              left: "-20px",
              top: "-20px",
            }}
          />
        )}

        {/* Golden Frame */}
        {state.activeCosmetics.goldenFrame && (
          <div className="absolute inset-0 rounded-full border-4 border-yellow-400 blur-sm opacity-70 pointer-events-none" style={{ width: "240px", height: "240px", left: "-10px", top: "-10px" }} />
        )}

        {/* Glow effect */}
        <div
          className={cn(
            "absolute inset-0 rounded-full blur-3xl transition-all duration-500",
            state.activeCosmetics.neonGlow
              ? "bg-cyan-500/40 group-hover:bg-cyan-400/60 animate-pulse"
              : "bg-amber-500/20 group-hover:bg-amber-500/30"
          )}
        />

        {/* Coin Image */}
        <img
          src="/images/gold_coin_clicker.png"
          alt="Click me!"
          className="relative w-64 h-64 object-contain drop-shadow-2xl"
        />

        {/* Floating clicks */}
        <AnimatePresence>
          {clicks.map((click) => (
            <motion.div
              key={click.id}
              initial={{ opacity: 1, y: 0 }}
              animate={{ opacity: 0, y: -50 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1 }}
              className="absolute pointer-events-none font-bold text-lg text-amber-300"
              style={{ left: click.x, top: click.y }}
            >
              +${click.val.toLocaleString()}
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
