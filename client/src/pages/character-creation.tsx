import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { z } from "zod";
import Navigation from "@/components/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { rollCharacteristics, calculateDerivedStats } from "@/lib/dice";
import { OCCUPATIONS, DEFAULT_SKILLS } from "@/lib/cthulhu-data";
import { Dice6, Wand2, Save, X } from "lucide-react";
import type { InsertCharacter } from "@shared/schema";

const characterCreationSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  occupation: z.string().min(1, "Veuillez sélectionner une occupation"),
  age: z.number().min(15).max(99),
  birthplace: z.string().optional(),
  residence: z.string().optional(),
  gender: z.string().optional(),
  sessionId: z.string().min(1, "ID de session requis"),
  avatarDescription: z.string().optional(),
});

type CharacterCreationForm = z.infer<typeof characterCreationSchema>;

export default function CharacterCreation() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [characteristics, setCharacteristics] = useState(rollCharacteristics());
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const [isGeneratingAvatar, setIsGeneratingAvatar] = useState(false);

  const form = useForm<CharacterCreationForm>({
    resolver: zodResolver(characterCreationSchema),
    defaultValues: {
      name: "",
      occupation: "",
      age: 25,
      birthplace: "",
      residence: "",
      gender: "",
      sessionId: "temp-session", // This would come from URL params or session selection
      avatarDescription: "",
    },
  });

  const createCharacterMutation = useMutation({
    mutationFn: async (data: InsertCharacter) => {
      const response = await apiRequest("POST", "/api/characters", data);
      return response.json();
    },
    onSuccess: (character) => {
      toast({
        title: "Personnage créé",
        description: `${character.name} a été créé avec succès.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/characters"] });
      setLocation(`/character/${character.id}`);
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de créer le personnage.",
        variant: "destructive",
      });
    },
  });

  const generateAvatarMutation = useMutation({
    mutationFn: async ({ characterId, description, name }: { characterId: string, description: string, name: string }) => {
      const response = await apiRequest("POST", `/api/characters/${characterId}/generate-avatar`, {
        description,
        characterName: name,
      });
      return response.json();
    },
    onSuccess: (data) => {
      setAvatarUrl(data.avatarUrl);
      toast({
        title: "Portrait généré",
        description: "Le portrait de votre personnage a été créé avec succès.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: "Impossible de générer le portrait.",
        variant: "destructive",
      });
    },
  });

  const handleRollCharacteristics = () => {
    setCharacteristics(rollCharacteristics());
    toast({
      title: "Caractéristiques lancées",
      description: "Nouvelles valeurs générées selon les règles de la 7e édition.",
    });
  };

  const handleGenerateAvatar = () => {
    const description = form.getValues("avatarDescription");
    const name = form.getValues("name");
    
    if (!description || !name) {
      toast({
        title: "Information manquante",
        description: "Veuillez remplir le nom et la description avant de générer le portrait.",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingAvatar(true);
    // For now we'll simulate the generation since we need a character ID
    setTimeout(() => {
      setAvatarUrl("https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&h=300");
      setIsGeneratingAvatar(false);
      toast({
        title: "Portrait généré",
        description: "Le portrait de votre personnage a été créé.",
      });
    }, 3000);
  };

  const onSubmit = (data: CharacterCreationForm) => {
    const derivedStats = calculateDerivedStats(characteristics);
    const occupation = OCCUPATIONS.find(occ => occ.name === data.occupation);
    
    const characterData: InsertCharacter = {
      name: data.name,
      occupation: data.occupation,
      age: data.age,
      birthplace: data.birthplace || "",
      residence: data.residence || "",
      gender: data.gender || "",
      sessionId: data.sessionId,
      userId: "", // This will be set by the backend
      
      // Characteristics
      strength: characteristics.strength,
      constitution: characteristics.constitution,
      size: characteristics.size,
      dexterity: characteristics.dexterity,
      appearance: characteristics.appearance,
      intelligence: characteristics.intelligence,
      power: characteristics.power,
      education: characteristics.education,
      luck: characteristics.luck,
      
      // Derived stats
      hitPoints: derivedStats.hitPoints,
      maxHitPoints: derivedStats.hitPoints,
      sanity: derivedStats.sanity,
      maxSanity: derivedStats.maxSanity,
      magicPoints: derivedStats.magicPoints,
      maxMagicPoints: derivedStats.magicPoints,
      
      // Skills (occupation skills + default skills)
      skills: {
        ...DEFAULT_SKILLS,
        ...(occupation?.skills || {}),
      },
      
      avatarUrl: avatarUrl || undefined,
      avatarPrompt: data.avatarDescription || undefined,
      isActive: true,
    };

    createCharacterMutation.mutate(characterData);
  };

  return (
    <div className="min-h-screen bg-deep-black text-bone-white">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="font-cinzel text-4xl font-bold text-aged-gold mb-2">
            Création d'Investigateur
          </h1>
          <p className="font-crimson text-lg text-aged-parchment">
            Donnez naissance à celui qui défiera les ténèbres cosmiques
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Basic Information */}
            <Card className="bg-charcoal border-aged-gold parchment-bg">
              <CardHeader>
                <CardTitle className="font-cinzel text-aged-gold">
                  Informations de Base
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-aged-parchment font-source">
                          Nom du Personnage
                        </FormLabel>
                        <FormControl>
                          <Input 
                            {...field}
                            className="bg-cosmic-void border-aged-gold text-bone-white"
                            placeholder="Dr. Marcus Whitmore"
                            data-testid="input-character-name"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="occupation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-aged-parchment font-source">
                          Occupation
                        </FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger 
                              className="bg-cosmic-void border-aged-gold text-bone-white"
                              data-testid="select-occupation"
                            >
                              <SelectValue placeholder="Sélectionnez une occupation" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-cosmic-void border-aged-gold">
                            {OCCUPATIONS.map((occupation) => (
                              <SelectItem key={occupation.name} value={occupation.name}>
                                {occupation.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="age"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-aged-parchment font-source">Âge</FormLabel>
                        <FormControl>
                          <Input 
                            {...field}
                            type="number"
                            min={15}
                            max={99}
                            className="bg-cosmic-void border-aged-gold text-bone-white"
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                            data-testid="input-age"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="birthplace"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-aged-parchment font-source">
                          Lieu de naissance
                        </FormLabel>
                        <FormControl>
                          <Input 
                            {...field}
                            className="bg-cosmic-void border-aged-gold text-bone-white"
                            placeholder="Boston, MA"
                            data-testid="input-birthplace"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="residence"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-aged-parchment font-source">
                          Résidence
                        </FormLabel>
                        <FormControl>
                          <Input 
                            {...field}
                            className="bg-cosmic-void border-aged-gold text-bone-white"
                            placeholder="Arkham, MA"
                            data-testid="input-residence"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Characteristics */}
            <Card className="bg-charcoal border-aged-gold parchment-bg">
              <CardHeader>
                <CardTitle className="font-cinzel text-aged-gold flex justify-between items-center">
                  Caractéristiques
                  <Button
                    type="button"
                    onClick={handleRollCharacteristics}
                    className="bg-blood-burgundy hover:bg-dark-crimson text-bone-white"
                    data-testid="button-roll-characteristics"
                  >
                    <Dice6 className="mr-2 h-4 w-4" />
                    Relancer
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(characteristics).map(([key, value]) => (
                    <div key={key} className="text-center">
                      <div className="text-xs font-source text-aged-parchment mb-1 uppercase">
                        {key === 'strength' && 'Force (FOR)'}
                        {key === 'constitution' && 'Constitution (CON)'}
                        {key === 'size' && 'Taille (TAI)'}
                        {key === 'dexterity' && 'Dextérité (DEX)'}
                        {key === 'appearance' && 'Apparence (APP)'}
                        {key === 'intelligence' && 'Intelligence (INT)'}
                        {key === 'power' && 'Pouvoir (POU)'}
                        {key === 'education' && 'Éducation (EDU)'}
                        {key === 'luck' && 'Chance (CHA)'}
                      </div>
                      <div className="bg-cosmic-void border border-aged-gold rounded px-2 py-3">
                        <div className="text-lg font-bold text-bone-white" data-testid={`stat-${key}`}>
                          {value}
                        </div>
                        <div className="text-xs text-aged-parchment">
                          {key === 'size' || key === 'intelligence' || key === 'education' ? '(2d6+6)×5' : '3d6×5'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Avatar Generation */}
            <Card className="bg-charcoal border-aged-gold parchment-bg">
              <CardHeader>
                <CardTitle className="font-cinzel text-aged-gold">
                  Portrait du Personnage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <FormField
                      control={form.control}
                      name="avatarDescription"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-aged-parchment font-source">
                            Description physique
                          </FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field}
                              className="bg-cosmic-void border-aged-gold text-bone-white h-32"
                              placeholder="Décrivez l'apparence de votre personnage (âge, couleur des cheveux, style vestimentaire années 1920...)"
                              data-testid="textarea-avatar-description"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button
                      type="button"
                      onClick={handleGenerateAvatar}
                      disabled={isGeneratingAvatar}
                      className="mt-4 bg-eldritch-green hover:bg-green-800 text-bone-white"
                      data-testid="button-generate-avatar"
                    >
                      <Wand2 className="mr-2 h-4 w-4" />
                      {isGeneratingAvatar ? "Génération..." : "Générer le Portrait IA"}
                    </Button>
                  </div>
                  
                  <div className="flex justify-center">
                    <div className="w-48 h-48 bg-cosmic-void border border-aged-gold rounded-lg flex items-center justify-center">
                      {avatarUrl ? (
                        <img 
                          src={avatarUrl} 
                          alt="Portrait du personnage" 
                          className="w-full h-full object-cover rounded-lg"
                          data-testid="img-avatar-preview"
                        />
                      ) : (
                        <div className="text-center text-aged-parchment">
                          <Wand2 className="mx-auto h-12 w-12 mb-2" />
                          <p className="text-sm">Portrait à générer</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-4 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setLocation("/")}
                className="border-aged-gold text-bone-white hover:bg-dark-stone"
                data-testid="button-cancel-creation"
              >
                <X className="mr-2 h-4 w-4" />
                Annuler
              </Button>
              
              <Button
                type="submit"
                disabled={createCharacterMutation.isPending}
                className="bg-blood-burgundy hover:bg-dark-crimson text-bone-white"
                data-testid="button-save-character"
              >
                <Save className="mr-2 h-4 w-4" />
                {createCharacterMutation.isPending ? "Sauvegarde..." : "Sauvegarder le Personnage"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
