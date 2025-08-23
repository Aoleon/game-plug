// Call of Cthulhu 7th Edition game data constants

export interface Occupation {
  name: string;
  description: string;
  creditRating: [number, number]; // min, max
  suggestedContacts: string[];
  skills: Record<string, number>; // skill name -> base value
  skillPoints: string; // formula for skill points (e.g., "EDU × 4")
}

export interface SanityPreset {
  name: string;
  formula: string;
  description: string;
}

// Default skill values for new characters
export const DEFAULT_SKILLS: Record<string, number> = {
  // Combat skills
  'dodge': 0, // Will be calculated as DEX/2
  'fighting_brawl': 25,
  'firearms_handgun': 20,
  'firearms_rifle': 25,
  'throw': 25,
  
  // Communication skills
  'charm': 15,
  'fast_talk': 5,
  'intimidate': 15,
  'persuade': 10,
  
  // Mental skills
  'accounting': 5,
  'anthropology': 1,
  'archaeology': 1,
  'art_craft': 5,
  'history': 5,
  'library_use': 20,
  'medicine': 1,
  'natural_world': 10,
  'occult': 5,
  'psychology': 10,
  'science': 1,
  
  // Physical skills
  'climb': 20,
  'drive_auto': 20,
  'electrical_repair': 10,
  'listen': 20,
  'locksmith': 1,
  'mechanical_repair': 10,
  'operate_heavy_machinery': 1,
  'pilot': 1,
  'ride': 5,
  'sleight_of_hand': 10,
  'spot': 25,
  'stealth': 20,
  'survival': 10,
  'swim': 20,
  'track': 10,
  
  // Other skills
  'first_aid': 30,
  'jump': 20,
  'language_own': 0, // Will be calculated as EDU
  'language_other': 1,
  'navigate': 10,
  'credit_rating': 0, // Varies by occupation
  'cthulhu_mythos': 0,
};

// Common Call of Cthulhu occupations
export const OCCUPATIONS: Occupation[] = [
  {
    name: 'Antiquaire',
    description: 'Expert en objets anciens et artefacts historiques',
    creditRating: [30, 70],
    suggestedContacts: ['Collectionneurs', 'Musées', 'Universités'],
    skills: {
      accounting: 10,
      appraise: 40,
      art_craft: 30,
      history: 60,
      library_use: 40,
      language_other: 25,
      spot: 45,
      credit_rating: 30,
    },
    skillPoints: 'EDU × 4',
  },
  {
    name: 'Médecin',
    description: 'Praticien de la médecine moderne',
    creditRating: [50, 90],
    suggestedContacts: ['Hôpitaux', 'Autres médecins', 'Pharmaciens'],
    skills: {
      first_aid: 60,
      medicine: 70,
      psychology: 20,
      science_biology: 40,
      language_latin: 40,
      credit_rating: 50,
    },
    skillPoints: 'EDU × 4',
  },
  {
    name: 'Professeur',
    description: 'Enseignant universitaire et chercheur',
    creditRating: [20, 70],
    suggestedContacts: ['Université', 'Étudiants', 'Autres académiques'],
    skills: {
      library_use: 60,
      language_other: 50,
      psychology: 20,
      credit_rating: 20,
    },
    skillPoints: 'EDU × 4',
  },
  {
    name: 'Journaliste',
    description: 'Reporter et enquêteur de presse',
    creditRating: [9, 30],
    suggestedContacts: ['Presse', 'Police', 'Sources diverses'],
    skills: {
      art_craft_photography: 40,
      fast_talk: 50,
      history: 40,
      library_use: 40,
      listen: 40,
      persuade: 50,
      psychology: 50,
      credit_rating: 9,
    },
    skillPoints: 'EDU × 4',
  },
  {
    name: 'Détective Privé',
    description: 'Enquêteur privé professionnel',
    creditRating: [9, 30],
    suggestedContacts: ['Police', 'Clients', 'Informateurs'],
    skills: {
      art_craft: 20,
      disguise: 20,
      fast_talk: 40,
      firearms: 45,
      law: 30,
      library_use: 30,
      listen: 50,
      locksmith: 20,
      psychology: 45,
      spot: 60,
      stealth: 50,
      credit_rating: 9,
    },
    skillPoints: 'EDU × 4',
  },
  {
    name: 'Occultiste',
    description: 'Étudiant des mystères surnaturels',
    creditRating: [9, 65],
    suggestedContacts: ['Sociétés secrètes', 'Autres occultistes', 'Antiquaires'],
    skills: {
      anthropology: 20,
      history: 40,
      library_use: 60,
      occult: 70,
      language_other: 25,
      credit_rating: 9,
    },
    skillPoints: 'EDU × 4',
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
