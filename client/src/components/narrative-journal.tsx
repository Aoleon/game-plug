import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  BookOpen, Sparkles, Save, Trash2, 
  MapPin, Users, Lightbulb, Scroll, 
  Calendar, Loader2, Edit, X
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { NarrativeEntry } from "@shared/schema";

interface NarrativeJournalProps {
  sessionId: string;
}

export function NarrativeJournal({ sessionId }: NarrativeJournalProps) {
  const { toast } = useToast();
  const [newEntry, setNewEntry] = useState("");
  const [entryType, setEntryType] = useState<"note" | "event" | "npc" | "location" | "clue">("note");
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");
  
  const { data: entries = [], isLoading } = useQuery<NarrativeEntry[]>({
    queryKey: ["/api/sessions", sessionId, "narrative"],
  });

  const addEntryMutation = useMutation({
    mutationFn: async (data: { content: string; entryType: string }) => {
      const response = await apiRequest("POST", `/api/sessions/${sessionId}/narrative`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions", sessionId, "narrative"] });
      setNewEntry("");
      toast({
        title: "Entrée ajoutée",
        description: "L'entrée narrative a été enregistrée.",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter l'entrée narrative.",
        variant: "destructive",
      });
    },
  });

  const updateEntryMutation = useMutation({
    mutationFn: async ({ id, content, entryType }: { id: string; content: string; entryType: string }) => {
      const response = await apiRequest("PATCH", `/api/narrative/${id}`, { content, entryType });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions", sessionId, "narrative"] });
      setEditingEntryId(null);
      setEditingContent("");
      toast({
        title: "Entrée mise à jour",
        description: "L'entrée narrative a été modifiée.",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de modifier l'entrée narrative.",
        variant: "destructive",
      });
    },
  });

  const deleteEntryMutation = useMutation({
    mutationFn: async (entryId: string) => {
      const response = await apiRequest("DELETE", `/api/narrative/${entryId}`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions", sessionId, "narrative"] });
      toast({
        title: "Entrée supprimée",
        description: "L'entrée narrative a été supprimée.",
      });
    },
  });

  const getAiSuggestionMutation = useMutation({
    mutationFn: async (context: string) => {
      const response = await apiRequest("POST", `/api/sessions/${sessionId}/narrative/ai-suggest`, { context });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.suggestion) {
        setNewEntry(data.suggestion);
        toast({
          title: "Suggestion générée",
          description: "L'IA a généré une suggestion narrative.",
          className: "bg-cosmic-void border-aged-gold",
        });
      }
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de générer une suggestion.",
        variant: "destructive",
      });
    },
  });

  const handleAddEntry = () => {
    if (!newEntry.trim()) return;
    addEntryMutation.mutate({ content: newEntry, entryType });
  };

  const handleGetAiSuggestion = async () => {
    setIsAiGenerating(true);
    try {
      const recentEntries = entries.slice(-5).map(e => e.content).join("\n");
      await getAiSuggestionMutation.mutateAsync(recentEntries);
    } finally {
      setIsAiGenerating(false);
    }
  };

  const handleStartEdit = (entry: NarrativeEntry) => {
    setEditingEntryId(entry.id);
    setEditingContent(entry.content);
  };

  const handleCancelEdit = () => {
    setEditingEntryId(null);
    setEditingContent("");
  };

  const handleSaveEdit = (entry: NarrativeEntry) => {
    if (!editingContent.trim()) return;
    updateEntryMutation.mutate({
      id: entry.id,
      content: editingContent,
      entryType: entry.entryType || "note",
    });
  };

  const getEntryTypeIcon = (type: string) => {
    switch (type) {
      case "event": return <Calendar className="h-3 w-3" />;
      case "npc": return <Users className="h-3 w-3" />;
      case "location": return <MapPin className="h-3 w-3" />;
      case "clue": return <Lightbulb className="h-3 w-3" />;
      default: return <Scroll className="h-3 w-3" />;
    }
  };

  const getEntryTypeLabel = (type: string) => {
    switch (type) {
      case "event": return "Événement";
      case "npc": return "PNJ";
      case "location": return "Lieu";
      case "clue": return "Indice";
      default: return "Note";
    }
  };

  const filteredEntries = entries.filter(e => entryType === "note" ? true : e.entryType === entryType);

  return (
    <Card className="bg-charcoal border-aged-gold parchment-bg">
      <CardHeader>
        <CardTitle className="font-cinzel text-aged-gold flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Journal Narratif
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={entryType} onValueChange={(v) => setEntryType(v as any)} className="w-full">
          <TabsList className="grid grid-cols-5 mb-4 bg-cosmic-void">
            <TabsTrigger value="note" className="data-[state=active]:bg-aged-gold data-[state=active]:text-cosmic-void">
              <Scroll className="h-3 w-3 mr-1" />
              Toutes
            </TabsTrigger>
            <TabsTrigger value="event" className="data-[state=active]:bg-aged-gold data-[state=active]:text-cosmic-void">
              <Calendar className="h-3 w-3 mr-1" />
              Événements
            </TabsTrigger>
            <TabsTrigger value="npc" className="data-[state=active]:bg-aged-gold data-[state=active]:text-cosmic-void">
              <Users className="h-3 w-3 mr-1" />
              PNJ
            </TabsTrigger>
            <TabsTrigger value="location" className="data-[state=active]:bg-aged-gold data-[state=active]:text-cosmic-void">
              <MapPin className="h-3 w-3 mr-1" />
              Lieux
            </TabsTrigger>
            <TabsTrigger value="clue" className="data-[state=active]:bg-aged-gold data-[state=active]:text-cosmic-void">
              <Lightbulb className="h-3 w-3 mr-1" />
              Indices
            </TabsTrigger>
          </TabsList>

          <TabsContent value={entryType} className="space-y-4">
            {/* New Entry Form */}
            <div className="space-y-3 p-4 bg-cosmic-void/50 rounded border border-aged-gold/30">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm text-aged-parchment">Nouvelle entrée :</span>
                <Badge variant="outline" className="text-aged-gold border-aged-gold">
                  {getEntryTypeIcon(entryType)}
                  <span className="ml-1">{getEntryTypeLabel(entryType)}</span>
                </Badge>
              </div>
              <Textarea
                value={newEntry}
                onChange={(e) => setNewEntry(e.target.value)}
                placeholder="Documentez ce qui se passe dans votre session..."
                className="min-h-[100px] bg-charcoal border-aged-gold text-bone-white"
                data-testid="textarea-narrative-entry"
              />
              <div className="flex gap-2">
                <Button
                  onClick={handleAddEntry}
                  disabled={!newEntry.trim() || addEntryMutation.isPending}
                  className="bg-aged-gold text-cosmic-void hover:bg-aged-gold/80"
                  data-testid="button-save-narrative"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {addEntryMutation.isPending ? "Enregistrement..." : "Enregistrer"}
                </Button>
                <Button
                  onClick={handleGetAiSuggestion}
                  disabled={isAiGenerating}
                  variant="outline"
                  className="border-eldritch-green text-eldritch-green hover:bg-eldritch-green hover:text-cosmic-void"
                  data-testid="button-ai-suggest"
                >
                  {isAiGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Génération...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Aide IA
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Entries List */}
            <ScrollArea className="h-[400px] pr-4">
              {isLoading ? (
                <div className="text-center py-8 text-aged-parchment">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                  Chargement du journal...
                </div>
              ) : filteredEntries.length === 0 ? (
                <div className="text-center py-8 text-aged-parchment">
                  <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p>Aucune entrée {entryType !== "note" ? `de type "${getEntryTypeLabel(entryType)}"` : ""} pour le moment.</p>
                  <p className="text-sm mt-1">Commencez à documenter votre session !</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className="p-3 bg-cosmic-void rounded border border-aged-gold/30 hover:border-aged-gold/60 transition-colors"
                      data-testid={`entry-${entry.id}`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-aged-gold border-aged-gold/50">
                            {getEntryTypeIcon(entry.entryType || "note")}
                            <span className="ml-1">{getEntryTypeLabel(entry.entryType || "note")}</span>
                          </Badge>
                          {entry.isAiGenerated && (
                            <Badge variant="outline" className="text-eldritch-green border-eldritch-green/50">
                              <Sparkles className="h-3 w-3 mr-1" />
                              IA
                            </Badge>
                          )}
                        </div>
                        <div className="flex gap-1">
                          {editingEntryId !== entry.id && (
                            <Button
                              onClick={() => handleStartEdit(entry)}
                              size="sm"
                              variant="ghost"
                              className="h-6 w-6 p-0 text-aged-gold hover:bg-aged-gold/10"
                              data-testid={`button-edit-entry-${entry.id}`}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                          )}
                          <Button
                            onClick={() => deleteEntryMutation.mutate(entry.id)}
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 text-blood-burgundy hover:bg-blood-burgundy/10"
                            data-testid={`button-delete-entry-${entry.id}`}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      
                      {editingEntryId === entry.id ? (
                        <div className="space-y-2">
                          <Textarea
                            value={editingContent}
                            onChange={(e) => setEditingContent(e.target.value)}
                            className="min-h-[80px] bg-charcoal border-aged-gold text-bone-white"
                            data-testid={`textarea-edit-entry-${entry.id}`}
                          />
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleSaveEdit(entry)}
                              disabled={!editingContent.trim() || updateEntryMutation.isPending}
                              size="sm"
                              className="bg-aged-gold text-cosmic-void hover:bg-aged-gold/80"
                              data-testid={`button-save-edit-${entry.id}`}
                            >
                              <Save className="h-3 w-3 mr-1" />
                              {updateEntryMutation.isPending ? "Sauvegarde..." : "Sauvegarder"}
                            </Button>
                            <Button
                              onClick={handleCancelEdit}
                              size="sm"
                              variant="outline"
                              className="border-aged-parchment text-aged-parchment"
                              data-testid={`button-cancel-edit-${entry.id}`}
                            >
                              <X className="h-3 w-3 mr-1" />
                              Annuler
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="text-bone-white text-sm whitespace-pre-wrap" data-testid={`text-entry-content-${entry.id}`}>
                            {entry.content}
                          </p>
                          <p className="text-xs text-aged-parchment/60 mt-2">
                            {entry.createdAt && format(new Date(entry.createdAt), "d MMMM yyyy 'à' HH:mm", { locale: fr })}
                          </p>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default NarrativeJournal;
