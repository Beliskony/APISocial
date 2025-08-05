import { injectable, inject } from "inversify";
import { AdminService } from "../adminService/Admin.Service";
import { IAdmin } from "../adminModel/Admin.Model";
import { TYPES } from "../../config/TYPES"
import { Document } from "mongoose";


@injectable()
export class AdminProvider{
    constructor(@inject (TYPES.AdminService) private adminService: AdminService) {}


    async createAdmin(admin: IAdmin): Promise<IAdmin>{
        return this.adminService.createAdmin(admin);
    }

    async getAdmin(): Promise<IAdmin>{
        return this.adminService.getAdmin();
    }

    async deleteUserComplet(userId: string): Promise<void>{
        return this.adminService.deleteUserComplet(userId);
    }

    async deletePublication(postId: string): Promise<void>{
        return this.adminService.deletePublication(postId);
    }

    async deleteCommentaire(commentId: string): Promise<void>{
        return this.adminService.deleteUnCommentaire(commentId);
    }

}