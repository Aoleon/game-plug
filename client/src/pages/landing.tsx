import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, Users, Dice6, Brain } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-deep-black text-bone-white">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-b from-cosmic-void to-deep-black">
        <div className="max-w-4xl mx-auto px-4 py-20 text-center">
          <h1 className="font-cinzel text-6xl md:text-8xl font-bold text-aged-gold mb-6">
            Rôle Plug
          </h1>
          <p className="font-crimson text-xl md:text-2xl text-aged-parchment mb-8 max-w-2xl mx-auto">
            Plongez dans l'univers cosmique de H.P. Lovecraft. Créez vos investigateurs, 
            affrontez l'indicible et succombez lentement à la folie.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg"
              className="bg-blood-burgundy hover:bg-dark-crimson text-bone-white px-8 py-4 text-lg font-source"
              onClick={() => window.location.href = '/api/login'}
              data-testid="button-login"
            >
              <Eye className="mr-2 h-5 w-5" />
              Devenir Maître de Jeu
            </Button>
            <Button 
              size="lg"
              variant="outline"
              className="border-aged-gold text-aged-gold hover:bg-aged-gold/10 px-8 py-4 text-lg font-source"
              onClick={() => window.location.pathname = '/join'}
              data-testid="button-join-session"
            >
              <Users className="mr-2 h-5 w-5" />
              Rejoindre une Session
            </Button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="font-cinzel text-4xl font-bold text-aged-gold text-center mb-12">
          Fonctionnalités
        </h2>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-charcoal border-aged-gold parchment-bg">
            <CardHeader className="text-center">
              <Users className="mx-auto h-12 w-12 text-aged-gold mb-4" />
              <CardTitle className="font-cinzel text-aged-gold">Création de Personnages</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-aged-parchment text-sm font-source">
                Génération automatique selon les règles de la 7e édition. 
                Portraits IA pour donner vie à vos investigateurs.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-charcoal border-aged-gold parchment-bg">
            <CardHeader className="text-center">
              <Dice6 className="mx-auto h-12 w-12 text-aged-gold mb-4" />
              <CardTitle className="font-cinzel text-aged-gold">Système de Dés</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-aged-parchment text-sm font-source">
                Lancers de compétences, tests de sanité, et dés de combat 
                intégrés avec gestion automatique des succès.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-charcoal border-aged-gold parchment-bg">
            <CardHeader className="text-center">
              <Brain className="mx-auto h-12 w-12 text-aged-gold mb-4" />
              <CardTitle className="font-cinzel text-aged-gold">Système de Folie</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-aged-parchment text-sm font-source">
                Gestion complète de la sanité mentale avec phobies, 
                manies et différents types de folie temporaire ou permanente.
              </p>
            </CardContent>
          </Card>

          <Card className="bg-charcoal border-aged-gold parchment-bg">
            <CardHeader className="text-center">
              <Eye className="mx-auto h-12 w-12 text-aged-gold mb-4" />
              <CardTitle className="font-cinzel text-aged-gold">Interface MJ</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-aged-parchment text-sm font-source">
                Tableau de bord pour le Maître de Jeu avec gestion 
                des joueurs, application d'effets et lancers secrets.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Atmosphere Section */}
      <div className="bg-gradient-to-t from-cosmic-void to-deep-black py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <blockquote className="font-crimson text-xl md:text-2xl italic text-aged-parchment mb-6">
            "La chose la plus miséricordieuse au monde, je pense, 
            est l'incapacité de l'esprit humain à corréler tout son contenu."
          </blockquote>
          <cite className="font-source text-aged-gold">— H.P. Lovecraft, L'Appel de Cthulhu</cite>
        </div>
      </div>
    </div>
  );
}
