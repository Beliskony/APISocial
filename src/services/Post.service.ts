import { injectable } from "inversify";
import PostModel, { IPost } from "../models/Post.model";
import UserModel from "../models/User.model";
import mongoose from "mongoose";


@injectable()
export class PostService {

    async createPost(userId: string, text?: string, media?: { images?: string[]; videos?: string[] }): Promise<IPost> {
        const newPost = new PostModel ({
            user: userId,
            text,
            media,
            createdAt: new Date(),
            updatedAt: new Date(),
        });
        const savedPost = await newPost.save();

        // Logique pour mettre à jour le nombre de posts de l'utilisateur
        await UserModel.findByIdAndUpdate(userId, {$push: { posts: savedPost._id }}, { new: true });
        return savedPost;
    }


    async getPosts(text: string): Promise<IPost[] | null> {
        return await PostModel.find({
            $or: [
                { text: { $regex: text, $options: 'i' } }, // Recherche insensible à la casse
                //{ 'media.images': { $regex: text, $options: 'i' } }, // Recherche dans les images
                //{ 'media.videos': { $regex: text, $options: 'i' } }, // Recherche dans les vidéos
            ],
        }).populate('user', '_id username profilePicture')
    }

    async getPostByUser(userId: string): Promise<IPost[]> {
        return await PostModel.find({user: userId}).sort({createdAt: -1}).exec();
    }

    async getAllPosts(userId: string, page = 1, limit = 20): Promise<IPost[]> {
        //1. Trouver les followers de l'utilisateur
        const currentUser = await UserModel.findById(userId).populate('followers');
        if (!currentUser) {
            throw new Error("Utilisateur non trouvé");
        }
        const followedUsers = [...currentUser.followers ?? [], userId]; // Inclure l'utilisateur lui-même
        //2. Récupérer les posts des utilisateurs suivis
        const posts = await PostModel.find({ user: { $in: followedUsers } })
            .populate('user', '-password -email -phoneNumber', '_id username profilePicture')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(Math.floor(limit * 0.6)) // Limite à 65% des posts
            .exec();


            const randomPostIds = await PostModel.aggregate([
                 { $match: { user: { $nin: followedUsers.map(id => new mongoose.Types.ObjectId(id)) } } },
                 { $sample: { size: Math.floor(limit * 0.35)} },
                 { $project: { _id: 1 } }, // récupère uniquement l'ID
                ]);

                const populatedRandomPosts = await PostModel.find({ _id: { $in: randomPostIds.map(post => post._id) } })
                .populate('user', '_id username profilePicture')
            

            const selfPost = await PostModel.find({user: userId})
                .populate('user', '_id username profilePicture')
                .sort({ createAt: -1})
                .limit(Math.ceil(limit * 0.05));

        // 5. Fusionner les deux listes
        const mixedFeed = [...posts, ...populatedRandomPosts, ...selfPost]

        // 6. Trier les publications finales par date (facultatif)
        mixedFeed.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        return mixedFeed;
    }

    async updatePost(postId: string, userId:string,  text?: string, media?: { images?: string[]; videos?: string[] }): Promise<IPost | null> {
        
        const post = await PostModel.findById(postId)

        if (!post) {
            return null;
        }
        console.log("✅ Post trouvé avec user :", post.user.toString());

        if (post?.user.toString() !== userId) {
            console.log("⛔️ Utilisateur non autorisé");
            throw new Error("You are not authorized to modify this post");
        }

        post.text = text || post.text;
        post.media = media || post.media;
        post.updatedAt = new Date();
        return await post.save();
    }

    async deletePost(postId: string, userId: string): Promise<boolean> {
        const post = await PostModel.findById(postId);
        if (!post) {
            throw new Error("Post non trouve");
        }
        if (post.user.toString() !== userId) {
            throw new Error("You are not authorized to modify this post");
        }

        // Supprimer le post
        await PostModel.findByIdAndDelete(postId);

        // Mettre à jour l'utilisateur pour retirer le post de sa liste
        await UserModel.findByIdAndUpdate(userId, {$pull: { posts: postId }});
        return true;
    }
}
