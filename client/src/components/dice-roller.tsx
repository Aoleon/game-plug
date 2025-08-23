import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { rollDice } from "@/lib/dice";
import { Dice6, Target, Brain, Swords } from "lucide-react";
import { motion } from "framer-motion";
import { useDiceSound } from "@/components/dice-sound-manager";
import type { Character } from "@shared/schema";

interface DiceRollerProps {
  character: Character;
}

interface RollResult {
  result: number;
  outcome: 'success' | 'hard_success' | 'extreme_success' | 'failure';
  skillName: string;
  skillValue: number;
}

export default function DiceRoller({ character }: DiceRollerProps) {
  const { toast } = useToast();
  const { playRoll, playCritical, playFumble, playSuccess } = useDiceSound();
  const [lastRoll, setLastRoll] = useState<RollResult | null>(null);
  const [customSkill, setCustomSkill] = useState("");
  const [customValue, setCustomValue] = useState<number>(50);
  const [isRolling, setIsRolling] = useState(false);

  const skills = character.skills as Record<string, number> || {};

  const recordRollMutation = useMutation({
    mutationFn: async (rollData: any) => {
      const response = await apiRequest("POST", "/api/rolls", rollData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions", character.sessionId, "rolls"] });
    },
  });

  const performSkillRoll = async (skillName: string, skillValue: number) => {
    setIsRolling(true);
    playRoll();
    
    // Animation delay pour le son
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const roll = rollDice("1d100");
    const result = roll.total;
    
    let outcome: RollResult['outcome'] = 'failure';
    if (result === 1) {
      outcome = 'extreme_success';
      playCritical();
    } else if (result >= 96) {
      outcome = 'failure';
      playFumble();
    } else if (result <= skillValue / 5) {
      outcome = 'extreme_success';
      playSuccess();
    } else if (result <= skillValue / 2) {
      outcome = 'hard_success';
      playSuccess();
    } else if (result <= skillValue) {
      outcome = 'success';
      playSuccess();
    }

    const rollResult: RollResult = {
      result,
      outcome,
      skillName,
      skillValue
    };

    setLastRoll(rollResult);
    setIsRolling(false);

    // Record the roll
    recordRollMutation.mutate({
      characterId: character.id,
      sessionId: character.sessionId,
      rollType: 'skill',
      skillName,
      skillValue,
      diceFormula: '1d100',
      result,
      outcome,
      isGmRoll: false
    });

    // Show toast with result
    const outcomeText = {
      extreme_success: 'Succès Extrême',
      hard_success: 'Succès Difficile',
      success: 'Succès',
      failure: 'Échec'
    }[outcome];

    toast({
      title: `${skillName}: ${outcomeText}`,
      description: `Résultat: ${result} (cible: ${skillValue})`,
      variant: outcome === 'failure' ? 'destructive' : 'default',
    });
  };

  const performSanityCheck = () => {
    const roll = rollDice("1d100");
    const result = roll.total;
    const sanityValue = character.sanity;
    
    const success = result <= sanityValue;
    
    setLastRoll({
      result,
      outcome: success ? 'success' : 'failure',
      skillName: 'Test de Sanité',
      skillValue: sanityValue
    });

    recordRollMutation.mutate({
      characterId: character.id,
      sessionId: character.sessionId,
      rollType: 'sanity',
      skillName: 'Sanity Check',
      skillValue: sanityValue,
      diceFormula: '1d100',
      result,
      outcome: success ? 'success' : 'failure',
      isGmRoll: false
    });

    toast({
      title: `Test de Sanité: ${success ? 'Succès' : 'Échec'}`,
      description: `Résultat: ${result} (sanité: ${sanityValue})`,
      variant: success ? 'default' : 'destructive',
    });
  };

  const performCustomRoll = () => {
    if (!customSkill.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez spécifier le nom de la compétence.",
        variant: "destructive",
      });
      return;
    }

    performSkillRoll(customSkill, customValue);
    setCustomSkill("");
    setCustomValue(50);
  };

  const commonSkills = [
    { name: 'Psychologie', value: skills.psychology || 10 },
    { name: 'Occultisme', value: skills.occult || 5 },
    { name: 'Bibliothèque', value: skills.library_use || 20 },
    { name: 'Esquive', value: skills.dodge || Math.floor(character.dexterity / 2) },
    { name: 'Écouter', value: skills.listen || 20 },
    { name: 'Voir', value: skills.spot || 25 },
    { name: 'Discrétion', value: skills.stealth || 20 },
    { name: 'Persuasion', value: skills.persuade || 10 },
  ];

  return (
    <Card className="bg-charcoal border-aged-gold parchment-bg">
      <CardHeader>
        <CardTitle className="font-cinzel text-aged-gold">
          <Dice6 className="inline mr-2 h-5 w-5" />
          Lancers de Dés
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick Skill Rolls */}
        <div className="grid grid-cols-2 gap-2">
          {commonSkills.slice(0, 6).map((skill) => (
            <Button
              key={skill.name}
              onClick={() => performSkillRoll(skill.name, skill.value)}
              className="bg-cosmic-void hover:bg-dark-stone border border-aged-gold text-bone-white p-2 h-auto flex flex-col transition-colors"
              data-testid={`button-skill-${skill.name.toLowerCase().replace(' ', '-')}`}
            >
              <div className="font-source text-sm">{skill.name}</div>
              <div className="text-xs text-aged-parchment">{skill.value}%</div>
            </Button>
          ))}
        </div>

        {/* Special Rolls */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={performSanityCheck}
            className="bg-dark-crimson hover:bg-blood-burgundy text-bone-white p-3 flex items-center justify-center transition-colors"
            data-testid="button-sanity-check"
          >
            <Brain className="mr-2 h-4 w-4" />
            Test de Sanité
          </Button>
          <Button
            onClick={() => {
              const roll = rollDice("1d100");
              toast({
                title: "Chance",
                description: `Résultat: ${roll.total}`,
              });
            }}
            className="bg-eldritch-green hover:bg-green-800 text-bone-white p-3 flex items-center justify-center transition-colors"
            data-testid="button-luck-roll"
          >
            <Target className="mr-2 h-4 w-4" />
            Test de Chance
          </Button>
        </div>

        {/* Custom Roll */}
        <div className="border border-aged-gold rounded-lg p-3 bg-cosmic-void">
          <div className="space-y-2">
            <Input
              value={customSkill}
              onChange={(e) => setCustomSkill(e.target.value)}
              placeholder="Nom de la compétence"
              className="bg-deep-black border-aged-gold text-bone-white"
              data-testid="input-custom-skill-name"
            />
            <div className="flex gap-2">
              <Input
                type="number"
                value={customValue}
                onChange={(e) => setCustomValue(parseInt(e.target.value) || 0)}
                placeholder="Valeur %"
                min={1}
                max={100}
                className="w-20 bg-deep-black border-aged-gold text-bone-white"
                data-testid="input-custom-skill-value"
              />
              <Button
                onClick={performCustomRoll}
                className="flex-1 bg-blood-burgundy hover:bg-dark-crimson text-bone-white transition-colors"
                data-testid="button-custom-roll"
              >
                <Dice6 className="mr-2 h-4 w-4" />
                Lancer
              </Button>
            </div>
          </div>
        </div>

        {/* Roll Result Display */}
        {lastRoll && (
          <div className="bg-cosmic-void border border-aged-gold rounded-lg p-4 text-center animate-fade-in">
            <div className={`text-3xl font-bold mb-2 ${
              lastRoll.outcome === 'failure' ? 'text-blood-burgundy' :
              lastRoll.outcome === 'extreme_success' ? 'text-aged-gold' :
              lastRoll.outcome === 'hard_success' ? 'text-eldritch-green' :
              'text-bone-white'
            }`} data-testid="text-roll-result">
              {lastRoll.result}
            </div>
            <div className={`text-lg font-semibold mb-1 ${
              lastRoll.outcome === 'failure' ? 'text-blood-burgundy' : 'text-eldritch-green'
            }`} data-testid="text-roll-outcome">
              {lastRoll.outcome === 'extreme_success' && 'Succès Extrême'}
              {lastRoll.outcome === 'hard_success' && 'Succès Difficile'}
              {lastRoll.outcome === 'success' && 'Succès'}
              {lastRoll.outcome === 'failure' && 'Échec'}
            </div>
            <div className="text-sm text-aged-parchment" data-testid="text-roll-skill">
              {lastRoll.skillName} ({lastRoll.skillValue}%)
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
