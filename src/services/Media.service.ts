import { injectable } from 'inversify';
import cloudinary from '../config/cloudinary';
import { v4 as uuidv4 } from 'uuid';

@injectable()
export class MediaService {
  async uploadToCloudinary(fileBuffer: Buffer, userId: String, mediaType: 'publication' | 'story'): Promise<{ url: string; type: string }> {
  
    // Générer la date actuelle pour le dossier
    const now = new Date();
    const dateFolder = now.toLocaleDateString('fr-FR').replace(/\//g, '-'); // Format jj-mm-aaaa
    // Construire le chemin du dossier
    const folderPath = `socialApp/${userId}/${mediaType}/${dateFolder}`;

    return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'auto',
        folder: folderPath,
        public_id: uuidv4(),
      },
      (error, result) => {
        if (error || !result) return reject(error);
        resolve({
          url: result.secure_url,
          type: result.resource_type, // 'image' ou 'video'
        });
      }
    );
    stream.end(fileBuffer);
  });
}
 // Méthodes spécifiques pour plus de clarté
  async uploadPublication(userId: string, fileBuffer: Buffer) {
    return this.uploadToCloudinary(fileBuffer, userId, 'publication');
  }

  async uploadStory(userId: string, fileBuffer: Buffer) {
    return this.uploadToCloudinary(fileBuffer, userId, 'story');
  }

  // Optionnel : Méthode pour supprimer des médias
  async deleteFromCloudinary(publicId: string) {
    return cloudinary.uploader.destroy(publicId);
  }

}
