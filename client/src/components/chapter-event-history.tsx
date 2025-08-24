import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Plus, 
  Dice6, 
  BookOpen, 
  Brain, 
  Shield, 
  Compass, 
  Trophy,
  MessageSquare,
  AlertTriangle,
  Star,
  Trash2
} from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";
import type { ChapterEvent, Character } from "@shared/schema";

interface ChapterEventHistoryProps {
  chapterId: string;
  sessionId: string;
  isGM: boolean;
  characters?: Character[];
}

const eventTypeIcons = {
  roll: Dice6,
  narration: BookOpen,
  decision: Compass,
  sanity: Brain,
  combat: Shield,
  discovery: Compass,
  milestone: Trophy,
  dialogue: MessageSquare,
  danger: AlertTriangle,
};

const eventTypeColors = {
  roll: "bg-blue-500",
  narration: "bg-purple-500",
  decision: "bg-green-500",
  sanity: "bg-red-500",
  combat: "bg-orange-500",
  discovery: "bg-teal-500",
  milestone: "bg-yellow-500",
  dialogue: "bg-indigo-500",
  danger: "bg-rose-500",
};

const eventTypeLabels = {
  roll: "Lancer de dés",
  narration: "Narration",
  decision: "Décision",
  sanity: "Sanité",
  combat: "Combat",
  discovery: "Découverte",
  milestone: "Moment clé",
  dialogue: "Dialogue",
  danger: "Danger",
};

