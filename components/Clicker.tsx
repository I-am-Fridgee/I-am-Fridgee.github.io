import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useGame } from "@/contexts/GameContext";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";

export default function Clicker() {
  const { user } = useAuth(); // Get current user
  const { state, incrementClickCount } = useGame();
  const [clicks, setClicks] = useState<{ id: number; x: number; y: number; val: number }[]>([]);
  const [rainbowHue, setRainbowHue] = useState(0);
  const clickerRef = useRef<HTMLButtonElement>(null);
  
  // Audio refs
  const audio1 = useRef<HTMLAudioElement | null>(null);
  const audio2 = useRef<HTMLAudioElement | null>(null);
  const audio3 = useRef<HTMLAudioElement | null>(null);
  
  // Sound state - local state for real-time updates
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [selectedSound, setSelectedSound] = useState(1);

  // Initialize audio objects
  useEffect(() => {
    console.log("Initializing audio...");
    
    // Create audio objects
    audio1.current = new Audio('/sounds/click1.mp3');
    audio2.current = new Audio('/sounds/click2.mp3');
    audio3.current = new Audio('/sounds/click3.mp3');
    
    // Configure audio
    [audio1.current, audio2.current, audio3.current].forEach(audio => {
      if (audio) {
        audio.volume = 0.5;
        audio.preload = 'auto';
        audio.onerror = () => console.warn("Audio failed to load");
        audio.oncanplaythrough = () => console.log("Audio ready to play");
      }
    });

    return () => {
      // Cleanup
      if (audio1.current) audio1.current.pause();
      if (audio2.current) audio2.current.pause();
      if (audio3.current) audio3.current.pause();
    };
  }, []);

  // REAL-TIME Firestore listener for sound settings
  useEffect(() => {
    if (!user) {
      console.log("No user logged in, disabling sound");
      setSoundEnabled(false);
      return;
    }
    
    console.log("Setting up real-time listener for user:", user.uid);
    
    const unsubscribe = onSnapshot(doc(db, "players", user.uid), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        console.log("🔥 Real-time sound update:", {
          soundEnabled: data.soundEnabled,
          selectedSound: data.selectedSound,
          timestamp: new Date().toISOString()
        });
        
        // Update local state
        setSoundEnabled(data.soundEnabled || false);
        setSelectedSound(data.selectedSound || 1);
        
        // Also update GameContext state if it has userData
        // This ensures consistency
      } else {
        console.log("User document not found in Firestore");
        setSoundEnabled(false);
        setSelectedSound(1);
      }
    }, (error) => {
      console.error("Real-time listener error:", error);
    });

    return () => {
      console.log("Cleaning up real-time listener");
      unsubscribe();
    };
  }, [user]);

  // Function to play click sound - uses LOCAL state
  const playClickSound = () => {
    console.log("Attempting to play sound...");
    console.log("Local sound state:", { soundEnabled, selectedSound });
    
    // Check if sound is enabled
    if (!soundEnabled) {
      console.log("Sound disabled");
      return;
    }

    console.log("Selected sound number:", selectedSound);

    let audio: HTMLAudioElement | null = null;
    
    switch(selectedSound) {
      case 1:
        audio = audio1.current;
        break;
      case 2:
        audio = audio2.current;
        break;
      case 3:
        audio = audio3.current;
        break;
      default:
        audio = audio1.current;
    }

    if (audio) {
      console.log("Playing audio element:", audio);
      // Reset and play
      audio.currentTime = 0;
      audio.play().then(() => {
        console.log("✅ Audio played successfully");
      }).catch(error => {
        console.error("❌ Failed to play audio:", error);
        // Try fallback - create new audio element
        try {
          const fallbackAudio = new Audio(`/sounds/click${selectedSound}.mp3`);
          fallbackAudio.volume = 0.5;
          fallbackAudio.play().catch(e => console.log("Fallback also failed:", e));
        } catch (e) {
          console.log("Could not create fallback audio");
        }
      });
    } else {
      console.error("Audio element not found for sound:", selectedSound);
    }
  };

  // Rainbow animation
  useEffect(() => {
    if (!state.activeCosmetics.rainbowClicker) return;
    
    const interval = setInterval(() => {
      setRainbowHue((prev) => (prev + 2) % 360);
    }, 30);
    
    return () => clearInterval(interval);
  }, [state.activeCosmetics.rainbowClicker]);

  const handleClick = (e: React.MouseEvent) => {
    console.log("Click detected, playing sound...");
    // Play sound FIRST
    playClickSound();
    
    // Then increment count
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