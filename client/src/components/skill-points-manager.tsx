import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  GraduationCap, Plus, Users, User, Gift,
  TrendingUp, Award, Info
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { Character } from "@shared/schema";

interface SkillPointsManagerProps {
  characters: Array<Character & { 
    availableSkillPoints?: number | null;
  }>;
  onGrantPoints: (characterIds: string[], points: number) => Promise<void>;
}

export default function SkillPointsManager({ 
  characters, 
  onGrantPoints 
}: SkillPointsManagerProps) {
  const { toast } = useToast();
  const [selectedCharacters, setSelectedCharacters] = useState<string[]>([]);
  const [pointsToGrant, setPointsToGrant] = useState<string>("5");
  const [isGranting, setIsGranting] = useState(false);

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

  const handleGrantPoints = async () => {
    if (selectedCharacters.length === 0) {
      toast({
        title: "Aucun personnage sélectionné",
        description: "Sélectionnez au moins un personnage pour attribuer des points.",
        variant: "destructive"
      });
      return;
    }

    const points = parseInt(pointsToGrant);
    if (isNaN(points) || points <= 0) {
      toast({
        title: "Points invalides",
        description: "Entrez un nombre de points valide (supérieur à 0).",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsGranting(true);
      await onGrantPoints(selectedCharacters, points);

      const characterNames = selectedCharacters
        .map(id => characters.find(c => c.id === id)?.name)
        .filter(Boolean)
        .join(", ");

      toast({
        title: "Points attribués avec succès",
        description: `${points} points de compétence attribués à : ${characterNames}`,
        className: "bg-eldritch-green/20 border-eldritch-green"
      });

      // Reset form
      setSelectedCharacters([]);
      setPointsToGrant("5");
    } catch (error) {
      console.error("Error granting points:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'attribuer les points de compétence.",
        variant: "destructive"
      });
    } finally {
      setIsGranting(false);
    }
  };

  const quickGrantPresets = [
    { label: "Expérience Mineure", points: 3, icon: Award },
    { label: "Expérience Modérée", points: 5, icon: TrendingUp },
    { label: "Expérience Majeure", points: 10, icon: GraduationCap },
    { label: "Entraînement Intensif", points: 20, icon: Gift }
  ];

  return (
    <Card className="bg-charcoal border-aged-gold parchment-bg">
      <CardHeader>
        <CardTitle className="font-cinzel text-aged-gold flex items-center gap-2">
          <GraduationCap className="h-5 w-5" />
          Attribution de Points de Compétence
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Info Alert */}
        <Alert className="bg-cosmic-void/50 border-aged-gold/50">
          <Info className="h-4 w-4 text-aged-gold" />
          <AlertDescription className="text-aged-parchment">
            Attribuez des points de compétence aux personnages pour représenter leur expérience et leur apprentissage.
            Les joueurs pourront ensuite distribuer ces points dans leurs compétences.
          </AlertDescription>
        </Alert>

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
          <ScrollArea className="h-48 border border-aged-gold/30 rounded p-2">
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
                    data-testid={`select-character-points-${character.id}`}
                  />
                  <div className="flex-1">
                    <div className="font-source text-bone-white">
                      {character.name}
                    </div>
                    <div className="text-xs text-aged-parchment">
                      {character.occupation}
                      {character.availableSkillPoints && character.availableSkillPoints > 0 && (
                        <Badge variant="outline" className="ml-2 text-xs bg-eldritch-green/20 border-eldritch-green">
                          {character.availableSkillPoints} points disponibles
                        </Badge>
                      )}
                    </div>
                  </div>
                  {selectedCharacters.includes(character.id) && (
                    <User className="h-4 w-4 text-aged-gold" />
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Quick Grant Presets */}
        <div>
          <Label className="text-aged-parchment mb-3 block">Attribution Rapide</Label>
          <div className="grid grid-cols-2 gap-2">
            {quickGrantPresets.map(preset => (
              <Button
                key={preset.label}
                variant="outline"
                size="sm"
                className="justify-start text-left h-auto py-2 px-3 hover:bg-cosmic-void"
                onClick={() => setPointsToGrant(preset.points.toString())}
              >
                <preset.icon className="h-4 w-4 mr-2 text-aged-gold shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{preset.label}</div>
                  <div className="text-xs opacity-70">+{preset.points} points</div>
                </div>
              </Button>
            ))}
          </div>
        </div>

        {/* Custom Points Input */}
        <div>
          <Label className="text-aged-parchment text-sm">
            Nombre de Points à Attribuer
          </Label>
          <div className="flex gap-2 mt-1">
            <Input
              type="number"
              value={pointsToGrant}
              onChange={(e) => setPointsToGrant(e.target.value)}
              placeholder="Ex: 5"
              min="1"
              max="100"
              className="bg-cosmic-void border-aged-gold text-bone-white"
            />
            <Button
              onClick={handleGrantPoints}
              disabled={isGranting || selectedCharacters.length === 0}
              className="bg-eldritch-green hover:bg-green-700 text-bone-white min-w-[140px]"
            >
              <Plus className="mr-2 h-4 w-4" />
              {isGranting ? "Attribution..." : "Attribuer"}
            </Button>
          </div>
        </div>

        {/* Selected Summary */}
        {selectedCharacters.length > 0 && (
          <Alert className="bg-eldritch-green/10 border-eldritch-green">
            <Award className="h-4 w-4 text-eldritch-green" />
            <AlertDescription className="text-bone-white">
              {selectedCharacters.length} personnage(s) sélectionné(s) recevront {pointsToGrant} points de compétence.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}