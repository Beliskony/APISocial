import { injectable, inject } from "inversify";
import { AdminService, AdminStats, AuditLogData, EngagementMetrics, GrowthMetrics, ReportData, UserManagementData } from "../adminService/Admin.Service";
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

    // ==================== 📊 ANALYTIQUES AVANCÉES ====================

    async getAdvancedAnalytics(dateRange?: { start: Date; end: Date }): Promise<{
        engagement: EngagementMetrics;
        growth: GrowthMetrics;
        topPerformers: any;
    }> {
        return this.adminService.getAdvancedAnalytics(dateRange);
    }


       // ==================== 🚨 GESTION DES SIGNALEMENTS ====================

    async reportContent(reportData: ReportData): Promise<void> {
        return this.adminService.reportContent(reportData);
    }

    async getPendingReports(page: number = 1, limit: number = 20): Promise<{
        reports: any[];
        total: number;
        page: number;
        totalPages: number;
    }> {
        return this.adminService.getPendingReports(page, limit);
    }

    async handleReport(
        reportId: string, 
        action: 'approve' | 'reject' | 'ban', 
        adminId: string,
        moderatorNotes?: string
    ): Promise<void> {
        return this.adminService.handleReport(reportId, action, adminId, moderatorNotes);
    }

    async getReportStats(): Promise<{
        pending: number;
        resolved: number;
        rejected: number;
        total: number;
    }> {
        return this.adminService.getReportStats();
    }


       // ==================== 📝 AUDIT ET LOGS ====================

    async logAuditAction(auditData: AuditLogData): Promise<void> {
        return this.adminService.logAuditAction(auditData);
    }

    async getAuditLogs(filters: {
        adminId?: string;
        action?: string;
        dateFrom?: Date;
        dateTo?: Date;
        targetType?: string;
    }, page: number = 1, limit: number = 50): Promise<{
        logs: any[];
        total: number;
        page: number;
        totalPages: number;
    }> {
        return this.adminService.getAuditLogs(filters, page, limit);
    }

    async getAuditStats(): Promise<{
        totalActions: number;
        actionsToday: number;
        topAdmins: any[];
    }> {
        return this.adminService.getAuditStats();
    }
}