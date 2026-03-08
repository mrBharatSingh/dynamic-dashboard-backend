/**
 * models/Tool.ts
 * Mongoose schema for a Tool URL entry (Address Book items).
 *
 * One document = one tool link visible to all users in the Links tab.
 * Admin users manage these via the Admin Panel.
 */

import mongoose, { Document, Schema } from 'mongoose';

// ─── Document Interface ───────────────────────────────────────────────────────

export interface ITool extends Document {
  toolName: string;
  description: string;
  url: string;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const toolSchema = new Schema<ITool>(
  {
    toolName: {
      type: String,
      required: [true, 'Tool name is required.'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required.'],
      trim: true,
    },
    url: {
      type: String,
      required: [true, 'URL is required.'],
      trim: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export default mongoose.model<ITool>('Tool', toolSchema);
