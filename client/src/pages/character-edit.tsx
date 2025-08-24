import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { z } from "zod";
import Navigation from "@/components/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { rollCharacteristics, calculateDerivedStats } from "@/lib/dice";
import { OCCUPATIONS, DEFAULT_SKILLS, calculateOccupationPoints, SKILL_TRANSLATIONS } from "@/lib/cthulhu-data";
import { Dice6, Wand2, Save, ArrowLeft, AlertCircle, Info, Edit, RefreshCw } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { Character, GameSession } from "@shared/schema";

const characterEditSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  occupation: z.string().min(1, "Veuillez sélectionner une occupation"),
  age: z.coerce.number().min(15, "L'âge minimum est 15 ans").max(99, "L'âge maximum est 99 ans"),
  birthplace: z.string().optional(),
  residence: z.string().optional(),
  gender: z.string().optional(),
  strength: z.coerce.number().min(1).max(100),
  constitution: z.coerce.number().min(1).max(100),
  size: z.coerce.number().min(1).max(100),
  dexterity: z.coerce.number().min(1).max(100),
  appearance: z.coerce.number().min(1).max(100),
  intelligence: z.coerce.number().min(1).max(100),
  power: z.coerce.number().min(1).max(100),
  education: z.coerce.number().min(1).max(100),
  luck: z.coerce.number().min(1).max(100),
  hitPoints: z.coerce.number().min(0),
  maxHitPoints: z.coerce.number().min(1),
  sanity: z.coerce.number().min(0),
  maxSanity: z.coerce.number().min(1),
  magicPoints: z.coerce.number().min(0),
  maxMagicPoints: z.coerce.number().min(1),
});

type CharacterEditForm = z.infer<typeof characterEditSchema>;

