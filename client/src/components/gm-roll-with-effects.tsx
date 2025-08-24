import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  EyeOff, Dice6, Brain, Heart, Shield, 
  Zap, Users, User, AlertTriangle, Target, Dices 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { rollDice } from "@/lib/dice";
import { useDiceSound } from "@/components/dice-sound-manager";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { Character } from "@shared/schema";

interface GMRollWithEffectsProps {
  characters: Array<Character & { 
    sanityConditions?: any[];
    activeEffects?: any[];
  }>;
  onRoll: (result: RollResult) => void;
  onApplyEffect: (effect: AppliedEffect) => Promise<void>;
}

interface RollResult {
  formula: string;
  results: Map<string, number>; // characterId -> result
  isSecret: boolean;
  effectType?: string;
  description?: string;
}

interface AppliedEffect {
  characterIds: string[];
  effectType: 'sanity' | 'health' | 'luck' | 'magic' | 'custom';
  value: number;
  description?: string;
}

const ROLL_PRESETS = [
  { 
    label: "Test de compétence", 
    value: "1d100", 
    category: "test",
    icon: Dice6,
    canApplyEffect: false
  },
  { 
    label: "Sanité mineure", 
    value: "1d4", 
    category: "sanity",
    icon: Brain,
    canApplyEffect: true,
    effectType: 'sanity'
  },
  { 
    label: "Sanité modérée", 
    value: "1d8", 
    category: "sanity",
    icon: Brain,
    canApplyEffect: true,
    effectType: 'sanity'
  },
  { 
    label: "Sanité majeure", 
    value: "2d10", 
    category: "sanity",
    icon: Brain,
    canApplyEffect: true,
    effectType: 'sanity'
  },
  { 
    label: "Dégâts légers", 
    value: "1d6", 
    category: "damage",
    icon: Heart,
    canApplyEffect: true,
    effectType: 'health'
  },
  { 
    label: "Dégâts moyens", 
    value: "2d6", 
    category: "damage",
    icon: Heart,
    canApplyEffect: true,
    effectType: 'health'
  },
  { 
    label: "Dégâts lourds", 
    value: "3d6+2", 
    category: "damage",
    icon: Heart,
    canApplyEffect: true,
    effectType: 'health'
  },
  { 
    label: "Perte de Chance", 
    value: "1d10", 
    category: "luck",
    icon: Zap,
    canApplyEffect: true,
    effectType: 'luck'
  },
  { 
    label: "Perte de Magie", 
    value: "1d6", 
    category: "magic",
    icon: Shield,
    canApplyEffect: true,
    effectType: 'magic'
  }
];

