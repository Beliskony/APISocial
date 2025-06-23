import { injectable } from "inversify";
import LikeModel, {ILike} from "../models/Like.model";
import PostModel from "../models/Post.model";
import { Types } from "mongoose";

@injectable()
export class LikeService {
    async toggleLike(userId: string, postId: string): Promise<"liked" | "disliked"> {
    const existingLike = await LikeModel.findOne({ userId, postId });

    try {
        const post = await PostModel.findById(postId);
        if (!post) throw new Error('Post not found');

        const userObjectId = new Types.ObjectId(userId);
        post.likes = post.likes || [];

        if (existingLike) {
            existingLike.isLiked = !existingLike.isLiked;
            await existingLike.save();

            if (existingLike.isLiked) {
                if (!post.likes.some(id => id.equals(userObjectId))) {
                    post.likes.push(userObjectId);
                }
            } else {
                post.likes = post.likes.filter(id => !id.equals(userObjectId));
            }

            await post.save();
            return existingLike.isLiked ? "liked" : "disliked";
        } else {
            const newLike = new LikeModel({ userId, postId, isLiked: true });
            await newLike.save();

            if (!post.likes.some(id => id.equals(userObjectId))) {
                post.likes.push(userObjectId);
                await post.save();
            }

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

