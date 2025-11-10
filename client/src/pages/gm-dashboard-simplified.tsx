import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useWebSocket } from "@/hooks/useWebSocket";
import Navigation from "@/components/navigation";
import ConnectionIndicator from "@/components/connection-indicator";
import EnhancedCharacterCard from "@/components/enhanced-character-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import CharacterCardSkeleton from "@/components/character-card-skeleton";
import EnhancedButton from "@/components/enhanced-button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { rollDice } from "@/lib/dice";
import { useDiceSound } from "@/components/dice-sound-manager";
import { 
  Users, Copy, QrCode, Share2, Settings, Package,
  Dice6, Music, BookOpen, Image, Trash2, Plus, Monitor
} from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import CharacterInventoryManager from "@/components/character-inventory-manager";
import GMRollWithEffects from "@/components/gm-roll-with-effects";
import UnifiedAmbientController from "@/components/unified-ambient-controller";
import NarrativeTools from "@/components/narrative-tools";
import type { Character, GameSession, SanityCondition, ActiveEffect } from "@shared/schema";

interface CharacterWithDetails extends Character {
  sanityConditions: SanityCondition[];
  activeEffects: ActiveEffect[];
}

export default function GMDashboardSimplified() {
  const params = useParams();
  const sessionId = params.sessionId;
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const { playRoll } = useDiceSound();
  
  // Modal states
  const [showQRDialog, setShowQRDialog] = useState(false);
  const [showToolsDialog, setShowToolsDialog] = useState(false);
  const [inventoryModalOpen, setInventoryModalOpen] = useState(false);
  const [selectedCharacterForInventory, setSelectedCharacterForInventory] = useState<string | null>(null);
  const [deleteCharacterId, setDeleteCharacterId] = useState<string | null>(null);
  const [deleteCharacterName, setDeleteCharacterName] = useState<string>("");
  const [isGeneratingAvatars, setIsGeneratingAvatars] = useState(false);
  
  // WebSocket connection
  const { isConnected, sendMessage, lastMessage } = useWebSocket("/game-ws");

  // Fetch session data
  const { data: session, isLoading: isLoadingSession } = useQuery<GameSession>({
    queryKey: ["/api/sessions", sessionId],
    enabled: isAuthenticated && !!sessionId,
  });

  // Fetch characters with details
  const { data: characters = [], isLoading: isLoadingCharacters } = useQuery<CharacterWithDetails[]>({
    queryKey: ["/api/sessions", sessionId, "characters"],
    enabled: isAuthenticated && !!sessionId,
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      setLocation("/");
    }
  }, [isAuthenticated, isLoading, setLocation]);

  // Delete character mutation
  const deleteCharacterMutation = useMutation({
    mutationFn: async (characterId: string) => {
      const response = await apiRequest("DELETE", `/api/sessions/${sessionId}/characters/${characterId}`, {});
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Personnage supprimé",
        description: "Le personnage a été retiré de la session.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/sessions", sessionId, "characters"] });
      setDeleteCharacterId(null);
      setDeleteCharacterName("");
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le personnage.",
        variant: "destructive",
      });
    },
  });

  const handleCopyCode = () => {
    if (session?.code) {
      navigator.clipboard.writeText(session.code);
      toast({
        title: "Code copié",
        description: `Le code ${session.code} a été copié dans le presse-papier.`,
      });
    }
  };

  const handleCopyLink = () => {
    const url = `${window.location.origin}/join/${session?.code}`;
    navigator.clipboard.writeText(url);
    toast({
      title: "Lien copié",
      description: "Le lien de la session a été copié dans le presse-papier.",
    });
  };

  const handleGenerateAllAvatars = async () => {
    setIsGeneratingAvatars(true);
    try {
      const response = await apiRequest("POST", `/api/sessions/${sessionId}/generate-all-avatars`, {
        forceRegenerate: false
      });
      const data = await response.json();
      
      if (data.generated > 0) {
        toast({
          title: "Portraits générés",
          description: `${data.generated} portrait(s) ont été créés avec succès.`,
        });
        queryClient.invalidateQueries({ queryKey: ["/api/sessions", sessionId, "characters"] });
      } else {
        toast({
          title: "Aucun portrait à générer",
          description: "Tous les personnages ont déjà un portrait.",
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de générer les portraits.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingAvatars(false);
    }
  };

  if (isLoadingSession) {
    return (
      <div className="min-h-screen bg-deep-black">
        <Navigation />
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-9 w-10" />
              <Skeleton className="h-9 w-10" />
              <Skeleton className="h-9 w-10" />
              <Skeleton className="h-9 w-24" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <CharacterCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-deep-black flex items-center justify-center">
        <div className="text-blood-burgundy font-cinzel text-2xl">Session introuvable</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-deep-black">
      <Navigation />
      
      {/* Compact Header */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <h1 className="font-cinzel text-2xl text-aged-gold">{session.name}</h1>
            <ConnectionIndicator isConnected={isConnected} />
            <Badge className="bg-cosmic-void border-aged-gold text-aged-parchment">
              Code: {session.code}
            </Badge>
          </div>
          
          {/* Quick Actions Bar */}
          <div className="flex items-center gap-2">
            <EnhancedButton
              size="sm"
              variant="outline"
              onClick={handleCopyCode}
              className="border-aged-gold text-aged-gold hover:bg-cosmic-void"
              icon={<Copy className="h-4 w-4" />}
            />
            <EnhancedButton
              size="sm"
              variant="outline"
              onClick={handleCopyLink}
              className="border-aged-gold text-aged-gold hover:bg-cosmic-void"
              icon={<Share2 className="h-4 w-4" />}
            />
            <EnhancedButton
              size="sm"
              variant="outline"
              onClick={() => setShowQRDialog(true)}
              className="border-aged-gold text-aged-gold hover:bg-cosmic-void"
              icon={<QrCode className="h-4 w-4" />}
            />
            
            {/* GameBoard Button */}
            <EnhancedButton
              size="sm"
              variant="outline"
              onClick={() => window.open(`/gm/${sessionId}/gameboard`, '_blank')}
              className="border-eldritch-green text-eldritch-green hover:bg-eldritch-green hover:text-deep-black"
              data-testid="button-gameboard"
              icon={<Monitor className="h-4 w-4" />}
            >
              GameBoard
            </EnhancedButton>
            
            {/* Tools Popover */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-aged-gold text-aged-gold hover:bg-cosmic-void"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Outils
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-4 bg-charcoal border-aged-gold">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-cinzel text-aged-gold mb-2">Jets Groupés</h3>
                    <GMRollWithEffects
                      characters={characters}
                      onRoll={(result) => {
                        // Handle roll result
                        if (isConnected) {
                          sendMessage('gm_roll', {
                            formula: result.formula,
                            results: Array.from(result.results.entries()),
                            isSecret: result.isSecret
                          });
                        }
                      }}
                      onApplyEffect={async (effect) => {
                        // Apply effects to characters
                        for (const charId of effect.characterIds) {
                          await apiRequest("POST", `/api/characters/${charId}/effects`, {
                            type: effect.effectType,
                            value: effect.value.toString(),
                            description: effect.description
                          });
                        }
                        queryClient.invalidateQueries({ queryKey: ["/api/sessions", sessionId, "characters"] });
                      }}
                    />
                  </div>
                  
                  <div>
                    <h3 className="font-cinzel text-aged-gold mb-2">Ambiance</h3>
                    <UnifiedAmbientController />
                  </div>
                  
                  <div>
                    <h3 className="font-cinzel text-aged-gold mb-2">Narration</h3>
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
                  </div>
                  
                  <Button
                    onClick={handleGenerateAllAvatars}
                    disabled={isGeneratingAvatars}
                    className="w-full bg-eldritch-green hover:bg-green-700 text-bone-white"
                  >
                    <Image className="mr-2 h-4 w-4" />
                    {isGeneratingAvatars ? "Génération..." : "Générer Portraits"}
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
            
            <Button
              size="sm"
              onClick={() => setLocation(`/character-creation/${sessionId}`)}
              className="bg-eldritch-green hover:bg-green-700 text-bone-white"
            >
              <Plus className="mr-2 h-4 w-4" />
              Nouveau Personnage
            </Button>
          </div>
        </div>

        {/* Character Cards Grid */}
        {isLoadingCharacters ? (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <CharacterCardSkeleton key={`skeleton-${i}`} />
            ))}
          </div>
        ) : characters.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="bg-charcoal border-aged-gold parchment-bg">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <motion.div
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  <Users className="h-16 w-16 text-aged-gold mb-4" />
                </motion.div>
                <motion.p
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-aged-parchment text-center mb-4"
                >
                  Aucun personnage dans cette session.
                </motion.p>
                <motion.div
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <EnhancedButton
                    onClick={() => setLocation(`/character-creation/${sessionId}`)}
                    className="bg-eldritch-green hover:bg-green-700 text-bone-white"
                    icon={<Plus className="h-4 w-4" />}
                  >
                    Créer un Personnage
                  </EnhancedButton>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
            {characters.map((character, index) => (
              <motion.div
                key={character.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  duration: 0.4, 
                  delay: index * 0.1,
                  ease: "easeOut"
                }}
              >
                <EnhancedCharacterCard
                  character={character}
                isConnected={isConnected}
                onEdit={() => setLocation(`/character-edit/${sessionId}/${character.id}`)}
                onDelete={() => {
                  setDeleteCharacterId(character.id);
                  setDeleteCharacterName(character.name);
                }}
                onManageInventory={() => {
                  setSelectedCharacterForInventory(character.id);
                  setInventoryModalOpen(true);
                }}
                onApplyDamage={async (value) => {
                  await apiRequest("POST", `/api/characters/${character.id}/effects`, {
                    name: "Dégâts",
                    type: "damage",
                    value: value.toString()
                  });
                  queryClient.invalidateQueries({ queryKey: ["/api/sessions", sessionId, "characters"] });
                  toast({
                    title: "Dégâts appliqués",
                    description: `${value} points de dégâts à ${character.name}`,
                    variant: "destructive"
                  });
                }}
                onApplySanity={async (value) => {
                  await apiRequest("POST", `/api/characters/${character.id}/effects`, {
                    name: "Perte de Sanité",
                    type: "sanity_loss",
                    value: value.toString()
                  });
                  queryClient.invalidateQueries({ queryKey: ["/api/sessions", sessionId, "characters"] });
                  toast({
                    title: "Sanité perdue",
                    description: `${value} points de sanité perdus pour ${character.name}`,
                    className: "bg-purple-900/20 border-purple-600"
                  });
                }}
                onApplyBuff={async (name, value, duration) => {
                  await apiRequest("POST", `/api/characters/${character.id}/effects`, {
                    name,
                    type: "buff",
                    value: value.toString(),
                    duration: duration || 0
                  });
                  queryClient.invalidateQueries({ queryKey: ["/api/sessions", sessionId, "characters"] });
                  toast({
                    title: "Buff appliqué",
                    description: `${name} (+${value}) appliqué à ${character.name}`,
                    className: "bg-eldritch-green/20 border-eldritch-green"
                  });
                }}
                onApplyDebuff={async (name, value) => {
                  await apiRequest("POST", `/api/characters/${character.id}/effects`, {
                    name,
                    type: "debuff",
                    value: value.toString()
                  });
                  queryClient.invalidateQueries({ queryKey: ["/api/sessions", sessionId, "characters"] });
                  toast({
                    title: "Debuff appliqué",
                    description: `${name} appliqué à ${character.name}`,
                    variant: "destructive"
                  });
                }}
                onGrantSkillPoints={async (points) => {
                  await apiRequest("POST", `/api/characters/${character.id}/skill-points`, {
                    points
                  });
                  queryClient.invalidateQueries({ queryKey: ["/api/sessions", sessionId, "characters"] });
                  toast({
                    title: "Points attribués",
                    description: `${points} points de compétence attribués à ${character.name}`,
                    className: "bg-eldritch-green/20 border-eldritch-green"
                  });
                }}
                onRollSkill={(skillName, skillValue) => {
                  playRoll();
                  const result = rollDice("1d100");
                  toast({
                    title: `${character.name} - ${skillName}`,
                    description: `Jet: ${result.total} vs ${skillValue}% - ${result.total <= skillValue ? "Réussite" : "Échec"}`,
                    className: result.total <= skillValue ? "bg-eldritch-green/20" : "bg-blood-burgundy/20"
                  });
                }}
                onRollCharacteristic={(characteristic, value) => {
                  playRoll();
                  const result = rollDice("1d100");
                  toast({
                    title: `${character.name} - ${characteristic}`,
                    description: `Jet: ${result.total} vs ${value} - ${result.total <= value ? "Réussite" : "Échec"}`,
                    className: result.total <= value ? "bg-eldritch-green/20" : "bg-blood-burgundy/20"
                  });
                }}
              />
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* QR Code Dialog */}
      <Dialog open={showQRDialog} onOpenChange={setShowQRDialog}>
        <DialogContent className="bg-charcoal border-aged-gold">
          <DialogHeader>
            <DialogTitle className="font-cinzel text-aged-gold">Code QR de la Session</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center space-y-4 p-4">
            <QRCodeCanvas
              value={`${window.location.origin}/join/${session.code}`}
              size={200}
              bgColor="#0a0a0a"
              fgColor="#d4af37"
            />
            <p className="text-aged-parchment text-center">
              Scannez ce code QR pour rejoindre la session
            </p>
            <div className="text-2xl font-cinzel text-aged-gold">
              {session.code}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Inventory Modal */}
      <Dialog open={inventoryModalOpen} onOpenChange={setInventoryModalOpen}>
        <DialogContent className="bg-charcoal border-aged-gold max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-cinzel text-aged-gold flex items-center gap-2">
              <Package className="h-5 w-5" />
              Gestion de l'Inventaire
            </DialogTitle>
          </DialogHeader>
          {selectedCharacterForInventory && (
            <CharacterInventoryManager
              characterId={selectedCharacterForInventory}
              isGM={true}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteCharacterId} onOpenChange={() => setDeleteCharacterId(null)}>
        <AlertDialogContent className="bg-charcoal border-aged-gold">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-cinzel text-aged-gold">
              Supprimer {deleteCharacterName} ?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-aged-parchment">
              Cette action est irréversible. Le personnage sera définitivement retiré de la session.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-cosmic-void border-aged-gold text-aged-parchment hover:bg-dark-stone">
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteCharacterId && deleteCharacterMutation.mutate(deleteCharacterId)}
              className="bg-blood-burgundy hover:bg-dark-crimson text-bone-white"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

