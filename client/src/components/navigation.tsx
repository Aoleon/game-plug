import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Eye, User, Users, LogOut } from "lucide-react";

export default function Navigation() {
  const { user } = useAuth();
  const [location] = useLocation();
  
  const isPlayerView = location === "/" || location.startsWith("/character");
  const isGMView = location.startsWith("/gm");

  return (
    <>
      {/* Desktop Navigation */}
      <nav className="bg-cosmic-void border-b border-aged-gold sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <h1 className="font-cinzel text-xl font-bold text-aged-gold hover:text-bone-white transition-colors">
                  L'Appel de Cthulhu
                </h1>
              </Link>
              <div className="hidden md:flex space-x-4 text-sm font-source">
                <Link href="/">
                  <Button
                    variant="ghost"
                    className={`text-bone-white hover:text-aged-gold transition-colors ${
                      isPlayerView ? 'bg-aged-gold text-deep-black' : ''
                    }`}
                    data-testid="nav-button-player"
                  >
                    <User className="mr-2 h-4 w-4" />
                    Joueur
                  </Button>
                </Link>
                {/* GM button would typically link to a session selection or recent session */}
                <Button
                  variant="ghost"
                  className={`text-bone-white hover:text-aged-gold transition-colors ${
                    isGMView ? 'bg-aged-gold text-deep-black' : ''
                  }`}
                  data-testid="nav-button-gm"
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Maître de Jeu
                </Button>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {user && (
                <>
                  <div className="hidden md:flex items-center space-x-2 text-sm">
                    <span className="text-aged-parchment">Connecté:</span>
                    <span className="text-bone-white">
                      {user.firstName} {user.lastName}
                    </span>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.location.href = '/api/logout'}
                    className="text-bone-white hover:text-aged-gold"
                    data-testid="button-logout"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </>
              )}
              
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-eldritch-green rounded-full animate-pulse"></div>
                <span className="text-sm font-source text-aged-parchment hidden sm:inline">
                  En ligne
                </span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <div className="md:hidden bg-charcoal border-b border-aged-gold">
        <div className="flex">
          <Link href="/" className="flex-1">
            <Button
              variant="ghost"
              className={`w-full py-3 text-center text-bone-white hover:text-aged-gold transition-colors ${
                isPlayerView ? 'bg-aged-gold text-deep-black' : ''
              }`}
              data-testid="mobile-nav-player"
            >
              <div className="flex flex-col items-center">
                <User className="h-4 w-4 mb-1" />
                <span className="text-xs">Joueur</span>
              </div>
            </Button>
          </Link>
          
          <Button
            variant="ghost"
            className={`flex-1 py-3 text-center text-bone-white hover:text-aged-gold transition-colors ${
              isGMView ? 'bg-aged-gold text-deep-black' : ''
            }`}
            data-testid="mobile-nav-gm"
          >
            <div className="flex flex-col items-center">
              <Eye className="h-4 w-4 mb-1" />
              <span className="text-xs">Maître</span>
            </div>
          </Button>
        </div>
      </div>
    </>
  );
}
