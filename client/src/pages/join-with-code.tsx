import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Dice6, Loader2 } from "lucide-react";

export default function JoinWithCode() {
  const params = useParams();
  const sessionCode = params.code?.toUpperCase() || "";
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const joinSession = async () => {
      if (!sessionCode || sessionCode.length !== 6) {
        setError("Code de session invalide");
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/sessions/join/${sessionCode}`);
        
        if (!response.ok) {
          throw new Error("Session not found");
        }
        
        const session = await response.json();
        
        if (session && session.id) {
          localStorage.setItem('currentSessionId', session.id);
          localStorage.setItem('currentSessionCode', sessionCode);
          localStorage.setItem('currentSessionName', session.name);
          
          setLocation(`/session/${session.id}/select-character`);
        }
      } catch (error: any) {
        console.error("Error joining session:", error);
        setError("Session introuvable ou inactive");
        setIsLoading(false);
        
        toast({
          title: "Session introuvable",
          description: "Aucune session active trouvée avec ce code.",
          variant: "destructive"
        });
        
        setTimeout(() => {
          setLocation("/join");
        }, 2000);
      }
    };

    joinSession();
  }, [sessionCode, setLocation, toast]);

  if (error) {
    return (
      <div className="min-h-screen bg-deep-black flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <Card className="bg-charcoal border-blood-burgundy parchment-bg">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-blood-burgundy/10 rounded-full">
                  <Dice6 className="h-12 w-12 text-blood-burgundy" />
                </div>
              </div>
              <CardTitle className="font-cinzel text-2xl text-blood-burgundy">
                Session Introuvable
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-aged-parchment">
                {error}
              </p>
              <p className="text-aged-parchment/60 text-sm">
                Redirection vers la page de connexion...
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-deep-black flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <Card className="bg-charcoal border-aged-gold parchment-bg">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-aged-gold/10 rounded-full">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <Dice6 className="h-12 w-12 text-aged-gold" />
                </motion.div>
              </div>
            </div>
            <CardTitle className="font-cinzel text-2xl text-aged-gold">
              Connexion en cours...
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-aged-parchment">
              Vérification de la session <span className="font-mono font-bold text-aged-gold">{sessionCode}</span>
            </p>
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-aged-gold" />
              <span className="text-aged-parchment/60 text-sm">
                Préparation de votre aventure...
              </span>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