export default function CharacterEdit() {
  const params = useParams();
  const characterId = params.id;
  const sessionId = params.sessionId;
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [isGeneratingAvatar, setIsGeneratingAvatar] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const [skillPoints, setSkillPoints] = useState<Record<string, number>>({});
  const [avatarDescription, setAvatarDescription] = useState("");

  // Check if user is authenticated and is GM
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast({
        title: "Non autorisé",
        description: "Vous êtes déconnecté. Connexion en cours...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
    }
  }, [isAuthenticated, authLoading, toast]);

  // Fetch session to verify GM
  const { data: session } = useQuery<GameSession>({
    queryKey: ["/api/sessions", sessionId],
    enabled: !!sessionId && isAuthenticated,
  });

  // Fetch character data
  const { data: character, isLoading: characterLoading } = useQuery<Character>({
    queryKey: ["/api/characters", characterId],
    enabled: !!characterId && isAuthenticated,
  });

  // Check if user is GM
  const isGM = session && user && typeof user === 'object' && user !== null && 'id' in user && session.gmId === (user as any).id;

  const form = useForm<CharacterEditForm>({
    resolver: zodResolver(characterEditSchema),
    defaultValues: {
      name: "",
      occupation: "",
      age: 25,
      birthplace: "",
      residence: "",
      gender: "",
      strength: 50,
      constitution: 50,
      size: 60,
      dexterity: 50,
      appearance: 50,
      intelligence: 50,
      power: 50,
      education: 50,
      luck: 50,
      hitPoints: 10,
      maxHitPoints: 10,
      sanity: 50,
      maxSanity: 50,
      magicPoints: 10,
      maxMagicPoints: 10,
    },
  });

  // Load character data into form
  useEffect(() => {
    if (character) {
      form.reset({
        name: character.name,
        occupation: character.occupation,
        age: character.age || 25,
        birthplace: character.birthplace || "",
        residence: character.residence || "",
        gender: character.gender || "",
        strength: character.strength,
        constitution: character.constitution,
        size: character.size,
        dexterity: character.dexterity,
        appearance: character.appearance,
        intelligence: character.intelligence,
        power: character.power,
        education: character.education,
        luck: character.luck,
        hitPoints: character.hitPoints,
        maxHitPoints: character.maxHitPoints,
        sanity: character.sanity,
        maxSanity: character.maxSanity,
        magicPoints: character.magicPoints,
        maxMagicPoints: character.maxMagicPoints,
      });
      setAvatarUrl(character.avatarUrl || "");
      setSkillPoints(character.skills as Record<string, number> || {});
    }
  }, [character, form]);

  // Update character mutation
  const updateCharacterMutation = useMutation({
    mutationFn: async (data: CharacterEditForm) => {
      const characteristics = {
        strength: data.strength,
        constitution: data.constitution,
        size: data.size,
        dexterity: data.dexterity,
        appearance: data.appearance,
        intelligence: data.intelligence,
        power: data.power,
        education: data.education,
        luck: data.luck,
      };

      const updateData = {
        ...data,
        skills: skillPoints,
        avatarUrl,
        skillsLocked: false, // GM can unlock skills when editing
      };

      await apiRequest(`/api/characters/${characterId}`, 'PATCH', updateData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/characters", characterId] });
      queryClient.invalidateQueries({ queryKey: ["/api/sessions", sessionId, "characters"] });
      toast({
        title: "Personnage modifié",
        description: "Les modifications ont été sauvegardées avec succès.",
      });
      setLocation(`/gm-dashboard/${sessionId}`);
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Erreur",
        description: "Impossible de modifier le personnage.",
        variant: "destructive",
      });
    },
  });

  const handleRollCharacteristics = () => {
    const newCharacteristics = rollCharacteristics();
    form.setValue('strength', newCharacteristics.strength);
    form.setValue('constitution', newCharacteristics.constitution);
    form.setValue('size', newCharacteristics.size);
    form.setValue('dexterity', newCharacteristics.dexterity);
    form.setValue('appearance', newCharacteristics.appearance);
    form.setValue('intelligence', newCharacteristics.intelligence);
    form.setValue('power', newCharacteristics.power);
    form.setValue('education', newCharacteristics.education);
    form.setValue('luck', newCharacteristics.luck);
    
    // Calculate derived stats
    const derived = calculateDerivedStats(newCharacteristics);
    form.setValue('maxHitPoints', derived.hitPoints);
    form.setValue('hitPoints', Math.min(form.getValues('hitPoints'), derived.hitPoints));
    form.setValue('maxSanity', derived.sanity);
    form.setValue('sanity', Math.min(form.getValues('sanity'), derived.sanity));
    form.setValue('maxMagicPoints', derived.magicPoints);
    form.setValue('magicPoints', Math.min(form.getValues('magicPoints'), derived.magicPoints));
  };

  const handleRecalculateDerived = () => {
    const characteristics = {
      strength: form.getValues('strength'),
      constitution: form.getValues('constitution'),
      size: form.getValues('size'),
      dexterity: form.getValues('dexterity'),
      appearance: form.getValues('appearance'),
      intelligence: form.getValues('intelligence'),
      power: form.getValues('power'),
      education: form.getValues('education'),
      luck: form.getValues('luck'),
    };
    
    const derived = calculateDerivedStats(characteristics);
    form.setValue('maxHitPoints', derived.hitPoints);
    form.setValue('maxSanity', derived.sanity);
    form.setValue('maxMagicPoints', derived.magicPoints);
  };

  const handleGenerateAvatar = async () => {
    try {
      setIsGeneratingAvatar(true);
      
      const description = avatarDescription || 
        `Portrait of ${form.getValues('name')}, ${form.getValues('age')} year old ${form.getValues('occupation')}, 1920s style`;
      
      const response = await apiRequest('/api/generate-avatar', 'POST', {
        description,
        characterName: form.getValues('name'),
        occupation: form.getValues('occupation'),
        age: form.getValues('age'),
      });

      setAvatarUrl((response as any).avatarUrl);
      toast({
        title: "Portrait généré",
        description: "Le nouveau portrait a été créé avec succès.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de générer le portrait. Vérifiez votre clé API OpenAI.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingAvatar(false);
    }
  };

  const handleSkillChange = (skillKey: string, value: number) => {
    setSkillPoints(prev => ({
      ...prev,
      [skillKey]: Math.max(0, Math.min(100, value))
    }));
  };

  const onSubmit = (data: CharacterEditForm) => {
    updateCharacterMutation.mutate(data);
  };

  if (authLoading || characterLoading) {
    return (
      <div className="min-h-screen bg-deep-black flex items-center justify-center">
        <div className="text-aged-gold text-xl font-cinzel">Chargement...</div>
      </div>
    );
  }

  if (!isGM) {
    return (
      <div className="min-h-screen bg-deep-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-cinzel text-aged-gold mb-4">Accès refusé</h1>
          <p className="text-aged-parchment mb-4">Seul le MJ peut éditer les personnages.</p>
          <Button
            onClick={() => setLocation(`/gm-dashboard/${sessionId}`)}
            className="bg-blood-burgundy hover:bg-dark-crimson text-bone-white"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour au tableau de bord
          </Button>
        </div>
      </div>
    );
  }

  if (!character) {
    return (
      <div className="min-h-screen bg-deep-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-cinzel text-aged-gold mb-4">Personnage introuvable</h1>
          <Button
            onClick={() => setLocation(`/gm-dashboard/${sessionId}`)}
            className="bg-blood-burgundy hover:bg-dark-crimson text-bone-white"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour au tableau de bord
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-deep-black text-bone-white">
      <Navigation />
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-cinzel text-3xl text-aged-gold">
            Édition du Personnage
          </h1>
          <Button
            onClick={() => setLocation(`/gm-dashboard/${sessionId}`)}
            variant="outline"
            className="border-aged-gold text-bone-white hover:bg-dark-stone"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>
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
              <CardContent className="grid md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-aged-parchment font-source">Nom</FormLabel>
                      <FormControl>
                        <Input {...field} className="bg-cosmic-void border-aged-gold text-bone-white" />
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
                      <FormLabel className="text-aged-parchment font-source">Occupation</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="bg-cosmic-void border-aged-gold text-bone-white">
                            <SelectValue placeholder="Choisir une occupation" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="bg-cosmic-void border-aged-gold">
                          {OCCUPATIONS.map((occ) => (
                            <SelectItem key={occ.name} value={occ.name}>
                              {occ.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="age"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-aged-parchment font-source">Âge</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} className="bg-cosmic-void border-aged-gold text-bone-white" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-aged-parchment font-source">Genre</FormLabel>
                      <FormControl>
                        <Input {...field} className="bg-cosmic-void border-aged-gold text-bone-white" />
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
                      <FormLabel className="text-aged-parchment font-source">Lieu de Naissance</FormLabel>
                      <FormControl>
                        <Input {...field} className="bg-cosmic-void border-aged-gold text-bone-white" />
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
                      <FormLabel className="text-aged-parchment font-source">Résidence</FormLabel>
                      <FormControl>
                        <Input {...field} className="bg-cosmic-void border-aged-gold text-bone-white" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Characteristics */}
            <Card className="bg-charcoal border-aged-gold parchment-bg">
              <CardHeader>
                <CardTitle className="font-cinzel text-aged-gold flex justify-between items-center">
                  Caractéristiques
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      onClick={handleRollCharacteristics}
                      className="bg-blood-burgundy hover:bg-dark-crimson text-bone-white"
                    >
                      <Dice6 className="mr-2 h-4 w-4" />
                      Relancer Tout
                    </Button>
                    <Button
                      type="button"
                      onClick={handleRecalculateDerived}
                      variant="outline"
                      className="border-aged-gold text-bone-white hover:bg-dark-stone"
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Recalculer Stats Dérivées
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="grid md:grid-cols-3 gap-4">
                {['strength', 'constitution', 'size', 'dexterity', 'appearance', 'intelligence', 'power', 'education', 'luck'].map((stat) => (
                  <FormField
                    key={stat}
                    control={form.control}
                    name={stat as any}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-aged-parchment font-source capitalize">
                          {stat === 'strength' && 'Force (FOR)'}
                          {stat === 'constitution' && 'Constitution (CON)'}
                          {stat === 'size' && 'Taille (TAI)'}
                          {stat === 'dexterity' && 'Dextérité (DEX)'}
                          {stat === 'appearance' && 'Apparence (APP)'}
                          {stat === 'intelligence' && 'Intelligence (INT)'}
                          {stat === 'power' && 'Pouvoir (POU)'}
                          {stat === 'education' && 'Éducation (EDU)'}
                          {stat === 'luck' && 'Chance (CHA)'}
                        </FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            {...field} 
                            className="bg-cosmic-void border-aged-gold text-bone-white"
                            min="1"
                            max="100"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
              </CardContent>
            </Card>

            {/* Derived Stats */}
            <Card className="bg-charcoal border-aged-gold parchment-bg">
              <CardHeader>
                <CardTitle className="font-cinzel text-aged-gold">
                  Statistiques Dérivées
                </CardTitle>
              </CardHeader>
              <CardContent className="grid md:grid-cols-3 gap-6">
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="hitPoints"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-aged-parchment font-source">Points de Vie Actuels</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} className="bg-cosmic-void border-aged-gold text-bone-white" min="0" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="maxHitPoints"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-aged-parchment font-source">Points de Vie Maximum</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} className="bg-cosmic-void border-aged-gold text-bone-white" min="1" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="sanity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-aged-parchment font-source">Sanité Actuelle</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} className="bg-cosmic-void border-aged-gold text-bone-white" min="0" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="maxSanity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-aged-parchment font-source">Sanité Maximum</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} className="bg-cosmic-void border-aged-gold text-bone-white" min="1" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="magicPoints"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-aged-parchment font-source">Points de Magie Actuels</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} className="bg-cosmic-void border-aged-gold text-bone-white" min="0" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="maxMagicPoints"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-aged-parchment font-source">Points de Magie Maximum</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} className="bg-cosmic-void border-aged-gold text-bone-white" min="1" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Skills */}
            <Card className="bg-charcoal border-aged-gold parchment-bg">
              <CardHeader>
                <CardTitle className="font-cinzel text-aged-gold">
                  Compétences
                  <Badge className="ml-2 bg-aged-gold text-deep-black">
                    <Edit className="h-3 w-3 mr-1" />
                    Mode MJ - Édition Libre
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Alert className="mb-6 bg-cosmic-void border-aged-gold">
                  <Info className="h-4 w-4 text-aged-gold" />
                  <AlertDescription className="text-aged-parchment">
                    En tant que MJ, vous pouvez modifier librement toutes les compétences du personnage.
                  </AlertDescription>
                </Alert>
                
                <div className="grid md:grid-cols-3 gap-3">
                  {Object.entries(DEFAULT_SKILLS).map(([skillKey, baseValue]) => {
                    const currentValue = skillPoints[skillKey] || baseValue;
                    const skillName = SKILL_TRANSLATIONS[skillKey] || skillKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                    
                    return (
                      <div key={skillKey} className="flex justify-between items-center p-2 rounded border border-aged-gold/50 bg-cosmic-void/50">
                        <div className="flex-1">
                          <div className="font-source text-sm text-bone-white">
                            {skillName}
                          </div>
                          <div className="text-xs text-aged-parchment">
                            Base: {baseValue}%
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={currentValue}
                            onChange={(e) => handleSkillChange(skillKey, parseInt(e.target.value) || 0)}
                            className="w-16 h-8 bg-deep-black text-bone-white text-center border-aged-gold"
                          />
                          <span className="text-sm font-bold text-aged-gold w-12 text-right">
                            {currentValue}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
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
              <CardContent className="space-y-6">
                <div className="flex items-center justify-center">
                  {avatarUrl ? (
                    <div className="space-y-4">
                      <img 
                        src={avatarUrl} 
                        alt="Portrait du personnage"
                        className="w-64 h-64 rounded-lg border-2 border-aged-gold object-cover"
                      />
                      <p className="text-xs text-aged-parchment text-center">Portrait actuel</p>
                    </div>
                  ) : (
                    <div className="w-64 h-64 bg-cosmic-void border-2 border-aged-gold rounded-lg flex items-center justify-center">
                      <span className="text-aged-parchment text-center">
                        Aucun portrait
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <Label className="text-aged-parchment font-source">
                      Description pour génération IA
                    </Label>
                    <Textarea
                      value={avatarDescription}
                      onChange={(e) => setAvatarDescription(e.target.value)}
                      className="bg-cosmic-void border-aged-gold text-bone-white h-32 mt-2"
                      placeholder="Décrivez l'apparence du personnage pour générer un nouveau portrait..."
                    />
                  </div>

                  <Button
                    type="button"
                    onClick={handleGenerateAvatar}
                    disabled={isGeneratingAvatar}
                    className="w-full bg-eldritch-green hover:bg-green-800 text-bone-white"
                  >
                    <Wand2 className="mr-2 h-4 w-4" />
                    {isGeneratingAvatar ? "Génération..." : "Générer un Nouveau Portrait IA"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-4 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setLocation(`/gm-dashboard/${sessionId}`)}
                className="border-aged-gold text-bone-white hover:bg-dark-stone"
              >
                Annuler
              </Button>
              
              <Button
                type="submit"
                disabled={updateCharacterMutation.isPending}
                className="bg-blood-burgundy hover:bg-dark-crimson text-bone-white"
              >
                <Save className="mr-2 h-4 w-4" />
                {updateCharacterMutation.isPending ? "Sauvegarde..." : "Sauvegarder les Modifications"}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}