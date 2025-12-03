import { useGame } from "@/contexts/GameContext";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef } from "react";
import { cn } from "@/lib/utils";

export default function Clicker() {
  const { state, incrementClickCount } = useGame();
  const [clicks, setClicks] = useState<{ id: number; x: number; y: number; val: number }[]>([]);
  const clickerRef = useRef<HTMLButtonElement>(null);

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

    // Confetti effect if unlocked
    if (state.upgrades.confettiClick) {
      // Create random colored particles
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
          y += vy * 0.016 + 2; // gravity
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
        {/* Glow effect */}
        <div className={cn(
          "absolute inset-0 rounded-full blur-3xl transition-all duration-500",
          state.upgrades.neonGlow 
            ? "bg-cyan-500/40 group-hover:bg-cyan-400/60 animate-pulse" 
            : "bg-amber-500/20 group-hover:bg-amber-500/30"
        )} />
        
        {/* Coin Image */}
        <img 
          src="/images/gold_coin_clicker.png" 
          alt="Click to earn" 
          className="w-64 h-64 object-contain relative z-10 drop-shadow-2xl"
        />
        
        {/* Ripple/Ring animation on click could be added here */}
      </motion.button>

      {/* Floating Numbers */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <AnimatePresence>
          {clicks.map((click) => (
            <motion.div
              key={click.id}
              initial={{ opacity: 1, y: click.y + 100, x: click.x + 100 }} // Offset to center relative to container
              animate={{ opacity: 0, y: click.y - 100 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="absolute text-2xl font-bold text-green-400 font-display drop-shadow-md"
              style={{ left: 0, top: 0 }} // Positioning handled by motion initial/animate
            >
              +${click.val}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="mt-8 text-center space-y-1">
        <p className="text-amber-100/50 text-xs">Click Power: ${state.clickValue}</p>
        {state.autoClickerValue > 0 && (
          <p className="text-amber-100/50 text-xs">Auto: ${state.autoClickerValue} / 10s</p>
        )}
      </div>
    </div>
  );
}
