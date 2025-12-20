import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

// Create a simple wrapper for Firebase auth
import { auth } from "./lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useState, useEffect } from "react";

// Simple component to handle auth state
function AuthWrapper({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return <>{children}</>;
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthWrapper>
      <App />
    </AuthWrapper>
  </React.StrictMode>
);
