import { inject, injectable } from "inversify";
import { UserService } from "../services/User.service";
import { IUser } from "../models/User.model";
import { TYPES } from "../config/TYPES";

type LoginParams = {identifiant: string; password: string}

@injectable()
export class UserProvider {
    constructor( @inject(TYPES.UserService) private userService: UserService ) {}

    async createUser(user: IUser): Promise<IUser> {
        return this.userService.createUser(user);
    }

    async loginUser(params: LoginParams): Promise<IUser | null> {
        return this.userService.loginUser(params);
    }

    async findUserByUsername(username: string): Promise<IUser[]> {
        return this.userService.findUserByUsername(username);
    }

    async toggleFollow(userId: string, targetId: string): Promise<"followed" | "unfollowed"> {
        return this.userService.toggleFollow(userId, targetId);
    }

    async updateUserProfile(userId: string, userData: Partial<IUser>): Promise<IUser> {
        return this.userService.updateUserProfile(userId, userData);
    }

    async getMe(userId: string): Promise<IUser | null> {
        return this.userService.getMe(userId);
    }

    async getUserById(userId: string): Promise<IUser | null> {
        return this.userService.getUserById(userId);
    }

    async getSuggestedUsers(userId: string, limit: number = 10): Promise<IUser[]> {
        return this.userService.getSuggestedUsers(userId, limit);
    }

}