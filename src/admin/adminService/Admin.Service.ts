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
  const user = await UserModel.findById(userId);
  if (!user) throw new Error("Utilisateur introuvable");

  // 1️⃣ Récupérer toutes les publications de l'utilisateur
  const posts = await PostModel.find({ user: userId });

  for (const post of posts) {
    // Supprimer médias Cloudinary
    if (post.media?.images) {
      for (const url of post.media.images) {
        const publicId = this.extractPublicIdFromUrl(url);
        if (publicId) await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
      }
    }
    if (post.media?.videos) {
      for (const url of post.media.videos) {
        const publicId = this.extractPublicIdFromUrl(url);
        if (publicId) await cloudinary.uploader.destroy(publicId, { resource_type: "video" });
      }
    }

    // Supprimer les commentaires liés
    await CommentModel.deleteMany({ post: post._id });

    // Supprimer les likes liés
    await PostModel.updateOne({ _id: post._id }, { $set: { likes: [] } });

    // Supprimer le post
    await PostModel.findByIdAndDelete(post._id);
  }

  // 2️⃣ Supprimer les commentaires faits par l'utilisateur ailleurs
  await CommentModel.deleteMany({ user: userId });

  // 3️⃣ Retirer ses likes sur d'autres posts
  await PostModel.updateMany({ likes: userId }, { $pull: { likes: userId } });

  // 4️⃣ Supprimer les notifications liées
  await NotificationsModel.deleteMany({ $or: [{ sender: userId }, { recipient: userId }] });

  // 5️⃣ Supprimer l'utilisateur
  await UserModel.findByIdAndDelete(userId);
}



    //Pour supprimer une publication
//Pour supprimer une publication
async deletePublication(postId: string): Promise<void> {
  const post = await PostModel.findById(postId);
  if (!post) throw new Error("Publication introuvable");

  const userId = post.user.toString();

  // 🔹 Supprimer médias Cloudinary liés
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

  // 🔹 Supprimer les commentaires liés
  await CommentModel.deleteMany({ post: postId });

  // 🔹 Supprimer les likes liés
  await PostModel.updateOne({ _id: postId }, { $set: { likes: [] } });

  // 🔹 Supprimer le post
  await PostModel.findByIdAndDelete(postId);

  // 🔹 Retirer la référence du post chez l'utilisateur
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
    const parts = url.split("/");
    const fileWithExt = parts.pop() || "";
    const folder = parts.slice(parts.indexOf("upload") + 1).join("/");
    const publicId = folder ? `${folder}/${fileWithExt.split(".")[0]}` : fileWithExt.split(".")[0];
    return publicId;
  } catch {
    return null;
  }
}



}