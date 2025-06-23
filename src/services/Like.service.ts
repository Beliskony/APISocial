import { injectable } from "inversify";
import LikeModel, {ILike} from "../models/Like.model";

@injectable()
export class LikeService {


    async toggleLike(userId: string, postId: string): Promise<"liked" | "disliked"> {
        const existingLike = await LikeModel.findOne({ userId, postId });

        try {
            if (existingLike) {
                existingLike.isLiked = !existingLike.isLiked; // Toggle the like status
                await existingLike.save();
                return existingLike.isLiked ? "liked" : "disliked";
            } else {
                const newLike = new LikeModel({ userId, postId, isLiked: true });
                await newLike.save();
                return "liked";
            }
        } catch (error) {
            throw new Error(`Error toggling like: ${error}`);
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

