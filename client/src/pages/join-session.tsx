import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { motion } from "framer-motion";
import { Dice6, Users, BookOpen } from "lucide-react";

export default function JoinSession() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [sessionCode, setSessionCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleJoinSession = async () => {
    if (sessionCode.length !== 6) {
      toast({
        title: "Code invalide",
        description: "Le code de session doit contenir 6 caractères.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      // Verify session exists and is active
      const response = await apiRequest("GET", `/api/sessions/join/${sessionCode.toUpperCase()}`);
      const session = await response.json();
      
      if (session && session.id) {
        // Store session info in localStorage
        localStorage.setItem('currentSessionId', session.id);
        localStorage.setItem('currentSessionCode', sessionCode.toUpperCase());
        localStorage.setItem('currentSessionName', session.name);
        
        // Redirect to character selection
        setLocation(`/session/${session.id}/select-character`);
      }
    } catch (error: any) {
      console.error("Error joining session:", error);
      toast({
        title: "Session introuvable",
        description: "Aucune session active trouvée avec ce code.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-deep-black flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="bg-charcoal border-aged-gold parchment-bg">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-aged-gold/10 rounded-full">
                <Dice6 className="h-12 w-12 text-aged-gold" />
              </div>
            </div>
            <CardTitle className="font-cinzel text-3xl text-aged-gold">
              Rejoindre une Session
            </CardTitle>
            <p className="text-aged-parchment mt-2">
              Entrez le code fourni par votre Maître de Jeu
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="session-code" className="text-bone-white">
                Code de Session
              </Label>
              <Input
                id="session-code"
                type="text"
                value={sessionCode}
                onChange={(e) => setSessionCode(e.target.value.toUpperCase().slice(0, 6))}
                placeholder="ABC123"
                className="bg-cosmic-void border-aged-gold/50 text-bone-white text-center text-2xl font-mono tracking-widest"
                maxLength={6}
                disabled={isLoading}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleJoinSession();
                  }
                }}
                data-testid="input-session-code"
              />
              <p className="text-xs text-aged-parchment/60 text-center">
                Code à 6 caractères (lettres et chiffres)
              </p>
            </div>

            <Button
              onClick={handleJoinSession}
              disabled={isLoading || sessionCode.length !== 6}
              className="w-full bg-blood-burgundy hover:bg-dark-crimson text-bone-white"
              data-testid="button-join-session"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Dice6 className="h-5 w-5" />
                  </motion.div>
                  Connexion...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Rejoindre la Session
                </span>
              )}
            </Button>

            <div className="border-t border-aged-gold/20 pt-4">
              <div className="flex items-center justify-center gap-4 text-sm">
                <Button
                  variant="ghost"
                  onClick={() => setLocation("/")}
                  className="text-aged-parchment hover:text-aged-gold"
                  data-testid="button-back-home"
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  Retour à l'accueil
                </Button>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-cosmic-void/50 rounded-lg p-4 space-y-2">
              <h3 className="font-cinzel text-sm text-aged-gold">Comment obtenir un code ?</h3>
              <ul className="text-xs text-aged-parchment/80 space-y-1 list-disc list-inside">
                <li>Demandez le code à votre Maître de Jeu</li>
                <li>Le code est affiché dans son interface MJ</li>
                <li>Le code reste actif tant que la session est ouverte</li>
                <li>Vous pourrez créer ou choisir un personnage après connexion</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}