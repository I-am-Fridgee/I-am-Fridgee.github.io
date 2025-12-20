import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Settings as SettingsIcon } from "lucide-react";
import { useGame } from "@/contexts/GameContext";

export default function Settings() {
  const { state, toggleCosmetic } = useGame();

  const cosmeticControls = [
    {
      key: "confettiClick" as const,
      name: "Confetti Click",
      description: "Show confetti particles when clicking",
      icon: "🎉",
      owned: state.upgrades.confettiClick,
    },
    {
      key: "backgroundTheme" as const,
      name: "Cool Theme",
      description: "Alternative background theme",
      icon: "🎨",
      owned: state.upgrades.backgroundTheme,
    },
    {
      key: "neonGlow" as const,
      name: "Neon Glow",
      description: "Glowing neon effect on clicker",
      icon: "✨",
      owned: state.upgrades.neonGlow,
    },
    {
      key: "particleTrail" as const,
      name: "Particle Trail",
      description: "Colorful trail following your cursor",
      icon: "🌟",
      owned: state.upgrades.particleTrail,
    },
    {
      key: "premiumTheme" as const,
      name: "Premium Theme",
      description: "Exclusive purple and gold color scheme",
      icon: "👑",
      owned: state.upgrades.premiumTheme,
    },
    {
      key: "rainbowClicker" as const,
      name: "Rainbow Clicker",
      description: "Clicker cycles through rainbow colors",
      icon: "🌈",
      owned: state.upgrades.rainbowClicker,
    },
    {
      key: "starryBackground" as const,
      name: "Starry Night",
      description: "Animated starfield background",
      icon: "✨",
      owned: state.upgrades.starryBackground,
    },
    {
      key: "goldenFrame" as const,
      name: "Golden Frame",
      description: "Luxurious gold border around UI",
      icon: "🖼️",
      owned: state.upgrades.goldenFrame,
    },
    {
      key: "fireworksEffect" as const,
      name: "Fireworks",
      description: "Fireworks explode on big wins",
      icon: "🎆",
      owned: state.upgrades.fireworksEffect,
    },
    {
      key: "velvetCurtains" as const,
      name: "Velvet Curtains",
      description: "Rich red velvet theater curtains",
      icon: "🎭",
      owned: state.upgrades.velvetCurtains,
    },
  ];

  const handleToggle = (cosmeticKey: keyof typeof state.activeCosmetics) => {
    // Check if owned before allowing toggle
    if (cosmeticControls.find(c => c.key === cosmeticKey)?.owned) {
      toggleCosmetic(cosmeticKey);
    }
  };

  return (
    <Card className="h-full bg-black/40 border-amber-500/30 backdrop-blur-md text-amber-50 shadow-2xl">
      <CardHeader className="border-b border-amber-500/20 pb-4">
        <CardTitle className="text-2xl font-display text-amber-200 flex items-center gap-2">
          <SettingsIcon className="w-6 h-6" />
          Settings
        </CardTitle>
        <CardDescription className="text-amber-200/50">
          Customize your casino experience
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <div>
          <h3 className="text-lg font-semibold text-amber-100 mb-4">Cosmetic Effects</h3>
          <p className="text-sm text-amber-200/60 mb-4">
            Toggle cosmetic effects on/off. You must purchase them in the Shop first.
          </p>
          <div className="space-y-4">
            {cosmeticControls.map((cosmetic) => (
              <div
                key={cosmetic.key}
                className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
                  cosmetic.owned
                    ? "bg-amber-900/20 border-amber-500/30 cursor-pointer hover:bg-amber-900/30"
                    : "bg-gray-900/20 border-gray-500/20 opacity-50 cursor-not-allowed"
                }`}
              >
                <div className="flex items-center gap-3 flex-1">
                  <span className="text-2xl">{cosmetic.icon}</span>
                  <div className="flex-1">
                    <Label
                      htmlFor={cosmetic.key}
                      className={`text-sm font-medium cursor-pointer ${
                        cosmetic.owned ? "text-amber-100" : "text-gray-400"
                      }`}
                    >
                      {cosmetic.name}
                    </Label>
                    <p
                      className={`text-xs ${
                        cosmetic.owned ? "text-amber-200/60" : "text-gray-500"
                      }`}
                    >
                      {cosmetic.description}
                    </p>
                    {!cosmetic.owned && (
                      <p className="text-xs text-red-400 mt-1">
                        🔒 Purchase in Shop to unlock
                      </p>
                    )}
                  </div>
                </div>
                <Switch
                  id={cosmetic.key}
                  checked={cosmetic.owned && state.activeCosmetics[cosmetic.key]}
                  onCheckedChange={() => handleToggle(cosmetic.key)}
                  disabled={!cosmetic.owned}
                  className="data-[state=checked]:bg-amber-500"
                />
              </div>
            ))}
          </div>
        </div>
        <Separator className="bg-amber-500/20" />
        <div>
          <h3 className="text-lg font-semibold text-amber-100 mb-2">Game Info</h3>
          <p className="text-sm text-amber-200/60">
            Current cosmetics active: {Object.values(state.activeCosmetics).filter(Boolean).length}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
