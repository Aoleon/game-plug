// Call of Cthulhu 7th Edition game data constants

export interface Occupation {
  id: string;
  name: string;
  description: string;
  creditRating: [number, number]; // min, max
  suggestedContacts: string[];
  occupationSkills: string[]; // 8 occupation skills
  skillPointsFormula: string; // formula for skill points (e.g., "EDU × 4")
  recommendedSkills?: string[]; // Additional recommended skills
  era?: string; // Era appropriateness (e.g., "1920s", "Modern")
}

export interface SanityPreset {
  name: string;
  formula: string;
  description: string;
}

// Translation map for skill names
export const SKILL_TRANSLATIONS: Record<string, string> = {
  // Interpersonal Skills
  'charm': 'Baratin',
  'fast_talk': 'Persuasion Rapide',
  'intimidate': 'Intimidation',
  'persuade': 'Persuasion',
  'psychoanalysis': 'Psychanalyse',
  'psychology': 'Psychologie',
  
  // Knowledge Skills
  'accounting': 'Comptabilité',
  'anthropology': 'Anthropologie',
  'appraise': 'Estimation',
  'archaeology': 'Archéologie',
  'computer_use': 'Informatique',
  'history': 'Histoire',
  'law': 'Droit',
  'library_use': 'Bibliothèque',
  'medicine': 'Médecine',
  'natural_world': 'Sciences Naturelles',
  'occult': 'Occultisme',
  
  // Language Skills
  'language_own': 'Langue Maternelle',
  'language_other': 'Langue Étrangère',
  'language_latin': 'Latin',
  'language_greek': 'Grec Ancien',
  
  // Art & Craft
  'art_craft_acting': 'Art/Artisanat (Comédie)',
  'art_craft_photography': 'Art/Artisanat (Photographie)',
  'art_craft_writing': 'Art/Artisanat (Écriture)',
  'art_craft_forgery': 'Art/Artisanat (Contrefaçon)',
  'art_craft_fine_art': 'Art/Artisanat (Beaux-Arts)',
  'art_craft': 'Art/Artisanat',
  
  // Science
  'science_astronomy': 'Science (Astronomie)',
  'science_biology': 'Science (Biologie)',
  'science_chemistry': 'Science (Chimie)',
  'science_geology': 'Science (Géologie)',
  'science_mathematics': 'Science (Mathématiques)',
  'science_pharmacy': 'Science (Pharmacologie)',
  'science_physics': 'Science (Physique)',
  
  // Combat Skills
  'dodge': 'Esquive',
  'fighting_brawl': 'Combat Rapproché (Bagarre)',
  'fighting_sword': 'Combat Rapproché (Épée)',
  'fighting_axe': 'Combat Rapproché (Hache)',
  'firearms_handgun': 'Armes à Feu (Pistolet)',
  'firearms_rifle_shotgun': 'Armes à Feu (Fusil)',
  'firearms_submachine_gun': 'Armes à Feu (Mitraillette)',
  'firearms_machine_gun': 'Armes à Feu (Mitrailleuse)',
  'throw': 'Lancer',
  
  // Physical Skills
  'climb': 'Grimper',
  'jump': 'Sauter',
  'listen': 'Écouter',
  'locksmith': 'Crochetage',
  'sleight_of_hand': 'Pickpocket',
  'spot_hidden': 'Trouver Objet Caché',
  'stealth': 'Discrétion',
  'survival': 'Survie',
  'swim': 'Nager',
  'track': 'Pister',
  
  // Technical Skills
  'disguise': 'Déguisement',
  'drive_auto': 'Conduite (Automobile)',
  'electrical_repair': 'Électricité',
  'electronics': 'Électronique',
  'first_aid': 'Premiers Soins',
  'hypnosis': 'Hypnose',
  'mechanical_repair': 'Mécanique',
  'navigate': 'Navigation',
  'operate_heavy_machinery': 'Machinerie Lourde',
  'pilot': 'Pilotage',
  'ride': 'Équitation',
  
  // Special Skills
  'credit_rating': 'Crédit',
  'cthulhu_mythos': 'Mythe de Cthulhu',
};

// Skills array for easier iteration and display
export const SKILLS = Object.entries(SKILL_TRANSLATIONS).map(([key, name]) => ({
  key,
  name,
  base: 0 // Will be set from DEFAULT_SKILLS below
}));

