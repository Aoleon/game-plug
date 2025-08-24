import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useToast } from "@/hooks/use-toast";
import { useWebSocket } from "@/hooks/useWebSocket";
import Navigation from "@/components/navigation";
import ConnectionIndicator from "@/components/connection-indicator";
import RollHistoryVisual from "@/components/roll-history-visual";
import GMRollWithEffects from "@/components/gm-roll-with-effects";
import NarrativeTools from "@/components/narrative-tools";
import UnifiedAmbientController from "@/components/unified-ambient-controller";
import { ChapterManagerWithHistory } from "@/components/chapter-manager";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { rollDice, parseDiceFormula } from "@/lib/dice";
import { SANITY_PRESETS, PHOBIAS, MANIAS } from "@/lib/cthulhu-data";
import { useDiceSound } from "@/components/dice-sound-manager";
import { 
  Eye, EyeOff, Dice6, Heart, Brain, Plus, Minus, Wand2, 
  Users, Clock, AlertTriangle, BookOpen, QrCode, Copy, Share2, CheckCircle, Trash2, Edit, Image 
} from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import type { Character, GameSession, SanityCondition, ActiveEffect } from "@shared/schema";

interface CharacterWithDetails extends Character {
  sanityConditions: SanityCondition[];
  activeEffects: ActiveEffect[];
}

