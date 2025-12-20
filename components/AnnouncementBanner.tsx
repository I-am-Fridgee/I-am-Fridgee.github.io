// components/AnnouncementBanner.tsx - DEBUG VERSION
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, onSnapshot } from "firebase/firestore";
import { X, Megaphone, Bug, AlertCircle } from "lucide-react";

export default function AnnouncementBanner() {
  const { user } = useAuth();
  const [showBanner, setShowBanner] = useState(false);
  const [announcementMessage, setAnnouncementMessage] = useState("");
  const [announcementId, setAnnouncementId] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [showDebugPanel, setShowDebugPanel] = useState(true); // Set to true for debugging

  const addDebug = (message: string) => {
    console.log(`🔍 ${message}`);
    setDebugInfo(prev => [...prev.slice(-9), `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  useEffect(() => {
    addDebug("Component mounted");
    addDebug(`User ID: ${user?.uid || "No user"}`);
  }, []);

  useEffect(() => {
    if (!user?.uid) {
      addDebug("No user ID, skipping setup");
      return;
    }

    addDebug(`Setting up listener for user: ${user.uid}`);
    
    const userRef = doc(db, "players", user.uid);
    
    const unsubscribe = onSnapshot(userRef, async (userDoc) => {
      addDebug(`🔥 User document updated (exists: ${userDoc.exists()})`);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const hasUnread = userData.hasUnreadAnnouncement === true;
        const activeAnnId = userData.activeAnnouncement;
        
        addDebug(`📊 User data: hasUnread=${hasUnread}, activeAnnouncement=${activeAnnId}`);
        
        if (hasUnread && activeAnnId) {
          addDebug(`🎯 Found unread announcement: ${activeAnnId}`);
          
          try {
            // Try to get the announcement
            const announcementRef = doc(db, "announcements", activeAnnId);
            const announcementDoc = await getDoc(announcementRef);
            
            if (announcementDoc.exists()) {
              const annData = announcementDoc.data();
              addDebug(`📄 Announcement found: ${annData.message?.substring(0, 50)}...`);
              
              if (annData.message) {
                setAnnouncementMessage(annData.message);
                setAnnouncementId(activeAnnId);
                setShowBanner(true);
                addDebug("✅ Setting showBanner to TRUE");
              } else {
                addDebug("❌ Announcement has no message");
                setShowBanner(false);
              }
            } else {
              addDebug(`❌ Announcement document ${activeAnnId} not found in Firestore`);
              // Clear invalid reference
              await updateDoc(userRef, {
                activeAnnouncement: null,
                hasUnreadAnnouncement: false
              });
              setShowBanner(false);
            }
          } catch (error) {
            addDebug(`❌ Error fetching announcement: ${error}`);
            setShowBanner(false);
          }
        } else {
          addDebug("📭 No unread announcement found in user data");
          setShowBanner(false);
        }
      } else {
        addDebug("❌ User document doesn't exist");
        setShowBanner(false);
      }
    }, (error) => {
      addDebug(`🔥 Error in listener: ${error.message}`);
      console.error("Firestore listener error:", error);
    });

    return () => {
      addDebug("🔄 Cleaning up listener");
      unsubscribe();
    };
  }, [user]);

  const handleClose = async () => {
    addDebug("Closing banner");
    setShowBanner(false);
    
    if (user?.uid) {
      try {
        await updateDoc(doc(db, "players", user.uid), {
          hasUnreadAnnouncement: false
        });
        addDebug("✅ Marked as read in Firestore");
      } catch (error) {
        addDebug(`❌ Error marking as read: ${error}`);
      }
    }
  };

  // Manual test function - add to browser console
  const manualTest = async () => {
    if (!user?.uid) {
      addDebug("No user for manual test");
      return;
    }
    
    addDebug("🧪 Starting manual test...");
    
    try {
      // Get current user data
      const userDoc = await getDoc(doc(db, "players", user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        addDebug(`🧪 Current user data: hasUnread=${data.hasUnreadAnnouncement}, annId=${data.activeAnnouncement}`);
        
        // Check announcements collection
        const announcementsSnap = await getDocs(collection(db, "announcements"));
        addDebug(`🧪 Total announcements in DB: ${announcementsSnap.size}`);
        
        announcementsSnap.forEach(doc => {
          addDebug(`🧪 Announcement ${doc.id}: ${doc.data().message?.substring(0, 30)}...`);
        });
      }
    } catch (error) {
      addDebug(`🧪 Test error: ${error}`);
    }
  };

  // Export for console access
  if (typeof window !== 'undefined') {
    (window as any).testAnnouncement = manualTest;
  }

  return (
    <>
      {/* Debug panel - always visible during debugging */}
      {showDebugPanel && (
        <div className="fixed bottom-4 right-4 z-50 w-80 bg-black/80 border border-red-500 rounded-lg p-3 text-xs">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Bug className="w-4 h-4 text-red-400" />
              <span className="font-bold text-red-300">Announcement Debug</span>
            </div>
            <button 
              onClick={() => setShowDebugPanel(false)}
              className="text-gray-400 hover:text-white"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
          
          <div className="space-y-1 mb-2">
            <div className="flex justify-between">
              <span className="text-gray-300">User:</span>
              <span className="text-blue-300">{user?.uid?.substring(0, 8)}...</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Show Banner:</span>
              <span className={showBanner ? "text-green-400 font-bold" : "text-red-400"}>{showBanner ? "YES" : "NO"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Message:</span>
              <span className="text-yellow-300">{announcementMessage ? "Has message" : "No message"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Ann ID:</span>
              <span className="text-purple-300">{announcementId?.substring(0, 8)}...</span>
            </div>
          </div>
          
          <div className="max-h-32 overflow-y-auto bg-gray-900/50 rounded p-2">
            {debugInfo.map((info, i) => (
              <div key={i} className="text-gray-400 font-mono text-[10px]">
                {info}
              </div>
            ))}
          </div>
          
          <button
            onClick={manualTest}
            className="mt-2 w-full bg-blue-600 hover:bg-blue-700 text-white py-1 rounded text-xs"
          >
            Run Test
          </button>
        </div>
      )}

      {/* Actual Announcement Banner */}
      {showBanner && announcementMessage && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-40 w-full max-w-2xl animate-in slide-in-from-top-5 duration-300">
          <div className="bg-gradient-to-r from-purple-900/95 to-indigo-900/95 border-2 border-purple-500 rounded-lg shadow-2xl backdrop-blur-md">
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Megaphone className="w-5 h-5 text-yellow-300" />
                  <span className="text-sm font-bold text-yellow-300">ADMIN ANNOUNCEMENT</span>
                </div>
                <button
                  onClick={handleClose}
                  className="p-1 hover:bg-purple-800/50 rounded transition-colors"
                  aria-label="Close announcement"
                >
                  <X className="w-5 h-5 text-red-300" />
                </button>
              </div>
              
              <div className="bg-black/30 rounded-lg p-3 border border-purple-500/30 mb-2">
                <p className="text-white text-base">{announcementMessage}</p>
              </div>
              
              <div className="text-xs text-purple-300">
                Click the X button above to close this message
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}