// Call of Cthulhu 7th Edition - Base skill percentages
export const DEFAULT_SKILLS: Record<string, number> = {
  // Interpersonal Skills
  'charm': 15,
  'fast_talk': 5,
  'intimidate': 15,
  'persuade': 15,
  'psychoanalysis': 1,
  'psychology': 15,
  
  // Knowledge Skills
  'accounting': 5,
  'anthropology': 1,
  'appraise': 5,
  'archaeology': 1,
  'computer_use': 1, // Modern setting
  'history': 20,
  'law': 5,
  'library_use': 25,
  'medicine': 5,
  'natural_world': 10,
  'occult': 5,
  
  // Language Skills
  'language_own': 0, // Will be set to EDU%
  'language_other': 1,
  'language_latin': 1,
  'language_greek': 1,
  
  // Art & Craft Specializations
  'art_craft_acting': 5,
  'art_craft_photography': 5,
  'art_craft_writing': 5,
  'art_craft_forgery': 5,
  'art_craft_fine_art': 5,
  
  // Science Specializations  
  'science_astronomy': 1,
  'science_biology': 1,
  'science_chemistry': 1,
  'science_geology': 1,
  'science_mathematics': 1,
  'science_pharmacy': 1,
  'science_physics': 1,
  
  // Combat Skills
  'dodge': 0, // Will be calculated as DEX/2
  'fighting_brawl': 25,
  'fighting_sword': 1,
  'fighting_axe': 1,
  'firearms_handgun': 20,
  'firearms_rifle_shotgun': 25,
  'firearms_submachine_gun': 1,
  'firearms_machine_gun': 1,
  'throw': 25,
  
  // Physical Skills
  'climb': 40,
  'jump': 25,
  'listen': 25,
  'locksmith': 1,
  'sleight_of_hand': 10,
  'spot_hidden': 25,
  'stealth': 20,
  'survival': 10,
  'swim': 25,
  'track': 10,
  
  // Technical Skills
  'disguise': 1,
  'drive_auto': 20,
  'electrical_repair': 10,
  'electronics': 1, // Modern setting
  'first_aid': 30,
  'hypnosis': 1,
  'mechanical_repair': 20,
  'navigate': 10,
  'operate_heavy_machinery': 1,
  'pilot': 1,
  'ride': 5,
  
  // Special Skills
  'credit_rating': 15, // Modified by occupation
  'cthulhu_mythos': 0, // Always starts at 0
};

