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
        });
        const savedPost = await newPost.save();
        await savedPost.populate('user', '_id username email profilePicture');

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
    const currentUser = await UserModel.findById(userId).populate('followers');
    if (!currentUser) throw new Error("Utilisateur non trouvé");

    const followedUserIds = [...(currentUser.followers?.map(f => f._id.toString()) ?? []), userId];

    // 1. Posts des utilisateurs suivis
    const followedPosts = await PostModel.find({ user: { $in: followedUserIds } })
        .populate('user', '_id username profilePicture')
        .populate('comments.user', '_id username profilePicture')
        .sort({ createdAt: -1 })
        .limit(Math.floor(limit * 0.6));

    // 2. Posts aléatoires des non-suivis
    const randomPostIds = await PostModel.aggregate([
        { $match: { user: { $nin: followedUserIds.map(id => new mongoose.Types.ObjectId(id)) } } },
        { $sample: { size: Math.floor(limit * 0.35) } },
        { $project: { _id: 1 } },
    ]);
    const randomPosts = await PostModel.find({ _id: { $in: randomPostIds.map(p => p._id) } })
        .populate('user', '_id username profilePicture')
        .populate('comments.user', '_id username profilePicture')

    // 3. Posts personnels
    const selfPosts = await PostModel.find({ user: userId })
        .sort({ createdAt: -1 })
        .limit(Math.floor(limit * 0.05))
        .populate('user', '_id username profilePicture')
        .populate('comments.user', '_id username profilePicture')

    // 4. Fusion sans doublon
    const allPostsMap = new Map<string, IPost>();
    [...followedPosts, ...randomPosts, ...selfPosts].forEach(post => {
        allPostsMap.set(post.id.toString(), post);
    });

    const allUniquePosts = Array.from(allPostsMap.values());

    // 5. Mélanger aléatoirement pour casser l’ordre (optionnel)
    const shuffled = allUniquePosts.sort(() => 0.5 - Math.random());

    // 6. Paginer après le mélange
    const paginated = shuffled.slice((page - 1) * limit, page * limit);

    return paginated;
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
