// Données de compétences séparées pour limiter la taille du bundle principal
// Comprend les traductions et valeurs par défaut fréquemment utilisées.

export const SKILL_TRANSLATIONS: Record<string, string> = {
  // Compétences interpersonnelles
  charm: "Baratin",
  fast_talk: "Persuasion Rapide",
  intimidate: "Intimidation",
  persuade: "Persuasion",
  psychoanalysis: "Psychanalyse",
  psychology: "Psychologie",

  // Compétences de connaissances
  accounting: "Comptabilité",
  anthropology: "Anthropologie",
  appraise: "Estimation",
  archaeology: "Archéologie",
  computer_use: "Informatique",
  history: "Histoire",
  law: "Droit",
  library_use: "Bibliothèque",
  medicine: "Médecine",
  natural_world: "Sciences Naturelles",
  occult: "Occultisme",

  // Langues
  language_own: "Langue Maternelle",
  language_other: "Langue Étrangère",
  language_latin: "Latin",
  language_greek: "Grec Ancien",

  // Art & Artisanat
  art_craft_acting: "Art/Artisanat (Comédie)",
  art_craft_photography: "Art/Artisanat (Photographie)",
  art_craft_writing: "Art/Artisanat (Écriture)",
  art_craft_forgery: "Art/Artisanat (Contrefaçon)",
  art_craft_fine_art: "Art/Artisanat (Beaux-Arts)",
  art_craft: "Art/Artisanat",

  // Sciences
  science_astronomy: "Science (Astronomie)",
  science_biology: "Science (Biologie)",
  science_chemistry: "Science (Chimie)",
  science_geology: "Science (Géologie)",
  science_mathematics: "Science (Mathématiques)",
  science_pharmacy: "Science (Pharmacologie)",
  science_physics: "Science (Physique)",

  // Combat
  dodge: "Esquive",
  fighting_brawl: "Combat Rapproché (Bagarre)",
  fighting_sword: "Combat Rapproché (Épée)",
  fighting_axe: "Combat Rapproché (Hache)",
  firearms_handgun: "Armes à Feu (Pistolet)",
  firearms_rifle_shotgun: "Armes à Feu (Fusil)",
  firearms_submachine_gun: "Armes à Feu (Mitraillette)",
  firearms_machine_gun: "Armes à Feu (Mitrailleuse)",
  throw: "Lancer",

  // Physique
  climb: "Grimper",
  jump: "Sauter",
  listen: "Écouter",
  locksmith: "Crochetage",
  sleight_of_hand: "Pickpocket",
  spot_hidden: "Trouver Objet Caché",
  stealth: "Discrétion",
  survival: "Survie",
  swim: "Nager",
  track: "Pister",

  // Technique
  disguise: "Déguisement",
  drive_auto: "Conduite (Automobile)",
  electrical_repair: "Électricité",
  electronics: "Électronique",
  first_aid: "Premiers Soins",
  hypnosis: "Hypnose",
  mechanical_repair: "Mécanique",
  navigate: "Navigation",
  operate_heavy_machinery: "Machinerie Lourde",
  pilot: "Pilotage",
  ride: "Équitation",

  // Spécial
  credit_rating: "Crédit",
  cthulhu_mythos: "Mythe de Cthulhu",
};

export const SKILLS = Object.entries(SKILL_TRANSLATIONS).map(([key, name]) => ({
  key,
  name,
  base: 0, // Ajusté via DEFAULT_SKILLS
}));

export const DEFAULT_SKILLS: Record<string, number> = {
  // Interpersonnel
  charm: 15,
  fast_talk: 5,
  intimidate: 15,
  persuade: 15,
  psychoanalysis: 1,
  psychology: 15,

  // Connaissances
  accounting: 5,
  anthropology: 1,
  appraise: 5,
  archaeology: 1,
  computer_use: 1,
  history: 20,
  law: 5,
  library_use: 25,
  medicine: 5,
  natural_world: 10,
  occult: 5,

  // Langues
  language_own: 0, // = EDU%
  language_other: 1,
  language_latin: 1,
  language_greek: 1,

  // Arts & Artisanats
  art_craft_acting: 5,
  art_craft_photography: 5,
  art_craft_writing: 5,
  art_craft_forgery: 5,
  art_craft_fine_art: 5,

  // Sciences
  science_astronomy: 1,
  science_biology: 1,
  science_chemistry: 1,
  science_geology: 1,
  science_mathematics: 1,
  science_pharmacy: 1,
  science_physics: 1,

  // Combat
  dodge: 0, // = DEX/2
  fighting_brawl: 25,
  fighting_sword: 1,
  fighting_axe: 1,
  firearms_handgun: 20,
  firearms_rifle_shotgun: 25,
  firearms_submachine_gun: 1,
  firearms_machine_gun: 1,
  throw: 25,

  // Physique
  climb: 40,
  jump: 25,
  listen: 25,
  locksmith: 1,
  sleight_of_hand: 10,
  spot_hidden: 25,
  stealth: 20,
  survival: 10,
  swim: 25,
  track: 10,

  // Technique
  disguise: 1,
  drive_auto: 20,
  electrical_repair: 10,
  electronics: 1,
  first_aid: 30,
  hypnosis: 1,
  mechanical_repair: 20,
  navigate: 10,
  operate_heavy_machinery: 1,
  pilot: 1,
  ride: 5,

  // Spécial
  credit_rating: 15,
  cthulhu_mythos: 0,
};

export function formatSkillName(skillKey: string): string {
  return (
    SKILL_TRANSLATIONS[skillKey] ||
    skillKey
      .replace(/_/g, " ")
      .toLowerCase()
      .replace(/\b\w/g, (char) => char.toUpperCase())
  );
}
