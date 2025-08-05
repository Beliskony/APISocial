import { injectable } from "inversify";
import CommentModel, {IComment} from "../models/Comment.model";
import PostModel from "../models/Post.model";
import NotificationsModel from "../models/Notifications.model";
import UserModel from "../models/User.model";

@injectable()
export class CommentService {
 

    // Add a comment to a post
    async addComment(postId: string, userId: string, content: string): Promise<IComment> {
        const newComment =  new CommentModel({
            user: userId,
            post: postId,
            content: content, });

            const savedComment = await newComment.save();
            await savedComment.populate( 'user', '_id username profilePicture' );

           await PostModel.findByIdAndUpdate(postId, {
                $inc: {commentsCount: 1},
                $push: {comments: savedComment._id}
            });

            // creation de notification pour la chaque commentaire fait par un utilisateur
            const post = await PostModel.findById(postId).populate('user', '_id username profilePicture');
            if (post && post.user._id.toString() !== userId) {
                const commentUser = await UserModel.findById(userId).select('username profilePicture');
                if (!commentUser) throw new Error('User not found');

                const notification = new NotificationsModel({
                    recipient: post.user._id,
                    sender: userId,
                    type: 'comment',
                    post: postId,
                    content: `${commentUser.username} a commenté votre publication.`,
                    isRead: false,
                });
                await notification.save();
            }

            return savedComment;
        }

    
    async getCommentsByPostId(postId: string): Promise<IComment[]> {
        const comments= await CommentModel.find({ post: postId }).sort({createdAt: 1})
        .populate('user', '_id username profilePicture').exec();

        console.log(comments[0]?.user);
        
        return comments;
    }


    async updateComment(commentId: string, userId: string, content: string): Promise<IComment | null> {
        const upComment = await CommentModel.findById(commentId)

            if (!upComment) {
                throw new Error("Comment not found");
            }

            if (upComment.user.toString() !== userId) {
                throw new Error("Comment not found ou pas autoiser a modifier ce commentaire");
            }

            upComment.content = content;
            const saved = await upComment.save();
            
            await saved.populate('user','_id username profilePicture' );
            return saved;
        }

    async deleteComment(commentId: string, userId: string): Promise<boolean> {
        const delComment = await CommentModel.findById(commentId)
            if (!delComment || delComment.user.toString() !== userId) {
                throw new Error("Comment not found ou pas autoiser a supprimer ce commentaire");
            }

            await CommentModel.findByIdAndDelete(commentId);
            await PostModel.findByIdAndUpdate(delComment.post, {
                $inc: {commentsCount: -1},
                $pull: {comments: delComment._id}
                });

            return true
        }
    
}