export default function ChapterEventHistory({ chapterId, sessionId, isGM, characters = [] }: ChapterEventHistoryProps) {
  const { toast } = useToast();
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [newEvent, setNewEvent] = useState({
    eventType: "narration",
    title: "",
    description: "",
    characterId: null as string | null,
    isImportant: false,
    metadata: {},
  });

  // Fetch chapter events
  const { data: events = [], isLoading } = useQuery<ChapterEvent[]>({
    queryKey: ['/api/chapters', chapterId, 'events'],
    queryFn: () => fetch(`/api/chapters/${chapterId}/events?limit=50`).then(res => res.json()),
    enabled: !!chapterId,
  });

  // Create event mutation
  const createEventMutation = useMutation({
    mutationFn: async (eventData: any) => {
      const response = await fetch('/api/chapter-events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...eventData,
          chapterId,
          sessionId,
        }),
      });
      if (!response.ok) throw new Error('Failed to create event');
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['/api/chapters', chapterId, 'events'], (old: ChapterEvent[] | undefined) => {
        return old ? [data, ...old] : [data];
      });
      
      setShowAddEvent(false);
      setNewEvent({
        eventType: "narration",
        title: "",
        description: "",
        characterId: null,
        isImportant: false,
        metadata: {},
      });
      
      toast({
        title: "Événement ajouté",
        description: "L'événement a été enregistré dans l'historique",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter l'événement",
        variant: "destructive",
      });
    },
  });

  // Delete event mutation
  const deleteEventMutation = useMutation({
    mutationFn: async (eventId: string) => {
      const response = await fetch(`/api/chapter-events/${eventId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete event');
      return response.json();
    },
    onSuccess: (_, eventId) => {
      queryClient.setQueryData(['/api/chapters', chapterId, 'events'], (old: ChapterEvent[] | undefined) => {
        return old ? old.filter(e => e.id !== eventId) : [];
      });
      
      toast({
        title: "Événement supprimé",
        description: "L'événement a été retiré de l'historique",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'événement",
        variant: "destructive",
      });
    },
  });

  const handleCreateEvent = () => {
    if (!newEvent.title) {
      toast({
        title: "Titre requis",
        description: "Veuillez entrer un titre pour l'événement",
        variant: "destructive",
      });
      return;
    }
    createEventMutation.mutate(newEvent);
  };

  const getEventIcon = (type: string) => {
    const Icon = eventTypeIcons[type as keyof typeof eventTypeIcons] || BookOpen;
    return <Icon className="h-4 w-4" />;
  };

  const getEventColor = (type: string) => {
    return eventTypeColors[type as keyof typeof eventTypeColors] || "bg-gray-500";
  };

  const getEventLabel = (type: string) => {
    return eventTypeLabels[type as keyof typeof eventTypeLabels] || type;
  };

  const getCharacterName = (characterId: string | null) => {
    if (!characterId) return null;
    const character = characters.find(c => c.id === characterId);
    return character?.name || "Personnage inconnu";
  };

  return (
    <Card className="bg-charcoal border-aged-gold parchment-bg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="font-cinzel text-aged-gold">
            Historique du Chapitre
          </CardTitle>
          {isGM && (
            <Dialog open={showAddEvent} onOpenChange={setShowAddEvent}>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  className="bg-aged-gold hover:bg-gold-700 text-deep-black"
                  data-testid="button-add-event"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Ajouter
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-charcoal border-aged-gold text-bone-white max-w-lg">
                <DialogHeader>
                  <DialogTitle className="font-cinzel text-aged-gold">
                    Nouvel Événement
                  </DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-source mb-2">Type d'événement</label>
                    <Select
                      value={newEvent.eventType}
                      onValueChange={(value) => setNewEvent({ ...newEvent, eventType: value })}
                    >
                      <SelectTrigger className="bg-cosmic-void border-aged-gold text-bone-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-cosmic-void border-aged-gold">
                        {Object.entries(eventTypeLabels).map(([key, label]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-source mb-2">Titre</label>
                    <Input
                      value={newEvent.title}
                      onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                      className="bg-cosmic-void border-aged-gold text-bone-white"
                      placeholder="Ex: Découverte du temple maudit"
                      data-testid="input-event-title"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-source mb-2">Description</label>
                    <Textarea
                      value={newEvent.description || ""}
                      onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                      className="bg-cosmic-void border-aged-gold text-bone-white h-24"
                      placeholder="Détails de l'événement..."
                      data-testid="input-event-description"
                    />
                  </div>
                  
                  {characters.length > 0 && (
                    <div>
                      <label className="block text-sm font-source mb-2">Personnage impliqué</label>
                      <Select
                        value={newEvent.characterId || "none"}
                        onValueChange={(value) => setNewEvent({ 
                          ...newEvent, 
                          characterId: value === "none" ? null : value 
                        })}
                      >
                        <SelectTrigger className="bg-cosmic-void border-aged-gold text-bone-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-cosmic-void border-aged-gold">
                          <SelectItem value="none">Aucun</SelectItem>
                          {characters.map((char) => (
                            <SelectItem key={char.id} value={char.id}>
                              {char.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="important"
                      checked={newEvent.isImportant}
                      onCheckedChange={(checked) => setNewEvent({ 
                        ...newEvent, 
                        isImportant: checked as boolean 
                      })}
                      className="border-aged-gold data-[state=checked]:bg-aged-gold"
                    />
                    <label
                      htmlFor="important"
                      className="text-sm font-source cursor-pointer flex items-center gap-1"
                    >
                      <Star className="h-3 w-3 text-aged-gold" />
                      Marquer comme moment clé
                    </label>
                  </div>
                  
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowAddEvent(false)}
                      className="border-aged-gold text-aged-gold hover:bg-aged-gold hover:text-deep-black"
                    >
                      Annuler
                    </Button>
                    <Button
                      onClick={handleCreateEvent}
                      disabled={createEventMutation.isPending}
                      className="bg-aged-gold hover:bg-gold-700 text-deep-black"
                      data-testid="button-create-event"
                    >
                      {createEventMutation.isPending ? "Ajout..." : "Ajouter"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-aged-parchment">
            Chargement de l'historique...
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-8 text-aged-parchment">
            <BookOpen className="h-12 w-12 mx-auto mb-3 text-aged-gold/30" />
            <p>Aucun événement enregistré</p>
            {isGM && (
              <p className="text-sm mt-2">Ajoutez des événements pour créer l'historique</p>
            )}
          </div>
        ) : (
          <ScrollArea className="h-[400px]">
            <AnimatePresence>
              {events.map((event, index) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                  className="mb-3"
                >
                  <div className="bg-cosmic-void/50 rounded-lg p-3 border border-aged-gold/20">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={`${getEventColor(event.eventType)} text-white`}>
                            {getEventIcon(event.eventType)}
                            <span className="ml-1">{getEventLabel(event.eventType)}</span>
                          </Badge>
                          {event.isImportant && (
                            <Star className="h-4 w-4 text-aged-gold" />
                          )}
                          {event.characterId && (
                            <span className="text-xs text-aged-parchment">
                              {getCharacterName(event.characterId)}
                            </span>
                          )}
                        </div>
                        
                        <h4 className="font-semibold text-bone-white mb-1">
                          {event.title}
                        </h4>
                        
                        {event.description && (
                          <p className="text-sm text-aged-parchment mb-2">
                            {event.description}
                          </p>
                        )}
                        
                        <p className="text-xs text-aged-parchment/60">
                          {event.createdAt ? format(new Date(event.createdAt), "dd MMMM yyyy à HH:mm", { locale: fr }) : ""}
                        </p>
                      </div>
                      
                      {isGM && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteEventMutation.mutate(event.id)}
                          className="text-red-400 hover:text-red-500 hover:bg-red-900/20"
                          data-testid={`button-delete-event-${event.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}