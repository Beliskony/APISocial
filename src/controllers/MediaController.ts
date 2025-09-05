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
      if (!req.file) {
        res.status(400).json({ message: 'No file provided' });
        return;
      }

      const result = await this.mediaService.uploadToCloudinary(req.file.buffer);

      const media: { images: string[]; videos: string[]; } = { images: [], videos: []};

      if (result.type === 'image') {
        media.images.push(result.url);
      } else if (result.type === 'video') {
        media.videos.push(result.url);
      }

      res.status(200).json({ media });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Upload failed', error });
    }
  }
}
