import { injectable } from "inversify";
import LikeModel, {ILike} from "../models/Like.model";

@injectable()
export class LikeService {
    async addLike(userId: string, postId: string, isLiked=true): Promise<boolean> {
        try {
            const existingLike = await LikeModel.findOne({ userId, postId });
            if (existingLike) {
                existingLike.isLiked = isLiked; // Update the like status
                     await existingLike.save();
                } else {
                    const newLike = new LikeModel({ userId, postId, isLiked });
                    await newLike.save();
                }
                return true;
            }
         catch (error) {
            throw new Error(`Error adding like: ${error}`);
        } 
    }
      
    async removeLike(userId: string, postId: string): Promise<boolean> {
        try {
            const result = await LikeModel.deleteOne({ userId, postId });
            return result.deletedCount > 0
        } catch (error) {
            if(error instanceof Error) {
                throw new Error(`Erreur dislike: ${error.message}`)
            }
            
            throw new Error
        }
        
        
    }

    async getLikesByPost(postId: string): Promise<ILike[]> {
        const likes = await LikeModel.find({ postId, isLiked: true });
        return likes;
    }

    async hasUserLiked(userId: string, postId: string): Promise<boolean> {
        const like = await LikeModel.findOne({ userId, postId, isLiked:true });
        return !!like;
    }
}

