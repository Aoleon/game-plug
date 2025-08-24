import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Heart, Brain, Shield, Sparkles, Plus, 
  Activity, Zap, Clock, Info, CheckCircle2,
  Moon, Sun, Pill, Stethoscope, Coffee,
  Bed, BookOpen, Users, Smile
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { Character } from "@shared/schema";

interface BuffManagerProps {
  characters: Array<Character & { 
    sanityConditions?: any[];
    activeEffects?: any[];
  }>;
  onApplyBuff: (buff: BuffApplication) => Promise<void>;
}

interface BuffApplication {
  characterIds: string[];
  name: string;
  type: 'buff';
  effectType: 'heal' | 'sanity' | 'magic' | 'luck' | 'skill' | 'custom';
  value: number;
  duration?: number;
  description?: string;
}

interface BuffPreset {
  id: string;
  name: string;
  icon: any;
  effectType: 'heal' | 'sanity' | 'magic' | 'luck' | 'skill' | 'custom';
  value: string; // Can be fixed number or formula
  duration?: number;
  description: string;
  category: 'medical' | 'rest' | 'therapy' | 'magic' | 'social' | 'item';
  color: string;
}

const BUFF_PRESETS: BuffPreset[] = [
  // Medical buffs
  {
    id: "first_aid",
    name: "Premiers Soins",
    icon: Plus,
    effectType: "heal",
    value: "1d3",
    description: "Soins d'urgence basiques (+1d3 PV)",
    category: "medical",
    color: "text-green-500"
  },
  {
    id: "medical_treatment",
    name: "Traitement Médical",
    icon: Stethoscope,
    effectType: "heal",
    value: "1d6+1",
    description: "Soins médicaux professionnels (+1d6+1 PV)",
    category: "medical",
    color: "text-green-600"
  },
  {
    id: "surgery",
    name: "Chirurgie",
    icon: Activity,
    effectType: "heal",
    value: "2d6+2",
    description: "Intervention chirurgicale (+2d6+2 PV)",
    category: "medical",
    color: "text-green-700"
  },
  {
    id: "medication",
    name: "Médicaments",
    icon: Pill,
    effectType: "heal",
    value: "2",
    duration: 24,
    description: "Antidouleurs et antibiotiques (+2 PV, durée 24h)",
    category: "medical",
    color: "text-blue-500"
  },

  // Rest buffs
  {
    id: "short_rest",
    name: "Repos Court",
    icon: Coffee,
    effectType: "heal",
    value: "1",
    description: "Pause de 30 minutes (+1 PV)",
    category: "rest",
    color: "text-amber-500"
  },
  {
    id: "long_rest",
    name: "Repos Long",
    icon: Moon,
    effectType: "heal",
    value: "1d4",
    description: "Nuit de sommeil complète (+1d4 PV)",
    category: "rest",
    color: "text-indigo-500"
  },
  {
    id: "extended_rest",
    name: "Convalescence",
    icon: Bed,
    effectType: "heal",
    value: "2d4+2",
    description: "Plusieurs jours de repos (+2d4+2 PV)",
    category: "rest",
    color: "text-indigo-600"
  },

  // Therapy buffs
  {
    id: "reassurance",
    name: "Réconfort",
    icon: Smile,
    effectType: "sanity",
    value: "1",
    description: "Paroles rassurantes d'un allié (+1 SAN)",
    category: "therapy",
    color: "text-purple-400"
  },
  {
    id: "therapy_session",
    name: "Séance de Thérapie",
    icon: Brain,
    effectType: "sanity",
    value: "1d4",
    description: "Psychanalyse professionnelle (+1d4 SAN)",
    category: "therapy",
    color: "text-purple-500"
  },
  {
    id: "group_therapy",
    name: "Thérapie de Groupe",
    icon: Users,
    effectType: "sanity",
    value: "1d6",
    description: "Partage d'expériences traumatiques (+1d6 SAN)",
    category: "therapy",
    color: "text-purple-600"
  },
  {
    id: "asylum_treatment",
    name: "Traitement Psychiatrique",
    icon: BookOpen,
    effectType: "sanity",
    value: "2d6",
    description: "Soins intensifs en asile (+2d6 SAN, 1 mois)",
    category: "therapy",
    color: "text-purple-700"
  },

  // Magic buffs
  {
    id: "meditation",
    name: "Méditation",
    icon: Sun,
    effectType: "magic",
    value: "1d3",
    description: "Concentration mystique (+1d3 PM)",
    category: "magic",
    color: "text-cyan-500"
  },
  {
    id: "ritual_rest",
    name: "Repos Rituel",
    icon: Sparkles,
    effectType: "magic",
    value: "1d6",
    description: "Récupération de pouvoir magique (+1d6 PM)",
    category: "magic",
    color: "text-cyan-600"
  },

  // Luck/Skill buffs
  {
    id: "blessing",
    name: "Bénédiction",
    icon: Shield,
    effectType: "luck",
    value: "1d10",
    duration: 10,
    description: "Protection divine temporaire (+1d10 Chance)",
    category: "magic",
    color: "text-yellow-500"
  },
  {
    id: "inspiration",
    name: "Inspiration",
    icon: Zap,
    effectType: "skill",
    value: "10",
    duration: 1,
    description: "Bonus temporaire aux compétences (+10% prochain jet)",
    category: "social",
    color: "text-orange-500"
  }
];

