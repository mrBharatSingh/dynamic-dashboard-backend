/**
 * controllers/DashboardController.ts
 * tsoa class-based controller for all Dashboard API operations.
 *
 * tsoa reads the decorators and TypeScript types here to:
 *  1. Generate Express route handlers automatically (routes/routes.ts)
 *  2. Generate an OpenAPI 3.0 specification (build/swagger.json)
 *
 * Run `npm run build` to regenerate both artefacts after any change.
 */

import 'reflect-metadata';
import {
  Route,
  Controller,
  Body,
  Post,
  Get,
  Put,
  Delete,
  Path,
  Tags,
  SuccessResponse,
  Response,
  Example,
} from 'tsoa';
import mongoose from 'mongoose';
import Dashboard from '../models/Dashboard';
import type {
  Widget,
  DashboardDocument,
  BackupDashboardBody,
  UpdateDashboardBody,
  ApiResponse,
  MultiDashboardResponse,
  ShareDashboardResponse,
  DeleteResponse,
  ErrorResponse,
} from '../types';

// ─── Helper ───────────────────────────────────────────────────────────────────

/** Returns false for values that are not valid Mongoose ObjectIds. */
const isValidObjectId = (id: string): boolean =>
  mongoose.Types.ObjectId.isValid(id);

// ─── Controller ───────────────────────────────────────────────────────────────

@Route('dashboard')
@Tags('Dashboard')
export class DashboardController extends Controller {
  // ── 1. Backup Dashboard ────────────────────────────────────────────────────

  /**
   * Saves a new dashboard to MongoDB for the given user.
   * If the user already has a dashboard with the same name a second document
   * is still created – callers must check for duplicates themselves.
   */
  @Post('backup')
  @SuccessResponse('201', 'Dashboard backed up successfully')
  @Response<ErrorResponse>(
    '400',
    'Validation error – email or dashboardName missing',
  )
  @Response<ErrorResponse>('500', 'Internal server error')
  @Example<BackupDashboardBody>({
    email: 'user@example.com',
    dashboardName: 'AI Tools',
    widgets: [
      {
        id: '1',
        x: 0,
        y: 0,
        w: 2,
        h: 2,
        name: 'Google',
        url: 'https://www.google.com',
        backgroundColor: '3B82F6',
      },
    ],
  })
  public async backupDashboard(
    @Body() body: BackupDashboardBody,
  ): Promise<ApiResponse> {
    try {
      const { email, dashboardName, widgets } = body;

      if (!email || !dashboardName) {
        this.setStatus(400);
        return {
          success: false,
          message: '`email` and `dashboardName` are required.',
        };
      }

      const dashboard = await Dashboard.create({
        email: email.trim().toLowerCase(),
        dashboardName: dashboardName.trim(),
        widgets: widgets ?? [],
      });

      this.setStatus(201);
      return {
        success: true,
        message: 'Dashboard backed up successfully.',
        data: dashboard.toObject() as unknown as DashboardDocument,
      };
    } catch (error: any) {
      if (error.name === 'ValidationError') {
        const messages: string[] = Object.values(error.errors).map(
          (e: any) => e.message,
        );
        this.setStatus(400);
        return { success: false, message: messages.join(' | ') };
      }
      console.error('[backupDashboard]', error);
      this.setStatus(500);
      return { success: false, message: 'Failed to backup dashboard.' };
    }
  }

  // ── 2. Get All Dashboards for a User ────────────────────────────────────────

  /**
   * Returns all dashboards belonging to the given email address, sorted
   * newest-first. Returns an empty array when no dashboards exist.
   */
  @Get('user/{email}')
  @SuccessResponse('200', 'List of dashboards')
  @Response<ErrorResponse>('500', 'Internal server error')
  @Example<MultiDashboardResponse>({
    success: true,
    count: 1,
    data: [
      {
        _id: '665f1b2c3d4e5f6a7b8c9d0e',
        email: 'user@example.com',
        dashboardName: 'AI Tools',
        widgets: [],
        isShared: false,
        createdAt: '2026-03-08T10:00:00.000Z',
        updatedAt: '2026-03-08T10:00:00.000Z',
      },
    ],
  })
  public async getUserDashboards(
    @Path() email: string,
  ): Promise<MultiDashboardResponse> {
    try {
      const dashboards = await Dashboard.find({
        email: email.trim().toLowerCase(),
      })
        .sort({ createdAt: -1 })
        .lean();

      return {
        success: true,
        count: dashboards.length,
        data: dashboards as unknown as DashboardDocument[],
      };
    } catch (error: any) {
      console.error('[getUserDashboards]', error);
      this.setStatus(500);
      return { success: false, count: 0, data: [] };
    }
  }

