import { injectable } from "inversify";
import UserModel from "../../models/User.model";
import PostModel from "../../models/Post.model";
import CommentModel from "../../models/Comment.model";
import NotificationsModel from "../../models/Notifications.model";
import AdminModel, { IAdmin } from "../adminModel/Admin.Model";
import cloudinary from "../../config/cloudinary";
import { hash, compare } from "bcryptjs";
import { Document } from "mongoose";

@injectable()
export class AdminService {


    //create Admin 
    public async createAdmin(admin: IAdmin ): Promise<IAdmin> {
    // Vérifie s'il existe déjà un admin avec ce mail ou username
    const existingAdmin = await AdminModel.findOne({
      $or: [{ email: admin.email }, { username: admin.username }]
    });

     if (existingAdmin) {
      throw new Error("Un admin avec cet email ou username existe déjà");
    }

    // Hash du mot de passe
    const hashedPassword = await hash(admin.password, 10);
    const newAdmin = new AdminModel({ ...admin, password: hashedPassword});
    console.log(newAdmin);

    return await newAdmin.save();  
  }

 
    //get Admin info (username, email, photoProfil)
    public async getAdmin(): Promise<IAdmin> {
        const admin = await AdminModel.findOne();
        if (!admin) {
            throw new Error(" Pas d'ADMIN ");
        }

        return admin;
    }


    //pour supprimer completement un utilisateur standard
    async deleteUserComplet(userId: string): Promise<void> {
    // Vérifier si l'utilisateur existe
    const user = await UserModel.findById(userId);
    if (!user) throw new Error("Utilisateur introuvable");

    // Récupérer toutes les publications de cet utilisateur
    const posts = await PostModel.find({ user: userId });

    for (const post of posts) {
        // Supprimer médias (exemple pour Cloudinary)
        if (post.media?.images) {
            for (const url of post.media.images) {
                const publicId = this.extractPublicIdFromUrl(url);
                if (publicId) {
                    await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
                }
            }
        }
        if (post.media?.videos) {
            for (const url of post.media.videos) {
                const publicId = this.extractPublicIdFromUrl(url);
                if (publicId) {
                    await cloudinary.uploader.destroy(publicId, { resource_type: "video" });
                }
            }
        }

        // Supprimer tous les commentaires liés au post
        await CommentModel.deleteMany({ post: post._id });

        // Supprimer la publication
        await PostModel.findByIdAndDelete(post._id);
    }

    // Supprimer tous les commentaires faits par l'utilisateur
    await CommentModel.deleteMany({ user: userId });

    // Retirer les likes de l'utilisateur sur d'autres publications
    await PostModel.updateMany(
        { likes: userId },
        { $pull: { likes: userId } }
    );

    // Supprimer les notifications liées à cet utilisateur (sender ou recipient)
    await NotificationsModel.deleteMany({ $or: [{ sender: userId }, { recipient: userId }] });

    // Supprimer l'utilisateur
    await UserModel.findByIdAndDelete(userId);
}


    //Pour supprimer une publication
    async deletePublication(postId: string): Promise<void>{
        const post = await PostModel.findById(postId);
        if (!post) throw new Error ("Publication introuvable");

        const userId = post.user.toString();

         // Supprimer tous les commentaires liés à cette publication
         await CommentModel.deleteMany({ post: postId });

         // Supprimer la publication
         await PostModel.findByIdAndDelete(postId);

         // Retirer la référence du post dans le tableau `posts` de l'utilisateur
         await UserModel.findByIdAndUpdate(userId, {
         $pull: { posts: postId }
        });
    }

    //Pour supprimer un commentaire
    async deleteUnCommentaire(commentId: string): Promise<void>{
        const comment = await CommentModel.findByIdAndDelete(commentId);
        if (!comment) throw new Error("Commentaire introuvable");
         
        await PostModel.updateOne(
            {comments: commentId},
            {$pull: {comments: commentId}}
        );
    }

    // Helper pour extraire public_id Cloudinary depuis url
 extractPublicIdFromUrl(url: string): string | null {
    try {
        const parts = url.split('/');
        const lastPart = parts[parts.length - 1];
        return lastPart.split('.')[0];
    } catch {
        return null;
    }
}


}