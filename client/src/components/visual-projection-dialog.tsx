import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useWebSocket } from "@/hooks/useWebSocket";
import { apiRequest } from "@/lib/queryClient";
import { Wand2, Link, Upload, Monitor, RotateCcw } from "lucide-react";

interface ProjectionContent {
  type: 'image' | 'text' | 'none';
  url?: string;
  description?: string;
  prompt?: string;
}

interface VisualProjectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string | undefined;
}

export default function VisualProjectionDialog({ 
  open, 
  onOpenChange,
  sessionId 
}: VisualProjectionDialogProps) {
  const { toast } = useToast();
  const { isConnected, sendMessage } = useWebSocket("/game-ws");
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [imagePrompt, setImagePrompt] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const handleGenerateImage = async () => {
    if (!imagePrompt.trim()) return;
    
    setIsGenerating(true);
    try {
      const response = await apiRequest("POST", "/api/gameboard/generate-scene", {
        prompt: imagePrompt,
        sessionId: sessionId
      });
      const data = await response.json();
      
      const newContent: ProjectionContent = {
        type: 'image',
        url: data.imageUrl,
        description: imagePrompt,
        prompt: imagePrompt
      };
      
      // Broadcast to WebSocket for sync
      if (isConnected) {
        sendMessage('projection_update', {
          sessionId,
          content: newContent,
          timestamp: new Date()
        });
      }
      
      toast({
        title: "Image générée",
        description: "La scène a été générée et projetée sur le tableau de jeu.",
      });
      
      setImagePrompt("");
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de générer l'image.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleLoadFromUrl = () => {
    if (!imageUrl.trim()) return;
    
    const newContent: ProjectionContent = {
      type: 'image',
      url: imageUrl,
      description: "Image depuis URL"
    };
    
    if (isConnected) {
      sendMessage('projection_update', {
        sessionId,
        content: newContent,
        timestamp: new Date()
      });
    }
    
    toast({
      title: "Image chargée",
      description: "L'image a été projetée sur le tableau de jeu.",
    });
    
    setImageUrl("");
    onOpenChange(false);
  };

  const clearProjection = () => {
    const newContent: ProjectionContent = { type: 'none' };
    
    if (isConnected) {
      sendMessage('projection_update', {
        sessionId,
        content: newContent,
        timestamp: new Date()
      });
    }

    toast({
      title: "Projection effacée",
      description: "Le tableau de jeu a été nettoyé.",
    });
    
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-charcoal border-aged-gold max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-cinzel text-2xl text-aged-gold flex items-center gap-2">
            <Monitor className="h-6 w-6" />
            Projection Visuelle
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Tabs defaultValue="ai-generation" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-cosmic-void">
              <TabsTrigger 
                value="ai-generation" 
                className="data-[state=active]:bg-aged-gold data-[state=active]:text-deep-black"
                data-testid="tab-ai-generation"
              >
                <Wand2 className="h-4 w-4 mr-2" />
                Génération IA
              </TabsTrigger>
              <TabsTrigger 
                value="url-load" 
                className="data-[state=active]:bg-aged-gold data-[state=active]:text-deep-black"
                data-testid="tab-url-load"
              >
                <Link className="h-4 w-4 mr-2" />
                Depuis URL
              </TabsTrigger>
              <TabsTrigger 
                value="control" 
                className="data-[state=active]:bg-aged-gold data-[state=active]:text-deep-black"
                data-testid="tab-control"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Contrôle
              </TabsTrigger>
            </TabsList>

            <TabsContent value="ai-generation" className="mt-4 space-y-3">
              <div className="bg-cosmic-void border border-aged-gold/30 rounded-lg p-4">
                <h3 className="font-cinzel text-aged-gold mb-3">
                  Générer une scène avec l'IA
                </h3>
                <p className="text-sm text-aged-parchment mb-4">
                  Décrivez la scène que vous souhaitez projeter. L'IA générera une image correspondante.
                </p>
                <Textarea
                  placeholder="Ex: Une bibliothèque sombre aux livres anciens, éclairée par des bougies vacillantes, avec des symboles étranges gravés sur les murs..."
                  value={imagePrompt}
                  onChange={(e) => setImagePrompt(e.target.value)}
                  className="bg-cosmic-void border-aged-gold text-bone-white min-h-[120px] resize-none"
                  data-testid="textarea-ai-prompt"
                />
              </div>
              <Button
                onClick={handleGenerateImage}
                disabled={!imagePrompt.trim() || isGenerating}
                className="w-full bg-eldritch-green hover:bg-green-700 text-bone-white"
                data-testid="button-generate-image"
              >
                <Wand2 className="h-4 w-4 mr-2" />
                {isGenerating ? "Génération en cours..." : "Générer et Projeter"}
              </Button>
            </TabsContent>

            <TabsContent value="url-load" className="mt-4 space-y-3">
              <div className="bg-cosmic-void border border-aged-gold/30 rounded-lg p-4">
                <h3 className="font-cinzel text-aged-gold mb-3">
                  Charger une image depuis une URL
                </h3>
                <p className="text-sm text-aged-parchment mb-4">
                  Entrez l'URL complète d'une image à projeter sur le tableau de jeu.
                </p>
                <Input
                  placeholder="https://example.com/image.jpg"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="bg-cosmic-void border-aged-gold text-bone-white"
                  data-testid="input-image-url"
                />
              </div>
              <Button
                onClick={handleLoadFromUrl}
                disabled={!imageUrl.trim()}
                className="w-full bg-aged-gold hover:bg-yellow-600 text-deep-black font-bold"
                data-testid="button-load-url"
              >
                <Link className="h-4 w-4 mr-2" />
                Charger et Projeter
              </Button>
            </TabsContent>

            <TabsContent value="control" className="mt-4 space-y-3">
              <div className="bg-cosmic-void border border-aged-gold/30 rounded-lg p-4">
                <h3 className="font-cinzel text-aged-gold mb-3">
                  Contrôle de la projection
                </h3>
                <p className="text-sm text-aged-parchment mb-4">
                  Effacez le contenu actuellement projeté sur le tableau de jeu.
                </p>
              </div>
              <Button
                onClick={clearProjection}
                variant="outline"
                className="w-full border-blood-burgundy text-blood-burgundy hover:bg-blood-burgundy hover:text-bone-white"
                data-testid="button-clear-projection"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Effacer la Projection
              </Button>
            </TabsContent>
          </Tabs>

          <div className="flex items-center gap-2 p-3 bg-cosmic-void border border-aged-gold/30 rounded">
            <Monitor className="h-4 w-4 text-aged-gold" />
            <div className="flex-1">
              <p className="text-xs text-aged-parchment">
                {isConnected ? (
                  <span className="text-eldritch-green">● Connecté au tableau de jeu</span>
                ) : (
                  <span className="text-blood-burgundy">● Déconnecté du tableau de jeu</span>
                )}
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
