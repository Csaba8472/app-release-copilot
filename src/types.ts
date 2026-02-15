/**
 * Type definitions for app-release-copilot CLI
 * Metadata Generator for iOS App Store
 */

// ════════════════════════════════════════════════════════════════════════════
// APP INFO TYPES
// ════════════════════════════════════════════════════════════════════════════

export interface AppInfo {
  name: string;
  description: string;
  appStoreUrl?: string;
  currentMetadata?: AppStoreMetadata;
}

export interface AppStoreMetadata {
  trackId: number;
  trackName: string;
  description: string;
  sellerName: string;
  primaryGenreName: string;
  genres: string[];
  price: number;
  averageUserRating?: number;
  userRatingCount?: number;
  version: string;
  releaseNotes?: string;
}

// ════════════════════════════════════════════════════════════════════════════
// EXPO STORE CONFIG TYPES (matches EAS Metadata schema)
// ════════════════════════════════════════════════════════════════════════════

export interface ExpoStoreConfig {
  configVersion: 0;
  apple: {
    info: {
      "en-US": ExpoAppleInfo;
    };
  };
}

export interface ExpoAppleInfo {
  /** App name in store (2-30 chars) */
  title?: string;
  /** Subtext for the app (max 30 chars) */
  subtitle?: string;
  /** Main description (10-4000 chars) */
  description?: string;
  /** Keywords for search (max 100 chars total, comma-separated) */
  keywords?: string[];
  /** Changes since last version (max 4000 chars) */
  releaseNotes?: string;
  /** Short tagline (max 170 chars) */
  promoText?: string;
  /** URLs */
  marketingUrl?: string;
  supportUrl?: string;
  privacyPolicyUrl?: string;
}

// ════════════════════════════════════════════════════════════════════════════
// CHARACTER LIMITS (from Expo schema)
// ════════════════════════════════════════════════════════════════════════════

export const CHAR_LIMITS = {
  title: 30,
  subtitle: 30,
  description: 4000,
  keywords: 100, // total characters including commas
  releaseNotes: 4000,
  promoText: 170,
} as const;

// ════════════════════════════════════════════════════════════════════════════
// KEYWORD SCORE TYPES (from MCP server)
// ════════════════════════════════════════════════════════════════════════════

export interface KeywordScore {
  keyword: string;
  trafficScore: number;       // 1-10
  difficultyScore: number;    // 1-10
  difficultyIndex: number;    // 0-100 (industry standard)
  searchAdsPopularity?: number; // 5-100 (Apple Search Ads)
}

// ════════════════════════════════════════════════════════════════════════════
// GENERATED METADATA ACCUMULATOR
// ════════════════════════════════════════════════════════════════════════════

export interface GeneratedMetadata {
  title?: string;
  subtitle?: string;
  description?: string;
  keywords?: string[];
  releaseNotes?: string;
  promoText?: string;
  iconPath?: string;
  featureGraphicPath?: string;
}
