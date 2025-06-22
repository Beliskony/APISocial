import mongoose from 'mongoose';
import { injectable } from 'inversify';
import UserModel from '../models/User.model';
import StoryModel,{ IStory } from '../models/Story.model';


@injectable()
export class StoryService {
    async createStory(userId: string, content: { type: 'image' | 'video'; data: string }): Promise<IStory> {
       const expiresAt= new Date(Date.now() + 24 * 60 *60 * 1000)
        const story = new StoryModel({ userId: new mongoose.Types.ObjectId(userId), content, expiresAt }); // 24h expiration
       
        return await story.save();
    }

    async getUserStories(userId: string): Promise<IStory[]> {
        const now = new Date();
        return await StoryModel.find({ userId: new mongoose.Types.ObjectId(userId), expiresAt: { $gt: now } }).exec();
    }

    async deleteExpiredStories(): Promise<void> {
        const now = new Date();
        await StoryModel.deleteMany({ expiresAt: { $lte: now } }).exec();
    }

    async deleteUserStory(storyId: string, userId: string): Promise<void> {
        await StoryModel.deleteOne({ _id: new mongoose.Types.ObjectId(storyId), userId: new mongoose.Types.ObjectId(userId) }).exec();
    }

    async getStoryOfFollowing(userId: string): Promise<IStory[]> {
        const now = new Date();

        const user = await UserModel.findById(userId).populate('followers', '_id').exec();
        if (!user || !user.followers || user.followers.length === 0) {
            return [];
        }
        return await StoryModel.find({ userId: { $in: userId }, expiresAt: { $gt: now } })
            .populate('userId', 'username profilePicture') // Assuming you want to populate user details
            .exec();
    }
}

export default StoryService;