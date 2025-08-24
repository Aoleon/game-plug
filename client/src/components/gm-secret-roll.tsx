import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EyeOff, Dice6, Target, Dices } from "lucide-react";
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
  const [targetPlayer, setTargetPlayer] = useState<string>("all");
  const [description, setDescription] = useState("");
  const [lastResult, setLastResult] = useState<number | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [rollMode, setRollMode] = useState<'auto' | 'manual'>('auto');
  const [pendingRoll, setPendingRoll] = useState<{ formula: string; isSecret: boolean; targetPlayer?: string; description?: string; } | null>(null);
  const [manualResult, setManualResult] = useState<number>(50);

  const presetRolls = [
    { label: "Test de compétence", value: "1d100" },
    { label: "Dégâts légers", value: "1d6" },
    { label: "Dégâts moyens", value: "2d6" },
    { label: "Dégâts lourds", value: "3d6+2" },
    { label: "Sanité mineure", value: "1d4" },
    { label: "Sanité majeure", value: "2d10" },
  ];

  const handleRoll = async () => {
    if (rollMode === 'manual') {
      setPendingRoll({
        formula,
        isSecret,
        targetPlayer: targetPlayer || undefined,
        description: description || undefined,
      });
      return;
    }
    
    await executeAutomaticRoll();
  };

  const executeAutomaticRoll = async () => {
    try {
      setIsRolling(true);
      playRoll();
      
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const rollResult = rollDice(formula);
      const result = rollResult.total;
      
      await processRollResult(result);
    } catch (error) {
      console.error("Invalid dice formula:", error);
      setIsRolling(false);
    }
  };

  const processRollResult = async (result: number) => {
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
  };

  const submitManualRoll = async () => {
    if (!pendingRoll || manualResult < 1) {
      return;
    }

    await processRollResult(manualResult);
    setPendingRoll(null);
    setManualResult(50);
  };

  const cancelManualRoll = () => {
    setPendingRoll(null);
    setManualResult(50);
  };

  return (
    <Card className="bg-gray-900/50 border-aged-gold/20">
      <CardHeader>
        <CardTitle className="flex justify-between items-center font-cinzel text-aged-gold">
          <span className="flex items-center gap-2">
            <EyeOff className="h-5 w-5" />
            Jets Secrets du MJ
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setRollMode(rollMode === 'auto' ? 'manual' : 'auto')}
            className="text-aged-gold hover:text-bone-white text-xs"
            data-testid="button-toggle-roll-mode"
          >
            {rollMode === 'auto' ? <Dices className="h-4 w-4 mr-1" /> : <Target className="h-4 w-4 mr-1" />}
            {rollMode === 'auto' ? 'Auto' : 'Manuel'}
          </Button>
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
                <SelectItem value="all">Tous les joueurs</SelectItem>
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

        {/* Manual Roll Interface */}
        {pendingRoll && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-blood-burgundy border border-aged-gold rounded-lg p-4"
          >
            <div className="text-center mb-3">
              <h3 className="font-cinzel text-lg text-bone-white mb-1">
                Lancer Manuel Secret
              </h3>
              <p className="text-aged-parchment text-sm">
                Formule: {pendingRoll.formula} - Entrez le résultat de votre dé physique
              </p>
            </div>
            
            <div className="flex gap-2 items-center">
              <Input
                type="number"
                value={manualResult}
                onChange={(e) => setManualResult(parseInt(e.target.value) || 1)}
                placeholder="Résultat"
                min={1}
                className="flex-1 bg-deep-black border-aged-gold text-bone-white text-center text-lg"
                data-testid="input-manual-secret-result"
                autoFocus
              />
              <Button
                onClick={submitManualRoll}
                className="bg-eldritch-green hover:bg-green-700 text-bone-white px-4"
                data-testid="button-submit-manual-secret-roll"
              >
                ✓
              </Button>
              <Button
                onClick={cancelManualRoll}
                variant="outline"
                className="border-aged-gold text-aged-gold hover:bg-aged-gold hover:text-deep-black px-4"
                data-testid="button-cancel-manual-secret-roll"
              >
                ✗
              </Button>
            </div>
          </motion.div>
        )}

        <Button
          onClick={handleRoll}
          disabled={isRolling || !!pendingRoll}
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