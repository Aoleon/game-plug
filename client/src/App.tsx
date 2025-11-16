import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DiceSoundProvider } from "@/components/dice-sound-manager";
import { useAuth } from "@/hooks/useAuth";
import { lazy, Suspense } from "react";

// Lazy loading des pages pour réduire la taille du bundle initial
const Landing = lazy(() => import("@/pages/landing"));
const Home = lazy(() => import("@/pages/home"));
const CharacterCreation = lazy(() => import("@/pages/character-creation"));
const CharacterSheet = lazy(() => import("@/pages/character-sheet"));
const CharacterEdit = lazy(() => import("@/pages/character-edit"));
const GMDashboardSimplified = lazy(() => import("@/pages/gm-dashboard-simplified"));
const GameBoard = lazy(() => import("@/pages/gameboard"));
const SessionManager = lazy(() => import("@/pages/session-manager"));
const JoinSession = lazy(() => import("@/pages/join-session"));
const SelectCharacter = lazy(() => import("@/pages/select-character"));
const GMSignup = lazy(() => import("@/pages/gm-signup"));
const GMLogin = lazy(() => import("@/pages/gm-login"));
const NotFound = lazy(() => import("@/pages/not-found"));

// Composant de chargement optimisé
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
);

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  // Debug logging
  if (process.env.NODE_ENV === 'development') {
    console.log('Router state:', { isAuthenticated, isLoading });
  }

  return (
    <Suspense fallback={<LoadingFallback />}>
      <Switch>
        {/* Public routes - always accessible */}
        <Route path="/join" component={JoinSession} />
        <Route path="/gm-signup" component={GMSignup} />
        <Route path="/gm-login" component={GMLogin} />
        <Route path="/session/:sessionId/select-character" component={SelectCharacter} />
        <Route path="/character/:id" component={CharacterSheet} />
        <Route path="/create-character" component={CharacterCreation} />
        <Route path="/character-creation" component={CharacterCreation} />
        <Route path="/gm/:sessionId/gameboard" component={GameBoard} />
        
        {/* GM routes - require authentication */}
        {isLoading || !isAuthenticated ? (
          <Route path="/" component={Landing} />
        ) : (
          <>
            <Route path="/" component={Home} />
            <Route path="/gm/:sessionId" component={GMDashboardSimplified} />
            <Route path="/character-creation/:sessionId" component={CharacterCreation} />
            <Route path="/character-edit/:sessionId/:id" component={CharacterEdit} />
            <Route path="/sessions" component={SessionManager} />
          </>
        )}
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <DiceSoundProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </DiceSoundProvider>
    </QueryClientProvider>
  );
}

export default App;
