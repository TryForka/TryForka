import { useSyncExternalStore } from 'react';

// Cooking timers. Several can run at once (potatoes in the air fryer while the sauce
// simmers). Each is stored as an end timestamp, not a countdown, so it stays right when
// the tab sleeps or the phone locks, and the list is saved in localStorage so a reload
// keeps them. When one finishes: a sound, a vibration where supported, and a browser
// notification if the user allowed them (asked the first time a timer starts).

export interface Timer {
  id: string;
  label: string;
  recipeId: number | null;
  recipeTitle: string;
  /** Running: when it ends (ms since epoch). Null while paused. */
  endAt: number | null;
  /** Paused: ms left. */
  pausedLeft: number;
  /** Full length, for "+1 min" and restarts. */
  totalMs: number;
  /** Finished and not yet dismissed. */
  done: boolean;
}

const KEY = 'forka_timers_v1';
let timers: Timer[] = load();
const listeners = new Set<() => void>();

function load(): Timer[] {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as Timer[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function commit(next: Timer[]) {
  timers = next;
  try { localStorage.setItem(KEY, JSON.stringify(timers)); } catch { /* storage unavailable */ }
  listeners.forEach(l => l());
}

const subscribe = (l: () => void) => { listeners.add(l); return () => listeners.delete(l); };
const snapshot = () => timers;

export function useTimers(): Timer[] {
  return useSyncExternalStore(subscribe, snapshot, snapshot);
}

/** Milliseconds left (0 when done). */
export function remainingMs(t: Timer, now = Date.now()): number {
  if (t.done) return 0;
  return t.endAt === null ? t.pausedLeft : Math.max(0, t.endAt - now);
}

export function formatClock(ms: number): string {
  const total = Math.ceil(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return h ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` : `${m}:${String(s).padStart(2, '0')}`;
}

// ── Alerts ─────────────────────────────────────────────────────────────────

let audio: AudioContext | null = null;

/** Create the audio context during a user gesture (starting a timer) so it may play later. */
function unlockAudio() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audio = audio ?? new Ctx();
    if (audio.state === 'suspended') void audio.resume();
  } catch { /* no Web Audio */ }
}

function chime() {
  if (!audio) return;
  try {
    const t0 = audio.currentTime;
    [0, 0.35, 0.7].forEach((offset, i) => {
      const osc = audio!.createOscillator();
      const gain = audio!.createGain();
      osc.connect(gain);
      gain.connect(audio!.destination);
      osc.type = 'sine';
      osc.frequency.value = i === 2 ? 880 : 660;
      gain.gain.setValueAtTime(0.0001, t0 + offset);
      gain.gain.exponentialRampToValueAtTime(0.35, t0 + offset + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + offset + 0.3);
      osc.start(t0 + offset);
      osc.stop(t0 + offset + 0.32);
    });
  } catch { /* ignore */ }
}

function alertDone(t: Timer) {
  chime();
  try { navigator.vibrate?.([300, 150, 300, 150, 300]); } catch { /* unsupported */ }
  try {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`${t.label} is done`, { body: t.recipeTitle, tag: t.id, icon: `${import.meta.env.BASE_URL}forka-logo.png` });
    }
  } catch { /* some browsers only allow notifications from a service worker */ }
}

function askNotificationPermission() {
  try {
    if ('Notification' in window && Notification.permission === 'default') void Notification.requestPermission();
  } catch { /* unsupported */ }
}

// Checks for finished timers twice a second (also catches ones that ended while the tab slept).
let ticker: number | null = null;
function ensureTicker() {
  if (ticker !== null || typeof window === 'undefined') return;
  ticker = window.setInterval(() => {
    const now = Date.now();
    const finished = timers.filter(t => !t.done && t.endAt !== null && t.endAt <= now);
    if (finished.length) {
      commit(timers.map(t => (finished.includes(t) ? { ...t, done: true, endAt: null, pausedLeft: 0 } : t)));
      finished.forEach(alertDone);
    }
    // Repeat the sound every few seconds until dismissed, so it isn't missed across the kitchen.
    if (timers.some(t => t.done) && Math.floor(now / 500) % 8 === 0) chime();
  }, 500);
}
if (typeof window !== 'undefined') ensureTicker();

// ── Actions ────────────────────────────────────────────────────────────────

export function startTimer(opts: { label: string; seconds: number; recipeId: number | null; recipeTitle: string }): string {
  unlockAudio();
  askNotificationPermission();
  ensureTicker();
  const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  const ms = opts.seconds * 1000;
  commit([...timers, { id, label: opts.label, recipeId: opts.recipeId, recipeTitle: opts.recipeTitle, endAt: Date.now() + ms, pausedLeft: 0, totalMs: ms, done: false }]);
  return id;
}

export function pauseTimer(id: string) {
  commit(timers.map(t => (t.id === id && t.endAt !== null ? { ...t, pausedLeft: Math.max(0, t.endAt - Date.now()), endAt: null } : t)));
}

export function resumeTimer(id: string) {
  unlockAudio();
  commit(timers.map(t => (t.id === id && t.endAt === null && !t.done ? { ...t, endAt: Date.now() + t.pausedLeft, pausedLeft: 0 } : t)));
}

export function addMinute(id: string) {
  unlockAudio();
  commit(timers.map(t => {
    if (t.id !== id) return t;
    if (t.done) return { ...t, done: false, endAt: Date.now() + 60_000, pausedLeft: 0 };
    return t.endAt === null ? { ...t, pausedLeft: t.pausedLeft + 60_000 } : { ...t, endAt: t.endAt + 60_000 };
  }));
}

/** Stops and removes a timer (cancel, or dismiss once it's done). */
export function removeTimer(id: string) {
  commit(timers.filter(t => t.id !== id));
}

/** The running/paused/done timer for this label in this recipe, if any (so a chip shows its state). */
export function findTimer(list: Timer[], recipeId: number | null, label: string): Timer | undefined {
  return list.find(t => t.recipeId === recipeId && t.label === label);
}
