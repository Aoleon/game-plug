import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Download, User, Briefcase, Calendar, RefreshCw, Save } from "lucide-react";
import type { Character } from "@shared/schema";

interface ImportableCharacter extends Character {
  sessionName: string;
}

interface ImportCharacterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string;
}

export default function ImportCharacterDialog({ open, onOpenChange, sessionId }: ImportCharacterDialogProps) {
  const { toast } = useToast();
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);
  const [resetState, setResetState] = useState<boolean>(true);

  const { data: importableCharacters = [], isLoading } = useQuery<ImportableCharacter[]>({
    queryKey: ["/api/sessions", sessionId, "importable-characters"],
    enabled: open && !!sessionId,
  });

  const importCharacterMutation = useMutation({
    mutationFn: async ({ characterId, resetState }: { characterId: string; resetState: boolean }) => {
      const response = await apiRequest("POST", `/api/sessions/${sessionId}/import-character`, {
        characterId,
        resetState
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Personnage importé",
        description: `${data.character.name} a été importé avec succès dans cette session.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/sessions", sessionId, "characters"] });
      onOpenChange(false);
      setSelectedCharacterId(null);
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible d'importer le personnage.",
        variant: "destructive",
      });
    },
  });

  const handleImport = () => {
    if (selectedCharacterId) {
      importCharacterMutation.mutate({ characterId: selectedCharacterId, resetState });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto bg-charcoal border-aged-gold">
        <DialogHeader>
          <DialogTitle className="font-cinzel text-2xl text-aged-gold">
            Importer un personnage
          </DialogTitle>
          <DialogDescription className="text-aged-parchment">
            Sélectionnez un personnage depuis vos autres sessions pour l'importer dans cette session.
          </DialogDescription>
        </DialogHeader>

        {/* Import State Option */}
        <div className="bg-cosmic-void border border-aged-gold rounded-lg p-4 mt-4">
          <h3 className="font-cinzel text-aged-gold mb-3 flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Options d'import
          </h3>
          <RadioGroup
            value={resetState ? "reset" : "keep"}
            onValueChange={(value) => setResetState(value === "reset")}
            className="space-y-3"
          >
            <div className="flex items-start space-x-3 p-3 rounded border border-aged-gold/30 hover:border-aged-gold transition-colors">
              <RadioGroupItem value="reset" id="reset" className="mt-1" data-testid="radio-reset-state" />
              <div className="flex-1">
                <Label htmlFor="reset" className="font-cinzel text-aged-gold cursor-pointer flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Réinitialiser l'état
                </Label>
                <p className="text-sm text-aged-parchment opacity-80 mt-1">
                  PV, Santé mentale et PM remis au maximum. Inventaire, notes et historique effacés.
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3 p-3 rounded border border-aged-gold/30 hover:border-aged-gold transition-colors">
              <RadioGroupItem value="keep" id="keep" className="mt-1" data-testid="radio-keep-state" />
              <div className="flex-1">
                <Label htmlFor="keep" className="font-cinzel text-aged-gold cursor-pointer flex items-center gap-2">
                  <Save className="h-4 w-4" />
                  Conserver l'état
                </Label>
                <p className="text-sm text-aged-parchment opacity-80 mt-1">
                  Copie complète : PV, Santé, inventaire, effets actifs, conditions et notes.
                </p>
              </div>
            </div>
          </RadioGroup>
        </div>

        <div className="space-y-4 mt-4">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="bg-cosmic-void border-aged-gold">
                  <CardHeader>
                    <Skeleton className="h-6 w-48 bg-charcoal" />
                    <Skeleton className="h-4 w-32 bg-charcoal mt-2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-20 w-full bg-charcoal" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : importableCharacters.length === 0 ? (
            <div className="text-center py-12">
              <User className="mx-auto h-12 w-12 text-aged-gold opacity-50 mb-4" />
              <p className="text-aged-parchment font-crimson">
                Aucun personnage disponible pour l'import.
              </p>
              <p className="text-sm text-aged-parchment opacity-70 mt-2">
                Les personnages apparaîtront ici une fois que vous aurez créé des personnages dans d'autres sessions.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {importableCharacters.map((character) => (
                <Card
                  key={character.id}
                  className={`cursor-pointer transition-all border-2 ${
                    selectedCharacterId === character.id
                      ? "border-eldritch-green bg-cosmic-void shadow-lg shadow-eldritch-green/20"
                      : "border-aged-gold bg-cosmic-void hover:border-eldritch-green hover:shadow-md"
                  }`}
                  onClick={() => setSelectedCharacterId(character.id)}
                  data-testid={`card-character-${character.id}`}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="font-cinzel text-xl text-aged-gold flex items-center gap-2">
                          {character.avatarUrl && (
                            <img
                              src={character.avatarUrl}
                              alt={character.name}
                              className="w-10 h-10 rounded-full object-cover border border-aged-gold"
                            />
                          )}
                          {character.name}
                        </CardTitle>
                        <CardDescription className="text-aged-parchment mt-1">
                          <div className="flex items-center gap-2 mt-2">
                            <Briefcase className="h-3 w-3" />
                            <span className="text-sm">{character.occupation}</span>
                          </div>
                        </CardDescription>
                      </div>
                      {selectedCharacterId === character.id && (
                        <Download className="h-5 w-5 text-eldritch-green" />
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Badge className="bg-cosmic-void border-aged-gold text-aged-parchment">
                        Session: {character.sessionName}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="text-aged-parchment">
                        <div className="font-cinzel text-aged-gold">FOR</div>
                        <div>{character.strength}</div>
                      </div>
                      <div className="text-aged-parchment">
                        <div className="font-cinzel text-aged-gold">DEX</div>
                        <div>{character.dexterity}</div>
                      </div>
                      <div className="text-aged-parchment">
                        <div className="font-cinzel text-aged-gold">INT</div>
                        <div>{character.intelligence}</div>
                      </div>
                      <div className="text-aged-parchment">
                        <div className="font-cinzel text-aged-gold">PV</div>
                        <div>{character.maxHitPoints}</div>
                      </div>
                      <div className="text-aged-parchment">
                        <div className="font-cinzel text-aged-gold">SAN</div>
                        <div>{character.maxSanity}</div>
                      </div>
                      <div className="text-aged-parchment">
                        <div className="font-cinzel text-aged-gold">PM</div>
                        <div>{character.maxMagicPoints}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              setSelectedCharacterId(null);
            }}
            className="border-aged-gold text-aged-gold hover:bg-cosmic-void"
            data-testid="button-cancel-import"
          >
            Annuler
          </Button>
          <Button
            onClick={handleImport}
            disabled={!selectedCharacterId || importCharacterMutation.isPending}
            className="bg-eldritch-green hover:bg-green-700 text-bone-white"
            data-testid="button-confirm-import"
          >
            <Download className="mr-2 h-4 w-4" />
            {importCharacterMutation.isPending ? "Import en cours..." : "Importer"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
