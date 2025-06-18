import mongoose, { Schema, Document } from 'mongoose';
import { comment } from 'postcss';

export interface IPost extends Document {
    user: mongoose.Types.ObjectId; // Référence à l'utilisateur
    text?: string;
    media?: {
        images?: string[]; // URLs des images
        videos?: string[]; // URLs des vidéos
    };
    likes?: mongoose.Types.ObjectId[]; // Références aux utilisateurs qui aiment le post
    comments?: {
        userId: mongoose.Types.ObjectId; // ID de l'utilisateur qui a commenté
        text: string; // Texte du commentaire
        createdAt: Date; // Date de création du commentaire
        updatedAt: Date; // Date de mise à jour du commentaire
    }[]; // Références aux commentaires
    createdAt: Date;
    updatedAt: Date;

}

const PostSchema: Schema = new Schema(
    {
        user: { type: mongoose.Types.ObjectId, ref: 'User', required: true },
        text: { type: String, trim: true },
        media: {
            images: {
                type: [{ type: String, trim: true }],
                validate: {
                    validator: function (v: string[]) {
                        return v.length <= 5; // Limite à 5 images
                    },
                    message: 'Maximum 5 images are allowed.',
                },
            },
            videos: {
                type: [{ type: String, trim: true }],
                validate: {
                    validator: function (v: string[]) {
                        return v.length <= 2; // Limite à 2 vidéos
                    },
                    message: 'Maximum 2 videos are allowed.',
                },
            },
        },

        likes: [{ type: mongoose.Types.ObjectId, ref: 'User', default:[] }], //

        comments: [
                {
                    userId: { type: mongoose.Types.ObjectId, ref: 'User', required: true },
                    text: { type: String, trim: true, required: true },
                    createdAt: { type: Date, default: Date.now },
                    updatedAt: { type: Date, default: Date.now },
                },
            ],
    },
    {
        timestamps: true, // Ajoute automatiquement createdAt et updatedAt
    }
);

export default mongoose.model<IPost>('Post', PostSchema);