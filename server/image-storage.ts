import fs from "fs";
import path from "path";
import crypto from "crypto";

const AVATARS_DIR = path.join(process.cwd(), "public", "avatars");

// Ensure avatars directory exists
if (!fs.existsSync(AVATARS_DIR)) {
  fs.mkdirSync(AVATARS_DIR, { recursive: true });
}

export async function downloadAndSaveImage(imageUrl: string, characterId: string): Promise<string> {
  try {
    // Fetch the image from the URL
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    // Get image data as buffer
    const buffer = await response.arrayBuffer();
    const imageBuffer = Buffer.from(buffer);

    // Generate unique filename using character ID and timestamp
    const timestamp = Date.now();
    const hash = crypto.createHash('md5').update(`${characterId}-${timestamp}`).digest('hex').substring(0, 8);
    const filename = `avatar-${characterId}-${hash}.png`;
    const filepath = path.join(AVATARS_DIR, filename);

    // Save image to disk
    fs.writeFileSync(filepath, imageBuffer);

    // Return the relative URL that will be served by Express
    return `/avatars/${filename}`;
  } catch (error) {
    console.error("Error downloading and saving image:", error);
    throw new Error("Failed to save avatar image");
  }
}

export async function deleteAvatar(avatarUrl: string): Promise<void> {
  try {
    if (!avatarUrl || !avatarUrl.startsWith('/avatars/')) {
      return; // Not a local avatar URL
    }

    const filename = avatarUrl.replace('/avatars/', '');
    const filepath = path.join(AVATARS_DIR, filename);

    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }
  } catch (error) {
    console.error("Error deleting avatar:", error);
  }
}

export function avatarFileExists(avatarUrl: string): boolean {
  try {
    if (!avatarUrl || !avatarUrl.startsWith('/avatars/')) {
      return false; // Not a local avatar URL
    }

    const filename = avatarUrl.replace('/avatars/', '');
    const filepath = path.join(AVATARS_DIR, filename);

    return fs.existsSync(filepath);
  } catch (error) {
    console.error("Error checking avatar existence:", error);
    return false;
  }
}

export function copyAvatar(sourceAvatarUrl: string, targetCharacterId: string): string | null {
  try {
    if (!sourceAvatarUrl || !sourceAvatarUrl.startsWith('/avatars/')) {
      return null; // Not a local avatar URL
    }

    const sourceFilename = sourceAvatarUrl.replace('/avatars/', '');
    const sourceFilepath = path.join(AVATARS_DIR, sourceFilename);

    // Check if source file exists
    if (!fs.existsSync(sourceFilepath)) {
      console.error(`Source avatar not found: ${sourceFilepath}`);
      return null;
    }

    // Generate new filename for target character
    const timestamp = Date.now();
    const hash = crypto.createHash('md5').update(`${targetCharacterId}-${timestamp}`).digest('hex').substring(0, 8);
    const targetFilename = `avatar-${targetCharacterId}-${hash}.png`;
    const targetFilepath = path.join(AVATARS_DIR, targetFilename);

    // Copy file
    fs.copyFileSync(sourceFilepath, targetFilepath);

    // Return the new relative URL
    return `/avatars/${targetFilename}`;
  } catch (error) {
    console.error("Error copying avatar:", error);
    return null;
  }
}