import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Heart, Brain, Shield, Dice6, Plus, Minus, 
  Package, Edit, Trash2, Users, Eye, 
  Zap, Activity, Sparkles, GraduationCap,
  MoreVertical, TrendingUp, TrendingDown,
  Skull, AlertTriangle, ChevronDown, ChevronRight
} from "lucide-react";
import { rollDice } from "@/lib/dice";
import { useDiceSound } from "@/components/dice-sound-manager";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { SKILL_TRANSLATIONS } from "@/lib/cthulhu-data";
import type { Character, SanityCondition, ActiveEffect } from "@shared/schema";

interface EnhancedCharacterCardProps {
  character: Character & { 
    sanityConditions: SanityCondition[];
    activeEffects: ActiveEffect[];
    availableSkillPoints?: number | null;
  };
  onEdit: () => void;
  onDelete: () => void;
  onManageInventory: () => void;
  onApplyDamage: (value: number) => void;
  onApplySanity: (value: number) => void;
  onApplyBuff: (name: string, value: number, duration?: number) => void;
  onApplyDebuff: (name: string, value: number) => void;
  onGrantSkillPoints: (points: number) => void;
  onRollSkill: (skillName: string, skillValue: number) => void;
  onRollCharacteristic: (characteristic: string, value: number) => void;
  isConnected: boolean;
}

