import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

export async function generateCharacterAvatar(
  description: string, 
  characterName: string, 
  occupation?: string, 
  age?: number
): Promise<{ url: string }> {
  // Build a rich, immersive prompt for Lovecraftian 1920s atmosphere
  const occupationContext = occupation ? `working as a ${occupation.toLowerCase()}, ` : '';
  const ageContext = age ? `aged ${age}, ` : '';
  
  const basePrompt = `Professional studio portrait photograph from 1920s New England. ${characterName}, ${ageContext}${occupationContext}an investigator of the unknown. ${description}`;
  
  const styleDetails = `
Photography style: Vintage 1920s studio portrait with dramatic chiaroscuro lighting, deep shadows and highlights that suggest mystery and foreboding. Sepia-toned or rich black and white with excellent contrast.

Setting: Elegant but slightly unsettling 1920s interior - dark wood paneling, antique furniture, perhaps old books or mysterious artifacts subtly visible in the background.

Mood: Sophisticated yet haunted - the subject should have an intelligent, contemplative expression with a hint of someone who has seen things beyond normal understanding. Eyes that suggest depth of knowledge and perhaps a touch of unease.

Clothing: Meticulously period-accurate 1920s attire - three-piece suits with waistcoats for men, elegant dresses or professional attire for women. Rich fabrics, proper tailoring, authentic accessories like pocket watches, brooches, or distinctive eyewear.

Quality: Hyperrealistic, museum-quality portrait that could have been taken by the finest photographers of the era. Sharp focus on the subject with beautiful depth of field.

Atmosphere: Subtly gothic and mysterious without being overtly supernatural - the kind of person who might investigate strange occurrences in Arkham or Dunwich.

Avoid: Any modern elements, bright cheerful lighting, contemporary clothing, digital artifacts, overly dramatic poses.`;

  const fullPrompt = `${basePrompt}\n\n${styleDetails}`;

  try {
    const response = await openai.images.generate({
      model: "dall-e-3", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      prompt: fullPrompt,
      n: 1,
      size: "1024x1024",
      quality: "hd", // Use HD quality for better results
    });

    return { url: response.data?.[0]?.url || "" };
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