// Call of Cthulhu 7th Edition Occupations
export const OCCUPATIONS: Occupation[] = [
  {
    id: 'antiquarian',
    name: 'Antiquaire',
    description: 'Expert en objets anciens et artefacts historiques. Peut identifier et évaluer des objets rares.',
    creditRating: [30, 70],
    suggestedContacts: ['Collectionneurs', 'Musées', 'Universités', 'Marchands d\'art'],
    occupationSkills: [
      'appraise',
      'art_craft',
      'history',
      'library_use',
      'language_other',
      'spot_hidden',
      'persuade',
      'accounting'
    ],
    skillPointsFormula: 'EDU × 4',
    recommendedSkills: ['archaeology', 'charm', 'fast_talk'],
    era: '1920s',
  },
  {
    id: 'doctor',
    name: 'Médecin',
    description: 'Praticien de la médecine moderne. Peut soigner les blessures et diagnostiquer les maladies.',
    creditRating: [30, 80],
    suggestedContacts: ['Hôpitaux', 'Autres médecins', 'Pharmaciens', 'Morgue'],
    occupationSkills: [
      'first_aid',
      'medicine',
      'psychology',
      'science_biology',
      'science_pharmacy',
      'language_latin',
      'spot_hidden',
      'accounting'
    ],
    skillPointsFormula: 'EDU × 4',
    recommendedSkills: ['science_chemistry', 'persuade', 'reputation'],
    era: 'Any',
  },
  {
    id: 'professor',
    name: 'Professeur',
    description: 'Enseignant universitaire et chercheur. Spécialiste dans un domaine académique.',
    creditRating: [20, 70],
    suggestedContacts: ['Université', 'Étudiants', 'Chercheurs', 'Bibliothèques'],
    occupationSkills: [
      'library_use',
      'language_other',
      'language_own',
      'psychology',
      'persuade',
      'history',
      'science_specialty',
      'spot_hidden'
    ],
    skillPointsFormula: 'EDU × 4',
    recommendedSkills: ['anthropology', 'archaeology', 'natural_world'],
    era: 'Any',
  },
  {
    id: 'journalist',
    name: 'Journaliste',
    description: 'Reporter et enquêteur de presse. Toujours à la recherche du prochain scoop.',
    creditRating: [9, 30],
    suggestedContacts: ['Rédaction', 'Police', 'Politiciens', 'Milieu criminel'],
    occupationSkills: [
      'art_craft_photography',
      'history',
      'library_use',
      'language_own',
      'fast_talk',
      'persuade',
      'psychology',
      'stealth'
    ],
    skillPointsFormula: 'EDU × 4',
    recommendedSkills: ['spot_hidden', 'listen', 'charm'],
    era: 'Any',
  },
  {
    id: 'private_investigator',
    name: 'Détective Privé',
    description: 'Enquêteur privé professionnel. Expert en filature et enquêtes discrètes.',
    creditRating: [9, 30],
    suggestedContacts: ['Police', 'Avocats', 'Clients fortunés', 'Informateurs'],
    occupationSkills: [
      'art_craft_photography',
      'disguise',
      'law',
      'library_use',
      'psychology',
      'spot_hidden',
      'stealth',
      'fast_talk'
    ],
    skillPointsFormula: 'EDU × 2 + (STR × 2 ou DEX × 2)',
    recommendedSkills: ['firearms_handgun', 'locksmith', 'listen'],
    era: 'Any',
  },
  {
    id: 'occultist',
    name: 'Occultiste',
    description: 'Étudiant des mystères surnaturels et des sciences occultes. Dangereux pour la sanité mentale.',
    creditRating: [9, 65],
    suggestedContacts: ['Sociétés secrètes', 'Autres occultistes', 'Antiquaires', 'Bibliothèques privées'],
    occupationSkills: [
      'anthropology',
      'history',
      'library_use',
      'occult',
      'language_other',
      'psychology',
      'science_astronomy',
      'persuade'
    ],
    skillPointsFormula: 'EDU × 4',
    recommendedSkills: ['art_craft_writing', 'charm', 'spot_hidden'],
    era: 'Any',
  },
  {
    id: 'police_detective',
    name: 'Inspecteur de Police',
    description: 'Détective de la police criminelle. Autorité légale et accès aux dossiers officiels.',
    creditRating: [20, 50],
    suggestedContacts: ['Police', 'Médecins légistes', 'Procureurs', 'Journalistes'],
    occupationSkills: [
      'art_craft_acting',
      'disguise',
      'firearms_handgun',
      'law',
      'listen',
      'psychology',
      'spot_hidden',
      'intimidate'
    ],
    skillPointsFormula: 'EDU × 2 + (STR × 2 ou DEX × 2)',
    recommendedSkills: ['drive_auto', 'fighting_brawl', 'first_aid'],
    era: 'Any',
  },
  {
    id: 'archaeologist',
    name: 'Archéologue',
    description: 'Expert en civilisations anciennes et fouilles archéologiques.',
    creditRating: [10, 40],
    suggestedContacts: ['Universités', 'Musées', 'Collectionneurs', 'Expéditions'],
    occupationSkills: [
      'archaeology',
      'anthropology',
      'history',
      'library_use',
      'spot_hidden',
      'mechanical_repair',
      'navigate',
      'language_other'
    ],
    skillPointsFormula: 'EDU × 4',
    recommendedSkills: ['climb', 'natural_world', 'survival'],
    era: '1920s',
  },
  {
    id: 'dilettante',
    name: 'Dilettante',
    description: 'Personne fortunée vivant de ses rentes. Temps libre pour s\'adonner à ses passions.',
    creditRating: [50, 99],
    suggestedContacts: ['Haute société', 'Artistes', 'Politiciens', 'Clubs privés'],
    occupationSkills: [
      'art_craft',
      'firearms_rifle',
      'language_other',
      'ride',
      'charm',
      'persuade',
      'credit_rating',
      'any_one'
    ],
    skillPointsFormula: 'EDU × 2 + APP × 2',
    recommendedSkills: ['history', 'natural_world', 'navigate'],
    era: '1920s',
  },
  {
    id: 'alienist',
    name: 'Aliéniste',
    description: 'Précurseur du psychiatre moderne. Spécialiste des troubles mentaux.',
    creditRating: [10, 60],
    suggestedContacts: ['Asiles', 'Autres médecins', 'Universités', 'Police'],
    occupationSkills: [
      'law',
      'listen',
      'medicine',
      'language_other',
      'psychoanalysis',
      'psychology',
      'science_biology',
      'science_pharmacy'
    ],
    skillPointsFormula: 'EDU × 4',
    recommendedSkills: ['persuade', 'spot_hidden', 'history'],
    era: '1920s',
  },
];

