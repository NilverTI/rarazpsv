

import { cache } from "./cache.js";

const BASE_URL_V1 = "https://e.truckyapp.com/api/v1";
const DEFAULT_STAFF_IMAGE = "assets/images/staff/defecto.jpg";
const TRUCKY_HEADERS = {
  Accept: "application/json",
};
const SCHEMA_VERSION = "drivers-v3";
const TRUCKY_CACHE_TTL_MS = 10 * 60 * 1000;
const TRUCKY_CACHE_KEY_PREFIX = "raraz.trucky.companySnapshot";
const SNAPSHOT_REQUESTS = new Map();

function formatRoleLabel(roleName) {
  if (!roleName) return "Conductor";

  return roleName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function getRoleTone(roleName) {
  const normalizedRole = String(roleName || "").trim().toLowerCase();

  // Expanded categories for better sorting & styling
  if (normalizedRole.includes("owner") || normalizedRole.includes("fundador")) return "owner";
  if (normalizedRole.includes("admin") || normalizedRole.includes("staff") || normalizedRole.includes("moderador")) return "admin";
  if (normalizedRole.includes("conductor") || normalizedRole.includes("driver")) return "conductor";

  return "default";
}

function formatDistance(distanceKm) {
  if (typeof distanceKm !== "number" || !Number.isFinite(distanceKm) || distanceKm <= 0) {
    return "0 km";
  }

  return `${Math.round(distanceKm).toLocaleString("es-PE")} km`;
}

function formatMetricValue(value) {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return "0";
  }

  return Math.round(value).toLocaleString("es-PE");
}

function formatJoinDate(dateValue) {
  if (!dateValue) return "Miembro activo de Turismo Raraz.";

  return `Miembro activo desde ${new Date(dateValue).toLocaleDateString("es-PE", { timeZone: "UTC" })}`;
}

function getCurrentMonthStart() {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0));
}

function getCurrentYearStart() {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), 0, 1, 0, 0, 0, 0));
}

function getSnapshotPeriodKey() {
  const now = new Date();
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  return `${now.getUTCFullYear()}-${month}`;
}

function getJobReferenceDate(job) {
  const rawDate = job.completed_at || job.started_at || job.created_at || job.updated_at;
  const parsedDate = rawDate ? new Date(rawDate) : null;
  return parsedDate && Number.isFinite(parsedDate.getTime()) ? parsedDate : null;
}

function getJobDistanceKm(job) {
  const candidates = [
    job.real_driven_distance_km,
    job.driven_distance_km,
    job.vehicle_odometer_difference_km,
  ];

  const validDistance = candidates.find(
    (value) => typeof value === "number" && Number.isFinite(value) && value > 0
  );

  return validDistance || 0;
}


function getCompanyCacheKey(companyId) {
  return `trucky_snapshot_${companyId}`;
}

function isCacheFresh(entry) {
  if (!entry) return false;
  // Note: cache.get already handles TTL, but trucky has its own valid period logic
  // we'll keep it consistent with the central cache for now.
  return true;
}

async function fetchJson(url, errorLabel) {
  try {
    const response = await fetch(url, { 
      headers: TRUCKY_HEADERS,
      mode: 'cors',
      credentials: 'omit',
      referrerPolicy: 'no-referrer'
    });
    
    if (!response.ok) {
      throw new Error(`${errorLabel} (${response.status})`);
    }
    
    return await response.json();
  } catch (e) {
    // Specifically handle fetch failures which are common in Brave (Shields)
    const errorType = e.name === 'TypeError' ? 'BLOCKING_OR_NETWORK' : 'API_ERROR';
    console.warn(`Trucky API (${errorType}): ${errorLabel}.`, e.message);
    throw e;
  }
}

async function fetchCompany(companyId) {
  return fetchJson(`${BASE_URL_V1}/company/${companyId}`, "Failed to fetch company");
}

async function fetchCompanyJobsPage(companyId, page = 1) {
  return fetchJson(`${BASE_URL_V1}/company/${companyId}/jobs?page=${page}`, "Failed to fetch company jobs");
}

async function fetchCompanyJobsSince(companyId, startDate, firstPage = null) {
  const jobs = [];
  let currentPage = 1;
  let jobsPage = firstPage || (await fetchCompanyJobsPage(companyId, currentPage));

  while (jobsPage) {
    const pageJobs = Array.isArray(jobsPage.data) ? jobsPage.data : [];

    if (pageJobs.length === 0) break;

    jobs.push(...pageJobs);

    const lastJob = pageJobs[pageJobs.length - 1];
    const lastJobDate = getJobReferenceDate(lastJob);
    currentPage += 1;

    if (!jobsPage.next_page_url || !lastJobDate || lastJobDate < startDate) {
      break;
    }

    jobsPage = await fetchCompanyJobsPage(companyId, currentPage);
  }

  return jobs;
}

async function fetchSnapshotProbe(companyId) {
  const [company, members, jobsPage] = await Promise.all([
    fetchCompany(companyId),
    fetchVtcMembers(companyId),
    fetchCompanyJobsPage(companyId, 1),
  ]);

  return {
    company,
    members: Array.isArray(members) ? members : [],
    jobsPage,
  };
}

