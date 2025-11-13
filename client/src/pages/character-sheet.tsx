import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/navigation";
import DiceRoller from "@/components/dice-roller";
import RollHistoryVisual from "@/components/roll-history-visual";
import SanityTracker from "@/components/sanity-tracker";
import SkillPointsDistributor from "@/components/skill-points-distributor";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Edit3, Dice6, Heart, Brain, Shield, AlertTriangle, Skull, Activity, AlertCircle, RefreshCw, Wand2, BookOpen, Save, Package, Plus, Trash2, Sword, ShieldCheck, Image, Sparkles, Coins, Edit2 } from "lucide-react";
import { SKILL_TRANSLATIONS } from "@/lib/cthulhu-data";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Character, SanityCondition, ActiveEffect } from "@shared/schema";

interface InventoryItem {
  id: string;
  characterId: string;
  name: string;
  description?: string | null;
  category: string;
  quantity: number;
  weight: number;
  isEquipped: boolean;
  damage?: string | null;
  armor?: number | null;
  properties?: any;
}

interface CharacterWithDetails extends Character {
  sanityConditions: SanityCondition[];
  activeEffects: ActiveEffect[];
}

export default function CharacterSheet() {
  const params = useParams();
  const characterId = params.id;
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [rollHistory, setRollHistory] = useState<any[]>([]);
  const [isGeneratingAvatar, setIsGeneratingAvatar] = useState(false);
  const [notes, setNotes] = useState<string>("");
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [notesModified, setNotesModified] = useState(false);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [showAddItem, setShowAddItem] = useState(false);
  const [newItem, setNewItem] = useState({
    name: '',
    description: '',
    category: 'misc',
    quantity: 1,
    weight: 1,
    damage: '',
    armor: 0
  });
  const [isEditingMoney, setIsEditingMoney] = useState(false);
  const [moneyValue, setMoneyValue] = useState("0.00");
  
  // Avatar customization states
  const [showAvatarDialog, setShowAvatarDialog] = useState(false);
  const [avatarSettings, setAvatarSettings] = useState({
    gender: 'male',
    age: 'adult',
    hairColor: 'brown',
    eyeColor: 'brown',
    height: 'average',
    build: 'average',
    skinTone: 'fair',
    facialHair: 'none',
    distinctiveFeatures: '',
    clothing: 'formal'
  });

  // Players don't need to be authenticated to view their character sheet
  // They just need to have joined a session

  const { data: character, isLoading: characterLoading, error } = useQuery<CharacterWithDetails>({
    queryKey: ["/api/characters", characterId],
    retry: false,
  });
  
  // Fetch roll history for this character
  const { data: sessionRolls } = useQuery<any[]>({
    queryKey: ["/api/sessions", character?.sessionId, "rolls"],
    retry: false,
    enabled: !!character?.sessionId,
  });
  
  // Filter rolls for this specific character
  const characterRolls = sessionRolls?.filter(roll => roll.characterId === characterId) || [];
  
  // Fetch inventory
  const { data: inventoryData } = useQuery<InventoryItem[]>({
    queryKey: ["/api/characters", characterId, "inventory"],
    retry: false,
    enabled: !!characterId,
  });
  
  useEffect(() => {
    if (inventoryData) {
      setInventory(inventoryData);
    }
  }, [inventoryData]);
  
  // Initialize notes and money when character data is loaded
  useEffect(() => {
    if (character?.notes) {
      setNotes(character.notes);
    }
    if (character?.money) {
      setMoneyValue(character.money.toString());
    }
  }, [character?.notes, character?.money]);
  
  // Save notes function
  const saveNotes = async () => {
    if (!notesModified || !characterId) return;
    
    setIsSavingNotes(true);
    try {
      await apiRequest("PATCH", `/api/characters/${characterId}/notes`, { notes });
      setNotesModified(false);
      toast({
        title: "Notes sauvegardées",
        description: "Vos notes ont été enregistrées avec succès.",
      });
    } catch (error) {
      console.error("Error saving notes:", error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les notes.",
        variant: "destructive",
      });
    } finally {
      setIsSavingNotes(false);
    }
  };
  
  // Auto-save notes after 2 seconds of inactivity
  useEffect(() => {
    const timer = setTimeout(() => {
      if (notesModified) {
        saveNotes();
      }
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [notes, notesModified]);
  
  // Calculate inventory slots based on character level/strength
  const calculateMaxSlots = () => {
    if (!character) return 10;
    // Base slots + bonus from strength
    const baseSlots = 10;
    const strengthBonus = Math.floor((character.strength - 10) / 10);
    return Math.max(5, baseSlots + strengthBonus);
  };
  
  const totalWeight = inventory.reduce((sum, item) => sum + (item.weight * item.quantity), 0);
  const maxSlots = calculateMaxSlots();
  
  // Add item to inventory
  const handleAddItem = async () => {
    if (!newItem.name) return;
    
    try {
      const response = await apiRequest("POST", `/api/characters/${characterId}/inventory`, newItem);
      const item: InventoryItem = await response.json();
      setInventory([...inventory, item]);
      setNewItem({
        name: '',
        description: '',
        category: 'misc',
        quantity: 1,
        weight: 1,
        damage: '',
        armor: 0
      });
      setShowAddItem(false);
      toast({
        title: "Objet ajouté",
        description: `${newItem.name} a été ajouté à votre inventaire.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/characters", characterId, "inventory"] });
    } catch (error) {
      console.error("Error adding item:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter l'objet.",
        variant: "destructive",
      });
    }
  };
  
  // Toggle equipped status
  const handleToggleEquip = async (itemId: string, currentStatus: boolean) => {
    try {
      await apiRequest("PATCH", `/api/inventory/${itemId}/equip`, { isEquipped: !currentStatus });
      setInventory(inventory.map(item => 
        item.id === itemId ? { ...item, isEquipped: !currentStatus } : item
      ));
      queryClient.invalidateQueries({ queryKey: ["/api/characters", characterId, "inventory"] });
    } catch (error) {
      console.error("Error toggling equip:", error);
      toast({
        title: "Erreur",
        description: "Impossible de modifier l'équipement.",
        variant: "destructive",
      });
    }
  };
  
  // Delete item
  const handleDeleteItem = async (itemId: string) => {
    try {
      await apiRequest("DELETE", `/api/inventory/${itemId}`, {});
      setInventory(inventory.filter(item => item.id !== itemId));
      toast({
        title: "Objet supprimé",
        description: "L'objet a été retiré de votre inventaire.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/characters", characterId, "inventory"] });
    } catch (error) {
      console.error("Error deleting item:", error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'objet.",
        variant: "destructive",
      });
    }
  };

  const handleGenerateAvatar = async (useCustomSettings = false) => {
    setIsGeneratingAvatar(true);
    toast({
      title: "Génération en cours",
      description: "Création de votre portrait personnalisé...",
    });
    
    try {
      console.log("Starting avatar generation for character:", characterId);
      
      let body = {};
      if (useCustomSettings && character) {
        // Build description from custom settings
        const genderMap: Record<string, string> = { male: "homme", female: "femme", other: "personne" };
        const ageMap: Record<string, string> = { young: "jeune", adult: "adulte", middle: "d'âge mûr", elderly: "âgé" };
        const heightMap: Record<string, string> = { short: "petit", average: "taille moyenne", tall: "grand" };
        const buildMap: Record<string, string> = { slim: "mince", average: "corpulence moyenne", athletic: "athlétique", heavy: "corpulent" };
        const skinMap: Record<string, string> = { pale: "peau pâle", fair: "peau claire", medium: "peau mate", tan: "peau bronzée", dark: "peau foncée" };
        const hairMap: Record<string, string> = { black: "cheveux noirs", brown: "cheveux bruns", blonde: "cheveux blonds", red: "cheveux roux", gray: "cheveux gris", white: "cheveux blancs" };
        const eyeMap: Record<string, string> = { brown: "yeux marrons", blue: "yeux bleus", green: "yeux verts", gray: "yeux gris", hazel: "yeux noisette" };
        const clothingMap: Record<string, string> = { formal: "vêtements formels années 1920", casual: "vêtements décontractés", work: "vêtements de travail", military: "uniforme militaire", academic: "tenue académique" };
        
        let description = `Portrait années 1920, ${genderMap[avatarSettings.gender]}, ${ageMap[avatarSettings.age]}, `;
        description += `${heightMap[avatarSettings.height]}, ${buildMap[avatarSettings.build]}, `;
        description += `${skinMap[avatarSettings.skinTone]}, ${hairMap[avatarSettings.hairColor]}, ${eyeMap[avatarSettings.eyeColor]}, `;
        
        if (avatarSettings.facialHair !== 'none' && avatarSettings.gender === 'male') {
          const facialHairMap: Record<string, string> = { mustache: "moustache", beard: "barbe", goatee: "bouc", sideburns: "favoris" };
          description += `${facialHairMap[avatarSettings.facialHair]}, `;
        }
        
        description += `${clothingMap[avatarSettings.clothing]}`;
        
        if (avatarSettings.distinctiveFeatures) {
          description += `, ${avatarSettings.distinctiveFeatures}`;
        }
        
        description += `, ${character.occupation}, style portrait photographique d'époque, sépia`;
        
        body = { customDescription: description };
      }
      
      const response = await fetch(`/api/characters/${characterId}/generate-avatar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      
      console.log("Response status:", response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response:", errorText);
        throw new Error(errorText || `HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Avatar generation response:", data);
      
      if (data.avatarUrl) {
        toast({
          title: "Portrait généré",
          description: "Votre nouveau portrait a été créé avec succès.",
        });
        
        // Force refresh character data to show new avatar
        await queryClient.invalidateQueries({ queryKey: ["/api/characters", characterId] });
        await queryClient.refetchQueries({ queryKey: ["/api/characters", characterId] });
        
        if (useCustomSettings) {
          setShowAvatarDialog(false);
        }
      } else {
        throw new Error("Aucune URL de portrait reçue");
      }
      
    } catch (error: any) {
      console.error("Error generating avatar:", error);
      let errorMessage = "Impossible de générer le portrait.";
      
      if (error.message.includes("500") || error.message.includes("Failed")) {
        errorMessage = "Erreur lors de la génération. Veuillez réessayer dans quelques instants.";
      } else if (error.message.includes("401")) {
        errorMessage = "Erreur d'authentification. Veuillez rafraîchir la page.";
      }
      
      toast({
        title: "Erreur",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsGeneratingAvatar(false);
    }
  };

  if (characterLoading) {
    return (
      <div className="min-h-screen bg-deep-black flex items-center justify-center">
        <div className="text-aged-gold text-xl font-cinzel">Chargement...</div>
      </div>
    );
  }

  if (!character) {
    return (
      <div className="min-h-screen bg-deep-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-cinzel text-aged-gold mb-4">Personnage introuvable</h1>
          <Link href="/">
            <Button className="bg-blood-burgundy hover:bg-dark-crimson text-bone-white">
              Retour à l'accueil
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const characteristics = [
    { key: 'strength', label: 'Force (FOR)', value: character.strength },
    { key: 'constitution', label: 'Constitution (CON)', value: character.constitution },
    { key: 'size', label: 'Taille (TAI)', value: character.size },
    { key: 'dexterity', label: 'Dextérité (DEX)', value: character.dexterity },
    { key: 'appearance', label: 'Apparence (APP)', value: character.appearance },
    { key: 'intelligence', label: 'Intelligence (INT)', value: character.intelligence },
    { key: 'power', label: 'Pouvoir (POU)', value: character.power },
    { key: 'education', label: 'Éducation (EDU)', value: character.education },
  ];

  const skills = character.skills as Record<string, number> || {};
  
  // Calculate conditional statuses based on HP and Sanity
  const calculateConditionalStatuses = () => {
    const statuses = [];
    const hpPercentage = character.hitPoints / character.maxHitPoints;
    const sanityPercentage = character.sanity / character.maxSanity;
    
    // HP-based statuses
    if (character.hitPoints <= 0) {
      statuses.push({
        name: "Mort",
        description: "Le personnage est décédé",
        severity: "critical",
        icon: Skull,
        color: "text-black"
      });
    } else if (character.hitPoints <= 2) {
      statuses.push({
        name: "Mourant",
        description: "Inconscient et en train de mourir - Soins urgents requis!",
        severity: "critical",
        icon: Activity,
        color: "text-red-600"
      });
    } else if (hpPercentage < 0.5) {
      statuses.push({
        name: "Blessure Grave",
        description: "Malus de -20% à tous les jets de compétence",
        severity: "severe",
        icon: AlertTriangle,
        color: "text-orange-500"
      });
    } else if (hpPercentage < 0.75) {
      statuses.push({
        name: "Blessure Légère",
        description: "Malus de -10% à tous les jets de compétence",
        severity: "moderate",
        icon: AlertCircle,
        color: "text-yellow-500"
      });
    }
    
    // Sanity-based statuses
    if (character.sanity <= 0) {
      statuses.push({
        name: "Folie Permanente",
        description: "L'esprit est définitivement brisé",
        severity: "critical",
        icon: Brain,
        color: "text-purple-900"
      });
    } else if (sanityPercentage < 0.2) {
      statuses.push({
        name: "Folie Majeure",
        description: "État mental extrêmement fragile - Malus de -30% aux jets sociaux",
        severity: "severe",
        icon: Brain,
        color: "text-purple-600"
      });
    } else if (sanityPercentage < 0.5) {
      statuses.push({
        name: "Instabilité Mentale",
        description: "Nervosité et paranoïa - Malus de -15% aux jets de Psychologie et Persuasion",
        severity: "moderate",
        icon: Brain,
        color: "text-purple-400"
      });
    }
    
    // Combined status
    if (hpPercentage < 0.3 && sanityPercentage < 0.3) {
      statuses.push({
        name: "État Critique",
        description: "Corps et esprit au bord de l'effondrement - Malus de -40% à tous les jets",
        severity: "critical",
        icon: Skull,
        color: "text-red-900"
      });
    }
    
    return statuses;
  };
  
  const conditionalStatuses = calculateConditionalStatuses();

  return (
    <div className="min-h-screen bg-deep-black text-bone-white">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/">
            <Button 
              variant="outline" 
              className="border-aged-gold text-bone-white hover:bg-dark-stone"
              data-testid="button-back-home"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Retour
            </Button>
          </Link>
          <h1 className="font-cinzel text-3xl font-bold text-aged-gold">
            Fiche de {character.name}
          </h1>
        </div>

        {/* Character Portrait & Basic Info */}
        <Card className="bg-charcoal border-aged-gold parchment-bg mb-8">
          <CardContent className="p-6">
            <div className="grid md:grid-cols-4 gap-6">
              {/* Portrait */}
              <div className="flex flex-col items-center gap-2">
                <div className="flex justify-center">
                  {character.avatarUrl ? (
                    <img 
                      src={character.avatarUrl} 
                      alt={`Portrait de ${character.name}`}
                      className="w-48 h-48 rounded-lg border-2 border-aged-gold object-cover"
                      data-testid="img-character-portrait"
                    />
                  ) : (
                    <div className="w-48 h-48 bg-cosmic-void border-2 border-aged-gold rounded-lg flex items-center justify-center">
                      <span className="text-aged-parchment text-center">
                        Aucun portrait
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setShowAvatarDialog(true)}
                    className="bg-aged-gold hover:bg-aged-gold/80 text-deep-black"
                    size="sm"
                    data-testid="button-customize-avatar"
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    Personnaliser
                  </Button>
                  <Button
                    onClick={() => handleGenerateAvatar()}
                    disabled={isGeneratingAvatar}
                    className="bg-eldritch-green hover:bg-green-800 text-bone-white"
                    size="sm"
                    data-testid="button-regenerate-avatar"
                  >
                    <RefreshCw className={`h-4 w-4 ${isGeneratingAvatar ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </div>

              {/* Basic Info */}
              <div className="md:col-span-3 space-y-4">
                <div>
                  <h2 className="font-cinzel text-2xl text-aged-gold mb-2">
                    {character.name}
                  </h2>
                  <p className="text-lg text-bone-white font-source">
                    {character.occupation}
                  </p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-aged-parchment">Âge:</span>
                    <span className="text-bone-white ml-2" data-testid="text-character-age">
                      {character.age} ans
                    </span>
                  </div>
                  <div>
                    <span className="text-aged-parchment">Naissance:</span>
                    <span className="text-bone-white ml-2" data-testid="text-character-birthplace">
                      {character.birthplace || "Non spécifié"}
                    </span>
                  </div>
                  <div>
                    <span className="text-aged-parchment">Résidence:</span>
                    <span className="text-bone-white ml-2" data-testid="text-character-residence">
                      {character.residence || "Non spécifié"}
                    </span>
                  </div>
                  <div>
                    <span className="text-aged-parchment">Genre:</span>
                    <span className="text-bone-white ml-2" data-testid="text-character-gender">
                      {character.gender || "Non spécifié"}
                    </span>
                  </div>
                </div>

                {/* Vital Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className={`text-center bg-cosmic-void rounded-lg p-3 border-2 ${
                    character.hitPoints <= 2 ? 'border-red-600 animate-pulse' : 
                    character.hitPoints / character.maxHitPoints < 0.5 ? 'border-orange-500' :
                    character.hitPoints / character.maxHitPoints < 0.75 ? 'border-yellow-500' :
                    'border-transparent'
                  }`}>
                    <div className="text-lg font-bold text-bone-white" data-testid="text-hit-points">
                      {character.hitPoints}/{character.maxHitPoints}
                    </div>
                    <div className="text-xs text-aged-parchment">Points de Vie</div>
                  </div>
                  <div className={`text-center bg-cosmic-void rounded-lg p-3 border-2 ${
                    character.sanity <= 0 ? 'border-purple-900 animate-pulse' :
                    character.sanity / character.maxSanity < 0.2 ? 'border-purple-600' :
                    character.sanity / character.maxSanity < 0.5 ? 'border-purple-400' :
                    'border-transparent'
                  }`}>
                    <div className="text-lg font-bold text-bone-white" data-testid="text-sanity-points">
                      {character.sanity}/{character.maxSanity}
                    </div>
                    <div className="text-xs text-aged-parchment">Sanité Mentale</div>
                  </div>
                  <div className="text-center bg-cosmic-void rounded-lg p-3">
                    <div className="text-lg font-bold text-bone-white" data-testid="text-magic-points">
                      {character.magicPoints}/{character.maxMagicPoints}
                    </div>
                    <div className="text-xs text-aged-parchment">Points de Magie</div>
                  </div>
                  <div className="text-center bg-cosmic-void rounded-lg p-3 relative">
                    {isEditingMoney ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          step="0.01"
                          value={moneyValue}
                          onChange={(e) => setMoneyValue(e.target.value)}
                          className="w-20 px-1 py-0 text-center bg-deep-black border border-aged-gold rounded text-bone-white text-lg font-bold"
                          data-testid="input-money"
                        />
                        <button
                          onClick={async () => {
                            try {
                              await apiRequest("PATCH", `/api/characters/${characterId}`, { money: parseFloat(moneyValue) });
                              queryClient.invalidateQueries({ queryKey: ["/api/characters", characterId] });
                              setIsEditingMoney(false);
                              toast({
                                title: "Argent mis à jour",
                                description: "L'argent du personnage a été modifié.",
                              });
                            } catch (error) {
                              console.error("Error updating money:", error);
                              toast({
                                title: "Erreur",
                                description: "Impossible de mettre à jour l'argent.",
                                variant: "destructive",
                              });
                            }
                          }}
                          className="p-1 hover:bg-aged-gold/20 rounded"
                          data-testid="button-save-money"
                        >
                          <Save className="h-4 w-4 text-eldritch-green" />
                        </button>
                      </div>
                    ) : (
                      <div 
                        className="group cursor-pointer"
                        onClick={() => setIsEditingMoney(true)}
                      >
                        <div className="text-lg font-bold text-bone-white flex items-center justify-center gap-1" data-testid="text-money">
                          ${character.money || '0.00'}
                          <Edit2 className="h-3 w-3 text-aged-gold opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    )}
                    <div className="text-xs text-aged-parchment">Argent</div>
                  </div>
                </div>
                
                {/* Conditional Status Indicators */}
                {conditionalStatuses.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <div className="text-sm font-cinzel text-aged-gold mb-2">État Actuel</div>
                    {conditionalStatuses.map((status, index) => {
                      const Icon = status.icon;
                      return (
                        <div 
                          key={index} 
                          className={`flex items-start gap-2 p-2 rounded bg-deep-black border ${
                            status.severity === 'critical' ? 'border-red-600' :
                            status.severity === 'severe' ? 'border-orange-500' :
                            'border-yellow-500'
                          }`}
                        >
                          <Icon className={`h-5 w-5 mt-0.5 ${status.color}`} />
                          <div className="flex-1">
                            <div className={`font-source font-semibold ${status.color}`}>
                              {status.name}
                            </div>
                            <div className="text-xs text-aged-parchment mt-1">
                              {status.description}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Characteristics & Skills */}
          <div className="lg:col-span-2 space-y-8">
            {/* Characteristics */}
            <Card className="bg-charcoal border-aged-gold parchment-bg">
              <CardHeader>
                <CardTitle className="font-cinzel text-aged-gold">
                  Caractéristiques
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {characteristics.map((char) => (
                    <div key={char.key} className="flex justify-between items-center">
                      <span className="font-source">{char.label}</span>
                      <div className="flex space-x-2 text-sm">
                        <span className="w-8 text-center text-bone-white" data-testid={`stat-${char.key}`}>
                          {char.value}
                        </span>
                        <span className="w-8 text-center text-aged-parchment">
                          ({Math.floor(char.value / 2)})
                        </span>
                        <span className="w-8 text-center text-aged-parchment">
                          ({Math.floor(char.value / 5)})
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-aged-gold">
                  <div className="text-xs text-aged-parchment text-center">
                    Valeur / (Moitié) / (Un cinquième)
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Skill Points Distribution */}
            {character.availableSkillPoints && character.availableSkillPoints > 0 && (
              <SkillPointsDistributor
                character={character}
                onDistributePoints={async (skillUpdates) => {
                  try {
                    const response = await apiRequest("POST", `/api/characters/${characterId}/distribute-points`, {
                      skillUpdates
                    });
                    
                    toast({
                      title: "Points distribués avec succès",
                      description: "Vos compétences ont été améliorées.",
                      className: "bg-eldritch-green/20 border-eldritch-green"
                    });
                    
                    // Refresh character data
                    queryClient.invalidateQueries({ queryKey: ["/api/characters", characterId] });
                  } catch (error) {
                    console.error("Error distributing points:", error);
                    toast({
                      title: "Erreur",
                      description: "Impossible de distribuer les points.",
                      variant: "destructive"
                    });
                  }
                }}
              />
            )}

            {/* Skills */}
            <Card className="bg-charcoal border-aged-gold parchment-bg">
              <CardHeader>
                <CardTitle className="font-cinzel text-aged-gold flex justify-between items-center">
                  <span>Compétences</span>
                  {character.skillsLocked && (
                    <Badge variant="outline" className="border-aged-gold text-aged-gold">
                      <Shield className="h-3 w-3 mr-1" />
                      Verrouillées
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  {Object.entries(skills)
                    .sort(([keyA], [keyB]) => {
                      const nameA = SKILL_TRANSLATIONS[keyA] || keyA.charAt(0).toUpperCase() + keyA.slice(1).replace(/_/g, ' ');
                      const nameB = SKILL_TRANSLATIONS[keyB] || keyB.charAt(0).toUpperCase() + keyB.slice(1).replace(/_/g, ' ');
                      return nameA.localeCompare(nameB, 'fr');
                    })
                    .map(([skillName, skillValue]) => (
                    <div key={skillName} className="flex justify-between items-center">
                      <span className="font-source text-aged-parchment">
                        {SKILL_TRANSLATIONS[skillName] || skillName.charAt(0).toUpperCase() + skillName.slice(1).replace(/_/g, ' ')}
                      </span>
                      <span className="text-bone-white font-bold" data-testid={`skill-${skillName}`}>
                        {skillValue}%
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Dice Roller & Sanity */}
          <div className="space-y-6">
            <DiceRoller character={character} />
            <SanityTracker character={character} />

            {/* Active Effects */}
            {(character.sanityConditions.length > 0 || character.activeEffects.length > 0) && (
              <Card className="bg-charcoal border-aged-gold parchment-bg">
                <CardHeader>
                  <CardTitle className="font-cinzel text-aged-gold">
                    Effets Actifs
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {character.sanityConditions.map((condition) => (
                    <div key={condition.id} className="bg-cosmic-void border border-aged-gold rounded p-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-source text-bone-white font-semibold">
                            {condition.type === 'phobia' ? 'Phobie: ' : 'Manie: '}
                            {condition.name}
                          </h4>
                          {condition.description && (
                            <p className="text-aged-parchment text-sm mt-1">
                              {condition.description}
                            </p>
                          )}
                        </div>
                        <span className="text-xs text-aged-gold">
                          {condition.duration}
                        </span>
                      </div>
                    </div>
                  ))}

                  {character.activeEffects.map((effect) => {
                    const isBlessing = effect.name?.includes('Bénédiction');
                    const isCurse = effect.name?.includes('Malédiction');
                    const borderColor = isBlessing ? 'border-eldritch-green' : isCurse ? 'border-blood-burgundy' : 'border-aged-gold';
                    const bgColor = isBlessing ? 'bg-eldritch-green/10' : isCurse ? 'bg-blood-burgundy/10' : 'bg-cosmic-void';
                    
                    return (
                      <div key={effect.id} className={`${bgColor} border ${borderColor} rounded p-3`}>
                        <div className="flex justify-between items-start">
                          <div className="flex items-start gap-2">
                            {isBlessing && <Wand2 className="h-5 w-5 text-eldritch-green mt-0.5" />}
                            {isCurse && <AlertTriangle className="h-5 w-5 text-blood-burgundy mt-0.5" />}
                            <div>
                              <h4 className="font-source text-bone-white font-semibold">
                                {effect.name}
                              </h4>
                              {effect.description && (
                                <p className="text-aged-parchment text-sm mt-1">
                                  {effect.description}
                                </p>
                              )}
                            </div>
                          </div>
                          <span className="text-xs text-aged-gold">
                            {effect.type}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
        
        {/* Roll History & Effects History */}
        <div className="mt-8 space-y-6">
          <Card className="bg-charcoal border-aged-gold parchment-bg">
            <CardHeader>
              <CardTitle className="font-cinzel text-aged-gold">
                Historique des Lancés et Effets
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Recent Rolls */}
              {characterRolls && characterRolls.length > 0 && (
                <div>
                  <h3 className="font-source text-bone-white font-semibold mb-3">Lancés Récents</h3>
                  <div className="space-y-2">
                    {characterRolls.slice(0, 10).map((roll: any) => (
                      <div key={roll.id} className="bg-cosmic-void border border-aged-gold rounded p-2 flex justify-between items-center">
                        <div>
                          <span className="text-bone-white font-source">
                            {roll.skillName ? SKILL_TRANSLATIONS[roll.skillName] || roll.skillName : roll.rollType}
                          </span>
                          {roll.outcome && (
                            <span className={`ml-2 text-sm ${roll.outcome.includes('success') ? 'text-green-400' : 'text-red-400'}`}>
                              ({roll.outcome === 'extreme_success' ? 'Succès Extrême' : 
                                roll.outcome === 'hard_success' ? 'Succès Difficile' :
                                roll.outcome === 'success' ? 'Succès' : 'Échec'})
                            </span>
                          )}
                        </div>
                        <div className="text-right">
                          <span className="text-aged-gold font-bold">{roll.result}</span>
                          {roll.skillValue && (
                            <span className="text-aged-parchment text-sm ml-2">/ {roll.skillValue}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Effects History */}
              {character.activeEffects.length > 0 && (
                <div>
                  <h3 className="font-source text-bone-white font-semibold mb-3">Effets Appliqués</h3>
                  <div className="space-y-2">
                    {character.activeEffects.map((effect) => (
                      <div key={effect.id} className="bg-cosmic-void border border-aged-gold rounded p-2">
                        <div className="flex items-center gap-2">
                          {effect.type === 'damage' && <Heart className="h-4 w-4 text-red-500" />}
                          {effect.type === 'sanity_loss' && <Brain className="h-4 w-4 text-purple-500" />}
                          {effect.type === 'buff' && (
                            effect.name?.includes('Bénédiction') ? <Wand2 className="h-4 w-4 text-eldritch-green" /> : <Shield className="h-4 w-4 text-green-500" />
                          )}
                          {effect.type === 'debuff' && (
                            effect.name?.includes('Malédiction') ? <AlertTriangle className="h-4 w-4 text-blood-burgundy" /> : <Shield className="h-4 w-4 text-red-500" />
                          )}
                          <span className="text-bone-white font-source">{effect.name}</span>
                          {effect.value && (
                            <span className="text-aged-gold ml-auto">
                              {effect.type === 'damage' ? `-${effect.value} PV` : 
                               effect.type === 'sanity_loss' ? `-${effect.value} SAN` : 
                               effect.value}
                            </span>
                          )}
                        </div>
                        {effect.description && (
                          <p className="text-aged-parchment text-sm mt-1">{effect.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {(!characterRolls || characterRolls.length === 0) && character.activeEffects.length === 0 && (
                <p className="text-aged-parchment text-center">Aucun historique disponible</p>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Personal Notes Section */}
        <div className="mt-8">
          <Card className="bg-charcoal border-aged-gold parchment-bg">
            <CardHeader>
              <CardTitle className="font-cinzel text-aged-gold flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Notes Personnelles
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="relative">
                  <textarea
                    value={notes}
                    onChange={(e) => {
                      setNotes(e.target.value);
                      setNotesModified(true);
                    }}
                    placeholder="Écrivez vos notes ici... Indices, mystères, objectifs, rencontres importantes..."
                    className="w-full min-h-[200px] p-4 bg-cosmic-void border border-aged-gold rounded-lg text-bone-white placeholder-aged-parchment/50 resize-y focus:outline-none focus:border-aged-gold/70"
                    data-testid="textarea-character-notes"
                  />
                  {notesModified && (
                    <div className="absolute top-2 right-2">
                      <Button
                        size="sm"
                        onClick={saveNotes}
                        disabled={isSavingNotes}
                        className="bg-eldritch-green hover:bg-green-800 text-bone-white"
                        data-testid="button-save-notes"
                      >
                        {isSavingNotes ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                        <span className="ml-2">Sauvegarder</span>
                      </Button>
                    </div>
                  )}
                </div>
                <p className="text-aged-parchment text-sm">
                  Ces notes sont privées et ne sont visibles que par vous et le Maître de Jeu.
                  Sauvegarde automatique après 2 secondes d'inactivité.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Inventory Section */}
        <div className="mt-8">
          <Card className="bg-charcoal border-aged-gold parchment-bg">
            <CardHeader>
              <CardTitle className="font-cinzel text-aged-gold flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Inventaire
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm font-source text-aged-parchment">
                    Poids: {totalWeight}/{maxSlots} slots
                  </span>
                  <Button
                    size="sm"
                    onClick={() => setShowAddItem(!showAddItem)}
                    className="bg-eldritch-green hover:bg-green-800 text-bone-white"
                    data-testid="button-add-item"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Add Item Form */}
              {showAddItem && (
                <div className="mb-6 p-4 bg-cosmic-void border border-aged-gold rounded-lg space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      placeholder="Nom de l'objet"
                      value={newItem.name}
                      onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                      className="bg-deep-black border-aged-gold text-bone-white"
                      data-testid="input-item-name"
                    />
                    <select
                      value={newItem.category}
                      onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                      className="bg-deep-black border border-aged-gold text-bone-white rounded px-3 py-2"
                      data-testid="select-item-category"
                    >
                      <option value="weapon">Arme</option>
                      <option value="armor">Armure</option>
                      <option value="tool">Outil</option>
                      <option value="book">Livre</option>
                      <option value="misc">Divers</option>
                    </select>
                  </div>
                  <Input
                    placeholder="Description (optionnel)"
                    value={newItem.description}
                    onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                    className="bg-deep-black border-aged-gold text-bone-white"
                    data-testid="input-item-description"
                  />
                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <label className="text-xs text-aged-parchment">Quantité</label>
                      <Input
                        type="number"
                        min="1"
                        value={newItem.quantity}
                        onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 1 })}
                        className="bg-deep-black border-aged-gold text-bone-white"
                        data-testid="input-item-quantity"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-aged-parchment">Poids</label>
                      <Input
                        type="number"
                        min="0"
                        value={newItem.weight}
                        onChange={(e) => setNewItem({ ...newItem, weight: parseInt(e.target.value) || 0 })}
                        className="bg-deep-black border-aged-gold text-bone-white"
                        data-testid="input-item-weight"
                      />
                    </div>
                    {newItem.category === 'weapon' && (
                      <div>
                        <label className="text-xs text-aged-parchment">Dégâts</label>
                        <Input
                          placeholder="1d6+2"
                          value={newItem.damage}
                          onChange={(e) => setNewItem({ ...newItem, damage: e.target.value })}
                          className="bg-deep-black border-aged-gold text-bone-white"
                          data-testid="input-item-damage"
                        />
                      </div>
                    )}
                    {newItem.category === 'armor' && (
                      <div>
                        <label className="text-xs text-aged-parchment">Armure</label>
                        <Input
                          type="number"
                          min="0"
                          value={newItem.armor}
                          onChange={(e) => setNewItem({ ...newItem, armor: parseInt(e.target.value) || 0 })}
                          className="bg-deep-black border-aged-gold text-bone-white"
                          data-testid="input-item-armor"
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowAddItem(false)}
                      className="border-aged-gold text-aged-gold hover:bg-aged-gold hover:text-deep-black"
                    >
                      Annuler
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleAddItem}
                      className="bg-eldritch-green hover:bg-green-800 text-bone-white"
                      data-testid="button-save-item"
                    >
                      Ajouter
                    </Button>
                  </div>
                </div>
              )}
              
              {/* Equipped Items */}
              <div className="mb-6">
                <h3 className="font-source text-bone-white font-semibold mb-3 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" />
                  Équipé
                </h3>
                <div className="space-y-2">
                  {inventory.filter(item => item.isEquipped).map((item) => (
                    <div key={item.id} className="bg-cosmic-void border border-aged-gold rounded p-3 flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          {item.category === 'weapon' && <Sword className="h-4 w-4 text-aged-gold" />}
                          {item.category === 'armor' && <Shield className="h-4 w-4 text-aged-gold" />}
                          <span className="text-bone-white font-semibold">{item.name}</span>
                          {item.quantity > 1 && <Badge variant="outline" className="text-xs">x{item.quantity}</Badge>}
                        </div>
                        {item.description && (
                          <p className="text-aged-parchment text-sm mt-1">{item.description}</p>
                        )}
                        <div className="flex gap-4 mt-1 text-xs text-aged-parchment">
                          <span>Poids: {item.weight * item.quantity}</span>
                          {item.damage && <span>Dégâts: {item.damage}</span>}
                          {item.armor && <span>Armure: +{item.armor}</span>}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleToggleEquip(item.id, item.isEquipped)}
                          className="border-aged-gold text-aged-gold hover:bg-aged-gold hover:text-deep-black"
                          data-testid={`button-unequip-${item.id}`}
                        >
                          Déséquiper
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteItem(item.id)}
                          className="text-red-500 hover:bg-red-500/20"
                          data-testid={`button-delete-${item.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {inventory.filter(item => item.isEquipped).length === 0 && (
                    <p className="text-aged-parchment text-center">Aucun objet équipé</p>
                  )}
                </div>
              </div>
              
              {/* Backpack Items */}
              <div>
                <h3 className="font-source text-bone-white font-semibold mb-3 flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Sac à dos
                </h3>
                <div className="space-y-2">
                  {inventory.filter(item => !item.isEquipped).map((item) => (
                    <div key={item.id} className="bg-cosmic-void/50 border border-aged-gold/50 rounded p-3 flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          {item.category === 'weapon' && <Sword className="h-4 w-4 text-aged-parchment" />}
                          {item.category === 'armor' && <Shield className="h-4 w-4 text-aged-parchment" />}
                          <span className="text-bone-white">{item.name}</span>
                          {item.quantity > 1 && <Badge variant="outline" className="text-xs">x{item.quantity}</Badge>}
                        </div>
                        {item.description && (
                          <p className="text-aged-parchment text-sm mt-1">{item.description}</p>
                        )}
                        <div className="flex gap-4 mt-1 text-xs text-aged-parchment">
                          <span>Poids: {item.weight * item.quantity}</span>
                          {item.damage && <span>Dégâts: {item.damage}</span>}
                          {item.armor && <span>Armure: +{item.armor}</span>}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {(item.category === 'weapon' || item.category === 'armor') && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleToggleEquip(item.id, item.isEquipped)}
                            className="border-aged-gold text-aged-gold hover:bg-aged-gold hover:text-deep-black"
                            data-testid={`button-equip-${item.id}`}
                          >
                            Équiper
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteItem(item.id)}
                          className="text-red-500 hover:bg-red-500/20"
                          data-testid={`button-delete-${item.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {inventory.filter(item => !item.isEquipped).length === 0 && (
                    <p className="text-aged-parchment text-center">Votre sac est vide</p>
                  )}
                </div>
              </div>
              
              {/* Weight Warning */}
              {totalWeight > maxSlots && (
                <div className="mt-4 p-3 bg-blood-burgundy/20 border border-blood-burgundy rounded">
                  <p className="text-bone-white text-sm flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Vous êtes surchargé ! Votre capacité de mouvement est réduite.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Avatar Customization Dialog */}
        <Dialog open={showAvatarDialog} onOpenChange={setShowAvatarDialog}>
          <DialogContent className="bg-charcoal border-aged-gold max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-cinzel text-aged-gold flex items-center gap-2">
                <Image className="h-5 w-5" />
                Personnaliser le portrait
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-aged-parchment">Genre</label>
                  <Select value={avatarSettings.gender} onValueChange={(value) => setAvatarSettings({...avatarSettings, gender: value})}>
                    <SelectTrigger className="bg-cosmic-void border-aged-gold text-bone-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-charcoal border-aged-gold">
                      <SelectItem value="male">Homme</SelectItem>
                      <SelectItem value="female">Femme</SelectItem>
                      <SelectItem value="other">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm text-aged-parchment">Âge</label>
                  <Select value={avatarSettings.age} onValueChange={(value) => setAvatarSettings({...avatarSettings, age: value})}>
                    <SelectTrigger className="bg-cosmic-void border-aged-gold text-bone-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-charcoal border-aged-gold">
                      <SelectItem value="young">Jeune (18-25)</SelectItem>
                      <SelectItem value="adult">Adulte (26-40)</SelectItem>
                      <SelectItem value="middle">Âge mûr (41-60)</SelectItem>
                      <SelectItem value="elderly">Âgé (60+)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm text-aged-parchment">Couleur des cheveux</label>
                  <Select value={avatarSettings.hairColor} onValueChange={(value) => setAvatarSettings({...avatarSettings, hairColor: value})}>
                    <SelectTrigger className="bg-cosmic-void border-aged-gold text-bone-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-charcoal border-aged-gold">
                      <SelectItem value="black">Noir</SelectItem>
                      <SelectItem value="brown">Brun</SelectItem>
                      <SelectItem value="blonde">Blond</SelectItem>
                      <SelectItem value="red">Roux</SelectItem>
                      <SelectItem value="gray">Gris</SelectItem>
                      <SelectItem value="white">Blanc</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm text-aged-parchment">Couleur des yeux</label>
                  <Select value={avatarSettings.eyeColor} onValueChange={(value) => setAvatarSettings({...avatarSettings, eyeColor: value})}>
                    <SelectTrigger className="bg-cosmic-void border-aged-gold text-bone-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-charcoal border-aged-gold">
                      <SelectItem value="brown">Marron</SelectItem>
                      <SelectItem value="blue">Bleu</SelectItem>
                      <SelectItem value="green">Vert</SelectItem>
                      <SelectItem value="gray">Gris</SelectItem>
                      <SelectItem value="hazel">Noisette</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm text-aged-parchment">Taille</label>
                  <Select value={avatarSettings.height} onValueChange={(value) => setAvatarSettings({...avatarSettings, height: value})}>
                    <SelectTrigger className="bg-cosmic-void border-aged-gold text-bone-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-charcoal border-aged-gold">
                      <SelectItem value="short">Petit</SelectItem>
                      <SelectItem value="average">Moyen</SelectItem>
                      <SelectItem value="tall">Grand</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm text-aged-parchment">Corpulence</label>
                  <Select value={avatarSettings.build} onValueChange={(value) => setAvatarSettings({...avatarSettings, build: value})}>
                    <SelectTrigger className="bg-cosmic-void border-aged-gold text-bone-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-charcoal border-aged-gold">
                      <SelectItem value="slim">Mince</SelectItem>
                      <SelectItem value="average">Moyenne</SelectItem>
                      <SelectItem value="athletic">Athlétique</SelectItem>
                      <SelectItem value="heavy">Corpulent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm text-aged-parchment">Teint</label>
                  <Select value={avatarSettings.skinTone} onValueChange={(value) => setAvatarSettings({...avatarSettings, skinTone: value})}>
                    <SelectTrigger className="bg-cosmic-void border-aged-gold text-bone-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-charcoal border-aged-gold">
                      <SelectItem value="pale">Pâle</SelectItem>
                      <SelectItem value="fair">Clair</SelectItem>
                      <SelectItem value="medium">Mat</SelectItem>
                      <SelectItem value="tan">Bronzé</SelectItem>
                      <SelectItem value="dark">Foncé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {avatarSettings.gender === 'male' && (
                  <div>
                    <label className="text-sm text-aged-parchment">Pilosité faciale</label>
                    <Select value={avatarSettings.facialHair} onValueChange={(value) => setAvatarSettings({...avatarSettings, facialHair: value})}>
                      <SelectTrigger className="bg-cosmic-void border-aged-gold text-bone-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-charcoal border-aged-gold">
                        <SelectItem value="none">Aucune</SelectItem>
                        <SelectItem value="mustache">Moustache</SelectItem>
                        <SelectItem value="beard">Barbe</SelectItem>
                        <SelectItem value="goatee">Bouc</SelectItem>
                        <SelectItem value="sideburns">Favoris</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                
                <div>
                  <label className="text-sm text-aged-parchment">Style vestimentaire</label>
                  <Select value={avatarSettings.clothing} onValueChange={(value) => setAvatarSettings({...avatarSettings, clothing: value})}>
                    <SelectTrigger className="bg-cosmic-void border-aged-gold text-bone-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-charcoal border-aged-gold">
                      <SelectItem value="formal">Formel</SelectItem>
                      <SelectItem value="casual">Décontracté</SelectItem>
                      <SelectItem value="work">Travail</SelectItem>
                      <SelectItem value="military">Militaire</SelectItem>
                      <SelectItem value="academic">Académique</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <label className="text-sm text-aged-parchment">Traits distinctifs (optionnel)</label>
                <Textarea
                  placeholder="Ex: cicatrice sur la joue, lunettes rondes, chapeau melon..."
                  value={avatarSettings.distinctiveFeatures}
                  onChange={(e) => setAvatarSettings({...avatarSettings, distinctiveFeatures: e.target.value})}
                  className="bg-cosmic-void border-aged-gold text-bone-white"
                  rows={2}
                />
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowAvatarDialog(false)}
                  className="border-aged-gold text-aged-gold hover:bg-aged-gold hover:text-deep-black"
                >
                  Annuler
                </Button>
                <Button
                  onClick={() => handleGenerateAvatar(true)}
                  disabled={isGeneratingAvatar}
                  className="bg-eldritch-green hover:bg-green-800 text-bone-white"
                >
                  {isGeneratingAvatar ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Génération...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Générer le portrait
                    </>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
