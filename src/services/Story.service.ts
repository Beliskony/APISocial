import mongoose from 'mongoose';
import { injectable } from 'inversify';
import UserModel from '../models/User.model';
import StoryModel,{ IStory } from '../models/Story.model';


@injectable()
export class StoryService {
    async createStory(userId: string, content: { type: 'image' | 'video'; data: string }): Promise<IStory> {
       const expiresAt= new Date(Date.now() + 24 * 60 *60 * 1000)
        const story = new StoryModel({ userId: new mongoose.Types.ObjectId(userId), content, expiresAt }); // 24h expiration

        const savedStory = await story.save();

        await UserModel.findByIdAndUpdate(userId, {$push: {stories: savedStory._id}})
       
        return savedStory;
    }

    async getUserStories(userId: string): Promise<IStory[]> {
        const now = new Date();
        return await StoryModel.find({ userId: new mongoose.Types.ObjectId(userId), expiresAt: { $gt: now } }).exec();
    }

    async viewStoryAndGetCount(storyId: string, userId: string): Promise<number> {
        const story = await StoryModel.findById(storyId);

        if (!story) {
            throw new Error('Story non trouvee')
        }

        const hasViewed = story.viewedBy.some((viewerId) =>
            viewerId.toString() === userId
        )

        if (!hasViewed) {
            story.viewedBy.push(new mongoose.Types.ObjectId(userId))
            await story.save();
        }

        return story.viewedBy.length;
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

        const user = await UserModel.findById(userId).populate('followers', '_id username profilePicture').exec();
        if (!user || !user.followers || user.followers.length === 0) {
            return [];
        }

        // Récupérer les IDs des comptes suivis
        const followerIds = user.followers.map((f: any) => f._id);

        return await StoryModel.find({ userId: { $in: followerIds }, expiresAt: { $gt: now } })
            .populate('userId', '_id username profilePicture') // Assuming you want to populate user details
            .exec();
    }
}

export default StoryService;