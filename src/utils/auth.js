/**
 * Supabase JWT Authentication Utility for Turismo Raraz
 * Handles session management, login, and protected state.
 */

import { cache } from "./cache.js";

// Configuration - Set these values in your environment or replace them here
const SUPABASE_URL = "https://your-project.supabase.co"; 
const SUPABASE_ANON_KEY = "your-anon-key";

let supabaseClient = null;

function hasValidConfig() {
  return SUPABASE_URL && SUPABASE_URL !== "https://your-project.supabase.co" && 
         SUPABASE_ANON_KEY && SUPABASE_ANON_KEY !== "your-anon-key";
}

/**
 * Initialize the Supabase Client
 * Note: Assumes @supabase/supabase-js is loaded via CDN or npm
 */
export function initAuth() {
  if (typeof window.supabase === "undefined") {
    console.warn("Supabase library not loaded. Auth will be disabled.");
    return null;
  }

  if (!hasValidConfig()) {
    console.warn("Supabase credentials not configured. Auth will be disabled.");
    return null;
  }

  if (!supabaseClient) {
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }

  return supabaseClient;
}

/**
 * Get current user session
 * Uses cache for fast UI retrieval
 */
export async function getSession() {
  const cachedSession = cache.get("auth_session");
  if (cachedSession) return cachedSession;

  const client = initAuth();
  if (!client) return null;

  const { data: { session }, error } = await client.auth.getSession();
  if (error || !session) return null;

  // Cache for 5 minutes for fast checks
  cache.set("auth_session", session, 5 * 60 * 1000);
  return session;
}

/**
 * Check if the current user is an Administrator
 */
export async function isAdmin() {
  const session = await getSession();
  if (!session) return false;

  // You can extend this with specific role checks from Supabase
  // For now, we trust the presence of a valid session
  return !!session.user;
}

/**
 * Login function
 */
export async function login(email, password) {
  const client = initAuth();
  if (!client) throw new Error("Auth client not initialized");

  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw error;

  cache.set("auth_session", data.session, 5 * 60 * 1000);
  return data;
}

/**
 * Logout function
 */
export async function logout() {
  const client = initAuth();
  if (client) {
    await client.auth.signOut();
  }
  cache.delete("auth_session");
  window.location.reload();
}
