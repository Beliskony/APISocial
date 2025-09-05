import { injectable } from 'inversify';
import cloudinary from '../config/cloudinary';
import { v4 as uuidv4 } from 'uuid';

@injectable()
export class MediaService {
  async uploadToCloudinary(fileBuffer: Buffer): Promise<{ url: string; type: string }> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'auto',
        folder: 'reseau-social',
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

}
