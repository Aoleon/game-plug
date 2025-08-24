import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { 
  BookOpen, Plus, Edit, Trash2, ChevronUp, ChevronDown, 
  CheckCircle, Clock, PlayCircle, Archive, History
} from "lucide-react";
import ChapterEventHistory from "./chapter-event-history";
import type { Chapter, Character } from "@shared/schema";

const chapterFormSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  description: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(['planned', 'active', 'completed']).default('planned'),
});

type ChapterFormData = z.infer<typeof chapterFormSchema>;

interface ChapterManagerProps {
  sessionId: string;
  isGM: boolean;
  characters?: Character[];
}

export default function ChapterManager({ sessionId, isGM, characters = [] }: ChapterManagerProps) {
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"chapters" | "history">("chapters");

  const { data: chapters = [], isLoading } = useQuery<Chapter[]>({
    queryKey: ["/api/sessions", sessionId, "chapters"],
    retry: false,
  });

  const form = useForm<ChapterFormData>({
    resolver: zodResolver(chapterFormSchema),
    defaultValues: {
      name: "",
      description: "",
      notes: "",
      status: "planned",
    },
  });

  const createChapterMutation = useMutation({
    mutationFn: async (data: ChapterFormData) => {
      const response = await apiRequest("POST", `/api/sessions/${sessionId}/chapters`, {
        ...data,
        orderIndex: chapters.length,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Chapitre créé",
        description: "Le nouveau chapitre a été ajouté à la session.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/sessions", sessionId, "chapters"] });
      setDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de créer le chapitre.",
        variant: "destructive",
      });
    },
  });

  const updateChapterMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<ChapterFormData> }) => {
      const response = await apiRequest("PATCH", `/api/chapters/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Chapitre mis à jour",
        description: "Les modifications ont été enregistrées.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/sessions", sessionId, "chapters"] });
      setEditingChapter(null);
      setDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour le chapitre.",
        variant: "destructive",
      });
    },
  });

  const deleteChapterMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/chapters/${id}`);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Chapitre supprimé",
        description: "Le chapitre a été supprimé de la session.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/sessions", sessionId, "chapters"] });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le chapitre.",
        variant: "destructive",
      });
    },
  });

  const reorderChapterMutation = useMutation({
    mutationFn: async ({ id, direction }: { id: string; direction: 'up' | 'down' }) => {
      const currentIndex = chapters.findIndex(c => c.id === id);
      const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      
      if (newIndex < 0 || newIndex >= chapters.length) return;
      
      const updates = [];
      updates.push(apiRequest("PATCH", `/api/chapters/${chapters[currentIndex].id}`, { 
        orderIndex: newIndex 
      }));
      updates.push(apiRequest("PATCH", `/api/chapters/${chapters[newIndex].id}`, { 
        orderIndex: currentIndex 
      }));
      
      await Promise.all(updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions", sessionId, "chapters"] });
    },
  });

  const handleSubmit = (data: ChapterFormData) => {
    if (editingChapter) {
      updateChapterMutation.mutate({ id: editingChapter.id, data });
    } else {
      createChapterMutation.mutate(data);
    }
  };

  const handleEdit = (chapter: Chapter) => {
    setEditingChapter(chapter);
    form.reset({
      name: chapter.name,
      description: chapter.description || "",
      notes: chapter.notes || "",
      status: chapter.status as 'planned' | 'active' | 'completed',
    });
    setDialogOpen(true);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'planned':
        return <Clock className="h-4 w-4" />;
      case 'active':
        return <PlayCircle className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Archive className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planned':
        return "bg-gray-500";
      case 'active':
        return "bg-green-500";
      case 'completed':
        return "bg-blue-500";
      default:
        return "bg-gray-400";
    }
  };

  if (isLoading) {
    return (
      <div className="text-center text-aged-parchment">
        Chargement des chapitres...
      </div>
    );
  }

  return (
    <Card className="bg-charcoal border-aged-gold parchment-bg">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="font-cinzel text-aged-gold flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Chapitres de la Session
          </CardTitle>
          {isGM && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  onClick={() => {
                    setEditingChapter(null);
                    form.reset();
                  }}
                  className="bg-blood-burgundy hover:bg-dark-crimson text-bone-white"
                  data-testid="button-add-chapter"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Nouveau Chapitre
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-charcoal border-aged-gold">
                <DialogHeader>
                  <DialogTitle className="font-cinzel text-aged-gold">
                    {editingChapter ? "Modifier le Chapitre" : "Nouveau Chapitre"}
                  </DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-bone-white">Nom du Chapitre</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              className="bg-cosmic-void border-aged-gold/50 text-bone-white"
                              placeholder="Chapitre 1: Les Mystères d'Arkham"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-bone-white">Description</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              className="bg-cosmic-void border-aged-gold/50 text-bone-white"
                              placeholder="Les investigateurs arrivent à Arkham..."
                              rows={3}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {isGM && (
                      <FormField
                        control={form.control}
                        name="notes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-bone-white">Notes du MJ (privées)</FormLabel>
                            <FormControl>
                              <Textarea
                                {...field}
                                className="bg-cosmic-void border-aged-gold/50 text-bone-white"
                                placeholder="Notes privées pour le MJ..."
                                rows={3}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                    
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-bone-white">Statut</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-cosmic-void border-aged-gold/50 text-bone-white">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent className="bg-charcoal border-aged-gold">
                              <SelectItem value="planned">Planifié</SelectItem>
                              <SelectItem value="active">En cours</SelectItem>
                              <SelectItem value="completed">Terminé</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setDialogOpen(false)}
                        className="border-aged-gold text-aged-gold"
                      >
                        Annuler
                      </Button>
                      <Button
                        type="submit"
                        className="bg-blood-burgundy hover:bg-dark-crimson text-bone-white"
                      >
                        {editingChapter ? "Enregistrer" : "Créer"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {chapters.length === 0 ? (
          <div className="text-center py-8 text-aged-parchment">
            <BookOpen className="h-12 w-12 mx-auto mb-3 text-aged-gold/30" />
            <p>Aucun chapitre créé pour cette session</p>
            {isGM && (
              <p className="text-sm mt-2">Créez votre premier chapitre pour organiser l'aventure</p>
            )}
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <AnimatePresence>
              {chapters.map((chapter, index) => (
                <motion.div
                  key={chapter.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.1 }}
                  className="mb-3"
                >
                  <Card className="bg-cosmic-void/50 border-aged-gold/30">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={`${getStatusColor(chapter.status || 'planned')} text-white`}>
                              {getStatusIcon(chapter.status || 'planned')}
                              <span className="ml-1">
                                {chapter.status === 'planned' && 'Planifié'}
                                {chapter.status === 'active' && 'En cours'}
                                {chapter.status === 'completed' && 'Terminé'}
                              </span>
                            </Badge>
                            <h3 className="font-cinzel text-aged-gold">
                              {chapter.name}
                            </h3>
                          </div>
                          
                          {chapter.description && (
                            <p className="text-sm text-aged-parchment mb-2">
                              {chapter.description || ""}
                            </p>
                          )}
                          
                          {isGM && chapter.notes && (
                            <div className="bg-cosmic-void rounded p-2 mt-2">
                              <p className="text-xs text-aged-parchment/60">Notes MJ:</p>
                              <p className="text-xs text-aged-parchment">{chapter.notes || ""}</p>
                            </div>
                          )}
                        </div>
                        
                        {isGM && (
                          <div className="flex items-center gap-1 ml-3">
                            {index > 0 && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => reorderChapterMutation.mutate({ 
                                  id: chapter.id, 
                                  direction: 'up' 
                                })}
                                className="text-aged-gold hover:text-aged-gold/80"
                                data-testid={`button-move-up-${chapter.id}`}
                              >
                                <ChevronUp className="h-4 w-4" />
                              </Button>
                            )}
                            {index < chapters.length - 1 && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => reorderChapterMutation.mutate({ 
                                  id: chapter.id, 
                                  direction: 'down' 
                                })}
                                className="text-aged-gold hover:text-aged-gold/80"
                                data-testid={`button-move-down-${chapter.id}`}
                              >
                                <ChevronDown className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEdit(chapter)}
                              className="text-aged-gold hover:text-aged-gold/80"
                              data-testid={`button-edit-${chapter.id}`}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                if (confirm("Êtes-vous sûr de vouloir supprimer ce chapitre ?")) {
                                  deleteChapterMutation.mutate(chapter.id);
                                }
                              }}
                              className="text-red-400 hover:text-red-300"
                              data-testid={`button-delete-${chapter.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

export function ChapterManagerWithHistory({ sessionId, isGM, characters = [] }: ChapterManagerProps) {
  const [activeTab, setActiveTab] = useState<"chapters" | "history">("chapters");
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
  
  // Get chapters to determine active chapter
  const { data: chapters = [] } = useQuery<Chapter[]>({
    queryKey: ["/api/sessions", sessionId, "chapters"],
    retry: false,
  });
  
  const activeChapter = chapters.find(c => c.status === 'active') || chapters[0];
  
  return (
    <div className="space-y-4">
      {/* Tab Navigation */}
      <div className="flex items-center gap-2">
        <Button
          variant={activeTab === "chapters" ? "default" : "outline"}
          onClick={() => setActiveTab("chapters")}
          className={activeTab === "chapters" 
            ? "bg-aged-gold text-deep-black hover:bg-gold-700" 
            : "border-aged-gold text-aged-gold hover:bg-aged-gold hover:text-deep-black"
          }
          data-testid="button-tab-chapters"
        >
          <BookOpen className="h-4 w-4 mr-2" />
          Chapitres
        </Button>
        <Button
          variant={activeTab === "history" ? "default" : "outline"}
          onClick={() => setActiveTab("history")}
          className={activeTab === "history" 
            ? "bg-aged-gold text-deep-black hover:bg-gold-700" 
            : "border-aged-gold text-aged-gold hover:bg-aged-gold hover:text-deep-black"
          }
          disabled={!activeChapter}
          data-testid="button-tab-history"
        >
          <History className="h-4 w-4 mr-2" />
          Historique
        </Button>
        {activeTab === "history" && activeChapter && (
          <span className="text-sm text-aged-parchment ml-2">
            Chapitre actif: {activeChapter.name}
          </span>
        )}
      </div>
      
      {/* Tab Content */}
      {activeTab === "chapters" ? (
        <ChapterManager sessionId={sessionId} isGM={isGM} characters={characters} />
      ) : activeChapter ? (
        <ChapterEventHistory 
          chapterId={activeChapter.id} 
          sessionId={sessionId} 
          isGM={isGM}
          characters={characters}
        />
      ) : (
        <Card className="bg-charcoal border-aged-gold parchment-bg">
          <CardContent className="py-8 text-center text-aged-parchment">
            Créez un chapitre pour commencer à enregistrer l'historique
          </CardContent>
        </Card>
      )}
    </div>
  );
}