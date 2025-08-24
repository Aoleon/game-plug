import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/navigation";
import DiceRoller from "@/components/dice-roller";
import RollHistoryVisual from "@/components/roll-history-visual";
import SanityTracker from "@/components/sanity-tracker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Edit3, Dice6, Heart, Brain, Shield, AlertTriangle, Skull, Activity, AlertCircle, RefreshCw } from "lucide-react";
import { SKILL_TRANSLATIONS } from "@/lib/cthulhu-data";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Character, SanityCondition, ActiveEffect } from "@shared/schema";

interface CharacterWithDetails extends Character {
  sanityConditions: SanityCondition[];
  activeEffects: ActiveEffect[];
}

export default function CharacterSheet() {
  const params = useParams();
  const characterId = params.id;
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [rollHistory, setRollHistory] = useState<any[]>([]);
  const [isGeneratingAvatar, setIsGeneratingAvatar] = useState(false);

  // Players don't need to be authenticated to view their character sheet
  // They just need to have joined a session

  const { data: character, isLoading: characterLoading, error } = useQuery<CharacterWithDetails>({
    queryKey: ["/api/characters", characterId],
    retry: false,
  });
  
  // Fetch roll history for this character
  const { data: characterRolls } = useQuery<any[]>({
    queryKey: ["/api/sessions", character?.sessionId, "rolls"],
    retry: false,
    enabled: !!character?.sessionId,
  });

  const handleGenerateAvatar = async () => {
    setIsGeneratingAvatar(true);
    toast({
      title: "Génération en cours",
      description: "Création de votre portrait personnalisé...",
    });
    
    try {
      console.log("Starting avatar generation for character:", characterId);
      const response = await fetch(`/api/characters/${characterId}/generate-avatar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      
      console.log("Response status:", response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response:", errorText);
        throw new Error(errorText || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Avatar generation response:", data);
      
      if (data.avatarUrl) {
        toast({
          title: "Portrait généré",
          description: "Votre nouveau portrait a été créé avec succès.",
        });
        
        // Force refresh character data to show new avatar
        await queryClient.invalidateQueries({ queryKey: ["/api/characters", characterId] });
        await queryClient.refetchQueries({ queryKey: ["/api/characters", characterId] });
      } else {
        throw new Error("Aucune URL de portrait reçue");
      }
      
    } catch (error: any) {
      console.error("Error generating avatar:", error);
      let errorMessage = "Impossible de générer le portrait.";
      
      if (error.message.includes("500") || error.message.includes("Failed")) {
        errorMessage = "Erreur lors de la génération. Veuillez réessayer dans quelques instants.";
      } else if (error.message.includes("401")) {
        errorMessage = "Erreur d'authentification. Veuillez rafraîchir la page.";
      }
      
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsGeneratingAvatar(false);
    }
  };

  if (characterLoading) {
    return (
      <div className="min-h-screen bg-deep-black flex items-center justify-center">
        <div className="text-aged-gold text-xl font-cinzel">Chargement...</div>
      </div>
    );
  }

  if (!character) {
    return (
      <div className="min-h-screen bg-deep-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-cinzel text-aged-gold mb-4">Personnage introuvable</h1>
          <Link href="/">
            <Button className="bg-blood-burgundy hover:bg-dark-crimson text-bone-white">
              Retour à l'accueil
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const characteristics = [
    { key: 'strength', label: 'Force (FOR)', value: character.strength },
    { key: 'constitution', label: 'Constitution (CON)', value: character.constitution },
    { key: 'size', label: 'Taille (TAI)', value: character.size },
    { key: 'dexterity', label: 'Dextérité (DEX)', value: character.dexterity },
    { key: 'appearance', label: 'Apparence (APP)', value: character.appearance },
    { key: 'intelligence', label: 'Intelligence (INT)', value: character.intelligence },
    { key: 'power', label: 'Pouvoir (POU)', value: character.power },
    { key: 'education', label: 'Éducation (EDU)', value: character.education },
  ];

  const skills = character.skills as Record<string, number> || {};
  
  // Calculate conditional statuses based on HP and Sanity
  const calculateConditionalStatuses = () => {
    const statuses = [];
    const hpPercentage = character.hitPoints / character.maxHitPoints;
    const sanityPercentage = character.sanity / character.maxSanity;
    
    // HP-based statuses
    if (character.hitPoints <= 0) {
      statuses.push({
        name: "Mort",
        description: "Le personnage est décédé",
        severity: "critical",
        icon: Skull,
        color: "text-black"
      });
    } else if (character.hitPoints <= 2) {
      statuses.push({
        name: "Mourant",
        description: "Inconscient et en train de mourir - Soins urgents requis!",
        severity: "critical",
        icon: Activity,
        color: "text-red-600"
      });
    } else if (hpPercentage < 0.5) {
      statuses.push({
        name: "Blessure Grave",
        description: "Malus de -20% à tous les jets de compétence",
        severity: "severe",
        icon: AlertTriangle,
        color: "text-orange-500"
      });
    } else if (hpPercentage < 0.75) {
      statuses.push({
        name: "Blessure Légère",
        description: "Malus de -10% à tous les jets de compétence",
        severity: "moderate",
        icon: AlertCircle,
        color: "text-yellow-500"
      });
    }
    
    // Sanity-based statuses
    if (character.sanity <= 0) {
      statuses.push({
        name: "Folie Permanente",
        description: "L'esprit est définitivement brisé",
        severity: "critical",
        icon: Brain,
        color: "text-purple-900"
      });
    } else if (sanityPercentage < 0.2) {
      statuses.push({
        name: "Folie Majeure",
        description: "État mental extrêmement fragile - Malus de -30% aux jets sociaux",
        severity: "severe",
        icon: Brain,
        color: "text-purple-600"
      });
    } else if (sanityPercentage < 0.5) {
      statuses.push({
        name: "Instabilité Mentale",
        description: "Nervosité et paranoïa - Malus de -15% aux jets de Psychologie et Persuasion",
        severity: "moderate",
        icon: Brain,
        color: "text-purple-400"
      });
    }
    
    // Combined status
    if (hpPercentage < 0.3 && sanityPercentage < 0.3) {
      statuses.push({
        name: "État Critique",
        description: "Corps et esprit au bord de l'effondrement - Malus de -40% à tous les jets",
        severity: "critical",
        icon: Skull,
        color: "text-red-900"
      });
    }
    
    return statuses;
  };
  
  const conditionalStatuses = calculateConditionalStatuses();

  return (
    <div className="min-h-screen bg-deep-black text-bone-white">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/">
            <Button 
              variant="outline" 
              className="border-aged-gold text-bone-white hover:bg-dark-stone"
              data-testid="button-back-home"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour
            </Button>
          </Link>
          <h1 className="font-cinzel text-3xl font-bold text-aged-gold">
            Fiche de {character.name}
          </h1>
        </div>

        {/* Character Portrait & Basic Info */}
        <Card className="bg-charcoal border-aged-gold parchment-bg mb-8">
          <CardContent className="p-6">
            <div className="grid md:grid-cols-4 gap-6">
              {/* Portrait */}
              <div className="flex flex-col items-center gap-2">
                <div className="flex justify-center">
                  {character.avatarUrl ? (
                    <img 
                      src={character.avatarUrl} 
                      alt={`Portrait de ${character.name}`}
                      className="w-48 h-48 rounded-lg border-2 border-aged-gold object-cover"
                      data-testid="img-character-portrait"
                    />
                  ) : (
                    <div className="w-48 h-48 bg-cosmic-void border-2 border-aged-gold rounded-lg flex items-center justify-center">
                      <span className="text-aged-parchment text-center">
                        Aucun portrait
                      </span>
                    </div>
                  )}
                </div>
                <Button
                  onClick={handleGenerateAvatar}
                  disabled={isGeneratingAvatar}
                  className="bg-eldritch-green hover:bg-green-800 text-bone-white"
                  size="sm"
                  data-testid="button-regenerate-avatar"
                >
                  <RefreshCw className={`mr-2 h-4 w-4 ${isGeneratingAvatar ? 'animate-spin' : ''}`} />
                  {isGeneratingAvatar ? "Génération..." : "Générer Portrait"}
                </Button>
              </div>

              {/* Basic Info */}
              <div className="md:col-span-3 space-y-4">
                <div>
                  <h2 className="font-cinzel text-2xl text-aged-gold mb-2">
                    {character.name}
                  </h2>
                  <p className="text-lg text-bone-white font-source">
                    {character.occupation}
                  </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-aged-parchment">Âge:</span>
                    <span className="text-bone-white ml-2" data-testid="text-character-age">
                      {character.age} ans
                    </span>
                  </div>
                  <div>
                    <span className="text-aged-parchment">Naissance:</span>
                    <span className="text-bone-white ml-2" data-testid="text-character-birthplace">
                      {character.birthplace || "Non spécifié"}
                    </span>
                  </div>
                  <div>
                    <span className="text-aged-parchment">Résidence:</span>
                    <span className="text-bone-white ml-2" data-testid="text-character-residence">
                      {character.residence || "Non spécifié"}
                    </span>
                  </div>
                  <div>
                    <span className="text-aged-parchment">Genre:</span>
                    <span className="text-bone-white ml-2" data-testid="text-character-gender">
                      {character.gender || "Non spécifié"}
                    </span>
                  </div>
                </div>

                {/* Vital Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <div className={`text-center bg-cosmic-void rounded-lg p-3 border-2 ${
                    character.hitPoints <= 2 ? 'border-red-600 animate-pulse' : 
                    character.hitPoints / character.maxHitPoints < 0.5 ? 'border-orange-500' :
                    character.hitPoints / character.maxHitPoints < 0.75 ? 'border-yellow-500' :
                    'border-transparent'
                  }`}>
                    <div className="text-lg font-bold text-bone-white" data-testid="text-hit-points">
                      {character.hitPoints}/{character.maxHitPoints}
                    </div>
                    <div className="text-xs text-aged-parchment">Points de Vie</div>
                  </div>
                  <div className={`text-center bg-cosmic-void rounded-lg p-3 border-2 ${
                    character.sanity <= 0 ? 'border-purple-900 animate-pulse' :
                    character.sanity / character.maxSanity < 0.2 ? 'border-purple-600' :
                    character.sanity / character.maxSanity < 0.5 ? 'border-purple-400' :
                    'border-transparent'
                  }`}>
                    <div className="text-lg font-bold text-bone-white" data-testid="text-sanity-points">
                      {character.sanity}/{character.maxSanity}
                    </div>
                    <div className="text-xs text-aged-parchment">Sanité Mentale</div>
                  </div>
                  <div className="text-center bg-cosmic-void rounded-lg p-3">
                    <div className="text-lg font-bold text-bone-white" data-testid="text-magic-points">
                      {character.magicPoints}/{character.maxMagicPoints}
                    </div>
                    <div className="text-xs text-aged-parchment">Points de Magie</div>
                  </div>
                </div>
                
                {/* Conditional Status Indicators */}
                {conditionalStatuses.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <div className="text-sm font-cinzel text-aged-gold mb-2">État Actuel</div>
                    {conditionalStatuses.map((status, index) => {
                      const Icon = status.icon;
                      return (
                        <div 
                          key={index} 
                          className={`flex items-start gap-2 p-2 rounded bg-deep-black border ${
                            status.severity === 'critical' ? 'border-red-600' :
                            status.severity === 'severe' ? 'border-orange-500' :
                            'border-yellow-500'
                          }`}
                        >
                          <Icon className={`h-5 w-5 mt-0.5 ${status.color}`} />
                          <div className="flex-1">
                            <div className={`font-source font-semibold ${status.color}`}>
                              {status.name}
                            </div>
                            <div className="text-xs text-aged-parchment mt-1">
                              {status.description}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Characteristics & Skills */}
          <div className="lg:col-span-2 space-y-8">
            {/* Characteristics */}
            <Card className="bg-charcoal border-aged-gold parchment-bg">
              <CardHeader>
                <CardTitle className="font-cinzel text-aged-gold">
                  Caractéristiques
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {characteristics.map((char) => (
                    <div key={char.key} className="flex justify-between items-center">
                      <span className="font-source">{char.label}</span>
                      <div className="flex space-x-2 text-sm">
                        <span className="w-8 text-center text-bone-white" data-testid={`stat-${char.key}`}>
                          {char.value}
                        </span>
                        <span className="w-8 text-center text-aged-parchment">
                          ({Math.floor(char.value / 2)})
                        </span>
                        <span className="w-8 text-center text-aged-parchment">
                          ({Math.floor(char.value / 5)})
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-aged-gold">
                  <div className="text-xs text-aged-parchment text-center">
                    Valeur / (Moitié) / (Un cinquième)
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Skills */}
            <Card className="bg-charcoal border-aged-gold parchment-bg">
              <CardHeader>
                <CardTitle className="font-cinzel text-aged-gold flex justify-between items-center">
                  <span>Compétences</span>
                  {character.skillsLocked && (
                    <Badge variant="outline" className="border-aged-gold text-aged-gold">
                      <Shield className="h-3 w-3 mr-1" />
                      Verrouillées
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  {Object.entries(skills).map(([skillName, skillValue]) => (
                    <div key={skillName} className="flex justify-between items-center">
                      <span className="font-source text-aged-parchment">
                        {SKILL_TRANSLATIONS[skillName] || skillName.charAt(0).toUpperCase() + skillName.slice(1).replace(/_/g, ' ')}
                      </span>
                      <span className="text-bone-white font-bold" data-testid={`skill-${skillName}`}>
                        {skillValue}%
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Dice Roller & Sanity */}
          <div className="space-y-6">
            <DiceRoller character={character} />
            <SanityTracker character={character} />

            {/* Active Effects */}
            {(character.sanityConditions.length > 0 || character.activeEffects.length > 0) && (
              <Card className="bg-charcoal border-aged-gold parchment-bg">
                <CardHeader>
                  <CardTitle className="font-cinzel text-aged-gold">
                    Effets Actifs
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {character.sanityConditions.map((condition) => (
                    <div key={condition.id} className="bg-cosmic-void border border-aged-gold rounded p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-source text-bone-white font-semibold">
                            {condition.type === 'phobia' ? 'Phobie: ' : 'Manie: '}
                            {condition.name}
                          </h4>
                          {condition.description && (
                            <p className="text-aged-parchment text-sm mt-1">
                              {condition.description}
                            </p>
                          )}
                        </div>
                        <span className="text-xs text-aged-gold">
                          {condition.duration}
                        </span>
                      </div>
                    </div>
                  ))}

                  {character.activeEffects.map((effect) => (
                    <div key={effect.id} className="bg-cosmic-void border border-aged-gold rounded p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-source text-bone-white font-semibold">
                            {effect.name}
                          </h4>
                          {effect.description && (
                            <p className="text-aged-parchment text-sm mt-1">
                              {effect.description}
                            </p>
                          )}
                        </div>
                        <span className="text-xs text-aged-gold">
                          {effect.type}
                        </span>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
        
        {/* Roll History & Effects History */}
        <div className="mt-8 space-y-6">
          <Card className="bg-charcoal border-aged-gold parchment-bg">
            <CardHeader>
              <CardTitle className="font-cinzel text-aged-gold">
                Historique des Lancés et Effets
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Recent Rolls */}
              {characterRolls && characterRolls.length > 0 && (
                <div>
                  <h3 className="font-source text-bone-white font-semibold mb-3">Lancés Récents</h3>
                  <div className="space-y-2">
                    {characterRolls.slice(0, 10).map((roll: any) => (
                      <div key={roll.id} className="bg-cosmic-void border border-aged-gold rounded p-2 flex justify-between items-center">
                        <div>
                          <span className="text-bone-white font-source">
                            {roll.skillName ? SKILL_TRANSLATIONS[roll.skillName] || roll.skillName : roll.rollType}
                          </span>
                          {roll.outcome && (
                            <span className={`ml-2 text-sm ${roll.outcome.includes('success') ? 'text-green-400' : 'text-red-400'}`}>
                              ({roll.outcome === 'extreme_success' ? 'Succès Extrême' : 
                                roll.outcome === 'hard_success' ? 'Succès Difficile' :
                                roll.outcome === 'success' ? 'Succès' : 'Échec'})
                            </span>
                          )}
                        </div>
                        <div className="text-right">
                          <span className="text-aged-gold font-bold">{roll.result}</span>
                          {roll.skillValue && (
                            <span className="text-aged-parchment text-sm ml-2">/ {roll.skillValue}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Effects History */}
              {character.activeEffects.length > 0 && (
                <div>
                  <h3 className="font-source text-bone-white font-semibold mb-3">Effets Appliqués</h3>
                  <div className="space-y-2">
                    {character.activeEffects.map((effect) => (
                      <div key={effect.id} className="bg-cosmic-void border border-aged-gold rounded p-2">
                        <div className="flex items-center gap-2">
                          {effect.type === 'damage' && <Heart className="h-4 w-4 text-red-500" />}
                          {effect.type === 'sanity_loss' && <Brain className="h-4 w-4 text-purple-500" />}
                          {effect.type === 'buff' && <Shield className="h-4 w-4 text-green-500" />}
                          {effect.type === 'debuff' && <Shield className="h-4 w-4 text-red-500" />}
                          <span className="text-bone-white font-source">{effect.name}</span>
                          {effect.value && (
                            <span className="text-aged-gold ml-auto">
                              {effect.type === 'damage' ? `-${effect.value} PV` : 
                               effect.type === 'sanity_loss' ? `-${effect.value} SAN` : 
                               effect.value}
                            </span>
                          )}
                        </div>
                        {effect.description && (
                          <p className="text-aged-parchment text-sm mt-1">{effect.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {(!characterRolls || characterRolls.length === 0) && character.activeEffects.length === 0 && (
                <p className="text-aged-parchment text-center">Aucun historique disponible</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
