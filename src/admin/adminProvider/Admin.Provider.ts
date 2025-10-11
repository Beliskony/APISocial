import { injectable, inject } from "inversify";
import { AdminService, AdminStats, UserManagementData } from "../adminService/Admin.Service";
import { IAdmin } from "../adminModel/Admin.Model";
import { TYPES } from "../../config/TYPES";

@injectable()
export class AdminProvider {
    constructor(@inject(TYPES.AdminService) private adminService: AdminService) {}

    // ✅ Gestion des admins
    async createAdmin(admin: IAdmin): Promise<IAdmin> {
        return this.adminService.createAdmin(admin);
    }

    async adminLogin(email: string, password: string): Promise<IAdmin> {
        return this.adminService.adminLogin(email, password);
    }

    async getAdminProfile(adminId: string): Promise<IAdmin> {
        return this.adminService.getAdminProfile(adminId);
    }

    // ✅ Tableau de bord et statistiques
    async getDashboardStats(): Promise<AdminStats> {
        return this.adminService.getDashboardStats();
    }

    // ✅ Gestion des utilisateurs
    async manageUser(userData: UserManagementData): Promise<void> {
        return this.adminService.manageUser(userData);
    }

    async getAllUsers(page: number = 1, limit: number = 20): Promise<{
        users: any[],
        total: number,
        page: number,
        totalPages: number
    }> {
        return this.adminService.getAllUsers(page, limit);
    }

    async searchUsers(query: string, page: number = 1, limit: number = 20): Promise<{
        users: any[],
        total: number,
        page: number,
        totalPages: number
    }> {
        return this.adminService.searchUsers(query, page, limit);
    }

    async deleteUserComplet(userId: string): Promise<void> {
        return this.adminService.deleteUserComplet(userId);
    }

    // ✅ Gestion des contenus
    async getAllPosts(page: number = 1, limit: number = 20): Promise<{
        posts: any[],
        total: number,
        page: number,
        totalPages: number
    }> {
        return this.adminService.getAllPosts(page, limit);
    }

    async moderateContent(
        contentId: string, 
        contentType: 'post' | 'comment', 
        action: 'approve' | 'reject' | 'flag'
    ): Promise<void> {
        return this.adminService.moderateContent(contentId, contentType, action);
    }

    async deletePublication(postId: string): Promise<void> {
        return this.adminService.deletePublication(postId);
    }

    async deleteCommentaire(commentId: string): Promise<void> {
        return this.adminService.deleteUnCommentaire(commentId);
    }
}