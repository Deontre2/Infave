import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

export const STATE_VERSION = 2;
const FIRESTORE_MAX_BYTES = 1_048_576;
const SAFE_MAX_BYTES = 900_000;

export function defaultState() {
  return { version: STATE_VERSION, groups: [], cards: [] };
}

export function normalizeState(data) {
  if (!data || typeof data !== "object") return defaultState();
  return {
    version: STATE_VERSION,
    groups: Array.isArray(data.groups) ? data.groups : [],
    cards: Array.isArray(data.cards) ? data.cards : [],
  };
}

function storageKey(userId) {
  return `labeled-clicks-state-v2-${userId}`;
}

export function saveToLocalStorage(userId, state) {
  if (!userId) return false;
  try {
    const normalized = normalizeState(state);
    localStorage.setItem(storageKey(userId), JSON.stringify(normalized));
    return true;
  } catch (err) {
    console.warn("localStorage save failed:", err);
    return false;
  }
}

export function loadFromLocalStorage(userId) {
  if (!userId) return null;
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return null;
    return normalizeState(JSON.parse(raw));
  } catch (err) {
    console.warn("localStorage load failed:", err);
    return null;
  }
}

function estimateStateBytes(state) {
  try {
    return new Blob([JSON.stringify(state)]).size;
  } catch {
    return JSON.stringify(state).length;
  }
}

export async function loadUserState(db, userId) {
  if (!userId) return { state: defaultState(), source: "none", error: null };

  let firestoreState = null;
  let firestoreError = null;

  if (db) {
    try {
      const snapshot = await getDoc(doc(db, "users", userId));
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (Array.isArray(data?.groups) && Array.isArray(data?.cards)) {
          firestoreState = normalizeState(data);
        }
      }
    } catch (err) {
      console.error("Firestore load failed:", err);
      firestoreError = err;
    }
  }

  const localState = loadFromLocalStorage(userId);

  if (firestoreState) {
    const fireEmpty =
      firestoreState.groups.length === 0 && firestoreState.cards.length === 0;
    const localHasData =
      localState &&
      (localState.groups.length > 0 || localState.cards.length > 0);

    if (fireEmpty && localHasData) {
      return {
        state: localState,
        source: "localStorage",
        error: firestoreError,
        shouldSyncToFirestore: true,
      };
    }

    saveToLocalStorage(userId, firestoreState);
    return { state: firestoreState, source: "firestore", error: null };
  }

  if (localState) {
    return {
      state: localState,
      source: "localStorage",
      error: firestoreError,
      shouldSyncToFirestore: Boolean(db),
    };
  }

  return {
    state: defaultState(),
    source: "none",
    error: firestoreError,
  };
}

export async function saveUserState(db, userId, state) {
  if (!userId) {
    return { state: defaultState(), firestoreOk: false, localOk: false, error: "Not signed in" };
  }

  const normalized = normalizeState(state);
  const localOk = saveToLocalStorage(userId, normalized);

  if (!db) {
    return {
      state: normalized,
      firestoreOk: false,
      localOk,
      error: localOk ? null : "Could not save locally",
    };
  }

  const bytes = estimateStateBytes(normalized);
  if (bytes > SAFE_MAX_BYTES) {
    return {
      state: normalized,
      firestoreOk: false,
      localOk,
      error:
        "Your data is too large to sync to the cloud (often caused by uploaded images). It was saved on this device only.",
    };
  }

  try {
    await setDoc(doc(db, "users", userId), normalized);
    return { state: normalized, firestoreOk: true, localOk, error: null };
  } catch (err) {
    console.error("Firestore save failed:", err);
    const code = err?.code || "";
    let message = "Could not sync to the cloud. Your data was saved on this device.";
    if (code === "permission-denied") {
      message =
        "Cloud save blocked by Firebase security rules. Data saved on this device — ask the project owner to allow authenticated users to read/write users/{userId}.";
    } else if (code === "invalid-argument" || code === "resource-exhausted") {
      message =
        "Cloud save failed (data may be too large). Data saved on this device — try removing card images.";
    }
    return { state: normalized, firestoreOk: false, localOk, error: message };
  }
}
