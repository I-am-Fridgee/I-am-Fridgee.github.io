import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Music, 
  Volume2, 
  VolumeX, 
  Play, 
  Pause,
  Users,
  Shield,
  Headphones
} from "lucide-react";
import { 
  collection, 
  query, 
  getDocs, 
  updateDoc, 
  doc, 
  getDoc 
} from "firebase/firestore";

interface User {
  id: string;
  displayName?: string;
  coins: number;
  role?: string;
  soundEnabled?: boolean;
  selectedSound?: number;
}

export default function GoodBoyPanel() {
  const { user: currentUser } = useAuth();
  const [isGoodBoy, setIsGoodBoy] = useState(false);
  const [message, setMessage] = useState("");
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Sound settings state
  const [globalSoundEnabled, setGlobalSoundEnabled] = useState(false);
  const [selectedSound, setSelectedSound] = useState<number>(1);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Audio objects
  const [audio1, setAudio1] = useState<HTMLAudioElement | null>(null);
  const [audio2, setAudio2] = useState<HTMLAudioElement | null>(null);
  const [audio3, setAudio3] = useState<HTMLAudioElement | null>(null);

  // Initialize audio objects - pointing to public/sounds/
  useEffect(() => {
    // Create audio objects pointing to public folder
    const audio1 = new Audio('/sounds/click1.mp3');
    const audio2 = new Audio('/sounds/click2.mp3');
    const audio3 = new Audio('/sounds/click3.mp3');
    
    // Set volume and preload
    audio1.volume = 0.5;
    audio2.volume = 0.5;
    audio3.volume = 0.5;
    audio1.preload = 'auto';
    audio2.preload = 'auto';
    audio3.preload = 'auto';
    
    // Error handling
    audio1.onerror = () => console.warn("Failed to load click1.mp3");
    audio2.onerror = () => console.warn("Failed to load click2.mp3");
    audio3.onerror = () => console.warn("Failed to load click3.mp3");
    
    setAudio1(audio1);
    setAudio2(audio2);
    setAudio3(audio3);
    
    return () => {
      // Cleanup
      if (audio1) audio1.pause();
      if (audio2) audio2.pause();
      if (audio3) audio3.pause();
    };
  }, []);

  // Check if current user is goodboy
  useEffect(() => {
    const checkGoodBoy = async () => {
      if (!currentUser?.uid) return;
      
      try {
        const userDoc = await getDoc(doc(db, "players", currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          // Goodboy role can be "goodboy" or admin/moderator can also access
          setIsGoodBoy(
            userData.role === "goodboy" || 
            userData.role === "admin" || 
            userData.role === "moderator"
          );
          
          // Load user's sound settings
          if (userData.soundEnabled !== undefined) {
            setGlobalSoundEnabled(userData.soundEnabled);
          }
          if (userData.selectedSound !== undefined) {
            setSelectedSound(userData.selectedSound);
          }
        }
      } catch (error) {
        console.error("Failed to check goodboy status:", error);
      }
    };

    checkGoodBoy();
  }, [currentUser]);

  // Load all users
  const loadAllUsers = async () => {
    try {
      setLoading(true);
      const usersQuery = query(collection(db, "players"));
      const snapshot = await getDocs(usersQuery);
      
      const users: User[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        users.push({
          id: doc.id,
          displayName: data.username || data.displayName || "Unknown",
          coins: data.coins || 0,
          role: data.role || "user",
          soundEnabled: data.soundEnabled || false,
          selectedSound: data.selectedSound || 1
        });
      });
      
      setAllUsers(users);
      setMessage(`Loaded ${users.length} users`);
    } catch (error) {
      setMessage("Failed to load users");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Toggle sound for ALL users
  const toggleGlobalSound = async () => {
    const newState = !globalSoundEnabled;
    
    if (!window.confirm(`Are you sure you want to ${newState ? 'ENABLE' : 'DISABLE'} click sounds for ALL users?`)) {
      return;
    }
    
    try {
      const snapshot = await getDocs(collection(db, "players"));
      const updates = [];
      
      snapshot.forEach((docSnap) => {
        updates.push(
          updateDoc(doc(db, "players", docSnap.id), {
            soundEnabled: newState,
            lastUpdated: new Date()
          })
        );
      });
      
      await Promise.all(updates);
      setGlobalSoundEnabled(newState);
      setMessage(`${newState ? 'Enabled' : 'Disabled'} click sounds for ALL users`);
      loadAllUsers();
      
      // Also save current user's preference
      if (currentUser?.uid) {
        await updateDoc(doc(db, "players", currentUser.uid), {
          soundEnabled: newState,
          selectedSound: selectedSound,
          lastUpdated: new Date()
        });
      }
    } catch (error) {
      setMessage("Failed to update sound settings");
      console.error(error);
    }
  };

  // Change sound for ALL users
  const changeGlobalSound = async (soundNumber: number) => {
    if (!window.confirm(`Change ALL users to use Sound ${soundNumber}?`)) {
      return;
    }
    
    try {
      const snapshot = await getDocs(collection(db, "players"));
      const updates = [];
      
      snapshot.forEach((docSnap) => {
        updates.push(
          updateDoc(doc(db, "players", docSnap.id), {
            selectedSound: soundNumber,
            lastUpdated: new Date()
          })
        );
      });
      
      await Promise.all(updates);
      setSelectedSound(soundNumber);
      setMessage(`Changed ALL users to Sound ${soundNumber}`);
      loadAllUsers();
      
      // Play preview
      playSound(soundNumber);
      
      // Save current user's preference
      if (currentUser?.uid) {
        await updateDoc(doc(db, "players", currentUser.uid), {
          soundEnabled: globalSoundEnabled,
          selectedSound: soundNumber,
          lastUpdated: new Date()
        });
      }
    } catch (error) {
      setMessage("Failed to change sound");
      console.error(error);
    }
  };

  // Toggle sound for specific user
  const toggleUserSound = async (userId: string, currentState: boolean) => {
    const newState = !currentState;
    
    try {
      await updateDoc(doc(db, "players", userId), {
        soundEnabled: newState,
        lastUpdated: new Date()
      });
      
      setMessage(`${newState ? 'Enabled' : 'Disabled'} sounds for user`);
      loadAllUsers();
    } catch (error) {
      setMessage("Failed to update user sound");
      console.error(error);
    }
  };

  // Change sound for specific user
  const changeUserSound = async (userId: string, soundNumber: number) => {
    try {
      await updateDoc(doc(db, "players", userId), {
        selectedSound: soundNumber,
        lastUpdated: new Date()
      });
      
      setMessage(`Changed user to Sound ${soundNumber}`);
      loadAllUsers();
      playSound(soundNumber);
    } catch (error) {
      setMessage("Failed to change user sound");
      console.error(error);
    }
  };

  // Play sound preview
  const playSound = (soundNumber: number) => {
    // Stop any currently playing sound
    if (audio1) audio1.pause();
    if (audio2) audio2.pause();
    if (audio3) audio3.pause();
    
    // Reset time
    if (audio1) audio1.currentTime = 0;
    if (audio2) audio2.currentTime = 0;
    if (audio3) audio3.currentTime = 0;
    
    // Play selected sound
    setIsPlaying(true);
    switch(soundNumber) {
      case 1:
        if (audio1) {
          audio1.play().then(() => {
            audio1.onended = () => setIsPlaying(false);
          }).catch(e => {
            console.error("Failed to play sound 1:", e);
            setIsPlaying(false);
          });
        }
        break;
      case 2:
        if (audio2) {
          audio2.play().then(() => {
            audio2.onended = () => setIsPlaying(false);
          }).catch(e => {
            console.error("Failed to play sound 2:", e);
            setIsPlaying(false);
          });
        }
        break;
      case 3:
        if (audio3) {
          audio3.play().then(() => {
            audio3.onended = () => setIsPlaying(false);
          }).catch(e => {
            console.error("Failed to play sound 3:", e);
            setIsPlaying(false);
          });
        }
        break;
    }
  };

  // Stop sound preview
  const stopSound = () => {
    if (audio1) audio1.pause();
    if (audio2) audio2.pause();
    if (audio3) audio3.pause();
    
    if (audio1) audio1.currentTime = 0;
    if (audio2) audio2.currentTime = 0;
    if (audio3) audio3.currentTime = 0;
    
    setIsPlaying(false);
  };

  // Load users on component mount
  useEffect(() => {
    if (isGoodBoy) {
      loadAllUsers();
    }
  }, [isGoodBoy]);

  if (!isGoodBoy) {
    return (
      <Card className="max-w-2xl mx-auto mt-8">
        <CardContent className="p-8 text-center">
          <Headphones className="w-16 h-16 mx-auto text-green-500 mb-4" />
          <h2 className="text-2xl font-bold text-green-100 mb-2">GoodBoy Access Required</h2>
          <p className="text-green-200/60">You need GoodBoy privileges to access this panel.</p>
          <p className="text-green-200/40 text-sm mt-2">
            Ask an admin to give you the "goodboy" role in Firestore.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      <Card className="bg-black/40 border-green-500/30 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl text-green-200">
            <Music className="w-6 h-6" />
            GoodBoy Sound Control Panel
          </CardTitle>
          <p className="text-green-200/60 text-sm">
            Control click sounds for all players. Only GoodBoys can access this panel.
          </p>
        </CardHeader>
        <CardContent>
          {/* Global Sound Controls */}
          <div className="mb-8 p-4 bg-black/30 border border-green-500/30 rounded">
            <h3 className="text-lg font-semibold text-green-200 mb-4">Global Sound Controls</h3>
            
            {/* Sound Toggle */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                {globalSoundEnabled ? (
                  <Volume2 className="w-5 h-5 text-green-400" />
                ) : (
                  <VolumeX className="w-5 h-5 text-red-400" />
                )}
                <div>
                  <Label className="text-green-200">Global Click Sounds</Label>
                  <p className="text-green-200/60 text-sm">
                    {globalSoundEnabled ? 'Sounds are ENABLED for all users' : 'Sounds are DISABLED for all users'}
                  </p>
                </div>
              </div>
              <label className="flex items-center cursor-pointer">
  <div className="relative">
    <input
      type="checkbox"
      checked={globalSoundEnabled}
      onChange={toggleGlobalSound}
      className="sr-only"
    />
    <div className={`block w-14 h-8 rounded-full transition-colors ${
      globalSoundEnabled ? 'bg-green-600' : 'bg-gray-700'
    }`}></div>
    <div className={`absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition-transform ${
      globalSoundEnabled ? 'transform translate-x-6' : ''
    }`}></div>
  </div>
  <span className="ml-3 text-sm font-medium text-green-200">
    {globalSoundEnabled ? 'ON' : 'OFF'}
  </span>
</label>
            </div>

            {/* Sound Selection */}
            <div className="space-y-4">
              <Label className="text-green-200">Select Global Click Sound</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[1, 2, 3].map((soundNum) => (
                  <Button
                    key={soundNum}
                    onClick={() => changeGlobalSound(soundNum)}
                    variant={selectedSound === soundNum ? "default" : "outline"}
                    className={`flex flex-col items-center justify-center h-24 ${
                      selectedSound === soundNum 
                        ? 'bg-green-600 hover:bg-green-700 border-green-500' 
                        : 'bg-black/30 border-green-500/30 hover:bg-green-900/30'
                    }`}
                  >
                    <Music className="w-6 h-6 mb-2" />
                    <span className="text-lg font-semibold">Sound {soundNum}</span>
                    <span className="text-xs opacity-70 mt-1">Click to preview</span>
                  </Button>
                ))}
              </div>
              
              {/* Preview Controls */}
              <div className="flex items-center gap-3 mt-4">
                <Button
                  onClick={() => playSound(selectedSound)}
                  disabled={isPlaying}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Preview Sound {selectedSound}
                </Button>
                <Button
                  onClick={stopSound}
                  variant="outline"
                  className="border-red-500 text-red-400 hover:bg-red-900/30"
                >
                  <Pause className="w-4 h-4 mr-2" />
                  Stop Preview
                </Button>
              </div>
            </div>
          </div>

          {/* Message Display */}
          {message && (
            <Alert className="border-green-500/50 bg-green-900/20 mb-6">
              <AlertDescription className="text-green-200">{message}</AlertDescription>
            </Alert>
          )}

          {/* Individual User Controls */}
          <div className="mt-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-green-200">Individual User Controls</h3>
              <Button 
                onClick={loadAllUsers} 
                variant="outline"
                className="border-green-500/30 text-green-300 hover:bg-green-900/30"
              >
                <Users className="w-4 h-4 mr-2" />
                Refresh Users
              </Button>
            </div>
            
            {loading ? (
              <p className="text-green-200/60 text-center py-8">Loading users...</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {allUsers.map((user) => (
                  <div 
                    key={user.id}
                    className="p-4 bg-black/30 border border-green-500/20 rounded hover:bg-green-900/10"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      {/* User Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <p className="font-medium text-green-100">
                            {user.displayName || user.id}
                          </p>
                          {user.role === 'goodboy' && (
                            <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-300">
                              GoodBoy
                            </span>
                          )}
                          {user.role === 'admin' && (
                            <span className="text-xs px-2 py-1 rounded-full bg-red-500/20 text-red-300">
                              Admin
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm text-green-200/60">
                          <span>Coins: {(user.coins || 0).toLocaleString()}</span>
                          <span>Sound: {user.selectedSound || 1}</span>
                          <span>Status: {user.soundEnabled ? '🔊 On' : '🔇 Off'}</span>
                        </div>
                      </div>

                      {/* User Controls */}
                      <div className="flex flex-wrap gap-2">
                        {/* Sound Toggle */}
                        <Button
                          onClick={() => toggleUserSound(user.id, user.soundEnabled || false)}
                          variant="outline"
                          size="sm"
                          className={`flex items-center gap-2 ${
                            user.soundEnabled 
                              ? 'border-red-500 text-red-400 hover:bg-red-900/30' 
                              : 'border-green-500 text-green-400 hover:bg-green-900/30'
                          }`}
                        >
                          {user.soundEnabled ? (
                            <VolumeX className="w-3 h-3" />
                          ) : (
                            <Volume2 className="w-3 h-3" />
                          )}
                          {user.soundEnabled ? 'Disable' : 'Enable'}
                        </Button>

                        {/* Sound Selection */}
                        <div className="flex gap-1">
                          {[1, 2, 3].map((soundNum) => (
                            <Button
                              key={soundNum}
                              onClick={() => changeUserSound(user.id, soundNum)}
                              size="sm"
                              className={`w-8 h-8 p-0 ${
                                user.selectedSound === soundNum 
                                  ? 'bg-green-600 hover:bg-green-700' 
                                  : 'bg-black/50 hover:bg-green-900/50'
                              }`}
                            >
                              {soundNum}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="mt-8 p-4 bg-black/20 border border-green-500/20 rounded">
            <h4 className="text-lg font-semibold text-green-200 mb-2">How It Works:</h4>
            <ul className="space-y-2 text-green-200/60 text-sm">
              <li className="flex items-start gap-2">
                <Shield className="w-4 h-4 mt-0.5 text-green-400" />
                <span>Only users with "goodboy", "admin", or "moderator" role can access this panel</span>
              </li>
              <li className="flex items-start gap-2">
                <Volume2 className="w-4 h-4 mt-0.5 text-green-400" />
                <span>Global controls affect ALL users at once</span>
              </li>
              <li className="flex items-start gap-2">
                <Users className="w-4 h-4 mt-0.5 text-green-400" />
                <span>Individual controls let you manage each user separately</span>
              </li>
              <li className="flex items-start gap-2">
                <Music className="w-4 h-4 mt-0.5 text-green-400" />
                <span>Users will hear the selected sound when they click coins</span>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}