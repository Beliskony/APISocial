import { Response } from 'express';
import { inject, injectable } from 'inversify';
import { TYPES } from '../config/TYPES';
import { MediaService } from '../services/Media.service';
import { AuthRequest } from '../middlewares/Auth.Types';

@injectable()
export class MediaController {
  constructor(
    @inject(TYPES.MediaService) private mediaService: MediaService
  ) {}

  async upload(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?._id;
      if (!userId) {
        res.status(401).json({ 
          success: false,
          message: 'Non autorisé' 
        });
        return;
      }

      if (!req.files || (Object.keys(req.files).length === 0)) {
        res.status(400).json({ 
          success: false,
          message: 'Aucun fichier fourni' 
        });
        return;
      }

      const media: { images: string[]; videos: string[] } = { images: [], videos: [] };

      const files = req.files as {
        [fieldname: string]: Express.Multer.File[];
      };

      // Upload images
      if (files.images) {
        for (const file of files.images) {
          const result = await this.mediaService.uploadPublication(userId, file.buffer);
          if (result.type === 'image') {
            media.images.push(result.url);
          }
        }
      }

      // Upload videos
      if (files.videos) {
        for (const file of files.videos) {
          const result = await this.mediaService.uploadPublication(userId, file.buffer);
          if (result.type === 'video') {
            media.videos.push(result.url);
          }
        }
      }

      res.status(200).json({ 
        success: true,
        message: 'Médias uploadés avec succès',
        data: media 
      });
    } catch (error) {
      console.error('Erreur upload médias:', error);
      res.status(500).json({ 
        success: false,
        message: 'Échec de l\'upload', 
        error: error instanceof Error ? error.message : error 
      });
    }
  }

  async uploadStory(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?._id;
      if (!userId) {
        res.status(401).json({ 
          success: false,
          message: 'Non autorisé' 
        });
        return;
      }

      if (!req.file) {
        res.status(400).json({ 
          success: false,
          message: 'Aucun fichier fourni' 
        });
        return;
      }

      const file = req.file;
      
      const result = await this.mediaService.uploadStory(userId, file.buffer);
      
      res.status(200).json({ 
        success: true,
        message: 'Story uploadée avec succès',
        data: {
          url: result.url,
          type: result.type
        }
      });
    } catch (error) {
      console.error('Erreur upload story:', error);
      res.status(500).json({ 
        success: false,
        message: 'Échec de l\'upload de la story', 
        error: error instanceof Error ? error.message : error 
      });
    }
  }

  // ✅ Méthode pour supprimer un média
  async deleteMedia(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?._id;
      const { publicId } = req.params;

      if (!userId) {
        res.status(401).json({ 
          success: false,
          message: 'Non autorisé' 
        });
        return;
      }

      await this.mediaService.deleteFromCloudinary(publicId);
      
      res.status(200).json({ 
        success: true,
        message: 'Média supprimé avec succès'
      });
    } catch (error) {
      console.error('Erreur suppression média:', error);
      res.status(500).json({ 
        success: false,
        message: 'Échec de la suppression du média', 
        error: error instanceof Error ? error.message : error 
      });
    }
  }
}