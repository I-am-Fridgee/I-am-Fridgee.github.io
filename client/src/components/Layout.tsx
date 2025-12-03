import { useGame } from "@/contexts/GameContext";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { RotateCcw, MousePointer2 } from "lucide-react";
import { toast } from "sonner";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { state, resetGame } = useGame();
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [trail, setTrail] = useState<{ id: number; x: number; y: number }[]>([]);

  useEffect(() => {
    if (!state.upgrades.particleTrail) return;

    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
      
      const newParticle = { id: Date.now() + Math.random(), x: e.clientX, y: e.clientY };
      setTrail((prev) => [...prev.slice(-15), newParticle]);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [state.upgrades.particleTrail]);

  return (
    <div className={cn(
      "min-h-screen w-full text-amber-50 font-sans overflow-x-hidden transition-colors duration-700",
      state.upgrades.premiumTheme 
        ? "bg-gradient-to-br from-purple-950 via-indigo-950 to-purple-900" 
        : state.upgrades.backgroundTheme 
        ? "bg-slate-900" 
        : "bg-zinc-950"
    )}>
      {/* Particle Trail */}
      {state.upgrades.particleTrail && trail.map((particle) => (
        <div
          key={particle.id}
          className="fixed w-2 h-2 rounded-full pointer-events-none z-[9998] animate-ping"
          style={{
            left: `${particle.x}px`,
            top: `${particle.y}px`,
            background: `hsl(${(particle.id * 137.5) % 360}, 70%, 60%)`,
          }}
        />
      ))}
      {/* Background Image Layer */}
      <div 
        className="fixed inset-0 z-0 opacity-40 pointer-events-none mix-blend-overlay"
        style={{
          backgroundImage: `url('/images/art_deco_bg.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      />
      
      {/* Vignette & Texture Overlay */}
      <div className="fixed inset-0 z-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.8)_100%)]" />
      
      {/* Content */}
      <div className="relative z-10 flex flex-col min-h-screen">
        <header className="w-full p-6 border-b border-amber-500/20 bg-black/40 backdrop-blur-md sticky top-0 z-50">
          <div className="container mx-auto flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-b from-amber-200 to-amber-600">
                Fridgee's Casino
              </h1>
              <p className="text-xs text-amber-400/60 tracking-widest uppercase">Est. 2025 • iamfridgee@gmail.com</p>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-end">
                <span className="text-xs text-blue-400/80 uppercase tracking-wider flex items-center gap-1">
                  <MousePointer2 className="w-3 h-3" /> Clicks
                </span>
                <span className="text-lg font-bold font-mono text-blue-100">{state.clickCount.toLocaleString()}</span>
              </div>
              <div className="h-8 w-px bg-amber-500/30" />
              <div className="flex flex-col items-end">
                <span className="text-xs text-amber-500/80 uppercase tracking-wider">Wallet</span>
                <span className="text-xl font-bold font-mono text-amber-100">${state.coins.toLocaleString()}</span>
              </div>
              <div className="h-8 w-px bg-amber-500/30" />
              <div className="flex flex-col items-end">
                <span className="text-xs text-emerald-500/80 uppercase tracking-wider">Chips</span>
                <span className="text-xl font-bold font-mono text-emerald-100">{state.chips.toLocaleString()}</span>
              </div>
              <div className="h-8 w-px bg-amber-500/30" />
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (confirm("Are you sure you want to reset all progress? This cannot be undone!")) {
                    resetGame();
                    toast.success("Progress reset!");
                  }
                }}
                className="border-red-500/50 text-red-400 hover:bg-red-500/10"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </header>

        <main className="flex-1 container mx-auto py-8 px-4">
          {children}
        </main>

        <footer className="p-6 text-center text-amber-900/40 text-sm border-t border-amber-900/20 bg-black/60 backdrop-blur-sm">
          <p>© 2025 Fridgee's Casino. Please gamble responsibly (with fake coins).</p>
        </footer>
      </div>
    </div>
  );
}
