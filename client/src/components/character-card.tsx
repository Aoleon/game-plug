import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollText, User, Heart, Brain, Sparkles } from "lucide-react";
import type { Character } from "@shared/schema";

interface CharacterCardProps {
  character: Character;
}

export default function CharacterCard({ character }: CharacterCardProps) {
  const sanityPercentage = (character.sanity / character.maxSanity) * 100;
  const hpPercentage = (character.hitPoints / character.maxHitPoints) * 100;
  
  const getSanityStatus = () => {
    if (sanityPercentage < 30) return { text: "Critique", class: "text-blood-burgundy animate-pulse" };
    if (sanityPercentage < 50) return { text: "Faible", class: "text-yellow-500" };
    return { text: "Stable", class: "text-eldritch-green" };
  };

  const sanityStatus = getSanityStatus();

  return (
    <Card className="bg-charcoal border-aged-gold parchment-bg eldritch-glow hover:shadow-lg transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex items-center space-x-4 mb-4">
          {character.avatarUrl ? (
            <img 
              src={character.avatarUrl} 
              alt={`Portrait de ${character.name}`}
              className="w-16 h-16 rounded-full border-2 border-aged-gold object-cover"
              data-testid={`img-character-avatar-${character.id}`}
            />
          ) : (
            <div className="w-16 h-16 rounded-full border-2 border-aged-gold bg-cosmic-void flex items-center justify-center">
              <User className="h-8 w-8 text-aged-gold" />
            </div>
          )}
          
          <div className="flex-1">
            <h3 className="font-cinzel text-xl text-aged-gold mb-1" data-testid={`text-character-name-${character.id}`}>
              {character.name}
            </h3>
            <p className="text-sm text-aged-parchment font-source" data-testid={`text-character-occupation-${character.id}`}>
              {character.occupation}
            </p>
            <p className="text-xs text-bone-white" data-testid={`text-character-age-${character.id}`}>
              {character.age} ans
            </p>
          </div>
        </div>
        
        {/* Vital Stats */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center bg-cosmic-void rounded-lg p-3">
            <div className="flex items-center justify-center mb-1">
              <Heart className="h-4 w-4 text-red-500 mr-1" />
              <div className="text-lg font-bold text-bone-white" data-testid={`text-hp-${character.id}`}>
                {character.hitPoints}/{character.maxHitPoints}
              </div>
            </div>
            <div className="text-xs text-aged-parchment">Points de Vie</div>
            <div className="w-full bg-cosmic-void rounded-full h-1 mt-1 border border-aged-gold">
              <div 
                className="bg-red-500 h-1 rounded-full transition-all duration-300"
                style={{ width: `${hpPercentage}%` }}
              />
            </div>
          </div>
          
          <div className="text-center bg-cosmic-void rounded-lg p-3">
            <div className="flex items-center justify-center mb-1">
              <Brain className="h-4 w-4 text-purple-400 mr-1" />
              <div className={`text-lg font-bold ${sanityStatus.class}`} data-testid={`text-sanity-${character.id}`}>
                {character.sanity}/{character.maxSanity}
              </div>
            </div>
            <div className="text-xs text-aged-parchment">Sanité Mentale</div>
            <div className="w-full bg-cosmic-void rounded-full h-1 mt-1 border border-aged-gold">
              <div 
                className={`h-1 rounded-full transition-all duration-300 ${
                  sanityPercentage < 30 ? 'bg-blood-burgundy' : 
                  sanityPercentage < 50 ? 'bg-yellow-500' : 'bg-eldritch-green'
                }`}
                style={{ width: `${sanityPercentage}%` }}
              />
            </div>
          </div>
          
          <div className="text-center bg-cosmic-void rounded-lg p-3">
            <div className="flex items-center justify-center mb-1">
              <Sparkles className="h-4 w-4 text-blue-400 mr-1" />
              <div className="text-lg font-bold text-bone-white" data-testid={`text-mp-${character.id}`}>
                {character.magicPoints}/{character.maxMagicPoints}
              </div>
            </div>
            <div className="text-xs text-aged-parchment">Points de Magie</div>
            <div className="w-full bg-cosmic-void rounded-full h-1 mt-1 border border-aged-gold">
              <div 
                className="bg-blue-400 h-1 rounded-full transition-all duration-300"
                style={{ width: `${(character.magicPoints / character.maxMagicPoints) * 100}%` }}
              />
            </div>
          </div>
        </div>
        
        {/* Mental Status Indicator */}
        <div className="mb-4 p-2 bg-cosmic-void border border-aged-gold rounded">
          <div className="flex justify-between items-center">
            <span className="text-sm font-source text-aged-parchment">État Mental:</span>
            <span className={`text-sm font-semibold ${sanityStatus.class}`}>
              {sanityStatus.text}
            </span>
          </div>
        </div>
        
        {/* Action Button */}
        <Link href={`/character/${character.id}`}>
          <Button 
            className="w-full bg-blood-burgundy hover:bg-dark-crimson text-bone-white font-source transition-colors"
            data-testid={`button-view-character-${character.id}`}
          >
            <ScrollText className="mr-2 h-4 w-4" />
            Voir la Fiche Complète
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