export default function EnhancedCharacterCard({
  character,
  onEdit,
  onDelete,
  onManageInventory,
  onApplyDamage,
  onApplySanity,
  onApplyBuff,
  onApplyDebuff,
  onGrantSkillPoints,
  onRollSkill,
  onRollCharacteristic,
  isConnected
}: EnhancedCharacterCardProps) {
  const { toast } = useToast();
  const { playRoll, playCritical, playFumble } = useDiceSound();
  const [isExpanded, setIsExpanded] = useState(false);
  const [quickDamage, setQuickDamage] = useState("");
  const [quickSanity, setQuickSanity] = useState("");
  const [quickBuff, setQuickBuff] = useState("");
  const [quickPoints, setQuickPoints] = useState("");
  const [activeTab, setActiveTab] = useState("stats");

  const isCriticalCondition = character.hitPoints < character.maxHitPoints * 0.3 || 
                              character.sanity < character.maxSanity * 0.3;

  const handleQuickRoll = (formula: string, label: string) => {
    playRoll();
    const result = rollDice(formula);
    
    if (formula === "1d100") {
      if (result.total === 1) playCritical();
      else if (result.total >= 96) playFumble();
    }
    
    toast({
      title: `${character.name} - ${label}`,
      description: `${formula}: ${result.total}`,
      className: "bg-cosmic-void border-aged-gold"
    });
    
    return result.total;
  };

  const skills = character.skills as Record<string, number> || {};
  const topSkills = Object.entries(skills)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <Card className={cn(
      "bg-charcoal border-aged-gold parchment-bg transition-all",
      isCriticalCondition && "border-blood-burgundy animate-pulse",
      isExpanded && "col-span-2"
    )}>
      <CardContent className="p-4">
        {/* Header Section */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            {character.avatarUrl ? (
              <img 
                src={character.avatarUrl} 
                alt={character.name}
                className="w-14 h-14 rounded-full border-2 border-aged-gold object-cover"
                data-testid={`img-character-avatar-${character.id}`}
              />
            ) : (
              <div className="w-14 h-14 rounded-full border-2 border-aged-gold bg-cosmic-void flex items-center justify-center">
                <Users className="h-7 w-7 text-aged-gold" />
              </div>
            )}
            <div>
              <h3 className="font-cinzel text-lg text-aged-gold flex items-center gap-2" data-testid={`text-character-name-${character.id}`}>
                {character.name}
                {isCriticalCondition && <Skull className="h-4 w-4 text-blood-burgundy animate-pulse" />}
              </h3>
              <p className="text-sm text-aged-parchment" data-testid={`text-character-occupation-${character.id}`}>{character.occupation}</p>
            </div>
          </div>
          
          {/* Quick Actions Menu */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4 text-aged-gold" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-1 bg-charcoal border-aged-gold">
              <Button
                onClick={onEdit}
                variant="ghost"
                size="sm"
                className="w-full justify-start text-aged-gold hover:bg-cosmic-void"
              >
                <Edit className="mr-2 h-3 w-3" />
                Éditer
              </Button>
              <Button
                onClick={onManageInventory}
                variant="ghost"
                size="sm"
                className="w-full justify-start text-eldritch-green hover:bg-cosmic-void"
              >
                <Package className="mr-2 h-3 w-3" />
                Inventaire
              </Button>
              <Button
                onClick={onDelete}
                variant="ghost"
                size="sm"
                className="w-full justify-start text-blood-burgundy hover:bg-cosmic-void"
              >
                <Trash2 className="mr-2 h-3 w-3" />
                Supprimer
              </Button>
            </PopoverContent>
          </Popover>
        </div>

        {/* Vital Stats Bar */}
        <div className="grid grid-cols-5 gap-1 mb-3">
          <div className="text-center bg-cosmic-void rounded p-2 border border-aged-gold/30">
            <div className={cn(
              "text-sm font-bold",
              character.hitPoints < character.maxHitPoints * 0.3 ? "text-blood-burgundy" : "text-bone-white"
            )}>
              {character.hitPoints}/{character.maxHitPoints}
            </div>
            <div className="text-xs text-aged-parchment">PV</div>
          </div>
          <div className="text-center bg-cosmic-void rounded p-2 border border-aged-gold/30">
            <div className={cn(
              "text-sm font-bold",
              character.sanity < character.maxSanity * 0.3 ? "text-purple-600" : "text-bone-white"
            )}>
              {character.sanity}/{character.maxSanity}
            </div>
            <div className="text-xs text-aged-parchment">SAN</div>
          </div>
          <div className="text-center bg-cosmic-void rounded p-2 border border-aged-gold/30">
            <div className="text-sm font-bold text-bone-white">
              {character.magicPoints}/{character.maxMagicPoints}
            </div>
            <div className="text-xs text-aged-parchment">PM</div>
          </div>
          <div className="text-center bg-cosmic-void rounded p-2 border border-aged-gold/30">
            <div className="text-sm font-bold text-bone-white">
              {character.luck}
            </div>
            <div className="text-xs text-aged-parchment">CHA</div>
          </div>
          <div className="text-center bg-cosmic-void rounded p-2 border border-aged-gold/30">
            <div className="text-sm font-bold text-yellow-600">
              ${typeof character.money === 'string' ? parseFloat(character.money).toFixed(0) : (character.money || 0).toFixed(0)}
            </div>
            <div className="text-xs text-aged-parchment">$</div>
          </div>
        </div>

        {/* Quick Action Inputs */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="flex gap-1">
            <Input
              type="text"
              placeholder="Dégâts"
              value={quickDamage}
              onChange={(e) => setQuickDamage(e.target.value)}
              className="h-8 text-xs bg-cosmic-void border-blood-burgundy/50"
              data-testid={`input-quick-damage-${character.id}`}
            />
            <Button
              size="sm"
              onClick={() => {
                if (quickDamage) {
                  const damage = quickDamage.includes('d') 
                    ? handleQuickRoll(quickDamage, "Dégâts")
                    : parseInt(quickDamage);
                  onApplyDamage(damage);
                  setQuickDamage("");
                }
              }}
              className="h-8 px-2 bg-blood-burgundy hover:bg-dark-crimson"
              data-testid={`button-apply-damage-${character.id}`}
            >
              <TrendingDown className="h-3 w-3" />
            </Button>
          </div>
          
          <div className="flex gap-1">
            <Input
              type="text"
              placeholder="Sanité"
              value={quickSanity}
              onChange={(e) => setQuickSanity(e.target.value)}
              className="h-8 text-xs bg-cosmic-void border-purple-600/50"
              data-testid={`input-quick-sanity-${character.id}`}
            />
            <Button
              size="sm"
              onClick={() => {
                if (quickSanity) {
                  const sanity = quickSanity.includes('d')
                    ? handleQuickRoll(quickSanity, "Perte SAN")
                    : parseInt(quickSanity);
                  onApplySanity(sanity);
                  setQuickSanity("");
                }
              }}
              className="h-8 px-2 bg-purple-600 hover:bg-purple-700"
            >
              <Brain className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Active Effects Display */}
        {(character.sanityConditions.length > 0 || character.activeEffects.length > 0) && (
          <div className="mb-3 p-2 bg-cosmic-void rounded border border-aged-gold/30">
            <div className="flex flex-wrap gap-1">
              {character.sanityConditions.slice(0, 2).map((condition) => (
                <Badge key={condition.id} variant="outline" className="text-xs bg-purple-900/50 border-purple-600">
                  {condition.type === 'phobia' ? '😨' : '🌀'} {condition.name}
                </Badge>
              ))}
              {character.activeEffects.slice(0, 2).map((effect) => (
                <Badge 
                  key={effect.id} 
                  variant="outline" 
                  className={cn(
                    "text-xs",
                    effect.type === 'buff' ? "bg-eldritch-green/20 border-eldritch-green" : "bg-blood-burgundy/20 border-blood-burgundy"
                  )}
                >
                  {effect.type === 'buff' ? '↑' : '↓'} {effect.name}
                </Badge>
              ))}
              {(character.sanityConditions.length + character.activeEffects.length) > 4 && (
                <Badge variant="outline" className="text-xs">
                  +{(character.sanityConditions.length + character.activeEffects.length) - 4}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Expandable Section */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full h-6 text-xs text-aged-parchment hover:text-aged-gold"
          data-testid={`button-expand-character-${character.id}`}
        >
          {isExpanded ? <ChevronDown className="h-3 w-3 mr-1" /> : <ChevronRight className="h-3 w-3 mr-1" />}
          {isExpanded ? "Réduire" : "Détails & Actions"}
        </Button>

        {/* Expanded Content */}
        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-aged-gold/30">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-cosmic-void">
                <TabsTrigger value="stats" className="text-xs">Stats</TabsTrigger>
                <TabsTrigger value="skills" className="text-xs">Comp.</TabsTrigger>
                <TabsTrigger value="rolls" className="text-xs">Jets</TabsTrigger>
                <TabsTrigger value="buffs" className="text-xs">Buffs</TabsTrigger>
              </TabsList>
              
              <TabsContent value="stats" className="mt-3">
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onRollCharacteristic("FOR", character.strength)}
                    className="h-7"
                  >
                    FOR {character.strength}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onRollCharacteristic("DEX", character.dexterity)}
                    className="h-7"
                  >
                    DEX {character.dexterity}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onRollCharacteristic("INT", character.intelligence)}
                    className="h-7"
                  >
                    INT {character.intelligence}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onRollCharacteristic("CON", character.constitution)}
                    className="h-7"
                  >
                    CON {character.constitution}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onRollCharacteristic("APP", character.appearance)}
                    className="h-7"
                  >
                    APP {character.appearance}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onRollCharacteristic("POU", character.power)}
                    className="h-7"
                  >
                    POU {character.power}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onRollCharacteristic("TAI", character.size)}
                    className="h-7"
                  >
                    TAI {character.size}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onRollCharacteristic("EDU", character.education)}
                    className="h-7"
                  >
                    EDU {character.education}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleQuickRoll("1d100", "Chance")}
                    className="h-7"
                  >
                    CHA {character.luck}
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="skills" className="mt-3">
                <ScrollArea className="h-32">
                  <div className="space-y-1">
                    {topSkills.map(([skillKey, value]) => (
                      <Button
                        key={skillKey}
                        size="sm"
                        variant="ghost"
                        onClick={() => onRollSkill(skillKey, value)}
                        className="w-full justify-between h-7 text-xs hover:bg-cosmic-void"
                      >
                        <span>{SKILL_TRANSLATIONS[skillKey] || skillKey}</span>
                        <span className="font-bold">{value}%</span>
                      </Button>
                    ))}
                  </div>
                </ScrollArea>
                {character.availableSkillPoints && character.availableSkillPoints > 0 && (
                  <div className="mt-2 flex gap-1">
                    <Input
                      type="number"
                      placeholder="Points"
                      value={quickPoints}
                      onChange={(e) => setQuickPoints(e.target.value)}
                      className="h-7 text-xs"
                    />
                    <Button
                      size="sm"
                      onClick={() => {
                        if (quickPoints) {
                          onGrantSkillPoints(parseInt(quickPoints));
                          setQuickPoints("");
                        }
                      }}
                      className="h-7 px-2 bg-eldritch-green hover:bg-green-700"
                    >
                      <GraduationCap className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="rolls" className="mt-3">
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleQuickRoll("1d100", "Test")}
                    className="h-8 text-xs bg-cosmic-void hover:bg-dark-stone"
                  >
                    <Dice6 className="mr-1 h-3 w-3" />
                    1d100
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleQuickRoll("1d6", "Dégâts")}
                    className="h-8 text-xs bg-blood-burgundy hover:bg-dark-crimson"
                  >
                    <Heart className="mr-1 h-3 w-3" />
                    1d6
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleQuickRoll("1d4", "SAN")}
                    className="h-8 text-xs bg-purple-600 hover:bg-purple-700"
                  >
                    <Brain className="mr-1 h-3 w-3" />
                    1d4
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleQuickRoll("2d6", "Dégâts")}
                    className="h-8 text-xs bg-blood-burgundy hover:bg-dark-crimson"
                  >
                    2d6
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleQuickRoll("1d8", "SAN")}
                    className="h-8 text-xs bg-purple-600 hover:bg-purple-700"
                  >
                    1d8
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleQuickRoll("1d10", "Chance")}
                    className="h-8 text-xs bg-yellow-600 hover:bg-yellow-700"
                  >
                    1d10
                  </Button>
                </div>
              </TabsContent>
              
              <TabsContent value="buffs" className="mt-3">
                <div className="space-y-2">
                  <div className="flex gap-1">
                    <Input
                      type="text"
                      placeholder="Buff (nom/valeur)"
                      value={quickBuff}
                      onChange={(e) => setQuickBuff(e.target.value)}
                      className="h-8 text-xs"
                    />
                    <Button
                      size="sm"
                      onClick={() => {
                        if (quickBuff) {
                          const parts = quickBuff.split('/');
                          const name = parts[0];
                          const value = parseInt(parts[1] || "1");
                          onApplyBuff(name, value);
                          setQuickBuff("");
                        }
                      }}
                      className="h-8 px-2 bg-eldritch-green hover:bg-green-700"
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    <Button
                      size="sm"
                      onClick={() => onApplyBuff("Premiers Soins", 3)}
                      className="h-7 text-xs bg-green-600 hover:bg-green-700"
                    >
                      Soins +1d3
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => onApplyBuff("Repos", 4)}
                      className="h-7 text-xs bg-indigo-600 hover:bg-indigo-700"
                    >
                      Repos +1d4
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => onApplyBuff("Thérapie", 4)}
                      className="h-7 text-xs bg-purple-500 hover:bg-purple-600"
                    >
                      SAN +1d4
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => onApplyDebuff("Blessure Grave", 0)}
                      className="h-7 text-xs bg-blood-burgundy hover:bg-dark-crimson"
                    >
                      Blessure
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </CardContent>
    </Card>
  );
}