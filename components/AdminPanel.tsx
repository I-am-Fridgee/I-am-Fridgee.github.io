import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Shield, 
  Coins, 
  Trash2, 
  RefreshCw, 
  Users, 
  AlertTriangle, 
  Wrench,
  DollarSign,
  Lock,
  Snowflake,
  RotateCcw,
  Ban,
  Crown,
  User,
  Edit,
  Key,
  Star,
  Check,
  X,
  Megaphone,
  Plus,
  Minus,
  MessageSquare
} from "lucide-react";
import { 
  collection, 
  query, 
  getDocs, 
  updateDoc, 
  doc, 
  deleteDoc,
  getDoc,
  setDoc,
  orderBy,  
  limit     
} from "firebase/firestore";

interface User {
  id: string;
  email?: string;
  displayName?: string;
  username?: string;
  coins: number;
  role?: string;
  chips?: any;
  clickCount?: number;
  totalClicks?: number;
  highScore?: number;
  upgrades?: string;
  activeCosmetics?: string;
  hasIssues?: boolean;
  upgradesLocked?: boolean;
  economyFrozen?: boolean;
}

interface Announcement {
  id: string;
  message: string;
  timestamp: Date;
  isActive: boolean;
}

export default function AdminPanel() {
  const { user: currentUser } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [coinAmount, setCoinAmount] = useState(1000);
  const [coinAction, setCoinAction] = useState<"give" | "take">("give");
  const [message, setMessage] = useState("");
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUserData, setSelectedUserData] = useState<User | null>(null);
  
  // Role management
  const [showRoleSelector, setShowRoleSelector] = useState(false);
  const [showUsernameEditor, setShowUsernameEditor] = useState(false);
  const [newUsername, setNewUsername] = useState("");

  // Announcement system
  const [showAnnouncementPanel, setShowAnnouncementPanel] = useState(false);
  const [announcementText, setAnnouncementText] = useState("");
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [activeAnnouncementId, setActiveAnnouncementId] = useState<string | null>(null);

  // Check if current user is admin (ONLY admin, not moderator)
  useEffect(() => {
    const checkAdmin = async () => {
      if (!currentUser?.uid) return;
      
      try {
        const userDoc = await getDoc(doc(db, "players", currentUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          // ONLY allow "admin" role, not "moderator"
          setIsAdmin(userData.role === "admin");
          console.log("Admin check:", userData.role, "Is admin?", userData.role === "admin");
        }
      } catch (error) {
        console.error("Failed to check admin status:", error);
      }
    };

    checkAdmin();
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
          email: data.email,
          displayName: data.username || data.displayName || "Unknown",
          username: data.username,
          coins: safeNumber(data.coins, 0),
          role: data.role || "user",
          chips: ensureNumberChips(data.chips),
          clickCount: safeNumber(data.clickCount, 0),
          totalClicks: safeNumber(data.totalClicks, 0),
          highScore: safeNumber(data.highScore, 0),
          upgrades: data.upgrades,
          activeCosmetics: data.activeCosmetics || data.activeCometics || "{}",
          upgradesLocked: data.upgradesLocked || false,
          economyFrozen: data.economyFrozen || false,
          hasIssues: false
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

// Add this function to your admin panel component
const debugAnnouncements = async () => {
  try {
    console.log("=== DEBUG ANNOUNCEMENTS ===");
    
    // Check announcements collection
    const announcementsSnapshot = await getDocs(collection(db, "announcements"));
    console.log("Announcements in collection:", announcementsSnapshot.size);
    announcementsSnapshot.forEach(doc => {
      console.log(`Announcement ${doc.id}:`, doc.data());
    });
    
    // Check a few users
    const usersSnapshot = await getDocs(query(collection(db, "players"), limit(3)));
    console.log("\nSample users:");
    usersSnapshot.forEach(doc => {
      console.log(`User ${doc.id}:`, {
        username: doc.data().username,
        activeAnnouncement: doc.data().activeAnnouncement,
        hasUnreadAnnouncement: doc.data().hasUnreadAnnouncement
      });
    });
    
    setMessage("Debug info logged to console");
  } catch (error) {
    console.error("Debug failed:", error);
    setMessage("Debug failed");
  }
};


const removeAnnouncement = async (announcementId: string) => {
  if (!window.confirm("Are you sure you want to remove this announcement?")) {
    return;
  }

  try {
    console.log("Removing announcement:", announcementId);
    
    // Remove announcement from collection
    await deleteDoc(doc(db, "announcements", announcementId));
    
    // If this was the active announcement, clear it
    if (announcementId === activeAnnouncementId) {
      setActiveAnnouncementId(null);
    }
    
    // Clear this announcement from all users
    const usersSnapshot = await getDocs(collection(db, "players"));
    const updatePromises: Promise<void>[] = [];
    
    usersSnapshot.forEach((userDoc) => {
      const userData = userDoc.data();
      // Only update if this user has this specific announcement
      if (userData.activeAnnouncement === announcementId) {
        updatePromises.push(
          updateDoc(doc(db, "players", userDoc.id), {
            activeAnnouncement: null,
            hasUnreadAnnouncement: false
          })
        );
      }
    });
    
    await Promise.all(updatePromises);
    
    setMessage("Announcement removed from all users!");
    loadAnnouncements();
    
  } catch (error) {
    console.error("Failed to remove announcement:", error);
    setMessage("Failed to remove announcement");
  }
};

  // Load announcements
  const loadAnnouncements = async () => {
  try {
    console.log("Loading announcements...");
    const announcementsQuery = query(collection(db, "announcements"), orderBy("timestamp", "desc"));
    const snapshot = await getDocs(announcementsQuery);
    
    const loadedAnnouncements: Announcement[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      loadedAnnouncements.push({
        id: doc.id,
        message: data.message || "",
        timestamp: data.timestamp?.toDate() || new Date(),
        isActive: data.isActive || false
      });
      
      if (data.isActive) {
        setActiveAnnouncementId(doc.id);
        console.log("Active announcement found:", doc.id);
      }
    });
    
    console.log("Loaded", loadedAnnouncements.length, "announcements");
    setAnnouncements(loadedAnnouncements);
  } catch (error) {
    console.error("Failed to load announcements:", error);
  }
};

  // Helper function to safely convert to number
  const safeNumber = (value: any, defaultValue: number = 0): number => {
    if (value == null) return defaultValue;
    const num = Number(value);
    return isNaN(num) ? defaultValue : num;
  };

  // ENSURE chips are ALWAYS numbers, NEVER "Beginner" or strings
  const ensureNumberChips = (chips: any): number => {
    if (chips == null) return 0;
    if (typeof chips === 'number') return isNaN(chips) ? 0 : chips;
    if (typeof chips === 'string') {
      if (chips === "Beginner") return 0;
      const num = Number(chips);
      return isNaN(num) ? 0 : num;
    }
    return 0;
  };

  // Helper to display chips (always as number)
  const getChipsDisplay = (chips: any): string => {
    return ensureNumberChips(chips).toString();
  };

  // Load selected user details
  useEffect(() => {
    const loadSelectedUser = async () => {
      if (!selectedUserId) {
        setSelectedUserData(null);
        return;
      }
      
      try {
        const userDoc = await getDoc(doc(db, "players", selectedUserId));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setSelectedUserData({
            id: userDoc.id,
            displayName: data.username || data.displayName || "Unknown",
            username: data.username,
            coins: safeNumber(data.coins, 0),
            role: data.role || "user",
            chips: ensureNumberChips(data.chips),
            clickCount: safeNumber(data.clickCount, 0),
            totalClicks: safeNumber(data.totalClicks, 0),
            highScore: safeNumber(data.highScore, 0),
            upgradesLocked: data.upgradesLocked || false,
            economyFrozen: data.economyFrozen || false
          });
        }
      } catch (error) {
        console.error("Failed to load user details:", error);
      }
    };
    
    loadSelectedUser();
  }, [selectedUserId]);

  const forceAnnouncementToUser = async () => {
  if (!selectedUserId) {
    setMessage("Please select a user first");
    return;
  }

  try {
    // Get the active announcement ID
    const activeAnnouncement = announcements.find(a => a.isActive);
    if (!activeAnnouncement) {
      setMessage("No active announcement found");
      return;
    }

    // Force it to the selected user
    await updateDoc(doc(db, "players", selectedUserId), {
      activeAnnouncement: activeAnnouncement.id,
      hasUnreadAnnouncement: true
    });

    setMessage(`Forced announcement to user ${selectedUserData?.displayName}. Open that user in a new browser to test.`);
    
  } catch (error) {
    console.error("Force announcement error:", error);
    setMessage("Failed to force announcement");
  }
};
  
  // ========== ANNOUNCEMENT SYSTEM ==========
 
const createAnnouncement = async () => {
  if (!announcementText.trim()) {
    setMessage("Please enter announcement text");
    return;
  }

  try {
    console.log("Creating announcement...");
    
    // First, deactivate any existing announcements
    const announcementsSnapshot = await getDocs(collection(db, "announcements"));
    console.log("Found", announcementsSnapshot.size, "existing announcements");
    
    const deactivatePromises: Promise<void>[] = [];
    announcementsSnapshot.forEach((docSnap) => {
      deactivatePromises.push(
        updateDoc(doc(db, "announcements", docSnap.id), {
          isActive: false,
          updatedAt: new Date()
        })
      );
    });
    
    await Promise.all(deactivatePromises);
    console.log("Deactivated old announcements");
    
    // Create new announcement with a custom ID for easier debugging
    const newAnnouncementId = `announcement_${Date.now()}`;
    const newAnnouncementRef = doc(db, "announcements", newAnnouncementId);
    
    const announcementData = {
      message: announcementText.trim(),
      timestamp: new Date(),
      isActive: true,
      createdAt: new Date(),
      createdBy: currentUser?.uid || "admin"
    };
    
    console.log("Saving announcement:", announcementData);
    await setDoc(newAnnouncementRef, announcementData);
    console.log("Announcement saved with ID:", newAnnouncementId);
    
    // Get all users
    const usersSnapshot = await getDocs(collection(db, "players"));
    console.log("Found", usersSnapshot.size, "users");
    
    const userUpdatePromises: Promise<void>[] = [];
    let updatedCount = 0;
    
    usersSnapshot.forEach((userDoc) => {
      userUpdatePromises.push(
        updateDoc(doc(db, "players", userDoc.id), {
          activeAnnouncement: newAnnouncementId,
          hasUnreadAnnouncement: true,
          lastUpdated: new Date()
        })
      );
      updatedCount++;
    });
    
    await Promise.all(userUpdatePromises);
    console.log("Updated", updatedCount, "users with new announcement");
    
    setActiveAnnouncementId(newAnnouncementId);
    setAnnouncementText("");
    setMessage(`Announcement created and sent to ${updatedCount} players!`);
    
    // Refresh data
    loadAnnouncements();
    loadAllUsers();
    
  } catch (error) {
    console.error("Failed to create announcement:", error);
    setMessage(`Failed to create announcement: ${error}`);
  }
};

  // ========== COIN MANAGEMENT (GIVE/TAKE) ==========
  const manageCoins = async () => {
    if (!selectedUserId || !coinAmount) {
      setMessage("Please select a user and enter amount");
      return;
    }

    if (coinAmount <= 0) {
      setMessage("Amount must be greater than 0");
      return;
    }

    try {
      const userRef = doc(db, "players", selectedUserId);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        setMessage("User not found");
        return;
      }

      const currentCoins = safeNumber(userDoc.data().coins, 0);
      let newCoins = currentCoins;
      
      if (coinAction === "give") {
        newCoins = currentCoins + coinAmount;
      } else if (coinAction === "take") {
        // Ensure coins don't go negative
        newCoins = Math.max(0, currentCoins - coinAmount);
      }
      
      await updateDoc(userRef, {
        coins: newCoins,
        lastUpdated: new Date()
      });

      const actionText = coinAction === "give" ? "Added" : "Removed";
      setMessage(`${actionText} ${coinAmount} coins from user. New total: ${newCoins}`);
      loadAllUsers();
      
    } catch (error) {
      setMessage("Failed to manage coins");
      console.error(error);
    }
  };

  // ========== ROLE MANAGEMENT ==========
  const updateUserRole = async (userId: string, newRole: string) => {
    if (!userId || !newRole) {
      setMessage("Please select a user and role");
      return;
    }

    if (!window.confirm(`Change user role to "${newRole}"?`)) {
      return;
    }

    try {
      await updateDoc(doc(db, "players", userId), {
        role: newRole,
        lastUpdated: new Date()
      });

      setMessage(`Role changed to "${newRole}"`);
      setShowRoleSelector(false);
      loadAllUsers();
    } catch (error) {
      setMessage("Failed to update role");
      console.error(error);
    }
  };

  // ========== USERNAME EDITING ==========
  const updateUsername = async () => {
    if (!selectedUserId || !newUsername.trim()) {
      setMessage("Please select a user and enter a username");
      return;
    }

    const trimmedUsername = newUsername.trim();
    if (!window.confirm(`Change username to "${trimmedUsername}"?`)) {
      return;
    }

    try {
      await updateDoc(doc(db, "players", selectedUserId), {
        username: trimmedUsername,
        lastUpdated: new Date()
      });

      setMessage(`Username changed to "${trimmedUsername}"`);
      setShowUsernameEditor(false);
      setNewUsername("");
      loadAllUsers();
    } catch (error) {
      setMessage("Failed to update username");
      console.error(error);
    }
  };

  // ========== EXISTING FUNCTIONS ==========
  
  // Set custom chips (ensures number)
  const setCustomChipsPrompt = async () => {
    if (!selectedUserId) {
      setMessage("Please select a user first");
      return;
    }

    const chipsInput = prompt("Enter chips value (number only):", 
      selectedUserData?.chips != null ? String(selectedUserData.chips) : "0");
    if (chipsInput === null) return;
    
    try {
      const chipsValue = ensureNumberChips(chipsInput);
      
      await updateDoc(doc(db, "players", selectedUserId), {
        chips: chipsValue,
        lastUpdated: new Date()
      });
      setMessage(`Set chips to: ${chipsValue}`);
      loadAllUsers();
    } catch (error) {
      setMessage("Failed to update chips");
      console.error(error);
    }
  };

  // Toggle upgrades lock
  const toggleUpgradesLock = async () => {
    if (!selectedUserId) {
      setMessage("Please select a user first");
      return;
    }

    try {
      const userRef = doc(db, "players", selectedUserId);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        setMessage("User not found");
        return;
      }
      
      const userData = userDoc.data();
      const newLockState = !userData.upgradesLocked;
      
      await updateDoc(userRef, {
        upgradesLocked: newLockState,
        lastUpdated: new Date()
      });
      
      setMessage(newLockState ? "Upgrades locked for user" : "Upgrades unlocked for user");
      loadAllUsers();
    } catch (error) {
      setMessage("Failed to toggle upgrades lock");
      console.error(error);
    }
  };

  // Toggle economy freeze
  const toggleEconomyFreeze = async () => {
    if (!selectedUserId) {
      setMessage("Please select a user first");
      return;
    }

    try {
      const userRef = doc(db, "players", selectedUserId);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        setMessage("User not found");
        return;
      }
      
      const userData = userDoc.data();
      const newFreezeState = !userData.economyFrozen;
      
      await updateDoc(userRef, {
        economyFrozen: newFreezeState,
        lastUpdated: new Date()
      });
      
      setMessage(newFreezeState ? "Economy frozen for user" : "Economy unfrozen for user");
      loadAllUsers();
    } catch (error) {
      setMessage("Failed to toggle economy freeze");
      console.error(error);
    }
  };

  // Soft reset (keep cosmetics)
  const softReset = async () => {
    if (!selectedUserId) {
      setMessage("Please select a user");
      return;
    }

    if (!window.confirm("Soft Reset: Reset coins/progress but keep cosmetics. Continue?")) {
      return;
    }
    
    try {
      const userRef = doc(db, "players", selectedUserId);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        setMessage("User not found");
        return;
      }
      
      const userData = userDoc.data();
      
      let activeCosmetics = "{}";
      try {
        activeCosmetics = userData.activeCosmetics || userData.activeCometics || "{}";
      } catch (e) {
        console.error("Error parsing cosmetics:", e);
      }
      
      await updateDoc(userRef, {
        coins: 0,
        clickCount: 0,
        totalClicks: 0,
        highScore: 0,
        chips: 0,
        upgrades: "{}",
        activeCosmetics: activeCosmetics,
        lastUpdated: new Date()
      });
      
      try {
        await deleteDoc(doc(db, "leaderboard", selectedUserId));
      } catch (e) {
        console.log("No leaderboard entry to delete");
      }
      
      setMessage("Soft reset completed (cosmetics preserved)");
      loadAllUsers();
    } catch (error) {
      setMessage("Failed to soft reset");
      console.error(error);
    }
  };

  // Hard reset (complete wipe)
  const hardReset = async () => {
    if (!selectedUserId) {
      setMessage("Please select a user");
      return;
    }

    if (!window.confirm("⚠️ HARD RESET: COMPLETE WIPE! This will delete ALL user data. Continue?")) {
      return;
    }
    
    try {
      const userRef = doc(db, "players", selectedUserId);
      
      await updateDoc(userRef, {
        coins: 0,
        clickCount: 0,
        totalClicks: 0,
        highScore: 0,
        chips: 0,
        upgrades: "{}",
        activeCosmetics: "{}",
        lastUpdated: new Date(),
        upgradesLocked: false,
        economyFrozen: false,
        role: selectedUserData?.role === "admin" ? "admin" : "user"
      });
      
      try {
        await deleteDoc(doc(db, "leaderboard", selectedUserId));
      } catch (e) {
        console.log("No leaderboard entry to delete");
      }
      
      setMessage("Hard reset completed - complete data wipe");
      loadAllUsers();
    } catch (error) {
      setMessage("Failed to hard reset");
      console.error(error);
    }
  };

  // Reset user data
  const resetUserData = async () => {
    if (!selectedUserId) {
      setMessage("Please select a user");
      return;
    }

    if (!window.confirm("Are you sure you want to reset this user's data?")) {
      return;
    }

    try {
      await updateDoc(doc(db, "players", selectedUserId), {
        coins: 0,
        clickCount: 0,
        chips: 0,
        upgrades: "{}",
        activeCosmetics: "{}",
        lastUpdated: new Date()
      });

      setMessage("User data reset to zero");
      loadAllUsers();
    } catch (error) {
      setMessage("Failed to reset user data");
      console.error(error);
    }
  };

  // Remove user from leaderboard
  const removeFromLeaderboard = async () => {
    if (!selectedUserId) {
      setMessage("Please select a user");
      return;
    }

    if (!window.confirm("Remove this user from leaderboard?")) {
      return;
    }

    try {
      await deleteDoc(doc(db, "leaderboard", selectedUserId));
      setMessage("User removed from leaderboard");
      loadAllUsers();
    } catch (error) {
      setMessage("Failed to remove from leaderboard");
      console.error(error);
    }
  };

  // Fix all data issues
  const fixAllDataIssues = async () => {
    if (!window.confirm("This will fix ALL data issues for ALL users. Continue?")) {
      return;
    }
    
    try {
      const snapshot = await getDocs(collection(db, "players"));
      const updates = [];
      let fixedCount = 0;
      
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const updateData: any = {};
        let needsUpdate = false;
        
        if (data.coins == null || isNaN(Number(data.coins))) {
          updateData.coins = 0;
          needsUpdate = true;
        } else if (typeof data.coins === 'string') {
          updateData.coins = Number(data.coins) || 0;
          needsUpdate = true;
        }
        
        if (data.clickCount == null || isNaN(Number(data.clickCount))) {
          updateData.clickCount = 0;
          needsUpdate = true;
        } else if (typeof data.clickCount === 'string') {
          updateData.clickCount = Number(data.clickCount) || 0;
          needsUpdate = true;
        }
        
        if (data.totalClicks == null || isNaN(Number(data.totalClicks))) {
          updateData.totalClicks = 0;
          needsUpdate = true;
        } else if (typeof data.totalClicks === 'string') {
          updateData.totalClicks = Number(data.totalClicks) || 0;
          needsUpdate = true;
        }
        
        if (data.highScore == null || isNaN(Number(data.highScore))) {
          updateData.highScore = 0;
          needsUpdate = true;
        } else if (typeof data.highScore === 'string') {
          updateData.highScore = Number(data.highScore) || 0;
          needsUpdate = true;
        }
        
        const currentChips = data.chips;
        if (currentChips == null || 
            currentChips === "Beginner" || 
            currentChips === "0" ||
            typeof currentChips === 'string') {
          updateData.chips = ensureNumberChips(currentChips);
          needsUpdate = true;
        }
        
        if (data.activeCometics && !data.activeCosmetics) {
          updateData.activeCosmetics = data.activeCometics;
          needsUpdate = true;
        }
        
        if (needsUpdate) {
          updateData.lastUpdated = new Date();
          updates.push(updateDoc(doc(db, "players", docSnap.id), updateData));
          fixedCount++;
        }
      });
      
      await Promise.all(updates);
      setMessage(`Fixed ${fixedCount} users with data issues`);
      loadAllUsers();
      
    } catch (error) {
      setMessage("Failed to fix data issues");
      console.error(error);
    }
  };

  // Find problematic users
  const findProblematicUsers = async () => {
    try {
      const snapshot = await getDocs(collection(db, "players"));
      const problematicUsers: Array<{id: string, issues: string[]}> = [];
      
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const issues: string[] = [];
        
        const checks = [
          {field: 'coins', value: data.coins},
          {field: 'clickCount', value: data.clickCount},
          {field: 'totalClicks', value: data.totalClicks},
          {field: 'highScore', value: data.highScore},
          {field: 'chips', value: data.chips}
        ];
        
        checks.forEach(check => {
          const value = check.value;
          
          if (value == null) {
            issues.push(`${check.field} is null/undefined`);
          } else if (typeof value === 'string') {
            if (value === 'null' || value === 'undefined' || value === 'NaN') {
              issues.push(`${check.field} is string "${value}"`);
            } else if (!isNaN(Number(value)) && check.field !== 'chips') {
              issues.push(`${check.field} is string "${value}" (should be number)`);
            }
          } else if (typeof value === 'number' && isNaN(value)) {
            issues.push(`${check.field} is NaN`);
          }
        });
        
        if (issues.length > 0) {
          problematicUsers.push({
            id: docSnap.id,
            issues
          });
        }
      });
      
      console.log("Problematic users:", problematicUsers);
      
      setAllUsers(prev => prev.map(user => ({
        ...user,
        hasIssues: problematicUsers.some(p => p.id === user.id)
      })));
      
      setMessage(`Found ${problematicUsers.length} users with data issues. Check console for details.`);
      
    } catch (error) {
      console.error("Failed to scan users:", error);
      setMessage("Failed to scan for data issues");
    }
  };

  // Load users and announcements on component mount
  useEffect(() => {
    if (isAdmin) {
      loadAllUsers();
      loadAnnouncements();
    }
  }, [isAdmin]);

  // ADMIN-ONLY ACCESS CHECK
  if (!isAdmin) {
    return (
      <Card className="max-w-2xl mx-auto mt-8">
        <CardContent className="p-8 text-center">
          <Crown className="w-16 h-16 mx-auto text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-red-100 mb-2">Admin-Only Access</h2>
          <p className="text-red-200/60">Only users with "admin" role can access this panel.</p>
          <p className="text-red-200/40 text-sm mt-2">
            Moderators and other roles cannot access this panel.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      <Card className="bg-black/40 border-red-500/30 backdrop-blur-md">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2 text-2xl text-red-200">
                <Crown className="w-6 h-6" />
                Admin Control Panel
                <span className="text-xs px-2 py-1 bg-red-500/20 text-red-300 rounded">
                  ADMIN-ONLY
                </span>
              </CardTitle>
              <p className="text-red-200/60 text-sm">
                Full administrative control panel. Only admins can access this.
              </p>
            </div>
            <Button
              onClick={() => setShowAnnouncementPanel(!showAnnouncementPanel)}
              className={showAnnouncementPanel ? "bg-purple-600 hover:bg-purple-700" : "bg-indigo-600 hover:bg-indigo-700"}
            >
              <Megaphone className="w-4 h-4 mr-2" />
              {showAnnouncementPanel ? "Hide Announcements" : "Show Announcements"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Announcement Panel */}
          {showAnnouncementPanel && (
            <div className="mb-6 p-4 bg-black/40 border border-indigo-500/30 rounded">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-indigo-200">Global Announcements</h3>
                <Button
                  onClick={() => setShowAnnouncementPanel(false)}
                  variant="ghost"
                  size="sm"
                  className="text-indigo-300 hover:text-indigo-100"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              {/* Create Announcement */}
              <div className="space-y-3 mb-6">
                <div>
                  <Label className="text-indigo-200">Announcement Message</Label>
                  <Textarea
                    value={announcementText}
                    onChange={(e) => setAnnouncementText(e.target.value)}
                    placeholder="Enter message for all players..."
                    className="bg-black/50 border-indigo-500/30 text-indigo-100 min-h-[100px]"
                  />
                  <p className="text-indigo-200/60 text-xs mt-1">
                    This message will appear for all players until they close it.
                  </p>
                </div>
                <Button
                  onClick={createAnnouncement}
                  className="bg-indigo-600 hover:bg-indigo-700 w-full"
                  disabled={!announcementText.trim()}
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Send Announcement to All Players
                </Button>
              </div>
              
              {/* Active Announcement */}
              {activeAnnouncementId && (
                <div className="mb-6 p-4 bg-indigo-900/20 border border-indigo-500/50 rounded">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-semibold text-indigo-200">Active Announcement</h4>
                    <Button
                      onClick={() => removeAnnouncement(activeAnnouncementId)}
                      size="sm"
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Remove
                    </Button>
                  </div>
                  <div className="text-indigo-100 bg-black/30 p-3 rounded">
                    {announcements.find(a => a.id === activeAnnouncementId)?.message || "Loading..."}
                  </div>
                </div>
              )}
              
              {/* Previous Announcements */}
              {announcements.length > 0 && (
                <div>
                  <h4 className="font-semibold text-indigo-200 mb-2">Previous Announcements</h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {announcements.filter(a => a.id !== activeAnnouncementId).map((announcement) => (
                      <div key={announcement.id} className="p-3 bg-black/30 border border-indigo-500/20 rounded">
                        <div className="flex justify-between items-start">
                          <p className="text-indigo-100 text-sm flex-1">{announcement.message}</p>
                          <Button
                            onClick={() => removeAnnouncement(announcement.id)}
                            size="sm"
                            variant="ghost"
                            className="text-red-400 hover:text-red-300 hover:bg-red-900/30 ml-2"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                        <p className="text-indigo-200/50 text-xs mt-1">
                          {announcement.timestamp.toLocaleDateString()} {announcement.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Selected User Info */}
          {selectedUserData && (
            <div className="mb-6 p-4 bg-black/30 border border-red-500/30 rounded">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-semibold text-red-200">
                  Selected: {selectedUserData.displayName}
                </h3>
                <div className="flex gap-2">
                  <Button
                    onClick={() => {
                      setShowRoleSelector(true);
                      setShowUsernameEditor(false);
                    }}
                    size="sm"
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <Key className="w-3 h-3 mr-1" />
                    Change Role
                  </Button>
                  <Button
                    onClick={() => {
                      setShowUsernameEditor(true);
                      setShowRoleSelector(false);
                      setNewUsername(selectedUserData.displayName || "");
                    }}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    Edit Name
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-red-200/60">Coins:</span>
                  <span className="ml-2 text-red-200 font-medium">{selectedUserData.coins?.toLocaleString() || 0}</span>
                </div>
                <div>
                  <span className="text-red-200/60">Clicks:</span>
                  <span className="ml-2 text-red-200 font-medium">{selectedUserData.clickCount?.toLocaleString() || 0}</span>
                </div>
                <div>
                  <span className="text-red-200/60">Chips:</span>
                  <span className="ml-2 text-red-200 font-medium">{getChipsDisplay(selectedUserData.chips)}</span>
                </div>
                <div>
                  <span className="text-red-200/60">Role:</span>
                  <span className={`ml-2 font-medium ${
                    selectedUserData.role === 'admin' ? 'text-red-400' :
                    selectedUserData.role === 'moderator' ? 'text-blue-400' :
                    selectedUserData.role === 'goodboy' ? 'text-green-400' :
                    'text-yellow-400'
                  }`}>
                    {selectedUserData.role || "user"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Role Selector Modal */}
          {showRoleSelector && selectedUserData && (
            <div className="mb-6 p-4 bg-black/40 border border-purple-500/30 rounded">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-purple-200">Change Role for {selectedUserData.displayName}</h3>
                <Button
                  onClick={() => setShowRoleSelector(false)}
                  variant="ghost"
                  size="sm"
                  className="text-purple-300 hover:text-purple-100"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
                {['admin', 'moderator', 'goodboy', 'user'].map((role) => (
                  <Button
                    key={role}
                    onClick={() => updateUserRole(selectedUserData.id, role)}
                    variant={selectedUserData.role === role ? "default" : "outline"}
                    className={`flex flex-col items-center h-20 ${
                      selectedUserData.role === role 
                        ? role === 'admin' ? 'bg-red-600 border-red-500' :
                          role === 'moderator' ? 'bg-blue-600 border-blue-500' :
                          role === 'goodboy' ? 'bg-green-600 border-green-500' :
                          'bg-gray-600 border-gray-500'
                        : 'border-purple-500/30 hover:bg-purple-900/30'
                    }`}
                  >
                    {role === 'admin' && <Crown className="w-5 h-5 mb-1" />}
                    {role === 'moderator' && <Shield className="w-5 h-5 mb-1" />}
                    {role === 'goodboy' && <Star className="w-5 h-5 mb-1" />}
                    {role === 'user' && <User className="w-5 h-5 mb-1" />}
                    <span className="font-semibold capitalize">{role}</span>
                    <span className="text-xs opacity-70">
                      {selectedUserData.role === role ? 'Current' : 'Set'}
                    </span>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Username Editor Modal */}
          {showUsernameEditor && selectedUserData && (
            <div className="mb-6 p-4 bg-black/40 border border-blue-500/30 rounded">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-blue-200">Edit Username for {selectedUserData.displayName}</h3>
                <Button
                  onClick={() => setShowUsernameEditor(false)}
                  variant="ghost"
                  size="sm"
                  className="text-blue-300 hover:text-blue-100"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-3">
                <div>
                  <Label className="text-blue-200">New Username</Label>
                  <Input
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="Enter new username..."
                    className="bg-black/50 border-blue-500/30 text-blue-100"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={updateUsername}
                    className="bg-blue-600 hover:bg-blue-700"
                    disabled={!newUsername.trim()}
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Update Username
                  </Button>
                  <Button
                    onClick={() => setShowUsernameEditor(false)}
                    variant="outline"
                    className="border-blue-500/30 text-blue-300 hover:bg-blue-900/30"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* User Selection */}
          <div className="space-y-4 mb-6">
            <div>
              <Label htmlFor="user-select" className="text-red-200">Select User</Label>
              <select
                id="user-select"
                className="w-full p-2 bg-black/50 border border-red-500/30 rounded text-red-100"
                value={selectedUserId}
                onChange={(e) => {
                  setSelectedUserId(e.target.value);
                  setShowRoleSelector(false);
                  setShowUsernameEditor(false);
                }}
              >
                <option value="">Choose a user...</option>
                {allUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.displayName || user.email || user.id} 
                    ({(user.coins || 0).toLocaleString()} coins) 
                    [{user.role || "user"}]
                  </option>
                ))}
              </select>
            </div>

            {/* Coin Management */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="coin-action" className="text-red-200">Action</Label>
                <select
                  id="coin-action"
                  className="w-full p-2 bg-black/50 border border-red-500/30 rounded text-red-100"
                  value={coinAction}
                  onChange={(e) => setCoinAction(e.target.value as "give" | "take")}
                >
                  <option value="give">Give Coins</option>
                  <option value="take">Take Coins</option>
                </select>
              </div>
              <div>
                <Label htmlFor="coin-amount" className="text-red-200">Amount</Label>
                <Input
                  id="coin-amount"
                  type="number"
                  value={coinAmount}
                  onChange={(e) => setCoinAmount(Number(e.target.value))}
                  className="bg-black/50 border-red-500/30 text-red-100"
                  min="1"
                />
              </div>
              <div className="flex items-end">
                <Button 
                  onClick={manageCoins} 
                  className={`w-full ${coinAction === "give" ? "bg-green-600 hover:bg-green-700" : "bg-orange-600 hover:bg-orange-700"}`}
                  disabled={!selectedUserId || coinAmount <= 0}
                >
                  {coinAction === "give" ? (
                    <Plus className="w-4 h-4 mr-2" />
                  ) : (
                    <Minus className="w-4 h-4 mr-2" />
                  )}
                  {coinAction === "give" ? "Give" : "Take"} Coins
                </Button>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            {/* Data Tools */}
            <Button 
              onClick={findProblematicUsers}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              Scan Issues
            </Button>

            <Button 
              onClick={fixAllDataIssues}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Wrench className="w-4 h-4 mr-2" />
              Fix All Data
            </Button>

            <Button 
              onClick={loadAllUsers} 
              className="bg-blue-600 hover:bg-blue-700"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Users
            </Button>

            {/* User Management */}
            <Button 
              onClick={setCustomChipsPrompt}
              className="bg-indigo-600 hover:bg-indigo-700"
              disabled={!selectedUserId}
            >
              <DollarSign className="w-4 h-4 mr-2" />
              Set Chips
            </Button>

<Button 
  onClick={debugAnnouncements}
  className="bg-gray-600 hover:bg-gray-700"
>
  Debug Announcements
</Button>

            <Button 
              onClick={toggleUpgradesLock}
              className={selectedUserData?.upgradesLocked ? "bg-red-600 hover:bg-red-700" : "bg-orange-600 hover:bg-orange-700"}
              disabled={!selectedUserId}
            >
              <Lock className="w-4 h-4 mr-2" />
              {selectedUserData?.upgradesLocked ? "Unlock Upgrades" : "Lock Upgrades"}
            </Button>

            <Button 
              onClick={toggleEconomyFreeze}
              className={selectedUserData?.economyFrozen ? "bg-cyan-600 hover:bg-cyan-700" : "bg-gray-600 hover:bg-gray-700"}
              disabled={!selectedUserId}
            >
              <Snowflake className="w-4 h-4 mr-2" />
              {selectedUserData?.economyFrozen ? "Unfreeze Economy" : "Freeze Economy"}
            </Button>

            {/* Reset Options */}
            <Button 
              onClick={softReset}
              className="bg-orange-600 hover:bg-orange-700"
              disabled={!selectedUserId}
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Soft Reset
            </Button>

            <Button 
              onClick={hardReset}
              className="bg-red-700 hover:bg-red-800"
              disabled={!selectedUserId}
            >
              <Ban className="w-4 h-4 mr-2" />
              Hard Reset
            </Button>

<Button 
  onClick={forceAnnouncementToUser}
  className="bg-pink-600 hover:bg-pink-700"
  disabled={!selectedUserId}
>
  Force to Selected User
</Button>

            <Button 
              onClick={resetUserData} 
              className="bg-red-600 hover:bg-red-700"
              disabled={!selectedUserId}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Reset Data
            </Button>

            <Button 
              onClick={removeFromLeaderboard} 
              className="bg-pink-600 hover:bg-pink-700"
              disabled={!selectedUserId}
            >
              <Users className="w-4 h-4 mr-2" />
              Remove Leaderboard
            </Button>
          </div>

          {/* Message Display */}
          {message && (
            <Alert className="border-red-500/50 bg-red-900/20 mb-6">
              <AlertDescription className="text-red-200">{message}</AlertDescription>
            </Alert>
          )}

          {/* Users List */}
          <div className="mt-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold text-red-200">All Users ({allUsers.length})</h3>
              <div className="flex items-center gap-2 text-sm text-red-200/60">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span>Admin Only</span>
                </div>
              </div>
            </div>
            
            {loading ? (
              <p className="text-red-200/60 text-center py-8">Loading users...</p>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                {allUsers.map((user) => (
                  <div 
                    key={user.id} 
                    className={`p-3 rounded border cursor-pointer transition-all hover:bg-red-900/20 ${
                      selectedUserId === user.id 
                        ? 'bg-red-900/30 border-red-500' 
                        : 'bg-black/30 border-red-500/20'
                    } ${user.hasIssues ? 'border-yellow-500 bg-yellow-900/20' : ''}`}
                    onClick={() => setSelectedUserId(user.id)}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-red-100 truncate">
                            {user.displayName || user.email || user.id}
                          </p>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            user.role === 'admin' 
                              ? 'bg-red-500/20 text-red-300' 
                              : user.role === 'moderator'
                              ? 'bg-blue-500/20 text-blue-300'
                              : user.role === 'goodboy'
                              ? 'bg-green-500/20 text-green-300'
                              : 'bg-gray-500/20 text-gray-300'
                          }`}>
                            {user.role || "user"}
                          </span>
                          {user.upgradesLocked && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500 text-white">
                              🔒
                            </span>
                          )}
                          {user.economyFrozen && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500 text-white">
                              ❄️
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-3 mt-1 text-xs text-red-200/60">
                          <span>Coins: {(user.coins || 0).toLocaleString()}</span>
                          <span>Clicks: {(user.clickCount || 0).toLocaleString()}</span>
                          <span>Chips: {getChipsDisplay(user.chips)}</span>
                          <span>Role: {user.role || "user"}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedUserId(user.id);
                            setShowRoleSelector(true);
                          }}
                          size="sm"
                          variant="ghost"
                          className="text-purple-400 hover:text-purple-300 hover:bg-purple-900/30"
                        >
                          <Key className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}