/**
 * types/index.ts
 * Shared TypeScript interfaces consumed by the controller, models, and service
 * layers. tsoa reads these interfaces to auto-generate OpenAPI 3.0 schemas so
 * they appear in swagger.json and Swagger UI without any manual annotation.
 */

// ─── Widget ───────────────────────────────────────────────────────────────────

/**
 * A single widget placed on a dashboard grid.
 * x/y/w/h describe position and size in grid units.
 */
export interface Widget {
  /** Client-side unique identifier */
  id: string;
  /** Column index (grid X position) */
  x: number;
  /** Row index (grid Y position) */
  y: number;
  /** Width in grid columns */
  w: number;
  /** Height in grid rows */
  h: number;
  /** Display label shown on the widget tile */
  name: string;
  /** Target URL the widget links to */
  url: string;
  /** Hex colour string without '#' (e.g. "3B82F6") */
  backgroundColor: string;
}

// ─── Dashboard Document ───────────────────────────────────────────────────────

/**
 * A full persisted dashboard document as returned from the API.
 */
export interface DashboardDocument {
  /** MongoDB ObjectId string */
  _id: string;
  /** Owner's email address */
  email: string;
  /** Human-readable dashboard title */
  dashboardName: string;
  /** All widgets currently on this dashboard */
  widgets: Widget[];
  /** Whether this dashboard can be accessed publicly via the shared endpoint */
  isShared: boolean;
  /** ISO 8601 creation timestamp (auto-set by Mongoose) */
  createdAt: string;
  /** ISO 8601 last-update timestamp (auto-set by Mongoose) */
  updatedAt: string;
}

// ─── Request Bodies ───────────────────────────────────────────────────────────

/** Request body for POST /api/dashboard/backup */
export interface BackupDashboardBody {
  /** Owner email – used as the primary lookup key */
  email: string;
  /** Name / title for the dashboard */
  dashboardName: string;
  /** Initial widget array (defaults to empty if omitted) */
  widgets?: Widget[];
}

/** Request body for PUT /api/dashboard/:dashboardId */
export interface UpdateDashboardBody {
  /** New title for the dashboard (optional) */
  dashboardName?: string;
  /** Replacement widget array (optional) */
  widgets?: Widget[];
}

// ─── Response Shapes ─────────────────────────────────────────────────────────

/** Standard success wrapper returned by most endpoints */
export interface ApiResponse {
  success: boolean;
  message?: string;
  /** Single dashboard payload */
  data?: DashboardDocument;
}

/** Returned by GET /api/dashboard/user/:email */
export interface MultiDashboardResponse {
  success: boolean;
  /** Total number of dashboards returned */
  count: number;
  data: DashboardDocument[];
}

/** Returned by POST /api/dashboard/share/:dashboardId */
export interface ShareDashboardResponse {
  success: boolean;
  message: string;
  /** Relative share path – mountable on any frontend origin */
  shareUrl: string;
  /** Fully qualified share link including frontend base URL */
  fullUrl: string;
  data: DashboardDocument;
}

/** Returned by DELETE /api/dashboard/:dashboardId */
export interface DeleteResponse {
  success: boolean;
  message: string;
}

/** Used in @Response<ErrorResponse> decorator annotations */
export interface ErrorResponse {
  success: false;
  message: string;
}

// ─── Tool Link ────────────────────────────────────────────────────────────────

/** A single tool URL entry managed by admins and shown to all users. */
export interface ToolLink {
  /** MongoDB ObjectId string */
  _id: string;
  /** Display name of the tool */
  toolName: string;
  /** Short description of the tool */
  description: string;
  /** Full URL the tool links to */
  url: string;
  /** ISO 8601 creation timestamp */
  createdAt: string;
  /** ISO 8601 last-update timestamp */
  updatedAt: string;
}

/** Request body for POST /api/tools */
export interface AddToolBody {
  /** Display name of the tool */
  toolName: string;
  /** Short description of the tool */
  description: string;
  /** Full URL the tool links to */
  url: string;
}

/** Returned by GET /api/tools */
export interface ToolsListResponse {
  success: boolean;
  count: number;
  data: ToolLink[];
}

/** Returned by POST /api/tools */
export interface ToolResponse {
  success: boolean;
  message?: string;
  data?: ToolLink;
}

/** Returned by DELETE /api/tools/:toolId */
export interface DeleteToolResponse {
  success: boolean;
  message: string;
}
