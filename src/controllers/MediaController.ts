import { Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import { TYPES } from '../config/TYPES';
import { MediaService } from '../services/Media.service';

@injectable()
export class MediaController {
  constructor(
    @inject(TYPES.MediaService) private mediaService: MediaService
  ) {}

  async upload(req: Request, res: Response): Promise<void> {
    try {
      if (!req.files || (Object.keys(req.files).length === 0)) {
        res.status(400).json({ message: 'No files provided' });
        return;
      }

      const media: { images: string[]; videos: string[] } = { images: [], videos: [] };

      // req.files est typé comme any, donc un cast est nécessaire
      const files = req.files as {
        [fieldname: string]: Express.Multer.File[];
      };

      // Upload images
      if (files.images) {
        for (const file of files.images) {
          const result = await this.mediaService.uploadToCloudinary(file.buffer);
          if (result.type === 'image') {
            media.images.push(result.url);
          }
        }
      }

      // Upload videos
      if (files.videos) {
        for (const file of files.videos) {
          const result = await this.mediaService.uploadToCloudinary(file.buffer);
          if (result.type === 'video') {
            media.videos.push(result.url);
          }
        }
      }

      res.status(200).json({ media });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Upload failed', error });
    }
  }
}
