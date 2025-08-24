import { storage } from "./storage";
import { downloadAndSaveImage } from "./image-storage";

export async function autoMigrateAvatarsOnStartup() {
  try {
    console.log("Checking for avatars to migrate...");
    
    // Get all characters with external avatar URLs
    const allCharacters = await storage.getAllCharacters();
    const charactersToMigrate = allCharacters.filter((character: any) => 
      character.avatarUrl && 
      !character.avatarUrl.startsWith('/avatars/') &&
      (character.avatarUrl.includes('oaidalleapiprodscus') || 
       character.avatarUrl.includes('openai') ||
       character.avatarUrl.includes('dalle'))
    );
    
    if (charactersToMigrate.length === 0) {
      console.log("No external avatars found to migrate.");
      return;
    }
    
    console.log(`Found ${charactersToMigrate.length} avatars to migrate to local storage`);
    
    let successCount = 0;
    let failCount = 0;
    
    // Process avatars one by one with delay
    for (const character of charactersToMigrate) {
      try {
        console.log(`Migrating avatar for ${character.name}...`);
        const localUrl = await downloadAndSaveImage(character.avatarUrl!, character.id);
        
        await storage.updateCharacter(character.id, {
          avatarUrl: localUrl
        });
        
        successCount++;
        console.log(`✓ Migrated avatar for ${character.name}`);
      } catch (error) {
        failCount++;
        console.error(`✗ Failed to migrate avatar for ${character.name}:`, error);
      }
      
      // Small delay between migrations
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log(`Avatar migration completed: ${successCount} successful, ${failCount} failed`);
  } catch (error) {
    console.error("Error during automatic avatar migration:", error);
  }
}