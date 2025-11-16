import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useWebSocket } from "@/hooks/useWebSocket";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { queryClient } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import { 
  Users, Monitor, 
  Heart, Brain, Shield, Coins, Eye, EyeOff,
  Maximize, Minimize, RotateCcw,
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
  
  // WebSocket for real-time updates
  const { isConnected, sendMessage, lastMessage } = useWebSocket("/game-ws");
  
  // States
  const [projectionContent, setProjectionContent] = useState<ProjectionContent>({ type: 'none' });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showPlayerList, setShowPlayerList] = useState(true);

  // Data fetching - no auth required for gameboard (public display)
  const { data: session } = useQuery<GameSession>({
    queryKey: ["/api/sessions", sessionId],
    enabled: !!sessionId,
  });

  const { data: characters = [] } = useQuery<CharacterWithDetails[]>({
    queryKey: ["/api/sessions", sessionId, "characters"],
    enabled: !!sessionId,
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

                        {/* Vital Stats with Gauges */}
                        <div className="space-y-2 mb-3">
                          {/* Health Points */}
                          <div className="space-y-1">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-1">
                                <Heart className="h-3 w-3 text-blood-burgundy" />
                                <span className="text-xs text-aged-parchment font-medium">PV</span>
                              </div>
                              <span className="text-xs font-bold text-bone-white">
                                {character.hitPoints}/{character.maxHitPoints}
                              </span>
                            </div>
                            <Progress 
                              value={(character.hitPoints / character.maxHitPoints) * 100}
                              className={cn(
                                "h-2 border border-aged-gold/30",
                                "[&>[role=progressbar]]:bg-gradient-to-r",
                                character.hitPoints <= character.maxHitPoints * 0.3 
                                  ? "[&>[role=progressbar]]:from-blood-burgundy [&>[role=progressbar]]:to-red-700"
                                  : character.hitPoints <= character.maxHitPoints * 0.6
                                  ? "[&>[role=progressbar]]:from-yellow-600 [&>[role=progressbar]]:to-orange-600" 
                                  : "[&>[role=progressbar]]:from-eldritch-green [&>[role=progressbar]]:to-green-600"
                              )}
                            />
                          </div>

                          {/* Sanity */}
                          <div className="space-y-1">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-1">
                                <Brain className="h-3 w-3 text-purple-400" />
                                <span className="text-xs text-aged-parchment font-medium">SAN</span>
                              </div>
                              <span className="text-xs font-bold text-bone-white">
                                {character.sanity}/{character.maxSanity}
                              </span>
                            </div>
                            <Progress 
                              value={(character.sanity / character.maxSanity) * 100}
                              className={cn(
                                "h-2 border border-aged-gold/30",
                                "[&>[role=progressbar]]:bg-gradient-to-r",
                                character.sanity <= character.maxSanity * 0.3 
                                  ? "[&>[role=progressbar]]:from-purple-700 [&>[role=progressbar]]:to-purple-900 animate-pulse"
                                  : character.sanity <= character.maxSanity * 0.6
                                  ? "[&>[role=progressbar]]:from-purple-500 [&>[role=progressbar]]:to-purple-700"
                                  : "[&>[role=progressbar]]:from-blue-400 [&>[role=progressbar]]:to-purple-500"
                              )}
                            />
                          </div>

                          {/* Magic Points */}
                          <div className="space-y-1">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-1">
                                <Sparkles className="h-3 w-3 text-cyan-400" />
                                <span className="text-xs text-aged-parchment font-medium">PM</span>
                              </div>
                              <span className="text-xs font-bold text-bone-white">
                                {character.magicPoints}/{character.maxMagicPoints}
                              </span>
                            </div>
                            <Progress 
                              value={(character.magicPoints / character.maxMagicPoints) * 100}
                              className="h-2 border border-aged-gold/30 [&>[role=progressbar]]:bg-gradient-to-r [&>[role=progressbar]]:from-cyan-400 [&>[role=progressbar]]:to-blue-500"
                            />
                          </div>

                          {/* Money (different display) */}
                          <div className="flex items-center justify-between bg-cosmic-void/30 rounded p-1">
                            <div className="flex items-center gap-1">
                              <Coins className="h-3 w-3 text-yellow-500" />
                              <span className="text-xs text-aged-parchment font-medium">Argent</span>
                            </div>
                            <span className="text-xs font-bold text-yellow-500">
                              ${typeof character.money === 'string' ? parseFloat(character.money).toFixed(0) : (character.money || 0).toFixed(0)}
                            </span>
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

      </div>
    </div>
  );
}