function buildCompanyStats(jobs, { yearStart, monthStart }) {
  let yearDistanceKm = 0;
  let completedJobsCount = 0;
  const monthlyDistanceByUser = new Map();

  jobs.forEach((job) => {
    const referenceDate = getJobReferenceDate(job);
    if (!referenceDate) return;

    const distanceKm = getJobDistanceKm(job);
    const isCanceled = job.status === "canceled";
    const isCompleted = job.status === "completed";

    if (referenceDate >= yearStart) {
      if (!isCanceled) {
        yearDistanceKm += distanceKm;
      }

      if (isCompleted) {
        completedJobsCount += 1;
      }
    }

    if (referenceDate >= monthStart && !isCanceled && distanceKm > 0) {
      const currentDistance = monthlyDistanceByUser.get(job.user_id) || 0;
      monthlyDistanceByUser.set(job.user_id, currentDistance + distanceKm);
    }
  });

  return {
    yearDistanceKm,
    completedJobsCount,
    monthlyDistanceByUser,
  };
}

function mapMembersToDrivers(members, monthlyDistanceByUser) {
  const rolePriority = {
    'owner': 1000,
    'admin': 500,
    'conductor': 100,
    'default': 0
  };

  return members
    .filter((member) => member && member.name && getRoleTone(member.role?.name) !== "owner")
    .sort((a, b) => {
      // 1. Sort by Role Priority (Calculated directly from the raw role name)
      const pA = rolePriority[getRoleTone(a.role?.name)] || 0;
      const pB = rolePriority[getRoleTone(b.role?.name)] || 0;
      
      if (pA !== pB) return pB - pA;

      // 2. Sort by Level (Highest first)
      const levelA = parseInt(a.level, 10) || 0;
      const levelB = parseInt(b.level, 10) || 0;
      return levelB - levelA;
    })
    .map((member) => ({
      truckyId: member.id,
      steamId: member.steam_id || null,
      name: member.name || "Miembro",
      role: formatRoleLabel(member.role?.name),
      roleTone: getRoleTone(member.role?.name),
      image: member.avatar_url || DEFAULT_STAFF_IMAGE,
      stats: {
        nivel: typeof member.level === "number" ? `Nivel ${member.level}` : "Nivel N/D",
        kmMes: formatDistance(monthlyDistanceByUser.get(member.id) || 0),
        total: formatDistance(member.total_driven_distance_km),
        jobs: member.jobs_count || 0,
      },
      bio: formatJoinDate(member.created_at),
      profileUrl: member.public_url || null,
    }));
}

async function buildLiveCompanySnapshot(companyId, seed = {}) {
  const yearStart = getCurrentYearStart();
  const monthStart = getCurrentMonthStart();

  const company = seed.company || (await fetchCompany(companyId));
  const members = Array.isArray(seed.members) ? seed.members : (await fetchVtcMembers(companyId)) || [];
  const jobsPage1 = seed.jobsPage || (await fetchCompanyJobsPage(companyId, 1));
  const jobs = await fetchCompanyJobsSince(companyId, yearStart, jobsPage1);
  const { yearDistanceKm, completedJobsCount, monthlyDistanceByUser } = buildCompanyStats(jobs, {
    yearStart,
    monthStart,
  });

  const snapshot = {
    drivers: mapMembersToDrivers(members, monthlyDistanceByUser),
    heroStats: {
      kmRecorridos: formatMetricValue(yearDistanceKm),
      conductoresActivos: formatMetricValue(company.members_count || members.length),
      serviciosRealizados: formatMetricValue(completedJobsCount),
    },
  };

  return {
    snapshot,
    markers: buildSnapshotMarkers({
      company,
      members,
      jobsPage: jobsPage1,
    }),
    signature: createSnapshotSignature(snapshot),
  };
}

/**
 * Creates a lightweight state marker for change detection
 */
function buildSnapshotMarkers({ company, members, jobsPage }) {
  return {
    membersCount: company.members_count || (Array.isArray(members) ? members.length : 0),
    lastJobId: (Array.isArray(jobsPage?.data) && jobsPage.data.length > 0) ? jobsPage.data[0].id : null,
    totalDistance: company.total_driven_distance_km || 0,
  };
}

/**
 * Generates a unique signature for the snapshot data
 */
function createSnapshotSignature(snapshot) {
  if (!snapshot) return null;
  const stats = snapshot.heroStats || {};
  const driversCount = Array.isArray(snapshot.drivers) ? snapshot.drivers.length : 0;

  // Deterministic signature based on the visible metrics
  return `v1:${stats.kmRecorridos}:${driversCount}:${stats.serviciosRealizados}`;
}

/**
 * Fetches the list of members for a given VTC ID
 * @param {string|number} companyId 
 */
