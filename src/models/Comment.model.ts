import mongoose, { Schema, model, Types } from 'mongoose';

export interface IComment {
    user: Types.ObjectId; // User ID celui qui a posté le commentaire
    post: Types.ObjectId; // Post ID lequel le commentaire est associé
    content: string; // Comment content 
    createdAt?: Date; // Optional createdAt field
    updatedAt?: Date;
}

const commentSchema = new Schema<IComment>(
    {
        user: { 
            type: mongoose.Schema.Types.ObjectId,
            ref:'User',
            required: true 
            },

        post: { 
            type: mongoose.Schema.Types.ObjectId,
            ref:'Post', 
            required: true 
            },

        content: { 
            type: String, 
            required: true 
            },

        createdAt: { 
            type: Date, 
            default: Date.now
        },
    },
    {
        timestamps: true,
    }
);

export default model<IComment>('Comment', commentSchema);