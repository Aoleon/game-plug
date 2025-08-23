// Call of Cthulhu 7th Edition dice system utilities

export interface DiceResult {
  total: number;
  rolls: number[];
  formula: string;
}

export interface CharacterStats {
  strength: number;
  constitution: number;
  size: number;
  dexterity: number;
  appearance: number;
  intelligence: number;
  power: number;
  education: number;
  luck: number;
}

export interface DerivedStats {
  hitPoints: number;
  sanity: number;
  maxSanity: number;
  magicPoints: number;
  damageBonus: string;
  build: number;
  movement: number;
}

/**
 * Roll dice using standard notation (e.g., "3d6", "1d100", "2d4+2")
 */
export function rollDice(formula: string): DiceResult {
  const cleanFormula = formula.toLowerCase().trim();
  
  // Handle simple numbers
  if (/^\d+$/.test(cleanFormula)) {
    const value = parseInt(cleanFormula);
    return { total: value, rolls: [value], formula };
  }
  
  // Parse dice notation: XdY+Z or XdY-Z
  const match = cleanFormula.match(/^(\d+)?d(\d+)([+-]\d+)?$/);
  if (!match) {
    throw new Error(`Invalid dice formula: ${formula}`);
  }
  
  const numDice = parseInt(match[1] || '1');
  const numSides = parseInt(match[2]);
  const modifier = parseInt(match[3] || '0');
  
  if (numDice < 1 || numDice > 100) {
    throw new Error('Number of dice must be between 1 and 100');
  }
  if (numSides < 2 || numSides > 1000) {
    throw new Error('Number of sides must be between 2 and 1000');
  }
  
  const rolls: number[] = [];
  for (let i = 0; i < numDice; i++) {
    rolls.push(Math.floor(Math.random() * numSides) + 1);
  }
  
  const total = rolls.reduce((sum, roll) => sum + roll, 0) + modifier;
  
  return { total, rolls, formula };
}

/**
 * Roll characteristics according to Call of Cthulhu 7th edition rules
 */
export function rollCharacteristics(): CharacterStats {
  // Standard characteristics use 3d6×5
  const roll3d6x5 = () => rollDice('3d6').total * 5;
  
  // INT, SIZ, and EDU use (2d6+6)×5
  const roll2d6plus6x5 = () => (rollDice('2d6').total + 6) * 5;
  
  return {
    strength: roll3d6x5(),
    constitution: roll3d6x5(),
    size: roll2d6plus6x5(),
    dexterity: roll3d6x5(),
    appearance: roll3d6x5(),
    intelligence: roll2d6plus6x5(),
    power: roll3d6x5(),
    education: roll2d6plus6x5(),
    luck: roll3d6x5(),
  };
}

/**
 * Calculate derived statistics from characteristics
 */
export function calculateDerivedStats(characteristics: CharacterStats): DerivedStats {
  const { strength, constitution, size, power, dexterity } = characteristics;
  
  // Hit Points = (CON + SIZ) / 10 (rounded down)
  const hitPoints = Math.floor((constitution + size) / 10);
  
  // Starting Sanity = POW
  const sanity = power;
  const maxSanity = 99; // Maximum possible sanity (before Cthulhu Mythos knowledge)
  
  // Magic Points = POW / 5 (rounded down)
  const magicPoints = Math.floor(power / 5);
  
  // Damage Bonus and Build based on STR + SIZ
  const strSizTotal = strength + size;
  let damageBonus: string;
  let build: number;
  
  if (strSizTotal < 65) {
    damageBonus = '-2';
    build = -2;
  } else if (strSizTotal < 85) {
    damageBonus = '-1';
    build = -1;
  } else if (strSizTotal < 125) {
    damageBonus = '0';
    build = 0;
  } else if (strSizTotal < 165) {
    damageBonus = '+1d4';
    build = 1;
  } else if (strSizTotal < 205) {
    damageBonus = '+1d6';
    build = 2;
  } else {
    damageBonus = '+2d6';
    build = 3;
  }
  
  // Movement rate based on STR, DEX, and SIZ
  let movement = 8; // Base movement
  if (strength < size && dexterity < size) {
    movement = 7;
  } else if (strength > size && dexterity > size) {
    movement = 9;
  }
  
  return {
    hitPoints,
    sanity,
    maxSanity,
    magicPoints,
    damageBonus,
    build,
    movement,
  };
}

/**
 * Determine success level for a percentile roll
 */
export function determineSuccessLevel(roll: number, skillValue: number): 'extreme_success' | 'hard_success' | 'success' | 'failure' {
  if (roll <= skillValue / 5) {
    return 'extreme_success';
  } else if (roll <= skillValue / 2) {
    return 'hard_success';
  } else if (roll <= skillValue) {
    return 'success';
  } else {
    return 'failure';
  }
}

/**
 * Roll for sanity loss using Call of Cthulhu notation (e.g., "1d4/1d8")
 */
export function rollSanityLoss(formula: string, success: boolean): DiceResult {
  const [successLoss, failureLoss] = formula.split('/');
  const lossFormula = success ? successLoss : failureLoss;
  return rollDice(lossFormula);
}

/**
 * Parse dice formula to validate it's correct
 */
export function parseDiceFormula(formula: string): { numDice: number; numSides: number; modifier: number } | null {
  const cleanFormula = formula.toLowerCase().trim();
  const match = cleanFormula.match(/^(\d+)?d(\d+)([+-]\d+)?$/);
  
  if (!match) {
    return null;
  }
  
  return {
    numDice: parseInt(match[1] || '1'),
    numSides: parseInt(match[2]),
    modifier: parseInt(match[3] || '0'),
  };
}

/**
 * Generate random characteristic values for quick character creation
 */
export function generateQuickCharacteristics(): CharacterStats {
  // Alternative method using fixed point allocation for quicker generation
  const baseValues = [40, 50, 50, 50, 60, 60, 70, 80];
  const shuffled = baseValues.sort(() => Math.random() - 0.5);
  
  return {
    strength: shuffled[0],
    constitution: shuffled[1],
    size: shuffled[2],
    dexterity: shuffled[3],
    appearance: shuffled[4],
    intelligence: shuffled[5],
    power: shuffled[6],
    education: shuffled[7],
    luck: rollDice('3d6').total * 5, // Luck is always rolled
  };
}
