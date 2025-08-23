import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Link, useLocation } from "wouter";
import Navigation from "@/components/navigation";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Users, Settings, Trash2, Play, Pause, Calendar, Clock, Copy, ExternalLink } from "lucide-react";
import type { GameSession } from "@shared/schema";
import { motion, AnimatePresence } from "framer-motion";

export default function SessionManager() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [sessionName, setSessionName] = useState("");
  const [selectedSession, setSelectedSession] = useState<GameSession | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Non autorisé",
        description: "Vous êtes déconnecté. Connexion en cours...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [isAuthenticated, isLoading, toast]);

  // Fetch sessions
  const { data: sessions = [], isLoading: sessionsLoading } = useQuery<GameSession[]>({
    queryKey: ["/api/sessions"],
    retry: false,
  });

  // Create session mutation
  const createSessionMutation = useMutation({
    mutationFn: async (name: string) => {
      const response = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!response.ok) throw new Error("Failed to create session");
      return response.json();
    },
    onSuccess: (newSession) => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
      toast({
        title: "Session créée",
        description: `La session "${newSession.name}" a été créée avec succès.`,
      });
      setCreateDialogOpen(false);
      setSessionName("");
      // Redirect to GM dashboard for this session
      setLocation(`/gm/${newSession.id}`);
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de créer la session.",
        variant: "destructive",
      });
    },
  });

  // Toggle session active status
  const toggleSessionMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const response = await fetch(`/api/sessions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      });
      if (!response.ok) throw new Error("Failed to update session");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
      toast({
        title: "Session mise à jour",
        description: "Le statut de la session a été modifié.",
      });
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de modifier le statut de la session.",
        variant: "destructive",
      });
    },
  });

  // Delete session mutation
  const deleteSessionMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/sessions/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete session");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sessions"] });
      toast({
        title: "Session supprimée",
        description: "La session a été supprimée définitivement.",
      });
      setDeleteConfirmOpen(false);
      setSelectedSession(null);
    },
    onError: () => {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la session.",
        variant: "destructive",
      });
    },
  });

  const handleCreateSession = () => {
    if (sessionName.trim()) {
      createSessionMutation.mutate(sessionName.trim());
    }
  };

  const handleDeleteSession = () => {
    if (selectedSession) {
      deleteSessionMutation.mutate(selectedSession.id);
    }
  };

  const copyInviteLink = (sessionId: string) => {
    const link = `${window.location.origin}/join-session/${sessionId}`;
    navigator.clipboard.writeText(link);
    toast({
      title: "Lien copié",
      description: "Le lien d'invitation a été copié dans le presse-papier.",
    });
  };

  if (isLoading || sessionsLoading) {
    return (
      <div className="min-h-screen bg-deep-black flex items-center justify-center">
        <div className="text-aged-gold text-xl font-cinzel">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-deep-black text-bone-white">
      <Navigation />
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-cinzel text-4xl font-bold text-aged-gold mb-4">
            Gestion des Sessions
          </h1>
          <p className="text-aged-parchment text-lg">
            Créez et gérez vos sessions de jeu. Invitez des joueurs et lancez des aventures lovecraftiennes.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="bg-charcoal border-aged-gold/20 parchment-bg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-aged-parchment text-sm">Sessions Totales</p>
                  <p className="text-2xl font-bold text-aged-gold">{sessions.length}</p>
                </div>
                <Users className="h-8 w-8 text-aged-gold/50" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-charcoal border-aged-gold/20 parchment-bg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-aged-parchment text-sm">Sessions Actives</p>
                  <p className="text-2xl font-bold text-eldritch-green">
                    {sessions.filter(s => s.isActive).length}
                  </p>
                </div>
                <Play className="h-8 w-8 text-eldritch-green/50" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-charcoal border-aged-gold/20 parchment-bg">
            <CardContent className="p-6">
              <Button 
                onClick={() => setCreateDialogOpen(true)}
                className="w-full bg-blood-burgundy hover:bg-dark-crimson text-bone-white"
                data-testid="button-create-session"
              >
                <Plus className="mr-2 h-5 w-5" />
                Nouvelle Session
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Sessions List */}
        <Card className="bg-charcoal border-aged-gold parchment-bg">
          <CardHeader>
            <CardTitle className="font-cinzel text-2xl text-aged-gold">
              Mes Sessions de Jeu
            </CardTitle>
          </CardHeader>
          <CardContent>
            {sessions.length === 0 ? (
              <div className="text-center py-12">
                <Users className="h-16 w-16 text-aged-gold/30 mx-auto mb-4" />
                <p className="text-aged-parchment mb-4">
                  Aucune session créée pour le moment.
                </p>
                <Button 
                  onClick={() => setCreateDialogOpen(true)}
                  className="bg-blood-burgundy hover:bg-dark-crimson text-bone-white"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Créer ma première session
                </Button>
              </div>
            ) : (
              <ScrollArea className="h-[400px]">
                <div className="space-y-4">
                  <AnimatePresence>
                    {sessions.map((session) => (
                      <motion.div
                        key={session.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                      >
                        <Card className="bg-cosmic-void border-aged-gold/30">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h3 className="font-cinzel text-lg text-aged-gold" data-testid={`text-session-name-${session.id}`}>
                                    {session.name}
                                  </h3>
                                  <Badge 
                                    variant={session.isActive ? "default" : "secondary"}
                                    className={session.isActive ? "bg-eldritch-green text-white" : ""}
                                  >
                                    {session.isActive ? "Active" : "En pause"}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-aged-parchment">
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {session.createdAt ? new Date(session.createdAt).toLocaleDateString('fr-FR') : 'N/A'}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {session.updatedAt ? new Date(session.updatedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => copyInviteLink(session.id)}
                                  className="border-aged-gold/50 text-aged-gold hover:bg-aged-gold/10"
                                  data-testid={`button-copy-link-${session.id}`}
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                                
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => toggleSessionMutation.mutate({ id: session.id, isActive: session.isActive || false })}
                                  className="border-aged-gold/50 text-aged-gold hover:bg-aged-gold/10"
                                  data-testid={`button-toggle-active-${session.id}`}
                                >
                                  {session.isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                                </Button>
                                
                                <Link href={`/gm/${session.id}`}>
                                  <Button
                                    size="sm"
                                    className="bg-blood-burgundy hover:bg-dark-crimson text-bone-white"
                                    data-testid={`button-open-dashboard-${session.id}`}
                                  >
                                    <Settings className="mr-1 h-4 w-4" />
                                    Gérer
                                  </Button>
                                </Link>
                                
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedSession(session);
                                    setDeleteConfirmOpen(true);
                                  }}
                                  className="border-blood-burgundy/50 text-blood-burgundy hover:bg-blood-burgundy/10"
                                  data-testid={`button-delete-${session.id}`}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* Create Session Dialog */}
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogContent className="bg-charcoal border-aged-gold text-bone-white">
            <DialogHeader>
              <DialogTitle className="font-cinzel text-aged-gold">
                Créer une Nouvelle Session
              </DialogTitle>
              <DialogDescription className="text-aged-parchment">
                Donnez un nom à votre session de jeu. Vous pourrez inviter des joueurs après sa création.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label htmlFor="session-name">Nom de la Session</Label>
                <Input
                  id="session-name"
                  value={sessionName}
                  onChange={(e) => setSessionName(e.target.value)}
                  placeholder="Ex: Les Mystères d'Arkham"
                  className="bg-cosmic-void border-aged-gold text-bone-white"
                  data-testid="input-session-name"
                />
              </div>
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setCreateDialogOpen(false)}
                  className="border-aged-gold/50 text-aged-gold hover:bg-aged-gold/10"
                >
                  Annuler
                </Button>
                <Button
                  onClick={handleCreateSession}
                  disabled={!sessionName.trim() || createSessionMutation.isPending}
                  className="bg-blood-burgundy hover:bg-dark-crimson text-bone-white"
                  data-testid="button-confirm-create"
                >
                  {createSessionMutation.isPending ? "Création..." : "Créer la Session"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <DialogContent className="bg-charcoal border-blood-burgundy text-bone-white">
            <DialogHeader>
              <DialogTitle className="font-cinzel text-blood-burgundy">
                Supprimer la Session
              </DialogTitle>
              <DialogDescription className="text-aged-parchment">
                Êtes-vous sûr de vouloir supprimer la session "{selectedSession?.name}" ? 
                Cette action est irréversible et supprimera tous les personnages associés.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-3 mt-4">
              <Button
                variant="outline"
                onClick={() => setDeleteConfirmOpen(false)}
                className="border-aged-gold/50 text-aged-gold hover:bg-aged-gold/10"
              >
                Annuler
              </Button>
              <Button
                onClick={handleDeleteSession}
                disabled={deleteSessionMutation.isPending}
                className="bg-blood-burgundy hover:bg-dark-crimson text-bone-white"
                data-testid="button-confirm-delete"
              >
                {deleteSessionMutation.isPending ? "Suppression..." : "Supprimer"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}