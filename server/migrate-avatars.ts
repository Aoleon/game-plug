import { storage } from "./storage";
import { downloadAndSaveImage } from "./image-storage";

export async function migrateExistingAvatars() {
  try {
    console.log("Starting avatar migration...");
    
    // Get all characters with avatars that are external URLs
    const allCharacters = await storage.getAllCharacters();
    const charactersToMigrate = allCharacters.filter((character: any) => 
      character.avatarUrl && 
      !character.avatarUrl.startsWith('/avatars/') &&
      (character.avatarUrl.includes('oaidalleapiprodscus') || 
       character.avatarUrl.includes('openai') ||
       character.avatarUrl.includes('dalle'))
    );
    
    console.log(`Found ${charactersToMigrate.length} characters with external avatar URLs to migrate`);
    
    let successCount = 0;
    let failCount = 0;
    
    for (const character of charactersToMigrate) {
      try {
        console.log(`Migrating avatar for ${character.name} (${character.id})`);
        
        // Skip if avatarUrl is null (should not happen due to filter, but be safe)
        if (!character.avatarUrl) {
          console.log(`Skipping ${character.name} - no avatar URL`);
          continue;
        }
        
        // Download and save the image
        const localUrl = await downloadAndSaveImage(character.avatarUrl, character.id);
        
        // Update the character with the new local URL
        await storage.updateCharacter(character.id, {
          avatarUrl: localUrl
        });
        
        successCount++;
        console.log(`✓ Successfully migrated avatar for ${character.name}`);
      } catch (error) {
        failCount++;
        console.error(`✗ Failed to migrate avatar for ${character.name}:`, error);
      }
      
      // Small delay to avoid overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log(`\nMigration complete: ${successCount} successful, ${failCount} failed`);
    return { success: successCount, failed: failCount, total: charactersToMigrate.length };
  } catch (error) {
    console.error("Error during migration:", error);
    throw error;
  }
}