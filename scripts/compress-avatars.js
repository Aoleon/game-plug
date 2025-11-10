/**
 * Script pour compresser les avatars
 * Utilise sharp pour optimiser les images PNG
 * 
 * Installation: npm install --save-dev sharp
 * Usage: node scripts/compress-avatars.js
 */

import sharp from 'sharp';
import { readdir, stat } from 'fs/promises';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const AVATAR_DIR = join(__dirname, '..', 'public', 'avatars');
const MAX_WIDTH = 400; // Largeur max pour les avatars
const QUALITY = 80; // Qualité pour WebP (1-100)

async function compressImage(filePath) {
  const ext = extname(filePath).toLowerCase();
  
  if (ext !== '.png' && ext !== '.jpg' && ext !== '.jpeg') {
    return;
  }
  
  try {
    const stats = await stat(filePath);
    const sizeBefore = (stats.size / 1024 / 1024).toFixed(2);
    
    console.log(`📸 Compression de ${filePath}...`);
    console.log(`   Taille avant: ${sizeBefore}MB`);
    
    // Créer une version WebP optimisée
    const webpPath = filePath.replace(ext, '.webp');
    await sharp(filePath)
      .resize(MAX_WIDTH, MAX_WIDTH, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .webp({ quality: QUALITY })
      .toFile(webpPath);
    
    // Optimiser le PNG original aussi
    const buffer = await sharp(filePath)
      .resize(MAX_WIDTH, MAX_WIDTH, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .png({ 
        quality: QUALITY,
        compressionLevel: 9,
        palette: true // Utilise une palette pour réduire la taille
      })
      .toBuffer();
    
    await sharp(buffer).toFile(filePath + '.tmp');
    
    const statsWebp = await stat(webpPath);
    const sizeWebp = (statsWebp.size / 1024).toFixed(2);
    
    const statsTmp = await stat(filePath + '.tmp');
    const sizeAfter = (statsTmp.size / 1024).toFixed(2);
    
    console.log(`   ✅ WebP créé: ${sizeWebp}KB`);
    console.log(`   ✅ PNG optimisé: ${sizeAfter}KB`);
    console.log(`   💾 Économie: ${(sizeBefore * 1024 - sizeAfter).toFixed(2)}KB\n`);
    
    // Remplacer l'original par la version optimisée
    // Note: Décommenter la ligne suivante pour appliquer les changements
    // await rename(filePath + '.tmp', filePath);
    
  } catch (error) {
    console.error(`❌ Erreur lors de la compression de ${filePath}:`, error.message);
  }
}

async function compressAllAvatars() {
  console.log('🚀 Début de la compression des avatars...\n');
  
  try {
    const files = await readdir(AVATAR_DIR);
    
    for (const file of files) {
      const filePath = join(AVATAR_DIR, file);
      const stats = await stat(filePath);
      
      if (stats.isFile()) {
        await compressImage(filePath);
      }
    }
    
    console.log('✨ Compression terminée!');
    console.log('\n⚠️  Note: Les fichiers .tmp ont été créés mais pas appliqués.');
    console.log('   Décommentez la ligne rename() dans le script pour appliquer les changements.');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    process.exit(1);
  }
}

// Vérifier si sharp est installé
try {
  await import('sharp');
  compressAllAvatars();
} catch (error) {
  console.error('❌ Sharp n\'est pas installé!');
  console.log('📦 Installez-le avec: npm install --save-dev sharp');
  process.exit(1);
}
