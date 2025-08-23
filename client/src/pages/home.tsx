import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/navigation";
import CharacterCard from "@/components/character-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Eye, Users, Scroll, Settings } from "lucide-react";
import type { Character, GameSession } from "@shared/schema";

export default function Home() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

  // Redirect to home if not authenticated
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
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: characters = [], isLoading: charactersLoading } = useQuery<Character[]>({
    queryKey: ["/api/characters"],
    retry: false,
  });

  const { data: sessions = [], isLoading: sessionsLoading } = useQuery<GameSession[]>({
    queryKey: ["/api/sessions"],
    retry: false,
  });

  if (isLoading || charactersLoading || sessionsLoading) {
    return (
      <div className="min-h-screen bg-deep-black flex items-center justify-center">
        <div className="text-aged-gold text-xl font-cinzel">Chargement...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-deep-black text-bone-white">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Welcome Header */}
        <div className="text-center mb-12">
          <h1 className="font-cinzel text-4xl md:text-6xl font-bold text-aged-gold mb-4">
            Dashboard des Ténèbres
          </h1>
          <p className="font-crimson text-xl text-aged-parchment max-w-2xl mx-auto">
            Gérez vos investigateurs et rejoignez les mystères lovecraftiens 
            qui vous attendent dans l'ombre.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Characters Section */}
          <div className="lg:col-span-2">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-cinzel text-2xl font-bold text-aged-gold">
                Mes Investigateurs
              </h2>
              <Link href="/create-character">
                <Button 
                  className="bg-blood-burgundy hover:bg-dark-crimson text-bone-white"
                  data-testid="button-create-character"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Nouveau Personnage
                </Button>
              </Link>
            </div>

            {characters.length === 0 ? (
              <Card className="bg-charcoal border-aged-gold parchment-bg">
                <CardContent className="p-8 text-center">
                  <Scroll className="mx-auto h-16 w-16 text-aged-gold mb-4" />
                  <h3 className="font-cinzel text-xl text-aged-gold mb-2">
                    Aucun Investigateur
                  </h3>
                  <p className="text-aged-parchment mb-4 font-source">
                    Créez votre premier personnage pour commencer votre voyage 
                    dans l'univers de Lovecraft.
                  </p>
                  <Link href="/create-character">
                    <Button 
                      className="bg-blood-burgundy hover:bg-dark-crimson text-bone-white"
                      data-testid="button-create-first-character"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Créer un Investigateur
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {characters.map((character) => (
                  <CharacterCard key={character.id} character={character} />
                ))}
              </div>
            )}
          </div>

          {/* Game Sessions Sidebar */}
          <div>
            <h2 className="font-cinzel text-2xl font-bold text-aged-gold mb-6">
              Sessions de Jeu
            </h2>

            {sessions.length === 0 ? (
              <Card className="bg-charcoal border-aged-gold parchment-bg">
                <CardContent className="p-6 text-center">
                  <Eye className="mx-auto h-12 w-12 text-aged-gold mb-4" />
                  <h3 className="font-cinzel text-lg text-aged-gold mb-2">
                    Aucune Session
                  </h3>
                  <p className="text-aged-parchment text-sm font-source mb-4">
                    Vous n'avez pas encore créé de session de jeu.
                  </p>
                  <Link href="/sessions">
                    <Button 
                      size="sm"
                      className="bg-blood-burgundy hover:bg-dark-crimson text-bone-white"
                      data-testid="button-create-first-session"
                    >
                      <Plus className="mr-1 h-3 w-3" />
                      Créer une Session
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {sessions.map((session) => (
                  <Card key={session.id} className="bg-charcoal border-aged-gold parchment-bg">
                    <CardHeader className="pb-3">
                      <CardTitle className="font-cinzel text-aged-gold text-lg">
                        {session.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center text-aged-parchment text-sm">
                          <Users className="mr-2 h-4 w-4" />
                          <span data-testid={`text-session-status-${session.id}`}>
                            {session.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <Link href={`/gm/${session.id}`}>
                          <Button 
                            size="sm" 
                            className="bg-eldritch-green hover:bg-green-800 text-bone-white"
                            data-testid={`button-manage-session-${session.id}`}
                          >
                            <Eye className="mr-1 h-3 w-3" />
                            Gérer
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Quick Actions */}
            <Card className="bg-charcoal border-aged-gold parchment-bg mt-6">
              <CardHeader>
                <CardTitle className="font-cinzel text-aged-gold">Actions Rapides</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Link href="/sessions">
                  <Button 
                    className="w-full bg-blood-burgundy hover:bg-dark-crimson text-bone-white"
                    data-testid="button-manage-sessions"
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Gérer les Sessions
                  </Button>
                </Link>
                <Button 
                  className="w-full bg-eldritch-green hover:bg-green-800 text-bone-white justify-start"
                  data-testid="button-create-session"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Créer une Session
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full border-aged-gold text-bone-white hover:bg-dark-stone justify-start"
                  data-testid="button-join-session"
                >
                  <Users className="mr-2 h-4 w-4" />
                  Rejoindre une Session
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
