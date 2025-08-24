import { storage } from "./storage";
import type { Character } from "@shared/schema";

export interface BuffEffect {
  type: 'heal' | 'sanity' | 'magic' | 'luck' | 'skill' | 'custom';
  value: number;
  duration?: number;
  description?: string;
}

/**
 * Apply healing effects to a character
 */
export async function applyHealing(
  character: Character,
  healAmount: number,
  description?: string
): Promise<{ finalHp: number; amountHealed: number }> {
  const currentHp = character.hitPoints;
  const maxHp = character.maxHitPoints;
  
  // Calculate actual healing (can't exceed max HP)
  const finalHp = Math.min(currentHp + healAmount, maxHp);
  const amountHealed = finalHp - currentHp;
  
  // Update character HP
  await storage.updateCharacter(character.id, {
    hitPoints: finalHp
  });
  
  // Record the healing effect
  await storage.addActiveEffect({
    characterId: character.id,
    name: description || `Soin (+${amountHealed} PV)`,
    description: `Récupération de ${amountHealed} points de vie`,
    type: "buff",
    value: amountHealed.toString(),
    duration: 0
  });
  
  return { finalHp, amountHealed };
}

/**
 * Apply sanity recovery to a character
 */
export async function applySanityRecovery(
  character: Character,
  sanityAmount: number,
  description?: string
): Promise<{ finalSanity: number; amountRecovered: number }> {
  const currentSanity = character.sanity;
  const maxSanity = character.maxSanity;
  
  // Calculate actual recovery (can't exceed max sanity)
  const finalSanity = Math.min(currentSanity + sanityAmount, maxSanity);
  const amountRecovered = finalSanity - currentSanity;
  
  // Update character sanity
  await storage.updateCharacter(character.id, {
    sanity: finalSanity
  });
  
  // Record the recovery effect
  await storage.addActiveEffect({
    characterId: character.id,
    name: description || `Récupération Mentale (+${amountRecovered} SAN)`,
    description: `Récupération de ${amountRecovered} points de sanité mentale`,
    type: "buff",
    value: amountRecovered.toString(),
    duration: 0
  });
  
  return { finalSanity, amountRecovered };
}

/**
 * Apply magic points recovery to a character
 */
export async function applyMagicRecovery(
  character: Character,
  magicAmount: number,
  description?: string
): Promise<{ finalMagic: number; amountRecovered: number }> {
  const currentMagic = character.magicPoints;
  const maxMagic = character.maxMagicPoints;
  
  // Calculate actual recovery (can't exceed max magic)
  const finalMagic = Math.min(currentMagic + magicAmount, maxMagic);
  const amountRecovered = finalMagic - currentMagic;
  
  // Update character magic points
  await storage.updateCharacter(character.id, {
    magicPoints: finalMagic
  });
  
  // Record the recovery effect
  await storage.addActiveEffect({
    characterId: character.id,
    name: description || `Récupération Magique (+${amountRecovered} PM)`,
    description: `Récupération de ${amountRecovered} points de magie`,
    type: "buff",
    value: amountRecovered.toString(),
    duration: 0
  });
  
  return { finalMagic, amountRecovered };
}

/**
 * Apply temporary luck increase to a character
 */
export async function applyLuckBoost(
  character: Character,
  luckAmount: number,
  duration: number = 24,
  description?: string
): Promise<{ finalLuck: number; amountIncreased: number }> {
  const currentLuck = character.luck;
  
  // Calculate new luck (max 99)
  const finalLuck = Math.min(currentLuck + luckAmount, 99);
  const amountIncreased = finalLuck - currentLuck;
  
  // Update character luck
  await storage.updateCharacter(character.id, {
    luck: finalLuck
  });
  
  // Record the luck boost effect with duration
  await storage.addActiveEffect({
    characterId: character.id,
    name: description || `Chance Améliorée (+${amountIncreased})`,
    description: `Augmentation temporaire de ${amountIncreased} points de chance`,
    type: "buff",
    value: amountIncreased.toString(),
    duration: duration
  });
  
  return { finalLuck, amountIncreased };
}

/**
 * Apply skill bonus to a character
 */
export async function applySkillBonus(
  character: Character,
  skillBonus: number,
  duration: number = 1,
  description?: string
): Promise<void> {
  // Record the skill bonus effect
  await storage.addActiveEffect({
    characterId: character.id,
    name: description || `Bonus de Compétence (+${skillBonus}%)`,
    description: `Bonus de ${skillBonus}% aux jets de compétence`,
    type: "buff",
    value: skillBonus.toString(),
    duration: duration
  });
}

/**
 * Process natural healing over time
 */
