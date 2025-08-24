import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useToast } from "@/hooks/use-toast";
import { useWebSocket } from "@/hooks/useWebSocket";
import Navigation from "@/components/navigation";
import ConnectionIndicator from "@/components/connection-indicator";
import RollHistoryVisual from "@/components/roll-history-visual";
import GMSecretRoll from "@/components/gm-secret-roll";
import NarrativeTools from "@/components/narrative-tools";
import AmbientSoundController from "@/components/ambient-sound-controller";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { rollDice, parseDiceFormula } from "@/lib/dice";
import { SANITY_PRESETS, PHOBIAS, MANIAS } from "@/lib/cthulhu-data";
import { useDiceSound } from "@/components/dice-sound-manager";
import { 
  Eye, EyeOff, Dice6, Heart, Brain, Plus, Minus, Wand2, 
  Users, Clock, AlertTriangle, BookOpen 
} from "lucide-react";
import type { Character, GameSession, SanityCondition, ActiveEffect } from "@shared/schema";

interface CharacterWithDetails extends Character {
  sanityConditions: SanityCondition[];
  activeEffects: ActiveEffect[];
}

export default function GMDashboard() {
  const params = useParams();
  const sessionId = params.sessionId;
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const { playRoll, playCritical, playFumble } = useDiceSound();
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [effectModalOpen, setEffectModalOpen] = useState(false);
  const [effectType, setEffectType] = useState<string>("");
  const [customDice, setCustomDice] = useState("");
  const [rollResults, setRollResults] = useState<Array<{ result: number; dice: string; timestamp: Date }>>([]);
  const [isSecretRoll, setIsSecretRoll] = useState(false);

  // WebSocket connection for real-time updates
  const { isConnected, sendMessage, lastMessage } = useWebSocket("/ws");

  useEffect(() => {
    if (isConnected && sessionId) {
      sendMessage('join_session', { sessionId });
    }
  }, [isConnected, sessionId, sendMessage]);

  useEffect(() => {
    if (lastMessage && lastMessage.type === 'roll_result') {
      // Refresh character data when rolls are made
      queryClient.invalidateQueries({ queryKey: ["/api/sessions", sessionId, "characters"] });
    }
  }, [lastMessage, sessionId]);

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Non autorisé",
        description: "Vous êtes déconnecté. Connexion en cours...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: session, isLoading: sessionLoading } = useQuery<GameSession>({
    queryKey: ["/api/sessions", sessionId],
    retry: false,
    enabled: !!sessionId,
  });

  const { data: characters = [], isLoading: charactersLoading } = useQuery<CharacterWithDetails[]>({
    queryKey: ["/api/sessions", sessionId, "characters"],
    retry: false,
    enabled: !!sessionId,
  });

  const applySanityLossMutation = useMutation({
    mutationFn: async ({ characterId, loss }: { characterId: string; loss: string }) => {
      // Parse and roll the dice
      const diceResult = rollDice(loss);
      
      // Get current character to calculate new sanity
      const character = characters.find(c => c.id === characterId);
      if (!character) throw new Error("Character not found");
      
      const newSanity = Math.max(0, character.sanity - diceResult.total);
      
      // Update character sanity
      await apiRequest("PATCH", `/api/characters/${characterId}`, {
        sanity: newSanity
      });

      // Check for madness conditions based on sanity loss
      if (diceResult.total >= 5) {
        // Temporary madness - add random phobia or mania
        const isPhobia = Math.random() > 0.5;
        const conditionList = isPhobia ? PHOBIAS : MANIAS;
        const randomCondition = conditionList[Math.floor(Math.random() * conditionList.length)];
        
        await apiRequest("POST", `/api/characters/${characterId}/sanity-conditions`, {
          type: isPhobia ? 'phobia' : 'mania',
          name: randomCondition,
          duration: 'temporary'
        });
      }

      return { sanityLoss: diceResult.total, newSanity };
    },
    onSuccess: (data) => {
      toast({
        title: "Perte de sanité appliquée",
        description: `${data.sanityLoss} points perdus. Sanité restante: ${data.newSanity}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/sessions", sessionId, "characters"] });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible d'appliquer la perte de sanité.",
        variant: "destructive",
      });
    },
  });

  const applyEffectMutation = useMutation({
    mutationFn: async (effectData: any) => {
      const response = await apiRequest("POST", `/api/characters/${selectedPlayer}/effects`, effectData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Effet appliqué",
        description: "L'effet a été appliqué au personnage.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/sessions", sessionId, "characters"] });
      setEffectModalOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible d'appliquer l'effet.",
        variant: "destructive",
      });
    },
  });

  const handleGMRoll = (diceFormula: string, isSecret: boolean = false) => {
    try {
      playRoll();
      const result = rollDice(diceFormula);
      const newRoll = {
        result: result.total,
        dice: diceFormula,
        timestamp: new Date()
      };
      
      setRollResults(prev => [newRoll, ...prev.slice(0, 4)]);
      
      if (!isSecret) {
        // Broadcast to players if not secret
        if (isConnected) {
          sendMessage('gm_roll', {
            formula: diceFormula,
            result: result.total,
            timestamp: new Date()
          });
        }
      }
      
      toast({
        title: isSecret ? "Lancé Secret" : "Lancé de dé",
        description: `${diceFormula}: ${result.total}`,
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Formule de dé invalide.",
        variant: "destructive",
      });
    }
  };

  const handleCustomGMRoll = () => {
    if (customDice.trim()) {
      handleGMRoll(customDice);
      setCustomDice("");
    }
  };

  const handleSanityPreset = (loss: string) => {
    // Apply to all characters or show selection modal
    if (characters.length === 1) {
      applySanityLossMutation.mutate({ characterId: characters[0].id, loss });
    } else {
      // For multiple characters, you might want to show a selection modal
      toast({
        title: "Sélectionnez un personnage",
        description: "Cliquez sur un personnage pour appliquer la perte de sanité.",
      });
    }
  };

  const openEffectModal = (playerId: string, type: string) => {
    setSelectedPlayer(playerId);
    setEffectType(type);
    setEffectModalOpen(true);
  };

  if (isLoading || sessionLoading || charactersLoading) {
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
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-deep-black text-bone-white">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* GM Header */}
        <Card className="bg-charcoal border-aged-gold parchment-bg mb-8">
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="font-cinzel text-3xl font-bold text-aged-gold mb-2">
                  Interface Maître de Jeu
                </h1>
                <p className="text-bone-white">
                  Session: <span className="text-aged-gold" data-testid="text-session-name">
                    {session.name}
                  </span>
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <ConnectionIndicator isConnected={isConnected} />
                <Button 
                  onClick={() => handleGMRoll("1d100")}
                  className="bg-blood-burgundy hover:bg-dark-crimson text-bone-white"
                  data-testid="button-gm-roll-secret"
                >
                  <Dice6 className="mr-2 h-4 w-4" />
                  Lancer Secret
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Players Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {characters.map((character) => (
            <Card key={character.id} className="bg-charcoal border-aged-gold parchment-bg">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3 mb-4">
                  {character.avatarUrl ? (
                    <img 
                      src={character.avatarUrl} 
                      alt={character.name}
                      className="w-12 h-12 rounded-full border border-aged-gold object-cover"
                      data-testid={`img-character-avatar-${character.id}`}
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full border border-aged-gold bg-cosmic-void flex items-center justify-center">
                      <Users className="h-6 w-6 text-aged-gold" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-cinzel text-lg text-aged-gold" data-testid={`text-character-name-${character.id}`}>
                      {character.name}
                    </h3>
                    <p className="text-sm text-aged-parchment" data-testid={`text-character-occupation-${character.id}`}>
                      {character.occupation}
                    </p>
                  </div>
                </div>
                
                {/* Player Stats */}
                <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
                  <div className="text-center bg-cosmic-void rounded p-2">
                    <div className="text-bone-white font-bold" data-testid={`text-hp-${character.id}`}>
                      {character.hitPoints}/{character.maxHitPoints}
                    </div>
                    <div className="text-aged-parchment">PV</div>
                  </div>
                  <div className={`text-center bg-cosmic-void rounded p-2 ${character.sanity < character.maxSanity * 0.3 ? 'animate-pulse border border-blood-burgundy' : ''}`}>
                    <div className="text-bone-white font-bold" data-testid={`text-sanity-${character.id}`}>
                      {character.sanity}/{character.maxSanity}
                    </div>
                    <div className="text-aged-parchment">Sanité</div>
                  </div>
                  <div className="text-center bg-cosmic-void rounded p-2">
                    <div className="text-bone-white font-bold" data-testid={`text-mp-${character.id}`}>
                      {character.magicPoints}/{character.maxMagicPoints}
                    </div>
                    <div className="text-aged-parchment">PM</div>
                  </div>
                </div>
                
                {/* Player Actions */}
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    size="sm"
                    onClick={() => openEffectModal(character.id, 'damage')}
                    className="bg-blood-burgundy hover:bg-dark-crimson text-bone-white text-xs"
                    data-testid={`button-apply-damage-${character.id}`}
                  >
                    <Heart className="mr-1 h-3 w-3" />
                    Dégâts
                  </Button>
                  <Button 
                    size="sm"
                    onClick={() => applySanityLossMutation.mutate({ characterId: character.id, loss: "1d4" })}
                    className="bg-dark-crimson hover:bg-blood-burgundy text-bone-white text-xs"
                    data-testid={`button-apply-sanity-loss-${character.id}`}
                  >
                    <Brain className="mr-1 h-3 w-3" />
                    Sanité
                  </Button>
                  <Button 
                    size="sm"
                    onClick={() => openEffectModal(character.id, 'buff')}
                    className="bg-eldritch-green hover:bg-green-800 text-bone-white text-xs"
                    data-testid={`button-apply-buff-${character.id}`}
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    Buff
                  </Button>
                  <Button 
                    size="sm"
                    onClick={() => openEffectModal(character.id, 'debuff')}
                    className="bg-charcoal hover:bg-dark-stone border border-aged-gold text-bone-white text-xs"
                    data-testid={`button-apply-debuff-${character.id}`}
                  >
                    <Minus className="mr-1 h-3 w-3" />
                    Debuff
                  </Button>
                </div>
                
                {/* Active Effects */}
                {(character.sanityConditions.length > 0 || character.activeEffects.length > 0) && (
                  <div className="mt-3 text-xs">
                    <div className="text-aged-parchment mb-1">Effets Actifs:</div>
                    <div className="space-y-1">
                      {character.sanityConditions.slice(0, 2).map((condition) => (
                        <div key={condition.id} className="bg-cosmic-void border border-aged-gold rounded p-1">
                          <span className="text-bone-white">
                            {condition.type === 'phobia' ? 'Phobie: ' : 'Manie: '}
                            {condition.name}
                          </span>
                        </div>
                      ))}
                      {character.activeEffects.slice(0, 1).map((effect) => (
                        <div key={effect.id} className="bg-blood-burgundy rounded p-1">
                          <span className="text-bone-white">{effect.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Ambient Sound Controller */}
        <div className="mb-6">
          <AmbientSoundController />
        </div>

        {/* Advanced GM Tools */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Secret Roll Tool */}
          <GMSecretRoll 
            onRoll={(result) => {
              handleGMRoll(result.formula, result.isSecret);
              if (result.description) {
                toast({
                  title: result.isSecret ? "Jet Secret" : "Jet Public",
                  description: `${result.description}: ${result.result}`,
                });
              }
            }}
            players={characters.map(c => ({ id: c.id, name: c.name }))}
          />
          
          {/* Narrative Tools */}
          <NarrativeTools 
            onAmbiance={(text) => {
              if (isConnected) {
                sendMessage('ambiance', { text, timestamp: new Date() });
              }
              toast({
                title: "Ambiance envoyée",
                description: text.substring(0, 50) + '...',
              });
            }}
            onNarration={(text) => {
              if (isConnected) {
                sendMessage('narration', { text, timestamp: new Date() });
              }
              toast({
                title: "Narration envoyée",
                description: text.substring(0, 50) + '...',
              });
            }}
          />
          
          {/* Roll History */}
          <RollHistoryVisual 
            rolls={rollResults.map((roll, index) => ({
              id: `${roll.timestamp.getTime()}-${index}`,
              rollType: 'gm',
              result: roll.result,
              diceType: roll.dice,
              modifier: 0,
              createdAt: roll.timestamp,
              success: roll.result === 1 ? 'critical' : roll.result >= 96 ? 'fumble' : null
            }))}
            maxItems={10}
            className="h-full"
          />
        </div>
        
        {/* GM Tools */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Quick Actions */}
          <Card className="bg-charcoal border-aged-gold parchment-bg">
            <CardHeader>
              <CardTitle className="font-cinzel text-aged-gold">Actions Rapides</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Sanity Loss Presets */}
              <div className="mb-6">
                <h3 className="font-source text-sm text-aged-gold mb-3">Perte de Sanité</h3>
                <div className="grid grid-cols-2 gap-2">
                  {SANITY_PRESETS.map((preset) => (
                    <Button
                      key={preset.name}
                      onClick={() => handleSanityPreset(preset.formula)}
                      className="bg-dark-crimson hover:bg-blood-burgundy text-bone-white text-xs p-2 h-auto flex flex-col"
                      data-testid={`button-sanity-preset-${preset.name.toLowerCase().replace(' ', '-')}`}
                    >
                      <div className="font-semibold">{preset.name}</div>
                      <div className="text-aged-parchment">{preset.formula}</div>
                    </Button>
                  ))}
                </div>
              </div>
              
              {/* Environmental Effects */}
              <div>
                <h3 className="font-source text-sm text-aged-gold mb-3">Effets Environnementaux</h3>
                <div className="grid grid-cols-2 gap-2">
                  <Button className="bg-eldritch-green hover:bg-green-800 text-bone-white text-xs">
                    <Wand2 className="mr-1 h-3 w-3" />
                    Bénédiction
                  </Button>
                  <Button className="bg-charcoal hover:bg-dark-stone border border-aged-gold text-bone-white text-xs">
                    <AlertTriangle className="mr-1 h-3 w-3" />
                    Malédiction
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dice Roll Panel */}
          <Card className="bg-charcoal border-aged-gold parchment-bg">
            <CardHeader>
              <CardTitle className="font-cinzel text-aged-gold">Lancers de Dés GM</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Quick Dice */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                {['1d100', '1d20', '1d10', '1d8', '1d6', '1d4'].map((dice) => (
                  <Button
                    key={dice}
                    onClick={() => handleGMRoll(dice)}
                    className="bg-cosmic-void hover:bg-dark-stone border border-aged-gold text-bone-white text-xs h-12 flex flex-col"
                    data-testid={`button-quick-dice-${dice}`}
                  >
                    <div className="font-bold">{dice}</div>
                  </Button>
                ))}
              </div>
              
              {/* Custom Roll */}
              <div className="mb-4">
                <div className="flex gap-2">
                  <Input
                    value={customDice}
                    onChange={(e) => setCustomDice(e.target.value)}
                    placeholder="Ex: 3d6+2, 2d8"
                    className="bg-cosmic-void border-aged-gold text-bone-white"
                    data-testid="input-custom-dice"
                  />
                  <Button
                    onClick={handleCustomGMRoll}
                    className="bg-blood-burgundy hover:bg-dark-crimson text-bone-white"
                    data-testid="button-custom-roll"
                  >
                    <Dice6 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {/* Quick Results Summary */}
              {rollResults.length > 0 && (
                <div className="mt-4 p-3 bg-cosmic-void border border-aged-gold rounded">
                  <div className="text-center">
                    <div className="text-xs text-aged-parchment mb-1">Dernier jet</div>
                    <div className="text-2xl font-bold text-aged-gold">
                      {rollResults[0]?.result}
                    </div>
                    <div className="text-sm text-bone-white">
                      {rollResults[0]?.dice}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Effect Application Modal */}
        <Dialog open={effectModalOpen} onOpenChange={setEffectModalOpen}>
          <DialogContent className="bg-charcoal border-aged-gold text-bone-white max-w-md">
            <DialogHeader>
              <DialogTitle className="font-cinzel text-aged-gold">
                Appliquer un Effet
              </DialogTitle>
            </DialogHeader>
            
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const effectData = {
                  type: formData.get('effectType'),
                  name: formData.get('effectName'),
                  description: formData.get('description'),
                  value: formData.get('value'),
                  duration: formData.get('duration') ? parseInt(formData.get('duration') as string) : undefined,
                };
                applyEffectMutation.mutate(effectData);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-source mb-2">Type d'Effet</label>
                <Select name="effectType" defaultValue={effectType}>
                  <SelectTrigger className="bg-cosmic-void border-aged-gold text-bone-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-cosmic-void border-aged-gold">
                    <SelectItem value="damage">Dégâts Physiques</SelectItem>
                    <SelectItem value="sanity_loss">Perte de Sanité</SelectItem>
                    <SelectItem value="buff">Amélioration</SelectItem>
                    <SelectItem value="debuff">Pénalité</SelectItem>
                    <SelectItem value="condition">Condition</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-source mb-2">Nom de l'Effet</label>
                <Input
                  name="effectName"
                  className="bg-cosmic-void border-aged-gold text-bone-white"
                  placeholder="Ex: Blessure grave, Malédiction..."
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-source mb-2">Valeur</label>
                <Input
                  name="value"
                  className="bg-cosmic-void border-aged-gold text-bone-white"
                  placeholder="Ex: 1d4, 5, -10"
                />
              </div>
              
              <div>
                <label className="block text-sm font-source mb-2">Description</label>
                <Textarea
                  name="description"
                  className="bg-cosmic-void border-aged-gold text-bone-white h-20"
                  placeholder="Description de l'effet..."
                />
              </div>
              
              <div className="flex gap-3">
                <Button
                  type="submit"
                  disabled={applyEffectMutation.isPending}
                  className="flex-1 bg-blood-burgundy hover:bg-dark-crimson text-bone-white"
                  data-testid="button-apply-effect-confirm"
                >
                  {applyEffectMutation.isPending ? "Application..." : "Appliquer"}
                </Button>
                <Button
                  type="button"
                  onClick={() => setEffectModalOpen(false)}
                  className="px-4 bg-charcoal hover:bg-dark-stone text-bone-white"
                  data-testid="button-cancel-effect"
                >
                  Annuler
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
