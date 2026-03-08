/**
 * models/Dashboard.ts
 * Mongoose schema + TypeScript types for a single Dashboard document.
 *
 * One document = one dashboard.
 * One user (identified by email) can own many dashboards.
 */

import mongoose, { Document, Schema } from 'mongoose';
import type { Widget } from '../types';

// ─── Document Interface ───────────────────────────────────────────────────────

export interface IDashboard extends Document {
  email: string;
  dashboardName: string;
  widgets: Widget[];
  isShared: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ─── Widget Sub-Schema ─────────────────────────────────────────────────────────

const widgetSchema = new Schema<Widget>(
  {
    id: {
      type: String,
      required: [true, 'Widget id is required.'],
      trim: true,
    },
    x: {
      type: Number,
      required: [true, 'Widget x position is required.'],
      default: 0,
    },
    y: {
      type: Number,
      required: [true, 'Widget y position is required.'],
      default: 0,
    },
    w: {
      type: Number,
      required: [true, 'Widget width is required.'],
      default: 1,
    },
    h: {
      type: Number,
      required: [true, 'Widget height is required.'],
      default: 1,
    },
    name: { type: String, trim: true, default: '' },
    url: { type: String, trim: true, default: '' },
    backgroundColor: { type: String, trim: true, default: 'FFFFFF' },
  },
  { _id: false }, // Widget sub-docs don't need their own _id
);

// ─── Dashboard Schema ──────────────────────────────────────────────────────────

const dashboardSchema = new Schema<IDashboard>(
  {
    /** Owner – primary lookup key; indexed for fast user queries */
    email: {
      type: String,
      required: [true, 'Email is required.'],
      trim: true,
      lowercase: true,
      index: true,
    },

    /** Human-readable dashboard title */
    dashboardName: {
      type: String,
      required: [true, 'Dashboard name is required.'],
      trim: true,
    },

    /** Ordered list of widgets on this dashboard's grid */
    widgets: {
      type: [widgetSchema],
      default: [],
    },

    /**
     * Public visibility flag.
     * When true, the dashboard is readable via GET /api/dashboard/shared/:id
     * without authentication.
     */
    isShared: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true, // Adds createdAt + updatedAt, kept in sync automatically
    versionKey: false, // Suppress __v
  },
);

// ─── Compound Index ────────────────────────────────────────────────────────────
// Optimises the most common query pattern: all dashboards for a given user
dashboardSchema.index({ email: 1, createdAt: -1 });

// ─── Model ─────────────────────────────────────────────────────────────────────
const Dashboard = mongoose.model<IDashboard>('Dashboard', dashboardSchema);

export default Dashboard;
