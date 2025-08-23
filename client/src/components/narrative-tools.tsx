import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BookOpen, FileText, Sparkles, Music, MapPin, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface NarrativeToolsProps {
  onAmbiance?: (text: string) => void;
  onNarration?: (text: string) => void;
  className?: string;
}

const ATMOSPHERE_PRESETS = [
  {
    name: "Bibliothèque Interdite",
    icon: BookOpen,
    description: "L'air est lourd de poussière ancienne. Les reliures craquent sous vos doigts tremblants alors que vous tournez les pages jaunies d'un grimoire interdit.",
    sound: "Craquements de bois, murmures lointains",
    mood: "Inquiétant"
  },
  {
    name: "Crypte Oubliée",
    icon: MapPin,
    description: "L'humidité suinte des murs de pierre froide. Des gouttes d'eau résonnent dans l'obscurité oppressante de cette crypte millénaire.",
    sound: "Gouttes d'eau, échos lointains",
    mood: "Oppressant"
  },
  {
    name: "Manoir Abandonné",
    icon: FileText,
    description: "Les planchers grincent sous chaque pas. Des toiles d'araignée dansent dans les courants d'air glacés qui traversent les couloirs vides.",
    sound: "Grincements, vent dans les fissures",
    mood: "Désolé"
  },
  {
    name: "Rituel Nocturne",
    icon: Sparkles,
    description: "Des bougies vacillent, projetant des ombres dansantes. L'encens brûle, emplissant l'air d'une fumée épaisse aux relents mystiques.",
    sound: "Chants gutturaux, crépitement du feu",
    mood: "Mystique"
  },
];

const STORY_HOOKS = [
  "Un télégramme urgent arrive, portant le sceau de l'Université Miskatonic...",
  "Dans vos rêves récurrents, une cité engloutie vous appelle par votre nom...",
  "Le journal du matin titre: 'Disparitions mystérieuses dans le quartier du port'...",
  "Une étoile nouvelle brille dans le ciel, là où aucune n'existait la veille...",
  "Les animaux du quartier fuient vers le sud, comme poussés par une terreur invisible...",
];

