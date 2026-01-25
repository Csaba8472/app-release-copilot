/**
 * App Store utilities for fetching app metadata
 * Uses iTunes Lookup API for competitor analysis
 */

import type { AppStoreMetadata } from "../types.js";

/**
 * Extract App Store ID from various URL formats
 * Supports: apps.apple.com/app/id123456789, itunes.apple.com/app/id123456789
 */
export function extractAppStoreId(url: string): string | null {
  // Match /id followed by digits
  const match = url.match(/\/id(\d+)/);
  if (match) {
    return match[1];
  }
  
  // Match standalone numeric ID
  const numericMatch = url.match(/^(\d{9,10})$/);
  if (numericMatch) {
    return numericMatch[1];
  }
  
  return null;
}

/**
 * Fetch app metadata from App Store using iTunes Lookup API
 */
export async function fetchAppStoreMetadata(url: string): Promise<AppStoreMetadata | null> {
  const appId = extractAppStoreId(url);
  
  if (!appId) {
    return null;
  }
  
  try {
    const response = await fetch(
      `https://itunes.apple.com/lookup?id=${appId}&country=us`
    );
    
    if (!response.ok) {
      return null;
    }
    
    const data = await response.json() as {
      resultCount: number;
      results: Array<{
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
      }>;
    };
    
    if (data.resultCount === 0 || !data.results[0]) {
      return null;
    }
    
    const app = data.results[0];
    
    return {
      trackId: app.trackId,
      trackName: app.trackName,
      description: app.description,
      sellerName: app.sellerName,
      primaryGenreName: app.primaryGenreName,
      genres: app.genres,
      price: app.price,
      averageUserRating: app.averageUserRating,
      userRatingCount: app.userRatingCount,
      version: app.version,
      releaseNotes: app.releaseNotes,
    };
  } catch {
    return null;
  }
}

/**
 * Validate if a string looks like an App Store URL
 */
export function isAppStoreUrl(url: string): boolean {
  return (
    url.includes("apps.apple.com") ||
    url.includes("itunes.apple.com") ||
    /^\d{9,10}$/.test(url)
  );
}
