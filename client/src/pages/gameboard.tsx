import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useWebSocket } from "@/hooks/useWebSocket";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import { 
  Users, Image, Upload, Link, Wand2, Monitor, 
  Heart, Brain, Shield, Coins, Eye, EyeOff,
  Maximize, Minimize, RotateCcw, Download,
  Skull, AlertTriangle, Sparkles, Activity
} from "lucide-react";
import type { Character, GameSession, SanityCondition, ActiveEffect } from "@shared/schema";

interface CharacterWithDetails extends Character {
  sanityConditions: SanityCondition[];
  activeEffects: ActiveEffect[];
}

interface ProjectionContent {
  type: 'image' | 'text' | 'none';
  url?: string;
  description?: string;
  prompt?: string;
}

export default function GameBoard() {
  const params = useParams();
  const sessionId = params.sessionId;
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  
  // WebSocket for real-time updates
  const { isConnected, sendMessage, lastMessage } = useWebSocket("/ws");
  
  // States
  const [projectionContent, setProjectionContent] = useState<ProjectionContent>({ type: 'none' });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showPlayerList, setShowPlayerList] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [imagePrompt, setImagePrompt] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

  // Data fetching
  const { data: session } = useQuery<GameSession>({
    queryKey: ["/api/sessions", sessionId],
    enabled: isAuthenticated && !!sessionId,
  });

  const { data: characters = [] } = useQuery<CharacterWithDetails[]>({
    queryKey: ["/api/sessions", sessionId, "characters"],
    enabled: isAuthenticated && !!sessionId,
    refetchInterval: 2000, // Refresh every 2s for real-time feel
  });

  // WebSocket setup
  useEffect(() => {
    if (isConnected && sessionId) {
      sendMessage('join_session', { sessionId, role: 'gameboard' });
    }
  }, [isConnected, sessionId, sendMessage]);

  // Listen to WebSocket messages for real-time updates
  useEffect(() => {
    if (lastMessage) {
      switch (lastMessage.type) {
        case 'character_updated':
        case 'effect_applied':
        case 'buff_applied':
          // Refresh character data
          queryClient.invalidateQueries({ queryKey: ["/api/sessions", sessionId, "characters"] });
          break;
        case 'projection_update':
          // Update projection content
          if (lastMessage.data) {
            setProjectionContent(lastMessage.data);
          }
          break;
      }
    }
  }, [lastMessage, sessionId]);

  const handleGenerateImage = async () => {
    if (!imagePrompt.trim()) return;
    
    setIsGenerating(true);
    try {
      const response = await apiRequest("POST", "/api/gameboard/generate-scene", {
        prompt: imagePrompt,
        sessionId: sessionId
      });
      const data = await response.json();
      
      const newContent: ProjectionContent = {
        type: 'image',
        url: data.imageUrl,
        description: imagePrompt,
        prompt: imagePrompt
      };
      
      setProjectionContent(newContent);
      
      // Broadcast to WebSocket for sync
      if (isConnected) {
        sendMessage('projection_update', {
          sessionId,
          content: newContent,
          timestamp: new Date()
        });
      }
      
      toast({
        title: "Image générée",
        description: "La scène a été générée et projetée.",
      });
      
      setImagePrompt("");
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de générer l'image.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleLoadFromUrl = () => {
    if (!imageUrl.trim()) return;
    
    const newContent: ProjectionContent = {
      type: 'image',
      url: imageUrl,
      description: "Image depuis URL"
    };
    
    setProjectionContent(newContent);
    
    if (isConnected) {
      sendMessage('projection_update', {
        sessionId,
        content: newContent,
        timestamp: new Date()
      });
    }
    
    toast({
      title: "Image chargée",
      description: "L'image a été chargée depuis l'URL.",
    });
    
    setImageUrl("");
  };

  const clearProjection = () => {
    const newContent: ProjectionContent = { type: 'none' };
    setProjectionContent(newContent);
    
    if (isConnected) {
      sendMessage('projection_update', {
        sessionId,
        content: newContent,
        timestamp: new Date()
      });
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    if (!isFullscreen) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  const getCharacterStatusColor = (character: CharacterWithDetails) => {
    const hpPercent = character.hitPoints / character.maxHitPoints;
    const sanityPercent = character.sanity / character.maxSanity;
    
    if (hpPercent <= 0.3 || sanityPercent <= 0.3) return "border-blood-burgundy bg-blood-burgundy/10";
    if (hpPercent <= 0.6 || sanityPercent <= 0.6) return "border-yellow-600 bg-yellow-600/10";
    return "border-eldritch-green bg-eldritch-green/10";
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-deep-black flex items-center justify-center">
        <div className="text-blood-burgundy font-cinzel text-2xl">Session introuvable</div>
      </div>
    );
  }

  return (
    <div className={cn(
      "h-screen bg-deep-black text-bone-white flex overflow-hidden",
      isFullscreen && "fixed inset-0 z-50"
    )}>
      {/* Player Status Sidebar */}
      <div className={cn(
        "transition-all duration-300 bg-charcoal border-r border-aged-gold/30",
        showPlayerList ? "w-80" : "w-12",
        isFullscreen && !showPlayerList && "w-0"
      )}>
        {showPlayerList ? (
          <div className="h-full flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-aged-gold/30">
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-cinzel text-aged-gold text-lg">
                  Tableau de Jeu
                </h2>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowPlayerList(false)}
                  className="text-aged-parchment hover:text-aged-gold p-1"
                >
                  <EyeOff className="h-4 w-4" />
                </Button>
              </div>
              <div className="text-sm text-aged-parchment">
                Session: {session.name}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  isConnected ? "bg-eldritch-green" : "bg-blood-burgundy"
                )} />
                <span className="text-xs text-aged-parchment">
                  {isConnected ? "Connecté" : "Déconnecté"}
                </span>
              </div>
            </div>

            {/* Characters List */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-3">
                {characters.length === 0 ? (
                  <div className="text-aged-parchment text-center py-8">
                    <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Aucun personnage</p>
                  </div>
                ) : (
                  characters.map((character) => (
                    <Card key={character.id} className={cn(
                      "parchment-bg transition-all duration-200",
                      getCharacterStatusColor(character)
                    )}>
                      <CardContent className="p-3">
                        {/* Character Header */}
                        <div className="flex items-center gap-3 mb-2">
                          {character.avatarUrl ? (
                            <img
                              src={character.avatarUrl}
                              alt={character.name}
                              className="w-10 h-10 rounded-full border border-aged-gold object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full border border-aged-gold bg-cosmic-void flex items-center justify-center">
                              <Users className="h-5 w-5 text-aged-gold" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-cinzel text-sm font-bold text-aged-gold truncate">
                              {character.name}
                            </h3>
                            <p className="text-xs text-aged-parchment truncate">
                              {character.occupation}
                            </p>
                          </div>
                          {(character.hitPoints <= character.maxHitPoints * 0.3 || 
                            character.sanity <= character.maxSanity * 0.3) && (
                            <Skull className="h-4 w-4 text-blood-burgundy animate-pulse" />
                          )}
                        </div>

                        {/* Vital Stats */}
                        <div className="grid grid-cols-4 gap-1 mb-2">
                          <div className="text-center bg-cosmic-void/50 rounded p-1">
                            <div className={cn(
                              "text-xs font-bold",
                              character.hitPoints <= character.maxHitPoints * 0.3 ? "text-blood-burgundy" : "text-bone-white"
                            )}>
                              {character.hitPoints}/{character.maxHitPoints}
                            </div>
                            <div className="text-xs text-aged-parchment">PV</div>
                          </div>
                          <div className="text-center bg-cosmic-void/50 rounded p-1">
                            <div className={cn(
                              "text-xs font-bold",
                              character.sanity <= character.maxSanity * 0.3 ? "text-purple-400" : "text-bone-white"
                            )}>
                              {character.sanity}/{character.maxSanity}
                            </div>
                            <div className="text-xs text-aged-parchment">SAN</div>
                          </div>
                          <div className="text-center bg-cosmic-void/50 rounded p-1">
                            <div className="text-xs font-bold text-bone-white">
                              {character.magicPoints}/{character.maxMagicPoints}
                            </div>
                            <div className="text-xs text-aged-parchment">PM</div>
                          </div>
                          <div className="text-center bg-cosmic-void/50 rounded p-1">
                            <div className="text-xs font-bold text-yellow-600">
                              ${typeof character.money === 'string' ? parseFloat(character.money).toFixed(0) : (character.money || 0).toFixed(0)}
                            </div>
                            <div className="text-xs text-aged-parchment">$</div>
                          </div>
                        </div>

                        {/* Active Effects */}
                        {(character.sanityConditions.length > 0 || character.activeEffects.length > 0) && (
                          <div className="space-y-1">
                            {character.sanityConditions.slice(0, 2).map((condition) => (
                              <Badge 
                                key={condition.id} 
                                variant="outline" 
                                className="text-xs bg-purple-900/30 border-purple-400 w-full justify-center"
                              >
                                {condition.type === 'phobia' ? '😨' : '🌀'} {condition.name}
                              </Badge>
                            ))}
                            {character.activeEffects.slice(0, 1).map((effect) => (
                              <Badge 
                                key={effect.id} 
                                variant="outline" 
                                className={cn(
                                  "text-xs w-full justify-center",
                                  effect.type === 'buff' ? "bg-eldritch-green/20 border-eldritch-green" : "bg-blood-burgundy/20 border-blood-burgundy"
                                )}
                              >
                                {effect.type === 'buff' ? '↑' : '↓'} {effect.name}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-start pt-4">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowPlayerList(true)}
              className="text-aged-parchment hover:text-aged-gold p-2"
            >
              <Eye className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Main Projection Area */}
      <div className="flex-1 flex flex-col">
        {/* Control Bar */}
        {!isFullscreen && (
          <div className="bg-charcoal border-b border-aged-gold/30 p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Monitor className="h-5 w-5 text-aged-gold" />
                <span className="text-sm font-cinzel text-aged-gold">Zone de Projection</span>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={clearProjection}
                  className="border-aged-gold text-aged-gold hover:bg-cosmic-void"
                >
                  <RotateCcw className="h-4 w-4 mr-1" />
                  Effacer
                </Button>
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={toggleFullscreen}
                  className="border-aged-gold text-aged-gold hover:bg-cosmic-void"
                >
                  <Maximize className="h-4 w-4 mr-1" />
                  Plein Écran
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Projection Content */}
        <div className="flex-1 bg-deep-black relative overflow-hidden">
          {projectionContent.type === 'none' ? (
            <div className="h-full flex flex-col items-center justify-center text-aged-parchment">
              <Monitor className="h-24 w-24 mb-4 opacity-30" />
              <h3 className="text-2xl font-cinzel mb-2">Zone de Projection</h3>
              <p className="text-center max-w-md">
                Utilisez les outils ci-dessous pour projeter des images, descriptions et éléments visuels aux joueurs.
              </p>
            </div>
          ) : projectionContent.type === 'image' ? (
            <div className="h-full flex items-center justify-center p-4">
              <div className="max-w-full max-h-full">
                <img
                  src={projectionContent.url}
                  alt={projectionContent.description || "Projection"}
                  className="max-w-full max-h-full object-contain rounded-lg shadow-2xl border border-aged-gold/30"
                />
              </div>
              
              {projectionContent.description && (
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="bg-charcoal/90 border border-aged-gold/30 rounded-lg p-3 backdrop-blur-sm">
                    <p className="text-aged-parchment text-center">
                      {projectionContent.description}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center p-8">
              <div className="max-w-4xl text-center">
                <h2 className="text-4xl font-cinzel text-aged-gold mb-4">
                  {projectionContent.description}
                </h2>
              </div>
            </div>
          )}
          
          {/* Fullscreen Controls */}
          {isFullscreen && (
            <div className="absolute top-4 right-4 z-10">
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={clearProjection}
                  className="bg-charcoal/80 border border-aged-gold/30 text-aged-gold hover:bg-cosmic-void"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={toggleFullscreen}
                  className="bg-charcoal/80 border border-aged-gold/30 text-aged-gold hover:bg-cosmic-void"
                >
                  <Minimize className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Tools Panel */}
        {!isFullscreen && (
          <div className="bg-charcoal border-t border-aged-gold/30 p-4">
            <Tabs defaultValue="ai-generation" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-cosmic-void">
                <TabsTrigger value="ai-generation" className="text-xs">
                  <Wand2 className="h-3 w-3 mr-1" />
                  Génération IA
                </TabsTrigger>
                <TabsTrigger value="url-load" className="text-xs">
                  <Link className="h-3 w-3 mr-1" />
                  Charger URL
                </TabsTrigger>
                <TabsTrigger value="upload" className="text-xs">
                  <Upload className="h-3 w-3 mr-1" />
                  Import
                </TabsTrigger>
              </TabsList>

              <TabsContent value="ai-generation" className="mt-4">
                <div className="space-y-3">
                  <Textarea
                    placeholder="Décrivez la scène à générer (ex: Une bibliothèque sombre aux livres anciens, éclairée par des bougies vacillantes...)"
                    value={imagePrompt}
                    onChange={(e) => setImagePrompt(e.target.value)}
                    className="bg-cosmic-void border-aged-gold text-bone-white h-20 resize-none"
                  />
                  <Button
                    onClick={handleGenerateImage}
                    disabled={!imagePrompt.trim() || isGenerating}
                    className="w-full bg-eldritch-green hover:bg-green-700 text-bone-white"
                  >
                    <Wand2 className="h-4 w-4 mr-2" />
                    {isGenerating ? "Génération en cours..." : "Générer et Projeter"}
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="url-load" className="mt-4">
                <div className="space-y-3">
                  <Input
                    placeholder="https://example.com/image.jpg"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="bg-cosmic-void border-aged-gold text-bone-white"
                  />
                  <Button
                    onClick={handleLoadFromUrl}
                    disabled={!imageUrl.trim()}
                    className="w-full bg-aged-gold hover:bg-yellow-600 text-deep-black font-bold"
                  >
                    <Link className="h-4 w-4 mr-2" />
                    Charger depuis URL
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="upload" className="mt-4">
                <div className="space-y-3">
                  <div className="text-center p-8 border-2 border-dashed border-aged-gold/30 rounded-lg">
                    <Upload className="h-12 w-12 mx-auto mb-2 text-aged-gold opacity-50" />
                    <p className="text-aged-parchment mb-2">Import d'images à venir</p>
                    <Button
                      variant="outline"
                      onClick={() => setUploadDialogOpen(true)}
                      className="border-aged-gold text-aged-gold hover:bg-cosmic-void"
                    >
                      Sélectionner un fichier
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>

      {/* Upload Dialog (placeholder) */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="bg-charcoal border-aged-gold">
          <DialogHeader>
            <DialogTitle className="font-cinzel text-aged-gold">Import d'Image</DialogTitle>
          </DialogHeader>
          <div className="text-center py-8">
            <p className="text-aged-parchment">
              Fonctionnalité d'import à implémenter avec le stockage d'objets.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}