  // ── 3. Get Single Dashboard ────────────────────────────────────────────────

  /**
   * Returns a single dashboard document by its MongoDB ObjectId.
   */
  @Get('single/{dashboardId}')
  @SuccessResponse('200', 'Dashboard document')
  @Response<ErrorResponse>('400', 'Invalid dashboard ID')
  @Response<ErrorResponse>('404', 'Dashboard not found')
  @Response<ErrorResponse>('500', 'Internal server error')
  public async getDashboardById(
    @Path() dashboardId: string,
  ): Promise<ApiResponse> {
    try {
      if (!isValidObjectId(dashboardId)) {
        this.setStatus(400);
        return { success: false, message: 'Invalid dashboard ID.' };
      }

      const dashboard = await Dashboard.findById(dashboardId).lean();

      if (!dashboard) {
        this.setStatus(404);
        return { success: false, message: 'Dashboard not found.' };
      }

      return {
        success: true,
        data: dashboard as unknown as DashboardDocument,
      };
    } catch (error: any) {
      console.error('[getDashboardById]', error);
      this.setStatus(500);
      return { success: false, message: 'Failed to retrieve dashboard.' };
    }
  }

  // ── 4. Update Dashboard ────────────────────────────────────────────────────

  /**
   * Updates the `dashboardName` and/or `widgets` array of an existing
   * dashboard. Passing neither field returns a 400 error.
   */
  @Put('{dashboardId}')
  @SuccessResponse('200', 'Dashboard updated successfully')
  @Response<ErrorResponse>('400', 'Invalid ID or no fields provided')
  @Response<ErrorResponse>('404', 'Dashboard not found')
  @Response<ErrorResponse>('500', 'Internal server error')
  public async updateDashboard(
    @Path() dashboardId: string,
    @Body() body: UpdateDashboardBody,
  ): Promise<ApiResponse> {
    try {
      if (!isValidObjectId(dashboardId)) {
        this.setStatus(400);
        return { success: false, message: 'Invalid dashboard ID.' };
      }

      // Only allow updatable fields – prevent accidental overwrite of email / isShared
      const updates: Partial<{ dashboardName: string; widgets: Widget[] }> = {};
      if (body.dashboardName !== undefined)
        updates.dashboardName = body.dashboardName.trim();
      if (body.widgets !== undefined) updates.widgets = body.widgets;

      if (Object.keys(updates).length === 0) {
        this.setStatus(400);
        return {
          success: false,
          message: 'No valid fields provided for update.',
        };
      }

      const dashboard = await Dashboard.findByIdAndUpdate(
        dashboardId,
        { $set: updates },
        { new: true, runValidators: true },
      ).lean();

      if (!dashboard) {
        this.setStatus(404);
        return { success: false, message: 'Dashboard not found.' };
      }

      return {
        success: true,
        message: 'Dashboard updated successfully.',
        data: dashboard as unknown as DashboardDocument,
      };
    } catch (error: any) {
      if (error.name === 'ValidationError') {
        const messages: string[] = Object.values(error.errors).map(
          (e: any) => e.message,
        );
        this.setStatus(400);
        return { success: false, message: messages.join(' | ') };
      }
      console.error('[updateDashboard]', error);
      this.setStatus(500);
      return { success: false, message: 'Failed to update dashboard.' };
    }
  }

  // ── 5. Delete Dashboard ────────────────────────────────────────────────────

