import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { rollDice } from "@/lib/dice";
import { Brain, AlertTriangle, Eye, Skull } from "lucide-react";
import type { Character, SanityCondition } from "@shared/schema";

interface SanityTrackerProps {
  character: Character & {
    sanityConditions?: SanityCondition[];
  };
}

export default function SanityTracker({ character }: SanityTrackerProps) {
  const { toast } = useToast();
  const [madnessModalOpen, setMadnessModalOpen] = useState(false);
  
  const sanityPercentage = (character.sanity / character.maxSanity) * 100;
  const isLowSanity = sanityPercentage < 30;
  const isCriticalSanity = sanityPercentage < 10;

  const updateSanityMutation = useMutation({
    mutationFn: async (newSanity: number) => {
      const response = await apiRequest("PATCH", `/api/characters/${character.id}`, {
        sanity: Math.max(0, Math.min(character.maxSanity, newSanity))
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/characters", character.id] });
      toast({
        title: "Sanité mise à jour",
        description: "La sanité mentale a été modifiée.",
      });
    },
  });

  const performSanityRoll = () => {
    const roll = rollDice("1d100");
    const result = roll.total;
    const success = result <= character.sanity;
    
    toast({
      title: `Test de Sanité: ${success ? 'Succès' : 'Échec'}`,
      description: `Résultat: ${result} vs Sanité: ${character.sanity}`,
      variant: success ? 'default' : 'destructive',
    });

    if (!success) {
      // On failure, suggest potential sanity loss
      toast({
        title: "Échec du test de sanité",
        description: "Le Maître de Jeu détermine la perte de sanité mentale.",
        variant: "destructive",
      });
    }
  };

  const getSanityStatus = () => {
    if (isCriticalSanity) {
      return {
        text: "Critique",
        color: "text-blood-burgundy",
        description: "Au bord de la folie permanente"
      };
    }
    if (isLowSanity) {
      return {
        text: "Instable",
        color: "text-yellow-500",
        description: "Sanité mentale fragile"
      };
    }
    if (sanityPercentage < 70) {
      return {
        text: "Ébranlé",
        color: "text-orange-500",
        description: "Marqué par l'horreur"
      };
    }
    return {
      text: "Stable",
      color: "text-eldritch-green",
      description: "Esprit relativement sain"
    };
  };

  const sanityStatus = getSanityStatus();
  const activeConditions = character.sanityConditions?.filter(c => c.isActive) || [];

  return (
    <>
      <Card className={`bg-charcoal border-aged-gold parchment-bg ${isCriticalSanity ? 'animate-pulse border-blood-burgundy' : ''}`}>
        <CardHeader>
          <CardTitle className="font-cinzel text-aged-gold flex items-center">
            <Brain className="mr-2 h-5 w-5" />
            État Mental
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Sanity Bar */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-source text-aged-parchment">Sanité Mentale</span>
              <span className="text-sm font-bold text-bone-white" data-testid="text-sanity-fraction">
                {character.sanity}/{character.maxSanity}
              </span>
            </div>
            <Progress 
              value={sanityPercentage} 
              className="h-3 border border-aged-gold"
              data-testid="progress-sanity"
            />
            <div className="flex justify-between items-center mt-1">
              <span className={`text-sm font-semibold ${sanityStatus.color}`} data-testid="text-sanity-status">
                {sanityStatus.text}
              </span>
              <span className="text-xs text-aged-parchment">
                {Math.round(sanityPercentage)}%
              </span>
            </div>
            <p className="text-xs text-aged-parchment mt-1">{sanityStatus.description}</p>
          </div>

          {/* Warning for low sanity */}
          {isLowSanity && (
            <div className="bg-blood-burgundy/20 border border-blood-burgundy rounded-lg p-3 flex items-center">
              <AlertTriangle className="h-4 w-4 text-blood-burgundy mr-2 flex-shrink-0" />
              <div className="text-sm text-bone-white">
                <strong>Attention:</strong> Sanité critique. Risque de folie permanente.
              </div>
            </div>
          )}

          {/* Active Conditions */}
          {activeConditions.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-source text-aged-gold">Conditions Mentales:</h4>
              {activeConditions.map((condition) => (
                <div key={condition.id} className="bg-cosmic-void border border-aged-gold rounded p-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-sm font-semibold text-bone-white">
                        {condition.type === 'phobia' ? '🕷️ Phobie: ' : '🌀 Manie: '}
                        {condition.name}
                      </span>
                      {condition.description && (
                        <p className="text-xs text-aged-parchment mt-1">
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
            </div>
          )}

          {/* Sanity Actions */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={performSanityRoll}
              className="bg-blood-burgundy hover:bg-dark-crimson text-bone-white transition-colors"
              data-testid="button-sanity-check"
            >
              <Brain className="mr-2 h-4 w-4" />
              Test de Sanité
            </Button>
            <Button
              onClick={() => setMadnessModalOpen(true)}
              variant="outline"
              className="border-aged-gold text-bone-white hover:bg-dark-stone transition-colors"
              data-testid="button-view-madness"
            >
              <Eye className="mr-2 h-4 w-4" />
              Voir Conditions
            </Button>
          </div>

          {/* Emergency Actions for GM */}
          <div className="border-t border-aged-gold pt-3">
            <p className="text-xs text-aged-parchment mb-2 text-center">
              Actions d'urgence (utilisation limitée)
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={() => updateSanityMutation.mutate(character.sanity + 1)}
                disabled={character.sanity >= character.maxSanity}
                size="sm"
                className="bg-eldritch-green hover:bg-green-800 text-bone-white text-xs"
                data-testid="button-gain-sanity"
              >
                +1 Sanité
              </Button>
              <Button
                onClick={() => updateSanityMutation.mutate(character.sanity - 1)}
                disabled={character.sanity <= 0}
                size="sm"
                className="bg-dark-crimson hover:bg-blood-burgundy text-bone-white text-xs"
                data-testid="button-lose-sanity"
              >
                -1 Sanité
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Madness Details Modal */}
      <Dialog open={madnessModalOpen} onOpenChange={setMadnessModalOpen}>
        <DialogContent className="bg-charcoal border-aged-gold text-bone-white max-w-md">
          <DialogHeader>
            <DialogTitle className="font-cinzel text-aged-gold flex items-center">
              <Skull className="mr-2 h-5 w-5" />
              Conditions Mentales
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {activeConditions.length === 0 ? (
              <div className="text-center py-8">
                <Brain className="mx-auto h-12 w-12 text-aged-gold mb-4" />
                <p className="text-aged-parchment">
                  Aucune condition mentale active pour le moment.
                </p>
                <p className="text-xs text-aged-parchment mt-2">
                  Un esprit relativement sain... pour l'instant.
                </p>
              </div>
            ) : (
              <>
                <div className="text-sm text-aged-parchment">
                  Conditions mentales actuelles affectant {character.name}:
                </div>
                {activeConditions.map((condition) => (
                  <div key={condition.id} className="bg-cosmic-void border border-aged-gold rounded-lg p-3">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-bone-white">
                        {condition.type === 'phobia' ? 'Phobie' : 'Manie'}: {condition.name}
                      </h4>
                      <span className="text-xs text-aged-gold">
                        {condition.duration}
                      </span>
                    </div>
                    {condition.description && (
                      <p className="text-sm text-aged-parchment">
                        {condition.description}
                      </p>
                    )}
                    <div className="mt-2 text-xs text-aged-parchement">
                      <strong>Type:</strong> {condition.type === 'phobia' ? 'Phobie' : 'Manie compulsive'}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
