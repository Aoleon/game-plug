import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

export async function generateCharacterAvatar(description: string, characterName: string): Promise<{ url: string }> {
  const prompt = `A vintage 1920s photographic portrait of ${characterName}. ${description}. Style: Formal studio portrait from the 1920s era, sepia-toned or black and white, professional lighting, period-appropriate clothing and hairstyles. High quality, realistic, dignified pose suitable for a Call of Cthulhu RPG character. Avoid modern elements, maintain historical accuracy to the 1920s period.`;

  try {
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: prompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
    });

    return { url: response.data[0].url! };
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