  /**
   * Permanently removes a dashboard document by its MongoDB ObjectId.
   */
  @Delete('{dashboardId}')
  @SuccessResponse('200', 'Dashboard deleted successfully')
  @Response<ErrorResponse>('400', 'Invalid dashboard ID')
  @Response<ErrorResponse>('404', 'Dashboard not found')
  @Response<ErrorResponse>('500', 'Internal server error')
  public async deleteDashboard(
    @Path() dashboardId: string,
  ): Promise<DeleteResponse> {
    try {
      if (!isValidObjectId(dashboardId)) {
        this.setStatus(400);
        return { success: false, message: 'Invalid dashboard ID.' };
      }

      const dashboard = await Dashboard.findByIdAndDelete(dashboardId);

      if (!dashboard) {
        this.setStatus(404);
        return { success: false, message: 'Dashboard not found.' };
      }

      return { success: true, message: 'Dashboard deleted successfully.' };
    } catch (error: any) {
      console.error('[deleteDashboard]', error);
      this.setStatus(500);
      return { success: false, message: 'Failed to delete dashboard.' };
    }
  }

  // ── 6. Share Dashboard ─────────────────────────────────────────────────────

  /**
   * Marks a dashboard as publicly shared and returns a shareable link.
   * Once shared, the dashboard can be read via GET /api/dashboard/shared/:id
   * by any client without authentication.
   */
  @Post('share/{dashboardId}')
  @SuccessResponse('200', 'Dashboard shared successfully')
  @Response<ErrorResponse>('400', 'Invalid dashboard ID')
  @Response<ErrorResponse>('404', 'Dashboard not found')
  @Response<ErrorResponse>('500', 'Internal server error')
  public async shareDashboard(
    @Path() dashboardId: string,
  ): Promise<ShareDashboardResponse> {
    try {
      if (!isValidObjectId(dashboardId)) {
        this.setStatus(400);
        return {
          success: false,
          message: 'Invalid dashboard ID.',
          shareUrl: '',
          fullUrl: '',
          data: {} as DashboardDocument,
        };
      }

      const dashboard = await Dashboard.findByIdAndUpdate(
        dashboardId,
        { $set: { isShared: true } },
        { new: true },
      ).lean();

      if (!dashboard) {
        this.setStatus(404);
        return {
          success: false,
          message: 'Dashboard not found.',
          shareUrl: '',
          fullUrl: '',
          data: {} as DashboardDocument,
        };
      }

      // BASE_URL is the frontend origin (set in .env); falls back to API root
      const baseUrl =
        process.env.BASE_URL || `http://localhost:${process.env.PORT ?? 5000}`;
      const shareUrl = `/dashboard/shared/${dashboardId}`;

      return {
        success: true,
        message: 'Dashboard is now shared.',
        shareUrl,
        fullUrl: `${baseUrl}${shareUrl}`,
        data: dashboard as unknown as DashboardDocument,
      };
    } catch (error: any) {
      console.error('[shareDashboard]', error);
      this.setStatus(500);
      return {
        success: false,
        message: 'Failed to share dashboard.',
        shareUrl: '',
        fullUrl: '',
        data: {} as DashboardDocument,
      };
    }
  }

  // ── 7. Get Shared Dashboard ────────────────────────────────────────────────

  /**
   * Public endpoint – returns a dashboard only when `isShared` is true.
   * Safe to expose without authentication.
   */
  @Get('shared/{dashboardId}')
  @SuccessResponse('200', 'Shared dashboard document')
  @Response<ErrorResponse>('400', 'Invalid dashboard ID')
  @Response<ErrorResponse>('404', 'Dashboard not found or sharing disabled')
  @Response<ErrorResponse>('500', 'Internal server error')
  public async getSharedDashboard(
    @Path() dashboardId: string,
  ): Promise<ApiResponse> {
    try {
      if (!isValidObjectId(dashboardId)) {
        this.setStatus(400);
        return { success: false, message: 'Invalid dashboard ID.' };
      }

      const dashboard = await Dashboard.findOne({
        _id: dashboardId,
        isShared: true,
      }).lean();

      if (!dashboard) {
        this.setStatus(404);
        return {
          success: false,
          message: 'Shared dashboard not found or sharing has been disabled.',
        };
      }

      return {
        success: true,
        data: dashboard as unknown as DashboardDocument,
      };
    } catch (error: any) {
      console.error('[getSharedDashboard]', error);
      this.setStatus(500);
      return {
        success: false,
        message: 'Failed to retrieve shared dashboard.',
      };
    }
  }
}
