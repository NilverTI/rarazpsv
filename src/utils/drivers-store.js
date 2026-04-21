/**
 * Drivers Sync Engine
 * Handles high-performance caching, background sync, and offline resilience for the Staff section.
 * Architecture: IndexedDB (Collection) + localStorage (Metadata)
 */

import { cache } from "./cache.js";
import { syncCompanySnapshot } from "./trucky.js";

const DB_NAME = "RarazDriversDB";
const STORE_NAME = "drivers";
const DB_VERSION = 1;
const CACHE_METADATA_KEY = "drivers_sync_meta";
const SCHEMA_VERSION = "drivers-v4";

// TTL Settings
const TTL_FRESH = 5 * 60 * 1000;      // 5 min - Don't even ask network
const TTL_EXPIRED = 30 * 60 * 1000;   // 30 min - High priority revalidate

let dbPromise = null;
let inFlightSync = null;
let memoryFallbackStore = []; // Safe harbor for restricted environments (Brave/Private Mode)

/**
 * Defensive Database Access with Timeout
 */
async function getDB() {
  if (dbPromise) return dbPromise;
  
  const openPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      return reject(new Error("DB_UNSUPPORTED"));
    }

    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: "id" });
        }
      };
      
      request.onsuccess = (e) => resolve(e.target.result);
      request.onerror = (e) => reject(e.target.error || new Error("DB_OPEN_FAILED"));
      request.onblocked = () => reject(new Error("DB_BLOCKED"));
    } catch (e) {
      reject(e);
    }
  });

  // Racing the DB open with a 400ms timeout to prevent UI hang in restrictive browsers (Edge/Brave)
  dbPromise = Promise.race([
    openPromise,
    new Promise((_, reject) => setTimeout(() => reject(new Error("DB_TIMEOUT")), 400))
  ]).catch(err => {
    console.warn("Drivers Store: Falling back to Memory Mode. Storage issue:", err.message);
    return null; // Signals fallback mode
  });
  
  return dbPromise;
}

/**
 * Metadata Management Layer (Cross-Browser Safe)
 */
export function getDriversMetadata() {
  try {
    const meta = localStorage.getItem(CACHE_METADATA_KEY);
    return meta ? JSON.parse(meta) : { lastSync: 0, schemaVersion: SCHEMA_VERSION, etag: null };
  } catch (e) {
    // Handle Privacy/Security restricted storage access
    return { lastSync: 0, schemaVersion: SCHEMA_VERSION, etag: null, restricted: true };
  }
}

function saveDriversMetadata(data) {
  try {
    localStorage.setItem(CACHE_METADATA_KEY, JSON.stringify({
      ...getDriversMetadata(),
      ...data,
      lastSync: Date.now()
    }));
  } catch (e) {
    // Silently continue if storage is blocked
  }
}

/**
 * Core Sync Engine Methods
 */

export async function getConductoresFromCache() {
  try {
    const db = await getDB();
    
    // If DB failed/timeout, use memory fallback
    if (!db) return memoryFallbackStore;

    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction(STORE_NAME, "readonly");
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();
        
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      } catch (e) {
        reject(e);
      }
    });
  } catch (e) {
    console.warn("Drivers Store: Cache read failed, using memory state.", e);
    return memoryFallbackStore;
  }
}

export async function saveConductoresToCache(drivers) {
  if (!drivers || !Array.isArray(drivers)) return;

  // Always update memory fallback for instant access and zero-storage environments
  memoryFallbackStore = [...drivers];

  try {
    const db = await getDB();
    if (!db) return; // Silent fallback to memory only

    return new Promise((resolve, reject) => {
      try {
        const transaction = db.transaction(STORE_NAME, "readwrite");
        const store = transaction.objectStore(STORE_NAME);
        
        store.clear();
        drivers.forEach(driver => {
          store.add({
            ...driver,
            metadata: { version: SCHEMA_VERSION, cachedAt: Date.now() }
          });
        });
        
        transaction.oncomplete = () => {
          preloadDriverImages(drivers);
          resolve();
        };
        transaction.onerror = () => reject(transaction.error);
      } catch (e) {
        reject(e);
      }
    });
  } catch (e) {
    console.warn("Drivers Store: Persistent write failed (expected in Private/Brave).", e.message);
  }
}

/**
 * Data Model Sanitization & Enrichment Helper
 */