export default function BuffManager({ characters, onApplyBuff }: BuffManagerProps) {
  const { toast } = useToast();
  const [selectedCharacters, setSelectedCharacters] = useState<string[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<BuffPreset | null>(null);
  const [customValue, setCustomValue] = useState("");
  const [customDuration, setCustomDuration] = useState("");
  const [customDescription, setCustomDescription] = useState("");
  const [isApplying, setIsApplying] = useState(false);

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

  const handlePresetSelect = (presetId: string) => {
    const preset = BUFF_PRESETS.find(p => p.id === presetId);
    if (preset) {
      setSelectedPreset(preset);
      setCustomValue(preset.value);
      setCustomDuration(preset.duration?.toString() || "");
      setCustomDescription(preset.description);
    }
  };

  const calculateValue = (formula: string): number => {
    // Parse dice formulas like "1d6+2"
    const diceRegex = /(\d+)d(\d+)([+-]\d+)?/;
    const match = formula.match(diceRegex);
    
    if (match) {
      const [, count, sides, modifier] = match;
      let total = 0;
      for (let i = 0; i < parseInt(count); i++) {
        total += Math.floor(Math.random() * parseInt(sides)) + 1;
      }
      if (modifier) {
        total += parseInt(modifier);
      }
      return total;
    }
    
    return parseInt(formula) || 0;
  };

  const handleApplyBuff = async () => {
    if (selectedCharacters.length === 0) {
      toast({
        title: "Aucun personnage sélectionné",
        description: "Sélectionnez au moins un personnage pour appliquer le buff.",
        variant: "destructive"
      });
      return;
    }

    if (!selectedPreset && !customValue) {
      toast({
        title: "Aucun buff sélectionné",
        description: "Sélectionnez un buff prédéfini ou entrez une valeur personnalisée.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsApplying(true);

      const value = calculateValue(customValue);
      const duration = customDuration ? parseInt(customDuration) : undefined;

      const buff: BuffApplication = {
        characterIds: selectedCharacters,
        name: selectedPreset?.name || "Buff Personnalisé",
        type: 'buff',
        effectType: selectedPreset?.effectType || 'custom',
        value,
        duration,
        description: customDescription || undefined
      };

      await onApplyBuff(buff);

      // Show success for each character
      const characterNames = selectedCharacters
        .map(id => characters.find(c => c.id === id)?.name)
        .filter(Boolean)
        .join(", ");

      toast({
        title: "Buff appliqué avec succès",
        description: `${buff.name} (+${value}) appliqué à : ${characterNames}`,
        className: "bg-eldritch-green/20 border-eldritch-green"
      });

      // Reset form
      setSelectedCharacters([]);
      setSelectedPreset(null);
      setCustomValue("");
      setCustomDuration("");
      setCustomDescription("");
    } catch (error) {
      console.error("Error applying buff:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'appliquer le buff.",
        variant: "destructive"
      });
    } finally {
      setIsApplying(false);
    }
  };

  const categorizedPresets = BUFF_PRESETS.reduce((acc, preset) => {
    if (!acc[preset.category]) {
      acc[preset.category] = [];
    }
    acc[preset.category].push(preset);
    return acc;
  }, {} as Record<string, BuffPreset[]>);

  const categoryIcons = {
    medical: Heart,
    rest: Moon,
    therapy: Brain,
    magic: Sparkles,
    social: Users,
    item: Shield
  };

  const categoryLabels = {
    medical: "Soins Médicaux",
    rest: "Repos",
    therapy: "Thérapie Mentale",
    magic: "Magie & Mystique",
    social: "Social",
    item: "Objets"
  };

  return (
    <Card className="bg-charcoal border-aged-gold parchment-bg">
      <CardHeader>
        <CardTitle className="font-cinzel text-aged-gold flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          Gestion des Buffs & Soins
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Character Selection */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <Label className="text-aged-parchment">Personnages Ciblés</Label>
            <Button
              variant="outline"
              size="sm"
              onClick={selectAllCharacters}
              className="text-xs"
            >
              {selectedCharacters.length === characters.length ? "Désélectionner tout" : "Tout sélectionner"}
            </Button>
          </div>
          <ScrollArea className="h-32 border border-aged-gold/30 rounded p-2">
            <div className="space-y-2">
              {characters.map(character => (
                <div
                  key={character.id}
                  className={cn(
                    "flex items-center gap-2 p-2 rounded cursor-pointer transition-colors",
                    selectedCharacters.includes(character.id)
                      ? "bg-aged-gold/20 border border-aged-gold"
                      : "hover:bg-cosmic-void"
                  )}
                  onClick={() => toggleCharacterSelection(character.id)}
                >
                  <Checkbox
                    checked={selectedCharacters.includes(character.id)}
                    onCheckedChange={() => toggleCharacterSelection(character.id)}
                    data-testid={`select-character-${character.id}`}
                  />
                  <div className="flex-1">
                    <div className="font-source text-bone-white">
                      {character.name}
                    </div>
                    <div className="text-xs text-aged-parchment flex gap-2">
                      <span>PV: {character.hitPoints}/{character.maxHitPoints}</span>
                      <span>SAN: {character.sanity}/{character.maxSanity}</span>
                      {character.magicPoints > 0 && (
                        <span>PM: {character.magicPoints}/{character.maxMagicPoints}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Buff Selection */}
        <div>
          <Label className="text-aged-parchment mb-3 block">Type de Buff</Label>
          
          {/* Categorized Presets */}
          {Object.entries(categorizedPresets).map(([category, presets]) => {
            const Icon = categoryIcons[category as keyof typeof categoryIcons];
            return (
              <div key={category} className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="h-4 w-4 text-aged-gold" />
                  <span className="text-sm font-source text-aged-gold">
                    {categoryLabels[category as keyof typeof categoryLabels]}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {presets.map(preset => (
                    <Button
                      key={preset.id}
                      variant={selectedPreset?.id === preset.id ? "default" : "outline"}
                      size="sm"
                      className={cn(
                        "justify-start text-left h-auto py-2 px-3",
                        selectedPreset?.id === preset.id 
                          ? "bg-aged-gold text-deep-black" 
                          : "hover:bg-cosmic-void"
                      )}
                      onClick={() => handlePresetSelect(preset.id)}
                    >
                      <preset.icon className={cn("h-4 w-4 mr-2 shrink-0", preset.color)} />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{preset.name}</div>
                        <div className="text-xs opacity-70 truncate">
                          +{preset.value} {preset.duration && `(${preset.duration}h)`}
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Custom Values */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-aged-parchment text-sm">
                Valeur (nombre ou formule de dés)
              </Label>
              <Input
                value={customValue}
                onChange={(e) => setCustomValue(e.target.value)}
                placeholder="Ex: 5 ou 1d6+2"
                className="bg-cosmic-void border-aged-gold text-bone-white mt-1"
              />
            </div>
            <div>
              <Label className="text-aged-parchment text-sm">
                Durée (heures, optionnel)
              </Label>
              <Input
                type="number"
                value={customDuration}
                onChange={(e) => setCustomDuration(e.target.value)}
                placeholder="Ex: 24"
                className="bg-cosmic-void border-aged-gold text-bone-white mt-1"
              />
            </div>
          </div>

          <div>
            <Label className="text-aged-parchment text-sm">
              Description (optionnel)
            </Label>
            <Textarea
              value={customDescription}
              onChange={(e) => setCustomDescription(e.target.value)}
              placeholder="Description de l'effet..."
              className="bg-cosmic-void border-aged-gold text-bone-white mt-1 h-20"
            />
          </div>
        </div>

        {/* Selected Buff Info */}
        {selectedPreset && (
          <Alert className="bg-eldritch-green/10 border-eldritch-green">
            <CheckCircle2 className="h-4 w-4 text-eldritch-green" />
            <AlertDescription className="text-bone-white">
              <strong>{selectedPreset.name}:</strong> {selectedPreset.description}
            </AlertDescription>
          </Alert>
        )}

        {/* Apply Button */}
        <Button
          onClick={handleApplyBuff}
          disabled={isApplying || selectedCharacters.length === 0}
          className="w-full bg-eldritch-green hover:bg-green-700 text-bone-white"
        >
          <Sparkles className="mr-2 h-4 w-4" />
          {isApplying ? "Application..." : "Appliquer le Buff"}
        </Button>
      </CardContent>
    </Card>
  );
}