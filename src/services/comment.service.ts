import { injectable } from "inversify";
import CommentModel, {IComment} from "../models/Comment.model";
import PostModel from "../models/Post.model";

@injectable()
export class CommentService {
 

    // Add a comment to a post
    async addComment(postId: string, userId: string, content: string): Promise<IComment> {
        const newComment =  new CommentModel({
            user: userId,
            post: postId,
            content: content, });

            const savedComment = await newComment.save();   

            await PostModel.findByIdAndUpdate(postId, {
                $inc: {commentsCount: 1},
                $push: {comments: newComment._id}
            })

            return savedComment;
        }

    
    async getCommentsByPostId(postId: string): Promise<IComment[]> {
        return await CommentModel.find({ post: postId }).sort({createdAt: 1}).populate("user", "username profilePicture").exec();
    }


    async updateComment(commentId: string, userId: string, content: string): Promise<IComment | null> {
        const upComment = await CommentModel.findById(commentId)

            if (!upComment || upComment.user.toString() !== userId) {
                throw new Error("Comment not found ou pas autoiser a modifier ce commentaire");
            }

            upComment.content = content;
            return await upComment.save();
        }

    async deleteComment(commentId: string, userId: string): Promise<boolean> {
        const delComment = await CommentModel.findById(commentId)
            if (!delComment || delComment.user.toString() !== userId) {
                throw new Error("Comment not found ou pas autoiser a supprimer ce commentaire");
            }

            await CommentModel.findByIdAndDelete(commentId);
            return true
        }
    
}