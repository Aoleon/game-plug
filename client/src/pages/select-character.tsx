import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { motion, AnimatePresence } from "framer-motion";
import { 
  User, UserPlus, Heart, Brain, Shield, 
  Zap, LogOut, Plus, Check 
} from "lucide-react";
import type { Character, GameSession } from "@shared/schema";

export default function SelectCharacter() {
  const params = useParams();
  const sessionId = params.sessionId;
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);

  // Verify we have session info
  useEffect(() => {
    const storedSessionId = localStorage.getItem('currentSessionId');
    if (!storedSessionId || storedSessionId !== sessionId) {
      setLocation('/join');
    }
  }, [sessionId, setLocation]);

  const { data: session, isLoading: sessionLoading } = useQuery<GameSession>({
    queryKey: ["/api/sessions", sessionId],
    retry: false,
    enabled: !!sessionId,
  });

  const { data: characters = [], isLoading: charactersLoading, refetch } = useQuery<Character[]>({
    queryKey: ["/api/sessions", sessionId, "characters"],
    retry: false,
    enabled: !!sessionId,
  });

  const handleSelectCharacter = async () => {
    if (!selectedCharacterId) return;

    setIsJoining(true);
    try {
      // Store selected character in localStorage
      localStorage.setItem('currentCharacterId', selectedCharacterId);
      
      const character = characters.find(c => c.id === selectedCharacterId);
      if (character) {
        localStorage.setItem('currentCharacterName', character.name);
      }

      // Navigate to character sheet
      setLocation(`/character/${selectedCharacterId}`);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de sélectionner ce personnage.",
        variant: "destructive"
      });
    } finally {
      setIsJoining(false);
    }
  };

  const handleCreateCharacter = () => {
    // Store session context and redirect to character creation
    localStorage.setItem('createCharacterForSession', sessionId || '');
    setLocation('/create-character');
  };

  const handleLeaveSession = () => {
    // Clear session data
    localStorage.removeItem('currentSessionId');
    localStorage.removeItem('currentSessionCode');
    localStorage.removeItem('currentSessionName');
    localStorage.removeItem('currentCharacterId');
    localStorage.removeItem('currentCharacterName');
    
    setLocation('/join');
  };

  if (sessionLoading || charactersLoading) {
    return (
      <div className="min-h-screen bg-deep-black flex items-center justify-center">
        <div className="text-aged-gold text-xl font-cinzel">Chargement...</div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-deep-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-cinzel text-aged-gold mb-4">Session introuvable</h1>
          <Button
            onClick={() => setLocation('/join')}
            className="bg-blood-burgundy hover:bg-dark-crimson text-bone-white"
          >
            Rejoindre une autre session
          </Button>
        </div>
      </div>
    );
  }

  const sessionCode = localStorage.getItem('currentSessionCode');

  return (
    <div className="min-h-screen bg-deep-black p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <Card className="bg-charcoal border-aged-gold parchment-bg mb-6">
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="font-cinzel text-2xl font-bold text-aged-gold mb-1">
                  {session.name}
                </h1>
                <p className="text-aged-parchment">
                  {session.status === 'active' ? 'Session Active' : 'Session en Préparation'}
                </p>
              </div>
              <div className="flex items-center gap-4">
                {sessionCode && (
                  <Badge variant="outline" className="text-lg px-4 py-2 font-mono">
                    {sessionCode}
                  </Badge>
                )}
                <Button
                  variant="outline"
                  onClick={handleLeaveSession}
                  className="text-aged-gold border-aged-gold hover:bg-aged-gold/10"
                  data-testid="button-leave-session"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Quitter
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Character Selection */}
        <Card className="bg-charcoal border-aged-gold parchment-bg">
          <CardHeader>
            <CardTitle className="font-cinzel text-aged-gold flex items-center gap-2">
              <User className="h-6 w-6" />
              Sélectionner un Personnage
            </CardTitle>
            <p className="text-aged-parchment text-sm mt-2">
              Choisissez un personnage existant ou créez-en un nouveau
            </p>
          </CardHeader>
          <CardContent>
            {characters.length === 0 ? (
              <div className="text-center py-12">
                <div className="mb-6">
                  <UserPlus className="h-16 w-16 text-aged-gold/50 mx-auto mb-4" />
                  <p className="text-aged-parchment">
                    Aucun personnage disponible dans cette session
                  </p>
                </div>
                <Button
                  onClick={handleCreateCharacter}
                  className="bg-blood-burgundy hover:bg-dark-crimson text-bone-white"
                  data-testid="button-create-first-character"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Créer votre premier personnage
                </Button>
              </div>
            ) : (
              <>
                <ScrollArea className="h-[400px] pr-4">
                  <div className="grid gap-4">
                    {characters.map((character, index) => (
                      <motion.div
                        key={character.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Card
                          className={`cursor-pointer transition-all ${
                            selectedCharacterId === character.id
                              ? 'bg-aged-gold/20 border-aged-gold'
                              : 'bg-cosmic-void/50 border-aged-gold/30 hover:border-aged-gold/60'
                          }`}
                          onClick={() => setSelectedCharacterId(character.id)}
                          data-testid={`character-card-${character.id}`}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start gap-4">
                              {character.avatarUrl ? (
                                <img 
                                  src={character.avatarUrl} 
                                  alt={character.name}
                                  className="w-20 h-20 rounded-lg object-cover border-2 border-aged-gold/50"
                                />
                              ) : (
                                <div className="w-20 h-20 rounded-lg bg-aged-gold/10 flex items-center justify-center">
                                  <User className="h-10 w-10 text-aged-gold/50" />
                                </div>
                              )}
                              
                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-2">
                                  <h3 className="font-cinzel text-lg text-aged-gold">
                                    {character.name}
                                  </h3>
                                  {selectedCharacterId === character.id && (
                                    <AnimatePresence>
                                      <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        exit={{ scale: 0 }}
                                      >
                                        <Check className="h-5 w-5 text-aged-gold" />
                                      </motion.div>
                                    </AnimatePresence>
                                  )}
                                </div>
                                
                                <div className="text-sm text-aged-parchment mb-3">
                                  {character.occupation} • {character.age} ans
                                </div>
                                
                                <div className="grid grid-cols-4 gap-2">
                                  <div className="text-center bg-cosmic-void rounded p-2">
                                    <Heart className="h-4 w-4 text-red-400 mx-auto mb-1" />
                                    <div className="text-xs text-bone-white">
                                      {character.hitPoints}/{character.maxHitPoints}
                                    </div>
                                  </div>
                                  <div className="text-center bg-cosmic-void rounded p-2">
                                    <Brain className="h-4 w-4 text-purple-400 mx-auto mb-1" />
                                    <div className="text-xs text-bone-white">
                                      {character.sanity}/{character.maxSanity}
                                    </div>
                                  </div>
                                  <div className="text-center bg-cosmic-void rounded p-2">
                                    <Shield className="h-4 w-4 text-blue-400 mx-auto mb-1" />
                                    <div className="text-xs text-bone-white">
                                      {character.magicPoints}/{character.maxMagicPoints}
                                    </div>
                                  </div>
                                  <div className="text-center bg-cosmic-void rounded p-2">
                                    <Zap className="h-4 w-4 text-yellow-400 mx-auto mb-1" />
                                    <div className="text-xs text-bone-white">
                                      {character.luck}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </ScrollArea>

                <div className="flex gap-4 mt-6">
                  <Button
                    onClick={handleCreateCharacter}
                    variant="outline"
                    className="flex-1 border-aged-gold text-aged-gold hover:bg-aged-gold/10"
                    data-testid="button-create-new-character"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Créer un nouveau personnage
                  </Button>
                  
                  <Button
                    onClick={handleSelectCharacter}
                    disabled={!selectedCharacterId || isJoining}
                    className="flex-1 bg-blood-burgundy hover:bg-dark-crimson text-bone-white"
                    data-testid="button-select-character"
                  >
                    {isJoining ? (
                      <span className="flex items-center gap-2">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        >
                          <User className="h-4 w-4" />
                        </motion.div>
                        Connexion...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <Check className="h-4 w-4" />
                        Jouer avec ce personnage
                      </span>
                    )}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}