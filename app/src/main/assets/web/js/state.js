/**
 * state.js — the ONLY file that knows how match data travels between devices.
 *
 * Today (dev/testing in a browser): state lives in localStorage on this
 * device and is mirrored across tabs with BroadcastChannel.
 *
 * Tomorrow (Android APK): the control device runs a local HTTP server
 * (NanoHTTPD). This file will instead call:
 *   GET  /api/state   -> current match state (used by display + control)
 *   POST /api/state   -> replace/patch match state (used by control)
 * No other file in this app needs to change when that switch happens —
 * everything else talks to the functions below, never to storage directly.
 */

const STORAGE_KEY = "scoreboard:match-state";
const LOGOS_KEY = "scoreboard:saved-logos";
const CHANNEL_NAME = "scoreboard-sync";

function defaultState() {
  return {
    teams: {
      a: { name: "فريق أ", logo: null, color: "#E8483A" },
      b: { name: "فريق ب", logo: null, color: "#3D7FE8" },
    },
    settings: {
      matchDurationSec: 10 * 60,
      winScore: 21,
      foulLimit: 6,
      onePointValue: 1,
      twoPointValue: 2,
    },
    score: { a: 0, b: 0 },
    fouls: { a: 0, b: 0 },
    clock: {
      remainingSec: 10 * 60,
      running: false,
    },
    history: [], // stack of {team, delta} for undo
    status: "setup", // "setup" | "live" | "finished"
    winner: null, // "a" | "b" | null
    updatedAt: Date.now(),
  };
}

const channel = ("BroadcastChannel" in window) ? new BroadcastChannel(CHANNEL_NAME) : null;
const listeners = new Set();

function readLocal() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

function writeLocal(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

/**
 * Fetch the current match state. Falls back to local storage when no
 * server is present (plain browser preview).
 */
async function getState() {
  try {
    const res = await fetch("/api/state", { cache: "no-store" });
    if (res.ok) return await res.json();
  } catch (e) {
    // No local server available — fall back below.
  }
  return readLocal() || defaultState();
}

/**
 * Replace the match state entirely and notify other tabs/devices.
 */
async function setState(state) {
  state.updatedAt = Date.now();
  try {
    const res = await fetch("/api/state", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(state),
    });
    if (res.ok) {
      channel?.postMessage(state);
      return state;
    }
  } catch (e) {
    // No local server — fall back to local storage + BroadcastChannel.
  }
  writeLocal(state);
  channel?.postMessage(state);
  return state;
}

/**
 * Subscribe to state changes. Calls back immediately with the current
 * state, then again whenever it changes (via BroadcastChannel locally,
 * or polling — callers running on the eventual display device should
 * also poll periodically in case they missed a broadcast, e.g. after
 * being opened fresh).
 */
function subscribe(callback) {
  getState().then(callback);
  const handler = (event) => callback(event.data);
  channel?.addEventListener("message", handler);
  listeners.add(callback);
  return () => {
    channel?.removeEventListener("message", handler);
    listeners.delete(callback);
  };
}

/**
 * Poll the state source on an interval and invoke callback on every
 * read (used by the display screen, and as a safety net alongside
 * subscribe() on the control screen).
 */
function startPolling(callback, intervalMs = 800) {
  let stopped = false;
  async function tick() {
    if (stopped) return;
    const state = await getState();
    callback(state);
    setTimeout(tick, intervalMs);
  }
  tick();
  return () => { stopped = true; };
}

/** Saved team logos, kept separately so they persist across matches. */
function getSavedLogos() {
  const raw = localStorage.getItem(LOGOS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch (e) {
    return [];
  }
}

function saveLogo(name, dataUrl) {
  const logos = getSavedLogos().filter((l) => l.name !== name);
  logos.push({ name, dataUrl });
  localStorage.setItem(LOGOS_KEY, JSON.stringify(logos));
  return logos;
}

function deleteLogo(name) {
  const logos = getSavedLogos().filter((l) => l.name !== name);
  localStorage.setItem(LOGOS_KEY, JSON.stringify(logos));
  return logos;
}

window.ScoreboardState = {
  defaultState,
  getState,
  setState,
  subscribe,
  startPolling,
  getSavedLogos,
  saveLogo,
  deleteLogo,
};
