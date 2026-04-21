/**
 * Supabase JWT Authentication Utility for Turismo Raraz
 * Handles session management, login, and protected state.
 */

import { cache } from "./cache.js";

// Configuration - Set these values in your environment or replace them here
const SUPABASE_URL = "https://your-project.supabase.co"; 
const SUPABASE_ANON_KEY = "your-anon-key";
const SUPABASE_SDK_URL = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";

let supabaseClientPromise = null;
let supabaseLoaderPromise = null;

function hasValidConfig() {
  return SUPABASE_URL && SUPABASE_URL !== "https://your-project.supabase.co" && 
         SUPABASE_ANON_KEY && SUPABASE_ANON_KEY !== "your-anon-key";
}

function isSupabaseLoaded() {
  return typeof window !== "undefined" && typeof window.supabase !== "undefined";
}

function loadSupabaseScript() {
  if (typeof window === "undefined" || !hasValidConfig()) return Promise.resolve(null);
  if (isSupabaseLoaded()) return Promise.resolve(window.supabase);
  if (supabaseLoaderPromise) return supabaseLoaderPromise;

  supabaseLoaderPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector(`script[src="${SUPABASE_SDK_URL}"]`);
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(window.supabase), { once: true });
      existingScript.addEventListener("error", () => reject(new Error("SUPABASE_SDK_LOAD_FAILED")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = SUPABASE_SDK_URL;
    script.async = true;
    script.onload = () => resolve(window.supabase);
    script.onerror = () => reject(new Error("SUPABASE_SDK_LOAD_FAILED"));
    document.head.appendChild(script);
  }).catch((error) => {
    console.warn("Supabase SDK could not be loaded. Auth will stay disabled.", error.message);
    return null;
  });

  return supabaseLoaderPromise;
}

/**
 * Initialize the Supabase Client
 * Loads the SDK on demand so regular visitors don't pay the auth bundle cost.
 */
export function initAuth() {
  if (!hasValidConfig()) {
    return Promise.resolve(null);
  }

  if (!supabaseClientPromise) {
    supabaseClientPromise = loadSupabaseScript().then((sdk) => {
      if (!sdk) return null;
      return sdk.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    });
  }

  return supabaseClientPromise;
}

/**
 * Get current user session
 * Uses cache for fast UI retrieval
 */
export async function getSession() {
  const cachedSession = cache.get("auth_session");
  if (cachedSession) return cachedSession;

  const client = await initAuth();
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
  const client = await initAuth();
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
  const client = await initAuth();
  if (client) {
    await client.auth.signOut();
  }
  cache.delete("auth_session");
  window.location.reload();
}
