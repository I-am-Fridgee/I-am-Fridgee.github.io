// App.tsx - Original version without anti-cheat
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";
import Home from "./pages/Home";
import AdminPanel from "@/components/AdminPanel";
import ProtectedRoute from "@/components/ProtectedRoute";
import GoodBoyPanel from "./components/GoodBoyPanel";

function Router() {
  return (
    <Switch>
      <Route path="/goodboy">
        <ProtectedRoute>
          <GoodBoyPanel />
        </ProtectedRoute>
      </Route>
      <Route path="/" component={Home} />
      <Route path="/admin">
        <ProtectedRoute>
          <AdminPanel />
        </ProtectedRoute>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ThemeProvider
          defaultTheme="light"
          // switchable
        >
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </ThemeProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;