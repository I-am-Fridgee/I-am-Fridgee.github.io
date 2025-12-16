import { useAuth } from "@/contexts/AuthContext";
import { useGame } from "@/contexts/GameContext";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { RotateCcw, MousePointer2, LogIn, LogOut, User } from "lucide-react";
import { toast } from "sonner";
import AuthModal from "@/components/AuthModal";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { state, resetGame } = useGame();
  const { user, logout } = useAuth();
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [trail, setTrail] = useState<{ id: number; x: number; y: number }[]>([]);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [stars, setStars] = useState<{ id: number; x: number; y: number }[]>([]);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
    } catch (error) {
      toast.error('Failed to log out');
    }
  };

  // Particle Trail
  useEffect(() => {
    if (!state.activeCosmetics.particleTrail) return;

    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });

      const newParticle = { id: Date.now() + Math.random(), x: e.clientX, y: e.clientY };
      setTrail((prev) => [...prev.slice(-15), newParticle]);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [state.activeCosmetics.particleTrail]);

  // Starry Background Animation
  useEffect(() => {
    if (!state.activeCosmetics.starryBackground) {
      setStars([]);
      return;
    }

    // Generate stars
    const newStars = Array.from({ length: 100 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
    }));
    setStars(newStars);
  }, [state.activeCosmetics.starryBackground]);

  return (
    <div
      className={cn(
        "min-h-screen w-full text-amber-50 font-sans overflow-x-hidden transition-colors duration-700",
        state.activeCosmetics.premiumTheme
          ? "bg-gradient-to-br from-purple-950 via-indigo-950 to-purple-900"
          : state.activeCosmetics.backgroundTheme
          ? "bg-slate-900"
          : "bg-zinc-950"
      )}
    >
      {/* Starry Night Background */}
      {state.activeCosmetics.starryBackground && (
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
          {stars.map((star) => (
            <div
              key={star.id}
              className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
              style={{
                left: `${star.x}%`,
                top: `${star.y}%`,
                opacity: Math.random() * 0.7 + 0.3,
                animation: `twinkle ${2 + Math.random() * 3}s infinite`,
              }}
            />
          ))}
          <style>{`
            @keyframes twinkle {
              0%, 100% { opacity: 0.3; }
              50% { opacity: 1; }
            }
          `}</style>
        </div>
      )}

      {/* Velvet Curtains */}
      {state.activeCosmetics.velvetCurtains && (
        <>
          <div className="fixed left-0 top-0 z-0 w-20 h-full bg-gradient-to-r from-red-900 via-red-800 to-transparent opacity-60 pointer-events-none" />
          <div className="fixed right-0 top-0 z-0 w-20 h-full bg-gradient-to-l from-red-900 via-red-800 to-transparent opacity-60 pointer-events-none" />
        </>
      )}

      {/* Particle Trail */}
      {state.activeCosmetics.particleTrail &&
        trail.map((particle) => (
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
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      />

      {/* Vignette & Texture Overlay */}
      <div className="fixed inset-0 z-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.8)_100%)]" />

      {/* Golden Frame Border */}
      {state.activeCosmetics.goldenFrame && (
        <div className="fixed inset-0 z-0 pointer-events-none border-8 border-yellow-400/30 shadow-inset" />
      )}

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

              {user ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-amber-300">{user.email?.split("@")[0]}</span>
                  <Button
                    onClick={handleLogout}
                    variant="ghost"
                    size="sm"
                    className="text-amber-400 hover:text-amber-300"
                  >
                    <LogOut className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={() => setShowAuthModal(true)}
                  variant="ghost"
                  size="sm"
                  className="text-amber-400 hover:text-amber-300"
                >
                  <LogIn className="w-4 h-4" />
                </Button>
              )}

              <Button
                onClick={resetGame}
                variant="ghost"
                size="sm"
                className="text-red-400 hover:text-red-300"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </header>

        <main className="flex-1 container mx-auto py-8">{children}</main>

        <footer className="border-t border-amber-500/20 bg-black/40 backdrop-blur-md p-4 text-center text-amber-200/60 text-xs">
          <p>© 2025 Fridgee's Casino. All rights reserved.</p>
        </footer>
      </div>

      <AuthModal open={showAuthModal} onOpenChange={setShowAuthModal} />
    </div>
  );
}
