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
    // No polling needed - WebSocket provides real-time updates via invalidateQueries
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
          if (lastMessage.data && typeof lastMessage.data === 'object' && 'content' in lastMessage.data) {
            setProjectionContent(lastMessage.data.content);
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
            {/* Header - Compact */}
            <div className="p-2 border-b border-aged-gold/30">
              <div className="flex items-center justify-between mb-1">
                <h2 className="font-cinzel text-aged-gold text-sm">
                  Tableau de Jeu
                </h2>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowPlayerList(false)}
                  className="text-aged-parchment hover:text-aged-gold p-1 h-6 w-6"
                >
                  <EyeOff className="h-3 w-3" />
                </Button>
              </div>
              <div className="text-[10px] text-aged-parchment truncate">
                {session.name}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  isConnected ? "bg-eldritch-green" : "bg-blood-burgundy"
                )} />
                <span className="text-[9px] text-aged-parchment">
                  {isConnected ? "Connecté" : "Déconnecté"}
                </span>
              </div>
            </div>

            {/* Characters List */}
            <ScrollArea className="flex-1 p-2">
              <div className="space-y-2">
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
                      <CardContent className="p-2">
                        {/* Character Header */}
                        <div className="flex items-center gap-2 mb-1.5">
                          {character.avatarUrl ? (
                            <img
                              src={character.avatarUrl}
                              alt={character.name}
                              className="w-8 h-8 rounded-full border border-aged-gold object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full border border-aged-gold bg-cosmic-void flex items-center justify-center">
                              <Users className="h-4 w-4 text-aged-gold" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-cinzel text-xs font-bold text-aged-gold truncate leading-tight">
                              {character.name}
                            </h3>
                            <p className="text-[10px] text-aged-parchment truncate leading-tight">
                              {character.occupation}
                            </p>
                          </div>
                          {(character.hitPoints <= character.maxHitPoints * 0.3 || 
                            character.sanity <= character.maxSanity * 0.3) && (
                            <Skull className="h-3 w-3 text-blood-burgundy flex-shrink-0" />
                          )}
                        </div>

                        {/* Vital Stats - Compact Grid */}
                        <div className="grid grid-cols-2 gap-1.5 mb-1.5">
                          {/* Health Points */}
                          <div className="space-y-0.5">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-0.5">
                                <Heart className="h-2.5 w-2.5 text-blood-burgundy" />
                                <span className="text-[10px] text-aged-parchment">PV</span>
                              </div>
                              <span className="text-[10px] font-bold text-bone-white">
                                {character.hitPoints}/{character.maxHitPoints}
                              </span>
                            </div>
                            <Progress 
                              value={(character.hitPoints / character.maxHitPoints) * 100}
                              className={cn(
                                "h-1.5 border border-aged-gold/30",
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
                          <div className="space-y-0.5">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-0.5">
                                <Brain className="h-2.5 w-2.5 text-purple-400" />
                                <span className="text-[10px] text-aged-parchment">SAN</span>
                              </div>
                              <span className="text-[10px] font-bold text-bone-white">
                                {character.sanity}/{character.maxSanity}
                              </span>
                            </div>
                            <Progress 
                              value={(character.sanity / character.maxSanity) * 100}
                              className={cn(
                                "h-1.5 border border-aged-gold/30",
                                "[&>[role=progressbar]]:bg-gradient-to-r",
                                character.sanity <= character.maxSanity * 0.3 
                                  ? "[&>[role=progressbar]]:from-purple-700 [&>[role=progressbar]]:to-purple-900"
                                  : character.sanity <= character.maxSanity * 0.6
                                  ? "[&>[role=progressbar]]:from-purple-500 [&>[role=progressbar]]:to-purple-700"
                                  : "[&>[role=progressbar]]:from-blue-400 [&>[role=progressbar]]:to-purple-500"
                              )}
                            />
                          </div>

                          {/* Magic Points */}
                          <div className="space-y-0.5">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-0.5">
                                <Sparkles className="h-2.5 w-2.5 text-cyan-400" />
                                <span className="text-[10px] text-aged-parchment">PM</span>
                              </div>
                              <span className="text-[10px] font-bold text-bone-white">
                                {character.magicPoints}/{character.maxMagicPoints}
                              </span>
                            </div>
                            <Progress 
                              value={(character.magicPoints / character.maxMagicPoints) * 100}
                              className="h-1.5 border border-aged-gold/30 [&>[role=progressbar]]:bg-gradient-to-r [&>[role=progressbar]]:from-cyan-400 [&>[role=progressbar]]:to-blue-500"
                            />
                          </div>

                          {/* Money */}
                          <div className="flex items-center justify-between bg-cosmic-void/30 rounded px-1 py-0.5">
                            <div className="flex items-center gap-0.5">
                              <Coins className="h-2.5 w-2.5 text-yellow-500" />
                              <span className="text-[10px] text-aged-parchment">$</span>
                            </div>
                            <span className="text-[10px] font-bold text-yellow-500">
                              {typeof character.money === 'string' ? parseFloat(character.money).toFixed(0) : (character.money || 0).toFixed(0)}
                            </span>
                          </div>
                        </div>

                        {/* Active Effects - Only show critical ones */}
                        {(character.sanityConditions.length > 0 || character.activeEffects.length > 0) && (
                          <div className="flex flex-wrap gap-1">
                            {character.sanityConditions.slice(0, 1).map((condition) => (
                              <Badge 
                                key={condition.id} 
                                variant="outline" 
                                className="text-[9px] bg-purple-900/30 border-purple-400 px-1 py-0 h-4"
                              >
                                {condition.type === 'phobia' ? '😨' : '🌀'} {condition.name}
                              </Badge>
                            ))}
                            {character.activeEffects.slice(0, 1).map((effect) => (
                              <Badge 
                                key={effect.id} 
                                variant="outline" 
                                className={cn(
                                  "text-[9px] px-1 py-0 h-4",
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
            <div className="h-full flex flex-col items-center justify-center p-4">
              <div className="flex-1 flex items-center justify-center max-w-full max-h-full">
                <img
                  src={projectionContent.url}
                  alt="Projection"
                  className="max-w-full max-h-full object-contain rounded-lg shadow-2xl border border-aged-gold/30"
                />
              </div>
              
              {(projectionContent.description || projectionContent.prompt) && (
                <div className="w-full max-w-4xl mt-4 mb-2">
                  <div className="bg-charcoal/95 border border-aged-gold/30 rounded-lg p-4 backdrop-blur-sm">
                    {projectionContent.description && (
                      <p className="text-aged-parchment text-center text-lg leading-relaxed">
                        {projectionContent.description}
                      </p>
                    )}
                    {projectionContent.prompt && projectionContent.description && (
                      <div className="border-t border-aged-gold/20 my-2" />
                    )}
                    {projectionContent.prompt && (
                      <p className="text-aged-parchment/70 text-center text-sm italic">
                        Prompt : {projectionContent.prompt}
                      </p>
                    )}
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