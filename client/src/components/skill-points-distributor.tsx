import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { 
  GraduationCap, Plus, Minus, Save, X, Info,
  TrendingUp, CheckCircle, AlertTriangle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { SKILL_TRANSLATIONS, DEFAULT_SKILLS } from "@/lib/cthulhu-data";
import type { Character } from "@shared/schema";

interface SkillPointsDistributorProps {
  character: Character & { 
    availableSkillPoints?: number | null;
  };
  onDistributePoints: (skillUpdates: Record<string, number>) => Promise<void>;
}

export default function SkillPointsDistributor({ 
  character, 
  onDistributePoints 
}: SkillPointsDistributorProps) {
  const { toast } = useToast();
  const [pendingPoints, setPendingPoints] = useState<Record<string, number>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const availablePoints = character.availableSkillPoints || 0;
  const usedPoints = Object.values(pendingPoints).reduce((sum, val) => sum + val, 0);
  const remainingPoints = availablePoints - usedPoints;

  // Get current skill values
  const currentSkills = character.skills as Record<string, number> || {};

  // Filter and sort skills
  const allSkills = Object.entries(SKILL_TRANSLATIONS).map(([key, name]) => ({
    key,
    name,
    base: DEFAULT_SKILLS[key] || 0
  }));
  
  const filteredSkills = allSkills.filter(skill => 
    skill.name.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => a.name.localeCompare(b.name, 'fr'));

  const adjustPoints = (skillName: string, delta: number) => {
    setPendingPoints(prev => {
      const currentPending = prev[skillName] || 0;
      const currentSkillValue = currentSkills[skillName] || 0;
      const newPending = currentPending + delta;
      
      // Prevent negative pending points
      if (newPending < 0) return prev;
      
      // Prevent exceeding available points
      const totalAfterChange = usedPoints - currentPending + newPending;
      if (totalAfterChange > availablePoints) {
        toast({
          title: "Points insuffisants",
          description: "Vous n'avez pas assez de points disponibles.",
          variant: "destructive"
        });
        return prev;
      }
      
      // Prevent skill from exceeding 99%
      if (currentSkillValue + newPending > 99) {
        toast({
          title: "Limite atteinte",
          description: "Une compétence ne peut pas dépasser 99%.",
          variant: "destructive"
        });
        return prev;
      }
      
      // Remove entry if back to 0
      if (newPending === 0) {
        const { [skillName]: _, ...rest } = prev;
        return rest;
      }
      
      return { ...prev, [skillName]: newPending };
    });
  };

  const handleSave = async () => {
    if (Object.keys(pendingPoints).length === 0) {
      toast({
        title: "Aucune modification",
        description: "Ajoutez des points à vos compétences avant de sauvegarder.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSaving(true);
      
      // Create the updated skills object
      const updatedSkills: Record<string, number> = {};
      Object.entries(pendingPoints).forEach(([skillName, points]) => {
        const currentValue = currentSkills[skillName] || 0;
        updatedSkills[skillName] = Math.min(99, currentValue + points);
      });
      
      await onDistributePoints(updatedSkills);
      
      toast({
        title: "Points distribués avec succès",
        description: `${usedPoints} points de compétence ont été appliqués.`,
        className: "bg-eldritch-green/20 border-eldritch-green"
      });
      
      // Reset pending points
      setPendingPoints({});
    } catch (error) {
      console.error("Error distributing points:", error);
      toast({
        title: "Erreur",
        description: "Impossible de distribuer les points.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setPendingPoints({});
    toast({
      title: "Modifications annulées",
      description: "Les points n'ont pas été distribués."
    });
  };

  if (availablePoints === 0) {
    return (
      <Card className="bg-charcoal border-aged-gold parchment-bg">
        <CardHeader>
          <CardTitle className="font-cinzel text-aged-gold flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Points de Compétence
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="bg-cosmic-void/50 border-aged-gold/50">
            <Info className="h-4 w-4 text-aged-gold" />
            <AlertDescription className="text-aged-parchment">
              Vous n'avez pas de points de compétence disponibles pour le moment.
              Le Gardien peut vous en attribuer suite à vos expériences.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-charcoal border-aged-gold parchment-bg">
      <CardHeader>
        <CardTitle className="font-cinzel text-aged-gold flex items-center gap-2">
          <GraduationCap className="h-5 w-5" />
          Distribution des Points de Compétence
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Points Overview */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-cosmic-void rounded border border-aged-gold/30">
            <div className="text-2xl font-cinzel text-aged-gold">{availablePoints}</div>
            <div className="text-xs text-aged-parchment">Points Totaux</div>
          </div>
          <div className="text-center p-3 bg-cosmic-void rounded border border-aged-gold/30">
            <div className="text-2xl font-cinzel text-eldritch-green">{remainingPoints}</div>
            <div className="text-xs text-aged-parchment">Points Restants</div>
          </div>
          <div className="text-center p-3 bg-cosmic-void rounded border border-aged-gold/30">
            <div className="text-2xl font-cinzel text-blood-burgundy">{usedPoints}</div>
            <div className="text-xs text-aged-parchment">Points Utilisés</div>
          </div>
        </div>

        {/* Progress Bar */}
        <div>
          <Progress 
            value={(usedPoints / availablePoints) * 100} 
            className="h-2 bg-cosmic-void"
          />
        </div>

        {/* Search */}
        <div>
          <input
            type="text"
            placeholder="Rechercher une compétence..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 bg-cosmic-void border border-aged-gold/30 rounded text-bone-white placeholder-aged-parchment/50"
          />
        </div>

        {/* Skills List */}
        <ScrollArea className="h-96 border border-aged-gold/30 rounded p-3">
          <div className="space-y-2">
            {filteredSkills.map((skill) => {
              const currentValue = currentSkills[skill.key] || skill.base;
              const pendingValue = pendingPoints[skill.key] || 0;
              const finalValue = Math.min(99, currentValue + pendingValue);
              const hasChanges = pendingValue > 0;
              
              return (
                <div
                  key={skill.name}
                  className={cn(
                    "flex items-center gap-3 p-2 rounded transition-colors",
                    hasChanges ? "bg-eldritch-green/10 border border-eldritch-green/30" : "hover:bg-cosmic-void"
                  )}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-source text-bone-white">{skill.name}</span>
                      {hasChanges && (
                        <Badge variant="outline" className="text-xs bg-eldritch-green/20 border-eldritch-green">
                          +{pendingValue}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="text-xs text-aged-parchment">
                        Actuel: {currentValue}%
                      </div>
                      {hasChanges && (
                        <>
                          <TrendingUp className="h-3 w-3 text-eldritch-green" />
                          <div className="text-xs text-eldritch-green">
                            Nouveau: {finalValue}%
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => adjustPoints(skill.key, -1)}
                      disabled={!pendingPoints[skill.key] || pendingPoints[skill.key] <= 0}
                      className="h-8 w-8 p-0"
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    
                    <div className="w-12 text-center font-cinzel text-bone-white">
                      {pendingValue || 0}
                    </div>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => adjustPoints(skill.key, 1)}
                      disabled={remainingPoints <= 0 || finalValue >= 99}
                      className="h-8 w-8 p-0"
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        {/* Pending Changes Summary */}
        {Object.keys(pendingPoints).length > 0 && (
          <Alert className="bg-eldritch-green/10 border-eldritch-green">
            <CheckCircle className="h-4 w-4 text-eldritch-green" />
            <AlertDescription className="text-bone-white">
              <strong>Modifications en attente :</strong>
              <div className="mt-2 space-y-1">
                {Object.entries(pendingPoints).map(([skillName, points]) => (
                  <div key={skillName} className="text-sm">
                    • {skillName}: +{points} points
                  </div>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            onClick={handleSave}
            disabled={isSaving || Object.keys(pendingPoints).length === 0}
            className="flex-1 bg-eldritch-green hover:bg-green-700 text-bone-white"
          >
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? "Sauvegarde..." : "Appliquer les Changements"}
          </Button>
          <Button
            onClick={handleCancel}
            variant="outline"
            disabled={Object.keys(pendingPoints).length === 0}
            className="border-aged-gold text-aged-gold hover:bg-cosmic-void"
          >
            <X className="mr-2 h-4 w-4" />
            Annuler
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}