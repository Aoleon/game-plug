import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EyeOff, Dice6 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { rollDice } from "@/lib/dice";
import { useDiceSound } from "@/components/dice-sound-manager";
import { cn } from "@/lib/utils";

interface GMSecretRollProps {
  onRoll: (result: { 
    formula: string; 
    result: number; 
    isSecret: boolean; 
    targetPlayer?: string;
    description?: string;
  }) => void;
  players?: Array<{ id: string; name: string }>;
}

export default function GMSecretRoll({ onRoll, players = [] }: GMSecretRollProps) {
  const { playRoll, playCritical, playFumble } = useDiceSound();
  const [formula, setFormula] = useState("1d100");
  const [isSecret, setIsSecret] = useState(true);
  const [targetPlayer, setTargetPlayer] = useState<string>("");
  const [description, setDescription] = useState("");
  const [lastResult, setLastResult] = useState<number | null>(null);
  const [isRolling, setIsRolling] = useState(false);

  const presetRolls = [
    { label: "Test de compétence", value: "1d100" },
    { label: "Dégâts légers", value: "1d6" },
    { label: "Dégâts moyens", value: "2d6" },
    { label: "Dégâts lourds", value: "3d6+2" },
    { label: "Sanité mineure", value: "1d4" },
    { label: "Sanité majeure", value: "2d10" },
  ];

  const handleRoll = async () => {
    try {
      setIsRolling(true);
      playRoll();
      
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const rollResult = rollDice(formula);
      const result = rollResult.total;
      
      // Play special sounds for critical results
      if (formula === "1d100") {
        if (result === 1) playCritical();
        else if (result >= 96) playFumble();
      }
      
      setLastResult(result);
      setIsRolling(false);
      
      onRoll({
        formula,
        result,
        isSecret,
        targetPlayer: targetPlayer || undefined,
        description: description || undefined,
      });
      
      // Reset fields after roll
      setDescription("");
    } catch (error) {
      console.error("Invalid dice formula:", error);
      setIsRolling(false);
    }
  };

  return (
    <Card className="bg-gray-900/50 border-aged-gold/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-cinzel text-aged-gold">
          <EyeOff className="h-5 w-5" />
          Jets Secrets du MJ
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Type de jet</Label>
          <Select value={formula} onValueChange={setFormula}>
            <SelectTrigger data-testid="select-roll-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {presetRolls.map(roll => (
                <SelectItem key={roll.value} value={roll.value}>
                  {roll.label} ({roll.value})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

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

        {players.length > 0 && (
          <div className="space-y-2">
            <Label>Joueur cible (optionnel)</Label>
            <Select value={targetPlayer} onValueChange={setTargetPlayer}>
              <SelectTrigger data-testid="select-target-player">
                <SelectValue placeholder="Tous les joueurs" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tous les joueurs</SelectItem>
                {players.map(player => (
                  <SelectItem key={player.id} value={player.id}>
                    {player.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-2">
          <Label>Description (optionnel)</Label>
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ex: Test de perception"
            className="bg-gray-800 border-gray-700"
            data-testid="input-roll-description"
          />
        </div>

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
        </div>

        <Button
          onClick={handleRoll}
          disabled={isRolling}
          className={cn(
            "w-full transition-all",
            isSecret 
              ? "bg-purple-900 hover:bg-purple-800" 
              : "bg-blood-burgundy hover:bg-dark-crimson"
          )}
          data-testid="button-roll-secret"
        >
          <motion.div
            animate={isRolling ? { rotate: 360 } : { rotate: 0 }}
            transition={{ duration: 0.3 }}
            className="mr-2"
          >
            <Dice6 className="h-5 w-5" />
          </motion.div>
          {isRolling ? "Lancer..." : "Lancer les dés"}
        </Button>

        <AnimatePresence>
          {lastResult !== null && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={cn(
                "p-3 rounded-lg text-center",
                isSecret ? "bg-purple-900/30" : "bg-gray-800/50"
              )}
            >
              <div className="text-sm text-gray-400">Dernier résultat</div>
              <div className="text-2xl font-bold text-aged-gold">{lastResult}</div>
              {isSecret && (
                <div className="text-xs text-purple-400 mt-1">
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