export async function fetchVtcMembers(companyId) {
  try {
    const result = await fetchJson(`${BASE_URL_V1}/company/${companyId}/members`, "Failed to fetch VTC members");
    return Array.isArray(result.data) ? result.data : [];
  } catch (error) {
    console.error("Trucky API Error (VTC Members):", error);
    return null;
  }
}

/**
 * Orchestrator to get all data for a VTC
 * @param {string|number} companyId 
 */
export async function getLiveStaffData(companyId) {
  const snapshot = await getLiveCompanySnapshot(companyId);
  return snapshot.drivers;
}

export async function getLiveCompanySnapshot(companyId) {
  try {
    const payload = await buildLiveCompanySnapshot(companyId);
    return payload.snapshot;
  } catch (error) {
    console.error("Trucky API Error (Company Snapshot):", error);
    return {
      drivers: [],
      heroStats: null,
    };
  }
}

export function getCachedCompanySnapshot(companyId) {
  const entry = cache.get(getCompanyCacheKey(companyId));
  if (!entry) return null;

  return {
    snapshot: entry.snapshot,
    signature: entry.signature,
    isFresh: true,
    lastChangedAt: entry.lastChangedAt || entry.fetchedAt,
  };
}

const TRUCKY_CACHE_GRACE_MS = 2 * 60 * 1000; // 2 minutes

export async function syncCompanySnapshot(companyId, onPartial = null) {
  const cacheKey = getCompanyCacheKey(companyId);
  const cacheEntry = cache.get(cacheKey);

  // 1. Grace Period Check
  if (cacheEntry) {
    const age = Date.now() - (cacheEntry.fetchedAt || 0);
    if (age < TRUCKY_CACHE_GRACE_MS) {
      return { snapshot: cacheEntry.snapshot, source: "cache", updated: false, signature: cacheEntry.signature };
    }
  }

  // 2. Request Deduplication
  const requestKey = String(companyId);
  const inFlightRequest = SNAPSHOT_REQUESTS.get(requestKey);
  if (inFlightRequest) return inFlightRequest;

  const request = (async () => {
    try {
      // 3. PHASE 1: Fast Probe & Initial Drivers
      const probe = await fetchSnapshotProbe(companyId);
      const probeMarkers = buildSnapshotMarkers(probe);

      // Fast Snapshot (No history yet)
      const fastSnapshot = {
        drivers: mapMembersToDrivers(probe.members, new Map()),
        heroStats: {
          // Keep these as null to signal Phase 1 (UI will keep showing cached/default)
          kmRecorridos: null,
          conductoresActivos: formatMetricValue(probe.company.members_count || probe.members.length),
          serviciosRealizados: null,
        },
      };

      // If markers match exactly, we just touch the cache and stop (Saves bandwidth/CPU)
      if (cacheEntry && areSnapshotMarkersEqual(cacheEntry.markers, probeMarkers)) {
        const touchedEntry = touchCompanySnapshotCacheEntry(companyId, cacheEntry);
        return { snapshot: touchedEntry.snapshot, source: "cache", updated: false, signature: touchedEntry.signature };
      }

      // Stream Phase 1 if the caller is interested (Extreme speed for cold loads)
      if (typeof onPartial === "function") {
        onPartial({ snapshot: fastSnapshot, signature: "partial", isPartial: true });
      }

      // 4. PHASE 2: Heavy Statistical Calculation (History fetch)
      const livePayload = await buildLiveCompanySnapshot(companyId, probe);

      const now = Date.now();
      const nextEntry = {
        ...livePayload,
        markers: probeMarkers, // Use markers from probe
        fetchedAt: now,
        lastChangedAt: cacheEntry && cacheEntry.signature === livePayload.signature ? cacheEntry.lastChangedAt : now,
      };

      cache.set(cacheKey, nextEntry, TRUCKY_CACHE_TTL_MS);

      return {
        snapshot: livePayload.snapshot,
        source: "network",
        updated: !cacheEntry || cacheEntry.signature !== nextEntry.signature,
        signature: nextEntry.signature,
      };
    } catch (error) {
      console.error("Trucky API Error (Tiered Sync):", error);
      return cacheEntry ? { snapshot: cacheEntry.snapshot, source: "cache", updated: false, signature: cacheEntry.signature, error } : null;
    } finally {
      SNAPSHOT_REQUESTS.delete(requestKey);
    }
  })();

  SNAPSHOT_REQUESTS.set(requestKey, request);
  return request;
}

/**
 * Compares two state markers to detect changes
 */
function areSnapshotMarkersEqual(m1, m2) {
  if (!m1 || !m2) return false;
  return (
    m1.membersCount === m2.membersCount &&
    m1.lastJobId === m2.lastJobId &&
    m1.totalDistance === m2.totalDistance
  );
}

/**
 * Updates the timestamp of an existing cache entry without invalidating the signature
 */
function touchCompanySnapshotCacheEntry(companyId, entry) {
  if (!entry) return null;
  const touchedEntry = {
    ...entry,
    fetchedAt: Date.now(),
  };
  cache.set(getCompanyCacheKey(companyId), touchedEntry, TRUCKY_CACHE_TTL_MS);
  return touchedEntry;
}
