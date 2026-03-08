/**
 * controllers/ToolController.ts
 * tsoa class-based controller for Tool URL (Address Book) API operations.
 *
 * Endpoints:
 *   GET  /api/tools         – Retrieve all tool entries (visible to all users)
 *   POST /api/tools         – Add a new tool entry (admin only by convention)
 *   DELETE /api/tools/:id   – Remove a tool entry (admin only by convention)
 *
 * Run `npm run build` to regenerate routes/routes.ts and build/swagger.json.
 */

import 'reflect-metadata';
import {
  Route,
  Controller,
  Body,
  Post,
  Get,
  Delete,
  Path,
  Tags,
  SuccessResponse,
  Response,
  Example,
} from 'tsoa';
import mongoose from 'mongoose';
import Tool from '../models/Tool';
import type {
  AddToolBody,
  ToolResponse,
  ToolsListResponse,
  DeleteToolResponse,
  ErrorResponse,
  ToolLink,
} from '../types';

// ─── Helper ───────────────────────────────────────────────────────────────────

const isValidObjectId = (id: string): boolean =>
  mongoose.Types.ObjectId.isValid(id);

// ─── Controller ───────────────────────────────────────────────────────────────

@Route('tools')
@Tags('Tools')
export class ToolController extends Controller {
  // ── 1. Get All Tools ────────────────────────────────────────────────────────

  /**
   * Returns all tool URL entries, sorted alphabetically by tool name.
   * This list is displayed to all users in the Links / Address Book tab.
   */
  @Get('')
  @SuccessResponse('200', 'List of tool URLs')
  @Response<ErrorResponse>('500', 'Internal server error')
  @Example<ToolsListResponse>({
    success: true,
    count: 2,
    data: [
      {
        _id: '665f1b2c3d4e5f6a7b8c9d0e',
        toolName: 'Chat GPT',
        description: 'AI language model for generating human-like text',
        url: 'https://chatgpt.com/',
        createdAt: '2026-03-08T10:00:00.000Z',
        updatedAt: '2026-03-08T10:00:00.000Z',
      },
    ],
  })
  public async getAllTools(): Promise<ToolsListResponse> {
    try {
      const tools = await Tool.find().sort({ toolName: 1 }).lean();
      return {
        success: true,
        count: tools.length,
        data: tools as unknown as ToolLink[],
      };
    } catch (error: any) {
      console.error('[getAllTools]', error);
      this.setStatus(500);
      return { success: false, count: 0, data: [] };
    }
  }

  // ── 2. Add Tool ─────────────────────────────────────────────────────────────

  /**
   * Creates a new tool URL entry in MongoDB.
   * Requires toolName, description, and url in the request body.
   */
  @Post('')
  @SuccessResponse('201', 'Tool added successfully')
  @Response<ErrorResponse>('400', 'Validation error – missing required fields')
  @Response<ErrorResponse>('500', 'Internal server error')
  @Example<AddToolBody>({
    toolName: 'MDN Web Docs',
    description: 'Resources for developers, by developers',
    url: 'https://developer.mozilla.org/',
  })
  public async addTool(@Body() body: AddToolBody): Promise<ToolResponse> {
    try {
      const { toolName, description, url } = body;

      if (!toolName?.trim() || !description?.trim() || !url?.trim()) {
        this.setStatus(400);
        return {
          success: false,
          message: '`toolName`, `description`, and `url` are required.',
        };
      }

      const tool = await Tool.create({
        toolName: toolName.trim(),
        description: description.trim(),
        url: url.trim(),
      });

      this.setStatus(201);
      return {
        success: true,
        message: 'Tool added successfully.',
        data: tool.toObject() as unknown as ToolLink,
      };
    } catch (error: any) {
      if (error.name === 'ValidationError') {
        const messages: string[] = Object.values(error.errors).map(
          (e: any) => e.message,
        );
        this.setStatus(400);
        return { success: false, message: messages.join(' | ') };
      }
      console.error('[addTool]', error);
      this.setStatus(500);
      return { success: false, message: 'Failed to add tool.' };
    }
  }

  // ── 3. Delete Tool ──────────────────────────────────────────────────────────

  /**
   * Permanently removes a tool entry by its MongoDB ObjectId.
   */
  @Delete('{toolId}')
  @SuccessResponse('200', 'Tool deleted successfully')
  @Response<ErrorResponse>('400', 'Invalid tool ID')
  @Response<ErrorResponse>('404', 'Tool not found')
  @Response<ErrorResponse>('500', 'Internal server error')
  public async deleteTool(
    @Path() toolId: string,
  ): Promise<DeleteToolResponse> {
    try {
      if (!isValidObjectId(toolId)) {
        this.setStatus(400);
        return { success: false, message: 'Invalid tool ID.' };
      }

      const tool = await Tool.findByIdAndDelete(toolId).lean();

      if (!tool) {
        this.setStatus(404);
        return { success: false, message: 'Tool not found.' };
      }

      return { success: true, message: 'Tool deleted successfully.' };
    } catch (error: any) {
      console.error('[deleteTool]', error);
      this.setStatus(500);
      return { success: false, message: 'Failed to delete tool.' };
    }
  }
}
