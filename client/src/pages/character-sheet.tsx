import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/navigation";
import DiceRoller from "@/components/dice-roller";
import SanityTracker from "@/components/sanity-tracker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Edit3, Dice6 } from "lucide-react";
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

  const { data: character, isLoading: characterLoading, error } = useQuery<CharacterWithDetails>({
    queryKey: ["/api/characters", characterId],
    retry: false,
  });

  if (characterLoading || isLoading) {
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
                  <div className="text-center bg-cosmic-void rounded-lg p-3">
                    <div className="text-lg font-bold text-bone-white" data-testid="text-hit-points">
                      {character.hitPoints}/{character.maxHitPoints}
                    </div>
                    <div className="text-xs text-aged-parchment">Points de Vie</div>
                  </div>
                  <div className="text-center bg-cosmic-void rounded-lg p-3">
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
                <CardTitle className="font-cinzel text-aged-gold">
                  Compétences
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  {Object.entries(skills).map(([skillName, skillValue]) => (
                    <div key={skillName} className="flex justify-between items-center">
                      <span className="font-source text-aged-parchment">
                        {skillName.charAt(0).toUpperCase() + skillName.slice(1)}
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
      </div>
    </div>
  );
}
