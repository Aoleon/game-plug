export interface PredefinedItem {
  name: string;
  description: string;
  category: 'weapon' | 'armor' | 'tool' | 'book' | 'misc';
  weight: number;
  damage?: string;
  armor?: number;
  tags?: string[];
}

export const PREDEFINED_ITEMS: PredefinedItem[] = [
  // Armes à feu
  {
    name: "Revolver .38",
    description: "Arme de poing standard, fiable et précise",
    category: "weapon",
    weight: 1,
    damage: "1d10",
    tags: ["arme à feu", "pistolet"]
  },
  {
    name: "Revolver .45",
    description: "Arme de poing puissante avec un fort recul",
    category: "weapon",
    weight: 2,
    damage: "1d10+2",
    tags: ["arme à feu", "pistolet"]
  },
  {
    name: "Fusil de chasse",
    description: "Arme à deux coups, dévastatrice à courte portée",
    category: "weapon",
    weight: 4,
    damage: "4d6/2d6/1d6",
    tags: ["arme à feu", "fusil"]
  },
  {
    name: "Carabine Lee-Enfield",
    description: "Fusil militaire britannique de la Grande Guerre",
    category: "weapon",
    weight: 4,
    damage: "2d6+4",
    tags: ["arme à feu", "fusil", "militaire"]
  },
  {
    name: "Pistolet automatique .32",
    description: "Petit pistolet discret et facile à dissimuler",
    category: "weapon",
    weight: 1,
    damage: "1d8",
    tags: ["arme à feu", "pistolet", "discret"]
  },
  {
    name: "Thompson M1921",
    description: "Mitraillette utilisée par les gangsters",
    category: "weapon",
    weight: 5,
    damage: "1d10+2",
    tags: ["arme à feu", "automatique", "illégal"]
  },
  
  // Armes blanches
  {
    name: "Couteau de poche",
    description: "Petit couteau pliant utilitaire",
    category: "weapon",
    weight: 0,
    damage: "1d3",
    tags: ["arme blanche", "discret", "outil"]
  },
  {
    name: "Matraque de police",
    description: "Gourdin en bois dur utilisé par les forces de l'ordre",
    category: "weapon",
    weight: 1,
    damage: "1d6",
    tags: ["arme blanche", "contondant"]
  },
  {
    name: "Épée-canne",
    description: "Canne dissimulant une lame fine",
    category: "weapon",
    weight: 2,
    damage: "1d6",
    tags: ["arme blanche", "discret", "élégant"]
  },
  {
    name: "Hachette",
    description: "Petite hache utile pour le camping",
    category: "weapon",
    weight: 2,
    damage: "1d6+1",
    tags: ["arme blanche", "outil", "tranchant"]
  },
  {
    name: "Dague rituelle",
    description: "Dague ornée utilisée dans les cérémonies occultes",
    category: "weapon",
    weight: 1,
    damage: "1d4+2",
    tags: ["arme blanche", "occulte", "rituel"]
  },
  
  // Armures
  {
    name: "Veste en cuir épais",
    description: "Protection légère contre les coups",
    category: "armor",
    weight: 2,
    armor: 1,
    tags: ["protection", "léger"]
  },
  {
    name: "Casque militaire",
    description: "Casque de la Grande Guerre",
    category: "armor",
    weight: 2,
    armor: 2,
    tags: ["protection", "militaire", "tête"]
  },
  {
    name: "Gilet pare-balles improvisé",
    description: "Protection rudimentaire contre les projectiles",
    category: "armor",
    weight: 4,
    armor: 3,
    tags: ["protection", "lourd", "improvisé"]
  },
  
  // Outils d'investigation
  {
    name: "Lampe torche",
    description: "Lampe électrique portable avec piles",
    category: "tool",
    weight: 1,
    tags: ["éclairage", "exploration"]
  },
  {
    name: "Loupe",
    description: "Lentille grossissante pour examiner les indices",
    category: "tool",
    weight: 0,
    tags: ["investigation", "indices"]
  },
  {
    name: "Appareil photo",
    description: "Appareil photographique avec pellicule",
    category: "tool",
    weight: 2,
    tags: ["investigation", "preuves", "technologie"]
  },
  {
    name: "Trousse de crochetage",
    description: "Outils pour forcer les serrures",
    category: "tool",
    weight: 0,
    tags: ["illégal", "infiltration", "outils"]
  },
  {
    name: "Jumelles",
    description: "Jumelles militaires pour l'observation",
    category: "tool",
    weight: 1,
    tags: ["observation", "surveillance"]
  },
  {
    name: "Corde (15 mètres)",
    description: "Corde solide pour l'escalade",
    category: "tool",
    weight: 3,
    tags: ["escalade", "exploration"]
  },
  {
    name: "Trousse de premiers soins",
    description: "Bandages, désinfectant et matériel médical basique",
    category: "tool",
    weight: 1,
    tags: ["médical", "soins"]
  },
  {
    name: "Lanterne à huile",
    description: "Source de lumière fiable mais encombrante",
    category: "tool",
    weight: 2,
    tags: ["éclairage", "ancien"]
  },
  {
    name: "Pied de biche",
    description: "Outil pour forcer portes et coffres",
    category: "tool",
    weight: 2,
    tags: ["effraction", "outil", "force"]
  },
  {
    name: "Briquet à essence",
    description: "Briquet fiable en métal",
    category: "tool",
    weight: 0,
    tags: ["feu", "utilitaire"]
  },
  
  // Livres et grimoires
  {
    name: "Necronomicon (traduction)",
    description: "Version traduite du terrible grimoire d'Abdul Alhazred",
    category: "book",
    weight: 3,
    tags: ["occulte", "mythe", "dangereux", "grimoire"]
  },
  {
    name: "Cultes Innommables",
    description: "Traité sur les cultes secrets par von Junzt",
    category: "book",
    weight: 2,
    tags: ["occulte", "mythe", "cultes"]
  },
  {
    name: "Le Roi en Jaune",
    description: "Pièce de théâtre maudite qui rend fou ses lecteurs",
    category: "book",
    weight: 1,
    tags: ["occulte", "mythe", "folie", "interdit"]
  },
  {
    name: "Bible",
    description: "Livre saint, peut protéger contre certaines entités",
    category: "book",
    weight: 1,
    tags: ["religion", "protection", "saint"]
  },
  {
    name: "Journal intime",
    description: "Carnet vierge pour noter ses observations",
    category: "book",
    weight: 0,
    tags: ["notes", "investigation"]
  },
  {
    name: "Atlas mondial",
    description: "Cartes détaillées du monde connu",
    category: "book",
    weight: 2,
    tags: ["navigation", "géographie", "référence"]
  },
  {
    name: "Manuel de médecine",
    description: "Guide médical pour les premiers soins",
    category: "book",
    weight: 1,
    tags: ["médical", "référence", "soins"]
  },
  {
    name: "Encyclopédie Britannica",
    description: "Référence complète sur tous les sujets",
    category: "book",
    weight: 5,
    tags: ["référence", "connaissance", "lourd"]
  },
  
  // Objets divers
  {
    name: "Montre à gousset",
    description: "Montre de poche élégante",
    category: "misc",
    weight: 0,
    tags: ["temps", "élégant", "utilitaire"]
  },
  {
    name: "Flask de whisky",
    description: "Petite flasque métallique remplie d'alcool",
    category: "misc",
    weight: 0,
    tags: ["alcool", "courage", "social"]
  },
  {
    name: "Cigarettes Lucky Strike",
    description: "Paquet de cigarettes populaires",
    category: "misc",
    weight: 0,
    tags: ["tabac", "social", "époque"]
  },
  {
    name: "Symbole sacré",
    description: "Croix, étoile ou autre symbole religieux",
    category: "misc",
    weight: 0,
    tags: ["religion", "protection", "foi"]
  },
  {
    name: "Masque à gaz",
    description: "Protection contre les gaz toxiques",
    category: "misc",
    weight: 2,
    tags: ["protection", "militaire", "gaz"]
  },
  {
    name: "Menottes",
    description: "Entraves métalliques avec clé",
    category: "misc",
    weight: 1,
    tags: ["police", "capture", "métal"]
  },
  {
    name: "Dynamite (bâton)",
    description: "Explosif puissant avec mèche",
    category: "misc",
    weight: 1,
    tags: ["explosif", "dangereux", "illégal"]
  },
  {
    name: "Amulette étrange",
    description: "Pendentif aux propriétés mystérieuses",
    category: "misc",
    weight: 0,
    tags: ["occulte", "mystère", "protection"]
  },
  {
    name: "Carte de visite",
    description: "Carte professionnelle élégante",
    category: "misc",
    weight: 0,
    tags: ["social", "identité", "époque"]
  },
  {
    name: "Sifflet de police",
    description: "Sifflet strident pour appeler à l'aide",
    category: "misc",
    weight: 0,
    tags: ["police", "alarme", "aide"]
  },
  {
    name: "Rations de voyage",
    description: "Nourriture séchée pour plusieurs jours",
    category: "misc",
    weight: 2,
    tags: ["nourriture", "voyage", "survie"]
  },
  {
    name: "Télescope portable",
    description: "Petit télescope pour observer les étoiles",
    category: "misc",
    weight: 3,
    tags: ["astronomie", "observation", "science"]
  },
  {
    name: "Seringue hypodermique",
    description: "Seringue médicale réutilisable",
    category: "misc",
    weight: 0,
    tags: ["médical", "injection", "drogue"]
  },
  {
    name: "Morphine",
    description: "Analgésique puissant en ampoules",
    category: "misc",
    weight: 0,
    tags: ["médical", "drogue", "douleur"]
  },
  {
    name: "Carte au trésor",
    description: "Carte mystérieuse indiquant un lieu secret",
    category: "misc",
    weight: 0,
    tags: ["mystère", "exploration", "indices"]
  }
];

// Fonction pour obtenir les tags uniques
export function getUniqueTags(): string[] {
  const tagsSet = new Set<string>();
  PREDEFINED_ITEMS.forEach(item => {
    item.tags?.forEach(tag => tagsSet.add(tag));
  });
  return Array.from(tagsSet).sort();
}

// Fonction pour filtrer les objets
export function filterItems(
  category?: string,
  searchTerm?: string,
  tags?: string[]
): PredefinedItem[] {
  return PREDEFINED_ITEMS.filter(item => {
    // Filtre par catégorie
    if (category && category !== 'all' && item.category !== category) {
      return false;
    }
    
    // Filtre par terme de recherche
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const inName = item.name.toLowerCase().includes(search);
      const inDesc = item.description.toLowerCase().includes(search);
      const inTags = item.tags?.some(tag => tag.toLowerCase().includes(search));
      if (!inName && !inDesc && !inTags) {
        return false;
      }
    }
    
    // Filtre par tags
    if (tags && tags.length > 0) {
      const hasAllTags = tags.every(tag => item.tags?.includes(tag));
      if (!hasAllTags) {
        return false;
      }
    }
    
    return true;
  });
}