// Predefined sanity loss scenarios for GMs
export const SANITY_PRESETS: SanityPreset[] = [
  {
    name: 'Événement Mineur',
    formula: '1/1d4',
    description: 'Découverte troublante, animal mort mutilé',
  },
  {
    name: 'Horreur Modérée',
    formula: '1d4/1d8',
    description: 'Cadavre humain mutilé, phénomène inexpliqué',
  },
  {
    name: 'Créature Mythos',
    formula: '1d8/1d20',
    description: 'Première rencontre avec une entité lovecraftienne',
  },
  {
    name: 'Grand Ancien',
    formula: '1d10/1d100',
    description: 'Vision directe d\'un Grand Ancien éveillé',
  },
  {
    name: 'Révélation Cosmique',
    formula: '1d20/1d100',
    description: 'Compréhension de la véritable nature de l\'univers',
  },
];

// Common phobias that can develop from sanity loss
// Calculate occupation skill points based on formula
export function calculateOccupationPoints(
  formula: string,
  characteristics: any
): number {
  const { strength, constitution, size, dexterity, appearance, intelligence, power, education } = characteristics;
  
  // Parse common formulas
  if (formula === 'EDU × 4') return education * 4;
  if (formula === 'EDU × 2 + APP × 2') return education * 2 + appearance * 2;
  if (formula === 'EDU × 2 + DEX × 2') return education * 2 + dexterity * 2;
  if (formula === 'EDU × 2 + STR × 2') return education * 2 + strength * 2;
  if (formula === 'EDU × 2 + (STR × 2 ou DEX × 2)') {
    return education * 2 + Math.max(strength * 2, dexterity * 2);
  }
  
  // Default to EDU × 4 if formula not recognized
  return education * 4;
}

// Age modifiers for character creation
export const AGE_MODIFIERS = {
  '15-19': {
    description: 'Jeune adulte',
    modifiers: { STR: -5, SIZ: -5, EDU: -5 },
    educationChecks: 0,
    luckBonus: true, // Roll twice, keep higher
  },
  '20-39': {
    description: 'Adulte',
    modifiers: {},
    educationChecks: 1,
    luckBonus: false,
  },
  '40-49': {
    description: 'Âge mûr',
    modifiers: { STR: -5, CON: -5, DEX: -5, APP: -5 },
    educationChecks: 2,
    luckBonus: false,
  },
  '50-59': {
    description: 'Quinquagénaire',
    modifiers: { STR: -10, CON: -10, DEX: -10, APP: -10 },
    educationChecks: 3,
    luckBonus: false,
  },
  '60-69': {
    description: 'Sexagénaire',
    modifiers: { STR: -20, CON: -20, DEX: -20, APP: -15 },
    educationChecks: 4,
    luckBonus: false,
  },
  '70-79': {
    description: 'Septuagénaire',
    modifiers: { STR: -40, CON: -40, DEX: -40, APP: -20 },
    educationChecks: 4,
    luckBonus: false,
  },
  '80+': {
    description: 'Octogénaire',
    modifiers: { STR: -80, CON: -80, DEX: -80, APP: -25 },
    educationChecks: 4,
    luckBonus: false,
  },
};

export const PHOBIAS = [
  'Arachnophobie', // Peur des araignées
  'Claustrophobie', // Peur des espaces clos
  'Agoraphobie', // Peur des espaces ouverts
  'Nyctophobie', // Peur de l\'obscurité
  'Thanatophobie', // Peur de la mort
  'Trypophobie', // Peur des trous
  'Automatonophobie', // Peur des automates
  'Bibliophobia', // Peur des livres
  'Chiroptophobie', // Peur des chauves-souris
  'Démophobie', // Peur des foules
  'Ophiophobie', // Peur des serpents
  'Thalassophobie', // Peur de l\'océan
  'Xénophobie', // Peur des étrangers
  'Coulrophobie', // Peur des clowns
  'Nécrophobie', // Peur des cadavres
];

