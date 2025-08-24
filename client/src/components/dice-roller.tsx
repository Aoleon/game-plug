import { useState, useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { rollDice, determineSuccessLevel } from "@/lib/dice";
import { Dice1, Dice2, Dice3, Dice4, Dice5, Dice6, Dices, Target, Brain, Volume2, VolumeX } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
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

// Dice face components for visualization
const DiceFaces = {
  1: Dice1,
  2: Dice2,
  3: Dice3,
  4: Dice4,
  5: Dice5,
  6: Dice6,
};

export default function DiceRoller({ character }: DiceRollerProps) {
  const { toast } = useToast();
  const [lastRoll, setLastRoll] = useState<RollResult | null>(null);
  const [customSkill, setCustomSkill] = useState("");
  const [customValue, setCustomValue] = useState<number>(50);
  const [isRolling, setIsRolling] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showDice, setShowDice] = useState(false);
  const [animatingDice, setAnimatingDice] = useState<number[]>([]);
  const audioContext = useRef<AudioContext | null>(null);

  const skills = character.skills as Record<string, number> || {};

  // Initialize audio context
  useEffect(() => {
    if (typeof window !== 'undefined') {
      audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return () => {
      audioContext.current?.close();
    };
  }, []);

  // Play Lovecraftian sound effect
  const playSound = (type: 'roll' | 'success' | 'failure' | 'critical' | 'fumble') => {
    if (!soundEnabled || !audioContext.current) return;

    const ctx = audioContext.current;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    const now = ctx.currentTime;
    
    switch (type) {
      case 'roll':
        // Dice rolling sound - multiple quick clicks
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(800, now);
        for (let i = 0; i < 5; i++) {
          oscillator.frequency.setValueAtTime(Math.random() * 400 + 600, now + i * 0.05);
        }
        gainNode.gain.setValueAtTime(0.1, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        oscillator.start(now);
        oscillator.stop(now + 0.3);
        break;
        
      case 'success':
        // Success - ascending ethereal tone
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(440, now);
        oscillator.frequency.exponentialRampToValueAtTime(880, now + 0.3);
        gainNode.gain.setValueAtTime(0.2, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        oscillator.start(now);
        oscillator.stop(now + 0.5);
        break;
        
      case 'failure':
        // Failure - descending ominous drone
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(200, now);
        oscillator.frequency.exponentialRampToValueAtTime(50, now + 0.5);
        gainNode.gain.setValueAtTime(0.15, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.7);
        oscillator.start(now);
        oscillator.stop(now + 0.7);
        break;
        
      case 'critical':
        // Critical success - mysterious whisper
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(1200, now);
        const lfo = ctx.createOscillator();
        lfo.frequency.setValueAtTime(6, now);
        const lfoGain = ctx.createGain();
        lfoGain.gain.setValueAtTime(100, now);
        lfo.connect(lfoGain);
        lfoGain.connect(oscillator.frequency);
        lfo.start(now);
        gainNode.gain.setValueAtTime(0.1, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 1);
        oscillator.start(now);
        oscillator.stop(now + 1);
        lfo.stop(now + 1);
        break;
        
      case 'fumble':
        // Fumble - eldritch scream
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(100, now);
        oscillator.frequency.exponentialRampToValueAtTime(2000, now + 0.1);
        oscillator.frequency.exponentialRampToValueAtTime(50, now + 0.4);
        gainNode.gain.setValueAtTime(0.3, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        
        // Add distortion for horror effect
        const distortion = ctx.createWaveShaper();
        const curve = new Float32Array(256);
        for (let i = 0; i < 256; i++) {
          curve[i] = Math.sin(i * 0.05) * 0.5;
        }
        distortion.curve = curve;
        oscillator.connect(distortion);
        distortion.connect(gainNode);
        
        oscillator.start(now);
        oscillator.stop(now + 0.5);
        break;
    }
  };

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
    setShowDice(true);
    playSound('roll');
    
    // Show animated dice
    const diceSequence = [];
    for (let i = 0; i < 10; i++) {
      diceSequence.push(Math.floor(Math.random() * 100) + 1);
    }
    
    // Animate dice rolling
    for (let i = 0; i < diceSequence.length; i++) {
      setAnimatingDice([diceSequence[i]]);
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    const roll = rollDice("1d100");
    const result = roll.total;
    setAnimatingDice([result]);
    
    let outcome: RollResult['outcome'] = 'failure';
    if (result === 1) {
      outcome = 'extreme_success';
      playSound('critical');
    } else if (result >= 96) {
      outcome = 'failure';
      playSound('fumble');
    } else if (result <= skillValue / 5) {
      outcome = 'extreme_success';
      playSound('success');
    } else if (result <= skillValue / 2) {
      outcome = 'hard_success';
      playSound('success');
    } else if (result <= skillValue) {
      outcome = 'success';
      playSound('success');
    } else {
      playSound('failure');
    }

    const rollResult: RollResult = {
      result,
      outcome,
      skillName,
      skillValue
    };

    setLastRoll(rollResult);
    setIsRolling(false);
    
    // Hide dice after a delay
    setTimeout(() => {
      setShowDice(false);
      setAnimatingDice([]);
    }, 2000);

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
        <CardTitle className="font-cinzel text-aged-gold flex justify-between items-center">
          <span>
            <Dice6 className="inline mr-2 h-5 w-5" />
            Lancers de Dés
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="text-aged-gold hover:text-bone-white"
          >
            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
          </Button>
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

        {/* Animated Dice Display */}
        <AnimatePresence>
          {showDice && animatingDice.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              className="flex justify-center my-4"
            >
              <motion.div
                animate={{ rotate: isRolling ? 360 : 0 }}
                transition={{ duration: 0.5, repeat: isRolling ? Infinity : 0 }}
                className="relative"
              >
                <div className="bg-cosmic-void border-2 border-aged-gold rounded-lg p-4 shadow-lg">
                  <div className="text-4xl font-bold text-aged-gold text-center">
                    {animatingDice[0]}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Roll Result Display */}
        {lastRoll && !isRolling && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-cosmic-void border border-aged-gold rounded-lg p-4 text-center"
          >
            <div className={`text-3xl font-bold mb-2 ${
              lastRoll.outcome === 'failure' ? 'text-blood-burgundy' :
              lastRoll.outcome === 'extreme_success' ? 'text-aged-gold' :
              lastRoll.outcome === 'hard_success' ? 'text-eldritch-green' :
              'text-bone-white'
            }`} data-testid="text-roll-result">
              {lastRoll.result}
            </div>
            <Badge className={cn(
              "text-lg px-3 py-1",
              lastRoll.outcome === 'failure' ? 'bg-blood-burgundy' :
              lastRoll.outcome === 'extreme_success' ? 'bg-aged-gold text-deep-black' :
              lastRoll.outcome === 'hard_success' ? 'bg-eldritch-green' :
              'bg-dark-stone'
            )} data-testid="text-roll-outcome">
              {lastRoll.outcome === 'extreme_success' && 'Succès Extrême'}
              {lastRoll.outcome === 'hard_success' && 'Succès Difficile'}
              {lastRoll.outcome === 'success' && 'Succès'}
              {lastRoll.outcome === 'failure' && 'Échec'}
            </Badge>
            <div className="text-sm text-aged-parchment mt-2" data-testid="text-roll-skill">
              {lastRoll.skillName} ({lastRoll.skillValue}%)
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}
