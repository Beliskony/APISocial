import mongoose, { Schema, Document } from "mongoose";
import { Types } from "mongoose";


export interface INotification extends Document {
    recipient: mongoose.Types.ObjectId; // Référence à l'utilisateur destinataire
    sender: mongoose.Types.ObjectId; // Référence à l'utilisateur expéditeur
    type: 'like' | 'comment' | 'follow'; // Type de notification
    post?: mongoose.Types.ObjectId; // Référence au post concerné (optionnel)
    content?: string; // Contenu de la notification (optionnel)
    isRead: boolean; // Indique si la notification a été lue
    createdAt: Date; // Date de création de la notification
}


const notificationSchema: Schema = new Schema({
    recipient: { type: mongoose.Types.ObjectId, ref: 'User', required: true },
    sender: { type: mongoose.Types.ObjectId, ref: 'User', required: true},
    type: { 
        type: String, 
        enum: ['like', 'comment', 'follow', 'mention'], 
        required: true 
    },
    post: { type: mongoose.Types.ObjectId, ref: 'Post' }, // Référence au post concerné
    content: { type: String, trim: true }, // Contenu de la notification
    isRead: { type: Boolean, default: false }, // Indique si la notification
    createdAt: { type: Date, default: Date.now }, // Date de création de la notification
})

export default mongoose.model<INotification>('Notification', notificationSchema);