export default function GMRollWithEffects({ 
  characters, 
  onRoll, 
  onApplyEffect 
}: GMRollWithEffectsProps) {
  const { playRoll, playCritical, playFumble } = useDiceSound();
  const { toast } = useToast();
  const [selectedPreset, setSelectedPreset] = useState(ROLL_PRESETS[0]);
  const [formula, setFormula] = useState("1d100");
  const [isSecret, setIsSecret] = useState(true);
  const [selectedCharacters, setSelectedCharacters] = useState<string[]>([]);
  const [applyEffect, setApplyEffect] = useState(false);
  const [effectType, setEffectType] = useState<string>('sanity');
  const [description, setDescription] = useState("");
  const [lastResults, setLastResults] = useState<Map<string, number>>(new Map());
  const [isRolling, setIsRolling] = useState(false);
  const [rollMode, setRollMode] = useState<'individual' | 'group'>('individual');
  const [diceMode, setDiceMode] = useState<'auto' | 'manual'>('auto');
  const [pendingRoll, setPendingRoll] = useState<{ 
    formula: string; 
    selectedCharacters: string[]; 
    rollMode: string; 
    isSecret: boolean; 
    applyEffect: boolean; 
    effectType: string; 
    description: string; 
    selectedPreset: any; 
  } | null>(null);
  const [manualResults, setManualResults] = useState<{ [charId: string]: number }>({});

  const handlePresetChange = (presetValue: string) => {
    const preset = ROLL_PRESETS.find(p => p.value === presetValue);
    if (preset) {
      setSelectedPreset(preset);
      setFormula(preset.value);
      if (preset.effectType) {
        setEffectType(preset.effectType);
        setApplyEffect(preset.canApplyEffect);
      }
    }
  };

  const toggleCharacterSelection = (characterId: string) => {
    setSelectedCharacters(prev => {
      if (prev.includes(characterId)) {
        return prev.filter(id => id !== characterId);
      }
      return [...prev, characterId];
    });
  };

  const selectAllCharacters = () => {
    if (selectedCharacters.length === characters.length) {
      setSelectedCharacters([]);
    } else {
      setSelectedCharacters(characters.map(c => c.id));
    }
  };

  const handleRoll = async () => {
    if (selectedCharacters.length === 0) {
      toast({
        title: "Aucun personnage sélectionné",
        description: "Sélectionnez au moins un personnage pour le jet.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsRolling(true);
      playRoll();
      
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const results = new Map<string, number>();
      
      if (rollMode === 'group') {
        // Un seul jet pour tous
        const rollResult = rollDice(formula);
        const result = rollResult.total;
        
        selectedCharacters.forEach(charId => {
          results.set(charId, result);
        });
        
        // Play special sounds for critical results
        if (formula === "1d100") {
          if (result === 1) playCritical();
          else if (result >= 96) playFumble();
        }
      } else {
        // Jets individuels
        for (const charId of selectedCharacters) {
          const rollResult = rollDice(formula);
          results.set(charId, rollResult.total);
          
          // Play special sounds for each critical
          if (formula === "1d100") {
            if (rollResult.total === 1) playCritical();
            else if (rollResult.total >= 96) playFumble();
          }
        }
      }
      
      setLastResults(results);
      setIsRolling(false);
      
      // Send roll results
      onRoll({
        formula,
        results,
        isSecret,
        effectType: applyEffect ? effectType : undefined,
        description: description || undefined,
      });
      
      // Apply effects if requested
      if (applyEffect) {
        const effectPromises = selectedCharacters.map(async (charId) => {
          const value = results.get(charId) || 0;
          const character = characters.find(c => c.id === charId);
          
          if (character) {
            await onApplyEffect({
              characterIds: [charId],
              effectType: effectType as any,
              value,
              description: `${description || selectedPreset.label}: ${value} points`
            });
          }
        });
        
        await Promise.all(effectPromises);
        
        const totalAffected = selectedCharacters.length;
        const avgResult = Array.from(results.values()).reduce((a, b) => a + b, 0) / results.size;
        
        toast({
          title: "Effets appliqués",
          description: `${selectedPreset.label} appliqué à ${totalAffected} personnage(s). Moyenne: ${avgResult.toFixed(1)}`,
        });
      }
      
      // Reset description after roll
      setDescription("");
      
    } catch (error) {
      console.error("Invalid dice formula:", error);
      setIsRolling(false);
      toast({
        title: "Erreur",
        description: "Formule de dé invalide.",
        variant: "destructive"
      });
    }
  };

  const getEffectIcon = (type: string) => {
    switch (type) {
      case 'sanity': return Brain;
      case 'health': return Heart;
      case 'luck': return Zap;
      case 'magic': return Shield;
      default: return Dice6;
    }
  };

  const getEffectColor = (type: string) => {
    switch (type) {
      case 'sanity': return 'text-purple-400';
      case 'health': return 'text-red-400';
      case 'luck': return 'text-yellow-400';
      case 'magic': return 'text-blue-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <Card className="bg-gray-900/50 border-aged-gold/20">
      <CardHeader>
        <CardTitle className="flex justify-between items-center font-cinzel text-aged-gold">
          <span className="flex items-center gap-2">
            <Dice6 className="h-5 w-5" />
            Jets de Dés avec Effets
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDiceMode(diceMode === 'auto' ? 'manual' : 'auto')}
            className="text-aged-gold hover:text-bone-white text-xs"
            data-testid="button-toggle-dice-mode"
          >
            {diceMode === 'auto' ? 'Auto' : 'Manuel'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue="preset" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-gray-800">
            <TabsTrigger value="preset">Jets Prédéfinis</TabsTrigger>
            <TabsTrigger value="custom">Personnalisé</TabsTrigger>
          </TabsList>

          <TabsContent value="preset" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Type de jet</Label>
              <Select value={selectedPreset.value} onValueChange={handlePresetChange}>
                <SelectTrigger data-testid="select-preset-roll">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLL_PRESETS.map((preset, index) => {
                    const Icon = preset.icon;
                    return (
                      <SelectItem key={`${preset.value}-${index}`} value={preset.value}>
                        <div className="flex items-center gap-2">
                          <Icon className={cn("h-4 w-4", getEffectColor(preset.effectType || ''))} />
                          <span>{preset.label}</span>
                          <span className="text-gray-500">({preset.value})</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {selectedPreset.canApplyEffect && (
              <div className="p-3 bg-gray-800/50 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Appliquer automatiquement l'effet</Label>
                  <Switch
                    checked={applyEffect}
                    onCheckedChange={setApplyEffect}
                    data-testid="switch-apply-effect"
                  />
                </div>
                {applyEffect && (
                  <div className="text-xs text-gray-400">
                    Les résultats seront directement appliqués aux fiches des personnages
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="custom" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Formule personnalisée</Label>
              <Input
                value={formula}
                onChange={(e) => setFormula(e.target.value)}
                placeholder="Ex: 3d6+2"
                className="bg-gray-800 border-gray-700"
                data-testid="input-custom-formula"
              />
            </div>

            <div className="space-y-2">
              <Label>Type d'effet (si applicable)</Label>
              <Select value={effectType} onValueChange={setEffectType}>
                <SelectTrigger data-testid="select-effect-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sanity">Sanité</SelectItem>
                  <SelectItem value="health">Points de Vie</SelectItem>
                  <SelectItem value="luck">Chance</SelectItem>
                  <SelectItem value="magic">Points de Magie</SelectItem>
                  <SelectItem value="custom">Personnalisé</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <Label className="text-sm">Appliquer l'effet</Label>
              <Switch
                checked={applyEffect}
                onCheckedChange={setApplyEffect}
                data-testid="switch-apply-custom-effect"
              />
            </div>
          </TabsContent>
        </Tabs>

        {/* Character Selection */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Personnages cibles</Label>
            <Button
              variant="outline"
              size="sm"
              onClick={selectAllCharacters}
              className="text-xs"
              data-testid="button-select-all"
            >
              {selectedCharacters.length === characters.length ? "Désélectionner tout" : "Tout sélectionner"}
            </Button>
          </div>
          
          <ScrollArea className="h-32 border border-gray-700 rounded-lg p-2">
            <div className="space-y-2">
              {characters.map(character => (
                <div
                  key={character.id}
                  className={cn(
                    "flex items-center gap-2 p-2 rounded cursor-pointer transition-colors",
                    selectedCharacters.includes(character.id)
                      ? "bg-aged-gold/20 border border-aged-gold/50"
                      : "bg-gray-800/30 hover:bg-gray-800/50"
                  )}
                  onClick={() => toggleCharacterSelection(character.id)}
                  data-testid={`character-select-${character.id}`}
                >
                  <Checkbox
                    checked={selectedCharacters.includes(character.id)}
                    onCheckedChange={() => toggleCharacterSelection(character.id)}
                  />
                  <div className="flex-1 flex items-center justify-between">
                    <span className="text-sm font-medium">{character.name}</span>
                    <div className="flex gap-2">
                      <Badge variant="outline" className="text-xs">
                        SAN: {character.sanity}/{character.maxSanity}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        HP: {character.hitPoints}/{character.maxHitPoints}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Roll Mode */}
        <div className="flex items-center gap-4">
          <Label className="text-sm">Mode de jet</Label>
          <div className="flex gap-2">
            <Button
              variant={rollMode === 'individual' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setRollMode('individual')}
              className="text-xs"
              data-testid="button-mode-individual"
            >
              <User className="h-3 w-3 mr-1" />
              Individuel
            </Button>
            <Button
              variant={rollMode === 'group' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setRollMode('group')}
              className="text-xs"
              data-testid="button-mode-group"
            >
              <Users className="h-3 w-3 mr-1" />
              Groupé
            </Button>
          </div>
        </div>

        {/* Secret Mode */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Switch
              id="secret-mode"
              checked={isSecret}
              onCheckedChange={setIsSecret}
              data-testid="switch-secret-mode"
            />
            <Label htmlFor="secret-mode" className="text-sm">
              {isSecret ? "Jet secret (invisible)" : "Jet public"}
            </Label>
          </div>
          {isSecret && <EyeOff className="h-4 w-4 text-purple-400" />}
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label>Description (optionnel)</Label>
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ex: Voir quelque chose d'horrible"
            className="bg-gray-800 border-gray-700"
            data-testid="input-roll-description"
          />
        </div>

        {/* Roll Button */}
        <Button
          onClick={handleRoll}
          disabled={isRolling || selectedCharacters.length === 0}
          className={cn(
            "w-full transition-all",
            isSecret 
              ? "bg-purple-900 hover:bg-purple-800" 
              : "bg-blood-burgundy hover:bg-dark-crimson"
          )}
          data-testid="button-roll-with-effects"
        >
          <motion.div
            animate={isRolling ? { rotate: 360 } : { rotate: 0 }}
            transition={{ duration: 0.3 }}
            className="mr-2"
          >
            <Dice6 className="h-5 w-5" />
          </motion.div>
          {isRolling ? "Lancer..." : `Lancer ${formula}`}
          {selectedCharacters.length > 0 && (
            <Badge className="ml-2" variant="secondary">
              {selectedCharacters.length} cible(s)
            </Badge>
          )}
        </Button>

        {/* Results Display */}
        <AnimatePresence>
          {lastResults.size > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={cn(
                "p-3 rounded-lg",
                isSecret ? "bg-purple-900/30" : "bg-gray-800/50"
              )}
            >
              <div className="text-sm text-gray-400 mb-2">Derniers résultats</div>
              <div className="space-y-1">
                {Array.from(lastResults.entries()).map(([charId, result]) => {
                  const character = characters.find(c => c.id === charId);
                  if (!character) return null;
                  
                  return (
                    <div key={charId} className="flex items-center justify-between">
                      <span className="text-sm">{character.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-aged-gold">{result}</span>
                        {applyEffect && (
                          <Badge variant="outline" className={cn("text-xs", getEffectColor(effectType))}>
                            -{result}
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              {isSecret && (
                <div className="text-xs text-purple-400 mt-2">
                  (Invisible pour les joueurs)
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}