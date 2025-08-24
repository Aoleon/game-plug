import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
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
import { Dice6, Wand2, Save, X, AlertCircle, Sparkles, User, MapPin, Calendar, ToggleLeft, ToggleRight, Info, Lock } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import type { InsertCharacter, GameSession } from "@shared/schema";

const characterCreationSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  occupation: z.string().min(1, "Veuillez sélectionner une occupation"),
  age: z.coerce.number().min(15, "L'âge minimum est 15 ans").max(99, "L'âge maximum est 99 ans"),
  birthplace: z.string().optional(),
  residence: z.string().optional(),
  gender: z.string().optional(),
  sessionId: z.string().optional(),
  avatarDescription: z.string().optional(),
});

type CharacterCreationForm = z.infer<typeof characterCreationSchema>;

export default function CharacterCreation() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [characteristics, setCharacteristics] = useState(rollCharacteristics());
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const [isGeneratingAvatar, setIsGeneratingAvatar] = useState(false);
  const [selectedOccupation, setSelectedOccupation] = useState<string>("");
  const [skillPoints, setSkillPoints] = useState<Record<string, number>>({});
  const [allocatedPoints, setAllocatedPoints] = useState<Record<string, number>>({});
  const [manualSkillMode, setManualSkillMode] = useState(false);
  const [availableOccupationPoints, setAvailableOccupationPoints] = useState(0);
  const [availablePersonalPoints, setAvailablePersonalPoints] = useState(0);
  const [usedOccupationPoints, setUsedOccupationPoints] = useState(0);
  const [usedPersonalPoints, setUsedPersonalPoints] = useState(0);
  const [physicalTraits, setPhysicalTraits] = useState({
    height: "",
    weight: "",
    hairColor: "",
    eyeColor: "",
    build: "",
    style: "",
    distinctiveFeatures: [] as string[],
  });

  // Initialize skills with defaults
  useEffect(() => {
    const baseSkills = { ...DEFAULT_SKILLS };
    // Calculate dodge based on DEX
    baseSkills.dodge = Math.floor(characteristics.dexterity / 2);
    // Set language_own based on EDU
    baseSkills.language_own = characteristics.education;
    setSkillPoints(baseSkills);
    setAllocatedPoints({});
    
    // Calculate personal interest points
    setAvailablePersonalPoints(characteristics.intelligence * 2);
  }, [characteristics]);

  // Update occupation points when occupation changes
  useEffect(() => {
    if (selectedOccupation) {
      const occupation = OCCUPATIONS.find(occ => occ.name === selectedOccupation);
      if (occupation) {
        const points = calculateOccupationPoints(occupation.skillPointsFormula, characteristics);
        setAvailableOccupationPoints(points);
        
        if (!manualSkillMode) {
          // Auto-allocate skills
          autoAllocateSkills(occupation, points);
        }
      }
    }
  }, [selectedOccupation, characteristics, manualSkillMode]);
  
  // Calculate used points
  useEffect(() => {
    let occUsed = 0;
    let persUsed = 0;
    
    const occupation = OCCUPATIONS.find(occ => occ.name === selectedOccupation);
    const occupationSkills = occupation?.occupationSkills || [];
    
    Object.entries(allocatedPoints).forEach(([skill, points]) => {
      if (occupationSkills.includes(skill)) {
        occUsed += points;
      } else {
        persUsed += points;
      }
    });
    
    setUsedOccupationPoints(occUsed);
    setUsedPersonalPoints(persUsed);
  }, [allocatedPoints, selectedOccupation]);
  
  const autoAllocateSkills = (occupation: typeof OCCUPATIONS[0], totalPoints: number) => {
    const newAllocations: Record<string, number> = {};
    const baseSkills = { ...DEFAULT_SKILLS };
    baseSkills.dodge = Math.floor(characteristics.dexterity / 2);
    baseSkills.language_own = characteristics.education;
    
    // Get age from form
    const age = form.getValues('age') || 21;
    
    // Calculate age-based bonuses
    let ageBonus = 0;
    if (age >= 40 && age < 50) {
      ageBonus = 10; // Bonus experience points for mature characters
    } else if (age >= 50 && age < 60) {
      ageBonus = 20;
    } else if (age >= 60) {
      ageBonus = 30;
    }
    
    // Priority skills based on occupation (higher priority gets more points)
    const skillPriorities: Record<string, number> = {};
    occupation.occupationSkills.forEach((skill, index) => {
      // First 4 skills get higher priority
      skillPriorities[skill] = index < 4 ? 2 : 1;
    });
    
    // Calculate total priority weight
    const totalWeight = Object.values(skillPriorities).reduce((sum, weight) => sum + weight, 0);
    
    // Distribute occupation points based on priority
    const adjustedTotalPoints = totalPoints + ageBonus;
    occupation.occupationSkills.forEach((skill) => {
      const baseValue = baseSkills[skill] || 0;
      const weight = skillPriorities[skill];
      const points = Math.floor((adjustedTotalPoints * weight) / totalWeight);
      newAllocations[skill] = Math.min(points, 90 - baseValue); // Max 90% during creation
    });
    
    // Add personal interest points with age-based distribution
    const personalPoints = characteristics.intelligence * 2;
    const recommendedSkills = occupation.recommendedSkills || [];
    
    // Add some essential skills based on age and experience
    const essentialSkills = ['listen', 'spot_hidden', 'psychology'];
    if (age >= 30) {
      essentialSkills.push('credit_rating'); // Older characters have better credit
    }
    
    const allPersonalSkills = Array.from(new Set([...recommendedSkills, ...essentialSkills]));
    
    if (allPersonalSkills.length > 0) {
      // Distribute 60% to recommended, 40% to essential skills
      const recommendedPoints = Math.floor(personalPoints * 0.6);
      const essentialPoints = personalPoints - recommendedPoints;
      
      // Allocate to recommended skills
      if (recommendedSkills.length > 0) {
        const pointsPerRecommended = Math.floor(recommendedPoints / recommendedSkills.length);
        recommendedSkills.forEach(skill => {
          const currentAllocation = newAllocations[skill] || 0;
          const baseValue = baseSkills[skill] || 0;
          const maxAdditional = 90 - baseValue - currentAllocation;
          newAllocations[skill] = currentAllocation + Math.min(pointsPerRecommended, maxAdditional);
        });
      }
      
      // Allocate to essential skills
      const pointsPerEssential = Math.floor(essentialPoints / essentialSkills.length);
      essentialSkills.forEach(skill => {
        const currentAllocation = newAllocations[skill] || 0;
        const baseValue = baseSkills[skill] || 0;
        const maxAdditional = 90 - baseValue - currentAllocation;
        const additionalPoints = Math.min(pointsPerEssential, maxAdditional);
        if (additionalPoints > 0) {
          newAllocations[skill] = currentAllocation + additionalPoints;
        }
      });
    }
    
    setAllocatedPoints(newAllocations);
    updateSkillTotals(newAllocations);
  };
  
  const updateSkillTotals = (allocations: Record<string, number>) => {
    const baseSkills = { ...DEFAULT_SKILLS };
    baseSkills.dodge = Math.floor(characteristics.dexterity / 2);
    baseSkills.language_own = characteristics.education;
    
    const finalSkills = { ...baseSkills };
    Object.entries(allocations).forEach(([skill, points]) => {
      finalSkills[skill] = Math.min((baseSkills[skill] || 0) + points, 90);
    });
    
    setSkillPoints(finalSkills);
  };
  
  const handleSkillPointChange = (skill: string, value: number) => {
    const baseValue = DEFAULT_SKILLS[skill] || 0;
    const maxValue = 90 - baseValue;
    const clampedValue = Math.max(0, Math.min(value, maxValue));
    
    // Get occupation skills
    const occupation = OCCUPATIONS.find(occ => occ.name === selectedOccupation);
    const occupationSkills = occupation?.occupationSkills || [];
    const isOccupationSkill = occupationSkills.includes(skill);
    
    // Calculate what the new totals would be
    const newAllocations = { ...allocatedPoints };
    const oldValue = allocatedPoints[skill] || 0;
    const difference = clampedValue - oldValue;
    
    // Calculate current points used (excluding this skill)
    let occUsedWithoutThis = 0;
    let persUsedWithoutThis = 0;
    
    Object.entries(allocatedPoints).forEach(([s, points]) => {
      if (s !== skill) {
        if (occupationSkills.includes(s)) {
          occUsedWithoutThis += points;
        } else {
          persUsedWithoutThis += points;
        }
      }
    });
    
    // Check if we would exceed limits
    if (isOccupationSkill) {
      const newOccTotal = occUsedWithoutThis + clampedValue;
      if (newOccTotal > availableOccupationPoints) {
        // Limit to available points
        const maxAllowed = availableOccupationPoints - occUsedWithoutThis;
        if (maxAllowed <= 0) {
          toast({
            title: "Limite atteinte",
            description: `Vous avez utilisé tous vos points d'occupation (${availableOccupationPoints} points)`,
            variant: "destructive",
          });
          return;
        }
        const limitedValue = Math.min(clampedValue, maxAllowed);
        if (limitedValue === 0) {
          delete newAllocations[skill];
        } else {
          newAllocations[skill] = limitedValue;
        }
      } else {
        if (clampedValue === 0) {
          delete newAllocations[skill];
        } else {
          newAllocations[skill] = clampedValue;
        }
      }
    } else {
      // Personal interest skill
      const newPersTotal = persUsedWithoutThis + clampedValue;
      if (newPersTotal > availablePersonalPoints) {
        // Limit to available points
        const maxAllowed = availablePersonalPoints - persUsedWithoutThis;
        if (maxAllowed <= 0) {
          toast({
            title: "Limite atteinte",
            description: `Vous avez utilisé tous vos points d'intérêts personnels (${availablePersonalPoints} points)`,
            variant: "destructive",
          });
          return;
        }
        const limitedValue = Math.min(clampedValue, maxAllowed);
        if (limitedValue === 0) {
          delete newAllocations[skill];
        } else {
          newAllocations[skill] = limitedValue;
        }
      } else {
        if (clampedValue === 0) {
          delete newAllocations[skill];
        } else {
          newAllocations[skill] = clampedValue;
        }
      }
    }
    
    setAllocatedPoints(newAllocations);
    updateSkillTotals(newAllocations);
  };

  // Check if coming from a session join flow
  const sessionFromStorage = localStorage.getItem('createCharacterForSession');
  const sessionIdFromStorage = localStorage.getItem('currentSessionId');
  
  // Fetch available sessions only if authenticated
  const { data: sessions = [], isLoading: sessionsLoading } = useQuery<GameSession[]>({
    queryKey: ["/api/sessions"],
    retry: false,
    enabled: !sessionFromStorage && !sessionIdFromStorage, // Only fetch if not coming from join flow
  });

  const form = useForm<CharacterCreationForm>({
    resolver: zodResolver(characterCreationSchema),
    defaultValues: {
      name: "",
      occupation: "",
      age: 25,
      birthplace: "",
      residence: "",
      gender: "",
      sessionId: sessionFromStorage || sessionIdFromStorage || "", // Pre-fill if coming from join flow
      avatarDescription: "",
    },
  });

  const createCharacterMutation = useMutation({
    mutationFn: async (data: InsertCharacter) => {
      const response = await fetch("/api/characters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error("Failed to create character");
      return response.json();
    },
    onSuccess: (character) => {
      toast({
        title: "Personnage créé",
        description: `${character.name} a été créé avec succès.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/characters"] });
      
      // Clear session creation flag if it was set
      if (sessionFromStorage) {
        localStorage.removeItem('createCharacterForSession');
        localStorage.setItem('currentCharacterId', character.id);
        localStorage.setItem('currentCharacterName', character.name);
      }
      
      setLocation(`/character/${character.id}`);
    },
    onError: (error) => {
      console.error("Character creation error:", error);
      toast({
        title: "Erreur",
        description: "Impossible de créer le personnage.",
        variant: "destructive",
      });
    },
  });

  const generateAvatarMutation = useMutation({
    mutationFn: async ({ characterId, description, name, occupation, age }: { 
      characterId: string, 
      description: string, 
      name: string,
      occupation?: string,
      age?: number 
    }) => {
      const response = await fetch(`/api/characters/${characterId}/generate-avatar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          description, 
          characterName: name,
          occupation,
          age
        })
      });
      if (!response.ok) throw new Error("Failed to generate avatar");
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

  const buildDescription = () => {
    const parts = [];
    
    // Physical characteristics with proper formatting
    if (physicalTraits.height) {
      parts.push(`${physicalTraits.height}`);
    }
    if (physicalTraits.build) {
      parts.push(`${physicalTraits.build}`);
    }
    if (physicalTraits.hairColor) {
      parts.push(`avec des cheveux ${physicalTraits.hairColor}`);
    }
    if (physicalTraits.eyeColor) {
      parts.push(`et des yeux ${physicalTraits.eyeColor}`);
    }
    
    // Clothing style - important for 1920s atmosphere
    if (physicalTraits.style) {
      parts.push(`Habillé(e) en ${physicalTraits.style}`);
    }
    
    // Distinctive features that create character depth
    if (physicalTraits.distinctiveFeatures.length > 0) {
      const features = physicalTraits.distinctiveFeatures.join(", ").toLowerCase();
      parts.push(`Traits distinctifs: ${features}`);
    }
    
    // Add custom description if provided
    const customDescription = form.getValues("avatarDescription");
    if (customDescription) {
      parts.push(customDescription);
    }
    
    // Create a more natural description
    return parts.length > 0 ? parts.join(", ") + "." : "";
  };

  const handleGenerateAvatar = async () => {
    const description = buildDescription();
    const name = form.getValues("name");
    const occupation = form.getValues("occupation");
    const age = form.getValues("age");
    
    if (!description || !name) {
      toast({
        title: "Information manquante",
        description: "Veuillez remplir le nom et au moins quelques traits physiques avant de générer le portrait.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsGeneratingAvatar(true);
      
      // Generate avatar directly without needing a character ID
      const response = await fetch("/api/generate-avatar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          description, 
          characterName: name,
          occupation,
          age
        })
      });
      
      if (!response.ok) throw new Error("Failed to generate avatar");
      const result = await response.json();
      
      setAvatarUrl(result.avatarUrl);
      
      toast({
        title: "Portrait généré",
        description: "Le portrait de votre personnage a été créé avec succès.",
      });
      
    } catch (error) {
      console.error("Avatar generation error:", error);
      toast({
        title: "Erreur",
        description: "Impossible de générer le portrait. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingAvatar(false);
    }
  };

  const onSubmit = (data: CharacterCreationForm) => {
    const derivedStats = calculateDerivedStats(characteristics);
    const occupation = OCCUPATIONS.find(occ => occ.name === data.occupation);
    
    // If no sessionId provided or "none" selected, create a default one or get from available sessions
    let finalSessionId = data.sessionId;
    if (finalSessionId === "none") {
      finalSessionId = undefined;
    }
    if (!finalSessionId && sessions && sessions.length > 0) {
      finalSessionId = sessions[0].id; // Use first available session
    }
    if (!finalSessionId) {
      // Create a temporary session ID for character creation
      finalSessionId = `temp-${Date.now()}`;
    }
    
    const characterData: InsertCharacter = {
      name: data.name,
      occupation: data.occupation,
      age: typeof data.age === "number" ? data.age : 25,
      birthplace: data.birthplace || "",
      residence: data.residence || "",
      gender: data.gender || "",
      sessionId: finalSessionId,
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
      
      // Skills (use the final calculated skills)
      skills: skillPoints,
      
      avatarUrl: avatarUrl || undefined,
      avatarPrompt: buildDescription() || undefined,
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
                        <Select onValueChange={(value) => {
                          field.onChange(value);
                          setSelectedOccupation(value);
                        }} defaultValue={field.value}>
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
                            onChange={(e) => {
                              const value = e.target.value;
                              field.onChange(value === "" ? "" : parseInt(value) || 25);
                            }}
                            value={field.value || ""}
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

            {/* Skills Allocation - Always visible */}
            <Card className={`bg-charcoal parchment-bg ${
              selectedOccupation ? 'border-aged-gold' : 'border-2 border-blood-burgundy'
            }`}>
              <CardHeader>
                <CardTitle className="font-cinzel text-aged-gold flex justify-between items-center">
                  <span className="flex items-center gap-2">
                    Compétences
                    {!selectedOccupation && (
                      <Badge variant="outline" className="border-blood-burgundy text-blood-burgundy animate-pulse">
                        ⚠ Sélectionnez une occupation d'abord
                      </Badge>
                    )}
                  </span>
                  {selectedOccupation && (
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-source text-aged-parchment">
                        {manualSkillMode ? "Allocation Manuelle" : "Allocation Automatique"}
                      </span>
                      <Switch
                        checked={manualSkillMode}
                        onCheckedChange={(checked) => {
                          setManualSkillMode(checked);
                          if (!checked) {
                            // Auto-allocate when switching to automatic mode
                            const occupation = OCCUPATIONS.find(occ => occ.name === selectedOccupation);
                            if (occupation) {
                              const points = calculateOccupationPoints(occupation.skillPointsFormula, characteristics);
                              autoAllocateSkills(occupation, points);
                            }
                          }
                        }}
                        className="data-[state=checked]:bg-aged-gold"
                      />
                    </div>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {!selectedOccupation ? (
                  <div className="space-y-4">
                    <Alert className="bg-cosmic-void border-blood-burgundy">
                      <AlertCircle className="h-4 w-4 text-blood-burgundy" />
                      <AlertDescription className="text-aged-parchment">
                        <strong className="text-bone-white">Étape requise:</strong> Sélectionnez une occupation pour débloquer la répartition des compétences.
                        <br /><br />
                        <strong className="text-aged-gold">Points disponibles prévus:</strong>
                        <br />• Points d'occupation: Calculés selon votre profession
                        <br />• Points personnels: INT × 2 = {characteristics.intelligence * 2} points
                        {form.watch('age') && form.watch('age') >= 40 && (
                          <>
                            <br />• Bonus d'âge: +{form.watch('age') >= 60 ? 30 : form.watch('age') >= 50 ? 20 : 10} points (expérience)
                          </>
                        )}
                      </AlertDescription>
                    </Alert>
                  </div>
                ) : (
                  <>
                  {/* Points Available Display */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-cosmic-void rounded-lg p-4 border border-aged-gold">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-source text-aged-parchment">Points d'Occupation</span>
                        <span className={`text-sm font-bold ${
                          usedOccupationPoints > availableOccupationPoints ? 'text-red-600' :
                          usedOccupationPoints === availableOccupationPoints ? 'text-green-500' :
                          'text-aged-gold'
                        }`}>
                          {usedOccupationPoints} / {availableOccupationPoints}
                        </span>
                      </div>
                      <Progress 
                        value={(usedOccupationPoints / availableOccupationPoints) * 100} 
                        className="h-2 bg-deep-black"
                      />
                      <div className="mt-2 text-xs text-aged-parchment">
                        {OCCUPATIONS.find(occ => occ.name === selectedOccupation)?.skillPointsFormula}
                      </div>
                    </div>
                    
                    <div className="bg-cosmic-void rounded-lg p-4 border border-aged-gold">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-source text-aged-parchment">Points d'Intérêts Personnels</span>
                        <span className={`text-sm font-bold ${
                          usedPersonalPoints > availablePersonalPoints ? 'text-red-600' :
                          usedPersonalPoints === availablePersonalPoints ? 'text-green-500' :
                          'text-aged-gold'
                        }`}>
                          {usedPersonalPoints} / {availablePersonalPoints}
                        </span>
                      </div>
                      <Progress 
                        value={(usedPersonalPoints / availablePersonalPoints) * 100} 
                        className="h-2 bg-deep-black"
                      />
                      <div className="mt-2 text-xs text-aged-parchment">
                        INT × 2
                      </div>
                    </div>
                  </div>

                  {/* Skills Lock Warning */}
                  {manualSkillMode && (
                    <Alert className="bg-cosmic-void border-blood-burgundy">
                      <AlertCircle className="h-4 w-4 text-blood-burgundy" />
                      <AlertDescription className="text-aged-parchment">
                        <strong className="text-bone-white">Important:</strong> Une fois votre personnage créé, la répartition des points de compétences sera <strong>définitivement verrouillée</strong>. 
                        Assurez-vous de bien répartir vos points avant de sauvegarder.
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Occupation Skills Info */}
                  <Alert className="bg-cosmic-void border-aged-gold">
                    <Info className="h-4 w-4 text-aged-gold" />
                    <AlertDescription className="text-aged-parchment">
                      <strong className="text-bone-white">Compétences d'occupation:</strong> 
                      {' ' + (OCCUPATIONS.find(occ => occ.name === selectedOccupation)?.occupationSkills.map(skill => 
                        SKILL_TRANSLATIONS[skill] || skill.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
                      ).join(', ') || 'Aucune')}
                    </AlertDescription>
                  </Alert>

                  {/* Skills Grid */}
                  {manualSkillMode ? (
                    <div className="space-y-4">
                      <div className="space-y-2 mb-4">
                        <div className="text-sm text-aged-parchment">
                          Cliquez sur une compétence pour allouer des points. Maximum 90% par compétence.
                        </div>
                        <div className="flex gap-4 text-xs">
                          <div className="flex items-center gap-2">
                            <Badge className="bg-aged-gold text-deep-black">Occ</Badge>
                            <span className="text-aged-parchment">Compétences d'occupation uniquement</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 border border-aged-parchment/30 rounded"></div>
                            <span className="text-aged-parchment">Toutes les compétences (points personnels)</span>
                          </div>
                        </div>
                      </div>
                      <div className="grid md:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-2">
                        {Object.entries(DEFAULT_SKILLS).map(([skillKey, baseValue]) => {
                          const occupation = OCCUPATIONS.find(occ => occ.name === selectedOccupation);
                          const isOccupationSkill = occupation?.occupationSkills.includes(skillKey);
                          const allocated = allocatedPoints[skillKey] || 0;
                          const total = Math.min(baseValue + allocated, 90);
                          const skillName = SKILL_TRANSLATIONS[skillKey] || skillKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                          
                          return (
                            <div 
                              key={skillKey} 
                              className={`flex justify-between items-center p-2 rounded border ${
                                isOccupationSkill ? 'border-aged-gold bg-cosmic-void/50' : 'border-aged-parchment/30 bg-cosmic-void/30'
                              }`}
                            >
                              <div className="flex-1">
                                <div className="font-source text-sm text-bone-white">
                                  {skillName}
                                  {isOccupationSkill && (
                                    <Badge className="ml-2 bg-aged-gold text-deep-black text-xs">Occ</Badge>
                                  )}
                                </div>
                                <div className="text-xs text-aged-parchment">
                                  Base: {baseValue}% {allocated > 0 && `(+${allocated})`}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Input
                                  type="number"
                                  min="0"
                                  max={90 - baseValue}
                                  value={allocated}
                                  onChange={(e) => handleSkillPointChange(skillKey, parseInt(e.target.value) || 0)}
                                  className={`w-16 h-8 bg-deep-black text-bone-white text-center ${
                                    isOccupationSkill && usedOccupationPoints >= availableOccupationPoints && allocated === 0 ? 'border-red-600 opacity-50' :
                                    !isOccupationSkill && usedPersonalPoints >= availablePersonalPoints && allocated === 0 ? 'border-red-600 opacity-50' :
                                    'border-aged-gold'
                                  }`}
                                  disabled={
                                    (isOccupationSkill && usedOccupationPoints >= availableOccupationPoints && allocated === 0) ||
                                    (!isOccupationSkill && usedPersonalPoints >= availablePersonalPoints && allocated === 0)
                                  }
                                  data-testid={`skill-input-${skillKey}`}
                                />
                                <div className="text-sm font-bold text-aged-gold w-12 text-right">
                                  {total}%
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="text-sm text-aged-parchment mb-2">
                        Les compétences ont été automatiquement réparties selon votre occupation et vos intérêts.
                      </div>
                      <div className="grid md:grid-cols-3 gap-3 max-h-96 overflow-y-auto pr-2">
                        {Object.entries(skillPoints)
                          .filter(([_, value]) => value > DEFAULT_SKILLS[_] || allocatedPoints[_])
                          .sort(([, a], [, b]) => b - a)
                          .map(([skillKey, value]) => {
                            const skillName = SKILL_TRANSLATIONS[skillKey] || skillKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                            const baseValue = DEFAULT_SKILLS[skillKey] || 0;
                            const allocated = allocatedPoints[skillKey] || 0;
                            
                            return (
                              <div key={skillKey} className="bg-cosmic-void rounded p-2 border border-aged-gold/50">
                                <div className="font-source text-sm text-bone-white">
                                  {skillName}
                                </div>
                                <div className="text-xs text-aged-parchment">
                                  {value}% {allocated > 0 && `(Base: ${baseValue}% +${allocated})`}
                                </div>
                              </div>
                            );
                          })}
                      </div>
                      <div className="text-xs text-aged-parchment italic">
                        Passez en mode manuel pour ajuster individuellement chaque compétence.
                      </div>
                    </div>
                  )}
                </>
                )}
              </CardContent>
            </Card>

            {/* Session Selection */}
            {!sessionFromStorage && !sessionIdFromStorage && (
              <Card className="bg-charcoal border-aged-gold parchment-bg">
                <CardHeader>
                  <CardTitle className="font-cinzel text-aged-gold">
                    Session de Jeu
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="sessionId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-aged-parchment font-source">
                          Choisir une session (optionnel)
                        </FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger 
                              className="bg-cosmic-void border-aged-gold text-bone-white"
                              data-testid="select-session"
                            >
                              <SelectValue placeholder="Aucune session sélectionnée" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-cosmic-void border-aged-gold">
                            <SelectItem value="none">Aucune session</SelectItem>
                            {sessions?.map((session) => (
                              <SelectItem key={session.id} value={session.id}>
                                {session.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                        <FormDescription className="text-aged-parchment text-sm">
                          Vous pourrez rejoindre une session plus tard si vous n'en sélectionnez pas maintenant.
                        </FormDescription>
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            )}

            {/* Avatar Generation */}
            <Card className="bg-charcoal border-aged-gold parchment-bg">
              <CardHeader>
                <CardTitle className="font-cinzel text-aged-gold">
                  Portrait du Personnage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="selectors" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 bg-cosmic-void border-aged-gold">
                    <TabsTrigger value="selectors" className="text-bone-white data-[state=active]:bg-aged-gold data-[state=active]:text-deep-black">
                      Sélecteurs Intuitifs
                    </TabsTrigger>
                    <TabsTrigger value="description" className="text-bone-white data-[state=active]:bg-aged-gold data-[state=active]:text-deep-black">
                      Description Libre
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="selectors" className="space-y-6 mt-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        {/* Physical Traits */}
                        <div className="space-y-3">
                          <h4 className="font-cinzel text-aged-gold text-sm uppercase tracking-wide">
                            Caractéristiques Physiques
                          </h4>
                          
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label className="text-aged-parchment text-xs">Taille</Label>
                              <Select 
                                value={physicalTraits.height} 
                                onValueChange={(value) => setPhysicalTraits(prev => ({ ...prev, height: value }))}
                              >
                                <SelectTrigger className="bg-cosmic-void border-aged-gold text-bone-white h-9" data-testid="select-height">
                                  <SelectValue placeholder="Choisir" />
                                </SelectTrigger>
                                <SelectContent className="bg-cosmic-void border-aged-gold">
                                  <SelectItem value="très petit(e) (moins d'1m50)">Très petit(e)</SelectItem>
                                  <SelectItem value="petit(e) (1m50-1m60)">Petit(e)</SelectItem>
                                  <SelectItem value="de taille moyenne (1m60-1m70)">Moyen(ne)</SelectItem>
                                  <SelectItem value="grand(e) (1m70-1m80)">Grand(e)</SelectItem>
                                  <SelectItem value="très grand(e) (plus d'1m80)">Très grand(e)</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div>
                              <Label className="text-aged-parchment text-xs">Corpulence</Label>
                              <Select 
                                value={physicalTraits.build} 
                                onValueChange={(value) => setPhysicalTraits(prev => ({ ...prev, build: value }))}
                              >
                                <SelectTrigger className="bg-cosmic-void border-aged-gold text-bone-white h-9" data-testid="select-build">
                                  <SelectValue placeholder="Choisir" />
                                </SelectTrigger>
                                <SelectContent className="bg-cosmic-void border-aged-gold">
                                  <SelectItem value="très mince">Très mince</SelectItem>
                                  <SelectItem value="mince">Mince</SelectItem>
                                  <SelectItem value="de corpulence moyenne">Moyenne</SelectItem>
                                  <SelectItem value="corpulent(e)">Corpulent(e)</SelectItem>
                                  <SelectItem value="imposant(e)">Imposant(e)</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label className="text-aged-parchment text-xs">Cheveux</Label>
                              <Select 
                                value={physicalTraits.hairColor} 
                                onValueChange={(value) => setPhysicalTraits(prev => ({ ...prev, hairColor: value }))}
                              >
                                <SelectTrigger className="bg-cosmic-void border-aged-gold text-bone-white h-9" data-testid="select-hair-color">
                                  <SelectValue placeholder="Couleur" />
                                </SelectTrigger>
                                <SelectContent className="bg-cosmic-void border-aged-gold">
                                  <SelectItem value="noirs">Noirs</SelectItem>
                                  <SelectItem value="bruns foncés">Bruns foncés</SelectItem>
                                  <SelectItem value="châtains">Châtains</SelectItem>
                                  <SelectItem value="blonds">Blonds</SelectItem>
                                  <SelectItem value="roux">Roux</SelectItem>
                                  <SelectItem value="gris">Gris</SelectItem>
                                  <SelectItem value="blancs">Blancs</SelectItem>
                                  <SelectItem value="chauve">Chauve</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            
                            <div>
                              <Label className="text-aged-parchment text-xs">Yeux</Label>
                              <Select 
                                value={physicalTraits.eyeColor} 
                                onValueChange={(value) => setPhysicalTraits(prev => ({ ...prev, eyeColor: value }))}
                              >
                                <SelectTrigger className="bg-cosmic-void border-aged-gold text-bone-white h-9" data-testid="select-eye-color">
                                  <SelectValue placeholder="Couleur" />
                                </SelectTrigger>
                                <SelectContent className="bg-cosmic-void border-aged-gold">
                                  <SelectItem value="bruns">Bruns</SelectItem>
                                  <SelectItem value="bleus">Bleus</SelectItem>
                                  <SelectItem value="verts">Verts</SelectItem>
                                  <SelectItem value="noisette">Noisette</SelectItem>
                                  <SelectItem value="gris">Gris</SelectItem>
                                  <SelectItem value="noirs">Noirs</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                        </div>

                        {/* Style vestimentaire années 1920 */}
                        <div className="space-y-3">
                          <h4 className="font-cinzel text-aged-gold text-sm uppercase tracking-wide">
                            Style Vestimentaire (Années 1920)
                          </h4>
                          
                          <Select 
                            value={physicalTraits.style} 
                            onValueChange={(value) => setPhysicalTraits(prev => ({ ...prev, style: value }))}
                          >
                            <SelectTrigger className="bg-cosmic-void border-aged-gold text-bone-white" data-testid="select-style">
                              <SelectValue placeholder="Choisir un style d'époque" />
                            </SelectTrigger>
                            <SelectContent className="bg-cosmic-void border-aged-gold">
                              <SelectItem value="gentleman élégant en costume trois-pièces">Gentleman élégant</SelectItem>
                              <SelectItem value="flapper moderne avec robe courte">Flapper moderne</SelectItem>
                              <SelectItem value="bourgeois conservateur">Bourgeois conservateur</SelectItem>
                              <SelectItem value="universitaire en tweed">Universitaire</SelectItem>
                              <SelectItem value="ouvrier en vêtements pratiques">Ouvrier</SelectItem>
                              <SelectItem value="dandy sophistiqué">Dandy sophistiqué</SelectItem>
                              <SelectItem value="dame de la haute société">Dame de société</SelectItem>
                              <SelectItem value="bohème artistique">Bohème artistique</SelectItem>
                              <SelectItem value="aventurier en tenue de voyage">Aventurier</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Signes distinctifs */}
                        <div className="space-y-3">
                          <h4 className="font-cinzel text-aged-gold text-sm uppercase tracking-wide">
                            Signes Distinctifs
                          </h4>
                          
                          <div className="grid grid-cols-1 gap-2">
                            {[
                              'Cicatrice visible', 'Lunettes', 'Moustache', 'Barbe', 'Tatouage',
                              'Canne de marche', 'Bijoux voyants', 'Regard perçant', 
                              'Sourire énigmatique', 'Tic nerveux', 'Démarche particulière'
                            ].map((feature) => (
                              <div key={feature} className="flex items-center space-x-2">
                                <Checkbox
                                  id={feature}
                                  checked={physicalTraits.distinctiveFeatures.includes(feature)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setPhysicalTraits(prev => ({
                                        ...prev,
                                        distinctiveFeatures: [...prev.distinctiveFeatures, feature]
                                      }));
                                    } else {
                                      setPhysicalTraits(prev => ({
                                        ...prev,
                                        distinctiveFeatures: prev.distinctiveFeatures.filter(f => f !== feature)
                                      }));
                                    }
                                  }}
                                  className="border-aged-gold data-[state=checked]:bg-aged-gold"
                                  data-testid={`checkbox-${feature.toLowerCase().replace(/\s+/g, '-')}`}
                                />
                                <Label 
                                  htmlFor={feature} 
                                  className="text-aged-parchment text-sm cursor-pointer"
                                >
                                  {feature}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      {/* Portrait Preview */}
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

                    <Button
                      type="button"
                      onClick={handleGenerateAvatar}
                      disabled={isGeneratingAvatar}
                      className="w-full bg-eldritch-green hover:bg-green-800 text-bone-white"
                      data-testid="button-generate-avatar"
                    >
                      <Wand2 className="mr-2 h-4 w-4" />
                      {isGeneratingAvatar ? "Génération..." : "Générer le Portrait IA"}
                    </Button>
                  </TabsContent>

                  <TabsContent value="description" className="space-y-4 mt-6">
                    <FormField
                      control={form.control}
                      name="avatarDescription"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-aged-parchment font-source">
                            Description physique personnalisée
                          </FormLabel>
                          <FormControl>
                            <Textarea 
                              {...field}
                              className="bg-cosmic-void border-aged-gold text-bone-white h-32"
                              placeholder="Décrivez librement l'apparence de votre personnage (âge, couleur des cheveux, style vestimentaire années 1920...)"
                              data-testid="textarea-avatar-description"
                            />
                          </FormControl>
                          <FormMessage />
                          <FormDescription className="text-aged-parchment text-sm">
                            Cette description s'ajoutera aux sélecteurs choisis dans l'onglet précédent.
                          </FormDescription>
                        </FormItem>
                      )}
                    />
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Final Warning before saving */}
            <Alert className="bg-cosmic-void border-aged-gold">
              <Info className="h-4 w-4 text-aged-gold" />
              <AlertDescription className="text-aged-parchment">
                <strong className="text-bone-white">Rappel:</strong> Les compétences seront verrouillées après la création du personnage et ne pourront plus être modifiées.
              </AlertDescription>
            </Alert>

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