// Common manias that can develop from sanity loss
export const MANIAS = [
  'Kleptomanie', // Compulsion de voler
  'Pyromanie', // Obsession du feu
  'Mythomanie', // Compulsion de mentir
  'Trichotillomanie', // Compulsion de s\'arracher les cheveux
  'Bibliomanie', // Obsession des livres
  'Collectomanie', // Compulsion de collectionner
  'Arithmomanie', // Obsession de compter
  'Dermatomanie', // Compulsion de se gratter
  'Onomatomanie', // Obsession des mots
  'Graphomanie', // Compulsion d\'écrire
  'Dipsomanie', // Obsession de l\'alcool
  'Agateomanie', // Compulsion de gentillesse excessive
  'Mégalomanie', // Délire de grandeur
  'Paranomanie', // Obsession du surnaturel
  'Théomanie', // Obsession religieuse
];

// Era-specific equipment and technology (1920s focus)
export const EQUIPMENT_1920S = {
  weapons: [
    { name: '.38 Revolver', damage: '1d10', range: '15m', malfunction: 100, ammo: 6 },
    { name: '.45 Automatic', damage: '1d10+2', range: '15m', malfunction: 100, ammo: 7 },
    { name: 'Shotgun 12G', damage: '4d6/2d6/1d6', range: '10/20/50m', malfunction: 100, ammo: 2 },
    { name: 'Rifle .30-06', damage: '2d6+4', range: '110m', malfunction: 100, ammo: 5 },
    { name: 'Couteau', damage: '1d4+DB', range: 'Corps à corps', malfunction: '-', ammo: '-' },
    { name: 'Matraque', damage: '1d6+DB', range: 'Corps à corps', malfunction: '-', ammo: '-' },
  ],
  vehicles: [
    { name: 'Ford Model T', year: 1920, speed: '45 km/h', reliability: 65 },
    { name: 'Rolls-Royce Silver Ghost', year: 1925, speed: '120 km/h', reliability: 85 },
    { name: 'Motorcycle', year: 1920, speed: '80 km/h', reliability: 55 },
  ],
  technology: [
    'Téléphone fixe',
    'Radio TSF',
    'Appareil photo à plaques',
    'Machine à écrire',
    'Lampe de poche électrique',
    'Phonographe',
  ],
};

// Common Mythos tomes with their characteristics
export const MYTHOS_TOMES = [
  {
    name: 'Necronomicon',
    author: 'Abdul Alhazred',
    sanityLoss: '1d8',
    cthulhuMythos: '+12',
    spells: ['Contact Nyarlathotep', 'Summon Star Vampire'],
    studyTime: '6 months',
  },
  {
    name: 'De Vermis Mysteriis',
    author: 'Ludwig Prinn',
    sanityLoss: '1d6',
    cthulhuMythos: '+8',
    spells: ['Contact Ghoul', 'Summon Byakhee'],
    studyTime: '4 months',
  },
  {
    name: 'Unaussprechlichen Kulten',
    author: 'Friedrich von Junzt',
    sanityLoss: '1d4',
    cthulhuMythos: '+6',
    spells: ['Contact Deep One', 'Elder Sign'],
    studyTime: '3 months',
  },
];

// Investigator backgrounds and personality traits
export const PERSONALITY_TRAITS = [
  'Curieux',
  'Sceptique',
  'Courageux',
  'Nerveux',
  'Méticuleux',
  'Impulsif',
  'Rationnel',
  'Superstitieux',
  'Protecteur',
  'Ambitieux',
];

export const IDEOLOGIES = [
  'Humaniste',
  'Matérialiste',
  'Spiritualiste',
  'Nihiliste',
  'Progressiste',
  'Conservateur',
  'Anarchiste',
  'Nationaliste',
];

export const SIGNIFICANT_PEOPLE = [
  'Parent',
  'Frère/Sœur',
  'Époux/Épouse',
  'Enfant',
  'Ami d\'enfance',
  'Mentor',
  'Collègue',
  'Rival',
];
