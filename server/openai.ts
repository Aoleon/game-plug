import OpenAI from "openai";
import { downloadAndSaveImage } from "./image-storage";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

export async function generateSceneImage(
  prompt: string
): Promise<{ url: string }> {
  // Build a rich, atmospheric prompt for GameBoard projection
  const enhancedPrompt = `${prompt}

Artistic style: Dark atmospheric scene painting in the style of 1920s horror fiction and Lovecraftian tales. Dramatic lighting with deep shadows and mysterious atmosphere. Detailed environment suitable for tabletop RPG visualization. Rich textures, vintage mood, cinematic composition. Highly detailed digital artwork with gothic and noir influences.`;

  try {
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: enhancedPrompt,
      n: 1,
      size: "1792x1024", // Wider format for projection
      quality: "hd", // High quality for projection
    });

    const tempUrl = response.data?.[0]?.url || "";
    return { url: tempUrl };
  } catch (error) {
    console.error("Error generating scene image:", error);
    throw new Error("Failed to generate scene image");
  }
}

export async function generateCharacterAvatar(
  description: string, 
  characterName: string, 
  occupation?: string, 
  age?: number,
  characterId?: string
): Promise<{ url: string }> {
  // Build a rich, immersive prompt for Lovecraftian 1920s atmosphere
  const occupationContext = occupation ? `working as a ${occupation.toLowerCase()}, ` : '';
  const ageContext = age ? `aged ${age}, ` : '';
  
  const basePrompt = `Professional studio portrait photograph from 1920s New England. ${characterName}, ${ageContext}${occupationContext}an investigator of the unknown. ${description}`;
  
  const styleDetails = `
Vintage 1920s portrait photograph with dramatic noir lighting. ${occupation ? `Dressed as a ${occupation}. ` : ''}Period-accurate 1920s attire, mysterious atmosphere suggesting someone who investigates the unknown. Dark, gothic mood with deep shadows. Professional studio quality, sepia-toned or black and white.`;

  const fullPrompt = `${basePrompt}\n\n${styleDetails}`;

  try {
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: fullPrompt,
      n: 1,
      size: "1024x1024", // DALL-E 3 minimum supported size
      quality: "standard", // Standard quality for faster generation
    });

    const tempUrl = response.data?.[0]?.url || "";
    
    // If we have a character ID, download and save the image permanently
    if (tempUrl && characterId) {
      try {
        const permanentUrl = await downloadAndSaveImage(tempUrl, characterId);
        return { url: permanentUrl };
      } catch (error) {
        console.error("Failed to save image permanently, returning temporary URL:", error);
        return { url: tempUrl };
      }
    }

    return { url: tempUrl };
  } catch (error) {
    console.error("Error generating character avatar:", error);
    throw new Error("Failed to generate character avatar");
  }
}

export async function generatePhobiaDescription(phobiaName: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert on Lovecraftian horror and Call of Cthulhu RPG. Generate atmospheric descriptions for phobias that fit the cosmic horror theme."
        },
        {
          role: "user",
          content: `Generate a brief, atmospheric description for the phobia "${phobiaName}" in the context of Call of Cthulhu. Keep it under 100 words and focus on how it manifests in gameplay situations. Make it evocative of cosmic horror themes.`
        }
      ],
    });

    return response.choices[0].message.content || `A deep, irrational fear of ${phobiaName.toLowerCase()}.`;
  } catch (error) {
    console.error("Error generating phobia description:", error);
    return `A deep, irrational fear of ${phobiaName.toLowerCase()}.`;
  }
}

export async function generateManiaDescription(maniaName: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert on Lovecraftian horror and Call of Cthulhu RPG. Generate atmospheric descriptions for manias that fit the cosmic horror theme."
        },
        {
          role: "user",
          content: `Generate a brief, atmospheric description for the mania "${maniaName}" in the context of Call of Cthulhu. Keep it under 100 words and focus on how it manifests as compulsive behavior. Make it evocative of cosmic horror themes.`
        }
      ],
    });

    return response.choices[0].message.content || `An obsessive compulsion related to ${maniaName.toLowerCase()}.`;
  } catch (error) {
    console.error("Error generating mania description:", error);
    return `An obsessive compulsion related to ${maniaName.toLowerCase()}.`;
  }
}
