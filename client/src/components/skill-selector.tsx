import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, BookOpen, Target } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { calculateOccupationPoints, type Occupation } from "@/lib/cthulhu-data";
import { DEFAULT_SKILLS, formatSkillName } from "@/lib/skills";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface SkillSelectorProps {
  occupation: Occupation | null;
  characteristics: any;
  onSkillsChange: (skills: Record<string, number>) => void;
}

export default function SkillSelector({ occupation, characteristics, onSkillsChange }: SkillSelectorProps) {
  const [skills, setSkills] = useState<Record<string, number>>({});
  const [occupationPointsUsed, setOccupationPointsUsed] = useState(0);
  const [personalPointsUsed, setPersonalPointsUsed] = useState(0);
  
  // Calculate available points
  const occupationPointsTotal = occupation 
    ? calculateOccupationPoints(occupation.skillPointsFormula, characteristics) 
    : 0;
  const personalPointsTotal = characteristics.intelligence * 2;
  
  // Initialize skills with base values
  useEffect(() => {
    const initialSkills = { ...DEFAULT_SKILLS };
    
    // Set special calculated skills
    initialSkills['dodge'] = Math.floor(characteristics.dexterity / 2);
    initialSkills['language_own'] = characteristics.education;
    
    setSkills(initialSkills);
    onSkillsChange(initialSkills);
  }, [characteristics, onSkillsChange]);
  
  const handleSkillChange = (skillName: string, value: number) => {
    const currentValue = skills[skillName] || 0;
    const baseValue = DEFAULT_SKILLS[skillName] || 0;
    
    // Don't allow going below base value
    if (value < baseValue) return;
    
    // Don't allow exceeding 75% at character creation
    if (value > 75) return;
    
    const newSkills = { ...skills, [skillName]: value };
    setSkills(newSkills);
    onSkillsChange(newSkills);
    
    // Recalculate points used
    calculatePointsUsed(newSkills);
  };
  
  const calculatePointsUsed = (currentSkills: Record<string, number>) => {
    let occUsed = 0;
    let persUsed = 0;
    
    // Calculate points allocated to occupation skills
    if (occupation) {
      occupation.occupationSkills.forEach(skillName => {
        const allocated = (currentSkills[skillName] || 0) - (DEFAULT_SKILLS[skillName] || 0);
        occUsed += allocated;
      });
    }
    
    // Calculate personal interest points (other skills)
    Object.keys(currentSkills).forEach(skillName => {
      if (!occupation?.occupationSkills.includes(skillName)) {
        const allocated = (currentSkills[skillName] || 0) - (DEFAULT_SKILLS[skillName] || 0);
        persUsed += allocated;
      }
    });
    
    setOccupationPointsUsed(occUsed);
    setPersonalPointsUsed(persUsed);
  };
  
  const getSkillCategory = (skillName: string) => {
    if (skillName.startsWith('art_craft')) return 'Art & Artisanat';
    if (skillName.startsWith('science')) return 'Sciences';
    if (skillName.startsWith('language')) return 'Langues';
    if (skillName.startsWith('fighting') || skillName.startsWith('firearms')) return 'Combat';
    if (['charm', 'fast_talk', 'intimidate', 'persuade', 'psychology', 'psychoanalysis'].includes(skillName)) {
      return 'Social';
    }
    if (['climb', 'jump', 'swim', 'stealth', 'dodge', 'ride'].includes(skillName)) {
      return 'Physique';
    }
    if (['accounting', 'anthropology', 'archaeology', 'history', 'law', 'library_use', 'medicine', 'natural_world', 'occult'].includes(skillName)) {
      return 'Connaissances';
    }
    return 'Technique';
  };
  
  const skillsByCategory = Object.keys(skills).reduce((acc, skillName) => {
    const category = getSkillCategory(skillName);
    if (!acc[category]) acc[category] = [];
    acc[category].push(skillName);
    return acc;
  }, {} as Record<string, string[]>);
  
  return (
    <div className="space-y-6">
      {/* Points Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-charcoal border-aged-gold">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-cinzel text-aged-gold flex items-center">
              <Target className="mr-2 h-4 w-4" />
              Points d'Occupation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-aged-parchment">Utilisés</span>
                <span className="text-bone-white font-bold">
                  {occupationPointsUsed} / {occupationPointsTotal}
                </span>
              </div>
              <Progress 
                value={(occupationPointsUsed / occupationPointsTotal) * 100} 
                className="h-2 bg-cosmic-void"
              />
              {occupationPointsUsed > occupationPointsTotal && (
                <Alert className="p-2 bg-blood-burgundy/20 border-blood-burgundy">
                  <AlertCircle className="h-3 w-3" />
                  <AlertDescription className="text-xs">
                    Trop de points utilisés !
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-charcoal border-aged-gold">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-cinzel text-aged-gold flex items-center">
              <BookOpen className="mr-2 h-4 w-4" />
              Points d'Intérêts Personnels
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-aged-parchment">Utilisés</span>
                <span className="text-bone-white font-bold">
                  {personalPointsUsed} / {personalPointsTotal}
                </span>
              </div>
              <Progress 
                value={(personalPointsUsed / personalPointsTotal) * 100} 
                className="h-2 bg-cosmic-void"
              />
              {personalPointsUsed > personalPointsTotal && (
                <Alert className="p-2 bg-blood-burgundy/20 border-blood-burgundy">
                  <AlertCircle className="h-3 w-3" />
                  <AlertDescription className="text-xs">
                    Trop de points utilisés !
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Skills by Category */}
      <Card className="bg-charcoal border-aged-gold parchment-bg">
        <CardHeader>
          <CardTitle className="font-cinzel text-aged-gold">
            Compétences de l'Investigateur
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="mb-4 bg-cosmic-void border-aged-gold/30">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-aged-parchment">
              Aucune compétence ne peut dépasser 75% à la création. Les compétences d'occupation sont marquées d'une étoile.
            </AlertDescription>
          </Alert>
          
          <Tabs defaultValue="occupation" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-cosmic-void">
              <TabsTrigger value="occupation">Compétences d'Occupation</TabsTrigger>
              <TabsTrigger value="all">Toutes les Compétences</TabsTrigger>
            </TabsList>
            
            <TabsContent value="occupation" className="mt-4">
              {occupation ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {occupation.occupationSkills
                    .sort((a, b) => {
                      const nameA = formatSkillName(a);
                      const nameB = formatSkillName(b);
                      return nameA.localeCompare(nameB, 'fr');
                    })
                    .map(skillName => (
                    <div key={skillName} className="space-y-1">
                      <Label className="text-sm text-bone-white flex items-center justify-between">
                        <span>{formatSkillName(skillName)}</span>
                        <Badge variant="outline" className="text-xs text-aged-gold border-aged-gold">
                          Base: {DEFAULT_SKILLS[skillName] || 0}%
                        </Badge>
                      </Label>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min={DEFAULT_SKILLS[skillName] || 0}
                          max={75}
                          value={skills[skillName] || 0}
                          onChange={(e) => handleSkillChange(skillName, parseInt(e.target.value) || 0)}
                          className="bg-cosmic-void border-aged-gold text-bone-white"
                          data-testid={`skill-${skillName}`}
                        />
                        <span className="text-bone-white font-bold">%</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <Alert className="bg-blood-burgundy/20 border-blood-burgundy">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Sélectionnez une occupation pour voir les compétences associées.
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>
            
            <TabsContent value="all" className="mt-4 space-y-6">
              {Object.entries(skillsByCategory).map(([category, categorySkills]) => (
                <div key={category}>
                  <h4 className="font-cinzel text-aged-gold mb-3">{category}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categorySkills
                      .sort((a, b) => {
                        const nameA = formatSkillName(a);
                        const nameB = formatSkillName(b);
                        return nameA.localeCompare(nameB, 'fr');
                      })
                      .map(skillName => {
                      const isOccupationSkill = occupation?.occupationSkills.includes(skillName);
                      return (
                        <div key={skillName} className="space-y-1">
                          <Label className="text-sm text-bone-white flex items-center justify-between">
                            <span className="flex items-center">
                              {formatSkillName(skillName)}
                              {isOccupationSkill && <span className="ml-1 text-aged-gold">★</span>}
                            </span>
                            <Badge variant="outline" className="text-xs text-aged-parchment border-aged-gold/50">
                              {DEFAULT_SKILLS[skillName] || 0}%
                            </Badge>
                          </Label>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              min={DEFAULT_SKILLS[skillName] || 0}
                              max={75}
                              value={skills[skillName] || 0}
                              onChange={(e) => handleSkillChange(skillName, parseInt(e.target.value) || 0)}
                              className="bg-cosmic-void border-aged-gold text-bone-white text-sm"
                              data-testid={`skill-${skillName}`}
                            />
                            <span className="text-bone-white">%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}