export default function GMDashboard() {
  const params = useParams();
  const sessionId = params.sessionId;
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const { playRoll, playCritical, playFumble } = useDiceSound();
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [effectModalOpen, setEffectModalOpen] = useState(false);
  const [effectType, setEffectType] = useState<string>("");
  const [customDice, setCustomDice] = useState("");
  const [rollResults, setRollResults] = useState<Array<{ result: number; dice: string; timestamp: Date; character?: string }>>([]);
  const [isSecretRoll, setIsSecretRoll] = useState(false);
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [copyStatus, setCopyStatus] = useState(false);
  const [deleteCharacterId, setDeleteCharacterId] = useState<string | null>(null);
  const [deleteCharacterName, setDeleteCharacterName] = useState<string>("");
  const [isGeneratingAvatars, setIsGeneratingAvatars] = useState(false);
  const [forceRegenerateAvatars, setForceRegenerateAvatars] = useState(false);

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

  // Delete character mutation
  const deleteCharacterMutation = useMutation({
    mutationFn: async (characterId: string) => {
      await apiRequest("DELETE", `/api/sessions/${sessionId}/characters/${characterId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions", sessionId, "characters"] });
      toast({
        title: "Personnage supprimé",
        description: "Le personnage a été retiré de la session.",
      });
      setDeleteCharacterId(null);
      setDeleteCharacterName("");
    },
    onError: (error: any) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le personnage.",
        variant: "destructive",
      });
    },
  });

  const applyEffectToCharacters = async (effect: any) => {
    try {
      for (const charId of effect.characterIds) {
        const character = characters.find(c => c.id === charId);
        if (!character) continue;

        let updateData: any = {};
        let rollType = 'general';
        let rollDescription = effect.description || '';
        
        switch (effect.effectType) {
          case 'sanity':
            const newSanity = Math.max(0, character.sanity - effect.value);
            updateData.sanity = newSanity;
            rollType = 'sanity';
            rollDescription = `Perte de sanité: ${effect.value} points`;
            
            // Check for madness conditions
            if (effect.value >= 5) {
              const isPhobia = Math.random() > 0.5;
              const conditionList = isPhobia ? PHOBIAS : MANIAS;
              const randomCondition = conditionList[Math.floor(Math.random() * conditionList.length)];
              
              await apiRequest("POST", `/api/characters/${charId}/sanity-conditions`, {
                type: isPhobia ? 'phobia' : 'mania',
                name: randomCondition,
                duration: 'temporary'
              });
            }
            break;
            
          case 'health':
            updateData.hitPoints = Math.max(0, character.hitPoints - effect.value);
            rollType = 'damage';
            rollDescription = `Dégâts: ${effect.value} points`;
            break;
            
          case 'luck':
            updateData.luck = Math.max(0, character.luck - effect.value);
            rollType = 'luck';
            rollDescription = `Test de chance: ${effect.value}`;
            break;
            
          case 'magic':
            updateData.magicPoints = Math.max(0, character.magicPoints - effect.value);
            rollType = 'magic';
            rollDescription = `Magie: ${effect.value} points`;
            break;
        }
        
        // Record roll in history
        if (effect.value !== undefined && sessionId) {
          try {
            await apiRequest("POST", "/api/rolls", {
              sessionId,
              characterId: charId,
              rollType,
              formula: effect.formula || `${effect.value}`,
              result: effect.value,
              skillName: effect.effectType,
              outcome: effect.value >= 5 ? 'fail' : 'success',
              description: rollDescription,
              isSecret: false
            });
          } catch (error) {
            console.error('Failed to record roll:', error);
          }
        }
        
        // Update character
        if (Object.keys(updateData).length > 0) {
          await apiRequest("PATCH", `/api/characters/${charId}`, updateData);
        }
        
        // Add to roll history if connected
        if (isConnected) {
          sendMessage('effect_applied', {
            characterId: charId,
            effectType: effect.effectType,
            value: effect.value,
            description: effect.description
          });
        }
      }
      
      // Refresh character data and roll history
      queryClient.invalidateQueries({ queryKey: ["/api/sessions", sessionId, "characters"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sessions", sessionId, "rolls"] });
      
    } catch (error) {
      console.error("Error applying effects:", error);
      throw error;
    }
  };

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

  const handleGenerateAllAvatars = async () => {
    setIsGeneratingAvatars(true);
    try {
      const response = await apiRequest("POST", `/api/sessions/${sessionId}/generate-all-avatars`, {
        forceRegenerate: forceRegenerateAvatars
      });
      const data = await response.json();
      
      if (data.generated > 0) {
        toast({
          title: "Portraits générés",
          description: `${data.generated} portrait(s) ont été ${forceRegenerateAvatars ? 'régénérés' : 'créés'} avec succès.`,
        });
        // Refresh character list to show new avatars
        queryClient.invalidateQueries({ queryKey: ["/api/sessions", sessionId, "characters"] });
      } else {
        toast({
          title: "Aucun portrait à générer",
          description: forceRegenerateAvatars ? "Aucun personnage dans la session." : "Tous les personnages ont déjà un portrait.",
        });
      }
      
      if (data.failed > 0) {
        toast({
          title: "Erreurs de génération",
          description: `${data.failed} portrait(s) n'ont pas pu être générés.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error generating avatars:", error);
      toast({
        title: "Erreur",
        description: "Impossible de générer les portraits.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingAvatars(false);
    }
  };

  const handleRollWithEffects = async (result: any) => {
    // Handle the roll results
    const rollEntries = Array.from(result.results.entries()) as [string, number][];
    
    for (const [charId, value] of rollEntries) {
      const character = characters.find(c => c.id === charId);
      if (character) {
        const newRoll = {
          result: value,
          dice: result.formula,
          character: character.name,
          timestamp: new Date()
        };
        setRollResults(prev => [newRoll, ...prev.slice(0, 9)]);
        
        // Determine roll type based on effect type
        let rollType = 'general';
        if (result.effectType === 'sanity') rollType = 'sanity';
        else if (result.effectType === 'health') rollType = 'damage';
        else if (result.effectType === 'luck') rollType = 'luck';
        else if (result.effectType === 'magic') rollType = 'magic';
        
        // Record roll in database
        try {
          await apiRequest("POST", "/api/rolls", {
            sessionId,
            characterId: charId,
            rollType,
            formula: result.formula,
            result: value,
            skillName: result.effectType || 'general',
            outcome: value === 1 ? 'critical' : value >= 96 ? 'fumble' : 'normal',
            description: result.description || '',
            isSecret: result.isSecret || false
          });
        } catch (error) {
          console.error('Failed to record roll in database:', error);
        }
        
        // Record roll in chapter event history
        try {
          const chapters = await queryClient.fetchQuery({
            queryKey: ["/api/sessions", sessionId, "chapters"],
          }) as any[];
          
          const activeChapter = chapters?.find((c: any) => c.status === 'active');
          if (activeChapter) {
            await fetch('/api/chapter-events', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                chapterId: activeChapter.id,
                sessionId,
                eventType: 'roll',
                title: `${character.name} - Jet de ${result.formula}`,
                description: `Résultat: ${value}${value === 1 ? ' (Réussite critique!)' : value >= 96 ? ' (Échec critique!)' : ''}${result.description ? ` - ${result.description}` : ''}`,
                characterId: charId,
                metadata: {
                  formula: result.formula,
                  result: value,
                  characterName: character.name,
                  isSecret: result.isSecret || false
                },
                isImportant: value === 1 || value >= 96, // Critical success or fumble
              }),
            });
          }
        } catch (error) {
          console.error('Failed to record roll event:', error);
        }
      }
    }
    
    // Broadcast if not secret
    if (!result.isSecret && isConnected) {
      sendMessage('gm_roll', {
        formula: result.formula,
        results: Object.fromEntries(result.results),
        timestamp: new Date(),
        description: result.description
      });
    }
    
    // Refresh roll history
    queryClient.invalidateQueries({ queryKey: ["/api/sessions", sessionId, "rolls"] });
  };

  const handleSanityPreset = (loss: string) => {
    // This is now handled by the GMRollWithEffects component
    toast({
      title: "Utilisez le panneau de jets",
      description: "Sélectionnez les personnages et utilisez le panneau de jets avec effets.",
    });
  };

  const openEffectModal = (playerId: string, type: string) => {
    setSelectedPlayer(playerId);
    setEffectType(type);
    setEffectModalOpen(true);
  };

  const applyEnvironmentalEffect = async (effectType: 'blessing' | 'curse') => {
    try {
      const effectName = effectType === 'blessing' ? 'Bénédiction Divine' : 'Malédiction Ancienne';
      const effectDescription = effectType === 'blessing' 
        ? 'Bonus de +1d10 à tous les jets pendant 24h' 
        : 'Malus de -1d10 à tous les jets pendant 24h';
      const effectValue = effectType === 'blessing' ? '+1d10' : '-1d10';
      
      // Appliquer l'effet à tous les personnages
      const promises = characters.map(async (character) => {
        await apiRequest("POST", `/api/characters/${character.id}/effects`, {
          type: effectType === 'blessing' ? 'buff' : 'debuff',
          name: effectName,
          description: effectDescription,
          value: effectValue,
          duration: 24, // 24 heures
        });
      });
      
      await Promise.all(promises);
      
      // Rafraîchir les données
      queryClient.invalidateQueries({ queryKey: ["/api/sessions", sessionId, "characters"] });
      
      toast({
        title: effectType === 'blessing' ? "Bénédiction appliquée" : "Malédiction appliquée",
        description: `${effectName} a été appliquée à tous les personnages.`,
      });
      
      // Enregistrer dans l'historique
      if (isConnected) {
        sendMessage('environmental_effect', {
          effectType,
          effectName,
          timestamp: new Date()
        });
      }
    } catch (error) {
      console.error('Error applying environmental effect:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'appliquer l'effet environnemental.",
        variant: "destructive",
      });
    }
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
                {session.code && (
                  <div className="space-y-3 mt-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-aged-parchment">Code de session :</span>
                      <code className="bg-cosmic-void px-3 py-1 rounded text-aged-gold font-mono text-lg font-bold">
                        {session.code}
                      </code>
                      <span className="text-xs text-aged-parchment/60 ml-2">
                        (Partagez ce code avec vos joueurs)
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowQRDialog(true)}
                        className="bg-cosmic-void border-aged-gold text-aged-gold hover:bg-aged-gold hover:text-deep-black"
                        data-testid="button-show-qr"
                      >
                        <QrCode className="mr-2 h-4 w-4" />
                        Afficher QR Code
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const joinUrl = `${window.location.origin}/join?code=${session.code}`;
                          navigator.clipboard.writeText(joinUrl);
                          setCopyStatus(true);
                          setTimeout(() => setCopyStatus(false), 2000);
                          toast({
                            title: "Lien copié",
                            description: "Le lien de connexion a été copié dans le presse-papier",
                          });
                        }}
                        className="bg-cosmic-void border-aged-gold text-aged-gold hover:bg-aged-gold hover:text-deep-black"
                        data-testid="button-copy-link"
                      >
                        {copyStatus ? (
                          <><CheckCircle className="mr-2 h-4 w-4" /> Copié!</>
                        ) : (
                          <><Copy className="mr-2 h-4 w-4" /> Copier le lien</>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-4">
                <ConnectionIndicator isConnected={isConnected} />
                <div className="flex items-center gap-2">
                  <Button
                    onClick={handleGenerateAllAvatars}
                    disabled={isGeneratingAvatars}
                    className="bg-eldritch-green hover:bg-green-800 text-bone-white"
                    data-testid="button-generate-all-avatars"
                  >
                    <Image className="mr-2 h-4 w-4" />
                    {isGeneratingAvatars ? "Génération..." : forceRegenerateAvatars ? "Régénérer Portraits" : "Générer Portraits"}
                  </Button>
                  <div className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      id="force-regenerate"
                      checked={forceRegenerateAvatars}
                      onChange={(e) => setForceRegenerateAvatars(e.target.checked)}
                      className="h-4 w-4 rounded border-aged-gold bg-cosmic-void text-eldritch-green focus:ring-eldritch-green"
                      data-testid="checkbox-force-regenerate"
                    />
                    <label 
                      htmlFor="force-regenerate" 
                      className="text-xs text-aged-parchment cursor-pointer whitespace-nowrap"
                    >
                      Forcer régénération
                    </label>
                  </div>
                </div>
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
            <Card key={character.id} className="bg-charcoal border-aged-gold parchment-bg relative">
              <CardContent className="p-4">
                {/* Edit and Delete buttons */}
                <div className="absolute top-2 right-2 flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setLocation(`/character-edit/${sessionId}/${character.id}`)}
                    className="text-aged-gold hover:text-bone-white hover:bg-aged-gold/10 p-1"
                    data-testid={`button-edit-character-${character.id}`}
                    title="Éditer le personnage"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setDeleteCharacterId(character.id);
                      setDeleteCharacterName(character.name);
                    }}
                    className="text-blood-burgundy hover:text-dark-crimson hover:bg-blood-burgundy/10 p-1"
                    data-testid={`button-delete-character-${character.id}`}
                    title="Supprimer le personnage"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                
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
                    onClick={() => toast({
                      title: "Utilisez le panneau de jets",
                      description: "Sélectionnez ce personnage dans le panneau de jets avec effets."
                    })}
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

        {/* Unified Ambient Sound Controller */}
        <div className="mb-6">
          <UnifiedAmbientController />
        </div>

        {/* Chapter Manager with History */}
        <div className="mb-6">
          <ChapterManagerWithHistory 
            sessionId={sessionId || ''} 
            isGM={true} 
            characters={characters}
          />
        </div>

        {/* Advanced GM Tools */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Roll Tool with Effects */}
          <GMRollWithEffects
            characters={characters}
            onRoll={handleRollWithEffects}
            onApplyEffect={applyEffectToCharacters}
          />
          
          {/* Narrative Tools */}
          <NarrativeTools 
            onAmbiance={async (text) => {
              if (isConnected) {
                sendMessage('ambiance', { text, timestamp: new Date() });
              }
              
              // Record ambiance in chapter event history
              try {
                const chapters = await queryClient.fetchQuery({
                  queryKey: ["/api/sessions", sessionId, "chapters"],
                }) as any[];
                
                const activeChapter = chapters?.find((c: any) => c.status === 'active');
                if (activeChapter) {
                  await fetch('/api/chapter-events', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      chapterId: activeChapter.id,
                      sessionId,
                      eventType: 'narration',
                      title: "Ambiance",
                      description: text,
                      metadata: { type: 'ambiance' },
                      isImportant: false,
                    }),
                  });
                }
              } catch (error) {
                console.error('Failed to record ambiance event:', error);
              }
              
              toast({
                title: "Ambiance envoyée",
                description: text.substring(0, 50) + '...',
              });
            }}
            onNarration={async (text) => {
              if (isConnected) {
                sendMessage('narration', { text, timestamp: new Date() });
              }
              
              // Record narration in chapter event history
              try {
                const chapters = await queryClient.fetchQuery({
                  queryKey: ["/api/sessions", sessionId, "chapters"],
                }) as any[];
                
                const activeChapter = chapters?.find((c: any) => c.status === 'active');
                if (activeChapter) {
                  await fetch('/api/chapter-events', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      chapterId: activeChapter.id,
                      sessionId,
                      eventType: 'narration',
                      title: "Narration",
                      description: text,
                      metadata: { type: 'narration' },
                      isImportant: true, // Narrations are usually important story elements
                    }),
                  });
                }
              } catch (error) {
                console.error('Failed to record narration event:', error);
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
                  <Button 
                    onClick={() => applyEnvironmentalEffect('blessing')}
                    className="bg-eldritch-green hover:bg-green-800 text-bone-white text-xs"
                    data-testid="button-blessing"
                  >
                    <Wand2 className="mr-1 h-3 w-3" />
                    Bénédiction
                  </Button>
                  <Button 
                    onClick={() => applyEnvironmentalEffect('curse')}
                    className="bg-charcoal hover:bg-dark-stone border border-aged-gold text-bone-white text-xs"
                    data-testid="button-curse"
                  >
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

        {/* QR Code Dialog */}
        <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
          <DialogContent className="bg-charcoal border-aged-gold max-w-md">
            <DialogHeader>
              <DialogTitle className="font-cinzel text-aged-gold text-xl">
                Code QR pour rejoindre la session
              </DialogTitle>
            </DialogHeader>
            <div className="flex flex-col items-center space-y-4 p-4">
              <div className="bg-white p-4 rounded-lg">
                <QRCodeCanvas
                  value={`${window.location.origin}/join?code=${session?.code || ''}`}
                  size={256}
                  level="H"
                  includeMargin={false}
                  imageSettings={{
                    src: "",
                    x: undefined,
                    y: undefined,
                    height: 0,
                    width: 0,
                    excavate: false,
                  }}
                />
              </div>
              <div className="text-center space-y-2">
                <p className="text-sm text-aged-parchment">
                  Code de session :
                </p>
                <code className="bg-cosmic-void px-4 py-2 rounded text-aged-gold font-mono text-2xl font-bold block">
                  {session?.code}
                </code>
                <p className="text-xs text-aged-parchment/60">
                  Les joueurs peuvent scanner ce code pour rejoindre directement
                </p>
              </div>
              <div className="flex gap-2 w-full">
                <Button
                  className="flex-1 bg-cosmic-void border-aged-gold text-aged-gold hover:bg-aged-gold hover:text-deep-black"
                  variant="outline"
                  onClick={() => {
                    const joinUrl = `${window.location.origin}/join?code=${session?.code || ''}`;
                    navigator.clipboard.writeText(joinUrl);
                    toast({
                      title: "Lien copié",
                      description: "Le lien avec le code a été copié",
                    });
                  }}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copier le lien
                </Button>
                <Button
                  className="flex-1 bg-cosmic-void border-aged-gold text-aged-gold hover:bg-aged-gold hover:text-deep-black"
                  variant="outline"
                  onClick={() => {
                    const joinUrl = `${window.location.origin}/join?code=${session?.code || ''}`;
                    if (navigator.share) {
                      navigator.share({
                        title: 'Rejoindre la session',
                        text: `Rejoignez la session ${session?.name} avec le code ${session?.code}`,
                        url: joinUrl,
                      }).catch(() => {});
                    } else {
                      navigator.clipboard.writeText(joinUrl);
                      toast({
                        title: "Lien copié",
                        description: "Le partage n'est pas disponible, le lien a été copié",
                      });
                    }
                  }}
                >
                  <Share2 className="mr-2 h-4 w-4" />
                  Partager
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        
        {/* Delete Character Confirmation Dialog */}
        <AlertDialog open={!!deleteCharacterId} onOpenChange={(open) => {
          if (!open) {
            setDeleteCharacterId(null);
            setDeleteCharacterName("");
          }
        }}>
          <AlertDialogContent className="bg-charcoal border-aged-gold">
            <AlertDialogHeader>
              <AlertDialogTitle className="font-cinzel text-aged-gold">
                Supprimer le personnage ?
              </AlertDialogTitle>
              <AlertDialogDescription className="text-aged-parchment">
                Êtes-vous sûr de vouloir retirer <span className="text-bone-white font-bold">{deleteCharacterName}</span> de la session ?
                Cette action est irréversible.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-cosmic-void border-aged-gold text-aged-gold hover:bg-aged-gold/10">
                Annuler
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (deleteCharacterId) {
                    deleteCharacterMutation.mutate(deleteCharacterId);
                  }
                }}
                disabled={deleteCharacterMutation.isPending}
                className="bg-blood-burgundy hover:bg-dark-crimson text-bone-white"
              >
                {deleteCharacterMutation.isPending ? "Suppression..." : "Supprimer"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