export default function NarrativeTools({ 
  onAmbiance, 
  onNarration, 
  className 
}: NarrativeToolsProps) {
  const [customNarration, setCustomNarration] = useState("");
  const [selectedAtmosphere, setSelectedAtmosphere] = useState<string | null>(null);
  const [narrativeHistory, setNarrativeHistory] = useState<string[]>([]);
  const [currentTime, setCurrentTime] = useState("Nuit");

  const handleAtmosphereSelect = (atmosphere: typeof ATMOSPHERE_PRESETS[0]) => {
    setSelectedAtmosphere(atmosphere.name);
    if (onAmbiance) {
      onAmbiance(atmosphere.description);
    }
    addToHistory(`[Ambiance] ${atmosphere.name}`);
  };

  const handleStoryHook = (hook: string) => {
    if (onNarration) {
      onNarration(hook);
    }
    addToHistory(`[Accroche] ${hook}`);
  };

  const handleCustomNarration = () => {
    if (customNarration.trim() && onNarration) {
      onNarration(customNarration);
      addToHistory(`[Narration] ${customNarration}`);
      setCustomNarration("");
    }
  };

  const addToHistory = (text: string) => {
    setNarrativeHistory(prev => [text, ...prev.slice(0, 9)]);
  };

  const timeOptions = ["Aube", "Matin", "Midi", "Après-midi", "Crépuscule", "Nuit", "Minuit"];

  return (
    <Card className={cn("bg-gray-900/50 border-aged-gold/20", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-cinzel text-aged-gold">
          <BookOpen className="h-5 w-5" />
          Outils de Narration
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="atmosphere" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-gray-800">
            <TabsTrigger value="atmosphere">Ambiance</TabsTrigger>
            <TabsTrigger value="hooks">Accroches</TabsTrigger>
            <TabsTrigger value="custom">Personnalisé</TabsTrigger>
          </TabsList>

          <TabsContent value="atmosphere" className="space-y-3 mt-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-aged-gold" />
                <span className="text-sm text-aged-parchment">Moment:</span>
              </div>
              <select
                value={currentTime}
                onChange={(e) => setCurrentTime(e.target.value)}
                className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm"
                data-testid="select-time-period"
              >
                {timeOptions.map(time => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
            </div>

            <div className="grid gap-2">
              {ATMOSPHERE_PRESETS.map((atmosphere) => {
                const Icon = atmosphere.icon;
                const isSelected = selectedAtmosphere === atmosphere.name;
                
                return (
                  <motion.div
                    key={atmosphere.name}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Card 
                      className={cn(
                        "cursor-pointer transition-all p-3",
                        isSelected 
                          ? "bg-aged-gold/20 border-aged-gold" 
                          : "bg-gray-800/50 border-gray-700 hover:border-aged-gold/50"
                      )}
                      onClick={() => handleAtmosphereSelect(atmosphere)}
                      data-testid={`atmosphere-${atmosphere.name.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      <div className="flex items-start gap-3">
                        <Icon className="h-5 w-5 text-aged-gold mt-1" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-semibold text-aged-gold">
                              {atmosphere.name}
                            </h4>
                            <Badge variant="outline" className="text-xs">
                              {atmosphere.mood}
                            </Badge>
                          </div>
                          <p className="text-sm text-aged-parchment/80 mb-2">
                            {atmosphere.description}
                          </p>
                          <div className="flex items-center gap-2">
                            <Music className="h-3 w-3 text-gray-500" />
                            <span className="text-xs text-gray-500">
                              {atmosphere.sound}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="hooks" className="space-y-3 mt-4">
            <div className="space-y-2">
              {STORY_HOOKS.map((hook, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card
                    className="p-3 bg-gray-800/50 border-gray-700 hover:border-aged-gold/50 cursor-pointer transition-all"
                    onClick={() => handleStoryHook(hook)}
                    data-testid={`story-hook-${index}`}
                  >
                    <p className="text-sm text-aged-parchment italic">
                      {hook}
                    </p>
                  </Card>
                </motion.div>
              ))}
            </div>

            <Button
              variant="outline"
              className="w-full border-aged-gold/50 text-aged-gold hover:bg-aged-gold/10"
              onClick={() => {
                const randomHook = STORY_HOOKS[Math.floor(Math.random() * STORY_HOOKS.length)];
                handleStoryHook(randomHook);
              }}
              data-testid="button-random-hook"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Accroche Aléatoire
            </Button>
          </TabsContent>

          <TabsContent value="custom" className="space-y-3 mt-4">
            <Textarea
              value={customNarration}
              onChange={(e) => setCustomNarration(e.target.value)}
              placeholder="Décrivez la scène, l'ambiance ou les événements..."
              className="min-h-[120px] bg-gray-800 border-gray-700"
              data-testid="textarea-custom-narration"
            />
            <Button
              onClick={handleCustomNarration}
              disabled={!customNarration.trim()}
              className="w-full bg-blood-burgundy hover:bg-dark-crimson"
              data-testid="button-send-narration"
            >
              <FileText className="mr-2 h-4 w-4" />
              Envoyer la Narration
            </Button>
          </TabsContent>
        </Tabs>

        {narrativeHistory.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-700">
            <h4 className="text-sm font-semibold text-aged-gold mb-2">
              Historique Narratif
            </h4>
            <ScrollArea className="h-32">
              <AnimatePresence>
                {narrativeHistory.map((item, index) => (
                  <motion.div
                    key={`${item}-${index}`}
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="text-xs text-aged-parchment/60 mb-1"
                  >
                    {item}
                  </motion.div>
                ))}
              </AnimatePresence>
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  );
}