export async function processNaturalHealing(
  character: Character,
  restType: 'short' | 'long' | 'extended'
): Promise<{ hpRecovered: number; sanityRecovered: number }> {
  let hpRecovered = 0;
  let sanityRecovered = 0;
  
  switch (restType) {
    case 'short':
      // Short rest: 1 HP
      hpRecovered = 1;
      break;
      
    case 'long':
      // Long rest: 1d4 HP, 1 SAN
      hpRecovered = Math.floor(Math.random() * 4) + 1;
      sanityRecovered = 1;
      break;
      
    case 'extended':
      // Extended rest: 2d4+2 HP, 1d4 SAN
      hpRecovered = (Math.floor(Math.random() * 4) + 1) + 
                    (Math.floor(Math.random() * 4) + 1) + 2;
      sanityRecovered = Math.floor(Math.random() * 4) + 1;
      break;
  }
  
  // Apply healing
  if (hpRecovered > 0) {
    await applyHealing(character, hpRecovered, `Repos ${restType === 'short' ? 'court' : restType === 'long' ? 'long' : 'étendu'}`);
  }
  
  // Apply sanity recovery
  if (sanityRecovered > 0) {
    await applySanityRecovery(character, sanityRecovered, `Récupération mentale (repos)`);
  }
  
  return { hpRecovered, sanityRecovered };
}

/**
 * Apply medical treatment based on skill success
 */
export async function applyMedicalTreatment(
  character: Character,
  treatmentType: 'first_aid' | 'medicine' | 'surgery',
  skillSuccess: boolean,
  criticalSuccess: boolean = false
): Promise<{ hpRecovered: number; success: boolean }> {
  if (!skillSuccess) {
    return { hpRecovered: 0, success: false };
  }
  
  let hpRecovered = 0;
  let description = "";
  
  switch (treatmentType) {
    case 'first_aid':
      // First Aid: 1d3 HP (or 2d3 on critical)
      hpRecovered = criticalSuccess ? 
        (Math.floor(Math.random() * 3) + 1) + (Math.floor(Math.random() * 3) + 1) :
        (Math.floor(Math.random() * 3) + 1);
      description = "Premiers soins" + (criticalSuccess ? " excellents" : "");
      break;
      
    case 'medicine':
      // Medicine: 1d6+1 HP (or 2d6+2 on critical)
      hpRecovered = criticalSuccess ?
        (Math.floor(Math.random() * 6) + 1) + (Math.floor(Math.random() * 6) + 1) + 2 :
        (Math.floor(Math.random() * 6) + 1) + 1;
      description = "Traitement médical" + (criticalSuccess ? " expert" : "");
      break;
      
    case 'surgery':
      // Surgery: 2d6+2 HP (or 3d6+3 on critical)
      if (criticalSuccess) {
        hpRecovered = (Math.floor(Math.random() * 6) + 1) + 
                     (Math.floor(Math.random() * 6) + 1) + 
                     (Math.floor(Math.random() * 6) + 1) + 3;
        description = "Chirurgie magistrale";
      } else {
        hpRecovered = (Math.floor(Math.random() * 6) + 1) + 
                     (Math.floor(Math.random() * 6) + 1) + 2;
        description = "Intervention chirurgicale";
      }
      break;
  }
  
  await applyHealing(character, hpRecovered, description);
  
  return { hpRecovered, success: true };
}

/**
 * Apply psychological treatment based on skill success
 */
export async function applyPsychologicalTreatment(
  character: Character,
  treatmentType: 'reassurance' | 'psychoanalysis' | 'group_therapy' | 'asylum',
  skillSuccess: boolean,
  criticalSuccess: boolean = false
): Promise<{ sanityRecovered: number; success: boolean }> {
  if (!skillSuccess) {
    return { sanityRecovered: 0, success: false };
  }
  
  let sanityRecovered = 0;
  let description = "";
  
  switch (treatmentType) {
    case 'reassurance':
      // Simple reassurance: 1 SAN (or 2 on critical)
      sanityRecovered = criticalSuccess ? 2 : 1;
      description = "Réconfort" + (criticalSuccess ? " profond" : "");
      break;
      
    case 'psychoanalysis':
      // Psychoanalysis: 1d4 SAN (or 2d4 on critical)
      sanityRecovered = criticalSuccess ?
        (Math.floor(Math.random() * 4) + 1) + (Math.floor(Math.random() * 4) + 1) :
        (Math.floor(Math.random() * 4) + 1);
      description = "Psychanalyse" + (criticalSuccess ? " approfondie" : "");
      break;
      
    case 'group_therapy':
      // Group therapy: 1d6 SAN (or 2d6 on critical)
      sanityRecovered = criticalSuccess ?
        (Math.floor(Math.random() * 6) + 1) + (Math.floor(Math.random() * 6) + 1) :
        (Math.floor(Math.random() * 6) + 1);
      description = "Thérapie de groupe" + (criticalSuccess ? " intensive" : "");
      break;
      
    case 'asylum':
      // Asylum treatment: 2d6 SAN (or 3d6 on critical)
      if (criticalSuccess) {
        sanityRecovered = (Math.floor(Math.random() * 6) + 1) + 
                         (Math.floor(Math.random() * 6) + 1) + 
                         (Math.floor(Math.random() * 6) + 1);
        description = "Traitement psychiatrique révolutionnaire";
      } else {
        sanityRecovered = (Math.floor(Math.random() * 6) + 1) + 
                         (Math.floor(Math.random() * 6) + 1);
        description = "Traitement en asile";
      }
      break;
  }
  
  await applySanityRecovery(character, sanityRecovered, description);
  
  return { sanityRecovered, success: true };
}