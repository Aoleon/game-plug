import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DiceSoundProvider } from "@/components/dice-sound-manager";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import CharacterCreation from "@/pages/character-creation";
import CharacterSheet from "@/pages/character-sheet";
import CharacterEdit from "@/pages/character-edit";
import GMDashboardSimplified from "@/pages/gm-dashboard-simplified";
import GameBoard from "@/pages/gameboard";
import SessionManager from "@/pages/session-manager";
import JoinSession from "@/pages/join-session";
import SelectCharacter from "@/pages/select-character";
import GMSignup from "@/pages/gm-signup";
import GMLogin from "@/pages/gm-login";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  // Debug logging
  if (process.env.NODE_ENV === 'development') {
    console.log('Router state:', { isAuthenticated, isLoading });
  }

  return (
    <Switch>
      {/* Public routes - always accessible */}
      <Route path="/join" component={JoinSession} />
      <Route path="/gm-signup" component={GMSignup} />
      <Route path="/gm-login" component={GMLogin} />
      <Route path="/session/:sessionId/select-character" component={SelectCharacter} />
      <Route path="/character/:id" component={CharacterSheet} />
      <Route path="/create-character" component={CharacterCreation} />
      <Route path="/character-creation" component={CharacterCreation} />
      
      {/* GM routes - require authentication */}
      {isLoading || !isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={Home} />
          <Route path="/gm/:sessionId" component={GMDashboardSimplified} />
          <Route path="/gm/:sessionId/gameboard" component={GameBoard} />
          <Route path="/character-creation/:sessionId" component={CharacterCreation} />
          <Route path="/character-edit/:sessionId/:id" component={CharacterEdit} />
          <Route path="/sessions" component={SessionManager} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
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
