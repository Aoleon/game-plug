import { storage } from "./storage";
import { avatarFileExists } from "./image-storage";

export async function reconcileCharacterAvatars() {
  console.log("Starting avatar reconciliation...");
  
  try {
    const allCharacters = await storage.getAllCharacters();
    let missingCount = 0;
    let fixedCount = 0;
    
    for (const character of allCharacters) {
      if (character.avatarUrl) {
        // Check if avatar file exists
        if (!avatarFileExists(character.avatarUrl)) {
          console.log(`Missing avatar for character ${character.name} (${character.id}): ${character.avatarUrl}`);
          missingCount++;
          
          // Clear the invalid avatar URL
          await storage.updateCharacter(character.id, { avatarUrl: null });
          fixedCount++;
          console.log(`  -> Cleared invalid avatar URL`);
        }
      }
    }
    
    console.log(`Avatar reconciliation complete:`);
    console.log(`  - Total characters checked: ${allCharacters.length}`);
    console.log(`  - Missing avatars found: ${missingCount}`);
    console.log(`  - Invalid URLs cleared: ${fixedCount}`);
    
  } catch (error) {
    console.error("Error during avatar reconciliation:", error);
  }
}