function enrichDriverCollection(rawDrivers) {
  if (!Array.isArray(rawDrivers)) return [];
  
  return rawDrivers.map(d => ({
    id: String(d.truckyId || `psv-${Math.random().toString(36).substr(2, 9)}`),
    nombre: d.name || "Staff",
    rol: d.role || "Conductor",
    foto: d.image,
    frente: {
      roleTone: d.roleTone || "default"
    },
    reverso: {
      bio: d.bio || "Miembro activo de Turismo Raraz.",
      profileUrl: d.profileUrl || null
    },
    metrics: {
      nivel: d.stats?.nivel || "Nivel N/D",
      kmMes: d.stats?.kmMes || "0 km",
      distanciaTotal: d.stats?.total || "0 km",
      servicios: d.stats?.jobs || 0
    },
    badges: generateDriverBadges(d),
    description: d.bio || "Staff certificado [PSV]",
    metadata: {
      lastUpdate: new Date().toISOString()
    }
  }));
}

export async function revalidateConductores(onUpdate) {
  if (inFlightSync) return inFlightSync;
  
  inFlightSync = (async () => {
    try {
      const vtcId = "41299";
      
      const result = await syncCompanySnapshot(vtcId, (partial) => {
        // Phase 1 (Instant): Drivers available, stats still calculating
        if (partial.snapshot?.drivers && typeof onUpdate === "function") {
          const fastEnriched = enrichDriverCollection(partial.snapshot.drivers);
          onUpdate(fastEnriched);
          console.log("Drivers Store: Phase 1 (Fast) update emitted.");
        }
      });
      
      if (!result) return null;

      // Save Stats Synchronously in metadata for zero-flicker bootstrap next time
      if (result.snapshot?.heroStats) {
        saveDriversMetadata({ 
          heroStats: result.snapshot.heroStats, 
          etag: result.signature 
        });
      }

      // Phase 2 (Detailed): Full history and calculated stats ready
      if (result.updated && result.snapshot?.drivers) {
        const fullEnriched = enrichDriverCollection(result.snapshot.drivers);
        
        await saveConductoresToCache(fullEnriched);
        saveDriversMetadata({ etag: result.signature });
        
        if (typeof onUpdate === "function") {
          onUpdate(fullEnriched);
        }
        console.log("Drivers Store: Phase 2 (Full) update emitted.");
        return fullEnriched;
      }
      
      return null;
    } catch (e) {
      console.warn("Drivers Store: Graceful degradation in effect.", e.message);
      return null;
    } finally {
      inFlightSync = null;
    }
  })();
  
  return inFlightSync;
}

/**
 * Main Public Entry Point (SWR Pattern)
 */
export async function getConductores(onBackgroundUpdate) {
  const meta = getDriversMetadata();
  const age = Date.now() - meta.lastSync;
  
  // 1. Instant Cache Load
  const cachedDrivers = await getConductoresFromCache();
  
  // 2. SWR Logic Decisions
  if (cachedDrivers.length > 0) {
    if (age < TTL_FRESH) {
      // Data is very fresh, return cache only
      return cachedDrivers;
    }
    
    // Data is stale (5-30min), trigger background revalidation
    revalidateConductores(onBackgroundUpdate);
    return cachedDrivers;
  }
  
  // 3. No Cache (Cold Load)
  const freshData = await revalidateConductores();
  return freshData || [];
}

/**
 * Background Asset Management
 */
export function preloadDriverImages(drivers) {
  if (!drivers || !Array.isArray(drivers) || typeof window === "undefined") return;
  
  const preload = (url) => {
    if (!url) return;
    const img = new Image();
    img.src = url;
  };

  // requestIdleCallback avoids blocking main thread during interaction
  const scheduler = window.requestIdleCallback || ((cb) => setTimeout(cb, 1000));
  
  scheduler(() => {
    // Priority 1: Top 4 (likely above the fold or first viewed)
    drivers.slice(0, 4).forEach(d => preload(d.foto));
    
    // Priority 2: Remaining collection (deferred)
    setTimeout(() => {
      drivers.slice(4).forEach(d => preload(d.foto));
    }, 3000);
  });
}

function generateDriverBadges(d) {
  const b = [];
  const role = String(d.role || "").toLowerCase();
  
  if (role.includes("admin") || role.includes("owner")) b.push("Staff");
  if (d.stats?.jobs > 50) b.push("Pro");
  if (d.truckyId) b.push("Verificado");
  
  return b;
}
