import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Dice1, Dice6, TrendingDown, TrendingUp, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface DiceRoll {
  id?: string;
  rollType: string;
  skillName?: string;
  result: number;
  success?: string | null;
  diceType: string;
  modifier: number;
  difficulty?: number;
  createdAt: Date | string;
}

interface RollHistoryVisualProps {
  rolls: DiceRoll[];
  className?: string;
  maxItems?: number;
}

export default function RollHistoryVisual({ 
  rolls, 
  className,
  maxItems = 10 
}: RollHistoryVisualProps) {
  const [expandedRoll, setExpandedRoll] = useState<string | null>(null);
  
  const recentRolls = rolls.slice(-maxItems).reverse();

  const getRollTypeIcon = (rollType: string) => {
    switch (rollType) {
      case "skill":
        return <Target className="h-4 w-4" />;
      case "damage":
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      case "sanity":
        return <TrendingUp className="h-4 w-4 text-purple-500" />;
      default:
        return <Dice6 className="h-4 w-4" />;
    }
  };

  const getSuccessColor = (success: string | null) => {
    switch (success) {
      case "critical":
        return "text-yellow-500 bg-yellow-500/10";
      case "extreme":
        return "text-green-600 bg-green-600/10";
      case "hard":
        return "text-green-500 bg-green-500/10";
      case "normal":
        return "text-green-400 bg-green-400/10";
      case "fail":
        return "text-red-400 bg-red-400/10";
      case "fumble":
        return "text-red-600 bg-red-600/10";
      default:
        return "text-gray-400 bg-gray-400/10";
    }
  };

  const getSuccessLabel = (success: string | null) => {
    switch (success) {
      case "critical":
        return "Critique!";
      case "extreme":
        return "Extrême";
      case "hard":
        return "Difficile";
      case "normal":
        return "Normal";
      case "fail":
        return "Échec";
      case "fumble":
        return "Échec critique!";
      default:
        return "Résultat";
    }
  };

  return (
    <Card className={cn("bg-gray-900/50 border-aged-gold/20", className)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-cinzel text-lg text-aged-gold">Historique des jets</h3>
          <Badge variant="outline" className="text-aged-parchment">
            {rolls.length} jets
          </Badge>
        </div>
        
        <ScrollArea className="h-64 pr-4">
          <AnimatePresence mode="popLayout">
            {recentRolls.map((roll, index) => (
              <motion.div
                key={roll.id || index}
                layout
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.05 }}
                className="mb-3"
                data-testid={`roll-history-item-${index}`}
              >
                <div
                  className={cn(
                    "p-3 rounded-lg bg-gray-800/50 border cursor-pointer transition-all",
                    expandedRoll === roll.id 
                      ? "border-aged-gold/40" 
                      : "border-gray-700/50 hover:border-aged-gold/20"
                  )}
                  onClick={() => setExpandedRoll(expandedRoll === roll.id ? null : (roll.id || null))}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getRollTypeIcon(roll.rollType)}
                      <span className="text-sm text-aged-parchment">
                        {roll.skillName || roll.rollType}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <motion.div
                        initial={{ rotate: 0 }}
                        animate={{ rotate: expandedRoll === roll.id ? 360 : 0 }}
                        className="flex items-center gap-1"
                      >
                        <Dice1 className="h-4 w-4 text-aged-gold" />
                        <span className="font-bold text-aged-gold">
                          {roll.result}
                        </span>
                      </motion.div>
                      
                      {roll.success && (
                        <Badge 
                          className={cn("text-xs", getSuccessColor(roll.success))}
                          variant="secondary"
                        >
                          {getSuccessLabel(roll.success)}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <AnimatePresence>
                    {expandedRoll === roll.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="mt-2 pt-2 border-t border-gray-700/50"
                      >
                        <div className="grid grid-cols-2 gap-2 text-xs text-aged-parchment/80">
                          <div>
                            <span className="text-gray-500">Type de dé:</span>{" "}
                            <span className="text-aged-parchment">{roll.diceType}</span>
                          </div>
                          {roll.modifier !== 0 && (
                            <div>
                              <span className="text-gray-500">Modificateur:</span>{" "}
                              <span className="text-aged-parchment">
                                {roll.modifier > 0 ? "+" : ""}{roll.modifier}
                              </span>
                            </div>
                          )}
                          {roll.difficulty && (
                            <div className="col-span-2">
                              <span className="text-gray-500">Difficulté:</span>{" "}
                              <span className="text-aged-parchment">{roll.difficulty}</span>
                            </div>
                          )}
                          <div className="col-span-2">
                            <span className="text-gray-500">Heure:</span>{" "}
                            <span className="text-aged-parchment">
                              {new Date(roll.createdAt).toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {recentRolls.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Dice6 className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p>Aucun jet effectué</p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}