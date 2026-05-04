import React, { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  CalendarDays,
  Calculator,
  List,
  Music,
  Users,
  Plus,
  MessageCircle,
  RefreshCcw,
  Save,
  Search,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Clock,
  Moon,
  X,
  Zap,
  Trash2,
  Pencil,
  Sun,
  Eye,
  EyeOff,
  Bell,
  LogOut,
  AtSign,
  Banknote,
  FileCheck,
  Receipt,
  CircleDot,
  Edit2,
  Check,
  Link2,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { isSupabaseConfigured, supabase } from "./src/supabaseClient.js";

async function dashboardAccessToken({ refresh = false } = {}) {
  if (!isSupabaseConfigured) return "";
  if (refresh) {
    const refreshed = await supabase.auth.refreshSession();
    const refreshedToken = refreshed.data?.session?.access_token;
    if (refreshedToken) return refreshedToken;
  }

  const { data } = await supabase.auth.getSession();
  return data.session?.access_token || "";
}

async function dashboardApiRequest(path, { method = "GET", body } = {}) {
  if (!isSupabaseConfigured) {
    throw new Error("Supabase is not configured.");
  }

  const request = async (token) => {
    const response = await fetch(path, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(body ? { "Content-Type": "application/json" } : null),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const text = await response.text();
    let payload = null;
    try {
      payload = text ? JSON.parse(text) : null;
    } catch {
      payload = { error: text || `Request failed (${response.status})` };
    }
    return { response, payload };
  };

  let token = await dashboardAccessToken();
  if (!token) throw new Error("No active session.");

  let result = await request(token);
  const message = result.payload?.error || "";
  if (result.response.status === 401 && message.toLowerCase().includes("invalid session")) {
    token = await dashboardAccessToken({ refresh: true });
    if (token) result = await request(token);
  }

  if (!result.response.ok) {
    throw new Error(result.payload?.error || `Request failed (${result.response.status})`);
  }

  return result.payload;
}

const eventsSeed = [
  {
    id: 1,
    date: "2025-05-07",
    day: "WED",
    dayNo: "7",
    month: "MAY",
    name: "AFRO / AMAPIANO",
    genre: "AFRO / AMAPIANO",
    status: "Need Attention",
    stage: "Centre Stage",
    slots: [],
  },
  {
    id: 2,
    date: "2025-05-08",
    day: "FRI",
    dayNo: "8",
    month: "MAY",
    name: "OVERDRIVE",
    genre: "TECH HOUSE / MELODIC TECHNO",
    status: "Need Attention",
    stage: "Centre Stage",
    slots: [],
  },
  {
    id: 3,
    date: "2025-05-09",
    day: "SAT",
    dayNo: "9",
    month: "MAY",
    name: "VERKNIPT AFTER PARTY: RESTRICTED",
    genre: "TECHNO / HARD TECHNO",
    status: "Unconfirmed",
    stage: "Main Stage",
    slots: [
      { dj: "ANNJO", role: "Warm-up", start: "22:30", end: "00:00", energy: 3 },
      { dj: "RESTRICTED", role: "Peak", start: "00:00", end: "01:30", energy: 5 },
      { dj: "TCHUNO", role: "Closer", start: "01:30", end: "03:00", energy: 5 },
    ],
  },
  {
    id: 4,
    date: "2025-05-09",
    day: "SAT",
    dayNo: "9",
    month: "MAY",
    name: "NO SLEEP CLUB",
    genre: "TECHNO / HARD TECHNO",
    status: "Need Attention",
    stage: "Main Stage",
    slots: [],
  },
  {
    id: 5,
    date: "2025-05-13",
    day: "WED",
    dayNo: "13",
    month: "MAY",
    name: "CITY FLOW — NYOTA & FRIENDS",
    genre: "BAILE / URBAN",
    status: "Unconfirmed",
    stage: "Centre Stage",
    slots: [
      { dj: "(OPENING TBD)", role: "Warm-up", start: "22:30", end: "00:00", energy: 2, warning: true },
      { dj: "MJ", role: "Driver", start: "00:00", end: "01:30", energy: 3 },
      { dj: "NYOTA", role: "Peak", start: "01:30", end: "03:00", energy: 4 },
    ],
  },
  {
    id: 6,
    date: "2025-05-14",
    day: "THU",
    dayNo: "14",
    month: "MAY",
    name: "EDM HUB NIGHT",
    genre: "AFRO / AMAPIANO / HIP-HOP",
    status: "Need Attention",
    stage: "Centre Stage",
    slots: [],
  },
  {
    id: 7,
    date: "2025-05-15",
    day: "FRI",
    dayNo: "15",
    month: "MAY",
    name: "OVERDRIVE",
    genre: "HARD GROOVE / TRANCE / BOUNCE",
    status: "Unconfirmed",
    stage: "Centre Stage",
    slots: [
      { dj: "FUWU.999", role: "Driver", start: "23:00", end: "01:00", energy: 4 },
      { dj: "NARO", role: "Peak", start: "01:00", end: "03:00", energy: 4 },
    ],
  },
  {
    id: 8,
    date: "2025-05-16",
    day: "SAT",
    dayNo: "16",
    month: "MAY",
    name: "FACE 2 FACE",
    genre: "TECHNO / HARD TECHNO",
    status: "Need Attention",
    stage: "Main Stage",
    slots: [],
  },
];

const dashboardViewRoutes = {
  List: "/list",
  Calendar: "/calendar",
  DJs: "/djs",
  Users: "/users",
  Activity: "/activity",
  Finance: "/finance",
  DJPayments: "/payments",
  Sales: "/sales",
};

const routeDashboardViews = Object.fromEntries(Object.entries(dashboardViewRoutes).map(([view, path]) => [path, view]));

function normalizeDashboardPath(pathname) {
  const path = String(pathname || "/").replace(/\/+$/, "") || "/";
  return path.toLowerCase();
}

function dashboardViewFromPath(pathname) {
  return routeDashboardViews[normalizeDashboardPath(pathname)] || "List";
}

function dashboardPathForView(view) {
  return dashboardViewRoutes[view] || dashboardViewRoutes.List;
}

function eventIdFromSharePath(pathname) {
  const match = normalizeDashboardPath(pathname).match(/^\/event\/([^/]+)$/);
  return match ? decodeURIComponent(match[1]) : "";
}

function isEventSharePath(pathname) {
  return Boolean(eventIdFromSharePath(pathname));
}

function eventShareIdFromLocation() {
  if (typeof window === "undefined") return "";
  return eventIdFromSharePath(window.location.pathname) || new URLSearchParams(window.location.search).get("event") || "";
}

function eventShareUrl(eventId) {
  if (typeof window === "undefined") return "";
  const url = new URL(window.location.href);
  url.pathname = `/event/${encodeURIComponent(String(eventId))}`;
  url.search = "";
  url.hash = "";
  return url.toString();
}

const statusConfig = {
  Confirmed: "border-emerald-400/70 bg-emerald-400/10 text-emerald-300",
  Unconfirmed: "border-yellow-400/70 bg-yellow-400/10 text-yellow-300",
  "Need Attention": "border-purple-400/70 bg-purple-400/10 text-purple-300",
  "No Lineup": "border-purple-400/70 bg-purple-400/10 text-purple-300",
  Urgent: "border-purple-400/70 bg-purple-400/10 text-purple-300",
};

function statusClass(status) {
  return statusConfig[status] ?? statusConfig.Unconfirmed;
}

function statusLabel(status) {
  if (status === "No Lineup") return "Need Attention";
  return status === "Unconfirmed" ? "Pending" : status;
}

const filterItems = [
  { key: "All", label: "All", icon: null },
  { key: "Need Attention", label: "Need Attention", icon: AlertTriangle },
  { key: "Unconfirmed", label: "Pending", icon: Clock },
  { key: "Confirmed", label: "Confirmed", icon: CheckCircle2 },
];

const statusOptions = ["Unconfirmed", "Confirmed", "Need Attention"];

function eventNeedsAttention(event) {
  return event.status === "Need Attention" || event.status === "No Lineup" || !event.slots.length || event.slots.some((slot) => slot.dj.includes("TBD"));
}

function eventMatchesStatusFilter(event, activeFilter) {
  if (activeFilter === "All") return true;
  if (activeFilter === "Need Attention") return eventNeedsAttention(event);
  return event.status === activeFilter;
}

const financeDefaultInputs = {
  eventName: "New Finance Event",
  eventDate: "",
  includeSuggestedFixedCosts: false,
  hasPartnerSplit: false,
  artistCostCurrency: "EUR",
  partnerName: "",
  barSales: 0,
  serviceRate: 0,
  sstRate: 0,
  onlineTicketSales: 0,
  doorSales: 0,
  sponsorship: 0,
  ticketOaShare: 0,
  doorOaShare: 0,
  sponsorshipOaShare: 0,
  barSplitPartnerRate: 0,
  bottleCostRate: 0,
  ambassadorCommission: 0,
  utilities: 0,
  manpower: 0,
  artistCost: 0,
  artistOaShare: 0,
  puspal: 0,
  hotel: 0,
  rider: 0,
  supportingDj: 0,
  mc: 0,
  marketing: 0,
  tshirt: 0,
  otherCost: 0,
};

const financeSuggestedFixedCosts = {
  serviceRate: 10,
  sstRate: 8,
  bottleCostRate: 40,
  utilities: 1500,
  manpower: 13100,
};

const financeScenariosStorageKey = "oa_dashboard_finance_scenarios";

function createFinanceScenario(inputs) {
  const now = new Date().toISOString();
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: String(inputs.eventName || "Untitled Finance Event").trim() || "Untitled Finance Event",
    partnerName: String(inputs.partnerName || "Partner").trim() || "Partner",
    inputs: { ...inputs },
    createdAt: now,
    updatedAt: now,
  };
}

function readSavedFinanceScenarios() {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(financeScenariosStorageKey) || "[]");
    return Array.isArray(parsed) ? parsed.filter((item) => item?.id && item?.inputs) : [];
  } catch {
    return [];
  }
}

function writeSavedFinanceScenarios(scenarios) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(financeScenariosStorageKey, JSON.stringify(scenarios));
}

function currency(value, currencyCode = "MYR") {
  return new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);
}

function percent(value) {
  return `${(Number.isFinite(value) ? value : 0).toFixed(1)}%`;
}

function toAmount(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const cleaned = String(value ?? "")
    .replace(/,/g, "")
    .replace(/\s+/g, "")
    .trim();
  if (!cleaned) return 0;
  const next = Number.parseFloat(cleaned);
  return Number.isFinite(next) ? next : 0;
}

function formatInputNumber(value) {
  const next = toAmount(value);
  return new Intl.NumberFormat("en-MY", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(next) ? next : 0);
}

function formatInputNumberForEdit(value) {
  const next = toAmount(value);
  if (!Number.isFinite(next) || next === 0) return "0";
  const fixed = next.toFixed(2);
  return fixed.replace(/\.00$/, "").replace(/(\.\d)0$/, "$1");
}

function getStatusColor(status) {
  if (status === "Unconfirmed") return "bg-yellow-300";
  if (status === "Confirmed") return "bg-emerald-400";
  if (status === "Need Attention" || status === "No Lineup") return "bg-purple-400";
  return "bg-purple-400";
}

function getStatusCalendarClass(status) {
  if (status === "Unconfirmed") return "border-yellow-300/40 bg-yellow-400/15 text-yellow-100";
  if (status === "Confirmed") return "border-emerald-300/40 bg-emerald-400/15 text-emerald-100";
  if (status === "Need Attention" || status === "No Lineup") return "border-purple-300/40 bg-purple-400/15 text-purple-100";
  return "border-purple-300/40 bg-purple-400/15 text-purple-100";
}

function timeToPercent(time) {
  const [hRaw, mRaw] = time.split(":").map(Number);
  const h = hRaw < 10 ? hRaw + 24 : hRaw;
  const total = h * 60 + mRaw;
  const start = 22 * 60;
  const end = 28 * 60;
  return Math.max(0, Math.min(100, ((total - start) / (end - start)) * 100));
}

function isoToDate(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function formatEventDatePieces(date) {
  const day = date.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase();
  const dayNo = String(date.getDate());
  const month = date.toLocaleDateString("en-US", { month: "short" }).toUpperCase();
  return { day, dayNo, month };
}

function weekWedToSat(baseISO) {
  const base = isoToDate(baseISO);
  const day = base.getDay();
  const mondayIndex = (day + 6) % 7;
  const monday = new Date(base);
  monday.setDate(base.getDate() - mondayIndex);
  const wed = new Date(monday);
  wed.setDate(monday.getDate() + 2);

  return [0, 1, 2, 3].map((offset) => {
    const d = new Date(wed);
    d.setDate(wed.getDate() + offset);
    return d;
  });
}

function minutesFromTime(time) {
  const [hRaw = 0, mRaw = 0] = String(time || "00:00").split(":").map(Number);
  const h = hRaw < 10 ? hRaw + 24 : hRaw;
  return h * 60 + mRaw;
}

function formatClockTime(time, mode = "24") {
  const [hRaw = 0, mRaw = 0] = String(time || "00:00").split(":").map(Number);
  const h = ((Number.isFinite(hRaw) ? hRaw : 0) % 24 + 24) % 24;
  const mm = String(Number.isFinite(mRaw) ? mRaw : 0).padStart(2, "0");

  if (mode === "12") {
    const suffix = h >= 12 ? "PM" : "AM";
    const hour12 = h % 12 || 12;
    return `${hour12}:${mm}${suffix}`;
  }

  return `${String(h).padStart(2, "0")}:${mm}`;
}

function formatTimeRange(start, end, mode = "24") {
  if (!start || !end) return "";
  return `${formatClockTime(start, mode)}-${formatClockTime(end, mode)}`;
}

function whatsappDigits(raw) {
  const digits = String(raw || "").replace(/[^\d+]/g, "");
  const cleaned = digits.startsWith("+") ? digits.slice(1) : digits;
  const numbersOnly = cleaned.replace(/\D/g, "");
  if (!numbersOnly) return "";
  if (numbersOnly.startsWith("0")) return `60${numbersOnly.slice(1)}`;
  if (numbersOnly.startsWith("60")) return numbersOnly;
  return numbersOnly;
}

function whatsappLink(phone, text) {
  const digits = whatsappDigits(phone);
  if (!digits) return "";
  return `https://wa.me/${digits}?text=${encodeURIComponent(String(text || ""))}`;
}

function normalizeDjLookupKey(value) {
  const raw = String(value || "")
    .toLowerCase()
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[^a-z0-9\s']/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return raw.startsWith("dj ") ? raw.slice(3).trim() : raw;
}

function canonicalDjName(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

function parseDjLineup(value) {
  const displayName = canonicalDjName(value);
  if (!displayName) return { displayName: "", connector: "", participants: [] };
  const connector = displayName.match(/\s(B2B|B3B|F2F)\s/)?.[1] || "";
  const participants = displayName
    .split(/\s+(?:B2B|B3B|F2F)\s+/i)
    .map(canonicalDjName)
    .filter(Boolean);

  return {
    displayName,
    connector,
    participants: participants.length ? Array.from(new Set(participants)) : [displayName],
  };
}

function normalizeLineupConnector(value) {
  const raw = String(value || "")
    .trim()
    .toUpperCase();
  if (raw === "B2B" || raw === "B3B" || raw === "F2F") return raw;
  return "";
}

function lineupParticipantCount(connector) {
  if (connector === "B3B") return 3;
  if (connector === "B2B" || connector === "F2F") return 2;
  return 1;
}

function normalizeLineupParticipants(participants, desiredCount = 1) {
  const list = Array.isArray(participants) ? participants.map((name) => String(name || "").trim()) : [];
  const next = list.slice(0, Math.max(1, desiredCount));
  while (next.length < Math.max(1, desiredCount)) next.push("");
  return next;
}

function buildLineupDisplayName({ connector, participants }) {
  const normalizedConnector = normalizeLineupConnector(connector);
  const cleaned = (Array.isArray(participants) ? participants : [])
    .map(canonicalDjName)
    .filter(Boolean);
  if (!cleaned.length) return "";
  if (!normalizedConnector || cleaned.length < 2) return cleaned[0];
  const unique = Array.from(new Set(cleaned));
  if (unique.length < 2) return unique[0];
  return unique.join(` ${normalizedConnector} `);
}

function slotLineupForSave(slot) {
  const parsed = parseDjLineup(slot?.dj);
  const connector = normalizeLineupConnector(slot?.djConnector || parsed.connector);
  const sourceParticipants =
    Array.isArray(slot?.djParticipants) && slot.djParticipants.length ? slot.djParticipants : parsed.participants;
  const participants = Array.from(new Set(sourceParticipants.map(canonicalDjName).filter(Boolean)));
  const displayName = buildLineupDisplayName({ connector, participants }) || parsed.displayName;
  return { displayName, connector, participants };
}

function aggregateAssignmentStatus(assignments) {
  const statuses = (assignments || []).map((assignment) => assignment.assignmentStatus).filter(Boolean);
  if (!statuses.length) return "Pending";
  if (statuses.includes("Pending")) return "Pending";
  if (statuses.includes("Rejected")) return "Rejected";
  if (statuses.every((status) => status === "Accepted")) return "Accepted";
  return "Confirmed";
}

function formatDjDisplayName(value) {
  const raw = String(value || "").trim();
  if (!raw) return "DJ";
  const noPrefix = raw.toLowerCase().startsWith("dj ") ? raw.slice(3).trim() : raw;
  return noPrefix
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => (word.length ? `${word[0].toUpperCase()}${word.slice(1).toLowerCase()}` : ""))
    .filter(Boolean)
    .join(" ");
}

function slotNeedsTime(slot) {
  return normalizeSlotRole(slot?.role) !== "MC";
}

function slotHasValidTime(slot) {
  if (!slotNeedsTime(slot)) return true;
  if (!slot?.start || !slot?.end) return false;
  return minutesFromTime(slot.end) > minutesFromTime(slot.start);
}

function timeFromMinutes(totalMinutes) {
  const displayHour = Math.floor(totalMinutes / 60) % 24;
  const minutes = totalMinutes % 60;
  return `${String(displayHour).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

function buildSmartSlots({ djCount = 3, start = "22:30", end = "03:00" }) {
  const startM = minutesFromTime(start);
  const endM = minutesFromTime(end);
  const duration = endM - startM;
  if (duration < 15) return [];
  const maxSlots = Math.max(1, Math.floor(duration / 15));
  const count = Math.max(1, Math.min(8, maxSlots, Number(djCount) || 3));

  const totalSteps = Math.floor(duration / 15);
  const baseSteps = Math.floor(totalSteps / count);
  const remainder = totalSteps % count;
  const middle = (count - 1) / 2;
  const slots = [];
  let cursor = startM;

  for (let i = 0; i < count; i += 1) {
    const extraStep = i >= Math.floor((count - remainder) / 2) && i < Math.floor((count - remainder) / 2) + remainder ? 1 : 0;
    const steps = Math.max(1, baseSteps + extraStep);
    const slotStart = cursor;
    const slotEnd = i === count - 1 ? endM : Math.min(endM, cursor + steps * 15);
    const role = count === 1 ? "Main" : i === 0 ? "Warm-up" : i === count - 1 ? "Closer" : "Main";
    const distanceFromMiddle = Math.abs(i - middle);
    const energy = role === "Warm-up" ? 2 : role === "Closer" ? 4 : distanceFromMiddle < 0.75 ? 5 : 4;

    slots.push({
      dj: "",
      role,
      start: timeFromMinutes(slotStart),
      end: timeFromMinutes(slotEnd),
      energy,
    });

    cursor = slotEnd;
  }

  return slots.filter((slot) => minutesFromTime(slot.end) > minutesFromTime(slot.start));
}

function validateScheduleDays(days) {
  const errorsByDate = {};
  const conflictSlots = {};

  for (const day of days) {
    const slots = day.slots
      .map((slot, index) => ({
        index,
        dj: String(slot.dj || "").trim() || `Slot ${index + 1}`,
        role: slot.role,
        start: slot.start,
        end: slot.end,
        startM: slot.start ? minutesFromTime(slot.start) : null,
        endM: slot.end ? minutesFromTime(slot.end) : null,
      }))
      .filter((slot) => slot.role !== "MC" || (slot.start && slot.end));

    const dayErrors = [];
    const dayConflicts = new Set();

    for (const slot of slots) {
      if (slot.role !== "MC" && (!slot.start || !slot.end)) {
        dayErrors.push(`${slot.dj} needs a start and end time.`);
        dayConflicts.add(slot.index);
        continue;
      }
      if (slot.endM <= slot.startM) {
        dayErrors.push(`${slot.dj} must end after it starts.`);
        dayConflicts.add(slot.index);
      }
    }

    const validSlots = slots
      .filter((slot) => slot.role !== "MC" && slot.endM > slot.startM)
      .sort((a, b) => a.startM - b.startM);
    for (let i = 0; i < validSlots.length; i += 1) {
      for (let j = i + 1; j < validSlots.length; j += 1) {
        const a = validSlots[i];
        const b = validSlots[j];
        if (b.startM >= a.endM) break;
        dayErrors.push(`${a.dj} (${a.start}-${a.end}) overlaps ${b.dj} (${b.start}-${b.end}).`);
        dayConflicts.add(a.index);
        dayConflicts.add(b.index);
      }
    }

    if (dayErrors.length) {
      errorsByDate[day.isoDate] = dayErrors;
      conflictSlots[day.isoDate] = dayConflicts;
    }
  }

  return { errorsByDate, conflictSlots, hasErrors: Object.keys(errorsByDate).length > 0 };
}

function getConfirmationBlockers(event) {
  const slots = event.slots ?? [];
  const validation = validateScheduleDays([{ isoDate: event.date, slots }]);
  const blockers = [];
  const assignedSlots = slots.filter((slot) => {
    const name = String(slot.dj || "").trim();
    return name && !name.toUpperCase().includes("TBD");
  });
  const latestEnd = slots.reduce((latest, slot) => Math.max(latest, minutesFromTime(slot.end || "00:00")), 0);
  const windowStart = minutesFromTime("23:00");
  const windowEnd = minutesFromTime("03:00");
  const coverageIntervals = slots
    .filter((slot) => slot.role !== "MC")
    .map((slot) => ({
      startM: minutesFromTime(slot.start || "00:00"),
      endM: minutesFromTime(slot.end || "00:00"),
    }))
    .filter((slot) => slot.endM > slot.startM)
    .sort((a, b) => a.startM - b.startM);
  const coversWindow = (() => {
    if (!coverageIntervals.length) return false;
    let cursor = windowStart;
    for (const interval of coverageIntervals) {
      if (interval.endM <= cursor) continue;
      if (interval.startM > cursor) return false;
      cursor = Math.max(cursor, interval.endM);
      if (cursor >= windowEnd) return true;
    }
    return false;
  })();

  if (!assignedSlots.length) blockers.push("Add at least one DJ/MC before confirming.");
  if (validation.hasErrors) blockers.push("Fix set time clashes before confirming.");
  if (!coversWindow) blockers.push("Set times must be filled from 11:00PM to 03:00AM (no gaps) before confirming.");
  if (latestEnd < windowEnd) blockers.push("Lineup must end at 03:00 or later before confirming.");

  return blockers;
}

function buildTimeOptions() {
  const options = [];
  for (let minutes = 22 * 60; minutes <= 28 * 60; minutes += 15) {
    const displayHour = Math.floor(minutes / 60) % 24;
    const m = minutes % 60;
    const label = `${String(displayHour).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    options.push(label);
  }
  return options;
}

const timeOptions = buildTimeOptions();
const roleOptions = ["Warm-up", "Main", "Closer", "MC"];
const stageOptions = ["Centre Stage", "Main Stage"];
const icNotePattern = /\[dashboard:ic=([^\]]*)\]/;
const mentionsNotePattern = /\[dashboard:mentions=([^\]]*)\]/;
const consoleFeeNotePattern = /\[dashboard:console_fee=([^\]]*)\]/;
const malaysiaHolidayFallback = [
  { date: "2026-01-01", localName: "New Year's Day", name: "New Year's Day", countryCode: "MY", global: true, types: ["National"] },
  { date: "2026-02-01", localName: "Federal Territory Day", name: "Federal Territory Day", countryCode: "MY", global: true, types: ["National"] },
  { date: "2026-02-01", localName: "Thaipusam", name: "Thaipusam", countryCode: "MY", global: false, types: ["State & Federal Territory"] },
  { date: "2026-02-02", localName: "Thaipusam Holiday", name: "Thaipusam Holiday", countryCode: "MY", global: false, types: ["State & Federal Territory"] },
  { date: "2026-02-17", localName: "Chinese New Year", name: "Chinese New Year", countryCode: "MY", global: true, types: ["National"] },
  { date: "2026-02-18", localName: "Chinese New Year Holiday", name: "Chinese New Year Holiday", countryCode: "MY", global: true, types: ["National"] },
  { date: "2026-03-20", localName: "Eid al-Fitr", name: "Eid al-Fitr", countryCode: "MY", global: true, types: ["National"] },
  { date: "2026-03-21", localName: "Eid al-Fitr Holiday", name: "Eid al-Fitr Holiday", countryCode: "MY", global: true, types: ["National"] },
  { date: "2026-04-03", localName: "Good Friday", name: "Good Friday", countryCode: "MY", global: false, types: ["State & Federal Territory"] },
  { date: "2026-05-01", localName: "Labour Day", name: "Labour Day", countryCode: "MY", global: true, types: ["National"] },
  { date: "2026-05-27", localName: "Eid al-Adha", name: "Eid al-Adha", countryCode: "MY", global: true, types: ["National"] },
  { date: "2026-05-27", localName: "Hari Raya Haji", name: "Hari Raya Haji", countryCode: "MY", global: false, types: ["State & Federal Territory"] },
  { date: "2026-05-28", localName: "Eid al-Adha Holiday", name: "Eid al-Adha Holiday", countryCode: "MY", global: true, types: ["National"] },
  { date: "2026-05-31", localName: "Wesak Day", name: "Wesak Day", countryCode: "MY", global: true, types: ["National"] },
  { date: "2026-06-01", localName: "King's Birthday", name: "King's Birthday", countryCode: "MY", global: true, types: ["National"] },
  { date: "2026-06-01", localName: "Gawai Dayak", name: "Gawai Dayak", countryCode: "MY", global: false, types: ["State & Federal Territory"] },
  { date: "2026-06-02", localName: "Gawai Dayak Holiday", name: "Gawai Dayak Holiday", countryCode: "MY", global: false, types: ["State & Federal Territory"] },
  { date: "2026-06-17", localName: "Awal Muharram", name: "Awal Muharram", countryCode: "MY", global: true, types: ["National"] },
  { date: "2026-08-25", localName: "Prophet Muhammad's Birthday", name: "Prophet Muhammad's Birthday", countryCode: "MY", global: true, types: ["National"] },
  { date: "2026-08-31", localName: "National Day", name: "National Day", countryCode: "MY", global: true, types: ["National"] },
  { date: "2026-09-16", localName: "Malaysia Day", name: "Malaysia Day", countryCode: "MY", global: true, types: ["National"] },
  { date: "2026-11-08", localName: "Deepavali", name: "Deepavali", countryCode: "MY", global: true, types: ["National"] },
  { date: "2026-11-09", localName: "Deepavali Holiday", name: "Deepavali Holiday", countryCode: "MY", global: true, types: ["National"] },
  { date: "2026-12-25", localName: "Christmas Day", name: "Christmas Day", countryCode: "MY", global: true, types: ["National"] },
  { date: "2027-01-01", localName: "New Year's Day", name: "New Year's Day", countryCode: "MY", global: true, types: ["National"] },
  { date: "2027-01-22", localName: "Thaipusam", name: "Thaipusam", countryCode: "MY", global: false, types: ["State & Federal Territory"] },
  { date: "2027-01-24", localName: "Thaipusam Holiday", name: "Thaipusam Holiday", countryCode: "MY", global: false, types: ["State & Federal Territory"] },
  { date: "2027-02-01", localName: "Federal Territory Day", name: "Federal Territory Day", countryCode: "MY", global: true, types: ["National"] },
  { date: "2027-02-06", localName: "Chinese New Year", name: "Chinese New Year", countryCode: "MY", global: true, types: ["National"] },
  { date: "2027-02-07", localName: "Chinese New Year Holiday", name: "Chinese New Year Holiday", countryCode: "MY", global: true, types: ["National"] },
  { date: "2027-03-10", localName: "Eid al-Fitr", name: "Eid al-Fitr", countryCode: "MY", global: true, types: ["National"] },
  { date: "2027-03-11", localName: "Eid al-Fitr Holiday", name: "Eid al-Fitr Holiday", countryCode: "MY", global: true, types: ["National"] },
  { date: "2027-03-26", localName: "Good Friday", name: "Good Friday", countryCode: "MY", global: false, types: ["State & Federal Territory"] },
  { date: "2027-05-01", localName: "Labour Day", name: "Labour Day", countryCode: "MY", global: true, types: ["National"] },
  { date: "2027-05-17", localName: "Eid al-Adha", name: "Eid al-Adha", countryCode: "MY", global: true, types: ["National"] },
  { date: "2027-05-17", localName: "Hari Raya Haji", name: "Hari Raya Haji", countryCode: "MY", global: false, types: ["State & Federal Territory"] },
  { date: "2027-05-18", localName: "Eid al-Adha Holiday", name: "Eid al-Adha Holiday", countryCode: "MY", global: true, types: ["National"] },
  { date: "2027-05-20", localName: "Wesak Day", name: "Wesak Day", countryCode: "MY", global: true, types: ["National"] },
  { date: "2027-06-01", localName: "Gawai Dayak", name: "Gawai Dayak", countryCode: "MY", global: false, types: ["State & Federal Territory"] },
  { date: "2027-06-02", localName: "Gawai Dayak Holiday", name: "Gawai Dayak Holiday", countryCode: "MY", global: false, types: ["State & Federal Territory"] },
  { date: "2027-06-06", localName: "Awal Muharram", name: "Awal Muharram", countryCode: "MY", global: true, types: ["National"] },
  { date: "2027-06-07", localName: "King's Birthday", name: "King's Birthday", countryCode: "MY", global: true, types: ["National"] },
  { date: "2027-08-15", localName: "Prophet Muhammad's Birthday", name: "Prophet Muhammad's Birthday", countryCode: "MY", global: true, types: ["National"] },
  { date: "2027-08-31", localName: "National Day", name: "National Day", countryCode: "MY", global: true, types: ["National"] },
  { date: "2027-09-16", localName: "Malaysia Day", name: "Malaysia Day", countryCode: "MY", global: true, types: ["National"] },
  { date: "2027-10-28", localName: "Deepavali", name: "Deepavali", countryCode: "MY", global: true, types: ["National"] },
  { date: "2027-12-25", localName: "Christmas Day", name: "Christmas Day", countryCode: "MY", global: true, types: ["National"] },
];
const supabaseEventSelect = `
  id,
  event_name,
  event_date,
  day_name,
  event_type,
  genre_profile,
  stage,
  status,
  notes,
  event_slots (
    id,
    slot_order,
    start_time,
    end_time,
    role,
    expected_energy,
    event_assignments (
      id,
      assignment_status,
      fee,
      notes,
      djs (
        id,
        name,
        linked_user_id
      )
    )
  )
`;

const supabaseEventSelectLegacy = `
  id,
  event_name,
  event_date,
  day_name,
  event_type,
  genre_profile,
  stage,
  status,
  notes,
  event_slots (
    id,
    slot_order,
    start_time,
    end_time,
    role,
    expected_energy,
    event_assignments (
      id,
      assignment_status,
      fee,
      notes,
      djs (
        id,
        name
      )
    )
  )
`;

async function runEventSelect(buildQuery) {
  let result = await buildQuery(supabaseEventSelect);
  const message = String(result.error?.message || "").toLowerCase();
  if (result.error && message.includes("linked_user_id")) {
    result = await buildQuery(supabaseEventSelectLegacy);
  }
  return result;
}

function timeForInput(time) {
  return String(time || "00:00").slice(0, 5);
}

function normalizeSlotRole(role) {
  if (role === "Driver" || role === "Peak") return "Main";
  return role || "Warm-up";
}

function splitGenreTags(value) {
  return String(value || "")
    .split(/[\/,]/)
    .map((tag) => tag.trim())
    .filter(Boolean);
}

function hashString(value) {
  const text = String(value || "");
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function genreTagClass(tag) {
  const palette = [
    "border-cyan-300/25 bg-cyan-400/10 text-cyan-100",
    "border-fuchsia-300/25 bg-fuchsia-400/10 text-fuchsia-100",
    "border-emerald-300/25 bg-emerald-400/10 text-emerald-100",
    "border-amber-300/25 bg-amber-400/10 text-amber-100",
    "border-sky-300/25 bg-sky-400/10 text-sky-100",
    "border-purple-300/25 bg-purple-400/10 text-purple-100",
  ];
  return palette[hashString(tag) % palette.length];
}

function joinGenreTags(tags) {
  return Array.from(new Set(tags.map((tag) => String(tag || "").trim()).filter(Boolean))).join(" / ");
}

function parseIc(notes) {
  return String(notes || "").match(icNotePattern)?.[1] || "";
}

function parseMentionUserIds(notes) {
  const raw = String(notes || "").match(mentionsNotePattern)?.[1] || "";
  return raw
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

function parseConsoleFeeAmount(notes) {
  const raw = String(notes || "").match(consoleFeeNotePattern)?.[1] || "";
  if (!raw) return null;
  const amount = Number.parseFloat(raw);
  return Number.isFinite(amount) && amount >= 0 ? amount : null;
}

function stripDashboardNotes(notes) {
  return String(notes || "")
    .replace(icNotePattern, "")
    .replace(mentionsNotePattern, "")
    .replace(consoleFeeNotePattern, "")
    .trim();
}

function setDashboardNotes(notes, ic, mentionUserIds = [], consoleFeeAmount = null) {
  const cleanNotes = stripDashboardNotes(notes);
  const cleanIc = String(ic || "").trim();
  const cleanMentionUserIds = Array.from(new Set((mentionUserIds || []).map((id) => String(id || "").trim()).filter(Boolean)));
  const cleanConsoleFee = consoleFeeAmount != null ? Number(consoleFeeAmount) : null;
  return [
    cleanNotes,
    cleanIc ? `[dashboard:ic=${cleanIc}]` : "",
    cleanMentionUserIds.length ? `[dashboard:mentions=${cleanMentionUserIds.join(",")}]` : "",
    Number.isFinite(cleanConsoleFee) && cleanConsoleFee >= 0 ? `[dashboard:console_fee=${cleanConsoleFee}]` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

function mentionSlug(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function displayNameForUser(user) {
  return String(user?.displayName || user?.email || "")
    .trim()
    .replace(/\s+/g, " ");
}

function mentionHandleForUser(user) {
  if (user?.mentionHandle) return String(user.mentionHandle);
  const displayName = displayNameForUser(user);
  const emailLocal = String(user?.email || "").split("@")[0] || "";
  const handle = displayName || emailLocal || "user";
  return handle.replace(/[^a-zA-Z0-9._-]+/g, "");
}

function mentionAliasesForUser(user) {
  const displayName = displayNameForUser(user);
  const email = String(user?.email || "");
  const emailLocal = email.split("@")[0] || "";
  return Array.from(new Set([displayName, displayName.replace(/\s+/g, ""), email, emailLocal, mentionHandleForUser(user)].map(mentionSlug).filter(Boolean)));
}

function textMentionsUser(text, user) {
  const aliases = mentionAliasesForUser(user);
  if (!aliases.length) return false;
  const mentionTokens = String(text || "").match(/@[a-zA-Z0-9._-]+/g) || [];
  return mentionTokens.some((token) => aliases.includes(mentionSlug(token.slice(1))));
}

function mentionedUserIdsFromText(text, users) {
  const mentionTokens = String(text || "").match(/@[a-zA-Z0-9._-]+/g) || [];
  const tokenSlugs = new Set(mentionTokens.map((token) => mentionSlug(token.slice(1))).filter(Boolean));
  return Array.from(
    new Set(
      (users || [])
        .filter((user) => user?.id && mentionAliasesForUser(user).some((alias) => tokenSlugs.has(alias)))
        .map((user) => user.id),
    ),
  );
}

function mapSupabaseComment(row) {
  return {
    id: String(row.id),
    eventId: String(row.event_id),
    userId: String(row.user_id),
    body: String(row.body || ""),
    mentionUserIds: Array.isArray(row.mention_user_ids) ? row.mention_user_ids.map(String) : [],
    createdAt: row.created_at,
  };
}

function displayNameForUserId(userId, users, currentUser) {
  const matched = (users || []).find((user) => user.id === userId);
  if (matched) return displayNameForUser(matched) || matched.email || "User";
  if (currentUser?.id === userId) return currentUser.user_metadata?.display_name || currentUser.user_metadata?.full_name || currentUser.email || "You";
  return "Dashboard user";
}

function formatCommentTime(value) {
  if (!value) return "";
  return new Date(value).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function activeMentionToken(text, caretIndex) {
  const beforeCaret = String(text || "").slice(0, caretIndex);
  const match = beforeCaret.match(/(^|\s)@([a-zA-Z0-9._-]*)$/);
  if (!match) return null;
  const query = match[2] || "";
  return {
    query,
    start: caretIndex - query.length - 1,
    end: caretIndex,
  };
}

function userMatchesMentionQuery(user, query) {
  const q = mentionSlug(query);
  if (!q) return true;
  return [displayNameForUser(user), user?.email, mentionHandleForUser(user)].some((value) => mentionSlug(value).includes(q));
}

function userForMentionToken(token, users) {
  const slug = mentionSlug(String(token || "").replace(/^@/, ""));
  if (!slug) return null;
  return (users || []).find((user) => mentionAliasesForUser(user).includes(slug)) || null;
}

function MentionText({ text, users, className = "" }) {
  const parts = String(text || "").split(/(@[a-zA-Z0-9._-]+)/g);
  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (!part.startsWith("@")) return <React.Fragment key={`${index}-${part}`}>{part}</React.Fragment>;
        const user = userForMentionToken(part, users);
        if (!user) return <React.Fragment key={`${index}-${part}`}>{part}</React.Fragment>;
        return (
          <span
            key={`${index}-${part}`}
            className="font-black text-cyan-100 underline decoration-cyan-300/70 decoration-2 underline-offset-2"
            title={`${displayNameForUser(user)} · ${user.email || user.id}`}
          >
            {part}
          </span>
        );
      })}
    </span>
  );
}

function CommentComposer({ mentionUsers, disabled, onSubmit }) {
  const [body, setBody] = useState("");
  const [activeMention, setActiveMention] = useState(null);
  const [busy, setBusy] = useState(false);
  const mentionSuggestions = activeMention ? mentionUsers.filter((user) => userMatchesMentionQuery(user, activeMention.query)).slice(0, 6) : [];

  const updateActiveMention = (text, caretIndex) => {
    setActiveMention(activeMentionToken(text, caretIndex));
  };

  const insertMention = (user) => {
    if (!activeMention) return;
    const handle = mentionHandleForUser(user);
    setBody((current) => `${current.slice(0, activeMention.start)}@${handle} ${current.slice(activeMention.end)}`);
    setActiveMention(null);
  };

  const submit = async () => {
    const cleanBody = body.trim();
    if (!cleanBody || busy || disabled) return;
    setBusy(true);
    try {
      await onSubmit(cleanBody);
      setBody("");
      setActiveMention(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-2">
      <div className="relative">
        <textarea
          value={body}
          disabled={disabled || busy}
          onChange={(e) => {
            setBody(e.target.value);
            updateActiveMention(e.target.value, e.target.selectionStart);
          }}
          onClick={(e) => updateActiveMention(e.currentTarget.value, e.currentTarget.selectionStart)}
          onKeyUp={(e) => updateActiveMention(e.currentTarget.value, e.currentTarget.selectionStart)}
          onBlur={() => window.setTimeout(() => setActiveMention(null), 120)}
          className="min-h-20 w-full resize-y rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm font-bold text-white/75 outline-none placeholder:text-white/25 focus:border-cyan-300/50 disabled:cursor-not-allowed disabled:opacity-50"
          placeholder="Write a comment... Type @ to mention someone."
        />
        {activeMention ? (
          <div className="absolute left-2 right-2 top-full z-20 mt-1 overflow-hidden rounded-xl border border-cyan-300/20 bg-[#12111f] shadow-2xl shadow-black/50">
            {mentionSuggestions.length ? (
              mentionSuggestions.map((user) => (
                <button
                  key={user.id || user.email}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => insertMention(user)}
                  className="grid w-full grid-cols-[auto_minmax(0,1fr)] items-center gap-2 border-b border-white/10 px-3 py-2 text-left last:border-b-0 hover:bg-cyan-400/10"
                >
                  <AtSign className="h-4 w-4 text-cyan-100/70" />
                  <span className="min-w-0">
                    <span className="block truncate text-xs font-black text-white/85">{displayNameForUser(user) || mentionHandleForUser(user)}</span>
                    <span className="block truncate text-[10px] font-bold text-white/35">{user.email || user.id}</span>
                  </span>
                </button>
              ))
            ) : (
              <div className="px-3 py-2 text-xs font-bold text-white/35">No users match @{activeMention.query}</div>
            )}
          </div>
        ) : null}
      </div>
      <div className="mt-2 flex justify-end">
        <Button
          onClick={submit}
          disabled={disabled || busy || !body.trim()}
          className="h-9 rounded-xl bg-cyan-300 px-4 text-xs font-black text-black hover:bg-cyan-200 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/30"
        >
          {busy ? "Posting..." : "Post Comment"}
        </Button>
      </div>
    </div>
  );
}

function isSupabaseUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value));
}

function firstRelated(value) {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function normalizeJsonArray(value) {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function mapDjProfile(row) {
  return {
    id: String(row.id || row.name || ""),
    name: row.name || row.stage_name || "Untitled DJ",
    stageName: row.stage_name || "",
    realName: row.real_name || "",
    email: row.email || "",
    linkedUserId: row.linked_user_id || "",
    phone: row.phone || "",
    instagramHandle: row.instagram_handle || "",
    soundcloudUrl: row.soundcloud_url || "",
    pressKitUrl: row.press_kit_url || "",
    bio: row.bio || "",
    homeCity: row.home_city || "",
    country: row.country || "",
    status: row.status || "Active",
    notes: row.notes || "",
    genres: normalizeJsonArray(row.genres)
      .map((genre) => ({
        id: String(genre.id || genre.name || ""),
        name: genre.name || "",
        isPrimary: Boolean(genre.is_primary),
      }))
      .filter((genre) => genre.name),
    fees: normalizeJsonArray(row.active_fees)
      .map((fee) => ({
        id: String(fee.id || `${fee.fee_name}-${fee.amount}`),
        name: fee.fee_name || "Standard",
        currencyCode: fee.currency_code || "MYR",
        amount: Number(fee.amount) || 0,
        feeType: fee.fee_type || "per_set",
        setLengthMinutes: fee.set_length_minutes,
        minBookingHours: fee.min_booking_hours,
        validFrom: fee.valid_from || "",
        validUntil: fee.valid_until || "",
        notes: fee.notes || "",
      }))
      .filter((fee) => fee.id),
  };
}

function deriveDjProfilesFromEvents(events) {
  const byName = new Map();
  for (const event of events) {
    for (const slot of event.slots || []) {
      const lineup = parseDjLineup(slot.dj);
      for (const name of lineup.participants) {
        if (!name || name.toUpperCase().includes("TBD") || slot.role === "MC") continue;
        const profile = byName.get(name) ?? {
          id: name,
          name,
          stageName: "",
          realName: "",
          email: "",
          phone: "",
          instagramHandle: "",
          soundcloudUrl: "",
          pressKitUrl: "",
          bio: "",
          homeCity: "",
          country: "",
          status: "Active",
          notes: "",
          genres: [],
          fees: [],
        };
        const genreNames = new Set(profile.genres.map((genre) => genre.name.toLowerCase()));
        for (const genreName of splitGenreTags(event.genre)) {
          if (genreNames.has(genreName.toLowerCase())) continue;
          profile.genres.push({ id: `${name}-${genreName}`, name: genreName, isPrimary: !profile.genres.length });
          genreNames.add(genreName.toLowerCase());
        }
        byName.set(name, profile);
      }
    }
  }
  return Array.from(byName.values()).sort((a, b) => a.name.localeCompare(b.name));
}

function formatFeeType(value) {
  return String(value || "per_set")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDjFee(fee) {
  const amount = new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency: fee.currencyCode || "MYR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(fee.amount) ? fee.amount : 0);
  return `${amount} · ${formatFeeType(fee.feeType)}`;
}

function monthInputValueFromDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function dateFromMonthInput(value) {
  const [year, month] = String(value || "").split("-").map(Number);
  const today = new Date();
  return new Date(Number.isFinite(year) ? year : today.getFullYear(), Number.isFinite(month) ? month - 1 : today.getMonth(), 1);
}

function profileLookupKeys(profile) {
  return new Set(
    [profile?.name, profile?.stageName, profile?.realName]
      .map(normalizeDjLookupKey)
      .filter(Boolean),
  );
}

function assignmentStatusLabel(status) {
  if (status === "Accepted") return "Accepted";
  if (status === "Rejected") return "Rejected";
  if (status === "Confirmed") return "Auto Confirmed";
  return "Awaiting DJ";
}

function assignmentStatusClass(status) {
  if (status === "Accepted" || status === "Confirmed") return "border-emerald-300/30 bg-emerald-400/10 text-emerald-100";
  if (status === "Rejected") return "border-rose-300/30 bg-rose-500/10 text-rose-100";
  return "border-yellow-300/30 bg-yellow-400/10 text-yellow-100";
}

function mapSupabaseEvent(row) {
  const date = row.event_date;
  const dateObj = isoToDate(date);
  const { day, dayNo, month } = formatEventDatePieces(dateObj);
  const slots = Array.isArray(row.event_slots)
    ? [...row.event_slots]
        .sort((a, b) => (a.slot_order ?? 0) - (b.slot_order ?? 0))
        .map((slot) => {
          const assignments = (Array.isArray(slot.event_assignments) ? slot.event_assignments : [slot.event_assignments].filter(Boolean)).map((assignment) => ({
            assignmentId: assignment?.id ? String(assignment.id) : null,
            djId: assignment?.djs?.id ? String(assignment.djs.id) : null,
            linkedUserId: assignment?.djs?.linked_user_id ? String(assignment.djs.linked_user_id) : "",
            assignmentStatus: assignment?.assignment_status || "Pending",
            dj: assignment?.djs?.name || assignment?.notes || "(OPENING TBD)",
            notes: assignment?.notes || "",
            fee: assignment?.fee != null ? Number(assignment.fee) : null,
          }));
          const assignment = assignments[0] || null;
          const commonNote =
            assignments.length > 1 && assignments.every((item) => item.notes && item.notes === assignments[0].notes)
              ? assignments[0].notes
              : "";
          const parsedNote = commonNote ? parseDjLineup(commonNote) : null;
          const assignmentNames = assignments
            .filter((item) => item.djId && item.dj && !item.dj.toUpperCase().includes("TBD"))
            .map((item) => canonicalDjName(item.dj))
            .filter(Boolean);
          const uniqueAssignmentNames = Array.from(new Set(assignmentNames));
          const inferredConnector = parsedNote?.connector || (uniqueAssignmentNames.length === 3 ? "B3B" : uniqueAssignmentNames.length === 2 ? "B2B" : "");
          const djConnector = normalizeLineupConnector(inferredConnector);
          const djParticipants = uniqueAssignmentNames.length ? uniqueAssignmentNames : parsedNote?.participants || [];
          const dj =
            commonNote ||
            (djParticipants.length > 1 && djConnector
              ? buildLineupDisplayName({ connector: djConnector, participants: djParticipants })
              : assignments.length
                ? assignments.map((item) => item.dj).join(" / ")
                : "(OPENING TBD)");
          const role = normalizeSlotRole(slot.role);
          const needsTime = role !== "MC";
          return {
            id: String(slot.id),
            assignmentId: assignment?.assignmentId || null,
            djId: assignment?.djId || null,
            linkedUserId: assignment?.linkedUserId || "",
            assignmentStatus: aggregateAssignmentStatus(assignments),
            assignments,
            dj,
            djConnector,
            djParticipants,
            role,
            start: needsTime && slot.start_time ? timeForInput(slot.start_time) : "",
            end: needsTime && slot.end_time ? timeForInput(slot.end_time) : "",
            energy: slot.expected_energy ?? 3,
            warning: dj.toUpperCase().includes("TBD"),
            fee: assignment?.fee ?? null,
          };
        })
    : [];

  const statusRaw = row.status || "";
  const normalizedStatus =
    statusRaw === "No Lineup"
      ? slots.length
        ? "Unconfirmed"
        : "Need Attention"
      : statusRaw || (slots.length ? "Unconfirmed" : "Need Attention");

  return {
    id: String(row.id),
    date,
    day,
    dayNo,
    month,
    name: row.event_name || "Untitled",
    genre: row.genre_profile || "—",
    status: normalizedStatus,
    stage: row.stage || stageOptions[0],
    slots,
    ic: parseIc(row.notes),
    mentionedUserIds: parseMentionUserIds(row.notes),
    consoleFeeAmount: parseConsoleFeeAmount(row.notes),
    notes: stripDashboardNotes(row.notes),
  };
}

function isoFromDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function monthStartFromISO(iso) {
  const date = isoToDate(iso);
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function startOfWeekMonday(date) {
  const d = new Date(date);
  const mondayIndex = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - mondayIndex);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfWeekMonday(date) {
  const start = startOfWeekMonday(date);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return end;
}

function weekKeyFromISO(iso) {
  return isoFromDate(startOfWeekMonday(isoToDate(iso)));
}

function weekLabelFromKey(key) {
  const start = isoToDate(key);
  const end = endOfWeekMonday(start);
  const startLabel = start.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const endLabel = end.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  return `${startLabel} - ${endLabel}`;
}

function weekOfMonthFromISO(iso) {
  return Math.max(1, Math.ceil(isoToDate(iso).getDate() / 7));
}

function shiftISODate(iso, days) {
  const date = isoToDate(iso);
  date.setDate(date.getDate() + days);
  return isoFromDate(date);
}

function weekRangeLabelFromDates(dates) {
  const first = dates[0];
  const last = dates[dates.length - 1];
  const firstLabel = first.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  const lastLabel = last.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
  return `${firstLabel} - ${lastLabel}`;
}

function dayLabelFromISO(iso) {
  return isoToDate(iso).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}

function monthGridDates(monthDate) {
  const first = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const last = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
  const gridStart = startOfWeekMonday(first);
  const gridEnd = endOfWeekMonday(last);
  const days = [];
  for (let d = new Date(gridStart); d <= gridEnd; d.setDate(d.getDate() + 1)) {
    days.push(new Date(d));
  }
  return days;
}

function holidayLabel(holiday) {
  return holiday.localName && holiday.localName !== holiday.name ? `${holiday.localName} / ${holiday.name}` : holiday.name || holiday.localName;
}

function fallbackMalaysiaHolidays(years) {
  const wantedYears = new Set(years.map(String));
  return malaysiaHolidayFallback.filter((holiday) => wantedYears.has(String(holiday.date).slice(0, 4)));
}

function CalendarView({ cursorMonth, onChangeMonth, eventsByDate, holidaysByDate, onSelectDate, onPreviewEvent }) {
  const first = new Date(cursorMonth.getFullYear(), cursorMonth.getMonth(), 1);
  const last = new Date(cursorMonth.getFullYear(), cursorMonth.getMonth() + 1, 0);
  const gridStart = startOfWeekMonday(first);
  const gridEnd = endOfWeekMonday(last);

  const days = [];
  for (let d = new Date(gridStart); d <= gridEnd; d.setDate(d.getDate() + 1)) {
    days.push(new Date(d));
  }

  const monthLabel = cursorMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const weekdayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-white/10 bg-white/[0.02] px-3 py-3 md:px-5">
        <div className="text-base font-black tracking-tight text-white md:text-lg">{monthLabel}</div>
        <div className="grid grid-cols-3 gap-1.5 sm:flex sm:items-center sm:gap-2">
          <button
            onClick={() => onChangeMonth(-1)}
            className="rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-[11px] font-black text-white/60 hover:bg-white/10 hover:text-white sm:px-3 sm:text-xs md:px-4"
          >
            Prev
          </button>
          <button
            onClick={() => onChangeMonth(0)}
            className="rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-[11px] font-black text-white/60 hover:bg-white/10 hover:text-white sm:px-3 sm:text-xs md:px-4"
          >
            Today
          </button>
          <button
            onClick={() => onChangeMonth(1)}
            className="rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-[11px] font-black text-white/60 hover:bg-white/10 hover:text-white sm:px-3 sm:text-xs md:px-4"
          >
            Next
          </button>
        </div>
      </div>

      <div className="overflow-hidden">
        <div className="grid min-w-0 grid-cols-7 gap-1 sm:gap-2">
          {weekdayLabels.map((label) => (
            <div key={label} className="px-0.5 text-center text-[9px] font-black uppercase text-white/30 sm:px-2 sm:text-left sm:text-[10px] sm:tracking-[0.25em] md:text-xs">
              {label}
            </div>
          ))}

          {days.map((d) => {
            const iso = isoFromDate(d);
            const isCurrentMonth = d.getMonth() === cursorMonth.getMonth();
            const isToday = iso === isoFromDate(new Date());
            const dayEvents = eventsByDate.get(iso) ?? [];
            const holidays = holidaysByDate.get(iso) ?? [];

            return (
              <div
                key={iso}
                tabIndex={0}
                onClick={() => (dayEvents.length ? onPreviewEvent(dayEvents[0]) : onSelectDate(iso))}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    if (dayEvents.length) {
                      onPreviewEvent(dayEvents[0]);
                    } else {
                      onSelectDate(iso);
                    }
                  }
                }}
                className={`group min-w-0 rounded-lg border p-1 text-left transition sm:min-h-[108px] sm:rounded-2xl sm:p-2 md:min-h-[126px] md:p-3 ${
                  isToday
                    ? "border-purple-200/70 bg-purple-400/10 shadow-[0_0_0_1px_rgba(216,180,254,0.25)]"
                    : isCurrentMonth
                      ? "border-white/10 bg-white/[0.02]"
                      : "border-white/5 bg-white/[0.01] opacity-60"
                } hover:border-purple-300/30 hover:bg-purple-400/5`}
              >
                <div className="flex items-start justify-between gap-1">
                  <div className={`text-xs font-black sm:text-sm ${isToday ? "text-purple-100" : "text-white/80"}`}>{d.getDate()}</div>
                  <div className="flex min-w-0 items-center gap-1">
                    {isToday ? (
                      <div className="hidden rounded-full border border-purple-200/40 bg-purple-300/20 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.12em] text-purple-100 sm:block">
                        Today
                      </div>
                    ) : null}
                    {dayEvents.length ? (
                      <div className="rounded-full border border-white/10 bg-white/5 px-1.5 py-0.5 text-[9px] font-black text-white/50 sm:px-2 sm:text-[10px]">
                        {dayEvents.length}
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="mt-1 space-y-1 sm:mt-2 sm:space-y-1.5">
                  {holidays.slice(0, 2).map((holiday) => (
                    <div
                      key={`${holiday.date}-${holiday.name}`}
                      className="min-w-0 truncate rounded-md border border-cyan-300/30 bg-cyan-400/10 px-1 py-0.5 text-[9px] font-black text-cyan-100 sm:rounded-lg sm:px-2 sm:py-1 sm:text-[10px]"
                      title={holidayLabel(holiday)}
                    >
                      🎉 {holiday.localName || holiday.name}
                    </div>
                  ))}
                  {dayEvents.slice(0, 3).map((event) => (
                    <button
                      key={event.id}
                      type="button"
                      className={`oa-clamp-2 block min-w-0 w-full rounded-md border px-1 py-1 text-left text-[10px] font-black leading-tight sm:oa-clamp-1 sm:rounded-lg sm:px-2 sm:py-1.5 sm:text-[10px] md:text-xs ${getStatusCalendarClass(event.status)}`}
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        onPreviewEvent(event);
                      }}
                      title={`${event.name} · ${statusLabel(event.status)}`}
                    >
                      {event.name}
                    </button>
                  ))}
                  {dayEvents.length > 3 ? (
                    <div className="text-[9px] font-black text-white/30 sm:text-[10px]">+{dayEvents.length - 3} more</div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function AddEventDayModal({
  open,
  onClose,
  timeFormat,
  seedDateISO,
  onChangeSeedDate,
  onSave,
  djOptions,
  djProfiles,
  genreOptions,
  existingEventsByDate,
  holidaysByDate,
  onPreviewEvent,
  editEvent,
  onDeleteDay,
  title = "Add Event Day",
  initialDays,
  dateMode = "week",
  lockDateSelection = false,
  mentionUsers = [],
}) {
  const [days, setDays] = useState(() => {
    return weekWedToSat(seedDateISO).map((d) => {
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      return {
        isoDate: iso,
        name: "",
        genre: "",
        status: "Need Attention",
        remarks: "",
        stage: stageOptions[0],
        slots: [],
      };
    });
  });

  const [hasAutofilled, setHasAutofilled] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [genreDrafts, setGenreDrafts] = useState({});
  const [smartSchedules, setSmartSchedules] = useState({});
  const [pickerMonth, setPickerMonth] = useState(() => new Date(isoToDate(seedDateISO).getFullYear(), isoToDate(seedDateISO).getMonth(), 1));
  const [activeMentionByDate, setActiveMentionByDate] = useState({});

  const djPhoneByName = useMemo(() => {
    const map = new Map();
    for (const p of djProfiles || []) {
      const phone = p.phone || "";
      const key1 = normalizeDjLookupKey(p.name);
      const key2 = normalizeDjLookupKey(p.stageName);
      const key3 = normalizeDjLookupKey(p.realName);
      if (key1) map.set(key1, phone);
      if (key2) map.set(key2, phone);
      if (key3) map.set(key3, phone);
    }
    return map;
  }, [djProfiles]);

  const headerDates = useMemo(() => (dateMode === "day" ? [isoToDate(seedDateISO)] : weekWedToSat(seedDateISO)), [dateMode, seedDateISO]);
  const selectedRangeLabel = useMemo(() => (dateMode === "day" ? dayLabelFromISO(seedDateISO) : weekRangeLabelFromDates(headerDates)), [dateMode, headerDates, seedDateISO]);
  const selectedWeekName = `Week ${weekOfMonthFromISO(seedDateISO)}`;
  const pickerMonthLabel = pickerMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const pickerDays = useMemo(() => monthGridDates(pickerMonth), [pickerMonth]);
  const selectedISOSet = useMemo(() => new Set(headerDates.map(isoFromDate)), [headerDates]);
  const selectedFilledDays = useMemo(() => headerDates.map(isoFromDate).filter((iso) => existingEventsByDate.has(iso)), [existingEventsByDate, headerDates]);
  const selectedHolidayDays = useMemo(() => headerDates.map(isoFromDate).filter((iso) => (holidaysByDate.get(iso) ?? []).length), [holidaysByDate, headerDates]);

  const datesForMode = (iso) => (dateMode === "day" ? [isoToDate(iso)] : weekWedToSat(iso));

  const changeSelectedPeriod = (nextSeedDateISO) => {
    if (lockDateSelection) return;
    onChangeSeedDate(nextSeedDateISO);
    const nextDate = isoToDate(nextSeedDateISO);
    setPickerMonth(new Date(nextDate.getFullYear(), nextDate.getMonth(), 1));
    setDays((prev) => {
      const nextDates = datesForMode(nextSeedDateISO);
      return nextDates.map((d) => {
        const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        const existing = prev.find((x) => x.isoDate === iso);
        return (
          existing ?? {
            isoDate: iso,
            name: "",
            genre: "",
            status: "Need Attention",
            remarks: "",
            stage: stageOptions[0],
            slots: [],
          }
        );
      });
    });
  };

  useEffect(() => {
    if (!open) return;
    setHasAutofilled(false);
    const nextDate = isoToDate(seedDateISO);
    setPickerMonth(new Date(nextDate.getFullYear(), nextDate.getMonth(), 1));
    if (initialDays?.length) {
      setDays(initialDays);
      return;
    }
    setDays(
      datesForMode(seedDateISO).map((d) => {
        const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        return {
          isoDate: iso,
          name: "",
          genre: "",
          status: "Need Attention",
          remarks: "",
          stage: stageOptions[0],
          slots: [],
        };
      }),
    );
  }, [dateMode, initialDays, open, seedDateISO]);

  const modalDays = useMemo(() => {
    return headerDates.map((d) => {
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const existing = days.find((x) => x.isoDate === iso);
      if (existing) return existing;
      return {
        isoDate: iso,
        name: "",
        genre: "",
        status: "Need Attention",
        remarks: "",
        stage: stageOptions[0],
        slots: [],
      };
    });
  }, [days, headerDates]);

  const validation = useMemo(() => validateScheduleDays(modalDays), [modalDays]);

  const setDayField = (isoDate, patch) => {
    setDays((prev) => prev.map((d) => (d.isoDate === isoDate ? { ...d, ...patch } : d)));
  };

  const updateActiveMention = (isoDate, text, caretIndex) => {
    const activeMention = activeMentionToken(text, caretIndex);
    setActiveMentionByDate((prev) => ({ ...prev, [isoDate]: activeMention }));
  };

  const whatsappTextForDaySlot = useCallback(
    (day, slot) => {
      const djName = formatDjDisplayName(slot?.dj);
      const date = dayLabelFromISO(day.isoDate);
      const time =
        slotNeedsTime(slot) && slot?.start && slot?.end ? formatTimeRange(slot.start, slot.end, timeFormat) : "";
      return [
        `Hi ${djName},`,
        `Date: ${date}`,
        `Set time: ${time || "TBC"}`,
        "Let me know if you are available! Thank you!",
      ].join("\n");
    },
    [timeFormat],
  );

  const openWhatsAppForDaySlot = useCallback(
    (day, slot) => {
      const phone = slot?.dj ? djPhoneByName.get(normalizeDjLookupKey(slot.dj)) : "";
      const url = whatsappLink(phone, whatsappTextForDaySlot(day, slot));
      if (!url) return;
      window.open(url, "_blank", "noopener,noreferrer");
    },
    [djPhoneByName, whatsappTextForDaySlot],
  );

  const insertMention = (isoDate, user, activeMention = null) => {
    const handle = mentionHandleForUser(user);
    if (!handle) return;
    setDays((prev) =>
      prev.map((d) => {
        if (d.isoDate !== isoDate) return d;
        const current = String(d.remarks || "");
        if (activeMention && Number.isInteger(activeMention.start) && Number.isInteger(activeMention.end)) {
          return { ...d, remarks: `${current.slice(0, activeMention.start)}@${handle} ${current.slice(activeMention.end)}` };
        }
        const spacer = current && !/\s$/.test(current) ? " " : "";
        return { ...d, remarks: `${current}${spacer}@${handle} ` };
      }),
    );
    setActiveMentionByDate((prev) => ({ ...prev, [isoDate]: null }));
  };

  const addGenreTag = (isoDate, rawTag) => {
    const tag = String(rawTag || "").trim();
    if (!tag) return;
    setDays((prev) =>
      prev.map((d) => (d.isoDate === isoDate ? { ...d, genre: joinGenreTags([...splitGenreTags(d.genre), tag]) } : d)),
    );
    setGenreDrafts((prev) => ({ ...prev, [isoDate]: "" }));
  };

  const removeGenreTag = (isoDate, tagToRemove) => {
    setDays((prev) =>
      prev.map((d) =>
        d.isoDate === isoDate
          ? { ...d, genre: joinGenreTags(splitGenreTags(d.genre).filter((tag) => tag.toLowerCase() !== tagToRemove.toLowerCase())) }
          : d,
      ),
    );
  };

  const getSmartSchedule = (isoDate) => smartSchedules[isoDate] ?? { djCount: 3, start: "22:30", end: "03:00" };

  const setSmartScheduleField = (isoDate, patch) => {
    setSmartSchedules((prev) => ({
      ...prev,
      [isoDate]: {
        ...(prev[isoDate] ?? { djCount: 3, start: "22:30", end: "03:00" }),
        ...patch,
      },
    }));
  };

  const addSlot = (isoDate) => {
    setDays((prev) =>
      prev.map((d) => {
        if (d.isoDate !== isoDate) return d;
        const nextRole = roleOptions[Math.min(d.slots.length, roleOptions.length - 1)];
        const start = d.slots.length ? d.slots[d.slots.length - 1].end : "22:30";
        const startIndex = Math.max(0, timeOptions.indexOf(start));
        const end = timeOptions[Math.min(timeOptions.length - 1, startIndex + 6)] ?? "00:00";
        return {
          ...d,
          slots: [
            ...d.slots,
            {
              dj: "",
              role: nextRole,
              start,
              end,
              energy: 3,
            },
          ],
        };
      }),
    );
  };

  const removeSlot = (isoDate, idx) => {
    setDays((prev) => prev.map((d) => (d.isoDate === isoDate ? { ...d, slots: d.slots.filter((_, i) => i !== idx) } : d)));
  };

  const updateSlot = (isoDate, idx, patch) => {
    setDays((prev) =>
      prev.map((d) => {
        if (d.isoDate !== isoDate) return d;
        const slots = d.slots.map((s, i) => {
          if (i !== idx) return s;
          const next = { ...s, ...patch };
          if (Object.prototype.hasOwnProperty.call(patch, "dj")) {
            const lineup = parseDjLineup(next.dj);
            return { ...next, dj: lineup.displayName, djConnector: lineup.connector, djParticipants: lineup.participants };
          }
          if (
            Object.prototype.hasOwnProperty.call(patch, "djConnector") ||
            Object.prototype.hasOwnProperty.call(patch, "djParticipants")
          ) {
            const connector = normalizeLineupConnector(next.djConnector);
            const desiredCount = lineupParticipantCount(connector);
            const participants = normalizeLineupParticipants(next.djParticipants, desiredCount);
            const dj = buildLineupDisplayName({ connector, participants });
            return { ...next, djConnector: connector, djParticipants: participants, dj };
          }
          return next;
        });
        return { ...d, slots };
      }),
    );
  };

  const normalizeSlotTimes = (isoDate, idx, nextStart, nextEnd) => {
    const startM = minutesFromTime(nextStart);
    const endM = minutesFromTime(nextEnd);
    if (endM > startM) return nextEnd;
    const startIndex = timeOptions.indexOf(nextStart);
    return timeOptions[Math.min(timeOptions.length - 1, Math.max(0, startIndex + 6))] ?? nextEnd;
  };

  const applyQuickSchedule = (isoDate) => {
    const smartSchedule = getSmartSchedule(isoDate);
    setDays((prev) =>
      prev.map((d) => {
        if (d.isoDate !== isoDate) return d;
        const nextSlots = buildSmartSlots(smartSchedule);
        const existingNames = d.slots.map((slot) => slot.dj).filter(Boolean);
        return {
          ...d,
          slots: nextSlots.map((slot, index) => ({ ...slot, dj: existingNames[index] ?? "" })),
        };
      }),
    );
  };

  const autoFill = () => {
    const dates = weekWedToSat(seedDateISO);
    const firstMonth = dates[0].toLocaleDateString("en-US", { month: "short" }).toUpperCase();
    const presets = [
      { name: "CITY FLOW", genre: "BAILE / URBAN" },
      { name: "HUMID", genre: "AFRO / AMAPIANO" },
      { name: "OVERDRIVE", genre: "TECH HOUSE / MELODIC TECHNO" },
      { name: "NO SLEEP CLUB", genre: "TECHNO / HARD TECHNO" },
    ];

    setDays(
      dates.map((d, idx) => {
        const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        const existing = days.find((x) => x.isoDate === iso);
        const base = existing ?? {
          isoDate: iso,
          name: "",
          genre: "",
          status: "Need Attention",
          remarks: "",
          stage: stageOptions[0],
          slots: [],
        };

        return {
          ...base,
          name: base.name || presets[idx]?.name || `${firstMonth} NIGHT`,
          genre: base.genre || presets[idx]?.genre || "",
          slots: base.slots.length ? base.slots : [{ dj: "", role: "Warm-up", start: "22:30", end: "00:00", energy: 2 }],
        };
      }),
    );
    setHasAutofilled(true);
  };

  const save = async () => {
    if (validation.hasErrors) {
      return;
    }

    setIsSaving(true);
    try {
      await onSave(modalDays);
      onClose();
    } catch (error) {
      // The parent shows a toast; keeping the modal open lets the user pick another date.
    } finally {
      setIsSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-2 backdrop-blur-sm sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.18 }}
        className="oa-modal-panel flex max-h-[calc(100svh-0.75rem)] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-[#16152a] to-[#0a0912] text-white shadow-2xl shadow-black/60 sm:max-h-[calc(100svh-1.5rem)] sm:rounded-3xl"
      >
        <div className="oa-modal-header flex items-start justify-between gap-3 border-b border-white/10 px-3 py-3 sm:px-6 sm:py-5">
          <div>
            <div className="text-base font-black tracking-tight sm:text-xl">{title}</div>
            <div className="mt-1 text-[10px] font-black uppercase tracking-[0.14em] text-white/35 sm:text-[11px] sm:tracking-[0.2em]">
              {selectedWeekName} · {selectedRangeLabel}
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl border border-white/10 bg-white/5 p-2 text-white/50 hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="oa-modal-body min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-3 sm:space-y-4 sm:px-6 sm:py-5">
          {!lockDateSelection ? (
          <div className="oa-modal-card rounded-2xl border border-white/10 bg-white/[0.03] p-3 md:p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.25em] text-white/30">{dateMode === "day" ? "Pick available day" : "Pick available week"}</div>
                <div className="mt-1 text-sm font-black text-white/85">{pickerMonthLabel}</div>
              </div>
              <div className="grid w-full grid-cols-3 gap-1.5 sm:w-auto sm:flex sm:items-center sm:gap-2">
                <button
                  onClick={() => setPickerMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-2 py-2 text-xs font-black text-white/55 hover:bg-white/10 hover:text-white sm:px-3"
                >
                  Prev
                </button>
                <button
                  onClick={() => setPickerMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1))}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-2 py-2 text-xs font-black text-white/55 hover:bg-white/10 hover:text-white sm:px-3"
                >
                  Today
                </button>
                <button
                  onClick={() => setPickerMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-2 py-2 text-xs font-black text-white/55 hover:bg-white/10 hover:text-white sm:px-3"
                >
                  Next
                </button>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-7 gap-1 text-center">
              {["M", "T", "W", "T", "F", "S", "S"].map((label, idx) => (
                <div key={`${label}-${idx}`} className="py-1 text-[10px] font-black text-white/25">
                  {label}
                </div>
              ))}
              {pickerDays.map((d) => {
                const iso = isoFromDate(d);
                const isCurrentMonth = d.getMonth() === pickerMonth.getMonth();
                const existingEvent = existingEventsByDate.get(iso);
                const isFilled = Boolean(existingEvent);
                const isSelected = selectedISOSet.has(iso);
                const dayHolidays = holidaysByDate.get(iso) ?? [];
                const hasHoliday = dayHolidays.length > 0;
                const weekDates = weekWedToSat(iso);
                const weekFilled = weekDates.some((date) => existingEventsByDate.has(isoFromDate(date)));
                return (
                  <button
                    key={iso}
                    type="button"
                    onClick={() => {
                      if (existingEvent) {
                        onPreviewEvent(existingEvent);
                        return;
                      }
                      changeSelectedPeriod(iso);
                    }}
                    className={`min-h-10 rounded-lg border px-1 py-1 text-left text-[11px] font-black transition sm:min-h-16 sm:rounded-xl sm:px-1.5 sm:text-xs ${
                      isFilled
                        ? getStatusCalendarClass(existingEvent.status)
                        : isSelected
                          ? "border-purple-200 bg-purple-400 text-black"
                          : weekFilled && dateMode === "week"
                            ? "border-yellow-300/25 bg-yellow-400/10 text-yellow-100/80"
                            : hasHoliday
                              ? "border-cyan-300/30 bg-cyan-400/10 text-cyan-100"
                              : "border-white/10 bg-black/20 text-white/65 hover:border-purple-300/40 hover:bg-purple-400/10 hover:text-white"
                    } ${isCurrentMonth ? "" : "opacity-35"}`}
                    title={isFilled ? `${existingEvent.name || "Schedule"} · ${statusLabel(existingEvent.status)}` : hasHoliday ? dayHolidays.map(holidayLabel).join(", ") : "Available"}
                  >
                    <span className="flex items-center justify-center gap-0.5 text-center text-[11px] font-black sm:gap-1 sm:text-xs">
                      <span>{d.getDate()}</span>
                      {hasHoliday ? <span aria-label="Holiday">🎉</span> : null}
                    </span>
                    {isFilled ? (
                      <span className="mt-1 block truncate text-center text-[8px] font-black uppercase leading-tight sm:text-[9px] sm:tracking-[0.08em]">
                        {existingEvent.name}
                      </span>
                    ) : hasHoliday ? (
                      <span className="mt-1 hidden truncate text-center text-[9px] font-black uppercase leading-tight tracking-[0.08em] sm:block">
                        {dayHolidays[0].localName || dayHolidays[0].name}
                      </span>
                    ) : weekFilled && dateMode === "week" ? (
                      <span className="mt-1 hidden text-center text-[9px] font-black uppercase leading-tight tracking-[0.08em] sm:block">Busy week</span>
                    ) : null}
                  </button>
                );
              })}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em]">
              <span className="rounded-full border border-white/10 bg-black/20 px-2 py-1 text-white/45">Selected: {selectedWeekName} · {selectedRangeLabel}</span>
              <span className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-2 py-1 text-emerald-100/70">Open</span>
              <span className={`rounded-full border px-2 py-1 ${statusClass("Confirmed")}`}>Confirmed</span>
              <span className={`rounded-full border px-2 py-1 ${statusClass("Unconfirmed")}`}>Pending</span>
              <span className={`rounded-full border px-2 py-1 ${statusClass("Need Attention")}`}>Need Attention</span>
              <span className="rounded-full border border-cyan-300/30 bg-cyan-400/10 px-2 py-1 text-cyan-100/75">🎉 Holiday</span>
              {dateMode === "week" ? (
                <span className="rounded-full border border-yellow-300/25 bg-yellow-400/10 px-2 py-1 text-yellow-100/75">Week has filled day</span>
              ) : null}
            </div>

            {selectedFilledDays.length ? (
              <div className="mt-3 rounded-xl border border-rose-300/30 bg-rose-500/10 px-3 py-2 text-xs font-bold text-rose-100">
                Existing schedule on {selectedFilledDays.map(dayLabelFromISO).join(", ")}. Pick another {dateMode === "day" ? "day" : "week"} before saving.
              </div>
            ) : null}
          </div>
          ) : null}

          {dateMode === "week" ? (
          <div className="grid gap-2 sm:flex sm:flex-wrap sm:items-center sm:gap-3">
            <Button
              onClick={autoFill}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-purple-300/40 bg-purple-400/10 px-4 text-xs font-black text-purple-100 hover:bg-purple-400/20"
            >
              <Zap className="h-4 w-4" /> Auto-fill Wed – Sat
            </Button>
            <div className="text-xs font-bold text-white/35">{hasAutofilled ? "You can still edit manually below" : "or fill manually below"}</div>
          </div>
          ) : null}

          <div className="space-y-4 pr-1 sm:pr-2">
            {modalDays.map((day) => {
              const date = isoToDate(day.isoDate);
              const weekday = date.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase();
              const month = date.toLocaleDateString("en-US", { month: "short" }).toUpperCase();
              const header = `${weekday} · ${date.getDate()} ${month}`;
              const djListId = `dj-options-${day.isoDate}`;
              const genreListId = `genre-options-${day.isoDate}`;
              const genreTags = splitGenreTags(day.genre);
              const genreDraft = genreDrafts[day.isoDate] ?? "";
              const activeMention = activeMentionByDate[day.isoDate];
              const mentionSuggestions = activeMention ? mentionUsers.filter((user) => userMatchesMentionQuery(user, activeMention.query)).slice(0, 6) : [];
              const dayErrors = validation.errorsByDate[day.isoDate] ?? [];
              const dayConflictSlots = validation.conflictSlots[day.isoDate] ?? new Set();
              const smartSchedule = getSmartSchedule(day.isoDate);
              const smartScheduleInvalid = minutesFromTime(smartSchedule.end) <= minutesFromTime(smartSchedule.start);
              const dayConfirmationBlockers = getConfirmationBlockers({ date: day.isoDate, slots: day.slots });

              return (
                <div
                  key={day.isoDate}
                  className={`oa-modal-card rounded-2xl border bg-white/[0.03] p-3 sm:p-4 ${dayErrors.length ? "border-rose-300/40" : "border-white/10"}`}
                >
                  <div className="text-[11px] font-black uppercase tracking-[0.2em] text-purple-200/80">{header}</div>

                  <div className="mt-3 grid gap-3 md:grid-cols-3">
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-[0.25em] text-white/30">Event Name</div>
                      <input
                        value={day.name}
                        onChange={(e) => setDayField(day.isoDate, { name: e.target.value })}
                        className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm font-black text-white/85 outline-none focus:border-purple-300/60"
                        placeholder="CITY FLOW"
                      />
                    </div>
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-[0.25em] text-white/30">Stage</div>
                      <select
                        value={day.stage || stageOptions[0]}
                        onChange={(e) => setDayField(day.isoDate, { stage: e.target.value })}
                        className="mt-1 h-10 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm font-black text-white/80 outline-none focus:border-purple-300/60"
                      >
                        {stageOptions.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-[0.25em] text-white/30">Genre</div>
                      <div className="mt-1 rounded-xl border border-white/10 bg-black/20 p-2 focus-within:border-purple-300/60">
                        <div className="flex flex-wrap gap-1.5">
                          {genreTags.map((tag) => (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => removeGenreTag(day.isoDate, tag)}
                              className="rounded-lg border border-purple-300/25 bg-purple-400/10 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-purple-100 hover:bg-rose-500/20 hover:text-rose-100"
                              title="Remove genre"
                            >
                              {tag} x
                            </button>
                          ))}
                        </div>
                        <div className="mt-2 flex gap-2">
                          <input
                            list={genreListId}
                            value={genreDraft}
                            onChange={(e) => setGenreDrafts((prev) => ({ ...prev, [day.isoDate]: e.target.value }))}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                addGenreTag(day.isoDate, genreDraft);
                              }
                            }}
                            className="min-w-0 flex-1 bg-transparent px-1 py-1 text-sm font-black text-white/75 outline-none placeholder:text-white/25"
                            placeholder={genreTags.length ? "Add genre..." : "AFRO, HIP-HOP, TECHNO..."}
                          />
                          <datalist id={genreListId}>
                            {genreOptions.map((genre) => (
                              <option key={genre} value={genre} />
                            ))}
                          </datalist>
                          <button
                            type="button"
                            onClick={() => addGenreTag(day.isoDate, genreDraft)}
                            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-black text-white/55 hover:bg-purple-400 hover:text-black"
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="text-[10px] font-black uppercase tracking-[0.25em] text-white/30">DJs & Timings</div>
                    </div>

                    <div className="mt-2 grid gap-2 rounded-xl border border-white/10 bg-black/20 p-2 sm:grid-cols-[90px_1fr_1fr_auto_auto] sm:items-end">
                      <label>
                        <span className="block text-[9px] font-black uppercase tracking-[0.18em] text-white/30">DJs</span>
                        <input
                          type="number"
                          min="1"
                          max="8"
                          value={smartSchedule.djCount}
                          onChange={(e) => setSmartScheduleField(day.isoDate, { djCount: Math.max(1, Math.min(8, Number(e.target.value) || 1)) })}
                          className="mt-1 h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm font-black text-white/80 outline-none focus:border-purple-300/60"
                        />
                      </label>
                      <label>
                        <span className="block text-[9px] font-black uppercase tracking-[0.18em] text-white/30">From</span>
                        <select
                          value={smartSchedule.start}
                          onChange={(e) => setSmartScheduleField(day.isoDate, { start: e.target.value })}
                          className="mt-1 h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm font-black text-white/70 outline-none focus:border-purple-300/60"
                        >
                          {timeOptions.map((t) => (
                            <option key={t} value={t}>
                              {formatClockTime(t, timeFormat)}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label>
                        <span className="block text-[9px] font-black uppercase tracking-[0.18em] text-white/30">To</span>
                        <select
                          value={smartSchedule.end}
                          onChange={(e) => setSmartScheduleField(day.isoDate, { end: e.target.value })}
                          className="mt-1 h-10 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-sm font-black text-white/70 outline-none focus:border-purple-300/60"
                        >
                          {timeOptions.map((t) => (
                            <option key={t} value={t}>
                              {formatClockTime(t, timeFormat)}
                            </option>
                          ))}
                        </select>
                      </label>
                      <button
                        type="button"
                        onClick={() => applyQuickSchedule(day.isoDate)}
                        disabled={smartScheduleInvalid}
                        className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border border-purple-300/30 bg-purple-400/10 px-3 text-[10px] font-black text-purple-100 hover:bg-purple-400 hover:text-black disabled:cursor-not-allowed disabled:opacity-45"
                      >
                        <Zap className="h-3.5 w-3.5" /> Suggest slots
                      </button>
                      <button
                        type="button"
                        onClick={() => addSlot(day.isoDate)}
                        className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 text-[10px] font-black text-white/60 hover:bg-white/10 hover:text-white"
                      >
                        <Plus className="h-3.5 w-3.5" /> Add slot
                      </button>
                    </div>
                    {smartScheduleInvalid ? (
                      <div className="mt-2 rounded-xl border border-rose-300/30 bg-rose-500/10 px-3 py-2 text-xs font-bold text-rose-100">
                        End time must be after start time.
                      </div>
                    ) : null}

                    {day.slots.length ? (
                      <div className="mt-2 space-y-2">
                        {day.slots.map((slot, idx) => {
                          const parsed = parseDjLineup(slot.dj);
                          const connector = normalizeLineupConnector(slot.djConnector || parsed.connector);
                          const desiredCount = lineupParticipantCount(connector);
                          const participants = normalizeLineupParticipants(
                            Array.isArray(slot.djParticipants) && slot.djParticipants.length ? slot.djParticipants : parsed.participants,
                            desiredCount,
                          );
                          const typeValue = connector || "";

                          return (
                          <div
                            key={`${day.isoDate}-${idx}`}
                            className={`grid grid-cols-2 items-center gap-2 rounded-xl border bg-black/20 p-2 sm:grid-cols-[minmax(180px,1fr)_110px_110px_120px_40px_40px] ${
                              dayConflictSlots.has(idx) ? "border-rose-300/50" : "border-white/10"
                            }`}
                          >
                            <div className="col-span-2 sm:col-span-1">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <select
                                  value={typeValue}
                                  onChange={(e) => updateSlot(day.isoDate, idx, { djConnector: e.target.value, djParticipants: participants })}
                                  className="h-9 rounded-lg border border-white/10 bg-white/5 px-2 text-[10px] font-black uppercase tracking-[0.12em] text-white/70 outline-none focus:border-purple-300/60"
                                >
                                  <option value="">Solo</option>
                                  <option value="B2B">B2B</option>
                                  <option value="B3B">B3B</option>
                                  <option value="F2F">F2F</option>
                                </select>
                                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-white/30">
                                  {buildLineupDisplayName({ connector, participants }) || "DJ"}
                                </div>
                              </div>
                              <div className="mt-1 flex flex-wrap items-center gap-2">
                                {participants.map((name, participantIndex) => (
                                  <React.Fragment key={`${day.isoDate}-${idx}-p-${participantIndex}`}>
                                    {participantIndex > 0 ? (
                                      <span className="rounded-md border border-white/10 bg-black/20 px-2 py-1 text-[10px] font-black text-white/45">
                                        {connector || "WITH"}
                                      </span>
                                    ) : null}
                                    <input
                                      list={djListId}
                                      value={name}
                                      onChange={(e) => {
                                        const next = participants.slice();
                                        next[participantIndex] = e.target.value;
                                        updateSlot(day.isoDate, idx, { djConnector: connector, djParticipants: next });
                                      }}
                                      placeholder={participantIndex === 0 ? "Select DJ" : `DJ ${participantIndex + 1}`}
                                      className="min-w-[140px] flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm font-black text-white/85 outline-none focus:border-purple-300/60 sm:px-2 sm:py-2 sm:text-xs"
                                    />
                                  </React.Fragment>
                                ))}
                              </div>
                              <datalist id={djListId}>
                                {djOptions.map((dj) => (
                                  <option key={dj} value={dj} />
                                ))}
                              </datalist>
                            </div>

                            {slot.role === "MC" ? (
                              <div className="col-span-2 flex h-10 items-center rounded-lg border border-purple-300/20 bg-purple-400/10 px-3 text-xs font-black text-purple-100/70">
                                No set time
                              </div>
                            ) : (
                              <>
                                <select
                                  value={slot.start}
                                  onChange={(e) => {
                                    const nextStart = e.target.value;
                                    const nextEnd = normalizeSlotTimes(day.isoDate, idx, nextStart, slot.end);
                                    updateSlot(day.isoDate, idx, { start: nextStart, end: nextEnd });
                                  }}
                                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm font-black text-white/70 outline-none focus:border-purple-300/60 sm:px-2 sm:py-2 sm:text-xs"
                                >
                                  {timeOptions.map((t) => (
                                    <option key={t} value={t}>
                                      {formatClockTime(t, timeFormat)}
                                    </option>
                                  ))}
                                </select>

                                <select
                                  value={slot.end}
                                  onChange={(e) => {
                                    const nextEnd = e.target.value;
                                    const fixedEnd = normalizeSlotTimes(day.isoDate, idx, slot.start, nextEnd);
                                    updateSlot(day.isoDate, idx, { end: fixedEnd });
                                  }}
                                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm font-black text-white/70 outline-none focus:border-purple-300/60 sm:px-2 sm:py-2 sm:text-xs"
                                >
                                  {timeOptions.map((t) => (
                                    <option key={t} value={t}>
                                      {formatClockTime(t, timeFormat)}
                                    </option>
                                  ))}
                                </select>
                              </>
                            )}

                            <select
                              value={slot.role}
                              onChange={(e) => {
                                const nextRole = e.target.value;
                                updateSlot(
                                  day.isoDate,
                                  idx,
                                  nextRole === "MC"
                                    ? { role: nextRole, start: "", end: "" }
                                    : { role: nextRole, start: slot.start || "22:30", end: slot.end || "00:00" },
                                );
                              }}
                              className="col-span-2 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm font-black text-white/50 outline-none focus:border-purple-300/60 sm:col-span-1 sm:px-2 sm:py-2 sm:text-xs"
                            >
                              {roleOptions.map((r) => (
                                <option key={r} value={r}>
                                  {r}
                                </option>
                              ))}
                            </select>

                            <button
                              type="button"
                              onClick={() => openWhatsAppForDaySlot(day, slot)}
                              disabled={!whatsappDigits(slot?.dj ? djPhoneByName.get(normalizeDjLookupKey(slot.dj)) : "")}
                              title="Send WhatsApp (needs DJ phone in DJ profile)"
                              className="col-span-1 flex h-10 w-full items-center justify-center rounded-lg border border-emerald-300/25 bg-emerald-400/10 text-emerald-100 hover:bg-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-70 sm:h-9 sm:w-9"
                            >
                              <MessageCircle className="h-4 w-4" />
                              <span className="sr-only">Send WhatsApp</span>
                            </button>

                            <button
                              onClick={() => removeSlot(day.isoDate, idx)}
                              className="col-span-1 flex h-10 w-full items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/40 hover:bg-rose-400/20 hover:text-rose-200 sm:col-span-1 sm:h-9 sm:w-9"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="mt-2 rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-xs font-bold text-white/35">
                        Add slots to build the lineup (DJ + start/end + role)
                      </div>
                    )}
                    {dayErrors.length ? (
                      <div className="mt-2 rounded-xl border border-rose-300/30 bg-rose-500/10 px-3 py-2 text-xs font-bold text-rose-100">
                        {dayErrors.map((error) => (
                          <div key={error}>{error}</div>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  <div className="mt-3 grid gap-3 md:grid-cols-1">
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-[0.25em] text-white/30">Status</div>
                      <div className="mt-1 grid grid-cols-2 gap-1.5 sm:flex sm:flex-wrap">
                        {statusOptions.map((status) => {
                          const effectiveStatus = day.status || (day.slots.length ? "Unconfirmed" : "Need Attention");
                          const active = effectiveStatus === status;
                          const confirmBlocked = status === "Confirmed" && dayConfirmationBlockers.length > 0;
                          return (
                            <button
                              key={status}
                              type="button"
                              onClick={() => setDayField(day.isoDate, { status })}
                              disabled={confirmBlocked}
                              title={confirmBlocked ? dayConfirmationBlockers.join(" ") : statusLabel(status)}
                              className={`rounded-lg border px-2 py-2 text-[10px] font-black uppercase tracking-[0.08em] transition sm:px-3 sm:tracking-[0.12em] ${
                                confirmBlocked
                                  ? "cursor-not-allowed border-white/10 bg-white/5 text-white/20"
                                  : active
                                    ? statusClass(status)
                                    : "border-white/10 bg-white/5 text-white/40 hover:bg-white/10 hover:text-white"
                              }`}
                            >
                                {statusLabel(status)}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="text-[10px] font-black uppercase tracking-[0.25em] text-white/30">Remarks</div>
                      {mentionUsers.length ? (
                        <div className="flex max-w-full flex-wrap justify-end gap-1.5">
                          {mentionUsers.slice(0, 8).map((user) => (
                            <button
                              key={user.id || user.email}
                              type="button"
                              onClick={() => insertMention(day.isoDate, user)}
                              className="inline-flex min-w-0 max-w-[160px] items-center gap-1 rounded-lg border border-cyan-300/20 bg-cyan-400/10 px-2 py-1 text-[10px] font-black text-cyan-100 hover:bg-cyan-400/20"
                              title={`${displayNameForUser(user)} · ${user.email || user.id}`}
                            >
                              <AtSign className="h-3 w-3" />
                              <span className="truncate">{displayNameForUser(user) || mentionHandleForUser(user)}</span>
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </div>
                    <div className="relative mt-1">
                      <textarea
                        value={day.remarks || ""}
                        onChange={(e) => {
                          setDayField(day.isoDate, { remarks: e.target.value });
                          updateActiveMention(day.isoDate, e.target.value, e.target.selectionStart);
                        }}
                        onClick={(e) => updateActiveMention(day.isoDate, e.currentTarget.value, e.currentTarget.selectionStart)}
                        onKeyUp={(e) => updateActiveMention(day.isoDate, e.currentTarget.value, e.currentTarget.selectionStart)}
                        onBlur={() => window.setTimeout(() => setActiveMentionByDate((prev) => ({ ...prev, [day.isoDate]: null })), 120)}
                        className="min-h-20 w-full resize-y rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm font-bold text-white/75 outline-none placeholder:text-white/25 focus:border-purple-300/60"
                        placeholder="Add remarks for this night... Type @ to mention someone."
                      />
                      {activeMention ? (
                        <div className="absolute left-2 right-2 top-full z-20 mt-1 overflow-hidden rounded-xl border border-cyan-300/20 bg-[#12111f] shadow-2xl shadow-black/50">
                          {mentionSuggestions.length ? (
                            mentionSuggestions.map((user) => (
                              <button
                                key={user.id || user.email}
                                type="button"
                                onMouseDown={(e) => e.preventDefault()}
                                onClick={() => insertMention(day.isoDate, user, activeMention)}
                                className="grid w-full grid-cols-[auto_minmax(0,1fr)] items-center gap-2 border-b border-white/10 px-3 py-2 text-left last:border-b-0 hover:bg-cyan-400/10"
                              >
                                <AtSign className="h-4 w-4 text-cyan-100/70" />
                                <span className="min-w-0">
                                  <span className="block truncate text-xs font-black text-white/85">{displayNameForUser(user) || mentionHandleForUser(user)}</span>
                                  <span className="block truncate text-[10px] font-bold text-white/35">{user.email || user.id}</span>
                                </span>
                              </button>
                            ))
                          ) : (
                            <div className="px-3 py-2 text-xs font-bold text-white/35">No users match @{activeMention.query}</div>
                          )}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="oa-modal-footer grid gap-2 border-t border-white/10 px-3 py-3 sm:flex sm:flex-wrap sm:items-center sm:justify-between sm:gap-3 sm:px-6 sm:py-4">
          <Button
            onClick={onClose}
            className="h-11 rounded-xl bg-white/5 px-5 text-sm font-black text-white/50 hover:bg-white/10 hover:text-white"
          >
            Cancel
          </Button>
          <div className="grid gap-2 sm:flex sm:flex-1 sm:flex-wrap sm:items-center sm:justify-end">
            {lockDateSelection && editEvent ? (
              <Button
                onClick={() => onDeleteDay(editEvent)}
                disabled={isSaving}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-rose-300/30 bg-rose-500/15 px-5 text-sm font-black text-rose-100 hover:bg-rose-400 hover:text-black disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete Day</span>
              </Button>
            ) : null}
            <Button
              onClick={save}
              disabled={isSaving}
              className="h-11 min-w-[160px] flex-1 rounded-xl bg-purple-400 px-5 text-sm font-black text-black hover:bg-purple-300 disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none"
            >
              {isSaving ? "Saving..." : validation.hasErrors ? "Fix Time Overlaps" : dateMode === "day" ? "Save Day" : "Save Week"}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function EventCard({ event, holidays, timeFormat, canEdit, mentionUsers, comments = [], currentUser, commentsError, onEdit, onAssignIC, onConfirm, onShare, onOpenDetails, onAddComment }) {
  const scheduleValidation = validateScheduleDays([{ isoDate: event.date, slots: event.slots }]);
  const conflictSlots = scheduleValidation.conflictSlots[event.date] ?? new Set();
  const confirmationBlockers = getConfirmationBlockers(event);
  const dayHolidays = holidays ?? [];
  const holidaySummary = dayHolidays[0] ? dayHolidays[0].localName || dayHolidays[0].name : "";
  const holidayExtra = dayHolidays.length > 1 ? ` +${dayHolidays.length - 1}` : "";
  const holidayTitle = dayHolidays.length ? dayHolidays.map(holidayLabel).join(", ") : "";
  const latestComments = comments.slice().reverse();
  const [commentComposerOpen, setCommentComposerOpen] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className={`overflow-hidden rounded-2xl border bg-[#12111f] text-white shadow-xl shadow-black/20 ${
          scheduleValidation.hasErrors ? "border-rose-300/50" : "border-white/10"
        }`}
      >
        <CardContent className="relative p-0">
          <div className={`absolute left-0 top-0 h-full w-1.5 ${getStatusColor(event.status)}`} />

          <div className="grid grid-cols-[42px_minmax(0,1fr)] gap-2 px-3 py-3 pl-5 sm:grid-cols-[64px_minmax(0,1fr)_auto] sm:gap-4 sm:px-5 md:grid-cols-[72px_minmax(0,1fr)_auto] md:px-7 md:py-5">
            <div className="text-center leading-none text-white/70">
              <div className="text-[9px] font-bold tracking-widest md:text-xs">{event.day}</div>
              <div className="mt-1 text-2xl font-black text-white sm:text-3xl md:text-4xl">{event.dayNo}</div>
              <div className="mt-1 text-[9px] font-bold tracking-widest md:text-xs">{event.month}</div>
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="min-w-0 text-base font-black tracking-wide text-white sm:text-lg md:text-xl">{event.name}</h3>
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${statusClass(event.status)}`}>
                  {statusLabel(event.status)}
                </span>
                <span className="rounded-full border border-orange-300/25 bg-orange-400/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-orange-100">
                  {event.stage}
                </span>
                {holidaySummary ? (
                  <span
                    title={holidayTitle}
                    className="inline-flex items-center gap-1 rounded-full border border-cyan-300/25 bg-cyan-400/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-cyan-100"
                  >
                    <span aria-hidden>🎉</span>
                    <span className="max-w-[240px] truncate">{holidaySummary}{holidayExtra}</span>
                  </span>
                ) : null}
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {splitGenreTags(event.genre).map((genre) => (
                  <span key={genre} className={`rounded-full border px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${genreTagClass(genre)}`}>
                    {genre}
                  </span>
                ))}
              </div>

              <div className="mt-2 flex flex-wrap gap-1.5">
                {event.slots.length ? (
                  event.slots.map((slot, idx) => (
                    <span
                      key={idx}
                      className={`inline-flex min-w-[46%] flex-1 flex-col gap-1.5 rounded-lg border px-2 py-2 text-[11px] font-black sm:min-w-[150px] sm:flex-none sm:text-xs md:px-3 md:py-2.5 ${
                        conflictSlots.has(idx) ? "border-rose-300/50 bg-rose-500/15 text-rose-50" : "border-white/10 bg-white/5 text-white/85"
                      }`}
                    >
                      <span
                        className={`w-fit rounded-md border px-1.5 py-0.5 text-[9px] uppercase tracking-[0.14em] ${
                          slot.role === "MC"
                            ? "border-purple-300/30 bg-purple-400/15 text-purple-100"
                            : "border-white/10 bg-black/20 text-white/45"
                        }`}
                      >
                        {slot.role}
                      </span>
                      <span className="min-w-0 truncate text-sm leading-tight text-white sm:text-base">
                        {slot.dj}
                      </span>
                      {slotNeedsTime(slot) && slot.start && slot.end ? (
                        <span
                          className={`inline-flex w-fit items-center gap-1.5 rounded-lg border px-2 py-1 text-[11px] font-black leading-none sm:text-xs ${
                            conflictSlots.has(idx)
                              ? "border-rose-200/50 bg-rose-400/15 text-rose-100"
                              : "border-cyan-300/25 bg-cyan-400/10 text-cyan-100"
                          }`}
                        >
                          <Clock className="h-3.5 w-3.5" />
                          {formatTimeRange(slot.start, slot.end, timeFormat)}
                        </span>
                      ) : null}
                      {canEdit && (slot.linkedUserId || slot.assignmentStatus) ? (
                        <span className={`w-fit rounded-md border px-1.5 py-0.5 text-[9px] uppercase tracking-[0.14em] ${assignmentStatusClass(slot.assignmentStatus)}`}>
                          {assignmentStatusLabel(slot.assignmentStatus)}
                        </span>
                      ) : null}
                    </span>
                  ))
                ) : (
                  <span className="text-xs font-bold text-rose-300">No lineup</span>
                )}
              </div>
              {event.notes ? (
                <div className="mt-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs font-bold text-white/55">
                  <MentionText text={event.notes} users={mentionUsers} />
                </div>
              ) : null}
              <div className="mt-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-[10px] font-black uppercase tracking-[0.18em] text-white/30">Comments</div>
                  <div className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-2 py-0.5 text-[10px] font-black text-cyan-100">
                    {comments.length} {comments.length === 1 ? "comment" : "comments"}
                  </div>
                </div>
                {latestComments.length ? (
                  <div className="mt-2 space-y-1.5">
                    {latestComments.map((comment) => (
                      <div
                        key={comment.id}
                        className="block w-full rounded-lg border border-white/10 bg-white/[0.03] px-2 py-1.5 text-left"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="truncate text-[11px] font-black text-white/75">{displayNameForUserId(comment.userId, mentionUsers, currentUser)}</span>
                          <span className="text-[10px] font-bold text-white/30">{formatCommentTime(comment.createdAt)}</span>
                        </div>
                        <div className="oa-clamp-2 mt-0.5 text-xs font-bold text-white/50">
                          <MentionText text={comment.body} users={mentionUsers} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-2 text-xs font-bold text-white/35">
                    No comments yet.
                  </div>
                )}
                {commentComposerOpen ? (
                  <div className="mt-2">
                    <CommentComposer
                      mentionUsers={mentionUsers}
                      disabled={Boolean(commentsError)}
                      onSubmit={(body) => onAddComment(event, body)}
                    />
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setCommentComposerOpen(true)}
                    className="mt-2 w-full rounded-xl border border-cyan-300/20 bg-cyan-400/10 px-3 py-2 text-left text-xs font-black text-cyan-100 hover:bg-cyan-400/20"
                  >
                    Add comment
                  </button>
                )}
                {commentsError ? (
                  <div className="mt-2 rounded-lg border border-yellow-300/25 bg-yellow-400/10 px-2 py-1.5 text-[11px] font-bold text-yellow-100">
                    {commentsError}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="col-span-2 grid grid-cols-[minmax(0,1fr)_auto_auto_auto_auto] gap-1.5 border-t border-white/10 pt-3 sm:col-span-1 sm:flex sm:flex-col sm:items-end sm:gap-2 sm:border-t-0 sm:pt-0">
              {canEdit ? (
                <div className="flex min-w-0 items-center gap-2 sm:flex-col sm:items-end sm:gap-1">
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/25">PIC</div>
                  <select
                    value={event.ic || ""}
                    onChange={(e) => onAssignIC(e.target.value)}
                    className="h-10 min-w-0 flex-1 rounded-lg border border-white/10 bg-white/5 px-3 text-sm font-black text-white/70 outline-none hover:bg-white/10 focus:border-purple-300/60 sm:h-8 sm:flex-none sm:px-2 sm:text-xs md:h-9 md:text-sm"
                  >
                    <option value="">PIC</option>
                    <option value="Wai Hong">Wai Hong</option>
                    <option value="Ashwin">Ashwin</option>
                  </select>
                </div>
              ) : null}
              {canEdit ? (
                <button
                  onClick={onEdit}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/60 hover:bg-purple-400 hover:text-black sm:h-8 sm:w-auto sm:gap-2 sm:px-3 sm:text-xs md:h-9 md:text-sm"
                  title="Edit day"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Edit</span>
                </button>
              ) : null}
              <button
                type="button"
                onClick={onShare}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-cyan-300/25 bg-cyan-400/10 text-cyan-100 hover:bg-cyan-400 hover:text-black sm:h-8 sm:w-auto sm:gap-2 sm:px-3 sm:text-xs md:h-9 md:text-sm"
                title="Copy share link"
              >
                <Link2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Share</span>
              </button>
              <button
                type="button"
                onClick={onOpenDetails}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white sm:h-8 sm:w-auto sm:gap-2 sm:px-3 sm:text-xs md:h-9 md:text-sm"
                title="Open details"
              >
                <Eye className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Details</span>
              </button>
              {canEdit && event.status !== "Confirmed" ? (
                <button
                  onClick={onConfirm}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-emerald-300/30 bg-emerald-400/10 text-emerald-100 hover:bg-emerald-400 hover:text-black sm:h-8 sm:w-auto sm:gap-2 sm:px-3 sm:text-xs md:h-9 md:text-sm"
                  title={confirmationBlockers.length ? confirmationBlockers.join(" ") : "Confirm night"}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Confirm</span>
                </button>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function EventDetailsModal({ event, timeFormat, mentionUsers, comments, commentsError, currentUser, djProfiles, onAddComment, onClose, onEdit, onDelete, onConfirm, onShare, canEdit }) {
  if (!event) return null;
  const confirmationBlockers = getConfirmationBlockers(event);
  const djPhoneById = useMemo(() => {
    const map = new Map();
    for (const p of djProfiles || []) {
      if (!p?.id) continue;
      map.set(String(p.id), p.phone || "");
    }
    return map;
  }, [djProfiles]);
  const djPhoneByName = useMemo(() => {
    const map = new Map();
    for (const p of djProfiles || []) {
      const phone = p.phone || "";
      const key1 = normalizeDjLookupKey(p.name);
      const key2 = normalizeDjLookupKey(p.stageName);
      const key3 = normalizeDjLookupKey(p.realName);
      if (key1) map.set(key1, phone);
      if (key2) map.set(key2, phone);
      if (key3) map.set(key3, phone);
    }
    return map;
  }, [djProfiles]);

  const whatsappTextForSlot = useCallback(
    (slot) => {
      const djName = formatDjDisplayName(slot?.dj);
      const date = dayLabelFromISO(event.date);
      const time = slotNeedsTime(slot) && slot?.start && slot?.end ? formatTimeRange(slot.start, slot.end, timeFormat) : "";
      return [
        `Hi ${djName},`,
        `Date: ${date}`,
        `Set time: ${time || "TBC"}`,
        "Let me know if you are available! thank you!",
      ].join("\n");
    },
    [event.date, event.stage, timeFormat]
  );

  const openWhatsApp = useCallback(
    (slot) => {
      const phone =
        (slot?.djId && djPhoneById.get(String(slot.djId))) ||
        (slot?.dj && djPhoneByName.get(normalizeDjLookupKey(slot.dj))) ||
        "";
      const url = whatsappLink(phone, whatsappTextForSlot(slot));
      if (!url) return;
      window.open(url, "_blank", "noopener,noreferrer");
    },
    [djPhoneById, djPhoneByName, whatsappTextForSlot]
  );

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 p-2 backdrop-blur-sm sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.18 }}
        className="oa-modal-panel flex max-h-[calc(100svh-0.75rem)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-[#16152a] to-[#0a0912] text-white shadow-2xl shadow-black/60 sm:max-h-[calc(100svh-1.5rem)] sm:rounded-3xl"
      >
        <div className="oa-modal-header flex items-start justify-between gap-4 border-b border-white/10 px-4 py-4 sm:px-6 sm:py-5">
          <div className="min-w-0">
            <div className="text-[11px] font-black uppercase tracking-[0.22em] text-purple-200/70">{dayLabelFromISO(event.date)}</div>
            <div className="mt-1 text-xl font-black tracking-tight text-white">{event.name}</div>
            <div className="mt-1 text-xs font-bold uppercase tracking-[0.18em] text-white/35">{event.stage}</div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl border border-white/10 bg-white/5 p-2 text-white/50 hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="oa-modal-body min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full border px-3 py-1 text-xs font-black uppercase tracking-wider ${statusClass(event.status)}`}>
              {statusLabel(event.status)}
            </span>
            <span className="rounded-full border border-orange-300/25 bg-orange-400/10 px-3 py-1 text-xs font-black uppercase tracking-wider text-orange-100">
              {event.stage}
            </span>
            {splitGenreTags(event.genre).map((genre) => (
              <span key={genre} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-black text-white/55">
                {genre}
              </span>
            ))}
            {canEdit && event.ic ? (
              <span className="rounded-full border border-purple-300/30 bg-purple-400/10 px-3 py-1 text-xs font-black text-purple-100">PIC {event.ic}</span>
            ) : null}
          </div>

          {event.notes ? (
            <div className="oa-modal-card rounded-2xl border border-white/10 bg-white/[0.03] p-3">
              <div className="text-[10px] font-black uppercase tracking-[0.24em] text-white/30">Remarks</div>
              <div className="mt-2 whitespace-pre-wrap text-sm font-bold text-white/70">
                <MentionText text={event.notes} users={mentionUsers} />
              </div>
            </div>
          ) : null}

          <div className="oa-modal-card rounded-2xl border border-white/10 bg-white/[0.03] p-3">
            <div className="text-[10px] font-black uppercase tracking-[0.24em] text-white/30">Set Times</div>
            {event.slots.length ? (
              <div className="mt-3 grid gap-2">
                {event.slots.map((slot, idx) => (
                  <div key={`${event.id}-${idx}`} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                    <div>
                      <div
                        className={`mb-1 w-fit rounded-md border px-1.5 py-0.5 text-[9px] font-black uppercase tracking-[0.14em] ${
                          slot.role === "MC"
                            ? "border-purple-300/30 bg-purple-400/15 text-purple-100"
                            : "border-white/10 bg-white/5 text-white/45"
                        }`}
                      >
                        {slot.role}
                      </div>
                      <div className="text-sm font-black text-white">{slot.dj}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {slotNeedsTime(slot) && slot.start && slot.end ? (
                        <div className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs font-black text-white/65">
                          <Clock className="h-3.5 w-3.5" />
                          {formatTimeRange(slot.start, slot.end, timeFormat)}
                        </div>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => openWhatsApp(slot)}
                        disabled={
                          !whatsappDigits(
                            (slot?.djId && djPhoneById.get(String(slot.djId))) ||
                              (slot?.dj && djPhoneByName.get(normalizeDjLookupKey(slot.dj))) ||
                              ""
                          )
                        }
                        className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-emerald-300/25 bg-emerald-400/10 text-emerald-100 hover:bg-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-70"
                        title="Send WhatsApp (needs DJ phone in DJ profile)"
                      >
                        <MessageCircle className="h-4 w-4" />
                        <span className="sr-only">Send WhatsApp</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-3 rounded-xl border border-rose-300/20 bg-rose-500/10 px-3 py-3 text-sm font-bold text-rose-100/80">
                No lineup added yet.
              </div>
            )}
          </div>

          <div className="oa-modal-card rounded-2xl border border-white/10 bg-white/[0.03] p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-[10px] font-black uppercase tracking-[0.24em] text-white/30">Comments</div>
              <div className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-black text-white/35">
                {comments.length}
              </div>
            </div>
            {commentsError ? (
              <div className="mt-3 rounded-xl border border-yellow-300/25 bg-yellow-400/10 px-3 py-2 text-xs font-bold text-yellow-100">
                {commentsError}
              </div>
            ) : null}
            <div className="mt-3 space-y-2">
              {comments.length ? (
                comments.map((comment) => (
                  <div key={comment.id} className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="text-xs font-black text-white/85">{displayNameForUserId(comment.userId, mentionUsers, currentUser)}</div>
                      <div className="text-[10px] font-bold text-white/30">{formatCommentTime(comment.createdAt)}</div>
                    </div>
                    <div className="mt-1 whitespace-pre-wrap text-sm font-bold text-white/65">
                      <MentionText text={comment.body} users={mentionUsers} />
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-4 text-center text-xs font-bold text-white/35">
                  No comments yet.
                </div>
              )}
            </div>
            <div className="mt-3">
              <CommentComposer mentionUsers={mentionUsers} disabled={Boolean(commentsError)} onSubmit={(body) => onAddComment(event, body)} />
            </div>
          </div>
        </div>

        <div className="oa-modal-footer grid gap-2 border-t border-white/10 px-4 py-4 sm:flex sm:flex-wrap sm:items-center sm:justify-between sm:gap-3 sm:px-6">
          <div className="grid gap-2 sm:flex sm:flex-wrap sm:items-center">
            <Button
              onClick={onClose}
              className="h-11 rounded-xl bg-white/5 px-5 text-sm font-black text-white/55 hover:bg-white/10 hover:text-white"
            >
              Close
            </Button>
            <Button
              onClick={() => onShare(event)}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-cyan-300/25 bg-cyan-400/10 px-5 text-sm font-black text-cyan-100 hover:bg-cyan-400 hover:text-black"
            >
              <Link2 className="h-4 w-4" />
              <span>Share Link</span>
            </Button>
          </div>
          {canEdit ? (
            <div className="grid gap-2 sm:flex sm:flex-wrap sm:items-center">
              <Button
                onClick={() => onDelete(event)}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-rose-300/30 bg-rose-500/15 px-5 text-sm font-black text-rose-100 hover:bg-rose-400 hover:text-black"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete Day</span>
              </Button>
              <Button
                onClick={() => onEdit(event)}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-purple-400 px-5 text-sm font-black text-black hover:bg-purple-300"
              >
                <Pencil className="h-4 w-4" />
                <span>Edit Day</span>
              </Button>
              {event.status !== "Confirmed" ? (
                <Button
                  onClick={() => onConfirm(event)}
                  title={confirmationBlockers.length ? confirmationBlockers.join(" ") : "Confirm night"}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-400 px-5 text-sm font-black text-black hover:bg-emerald-300"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Confirm Night</span>
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>
      </motion.div>
    </div>
  );
}

function MalaysiaHolidaysModal({ open, holidays, error, onClose }) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 p-2 backdrop-blur-sm sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.18 }}
        className="oa-modal-panel flex max-h-[calc(100svh-0.75rem)] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-[#16152a] to-[#0a0912] text-white shadow-2xl shadow-black/60 sm:max-h-[calc(100svh-1.5rem)] sm:rounded-3xl"
      >
        <div className="oa-modal-header flex items-start justify-between gap-4 border-b border-white/10 px-4 py-4 sm:px-6 sm:py-5">
          <div>
            <div className="text-lg font-black tracking-tight sm:text-xl">🎉 Malaysia Holidays</div>
            <div className="mt-1 text-[11px] font-black uppercase tracking-[0.2em] text-white/35">Upcoming public holidays</div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl border border-white/10 bg-white/5 p-2 text-white/50 hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="oa-modal-body min-h-0 flex-1 space-y-2 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
          {error ? (
            <div className="rounded-2xl border border-rose-300/30 bg-rose-500/10 px-3 py-3 text-sm font-bold text-rose-100">{error}</div>
          ) : null}

          {holidays.length ? (
            holidays.map((holiday) => (
              <div key={`${holiday.date}-${holiday.name}`} className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                <div className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-100/70">{dayLabelFromISO(holiday.date)}</div>
                <div className="mt-1 text-sm font-black text-white">🎉 {holiday.localName || holiday.name}</div>
                {holiday.name && holiday.name !== holiday.localName ? (
                  <div className="mt-0.5 text-xs font-bold text-white/40">{holiday.name}</div>
                ) : null}
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {(holiday.types ?? ["Public"]).map((type) => (
                    <span key={type} className="rounded-full border border-cyan-300/20 bg-cyan-400/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] text-cyan-100/70">
                      {type}
                    </span>
                  ))}
                  {!holiday.global ? (
                    <span className="rounded-full border border-yellow-300/20 bg-yellow-400/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] text-yellow-100/70">
                      State specific
                    </span>
                  ) : null}
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-8 text-center text-sm font-bold text-white/35">
              No upcoming holidays loaded yet.
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ─── Ticket Sales Templates ─────────────────────────────────────────────────
const TICKET_TEMPLATES = [
  {
    id: "4phase",
    label: "4-Phase Standard",
    desc: "EB → Phase 1 → Phase 2 → Door",
    tiers: [
      { name: "GA - Early Birds", price: 88, sold: 0 },
      { name: "GA - Phase 1", price: 108, sold: 0 },
      { name: "GA - Phase 2", price: 128, sold: 0 },
      { name: "GA - Door Sales", price: 148, sold: 0 },
    ],
  },
  {
    id: "3phase",
    label: "3-Phase Standard",
    desc: "EB → Phase 1 → Door",
    tiers: [
      { name: "GA - Early Birds", price: 88, sold: 0 },
      { name: "GA - Phase 1", price: 108, sold: 0 },
      { name: "GA - Door Sales", price: 128, sold: 0 },
    ],
  },
  {
    id: "cover",
    label: "Cover Charge",
    desc: "EB + Cover charge tiers",
    tiers: [
      { name: "GA - Early Birds", price: 68, sold: 0 },
      { name: "Cover Charge 1", price: 50, sold: 0 },
      { name: "Cover Charge 2", price: 100, sold: 0 },
      { name: "Cover Charge 3", price: 80, sold: 0 },
    ],
  },
  {
    id: "blank",
    label: "Blank",
    desc: "Start from scratch",
    tiers: [],
  },
];
const TICKET_EVENTS_KEY = "oa_ticket_events_v1";
function loadTicketEvents() {
  try { return JSON.parse(localStorage.getItem(TICKET_EVENTS_KEY) || "[]"); }
  catch { return []; }
}
function saveTicketEvents(events) {
  localStorage.setItem(TICKET_EVENTS_KEY, JSON.stringify(events));
}
function newTierId() { return `t_${Date.now()}_${Math.random().toString(36).slice(2,6)}`; }
function newEventId() { return `ev_${Date.now()}_${Math.random().toString(36).slice(2,6)}`; }

function FinanceMathPage({ onScenariosChange }) {
  const [inputs, setInputs] = useState(financeDefaultInputs);
  const [savedScenarios, setSavedScenarios] = useState(readSavedFinanceScenarios);
  const [activeScenarioId, setActiveScenarioId] = useState(null);
  const [artistFx, setArtistFx] = useState({ currency: inputs.artistCostCurrency || "USD", rateToMyr: 0, fetchedAt: 0, loading: false, error: "" });
  const [linkedTickets, setLinkedTickets] = useState(null);

  const loadFinanceScenarios = useCallback(async () => {
    if (!isSupabaseConfigured) return readSavedFinanceScenarios();
    const { data, error } = await supabase
      .from("finance_scenarios")
      .select("id, name, partner_name, inputs, created_at, updated_at")
      .order("updated_at", { ascending: false });
    if (error) throw error;
    const rows = Array.isArray(data) ? data : [];
    return rows.map((row) => ({
      id: String(row.id),
      name: String(row.name || "Untitled Finance Event"),
      partnerName: String(row.partner_name || "Partner"),
      inputs: row.inputs && typeof row.inputs === "object" ? row.inputs : {},
      createdAt: row.created_at || new Date().toISOString(),
      updatedAt: row.updated_at || row.created_at || new Date().toISOString(),
    }));
  }, []);

  const refreshFinanceScenarios = useCallback(async () => {
    try {
      const next = await loadFinanceScenarios();
      setSavedScenarios(next);
      writeSavedFinanceScenarios(next);
      if (onScenariosChange) onScenariosChange(next);
    } catch {
      const next = readSavedFinanceScenarios();
      setSavedScenarios(next);
      if (onScenariosChange) onScenariosChange(next);
    }
  }, [loadFinanceScenarios, onScenariosChange]);

  useEffect(() => {
    refreshFinanceScenarios();
  }, [refreshFinanceScenarios]);

  const loadLinkedTicketsForScenario = useCallback(async (scenarioId) => {
    if (!scenarioId) return null;
    if (!isSupabaseConfigured) {
      const ticketEvents = loadTicketEvents();
      const match = ticketEvents.find((ev) => ev?.linkedScenarioId && String(ev.linkedScenarioId) === String(scenarioId));
      if (!match) return null;
      const tiers = Array.isArray(match.tiers) ? match.tiers : [];
      const total = tiers.reduce((sum, tier) => sum + toAmount(tier?.sold) * toAmount(tier?.price), 0);
      return { ticketEventId: match.id, eventName: match.event, tiers, total };
    }

    const { data, error } = await supabase
      .from("ticket_forecast_events")
      .select("id, event_name, tiers")
      .eq("linked_finance_scenario_id", scenarioId)
      .order("updated_at", { ascending: false })
      .limit(1);
    if (error) throw error;
    const row = Array.isArray(data) ? data[0] : null;
    if (!row?.id) return null;
    const tiers = Array.isArray(row.tiers) ? row.tiers : [];
    const total = tiers.reduce((sum, tier) => sum + toAmount(tier?.sold) * toAmount(tier?.price), 0);
    return { ticketEventId: String(row.id), eventName: String(row.event_name || ""), tiers, total };
  }, []);

  const unlinkTickets = useCallback(async () => {
    if (!linkedTickets?.ticketEventId) return;
    const ticketEventId = String(linkedTickets.ticketEventId);
    setLinkedTickets(null);
    if (!isSupabaseConfigured) {
      const ticketEvents = loadTicketEvents();
      const next = ticketEvents.map((ev) => (String(ev.id) === ticketEventId ? { ...ev, linkedScenarioId: null } : ev));
      saveTicketEvents(next);
      return;
    }
    await supabase.from("ticket_forecast_events").update({ linked_finance_scenario_id: null, updated_at: new Date().toISOString() }).eq("id", ticketEventId);
  }, [linkedTickets?.ticketEventId]);

  useEffect(() => {
    if (!activeScenarioId) {
      setLinkedTickets(null);
      return;
    }
    (async () => {
      try {
        const next = await loadLinkedTicketsForScenario(activeScenarioId);
        setLinkedTickets(next);
      } catch {
        setLinkedTickets(null);
      }
    })();
  }, [activeScenarioId, loadLinkedTicketsForScenario]);

  useEffect(() => {
    if (!linkedTickets || !linkedTickets.tiers) return;
    const doorTiers = linkedTickets.tiers.filter((t) => (t.name || "").toLowerCase().includes("door"));
    const onlineTiers = linkedTickets.tiers.filter((t) => !(t.name || "").toLowerCase().includes("door"));
    const doorRev = doorTiers.reduce((s, t) => s + (t.sold || 0) * (t.price || 0), 0);
    const onlineRev = onlineTiers.reduce((s, t) => s + (t.sold || 0) * (t.price || 0), 0);
    setInputs((prev) => ({ ...prev, onlineTicketSales: onlineRev, doorSales: doorRev }));
  }, [linkedTickets?.ticketEventId]);

  const migrateFinanceInputs = useCallback((raw) => {
    const base = { ...financeDefaultInputs, ...(raw || {}) };
    const legacyCurrency = String(raw?.currencyCode || "").toUpperCase();
    const legacyRate = Math.max(toAmount(raw?.exchangeRateToMyr), 0);

    const monetaryKeys = [
      "barSales",
      "onlineTicketSales",
      "doorSales",
      "sponsorship",
      "ambassadorCommission",
      "utilities",
      "manpower",
      "puspal",
      "hotel",
      "rider",
      "supportingDj",
      "mc",
      "marketing",
      "tshirt",
      "otherCost",
    ];

    const shouldConvertLegacy = legacyCurrency && legacyCurrency !== "MYR" && legacyRate > 0;
    const next = { ...base };

    if (shouldConvertLegacy) {
      for (const key of monetaryKeys) {
        next[key] = toAmount(base[key]) * legacyRate;
      }
    }

    const allowedArtistCurrencies = new Set(["USD", "EUR", "AUD"]);
    if (allowedArtistCurrencies.has(String(base.artistCostCurrency || "").toUpperCase())) {
      next.artistCostCurrency = String(base.artistCostCurrency || "").toUpperCase();
    } else if (allowedArtistCurrencies.has(legacyCurrency)) {
      next.artistCostCurrency = legacyCurrency;
    } else {
      next.artistCostCurrency = financeDefaultInputs.artistCostCurrency;
    }

    next.artistCost = toAmount(base.artistCost);
    return next;
  }, []);

  const persistScenarios = (next) => {
    setSavedScenarios(next);
    writeSavedFinanceScenarios(next);
    if (onScenariosChange) onScenariosChange(next);
  };

  const setInput = (key, value) => {
    setInputs((prev) => ({
      ...prev,
      [key]: typeof prev[key] === "number" ? toAmount(value) : value,
    }));
  };

  const setSuggestedFixedCosts = (enabled) => {
    setInputs((prev) => ({
      ...prev,
      includeSuggestedFixedCosts: enabled,
      ...(enabled
        ? { ...financeSuggestedFixedCosts }
        : {
            serviceRate: 0,
            sstRate: 0,
            bottleCostRate: 0,
            utilities: 0,
            manpower: 0,
          }),
    }));
  };

  const saveScenario = () => {
    const now = new Date().toISOString();
    if (activeScenarioId) {
      const nextScenarios = savedScenarios.map((scenario) =>
        scenario.id === activeScenarioId
          ? {
              ...scenario,
              name: String(inputs.eventName || scenario.name || "Untitled Finance Event").trim() || "Untitled Finance Event",
              partnerName: String(inputs.partnerName || scenario.partnerName || "Partner").trim() || "Partner",
              inputs: { ...inputs },
              updatedAt: now,
            }
          : scenario,
      );
      persistScenarios(nextScenarios);
      if (isSupabaseConfigured) {
        (async () => {
          await supabase
            .from("finance_scenarios")
            .upsert(
              nextScenarios
                .filter((scenario) => scenario.id === activeScenarioId)
                .map((scenario) => ({
                  id: scenario.id,
                  name: scenario.name,
                  partner_name: scenario.partnerName,
                  inputs: scenario.inputs,
                  updated_at: scenario.updatedAt,
                })),
            );
          refreshFinanceScenarios();
        })();
      }
      return;
    }

    const scenario = createFinanceScenario(inputs);
    const nextScenarios = [scenario, ...savedScenarios];
    persistScenarios(nextScenarios);
    setActiveScenarioId(scenario.id);
    if (isSupabaseConfigured) {
      (async () => {
        await supabase.from("finance_scenarios").upsert({
          id: scenario.id,
          name: scenario.name,
          partner_name: scenario.partnerName,
          inputs: scenario.inputs,
          created_at: scenario.createdAt,
          updated_at: scenario.updatedAt,
        });
        refreshFinanceScenarios();
      })();
    }
  };

  const saveAsNewScenario = () => {
    const scenario = createFinanceScenario(inputs);
    const nextScenarios = [scenario, ...savedScenarios];
    persistScenarios(nextScenarios);
    setActiveScenarioId(scenario.id);
    if (isSupabaseConfigured) {
      (async () => {
        await supabase.from("finance_scenarios").upsert({
          id: scenario.id,
          name: scenario.name,
          partner_name: scenario.partnerName,
          inputs: scenario.inputs,
          created_at: scenario.createdAt,
          updated_at: scenario.updatedAt,
        });
        refreshFinanceScenarios();
      })();
    }
  };

  const loadScenario = (scenario) => {
    setInputs(migrateFinanceInputs(scenario.inputs));
    setActiveScenarioId(scenario.id);
  };

  const startNewScenario = () => {
    setInputs(financeDefaultInputs);
    setActiveScenarioId(null);
  };

  const deleteScenario = (scenarioId) => {
    const scenario = savedScenarios.find((item) => item.id === scenarioId);
    const confirmed = window.confirm(`Delete saved finance event "${scenario?.name || "Untitled Finance Event"}"?`);
    if (!confirmed) return;
    const next = savedScenarios.filter((item) => item.id !== scenarioId);
    persistScenarios(next);
    if (activeScenarioId === scenarioId) startNewScenario();
    if (isSupabaseConfigured) {
      (async () => {
        await supabase.from("finance_scenarios").delete().eq("id", scenarioId);
        refreshFinanceScenarios();
      })();
    }
  };

  useEffect(() => {
    setInputs((prev) => migrateFinanceInputs(prev));
  }, [migrateFinanceInputs]);

  const hasPartnerSplit = Boolean(inputs.hasPartnerSplit);
  const includeSuggestedFixedCosts = Boolean(inputs.includeSuggestedFixedCosts);
  const share = (value) => Math.max(0, Math.min(100, toAmount(value))) / 100;
  const splitShare = (value) => (hasPartnerSplit ? share(value) : 1);
  const barSales = toAmount(inputs.barSales);
  const onlineTicketSales = toAmount(inputs.onlineTicketSales);
  const doorSales = toAmount(inputs.doorSales);
  const sponsorship = toAmount(inputs.sponsorship);
  const ambassadorCommission = toAmount(inputs.ambassadorCommission);
  const utilities = includeSuggestedFixedCosts ? toAmount(inputs.utilities) : 0;
  const manpower = toAmount(inputs.manpower);
  const puspal = toAmount(inputs.puspal);
  const hotel = toAmount(inputs.hotel);
  const rider = toAmount(inputs.rider);
  const supportingDj = toAmount(inputs.supportingDj);
  const mc = toAmount(inputs.mc);
  const marketing = toAmount(inputs.marketing);
  const merchandise = toAmount(inputs.tshirt);
  const otherCost = toAmount(inputs.otherCost);

  const artistCostCurrency = String(inputs.artistCostCurrency || "USD").toUpperCase();
  const artistCostRaw = toAmount(inputs.artistCost);
  const artistCostRateToMyr = artistCostCurrency === "MYR" ? 1 : Math.max(toAmount(artistFx.rateToMyr), 0);
  const artistCost = artistCostRaw * artistCostRateToMyr;

  useEffect(() => {
    const currency = String(inputs.artistCostCurrency || "USD").toUpperCase();
    const key = `oa_dashboard_fx_${currency}_MYR_v1`;
    const now = Date.now();
    const maxAgeMs = 6 * 60 * 60 * 1000;
    let cached = null;
    try {
      cached = JSON.parse(window.localStorage.getItem(key) || "null");
    } catch {
      cached = null;
    }

    const cachedRate = cached?.rateToMyr != null ? Number(cached.rateToMyr) : 0;
    const cachedAt = cached?.fetchedAt != null ? Number(cached.fetchedAt) : 0;
    const cacheValid = currency !== "MYR" && cachedRate > 0 && cachedAt > 0 && now - cachedAt < maxAgeMs;

    if (currency === "MYR") {
      setArtistFx({ currency, rateToMyr: 1, fetchedAt: now, loading: false, error: "" });
      return undefined;
    }

    if (cacheValid) {
      setArtistFx((prev) => ({ ...prev, currency, rateToMyr: cachedRate, fetchedAt: cachedAt, loading: false, error: "" }));
    } else {
      setArtistFx((prev) => ({ ...prev, currency, rateToMyr: cachedRate > 0 ? cachedRate : prev.rateToMyr, fetchedAt: cachedAt || prev.fetchedAt, loading: true, error: "" }));
    }

    const controller = new AbortController();
    (async () => {
      try {
        const response = await fetch(`https://open.er-api.com/v6/latest/${encodeURIComponent(currency)}`, { signal: controller.signal });
        if (!response.ok) throw new Error(`FX request failed (${response.status})`);
        const data = await response.json();
        const rate = Number(data?.rates?.MYR);
        if (!Number.isFinite(rate) || rate <= 0) throw new Error("FX response missing MYR rate");
        const fetchedAt = Date.now();
        window.localStorage.setItem(key, JSON.stringify({ rateToMyr: rate, fetchedAt }));
        setArtistFx({ currency, rateToMyr: rate, fetchedAt, loading: false, error: "" });
      } catch (error) {
        const message = error?.name === "AbortError" ? "" : String(error?.message || "Could not load FX");
        setArtistFx((prev) => ({
          ...prev,
          currency,
          loading: false,
          error: message,
        }));
      }
    })();

    return () => controller.abort();
  }, [inputs.artistCostCurrency]);
  const serviceCharge = includeSuggestedFixedCosts ? barSales * share(inputs.serviceRate) : 0;
  const sst = includeSuggestedFixedCosts ? barSales * share(inputs.sstRate) : 0;
  const barSplitPartner = hasPartnerSplit ? barSales * share(inputs.barSplitPartnerRate) : 0;
  const bottleCost = includeSuggestedFixedCosts ? barSales * share(inputs.bottleCostRate) : 0;
  const onlineTicketOa = onlineTicketSales * splitShare(inputs.ticketOaShare);
  const doorOa = doorSales * splitShare(inputs.doorOaShare);
  const sponsorshipOa = sponsorship * splitShare(inputs.sponsorshipOaShare);
  const artistOa = artistCost * splitShare(inputs.artistOaShare);

  const incomeRows = [
    ["Bar Sales", barSales, barSales, 0],
    ...(includeSuggestedFixedCosts
      ? [
          [`Service Charge (${inputs.serviceRate}%)`, serviceCharge, serviceCharge, 0],
          [`SST (${inputs.sstRate}%)`, sst, 0, 0],
        ]
      : []),
    ["Online Ticket Sales", onlineTicketSales, onlineTicketOa, onlineTicketSales - onlineTicketOa],
    ["Door Sales", doorSales, doorOa, doorSales - doorOa],
    ["Sponsorship", sponsorship, sponsorshipOa, sponsorship - sponsorshipOa],
    [`Bar Split (${inputs.barSplitPartnerRate}%)`, barSplitPartner, 0, barSplitPartner],
  ];

  const costRows = [
    ...(includeSuggestedFixedCosts ? [[`Bottle Cost (${inputs.bottleCostRate}% Bar Sales)`, bottleCost, bottleCost, 0]] : []),
    ["Ambassador Commission", ambassadorCommission, ambassadorCommission, 0],
    ...(includeSuggestedFixedCosts ? [["Utilities", utilities, utilities, 0]] : []),
    ["Man Power", manpower, manpower, 0],
    ["International Artist Cost", artistCost, artistOa, artistCost - artistOa],
    ["Puspal", puspal, puspal, 0],
    ["Hotel", hotel, hotel, 0],
    ["Rider", rider, rider, 0],
    ["Supporting DJ", supportingDj, supportingDj, 0],
    ["MC", mc, mc, 0],
    ["Marketing", marketing, marketing, 0],
    ["Merchandise", merchandise, merchandise, 0],
    ["Other Cost", otherCost, otherCost, 0],
    ["Bar Split Paid Out", barSplitPartner, barSplitPartner, 0],
  ];

  const total = (rows, index) => rows.reduce((sum, row) => sum + row[index], 0);
  const oaIncome = total(incomeRows, 2);
  const partnerIncome = total(incomeRows, 3);
  const oaCost = total(costRows, 2);
  const partnerCost = total(costRows, 3);
  const oaNett = oaIncome - oaCost;
  const partnerNett = partnerIncome - partnerCost;
  const oaRoi = oaCost ? (oaNett / oaCost) * 100 : 0;
  const partnerRoi = partnerCost ? (partnerNett / partnerCost) * 100 : 0;

  const numberFields = [
    ["barSales", "Bar Sales"],
    ...(includeSuggestedFixedCosts
      ? [
          ["serviceRate", "Service %"],
          ["sstRate", "SST %"],
        ]
      : []),
    ["onlineTicketSales", "Online Ticket Sales"],
    ["doorSales", "Door Sales"],
    ["sponsorship", "Sponsorship"],
    ...(hasPartnerSplit
      ? [
          ["ticketOaShare", "Ticket O&A %"],
          ["doorOaShare", "Door O&A %"],
          ["sponsorshipOaShare", "Sponsorship O&A %"],
          ["barSplitPartnerRate", "Bar Split Partner %"],
        ]
      : []),
    ...(includeSuggestedFixedCosts ? [["bottleCostRate", "Bottle Cost %"]] : []),
    ["ambassadorCommission", "Ambassador Commission"],
    ...(includeSuggestedFixedCosts ? [["utilities", "Utilities"]] : []),
    ["manpower", "Man Power"],
    ...(hasPartnerSplit ? [["artistOaShare", "Artist Cost O&A %"]] : []),
    ["puspal", "Puspal"],
    ["hotel", "Hotel"],
    ["rider", "Rider"],
    ["supportingDj", "Supporting DJ"],
    ["mc", "MC"],
    ["marketing", "Marketing"],
    ["tshirt", "Merchandise"],
    ["otherCost", "Other Cost"],
  ];

  const renderRows = (rows) =>
    rows.map(([label, amount, oa, partner]) => (
      <tr key={label} className="border-b border-white/5 last:border-0">
        <td className="py-2 pr-3 text-white/70">{label}</td>
        {hasPartnerSplit ? (
          <>
            <td className="py-2 text-right font-black text-white/55">{currency(amount)}</td>
            <td className="py-2 text-right font-black text-purple-100">{currency(oa)}</td>
            <td className="py-2 text-right font-black text-cyan-100">{currency(partner)}</td>
          </>
        ) : (
          <td className="py-2 text-right font-black text-purple-100">{currency(oa)}</td>
        )}
      </tr>
    ));

  const renderMobileRows = (rows) =>
    rows.map(([label, amount, oa, partner]) => (
      <div key={label} className="rounded-xl border border-white/10 bg-black/20 p-3">
        <div className="text-xs font-black text-white/80">{label}</div>
        {hasPartnerSplit ? (
          <div className="mt-2 grid grid-cols-3 gap-2 text-[11px] font-black uppercase tracking-[0.12em] text-white/30">
            <div>Amount<div className="mt-0.5 text-sm tracking-normal text-white/55">{currency(amount)}</div></div>
            <div>O&A<div className="mt-0.5 text-sm tracking-normal text-purple-100">{currency(oa)}</div></div>
            <div>{inputs.partnerName || "Partner"}<div className="mt-0.5 text-sm tracking-normal text-cyan-100">{currency(partner)}</div></div>
          </div>
        ) : (
          <div className="mt-1.5 text-sm font-black text-purple-100">{currency(oa)}</div>
        )}
      </div>
    ));

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-3 sm:p-5">
        <div className="grid gap-3 md:flex md:flex-wrap md:items-start md:justify-between">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.24em] text-purple-200/60">Financial Math</div>
            <h1 className="mt-1 text-xl font-black tracking-tight text-white sm:text-2xl">{inputs.eventName}</h1>
            {inputs.eventDate && (
              <div className="mt-0.5 text-xs font-bold text-white/40">
                {new Date(inputs.eventDate + "T00:00:00").toLocaleDateString("en-MY", { weekday: "short", day: "numeric", month: "long", year: "numeric" })}
              </div>
            )}
            {activeScenarioId ? <div className="mt-1 text-sm font-bold text-white/35">Saved finance event loaded. Edit inputs, then save to update it.</div> : null}
          </div>
          <div className="grid grid-cols-4 gap-1.5 sm:flex sm:flex-wrap sm:gap-2">
            <Button
              onClick={saveScenario}
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-purple-400 px-2 text-[11px] font-black text-black hover:bg-purple-300 sm:gap-2 sm:px-4 sm:text-xs"
            >
              <Save className="h-4 w-4" />
              {activeScenarioId ? "Update" : "Save"}
            </Button>
            <Button
              onClick={saveAsNewScenario}
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-purple-300/40 bg-purple-400/10 px-2 text-[11px] font-black text-purple-100 hover:bg-purple-400/20 sm:gap-2 sm:px-4 sm:text-xs"
            >
              <Plus className="h-4 w-4" />
              Save New
            </Button>
            <Button
              onClick={startNewScenario}
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-2 text-[11px] font-black text-white/55 hover:bg-white/10 hover:text-white sm:gap-2 sm:px-4 sm:text-xs"
            >
              <RefreshCcw className="h-4 w-4" />
              New
            </Button>
            <Button
              onClick={() => exportPnlPdf({ inputs, incomeRows, costRows, oaIncome, oaCost, oaNett, oaRoi, partnerIncome, partnerCost, partnerNett, partnerRoi, hasPartnerSplit, artistCost, artistCostCurrency, linkedTickets })}
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-2 text-[11px] font-black text-white/55 hover:bg-white/10 hover:text-white sm:gap-2 sm:px-4 sm:text-xs"
            >
              <Receipt className="h-4 w-4" />
              PDF
            </Button>
          </div>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryTile label="O&A Nett" value={currency(oaNett)} tone={oaNett >= 0 ? "text-emerald-200" : "text-rose-200"} />
          <SummaryTile label="O&A ROI" value={percent(oaRoi)} tone={oaRoi >= 0 ? "text-emerald-200" : "text-rose-200"} />
          {hasPartnerSplit ? (
            <>
              <SummaryTile label={`${inputs.partnerName || "Partner"} Nett`} value={currency(partnerNett)} tone={partnerNett >= 0 ? "text-cyan-100" : "text-rose-200"} />
              <SummaryTile label={`${inputs.partnerName || "Partner"} ROI`} value={percent(partnerRoi)} tone={partnerRoi >= 0 ? "text-cyan-100" : "text-rose-200"} />
            </>
          ) : (
            <SummaryTile label="Mode" value="O&A Only" tone="text-white/80" />
          )}
        </div>
      </section>

      <section className="grid gap-3 lg:grid-cols-[360px_minmax(0,1fr)] xl:grid-cols-[420px_minmax(0,1fr)]">
        <div className="rounded-2xl border border-white/10 bg-[#12111f] p-3 sm:p-4">
          <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
            <div className="text-[10px] font-black uppercase tracking-[0.24em] text-white/30">Saved Finance Events</div>
            <div className="mt-3 space-y-2">
              {savedScenarios.length ? (
                savedScenarios.map((scenario) => {
                  const active = scenario.id === activeScenarioId;
                  return (
                    <div
                      key={scenario.id}
                      className={`grid grid-cols-[minmax(0,1fr)_40px] items-center gap-2 rounded-xl border p-2 ${
                        active ? "border-purple-300/50 bg-purple-400/10" : "border-white/10 bg-white/[0.03]"
                      }`}
                    >
                      <button type="button" onClick={() => loadScenario(scenario)} className="min-w-0 text-left">
                        <div className="truncate text-sm font-black text-white/85">{scenario.name}</div>
                        <div className="mt-0.5 truncate text-[10px] font-bold uppercase tracking-[0.16em] text-white/30">
                          {scenario.partnerName || "Partner"} · {new Date(scenario.updatedAt || scenario.createdAt).toLocaleDateString("en-MY")}
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteScenario(scenario.id)}
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/35 hover:bg-rose-400/20 hover:text-rose-100"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-4 text-sm font-bold text-white/35">
                  No saved finance events yet.
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 text-[10px] font-black uppercase tracking-[0.24em] text-white/30">Inputs</div>
          <div className="mt-3 grid gap-3">
            <label>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Event Name</span>
              <input
                value={inputs.eventName}
                onChange={(e) => setInput("eventName", e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm font-black text-white/80 outline-none focus:border-purple-300/60"
              />
            </label>
            <label>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Event Date</span>
              <input
                type="date"
                value={inputs.eventDate || ""}
                onChange={(e) => setInput("eventDate", e.target.value)}
                className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm font-black text-white/80 outline-none focus:border-purple-300/60 [color-scheme:dark]"
              />
            </label>
            <div className="grid gap-2 sm:grid-cols-[1fr_1fr] lg:grid-cols-1">
              <div className="rounded-xl border border-purple-300/20 bg-purple-400/10 px-3 py-2 text-xs font-bold text-purple-100/80">
                All amounts are in RM (MYR). Only International Artist Cost can be entered in USD/EUR/AUD and auto converts to RM using the latest online FX rate.
              </div>
            </div>
            {/* Linked ticket forecast banner */}
            {linkedTickets && (
              <div className="rounded-xl border border-cyan-300/30 bg-cyan-400/10 px-3 py-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-[9px] font-black uppercase tracking-[0.18em] text-cyan-300/60">Ticket Forecast Linked</div>
                    <div className="mt-0.5 text-xs font-black text-cyan-100">{linkedTickets.eventName}</div>
                    <div className="mt-0.5 text-[10px] font-bold text-cyan-200/60">
                      Total: RM {linkedTickets.total.toLocaleString("en-MY", { maximumFractionDigits: 0 })} · {linkedTickets.tiers.length} tier{linkedTickets.tiers.length !== 1 ? "s" : ""}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="flex items-center gap-1 rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1.5">
                      <Check className="h-3 w-3 text-emerald-400" />
                      <span className="text-[10px] font-black text-emerald-300">Linked</span>
                    </div>
                    <button
                      onClick={unlinkTickets}
                      className="rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-[10px] font-black text-white/40 hover:text-white"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </div>
            )}
            <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-3">
              <div className="flex flex-wrap items-end justify-between gap-2">
                <div>
                  <div className="text-[10px] font-black uppercase tracking-[0.18em] text-white/30">International Artist Cost</div>
                  <div className="mt-1 text-xs font-bold text-white/45">
                    {artistFx.loading ? "Loading latest FX..." : artistFx.error ? `FX issue: ${artistFx.error}` : artistFx.rateToMyr ? `1 ${artistCostCurrency} = ${currency(artistCostRateToMyr, "MYR")} (MYR)` : "FX not loaded yet"}
                  </div>
                </div>
                <div className="text-xs font-black text-white/70">{currency(artistCost)} MYR</div>
              </div>
              <div className="mt-2 grid gap-2 sm:grid-cols-[120px_1fr]">
                <label className="block">
                  <span className="text-[10px] font-black uppercase tracking-[0.18em] text-white/30">Currency</span>
                  <select
                    value={artistCostCurrency}
                    onChange={(e) => setInput("artistCostCurrency", e.target.value)}
                    className="mt-1 h-[42px] w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm font-black text-white/80 outline-none focus:border-purple-300/60"
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="AUD">AUD</option>
                  </select>
                </label>
                <label className="block">
                  <span className="text-[10px] font-black uppercase tracking-[0.18em] text-white/30">Amount</span>
                  <DecimalInput value={inputs.artistCost} onChange={(value) => setInput("artistCost", value)} />
                </label>
              </div>
            </div>
            <label>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Partner</span>
              <input
                value={inputs.partnerName}
                onChange={(e) => setInput("partnerName", e.target.value)}
                disabled={!hasPartnerSplit}
                className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm font-black text-white/80 outline-none focus:border-purple-300/60 disabled:cursor-not-allowed disabled:opacity-35"
              />
            </label>
            <label className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/20 px-3 py-3">
              <span>
                <span className="block text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Partner Split</span>
                <span className="mt-1 block text-xs font-bold text-white/45">{hasPartnerSplit ? "Split revenue and selected costs with partner" : "O&A takes all revenue and costs"}</span>
              </span>
              <input
                type="checkbox"
                checked={hasPartnerSplit}
                onChange={(e) => setInput("hasPartnerSplit", e.target.checked)}
                className="h-5 w-5 accent-purple-400"
              />
            </label>
            <label className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/20 px-3 py-3">
              <span>
                <span className="block text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Suggested Fixed Costs</span>
                <span className="mt-1 block text-xs font-bold text-white/45">
                  {includeSuggestedFixedCosts ? "Includes service 10%, SST 8%, bottle 40%, utilities RM1,500" : "Skip service, SST, bottle cost, and utilities"}
                </span>
              </span>
              <input
                type="checkbox"
                checked={includeSuggestedFixedCosts}
                onChange={(e) => setSuggestedFixedCosts(e.target.checked)}
                className="h-5 w-5 accent-purple-400"
              />
            </label>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
              {numberFields.map(([key, label]) => (
                <label key={key} className="block">
                  <span className="text-[10px] font-black uppercase tracking-[0.18em] text-white/30">{label}</span>
                  <DecimalInput
                    value={inputs[key]}
                    onChange={(value) => setInput(key, value)}
                  />
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-3 sm:space-y-4">
          <div className="grid gap-3 md:hidden">
            <FinanceMobileSection
              title="Income"
              rows={renderMobileRows(incomeRows)}
              totalLabel="Total Income"
              oaTotal={oaIncome}
              partnerTotal={partnerIncome}
              partnerName={inputs.partnerName}
              hasPartnerSplit={hasPartnerSplit}
            />
            <FinanceMobileSection
              title="Cost"
              rows={renderMobileRows(costRows)}
              totalLabel="Total Cost"
              oaTotal={oaCost}
              partnerTotal={partnerCost}
              partnerName={inputs.partnerName}
              hasPartnerSplit={hasPartnerSplit}
            />
          </div>
          <div className="hidden md:block">
          <FinanceTable
            title="Income"
            rows={renderRows(incomeRows)}
            totalLabel="Total Income"
            oaTotal={oaIncome}
            partnerTotal={partnerIncome}
            partnerName={inputs.partnerName}
            hasPartnerSplit={hasPartnerSplit}
          />
          </div>
          <div className="hidden md:block">
          <FinanceTable
            title="Cost"
            rows={renderRows(costRows)}
            totalLabel="Total Cost"
            oaTotal={oaCost}
            partnerTotal={partnerCost}
            partnerName={inputs.partnerName}
            hasPartnerSplit={hasPartnerSplit}
          />
          </div>
          <div className={`grid gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-4 ${hasPartnerSplit ? "sm:grid-cols-2" : ""}`}>
            <SummaryTile label="O&A Nett / ROI" value={`${currency(oaNett)} · ${percent(oaRoi)}`} tone={oaNett >= 0 ? "text-emerald-200" : "text-rose-200"} />
            {hasPartnerSplit ? (
              <SummaryTile label={`${inputs.partnerName || "Partner"} Nett / ROI`} value={`${currency(partnerNett)} · ${percent(partnerRoi)}`} tone={partnerNett >= 0 ? "text-cyan-100" : "text-rose-200"} />
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}

function DecimalInput({ value, onChange, disabled = false }) {
  const [draft, setDraft] = useState(null);
  const displayValue = draft ?? formatInputNumber(value);

  return (
    <input
      type="text"
      inputMode="decimal"
      value={displayValue}
      disabled={disabled}
      onFocus={(event) => {
        setDraft(formatInputNumberForEdit(value));
        event.currentTarget.select();
      }}
      onChange={(event) => {
        setDraft(event.target.value);
        onChange(event.target.value);
      }}
      onBlur={() => setDraft(null)}
      className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm font-black text-white/80 outline-none focus:border-purple-300/60 disabled:cursor-not-allowed disabled:opacity-35"
    />
  );
}

function SummaryTile({ label, value, tone = "text-white" }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-3 sm:px-4">
      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">{label}</div>
      <div className={`mt-1 text-lg font-black tracking-tight sm:text-xl ${tone}`}>{value}</div>
    </div>
  );
}

function FinanceMobileSection({ title, rows, totalLabel, oaTotal, partnerTotal, partnerName, hasPartnerSplit }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#12111f] p-3">
      <div className="text-[10px] font-black uppercase tracking-[0.24em] text-white/30">{title}</div>
      <div className="mt-3 grid gap-2">{rows}</div>
      <div className={`mt-3 grid gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-3 ${hasPartnerSplit ? "grid-cols-2" : ""}`}>
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.16em] text-white/30">{hasPartnerSplit ? `${totalLabel} O&A` : totalLabel}</div>
          <div className="mt-1 text-base font-black text-purple-100">{currency(oaTotal)}</div>
        </div>
        {hasPartnerSplit ? (
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.16em] text-white/30">{partnerName || "Partner"}</div>
            <div className="mt-1 text-base font-black text-cyan-100">{currency(partnerTotal)}</div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function FinanceTable({ title, rows, totalLabel, oaTotal, partnerTotal, partnerName, hasPartnerSplit }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#12111f]">
      <div className="border-b border-white/10 px-4 py-3 text-[10px] font-black uppercase tracking-[0.24em] text-white/30">{title}</div>
      <div className="overflow-x-auto px-4 py-3">
        <table className={`w-full text-sm ${hasPartnerSplit ? "min-w-[560px]" : "min-w-[280px]"}`}>
          <thead className="text-[10px] uppercase tracking-[0.18em] text-white/30">
            <tr>
              <th className="pb-2 text-left">Item</th>
              {hasPartnerSplit ? (
                <>
                  <th className="pb-2 text-right">Total</th>
                  <th className="pb-2 text-right">O&A</th>
                  <th className="pb-2 text-right">{partnerName || "Partner"}</th>
                </>
              ) : (
                <th className="pb-2 text-right">Amount</th>
              )}
            </tr>
          </thead>
          <tbody>{rows}</tbody>
          <tfoot>
            <tr className="border-t border-white/10 text-base">
              <td className="pt-3 font-black text-white">{totalLabel}</td>
              {hasPartnerSplit ? (
                <>
                  <td />
                  <td className="pt-3 text-right font-black text-purple-100">{currency(oaTotal)}</td>
                  <td className="pt-3 text-right font-black text-cyan-100">{currency(partnerTotal)}</td>
                </>
              ) : (
                <td className="pt-3 text-right font-black text-purple-100">{currency(oaTotal)}</td>
              )}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

// ─── PDF export helper ───────────────────────────────────────────────────────
function exportPnlPdf({ inputs, incomeRows, costRows, oaIncome, oaCost, oaNett, oaRoi, partnerIncome, partnerCost, partnerNett, partnerRoi, hasPartnerSplit, artistCost, artistCostCurrency, linkedTickets }) {
  const rm = (n) => "RM " + Number(n||0).toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const pct = (n) => (Number(n||0)*100).toFixed(1) + "%";
  const partnerName = inputs.partnerName || "Partner";

  // Pre-build row HTML for income/cost tables
  const rowsHtml = (rows) => rows.map(function(r) {
    var label = r[0], total = r[1], oa = r[2], partner = r[3];
    if (hasPartnerSplit) {
      return "<tr><td>" + label + "</td><td class=\"num\">" + rm(total) + "</td><td class=\"num oa\">" + rm(oa) + "</td><td class=\"num partner\">" + rm(partner) + "</td></tr>";
    }
    return "<tr><td>" + label + "</td><td class=\"num oa\">" + rm(oa) + "</td></tr>";
  }).join("");

  // Pre-build ticket section HTML
  var ticketHtml = "";
  if (linkedTickets && linkedTickets.tiers && linkedTickets.tiers.length > 0) {
    var tiers = linkedTickets.tiers;
    var ticketTotal = linkedTickets.total || 0;
    var totalSold = 0;
    var tierRows = "";
    for (var i = 0; i < tiers.length; i++) {
      var t = tiers[i];
      var rev = (t.sold || 0) * (t.price || 0);
      var share = ticketTotal > 0 ? Math.round((rev / ticketTotal) * 100) : 0;
      totalSold += (t.sold || 0);
      var priceCell = t.price != null ? "RM " + t.price : "—";
      tierRows += "<tr><td>" + (t.name || "") + "</td><td class=\"num\">" + (t.sold || 0) + "</td><td class=\"num\">" + priceCell + "</td><td class=\"num\">" + rm(rev) + "</td><td class=\"num\">" + share + "%</td></tr>";
    }
    ticketHtml = "<div class=\"section-title\">Ticket Sales — " + (linkedTickets.eventName || "Linked Event") + "</div>"
      + "<table><thead><tr><th>Tier</th><th class=\"num\">Sold</th><th class=\"num\">Price (RM)</th><th class=\"num\">Revenue</th><th class=\"num\">Share</th></tr></thead>"
      + "<tbody>" + tierRows + "</tbody>"
      + "<tfoot><tr><td><strong>Total Ticket Revenue</strong></td><td class=\"num\">" + totalSold + "</td><td></td><td class=\"num oa\">" + rm(ticketTotal) + "</td><td class=\"num\">100%</td></tr></tfoot>"
      + "</table>";
  }

  // Partner chips
  var partnerChips = hasPartnerSplit
    ? "<div class=\"chip\"><div class=\"lbl\">" + partnerName + " Nett</div><div class=\"val " + (partnerNett>=0?"blue":"red") + "\">" + rm(partnerNett) + "</div></div>"
      + "<div class=\"chip\"><div class=\"lbl\">" + partnerName + " ROI</div><div class=\"val " + (partnerRoi>=0?"blue":"red") + "\">" + pct(partnerRoi) + "</div></div>"
    : "";

  var incomeHeader = hasPartnerSplit
    ? "<th class=\"num\">Total</th><th class=\"num\">O&amp;A</th><th class=\"num\">" + partnerName + "</th>"
    : "<th class=\"num\">Amount</th>";
  var incomeFoot = hasPartnerSplit
    ? "<td></td><td class=\"num oa\">" + rm(oaIncome) + "</td><td class=\"num partner\">" + rm(partnerIncome) + "</td>"
    : "<td class=\"num oa\">" + rm(oaIncome) + "</td>";
  var costFoot = hasPartnerSplit
    ? "<td></td><td class=\"num oa\">" + rm(oaCost) + "</td><td class=\"num partner\">" + rm(partnerCost) + "</td>"
    : "<td class=\"num oa\">" + rm(oaCost) + "</td>";
  var partnerSummaryHeader = hasPartnerSplit ? "<th class=\"num\">" + partnerName + "</th>" : "";
  var partnerSummaryRows = hasPartnerSplit
    ? "<td class=\"num " + (partnerNett>=0?"blue":"red") + "\">" + rm(partnerNett) + "</td>"
      + "</tr><tr><td>ROI</td><td class=\"num " + (oaRoi>=0?"green":"red") + "\">" + pct(oaRoi) + "</td>"
      + "<td class=\"num " + (partnerRoi>=0?"blue":"red") + "\">" + pct(partnerRoi) + "</td>"
    : "</tr><tr><td>ROI</td><td class=\"num " + (oaRoi>=0?"green":"red") + "\">" + pct(oaRoi) + "</td>";

  var html = "<!DOCTYPE html><html><head><meta charset=\"utf-8\"/>"
    + "<title>P&L — " + (inputs.eventName || "Event") + "</title>"
    + "<style>"
    + "*{margin:0;padding:0;box-sizing:border-box}"
    + "body{font-family:Arial,sans-serif;font-size:12px;color:#111;padding:32px;max-width:900px;margin:auto}"
    + "h1{font-size:22px;font-weight:900;margin-bottom:4px}"
    + ".meta{color:#555;font-size:11px;margin-bottom:24px}"
    + ".chips{display:flex;gap:12px;margin-bottom:24px;flex-wrap:wrap}"
    + ".chip{background:#f4f4f8;border-radius:8px;padding:10px 16px}"
    + ".chip .lbl{font-size:10px;text-transform:uppercase;letter-spacing:.12em;color:#888;font-weight:700}"
    + ".chip .val{font-size:16px;font-weight:900;margin-top:2px}"
    + ".green{color:#16a34a}.red{color:#dc2626}.blue{color:#2563eb}.purple{color:#7c3aed}"
    + "table{width:100%;border-collapse:collapse;margin-bottom:20px}"
    + "th{text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:.12em;color:#888;padding:6px 0;border-bottom:2px solid #e5e5e5}"
    + "th.num{text-align:right}"
    + "td{padding:5px 0;border-bottom:1px solid #f0f0f0;font-size:12px}"
    + "td.num{text-align:right;font-variant-numeric:tabular-nums}"
    + "td.oa{color:#7c3aed;font-weight:700}"
    + "td.partner{color:#0891b2;font-weight:700}"
    + "tfoot td{font-weight:900;font-size:13px;padding-top:8px;border-top:2px solid #111;border-bottom:none}"
    + ".section-title{font-size:11px;font-weight:900;text-transform:uppercase;letter-spacing:.18em;color:#888;margin:20px 0 8px}"
    + ".footer{margin-top:32px;font-size:10px;color:#aaa;border-top:1px solid #eee;padding-top:12px}"
    + "@media print{body{padding:16px}.chip{background:#f9f9f9}}"
    + "</style></head><body>"
    + "<h1>" + (inputs.eventName || "Event P&L") + "</h1>"
    + (inputs.eventDate ? "<div class=\"meta\" style=\"font-size:13px;font-weight:700;color:#444;margin-bottom:2px\">" + new Date(inputs.eventDate + "T00:00:00").toLocaleDateString("en-MY", {weekday:"long",day:"numeric",month:"long",year:"numeric"}) + "</div>" : "")
    + "<div class=\"meta\">Generated " + new Date().toLocaleDateString("en-MY", {weekday:"long",day:"numeric",month:"long",year:"numeric"})
      + (hasPartnerSplit ? " · Partner: " + partnerName : "") + "</div>"
    + "<div class=\"chips\">"
    + "<div class=\"chip\"><div class=\"lbl\">O&amp;A Nett</div><div class=\"val " + (oaNett>=0?"green":"red") + "\">" + rm(oaNett) + "</div></div>"
    + "<div class=\"chip\"><div class=\"lbl\">O&amp;A ROI</div><div class=\"val " + (oaRoi>=0?"green":"red") + "\">" + pct(oaRoi) + "</div></div>"
    + partnerChips
    + "</div>"
    + "<div class=\"section-title\">Income</div>"
    + "<table><thead><tr><th>Item</th>" + incomeHeader + "</tr></thead>"
    + "<tbody>" + rowsHtml(incomeRows) + "</tbody>"
    + "<tfoot><tr><td>Total Income</td>" + incomeFoot + "</tr></tfoot></table>"
    + "<div class=\"section-title\">Costs</div>"
    + "<table><thead><tr><th>Item</th>" + incomeHeader + "</tr></thead>"
    + "<tbody>" + rowsHtml(costRows) + "</tbody>"
    + "<tfoot><tr><td>Total Cost</td>" + costFoot + "</tr></tfoot></table>"
    + ticketHtml
    + "<div class=\"section-title\">Summary</div>"
    + "<table><thead><tr><th>Item</th><th class=\"num\">O&amp;A</th>" + partnerSummaryHeader + "</tr></thead>"
    + "<tbody><tr><td>Nett Profit</td><td class=\"num " + (oaNett>=0?"green":"red") + "\">" + rm(oaNett) + "</td>" + partnerSummaryRows + "</tr></tbody></table>"
    + "<div class=\"footer\">O&amp;A Dashboard · Financial Math · Confidential</div>"
    + "<script>window.onload=function(){ window.print(); };<\/script>"
    + "</body></html>";

  const w = window.open("", "_blank", "width=900,height=700");
  if (!w) { alert("Please allow popups to export PDF."); return; }
  w.document.write(html);
  w.document.close();
}

// ─── Ticket Sales Forecast Page ──────────────────────────────────────────────
function TicketSalesPage({ savedScenarios }) {
  const [events, setEvents] = useState(() => (isSupabaseConfigured ? [] : loadTicketEvents()));
  const [showTemplates, setShowTemplates] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [linkPickerId, setLinkPickerId] = useState(null); // ticket event id waiting for scenario pick
  const persist = (next) => { setEvents(next); saveTicketEvents(next); };

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("ticket_forecast_events")
        .select("id, event_name, event_date, capacity, tiers, linked_finance_scenario_id, updated_at")
        .order("event_date", { ascending: true })
        .order("updated_at", { ascending: false });
      if (cancelled) return;
      if (error) {
        setEvents(loadTicketEvents());
        return;
      }
      const rows = Array.isArray(data) ? data : [];
      const mapped = rows.map((row) => ({
        id: String(row.id),
        event: String(row.event_name || ""),
        date: String(row.event_date || ""),
        capacity: Number(row.capacity) || 0,
        tiers: Array.isArray(row.tiers)
          ? row.tiers.map((tier) => ({
              id: String(tier?.id || newTierId()),
              name: String(tier?.name || ""),
              price: toAmount(tier?.price),
              sold: toAmount(tier?.sold),
            }))
          : [],
        linkedScenarioId: row.linked_finance_scenario_id ? String(row.linked_finance_scenario_id) : null,
      }));
      setEvents(mapped.length ? mapped : loadTicketEvents());
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) return undefined;
    const handle = window.setTimeout(async () => {
      const payload = events.map((ev) => ({
        id: ev.id,
        event_name: ev.event,
        event_date: ev.date,
        capacity: Number(ev.capacity) || 0,
        tiers: Array.isArray(ev.tiers) ? ev.tiers : [],
        linked_finance_scenario_id: ev.linkedScenarioId || null,
        updated_at: new Date().toISOString(),
      }));
      if (!payload.length) return;
      await supabase.from("ticket_forecast_events").upsert(payload);
    }, 700);
    return () => window.clearTimeout(handle);
  }, [events]);

  const addEvent = (template) => {
    const id = newEventId();
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-01`;
    const tiers = (template.tiers || []).map((t) => ({ ...t, id: newTierId() }));
    const ev = { id, event: "New Event", date: dateStr, capacity: 850, tiers, linkedScenarioId: null };
    const next = [...events, ev].sort((a,b)=>a.date.localeCompare(b.date));
    persist(next);
    setEditingId(id);
    setShowTemplates(false);
  };

  const updateEvent = (id, patch) => persist(events.map((e) => e.id === id ? { ...e, ...patch } : e));
  const deleteEvent = (id) => {
    if (!window.confirm("Delete this event?")) return;
    persist(events.filter((e) => e.id !== id));
    if (editingId === id) setEditingId(null);
    if (isSupabaseConfigured) {
      supabase.from("ticket_forecast_events").delete().eq("id", id);
    }
  };
  const updateTier = (evId, tierId, patch) =>
    updateEvent(evId, { tiers: events.find((e)=>e.id===evId).tiers.map((t) => t.id===tierId ? {...t,...patch} : t) });
  const addTier = (evId) =>
    updateEvent(evId, { tiers: [...events.find((e)=>e.id===evId).tiers, { id: newTierId(), name: "New Tier", price: 0, sold: 0 }] });
  const deleteTier = (evId, tierId) =>
    updateEvent(evId, { tiers: events.find((e)=>e.id===evId).tiers.filter((t) => t.id !== tierId) });

  const linkToScenario = (ticketEvId, scenarioId) => {
    updateEvent(ticketEvId, { linkedScenarioId: scenarioId });
    setLinkPickerId(null);
  };
  const unlinkScenario = (ticketEvId) => updateEvent(ticketEvId, { linkedScenarioId: null });

  const fmtRM = (n) => n == null ? "—" : `RM ${Number(n).toLocaleString("en-MY", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

  // Group all events by month
  const grouped = useMemo(() => {
    const sorted = [...events].sort((a,b) => a.date.localeCompare(b.date));
    const groups = [];
    let curMonth = null, curGroup = null;
    for (const ev of sorted) {
      const mo = ev.date.slice(0,7); // "YYYY-MM"
      if (mo !== curMonth) {
        const dt = new Date(ev.date + "T00:00:00");
        curMonth = mo;
        curGroup = { month: dt.toLocaleDateString("en-MY", { month: "long", year: "numeric" }), events: [] };
        groups.push(curGroup);
      }
      curGroup.events.push(ev);
    }
    return groups;
  }, [events]);

  const overallStats = useMemo(() => {
    let ticketRev = 0, totalSold = 0;
    for (const ev of events) {
      for (const t of ev.tiers) { ticketRev += (t.sold||0)*(t.price||0); totalSold += (t.sold||0); }
    }
    return { ticketRev, totalSold, eventCount: events.length };
  }, [events]);

  const dateLabel = (d) => {
    const dt = new Date(d + "T00:00:00");
    return dt.toLocaleDateString("en-MY", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  };

  const tierColor = (name) => {
    const n = (name||"").toLowerCase();
    if (n.includes("blind") || n.includes("early")) return "text-emerald-300";
    if (n.includes("phase 1") || n.includes("cover charge 1")) return "text-cyan-300";
    if (n.includes("phase 2") || n.includes("cover charge 2")) return "text-blue-300";
    if (n.includes("phase 3") || n.includes("cover charge 3")) return "text-indigo-300";
    if (n.includes("final") || n.includes("door")) return "text-orange-300";
    if (n.includes("combo")) return "text-purple-300";
    return "text-white/60";
  };

  return (
    <section className="space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.24em] text-white/30">Finance · Ticket Forecast</div>
          <h2 className="mt-0.5 text-xl font-black text-white">Ticket Sales</h2>
        </div>
        <button
          onClick={() => setShowTemplates(true)}
          className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-purple-300/40 bg-purple-400/15 px-3 text-xs font-black text-purple-100 transition hover:bg-purple-400/25"
        >
          <Plus className="h-3.5 w-3.5" /> Add Event
        </button>
      </div>

      {/* Template picker modal */}
      {showTemplates && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={() => setShowTemplates(false)}>
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#15141f] p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <div className="text-sm font-black text-white">Choose a template</div>
              <button onClick={() => setShowTemplates(false)} className="text-white/30 hover:text-white"><X className="h-4 w-4" /></button>
            </div>
            <div className="space-y-2">
              {TICKET_TEMPLATES.map((tmpl) => (
                <button key={tmpl.id} onClick={() => addEvent(tmpl)}
                  className="flex w-full items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-left transition hover:border-purple-300/40 hover:bg-purple-400/10">
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-black text-white">{tmpl.label}</div>
                    <div className="mt-0.5 text-[10px] font-bold text-white/40">{tmpl.desc}</div>
                    {tmpl.tiers.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {tmpl.tiers.map((t) => (
                          <span key={t.name} className="rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 text-[9px] font-black text-white/50">
                            {t.name} · RM{t.price}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-white/20 mt-0.5" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Scenario link picker modal */}
      {linkPickerId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" onClick={() => setLinkPickerId(null)}>
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#15141f] p-5 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <div className="text-sm font-black text-white">Link to P&L Event</div>
              <button onClick={() => setLinkPickerId(null)} className="text-white/30 hover:text-white"><X className="h-4 w-4" /></button>
            </div>
            {(!savedScenarios || savedScenarios.length === 0) ? (
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-xs text-white/40 text-center">
                No saved P&L events yet. Save a scenario in the P&L Calculator first.
              </div>
            ) : (
              <div className="space-y-2">
                {savedScenarios.map((sc) => (
                  <button key={sc.id} onClick={() => linkToScenario(linkPickerId, sc.id)}
                    className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] p-3 text-left transition hover:border-cyan-300/40 hover:bg-cyan-400/10">
                    <div>
                      <div className="text-xs font-black text-white">{sc.name}</div>
                      <div className="mt-0.5 text-[10px] text-white/40">{new Date(sc.updatedAt||sc.createdAt).toLocaleDateString("en-MY",{day:"numeric",month:"short",year:"numeric"})}</div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-white/20" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Overall stats */}
      {events.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Events", val: overallStats.eventCount.toString(), color: "text-white" },
            { label: "Ticket Revenue", val: fmtRM(overallStats.ticketRev), color: "text-purple-200" },
            { label: "Tickets Sold", val: overallStats.totalSold.toLocaleString(), color: "text-cyan-300" },
          ].map(({ label, val, color }) => (
            <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">{label}</div>
              <div className={`mt-1 text-base font-black ${color}`}>{val}</div>
            </div>
          ))}
        </div>
      )}

      {/* All events grouped by month */}
      {events.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.01] px-4 py-12 text-center">
          <div className="text-sm font-black text-white/30">No ticket events yet</div>
          <button onClick={() => setShowTemplates(true)} className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-purple-300/30 bg-purple-400/10 px-3 py-2 text-xs font-black text-purple-200 hover:bg-purple-400/20">
            <Plus className="h-3.5 w-3.5" /> Add first event
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map((group) => (
            <div key={group.month}>
              {/* Month header */}
              <div className="mb-3 flex items-center gap-3">
                <div className="text-[10px] font-black uppercase tracking-[0.22em] text-white/30">{group.month}</div>
                <div className="flex-1 border-t border-white/10" />
                <div className="text-[10px] font-black text-white/20">
                  {fmtRM(group.events.reduce((s,ev)=>s+ev.tiers.reduce((ss,t)=>ss+(t.sold||0)*(t.price||0),0),0))}
                </div>
              </div>
              <div className="space-y-3">
                {group.events.map((ev) => {
                  const isEditing = editingId === ev.id;
                  const tierTotal = ev.tiers.reduce((s,t) => s+(t.sold||0)*(t.price||0), 0);
                  const totalSold = ev.tiers.reduce((s,t) => s+(t.sold||0), 0);
                  const cap = Number(ev.capacity)||0;
                  const occupancy = cap > 0 ? Math.round((totalSold/cap)*100) : 0;
                  const linkedScenario = ev.linkedScenarioId ? (savedScenarios||[]).find((sc)=>sc.id===ev.linkedScenarioId) : null;

                  return (
                    <div key={ev.id} className={`overflow-hidden rounded-2xl border bg-white/[0.02] transition ${isEditing ? "border-purple-300/30" : "border-white/10"}`}>
                      {/* Event header */}
                      <div className="flex flex-wrap items-start justify-between gap-2 border-b border-white/10 bg-white/[0.02] px-4 py-3">
                        <div className="flex-1 min-w-0">
                          {isEditing ? (
                            <div className="flex flex-wrap gap-2">
                              <input value={ev.event} onChange={(e) => updateEvent(ev.id, { event: e.target.value })} placeholder="Event name"
                                className="min-w-0 flex-1 rounded-lg border border-white/10 bg-black/20 px-2 py-1.5 text-sm font-black text-white outline-none focus:border-purple-300/50" />
                              <input type="date" value={ev.date} onChange={(e) => updateEvent(ev.id, { date: e.target.value })}
                                className="rounded-lg border border-white/10 bg-black/20 px-2 py-1.5 text-xs font-black text-white outline-none focus:border-purple-300/50" />
                              <input type="number" value={ev.capacity} onChange={(e) => updateEvent(ev.id, { capacity: Number(e.target.value) })} placeholder="Capacity"
                                className="w-24 rounded-lg border border-white/10 bg-black/20 px-2 py-1.5 text-xs font-black text-white outline-none focus:border-purple-300/50" />
                            </div>
                          ) : (
                            <div>
                              <div className="text-sm font-black text-white">{ev.event || "Untitled"}</div>
                              <div className="mt-0.5 flex flex-wrap items-center gap-2">
                                <span className="text-[10px] font-bold text-white/40">{dateLabel(ev.date)} · Cap {cap.toLocaleString()}</span>
                                {linkedScenario && (
                                  <span className="flex items-center gap-1 rounded-full border border-cyan-300/30 bg-cyan-400/10 px-2 py-0.5 text-[9px] font-black text-cyan-300">
                                    <Banknote className="h-2.5 w-2.5" /> {linkedScenario.name}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {!isEditing && (
                            <span className={`rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                              occupancy >= 80 ? "border-emerald-300/30 bg-emerald-400/10 text-emerald-300"
                              : occupancy >= 50 ? "border-yellow-300/30 bg-yellow-400/10 text-yellow-300"
                              : "border-rose-300/30 bg-rose-400/10 text-rose-300"
                            }`}>{occupancy}% · {totalSold}/{cap}</span>
                          )}
                          {/* Link/unlink to P&L scenario */}
                          {!isEditing && (
                            ev.linkedScenarioId ? (
                              <button onClick={() => unlinkScenario(ev.id)} title="Unlink from P&L"
                                className="flex h-7 w-7 items-center justify-center rounded-lg border border-cyan-300/40 bg-cyan-400/20 text-cyan-300 transition hover:bg-rose-400/20 hover:text-rose-300 hover:border-rose-300/40">
                                <Banknote className="h-3.5 w-3.5" />
                              </button>
                            ) : (
                              <button onClick={() => setLinkPickerId(ev.id)} title="Link to P&L event"
                                className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/30 transition hover:border-cyan-300/40 hover:bg-cyan-400/10 hover:text-cyan-300">
                                <Banknote className="h-3.5 w-3.5" />
                              </button>
                            )
                          )}
                          {/* Edit toggle */}
                          <button onClick={() => setEditingId(isEditing ? null : ev.id)}
                            className={`flex h-7 w-7 items-center justify-center rounded-lg border transition ${isEditing ? "border-purple-300/40 bg-purple-400/20 text-purple-200" : "border-white/10 bg-white/5 text-white/40 hover:text-white"}`}>
                            {isEditing ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Edit2 className="h-3.5 w-3.5" />}
                          </button>
                          {/* Delete */}
                          <button onClick={() => deleteEvent(ev.id)}
                            className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/30 transition hover:border-rose-300/40 hover:bg-rose-400/10 hover:text-rose-300">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Tier table */}
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[360px] text-xs">
                          <thead>
                            <tr className="border-b border-white/5">
                              <th className="py-2 pl-4 pr-2 text-left text-[9px] font-black uppercase tracking-[0.15em] text-white/25">Tier</th>
                              <th className="px-2 py-2 text-right text-[9px] font-black uppercase tracking-[0.15em] text-white/25">Sold</th>
                              <th className="px-2 py-2 text-right text-[9px] font-black uppercase tracking-[0.15em] text-white/25">Price (RM)</th>
                              <th className="px-2 py-2 text-right text-[9px] font-black uppercase tracking-[0.15em] text-white/25">Revenue</th>
                              <th className="py-2 pl-2 pr-4 text-right text-[9px] font-black uppercase tracking-[0.15em] text-white/25">%</th>
                            </tr>
                          </thead>
                          <tbody>
                            {ev.tiers.map((tier, idx) => {
                              const rev = (tier.sold||0)*(tier.price||0);
                              const share = tierTotal > 0 ? Math.round((rev/tierTotal)*100) : 0;
                              return (
                                <tr key={tier.id} className={`border-b border-white/5 ${idx%2===0?"":"bg-white/[0.015]"}`}>
                                  <td className="py-2 pl-4 pr-2">
                                    {isEditing ? (
                                      <input value={tier.name} onChange={(e) => updateTier(ev.id, tier.id, { name: e.target.value })}
                                        className="w-full rounded border border-white/10 bg-black/20 px-1.5 py-1 text-xs font-black text-white outline-none focus:border-purple-300/40" />
                                    ) : <span className={`font-black ${tierColor(tier.name)}`}>{tier.name}</span>}
                                  </td>
                                  <td className="px-2 py-2 text-right">
                                    {isEditing ? (
                                      <input type="number" min="0" value={tier.sold} onChange={(e) => updateTier(ev.id, tier.id, { sold: Number(e.target.value) })}
                                        className="w-16 rounded border border-white/10 bg-black/20 px-1.5 py-1 text-right text-xs font-black text-white outline-none focus:border-purple-300/40" />
                                    ) : <span className="font-black text-white/70">{tier.sold}</span>}
                                  </td>
                                  <td className="px-2 py-2 text-right">
                                    {isEditing ? (
                                      <input type="number" min="0" value={tier.price} onChange={(e) => updateTier(ev.id, tier.id, { price: Number(e.target.value) })}
                                        className="w-20 rounded border border-white/10 bg-black/20 px-1.5 py-1 text-right text-xs font-black text-white outline-none focus:border-purple-300/40" />
                                    ) : <span className="font-black text-white/50">{tier.price != null ? `RM ${tier.price}` : "—"}</span>}
                                  </td>
                                  <td className="px-2 py-2 text-right font-black text-white">{fmtRM(rev)}</td>
                                  <td className="py-2 pl-2 pr-4 text-right">
                                    {isEditing ? (
                                      <button onClick={() => deleteTier(ev.id, tier.id)} className="flex h-6 w-6 items-center justify-center rounded text-white/20 hover:text-rose-400 ml-auto">
                                        <X className="h-3 w-3" />
                                      </button>
                                    ) : (
                                      <div className="flex items-center justify-end gap-1.5">
                                        <div className="hidden h-1.5 w-10 overflow-hidden rounded-full bg-white/10 sm:block">
                                          <div className="h-full rounded-full bg-purple-400/60" style={{ width: `${share}%` }} />
                                        </div>
                                        <span className="text-[10px] font-black text-white/40">{share}%</span>
                                      </div>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                            <tr className="bg-white/[0.03]">
                              <td className="py-2.5 pl-4 pr-2 text-[10px] font-black uppercase tracking-[0.12em] text-white/40">Total</td>
                              <td className="px-2 py-2.5 text-right text-[10px] font-black text-white/60">{totalSold}</td>
                              <td className="px-2 py-2.5" />
                              <td className="px-2 py-2.5 text-right font-black text-purple-200">{fmtRM(tierTotal)}</td>
                              <td className="py-2.5 pl-2 pr-4 text-right text-[10px] font-black text-white/40">100%</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      {isEditing && (
                        <div className="border-t border-white/5 px-4 py-2">
                          <button onClick={() => addTier(ev.id)} className="flex items-center gap-1.5 text-[10px] font-black text-white/30 transition hover:text-purple-300">
                            <Plus className="h-3 w-3" /> Add Tier
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

// ─── Weekly Sales Page ────────────────────────────────────────────────────────

const SALES_MONTHS = ["APRIL 2026", "MAY 2026"];

function calcNightPL(row) {
  const barSales = (row.pos_total || 0) + (row.ticketmelon_total || 0);
  const serviceCharge = barSales * 0.10;
  const sst = barSales * 0.08;
  const onlineTicket = row.online_ticket || 0;
  const walkinTicket = row.walkin_ticket || 0;
  const sponsorship = row.sponsorship || 0;
  const incomeTotal = barSales + onlineTicket + walkinTicket + sponsorship;

  const bottleCost = row.bottle_cost_override != null ? +row.bottle_cost_override : barSales * 0.40;
  const ambassadorComm = row.ambassador_commission || 0;
  const utilities = row.utilities ?? 1500;
  const manPower = row.man_power ?? 9500;
  const intlArtist = row.intl_artist_cost || 0;
  const puspal = row.puspal || 0;
  const hotel = row.hotel || 0;
  const rider = row.rider || 0;
  const localDj = row.local_dj ?? 2000;
  const barSplit = row.bar_split || 0;
  const misc = row.misc || 0;
  const costTotal = bottleCost + ambassadorComm + utilities + manPower + intlArtist + puspal + hotel + rider + localDj + barSplit + misc;

  const nett = incomeTotal - costTotal;
  const roiPct = costTotal > 0 ? nett / costTotal : 0;

  return { barSales, serviceCharge, sst, onlineTicket, walkinTicket, sponsorship, incomeTotal, bottleCost, ambassadorComm, utilities, manPower, intlArtist, puspal, hotel, rider, localDj, barSplit, misc, costTotal, nett, roiPct };
}

function salesFmtRM(val) {
  if (val == null || isNaN(+val)) return "—";
  const n = Number(val);
  if (n === 0) return "—";
  return "RM " + n.toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function salesFmtRMFull(val) {
  if (val == null || isNaN(+val)) return "RM 0.00";
  return "RM " + Number(val).toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function salesFmtPct(val) {
  return (Number(val) * 100).toFixed(1) + "%";
}

function salesFmtDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-MY", { day: "2-digit", month: "short" });
}

function monthYearFromISO(dateStr) {
  if (!dateStr) return "";
  return isoToDate(dateStr).toLocaleDateString("en-US", { month: "long", year: "numeric" }).toUpperCase();
}

const SALES_MONTH_NAME_TO_INDEX = {
  JANUARY: 0,
  FEBRUARY: 1,
  MARCH: 2,
  APRIL: 3,
  MAY: 4,
  JUNE: 5,
  JULY: 6,
  AUGUST: 7,
  SEPTEMBER: 8,
  OCTOBER: 9,
  NOVEMBER: 10,
  DECEMBER: 11,
};

function parseSalesMonthYear(label) {
  const raw = String(label || "").trim().toUpperCase();
  const match = raw.match(/^([A-Z]+)\s+(\d{4})$/);
  if (!match) return { label: String(label || ""), year: null, monthIndex: null, monthName: null };
  const monthName = match[1];
  const year = Number(match[2]);
  const monthIndex = SALES_MONTH_NAME_TO_INDEX[monthName];
  if (!Number.isFinite(year) || monthIndex == null) return { label: String(label || ""), year: null, monthIndex: null, monthName: null };
  return { label: raw, year, monthIndex, monthName };
}

function eventDjNames(event) {
  const names = new Set();
  for (const slot of event?.slots || []) {
    if (slot?.role === "MC") continue;
    const participants = Array.isArray(slot?.djParticipants) && slot.djParticipants.length
      ? slot.djParticipants
      : parseDjLineup(slot?.dj).participants;
    for (const name of participants) {
      const canonical = canonicalDjName(name);
      if (!canonical || canonical.includes("TBD")) continue;
      names.add(canonical);
    }
  }
  return Array.from(names);
}

function eventNameKey(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function salesTotalForRow(row) {
  return (Number(row?.pos_total) || 0) + (Number(row?.ticketmelon_total) || 0);
}

function average(numbers) {
  const valid = numbers.map(Number).filter((n) => Number.isFinite(n));
  if (!valid.length) return 0;
  return valid.reduce((sum, n) => sum + n, 0) / valid.length;
}

function median(numbers) {
  const valid = numbers.map(Number).filter((n) => Number.isFinite(n)).sort((a, b) => a - b);
  if (!valid.length) return 0;
  const mid = Math.floor(valid.length / 2);
  return valid.length % 2 ? valid[mid] : (valid[mid - 1] + valid[mid]) / 2;
}

function buildSalesEventLinks(events, salesRows) {
  const eventsByDate = new Map();
  for (const event of events || []) {
    if (!event?.date) continue;
    const list = eventsByDate.get(event.date) || [];
    list.push(event);
    eventsByDate.set(event.date, list);
  }

  return (salesRows || []).map((row) => {
    const linkedEvents = eventsByDate.get(row.date) || [];
    const primaryEvent =
      linkedEvents.find((event) => eventNameKey(event.name) === eventNameKey(row.event_name)) ||
      linkedEvents[0] ||
      null;
    const djNameSet = new Set();
    for (const event of linkedEvents) {
      for (const name of eventDjNames(event)) djNameSet.add(name);
    }
    const djNames = djNameSet.size ? Array.from(djNameSet) : eventDjNames(primaryEvent);
    return {
      row,
      event: primaryEvent,
      linkedEvents,
      total: salesTotalForRow(row),
      pl: calcNightPL(row),
      djNames,
      eventKey: eventNameKey(primaryEvent?.name || row.event_name),
    };
  });
}

function buildEventNightInsights(events, salesRows) {
  const links = buildSalesEventLinks(events, salesRows);
  const historical = links.filter((link) => link.total > 0 || link.pl.incomeTotal > 0);
  const todayISO = isoFromDate(new Date());
  const salesByDate = new Map((salesRows || []).map((row) => [row.date, row]));
  const upcomingEvents = (events || [])
    .filter((event) => event?.date >= todayISO && !salesByDate.has(event.date))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 6);

  const forecasts = upcomingEvents.map((event) => {
    const eventKey = eventNameKey(event.name);
    const djNames = eventDjNames(event);
    const eventMatches = historical.filter((link) => link.eventKey && link.eventKey === eventKey && link.row.date < event.date);
    const djMatches = historical.filter((link) => link.row.date < event.date && link.djNames.some((name) => djNames.includes(name)));
    const dayMatches = historical.filter((link) => isoToDate(link.row.date).getDay() === isoToDate(event.date).getDay() && link.row.date < event.date);
    const basis = eventMatches.length ? eventMatches : djMatches.length ? djMatches.slice(0, 6) : dayMatches.slice(0, 6);
    const forecastSales = average(basis.map((link) => link.total));
    const forecastNett = average(basis.map((link) => link.pl.nett));
    return {
      event,
      djNames,
      eventMatches,
      djMatches,
      basis,
      forecastSales,
      forecastNett,
      confidence: eventMatches.length ? "High" : djMatches.length ? "Medium" : dayMatches.length ? "Low" : "None",
    };
  });

  const topHistorical = [...historical]
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);
  const djStats = new Map();
  for (const link of historical) {
    for (const name of link.djNames) {
      const stat = djStats.get(name) || { name, nights: 0, sales: 0, nett: 0 };
      stat.nights += 1;
      stat.sales += link.total;
      stat.nett += link.pl.nett;
      djStats.set(name, stat);
    }
  }
  const topDjs = Array.from(djStats.values())
    .map((stat) => ({ ...stat, avgSales: stat.sales / stat.nights, avgNett: stat.nett / stat.nights }))
    .sort((a, b) => b.avgSales - a.avgSales)
    .slice(0, 6);

  return { links, historical, forecasts, topHistorical, topDjs };
}

function PLBreakdownTable({ rows }) {
  const nights = rows.map((row) => ({ date: row.date, pl: calcNightPL(row) }));

  const plRows = [
    { section: "Income", label: "Bar Sales",            key: "barSales",        dim: false },
    { section: null,     label: "Service Charge (10%)", key: "serviceCharge",   dim: true  },
    { section: null,     label: "SST (8%)",             key: "sst",             dim: true  },
    { section: null,     label: "Online Ticket",        key: "onlineTicket",    dim: true  },
    { section: null,     label: "Walk-in Ticket",       key: "walkinTicket",    dim: true  },
    { section: null,     label: "Sponsorship",          key: "sponsorship",     dim: true  },
    { section: null,     label: "TOTAL",                key: "incomeTotal",     bold: true, isTotal: true },
    { section: "Cost",   label: "Bottle Cost (40%)",    key: "bottleCost",      dim: false },
    { section: null,     label: "Ambassador Comm.",     key: "ambassadorComm",  dim: true  },
    { section: null,     label: "Utilities",            key: "utilities",       dim: true  },
    { section: null,     label: "Man Power",            key: "manPower",        dim: true  },
    { section: null,     label: "Intl Artist Cost",     key: "intlArtist",      dim: true  },
    { section: null,     label: "Puspal",               key: "puspal",          dim: true  },
    { section: null,     label: "Hotel",                key: "hotel",           dim: true  },
    { section: null,     label: "Rider",                key: "rider",           dim: true  },
    { section: null,     label: "Local DJ",             key: "localDj",         dim: true  },
    { section: null,     label: "Bar Split",            key: "barSplit",        dim: true  },
    { section: null,     label: "Misc",                 key: "misc",            dim: true  },
    { section: null,     label: "TOTAL",                key: "costTotal",       bold: true, isTotal: true },
    { section: "ROI",    label: "Nett",                 key: "nett",            bold: true, isROI: true  },
    { section: null,     label: "ROI %",                key: "roiPct",          bold: false, isPct: true  },
  ];

  return (
    <div className="overflow-x-auto px-4 pb-4 pt-3">
      <table className="w-full min-w-[540px] text-xs">
        <thead>
          <tr className="border-b border-white/10">
            <th className="w-20 pb-2 text-left text-[9px] font-black uppercase tracking-wider text-purple-300/50">Section</th>
            <th className="pb-2 text-left text-[9px] font-black uppercase tracking-wider text-white/30">Item</th>
            {nights.map((n) => (
              <th key={n.date} className="pb-2 text-right text-[9px] font-black uppercase tracking-wider text-white/30">
                {salesFmtDate(n.date)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {plRows.map((r, i) => (
            <tr key={i} className={`border-b border-white/[0.04] ${r.isTotal ? "bg-white/[0.035]" : ""}`}>
              <td className="py-1.5 pr-2 text-[9px] font-black uppercase tracking-wider text-purple-300/50">{r.section || ""}</td>
              <td className={`py-1.5 pr-4 ${r.bold ? "font-black text-white/80" : "font-bold text-white/40"}`}>{r.label}</td>
              {nights.map((n) => {
                const raw = n.pl[r.key];
                const isNegROI = r.isROI && raw < 0;
                const isPosROI = r.isROI && raw >= 0;
                return (
                  <td
                    key={n.date}
                    className={`py-1.5 text-right font-bold tabular-nums ${
                      r.isROI
                        ? raw >= 0
                          ? "font-black text-emerald-300"
                          : "font-black text-red-300"
                        : r.isPct
                        ? raw >= 0
                          ? "text-emerald-300"
                          : "text-red-300"
                        : r.dim
                        ? "text-white/30"
                        : "text-white/65"
                    }`}
                  >
                    {r.isPct ? salesFmtPct(raw) : raw === 0 ? "—" : salesFmtRMFull(raw)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EditNightModal({ row, monthYear, onSave, onDelete, onClose }) {
  const isNew = !!row._new;
  const [form, setForm] = useState({
    date:                 row.date || "",
    event_name:           row.event_name || "",
    pax:                  row.pax || "",
    table_bookings:       row.table_bookings ?? 0,
    door_sales:           row.door_sales ?? 0,
    cover_charge:         row.cover_charge ?? 0,
    pos_total:            row.pos_total ?? 0,
    ticketmelon_total:    row.ticketmelon_total ?? 0,
    weekly_target:        row.weekly_target ?? 15000,
    week_number:          row.week_number ?? 1,
    utilities:            row.utilities ?? 1500,
    man_power:            row.man_power ?? 9500,
    local_dj:             row.local_dj ?? 2000,
    ambassador_commission: row.ambassador_commission ?? 0,
    intl_artist_cost:     row.intl_artist_cost ?? 0,
    puspal:               row.puspal ?? 0,
    hotel:                row.hotel ?? 0,
    rider:                row.rider ?? 0,
    bar_split:            row.bar_split ?? 0,
    misc:                 row.misc ?? 0,
    online_ticket:        row.online_ticket ?? 0,
    walkin_ticket:        row.walkin_ticket ?? 0,
    sponsorship:          row.sponsorship ?? 0,
    bottle_cost_override: row.bottle_cost_override != null ? row.bottle_cost_override : "",
  });
  const [saving, setSaving] = useState(false);

  const setField = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const setNum   = (k, v) => setForm((f) => ({ ...f, [k]: v === "" ? 0 : +v }));

  const preview = calcNightPL({
    ...form,
    pos_total:            +form.pos_total   || 0,
    ticketmelon_total:    +form.ticketmelon_total || 0,
    bottle_cost_override: form.bottle_cost_override !== "" ? +form.bottle_cost_override : null,
  });

  async function handleSave() {
    if (!form.date) return;
    setSaving(true);
    const payload = {
      ...form,
      bottle_cost_override: form.bottle_cost_override !== "" ? +form.bottle_cost_override : null,
      month_year: monthYear,
    };
    await onSave(payload);
    setSaving(false);
  }

  const inputCls = "w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-bold text-white placeholder-white/20 focus:border-purple-400/50 focus:outline-none";
  const labelCls = "mb-1 block text-[10px] font-black uppercase tracking-wider text-white/35";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 p-4 sm:items-center"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-[#0d0c17] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
          <div>
            <div className="text-sm font-black text-white">{isNew ? "Add Night" : "Edit Night"}</div>
            {!isNew && <div className="text-xs font-bold text-white/35">{row.event_name}</div>}
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white"><X className="h-4 w-4" /></button>
        </div>

        {/* Body */}
        <div className="max-h-[68vh] space-y-5 overflow-y-auto p-6">
          {/* Basics */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div>
              <label className={labelCls}>Date</label>
              <input type="date" value={form.date} onChange={(e) => setField("date", e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Week #</label>
              <input type="number" value={form.week_number} onChange={(e) => setNum("week_number", e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>PAX</label>
              <input type="text" value={form.pax} onChange={(e) => setField("pax", e.target.value)} className={inputCls} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Event Name</label>
            <input type="text" value={form.event_name} onChange={(e) => setField("event_name", e.target.value)} className={inputCls} />
          </div>

          {/* Sales */}
          <div>
            <div className="mb-2 text-[10px] font-black uppercase tracking-wider text-purple-300/60">Sales</div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {[
                ["Table Bookings",  "table_bookings"],
                ["Door Sales",      "door_sales"],
                ["Cover Charge",    "cover_charge"],
                ["POS Total",       "pos_total"],
                ["TicketMelon",     "ticketmelon_total"],
                ["Weekly Target",   "weekly_target"],
              ].map(([label, key]) => (
                <div key={key}>
                  <label className={labelCls}>{label}</label>
                  <input type="number" step="0.01" value={form[key]} onChange={(e) => setNum(key, e.target.value)} className={inputCls} />
                </div>
              ))}
            </div>
          </div>

          {/* Income extras */}
          <div>
            <div className="mb-2 text-[10px] font-black uppercase tracking-wider text-purple-300/60">Income Extras</div>
            <div className="grid grid-cols-3 gap-3">
              {[
                ["Online Ticket",  "online_ticket"],
                ["Walk-in Ticket", "walkin_ticket"],
                ["Sponsorship",    "sponsorship"],
              ].map(([label, key]) => (
                <div key={key}>
                  <label className={labelCls}>{label}</label>
                  <input type="number" step="0.01" value={form[key]} onChange={(e) => setNum(key, e.target.value)} className={inputCls} />
                </div>
              ))}
            </div>
          </div>

          {/* Costs */}
          <div>
            <div className="mb-2 text-[10px] font-black uppercase tracking-wider text-purple-300/60">Costs</div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div>
                <label className={labelCls}>Bottle Cost (blank = 40% auto)</label>
                <input
                  type="number" step="0.01"
                  value={form.bottle_cost_override}
                  onChange={(e) => setField("bottle_cost_override", e.target.value)}
                  placeholder="Auto (40%)"
                  className={inputCls}
                />
              </div>
              {[
                ["Utilities",            "utilities"],
                ["Man Power",            "man_power"],
                ["Local DJ",             "local_dj"],
                ["Ambassador Comm.",     "ambassador_commission"],
                ["Intl Artist Cost",     "intl_artist_cost"],
                ["Puspal",               "puspal"],
                ["Hotel",                "hotel"],
                ["Rider",                "rider"],
                ["Bar Split",            "bar_split"],
                ["Misc",                 "misc"],
              ].map(([label, key]) => (
                <div key={key}>
                  <label className={labelCls}>{label}</label>
                  <input type="number" step="0.01" value={form[key]} onChange={(e) => setNum(key, e.target.value)} className={inputCls} />
                </div>
              ))}
            </div>
          </div>

          {/* Live P&L preview */}
          <div className="rounded-xl border border-purple-400/15 bg-purple-400/5 p-4">
            <div className="mb-2.5 text-[10px] font-black uppercase tracking-wider text-purple-300/60">P&amp;L Preview</div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div>
                <div className="text-[9px] text-white/30">Income</div>
                <div className="font-black text-white">{salesFmtRMFull(preview.incomeTotal)}</div>
              </div>
              <div>
                <div className="text-[9px] text-white/30">Cost</div>
                <div className="font-black text-red-300">{salesFmtRMFull(preview.costTotal)}</div>
              </div>
              <div>
                <div className="text-[9px] text-white/30">Nett</div>
                <div className={`font-black ${preview.nett >= 0 ? "text-emerald-300" : "text-red-300"}`}>{salesFmtRMFull(preview.nett)}</div>
              </div>
              <div>
                <div className="text-[9px] text-white/30">ROI %</div>
                <div className={`font-black ${preview.roiPct >= 0 ? "text-emerald-300" : "text-red-300"}`}>{salesFmtPct(preview.roiPct)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-white/10 px-6 py-4">
          <div>
            {onDelete && (
              <button onClick={onDelete} className="text-xs font-black text-red-400 hover:text-red-300">
                Delete Night
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-black text-white/50 hover:text-white">
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !form.date}
              className="rounded-xl bg-purple-400 px-4 py-2 text-xs font-black text-black hover:bg-purple-300 disabled:opacity-50"
            >
              {saving ? "Saving…" : isNew ? "Add Night" : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function EventNightAnalytics({ insights }) {
  const forecastReady = insights.forecasts.filter((item) => item.confidence !== "None");
  const nextForecasts = forecastReady.length ? forecastReady : insights.forecasts;
  const linkedCount = insights.links.filter((link) => link.event).length;
  const [selectedEventId, setSelectedEventId] = useState("");
  const [compareMode, setCompareMode] = useState("auto");
  const [manualNightIds, setManualNightIds] = useState([]);
  const [compareQuery, setCompareQuery] = useState("");
  const [compareDjName, setCompareDjName] = useState("");
  const selectedForecast = nextForecasts.find((item) => item.event.id === selectedEventId) || nextForecasts[0] || null;

  useEffect(() => {
    if (!selectedForecast) return;
    setSelectedEventId((current) => (current && nextForecasts.some((item) => item.event.id === current) ? current : selectedForecast.event.id));
  }, [nextForecasts, selectedForecast]);

  useEffect(() => {
    setManualNightIds([]);
    setCompareQuery("");
    setCompareDjName("");
  }, [selectedEventId]);

  const comparisonOptions = useMemo(() => {
    if (!selectedForecast) return [];
    const eventKey = eventNameKey(selectedForecast.event.name);
    const targetDay = isoToDate(selectedForecast.event.date).getDay();
    return insights.historical
      .filter((link) => link.row.date < selectedForecast.event.date)
      .map((link) => {
        const sameEvent = link.eventKey && link.eventKey === eventKey;
        const sameDj = link.djNames.some((name) => selectedForecast.djNames.includes(name));
        const sameDay = isoToDate(link.row.date).getDay() === targetDay;
        const score = (sameEvent ? 4 : 0) + (sameDj ? 2 : 0) + (sameDay ? 1 : 0);
        const reason = sameEvent ? "Same event" : sameDj ? "Same DJ" : sameDay ? "Same weekday" : "Other";
        return { ...link, sameEvent, sameDj, sameDay, score, reason };
      })
      .sort((a, b) => b.score - a.score || b.row.date.localeCompare(a.row.date))
      .slice(0, 60);
  }, [insights.historical, selectedForecast]);

  const comparisonDjOptions = useMemo(() => {
    const set = new Set();
    for (const link of comparisonOptions) {
      for (const name of link.djNames || []) set.add(name);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [comparisonOptions]);

  const filteredComparisonOptions = useMemo(() => {
    const needle = compareQuery.trim().toLowerCase();
    return comparisonOptions.filter((link) => {
      if (compareDjName && !(link.djNames || []).includes(compareDjName)) return false;
      if (!needle) return true;
      const haystack = [
        link.row?.date,
        salesFmtDate(link.row?.date),
        link.event?.name,
        link.row?.event_name,
        (link.djNames || []).join(" "),
        link.reason,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(needle);
    });
  }, [compareDjName, compareQuery, comparisonOptions]);

  const activeComparison = useMemo(() => {
    if (!selectedForecast) return [];
    if (compareMode === "manual") return comparisonOptions.filter((link) => manualNightIds.includes(String(link.row.id)));
    if (compareMode === "same-event") return comparisonOptions.filter((link) => link.sameEvent);
    if (compareMode === "same-dj") return comparisonOptions.filter((link) => link.sameDj);
    if (compareMode === "same-weekday") return comparisonOptions.filter((link) => link.sameDay);
    return selectedForecast.basis;
  }, [compareMode, comparisonOptions, manualNightIds, selectedForecast]);

  const comparisonSales = average(activeComparison.map((link) => link.total));
  const comparisonNett = average(activeComparison.map((link) => link.pl.nett));
  const comparisonPax = average(activeComparison.map((link) => Number(String(link.row.pax || "").match(/\d+/)?.[0] || 0)));
  const toggleManualNight = (id) => {
    const key = String(id);
    setCompareMode("manual");
    setManualNightIds((current) => (current.includes(key) ? current.filter((item) => item !== key) : [...current, key]));
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-cyan-300/20 bg-cyan-400/[0.045]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-cyan-200" />
          <div>
            <div className="text-sm font-black text-white">Event Night Analytics</div>
            <div className="text-[10px] font-black uppercase tracking-wider text-white/35">
              {linkedCount} sales nights linked to booking dates
            </div>
          </div>
        </div>
        <div className="rounded-full border border-cyan-300/20 bg-black/20 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-cyan-100">
          Editable forecast basis
        </div>
      </div>

      <div className="grid gap-4 p-4 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-[10px] font-black uppercase tracking-widest text-cyan-100/65">Compare Forecast</div>
            {nextForecasts.length ? (
              <select
                value={selectedForecast?.event.id || ""}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="max-w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs font-black text-white outline-none focus:border-cyan-300/40"
              >
                {nextForecasts.map(({ event }) => (
                  <option key={event.id} value={event.id}>{salesFmtDate(event.date)} - {event.name}</option>
                ))}
              </select>
            ) : null}
          </div>

          {selectedForecast ? (
            <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[10px] font-black uppercase tracking-wider text-white/35">{dayLabelFromISO(selectedForecast.event.date)} · {selectedForecast.event.stage}</div>
                  <div className="mt-1 text-base font-black text-white">{selectedForecast.event.name}</div>
                  <div className="mt-1 text-xs font-bold text-white/45">{selectedForecast.djNames.slice(0, 5).join(" / ") || "Lineup pending"}</div>
                </div>
                <div className="grid min-w-[240px] grid-cols-3 gap-2">
                  <div className="rounded-xl border border-cyan-300/15 bg-cyan-400/10 px-3 py-2">
                    <div className="text-[9px] font-black uppercase tracking-wider text-cyan-100/50">Forecast Sales</div>
                    <div className="mt-1 text-sm font-black text-cyan-100">{comparisonSales ? salesFmtRMFull(comparisonSales) : "No basis"}</div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                    <div className="text-[9px] font-black uppercase tracking-wider text-white/30">Avg PAX</div>
                    <div className="mt-1 text-sm font-black text-white">{comparisonPax ? Math.round(comparisonPax).toLocaleString("en-MY") : "-"}</div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                    <div className="text-[9px] font-black uppercase tracking-wider text-white/30">Avg Nett</div>
                    <div className={`mt-1 text-sm font-black ${comparisonNett >= 0 ? "text-emerald-300" : "text-red-300"}`}>
                      {comparisonSales ? salesFmtRMFull(comparisonNett) : "-"}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {[
                  ["auto", "Auto"],
                  ["same-event", "Same Event"],
                  ["same-dj", "Same DJ"],
                  ["same-weekday", "Same Weekday"],
                  ["manual", "Manual"],
                ].map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setCompareMode(key)}
                    className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-wider transition ${
                      compareMode === key
                        ? "border-cyan-300/40 bg-cyan-400/20 text-cyan-100"
                        : "border-white/10 bg-white/5 text-white/35 hover:text-white"
                    }`}
                  >
                    {label}
                  </button>
                ))}
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white/35">
                  {activeComparison.length} night{activeComparison.length === 1 ? "" : "s"} selected
                </span>
              </div>

              <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_220px]">
                <div className="flex min-w-0 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white/40">
                  <Search className="h-4 w-4 shrink-0" />
                  <input
                    value={compareQuery}
                    onChange={(e) => setCompareQuery(e.target.value)}
                    placeholder="Search nights / DJs / dates..."
                    className="w-full bg-transparent text-xs font-bold text-white outline-none placeholder:text-white/25"
                  />
                </div>
                <select
                  value={compareDjName}
                  onChange={(e) => setCompareDjName(e.target.value)}
                  className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-xs font-black text-white outline-none focus:border-cyan-300/40"
                >
                  <option value="">All DJs</option>
                  {comparisonDjOptions.map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>

              <div className="mt-3 grid max-h-[360px] gap-2 overflow-y-auto pr-1">
                {filteredComparisonOptions.length ? filteredComparisonOptions.map((link) => {
                  const manualSelected = manualNightIds.includes(String(link.row.id));
                  const active = compareMode === "manual" ? manualSelected : activeComparison.some((item) => item.row.id === link.row.id);
                  return (
                    <button
                      key={link.row.id}
                      type="button"
                      onClick={() => toggleManualNight(link.row.id)}
                      className={`grid gap-2 rounded-xl border px-3 py-2 text-left transition sm:grid-cols-[1fr_auto] ${
                        active ? "border-cyan-300/35 bg-cyan-400/12" : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]"
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-xs font-black text-white">{salesFmtDate(link.row.date)}</span>
                          <span className="rounded-full border border-white/10 bg-black/20 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-white/35">{link.reason}</span>
                        </div>
                        <div className="mt-1 truncate text-xs font-bold text-white/75">{link.event?.name || link.row.event_name}</div>
                        <div className="mt-0.5 truncate text-[10px] font-bold text-white/35">{link.djNames.slice(0, 4).join(" / ") || "No DJ link"}</div>
                      </div>
                      <div className="flex items-center justify-between gap-4 text-right sm:block">
                        <div className="text-xs font-black text-cyan-100">{salesFmtRMFull(link.total)}</div>
                        <div className={`mt-0.5 text-[10px] font-black ${link.pl.nett >= 0 ? "text-emerald-300" : "text-red-300"}`}>{salesFmtRMFull(link.pl.nett)}</div>
                      </div>
                    </button>
                  );
                }) : (
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-5 text-center text-xs font-bold text-white/35">No previous nights available for this event yet.</div>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-white/10 bg-black/20 px-4 py-6 text-center text-sm font-bold text-white/35">
              Add upcoming booking dates and previous sales rows to unlock forecasts.
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <div className="mb-2 text-[10px] font-black uppercase tracking-widest text-cyan-100/65">Best Previous Event Nights</div>
            <div className="space-y-2">
              {insights.topHistorical.length ? insights.topHistorical.map((link) => (
                <div key={link.row.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                  <div className="min-w-0">
                    <div className="truncate text-xs font-black text-white">{link.event?.name || link.row.event_name}</div>
                    <div className="text-[10px] font-bold text-white/35">{salesFmtDate(link.row.date)} · {link.djNames.slice(0, 2).join(" / ") || "No DJ link"}</div>
                  </div>
                  <div className="text-right text-xs font-black text-white">{salesFmtRMFull(link.total)}</div>
                </div>
              )) : (
                <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-4 text-center text-xs font-bold text-white/35">No linked history yet.</div>
              )}
            </div>
          </div>

          <div>
            <div className="mb-2 text-[10px] font-black uppercase tracking-widest text-cyan-100/65">DJ Pull</div>
            <div className="grid grid-cols-2 gap-2">
              {insights.topDjs.length ? insights.topDjs.map((dj) => (
                <div key={dj.name} className="rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                  <div className="truncate text-xs font-black text-white">{dj.name}</div>
                  <div className="mt-1 text-[10px] font-bold text-white/35">{dj.nights} night{dj.nights === 1 ? "" : "s"}</div>
                  <div className="mt-1 text-xs font-black text-cyan-100">{salesFmtRMFull(dj.avgSales)}</div>
                </div>
              )) : (
                <div className="col-span-2 rounded-xl border border-white/10 bg-black/20 px-3 py-4 text-center text-xs font-bold text-white/35">Lineups need sales history.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SalesTrendChart({ rows, metric = "sales", chartType = "bar" }) {
  const points = useMemo(() => {
    const list = (rows || [])
      .slice()
      .sort((a, b) => String(a.date || "").localeCompare(String(b.date || "")))
      .map((row) => {
        const sales = salesTotalForRow(row);
        const nett = calcNightPL(row).nett;
        const value = metric === "nett" ? nett : sales;
        return { row, value, label: salesFmtDate(row.date) };
      });
    return list;
  }, [metric, rows]);

  const bounds = useMemo(() => {
    if (!points.length) return { min: 0, max: 0 };
    let min = points[0].value;
    let max = points[0].value;
    for (const p of points) {
      if (p.value < min) min = p.value;
      if (p.value > max) max = p.value;
    }
    if (min === max) {
      if (min === 0) return { min: -1, max: 1 };
      return { min: min * 0.85, max: max * 1.15 };
    }
    const pad = (max - min) * 0.08;
    return { min: min - pad, max: max + pad };
  }, [points]);

  const width = 920;
  const height = 220;
  const padLeft = 44;
  const padRight = 14;
  const padTop = 16;
  const padBottom = 32;
  const innerW = width - padLeft - padRight;
  const innerH = height - padTop - padBottom;
  const n = points.length;
  const stepX = n > 1 ? innerW / (n - 1) : innerW;
  const valueToY = (v) => {
    const t = (v - bounds.min) / (bounds.max - bounds.min || 1);
    return padTop + (1 - t) * innerH;
  };
  const zeroY = valueToY(0);

  const poly = useMemo(() => {
    if (!n) return "";
    return points
      .map((p, i) => {
        const x = padLeft + i * stepX;
        const y = valueToY(p.value);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");
  }, [n, padLeft, points, stepX]);

  const ticks = useMemo(() => {
    const count = 4;
    const out = [];
    for (let i = 0; i <= count; i += 1) {
      const t = i / count;
      const v = bounds.min + (bounds.max - bounds.min) * (1 - t);
      out.push({ y: padTop + innerH * t, value: v });
    }
    return out;
  }, [bounds.max, bounds.min, innerH, padTop]);

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/20">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
        <div>
          <div className="text-[10px] font-black uppercase tracking-widest text-white/35">Trend</div>
          <div className="mt-0.5 text-sm font-black text-white">{metric === "nett" ? "Net Profit" : "Gross Sales"}</div>
        </div>
        <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white/35">
          {chartType === "line" ? "Line" : "Bar"}
        </div>
      </div>
      <div className="px-2 py-2">
        {points.length ? (
          <svg viewBox={`0 0 ${width} ${height}`} className="h-[220px] w-full">
            {ticks.map((tick) => (
              <g key={tick.y}>
                <line x1={padLeft} x2={width - padRight} y1={tick.y} y2={tick.y} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
                <text x={padLeft - 10} y={tick.y + 4} textAnchor="end" fontSize="10" fill="rgba(255,255,255,0.35)" fontWeight="700">
                  {salesFmtRMFull(tick.value)}
                </text>
              </g>
            ))}
            <line x1={padLeft} x2={width - padRight} y1={zeroY} y2={zeroY} stroke="rgba(103,232,249,0.25)" strokeWidth="1" />
            {chartType === "bar" ? (
              <g>
                {points.map((p, i) => {
                  const x = padLeft + i * stepX;
                  const y = valueToY(p.value);
                  const barW = Math.max(8, innerW / Math.max(1, n) * 0.62);
                  const left = x - barW / 2;
                  const top = Math.min(y, zeroY);
                  const h = Math.max(1, Math.abs(zeroY - y));
                  const positive = p.value >= 0;
                  return (
                    <g key={p.row.id || p.row.date || i}>
                      <rect x={left} y={top} width={barW} height={h} rx="6" fill={positive ? "rgba(167,139,250,0.55)" : "rgba(248,113,113,0.55)"} />
                      {n <= 18 ? (
                        <text x={x} y={height - 12} textAnchor="middle" fontSize="10" fill="rgba(255,255,255,0.35)" fontWeight="800">
                          {p.label}
                        </text>
                      ) : null}
                    </g>
                  );
                })}
              </g>
            ) : (
              <g>
                <polyline points={poly} fill="none" stroke="rgba(167,139,250,0.9)" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
                {points.map((p, i) => {
                  const x = padLeft + i * stepX;
                  const y = valueToY(p.value);
                  return <circle key={p.row.id || p.row.date || i} cx={x} cy={y} r="4.2" fill="rgba(103,232,249,0.9)" />;
                })}
                {n <= 18 ? (
                  <g>
                    {points.map((p, i) => {
                      const x = padLeft + i * stepX;
                      return (
                        <text key={p.row.id || p.row.date || i} x={x} y={height - 12} textAnchor="middle" fontSize="10" fill="rgba(255,255,255,0.35)" fontWeight="800">
                          {p.label}
                        </text>
                      );
                    })}
                  </g>
                ) : null}
              </g>
            )}
          </svg>
        ) : (
          <div className="px-4 py-10 text-center text-sm font-bold text-white/35">No data to chart for this month yet.</div>
        )}
      </div>
    </div>
  );
}

function salesMonthKeyFromISO(dateStr) {
  if (!dateStr) return "";
  const d = isoToDate(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function salesMonthLabelFromKey(key) {
  const [yy, mm] = String(key || "").split("-");
  const year = Number(yy);
  const monthIndex = Number(mm) - 1;
  if (!Number.isFinite(year) || !Number.isFinite(monthIndex)) return String(key || "");
  return new Date(year, monthIndex, 1).toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function salesNightLabelFromISO(dateStr) {
  if (!dateStr) return "";
  return isoToDate(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" });
}

function SalesSeriesChart({ points, metricLabel, chartType }) {
  const width = 920;
  const height = 240;
  const padLeft = 56;
  const padRight = 14;
  const padTop = 16;
  const padBottom = 36;
  const innerW = width - padLeft - padRight;
  const innerH = height - padTop - padBottom;
  const svgRef = React.useRef(null);
  const [hoverState, setHoverState] = useState(null);
  const [pinnedIndex, setPinnedIndex] = useState(null);

  const values = useMemo(() => (points || []).map((p) => Number(p.value) || 0), [points]);
  const bounds = useMemo(() => {
    if (!values.length) return { min: 0, max: 0 };
    let min = values[0];
    let max = values[0];
    for (const v of values) {
      if (v < min) min = v;
      if (v > max) max = v;
    }
    if (min === max) {
      if (min === 0) return { min: -1, max: 1 };
      return { min: min * 0.85, max: max * 1.15 };
    }
    const pad = (max - min) * 0.08;
    return { min: min - pad, max: max + pad };
  }, [values]);

  const n = points.length;
  const stepX = n > 1 ? innerW / (n - 1) : innerW;
  const valueToY = (v) => {
    const t = (v - bounds.min) / (bounds.max - bounds.min || 1);
    return padTop + (1 - t) * innerH;
  };
  const zeroY = valueToY(0);
  const hoverIndex = pinnedIndex != null ? pinnedIndex : hoverState?.index ?? null;
  const activePoint = hoverIndex != null && points[hoverIndex] ? points[hoverIndex] : null;
  const activeX = hoverIndex != null ? padLeft + hoverIndex * stepX : null;
  const activeY = activePoint ? valueToY(activePoint.value) : null;

  const poly = useMemo(() => {
    if (!n) return "";
    return points
      .map((p, i) => {
        const x = padLeft + i * stepX;
        const y = valueToY(p.value);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");
  }, [n, padLeft, points, stepX]);

  const ticks = useMemo(() => {
    const count = 4;
    const out = [];
    for (let i = 0; i <= count; i += 1) {
      const t = i / count;
      const v = bounds.min + (bounds.max - bounds.min) * (1 - t);
      out.push({ y: padTop + innerH * t, value: v });
    }
    return out;
  }, [bounds.max, bounds.min, innerH, padTop]);

  const summary = useMemo(() => {
    if (!points.length) return { total: 0, max: null, min: null, last: null, prev: null };
    let max = points[0];
    let min = points[0];
    let total = 0;
    for (const p of points) {
      total += Number(p.value) || 0;
      if ((Number(p.value) || 0) > (Number(max.value) || 0)) max = p;
      if ((Number(p.value) || 0) < (Number(min.value) || 0)) min = p;
    }
    const last = points[points.length - 1];
    const prev = points.length > 1 ? points[points.length - 2] : null;
    return { total, max, min, last, prev };
  }, [points]);
  const lastDelta = summary.prev ? (Number(summary.last.value) || 0) - (Number(summary.prev.value) || 0) : 0;
  const lastDeltaPct = summary.prev && (Number(summary.prev.value) || 0) !== 0 ? lastDelta / (Number(summary.prev.value) || 1) : null;

  const handleMouseMove = useCallback((event) => {
    if (!svgRef.current || !points.length) return;
    const rect = svgRef.current.getBoundingClientRect();
    const relX = event.clientX - rect.left;
    const relY = event.clientY - rect.top;
    const xInViewBox = (relX / rect.width) * width;
    const raw = (xInViewBox - padLeft) / (stepX || 1);
    const idx = Math.max(0, Math.min(points.length - 1, Math.round(raw)));
    setHoverState({ index: idx, relX, relY, rectW: rect.width, rectH: rect.height });
  }, [padLeft, points, stepX, width]);

  const handleMouseLeave = useCallback(() => {
    if (pinnedIndex != null) return;
    setHoverState(null);
  }, [pinnedIndex]);

  const handleClick = useCallback(() => {
    if (!points.length) return;
    const idx = hoverState?.index;
    if (idx == null) return;
    setPinnedIndex((current) => (current === idx ? null : idx));
  }, [hoverState?.index, points.length]);

  const tooltip = useMemo(() => {
    if (!activePoint || !hoverState) return null;
    const idx = hoverIndex;
    const prev = idx > 0 ? points[idx - 1] : null;
    const delta = prev ? (Number(activePoint.value) || 0) - (Number(prev.value) || 0) : null;
    const pct = prev && (Number(prev.value) || 0) !== 0 ? delta / (Number(prev.value) || 1) : null;
    const clampedX = Math.min(Math.max(hoverState.relX, 90), hoverState.rectW - 90);
    const clampedY = Math.min(Math.max(hoverState.relY, 60), hoverState.rectH - 16);
    return { idx, prev, delta, pct, clampedX, clampedY };
  }, [activePoint, hoverIndex, hoverState, points]);

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/20">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
        <div>
          <div className="text-[10px] font-black uppercase tracking-widest text-white/35">Trend</div>
          <div className="mt-0.5 text-sm font-black text-white">{metricLabel}</div>
        </div>
        <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white/35">
          {chartType === "line" ? "Line" : "Bar"}
        </div>
      </div>
      <div className="px-4 pt-3">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            <div className="text-[9px] font-black uppercase tracking-wider text-white/30">Total</div>
            <div className="mt-1 text-sm font-black text-white">{points.length ? salesFmtRMFull(summary.total) : "—"}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            <div className="text-[9px] font-black uppercase tracking-wider text-white/30">Best</div>
            <div className="mt-1 text-sm font-black text-white">{summary.max ? salesFmtRMFull(summary.max.value) : "—"}</div>
            <div className="mt-1 text-[10px] font-bold text-white/35">{summary.max?.label || ""}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            <div className="text-[9px] font-black uppercase tracking-wider text-white/30">Worst</div>
            <div className="mt-1 text-sm font-black text-white">{summary.min ? salesFmtRMFull(summary.min.value) : "—"}</div>
            <div className="mt-1 text-[10px] font-bold text-white/35">{summary.min?.label || ""}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
            <div className="text-[9px] font-black uppercase tracking-wider text-white/30">Last Δ</div>
            <div className={`mt-1 text-sm font-black ${lastDelta >= 0 ? "text-emerald-300" : "text-red-300"}`}>
              {summary.prev ? `${lastDelta >= 0 ? "+" : ""}${salesFmtRMFull(lastDelta)}` : "—"}
            </div>
            <div className="mt-1 text-[10px] font-bold text-white/35">
              {summary.prev && lastDeltaPct != null ? `${(lastDeltaPct * 100).toFixed(1)}% vs prev` : ""}
            </div>
          </div>
        </div>
      </div>

      <div className="relative px-2 py-2">
        {points.length ? (
          <svg
            ref={svgRef}
            viewBox={`0 0 ${width} ${height}`}
            className="h-[240px] w-full"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onClick={handleClick}
          >
            {ticks.map((tick) => (
              <g key={tick.y}>
                <line x1={padLeft} x2={width - padRight} y1={tick.y} y2={tick.y} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
                <text x={padLeft - 10} y={tick.y + 4} textAnchor="end" fontSize="10" fill="rgba(255,255,255,0.35)" fontWeight="700">
                  {salesFmtRMFull(tick.value)}
                </text>
              </g>
            ))}
            <line x1={padLeft} x2={width - padRight} y1={zeroY} y2={zeroY} stroke="rgba(103,232,249,0.25)" strokeWidth="1" />
            {activeX != null ? (
              <line x1={activeX} x2={activeX} y1={padTop} y2={height - padBottom} stroke="rgba(103,232,249,0.22)" strokeWidth="1" />
            ) : null}
            {chartType === "bar" ? (
              <g>
                {points.map((p, i) => {
                  const x = padLeft + i * stepX;
                  const y = valueToY(p.value);
                  const barW = Math.max(8, innerW / Math.max(1, n) * 0.62);
                  const left = x - barW / 2;
                  const top = Math.min(y, zeroY);
                  const h = Math.max(1, Math.abs(zeroY - y));
                  const positive = p.value >= 0;
                  return (
                    <g key={p.key || i}>
                      <rect x={left} y={top} width={barW} height={h} rx="6" fill={positive ? "rgba(167,139,250,0.55)" : "rgba(248,113,113,0.55)"} />
                      {n <= 18 ? (
                        <text x={x} y={height - 12} textAnchor="middle" fontSize="10" fill="rgba(255,255,255,0.35)" fontWeight="800">
                          {p.label}
                        </text>
                      ) : null}
                    </g>
                  );
                })}
                <rect x={padLeft} y={padTop} width={innerW} height={innerH} fill="transparent" />
              </g>
            ) : (
              <g>
                <polyline points={poly} fill="none" stroke="rgba(167,139,250,0.9)" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
                {points.map((p, i) => {
                  const x = padLeft + i * stepX;
                  const y = valueToY(p.value);
                  const active = hoverIndex === i;
                  return (
                    <circle
                      key={p.key || i}
                      cx={x}
                      cy={y}
                      r={active ? "6" : "4.2"}
                      fill={active ? "rgba(103,232,249,1)" : "rgba(103,232,249,0.9)"}
                    />
                  );
                })}
                {n <= 18 ? (
                  <g>
                    {points.map((p, i) => {
                      const x = padLeft + i * stepX;
                      return (
                        <text key={p.key || i} x={x} y={height - 12} textAnchor="middle" fontSize="10" fill="rgba(255,255,255,0.35)" fontWeight="800">
                          {p.label}
                        </text>
                      );
                    })}
                  </g>
                ) : null}
                <rect x={padLeft} y={padTop} width={innerW} height={innerH} fill="transparent" />
              </g>
            )}
          </svg>
        ) : (
          <div className="px-4 py-10 text-center text-sm font-bold text-white/35">No data to chart yet.</div>
        )}
        {tooltip && activePoint ? (
          <div
            className="pointer-events-none absolute z-10 w-[240px] -translate-x-1/2 -translate-y-[115%] rounded-2xl border border-white/10 bg-black/90 px-3 py-2.5 text-white shadow-2xl"
            style={{ left: tooltip.clampedX, top: tooltip.clampedY }}
          >
            <div className="text-[10px] font-black uppercase tracking-wider text-white/40">{activePoint.label}</div>
            <div className="mt-1 flex items-baseline justify-between gap-3">
              <div className="text-sm font-black text-white">{salesFmtRMFull(activePoint.value)}</div>
              {tooltip.delta != null ? (
                <div className={`text-xs font-black ${tooltip.delta >= 0 ? "text-emerald-300" : "text-red-300"}`}>
                  {tooltip.delta >= 0 ? "+" : ""}{salesFmtRMFull(tooltip.delta)}
                </div>
              ) : (
                <div className="text-xs font-black text-white/30">—</div>
              )}
            </div>
            {tooltip.pct != null ? (
              <div className="mt-1 text-[10px] font-bold text-white/35">{(tooltip.pct * 100).toFixed(1)}% vs prev</div>
            ) : (
              <div className="mt-1 text-[10px] font-bold text-white/35">Click to pin</div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function salesPaxNumber(value) {
  const raw = String(value || "");
  const match = raw.match(/\d+/);
  return match ? Number(match[0]) : 0;
}

function salesWeekdayIndex(dateStr) {
  if (!dateStr) return null;
  return isoToDate(dateStr).getDay();
}

function salesWeekdayShort(dateStr) {
  if (!dateStr) return "";
  return isoToDate(dateStr).toLocaleDateString("en-US", { weekday: "short" });
}

function intersectCount(listA, listB) {
  if (!Array.isArray(listA) || !Array.isArray(listB) || !listA.length || !listB.length) return 0;
  const setB = new Set(listB);
  let count = 0;
  for (const item of listA) if (setB.has(item)) count += 1;
  return count;
}

function SalesComparisonWorkbench({ events = [], salesRows = [], onOpenEvent, onOpenDj }) {
  const [subTab, setSubTab] = useState("nights");
  const links = useMemo(() => buildSalesEventLinks(events, salesRows), [events, salesRows]);
  const nights = useMemo(() => {
    return links
      .filter((link) => link?.row?.id && link?.row?.date)
      .map((link) => {
        const row = link.row;
        const date = row.date;
        const eventLabel = String(link.event?.name || row.event_name || "").trim();
        const eventKey = eventNameKey(eventLabel);
        const weekday = salesWeekdayIndex(date);
        return {
          id: String(row.id),
          row,
          date,
          weekday,
          weekdayLabel: salesWeekdayShort(date),
          eventLabel,
          eventKey,
          djNames: Array.isArray(link.djNames) ? link.djNames : [],
          linkedEvents: Array.isArray(link.linkedEvents) ? link.linkedEvents : [],
          primaryEvent: link.event || null,
          total: Number(link.total) || 0,
          nett: Number(link.pl?.nett) || 0,
          paxNumber: salesPaxNumber(row.pax),
        };
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [links]);

  const [targetNightId, setTargetNightId] = useState("");
  useEffect(() => {
    if (!nights.length) return;
    if (targetNightId && nights.some((night) => night.id === targetNightId)) return;
    setTargetNightId(nights[0].id);
  }, [nights, targetNightId]);

  const targetNight = useMemo(() => nights.find((night) => night.id === targetNightId) || null, [nights, targetNightId]);

  const eventDatalist = useMemo(() => {
    const map = new Map();
    for (const night of nights) {
      if (!night.eventKey) continue;
      if (!map.has(night.eventKey)) map.set(night.eventKey, night.eventLabel || night.eventKey);
    }
    const entries = Array.from(map.entries()).map(([key, label]) => ({ key, label }));
    entries.sort((a, b) => a.label.localeCompare(b.label));
    return entries;
  }, [nights]);

  const djOptions = useMemo(() => {
    const set = new Set();
    for (const night of nights) for (const dj of night.djNames || []) set.add(dj);
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [nights]);

  const [basisMode, setBasisMode] = useState("auto");
  const [selectedNightIds, setSelectedNightIds] = useState([]);

  const [query, setQuery] = useState("");
  const [djFilter, setDjFilter] = useState("");
  const [eventFilter, setEventFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [minSales, setMinSales] = useState("");
  const [maxSales, setMaxSales] = useState("");
  const [onlyLinked, setOnlyLinked] = useState(false);
  const [includeZero, setIncludeZero] = useState(false);
  const [weekdayFilter, setWeekdayFilter] = useState([]);

  const toggleWeekday = useCallback((dayIndex) => {
    setWeekdayFilter((current) => (current.includes(dayIndex) ? current.filter((d) => d !== dayIndex) : [...current, dayIndex]));
  }, []);

  const filteredNights = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const eventNeedleKey = eventNameKey(eventFilter);
    const startISO = startDate ? String(startDate) : "";
    const endISO = endDate ? String(endDate) : "";
    const min = minSales === "" ? null : Number(minSales);
    const max = maxSales === "" ? null : Number(maxSales);

    return nights.filter((night) => {
      if (!includeZero && night.total <= 0) return false;
      if (onlyLinked && !night.linkedEvents.length) return false;
      if (djFilter && !(night.djNames || []).includes(djFilter)) return false;
      if (weekdayFilter.length && (night.weekday == null || !weekdayFilter.includes(night.weekday))) return false;
      if (startISO && night.date < startISO) return false;
      if (endISO && night.date > endISO) return false;
      if (min != null && night.total < min) return false;
      if (max != null && night.total > max) return false;
      if (eventNeedleKey) {
        if (!night.eventKey.includes(eventNeedleKey) && !String(night.eventLabel || "").toLowerCase().includes(eventFilter.trim().toLowerCase())) return false;
      }
      if (!needle) return true;
      const haystack = [
        night.date,
        salesFmtDate(night.date),
        night.eventLabel,
        night.eventKey,
        (night.djNames || []).join(" "),
        night.id,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(needle);
    });
  }, [djFilter, endDate, eventFilter, includeZero, maxSales, minSales, nights, onlyLinked, query, startDate, weekdayFilter]);

  useEffect(() => {
    setSelectedNightIds((current) => current.filter((id) => nights.some((night) => night.id === id)));
  }, [nights]);

  const selectedSet = useMemo(() => new Set(selectedNightIds), [selectedNightIds]);

  const [autoSameEvent, setAutoSameEvent] = useState(true);
  const [autoShareDj, setAutoShareDj] = useState(true);
  const [autoSameWeekday, setAutoSameWeekday] = useState(false);
  const [autoScope, setAutoScope] = useState("before");
  const [autoLimit, setAutoLimit] = useState(12);

  const autoBasis = useMemo(() => {
    if (!targetNight) return [];
    const targetDjNames = targetNight.djNames || [];
    const candidates = filteredNights
      .filter((night) => night.id !== targetNight.id)
      .filter((night) => (autoScope === "before" ? night.date < targetNight.date : true));
    return candidates
      .map((night) => {
        const sameEvent = autoSameEvent && night.eventKey && targetNight.eventKey && night.eventKey === targetNight.eventKey;
        const sharedDj = autoShareDj ? intersectCount(night.djNames, targetDjNames) : 0;
        const shareDj = sharedDj > 0;
        const sameWeekday = autoSameWeekday && night.weekday != null && targetNight.weekday != null && night.weekday === targetNight.weekday;
        const score = (sameEvent ? 4 : 0) + (shareDj ? 2 : 0) + (sameWeekday ? 1 : 0) + Math.min(3, sharedDj) * 0.25;
        const reason = sameEvent ? "Same event" : shareDj ? "Shared DJ" : sameWeekday ? "Same weekday" : "Other";
        return { night, score, reason, sharedDj };
      })
      .sort((a, b) => b.score - a.score || b.night.date.localeCompare(a.night.date))
      .slice(0, Math.max(1, Math.min(60, Number(autoLimit) || 12)));
  }, [autoLimit, autoSameEvent, autoSameWeekday, autoScope, autoShareDj, filteredNights, targetNight]);

  const activeBasis = useMemo(() => {
    if (!targetNight) return [];
    if (basisMode === "manual") return nights.filter((night) => selectedSet.has(night.id) && night.id !== targetNight.id);
    return autoBasis.map((item) => item.night);
  }, [autoBasis, basisMode, nights, selectedSet, targetNight]);

  const activeBasisStats = useMemo(() => {
    const sales = activeBasis.map((night) => night.total);
    const nett = activeBasis.map((night) => night.nett);
    const pax = activeBasis.map((night) => night.paxNumber);
    return {
      nights: activeBasis.length,
      avgSales: average(sales),
      medianSales: median(sales),
      avgNett: average(nett),
      avgPax: average(pax),
      bestSales: sales.length ? Math.max(...sales) : 0,
      worstSales: sales.length ? Math.min(...sales) : 0,
    };
  }, [activeBasis]);

  const autoBasisIds = useMemo(() => new Set(autoBasis.map((item) => item.night.id)), [autoBasis]);

  const toggleNight = useCallback((nightId) => {
    const key = String(nightId);
    setBasisMode("manual");
    setSelectedNightIds((current) => (current.includes(key) ? current.filter((id) => id !== key) : [...current, key]));
  }, []);

  const clearSelection = useCallback(() => setSelectedNightIds([]), []);

  const addAllFiltered = useCallback(() => {
    setBasisMode("manual");
    setSelectedNightIds((current) => {
      const set = new Set(current);
      for (const night of filteredNights) {
        if (targetNight && night.id === targetNight.id) continue;
        set.add(night.id);
        if (set.size >= 60) break;
      }
      return Array.from(set);
    });
  }, [filteredNights, targetNight]);

  const [djCompareQuery, setDjCompareQuery] = useState("");
  const [djComparePicked, setDjComparePicked] = useState([]);
  const djPickedSet = useMemo(() => new Set(djComparePicked), [djComparePicked]);

  const filteredDjOptions = useMemo(() => {
    const needle = djCompareQuery.trim().toLowerCase();
    if (!needle) return djOptions;
    return djOptions.filter((name) => name.toLowerCase().includes(needle));
  }, [djCompareQuery, djOptions]);

  const toggleDjPick = useCallback((name) => {
    setDjComparePicked((current) => (current.includes(name) ? current.filter((n) => n !== name) : [...current, name].slice(0, 8)));
  }, []);

  const poolForDjStats = useMemo(() => filteredNights, [filteredNights]);

  const djStats = useMemo(() => {
    const list = [];
    const names = djComparePicked.length ? djComparePicked : [];
    for (const name of names) {
      const relevant = poolForDjStats.filter((night) => (night.djNames || []).includes(name));
      const sales = relevant.map((n) => n.total);
      const nett = relevant.map((n) => n.nett);
      list.push({
        name,
        nights: relevant.length,
        avgSales: average(sales),
        medianSales: median(sales),
        avgNett: average(nett),
        bestSales: sales.length ? Math.max(...sales) : 0,
      });
    }
    return list.sort((a, b) => b.avgSales - a.avgSales);
  }, [djComparePicked, poolForDjStats]);

  const topDjInPool = useMemo(() => {
    const map = new Map();
    for (const night of poolForDjStats) {
      for (const name of night.djNames || []) {
        const stat = map.get(name) || { name, nights: 0, sales: 0, nett: 0 };
        stat.nights += 1;
        stat.sales += night.total;
        stat.nett += night.nett;
        map.set(name, stat);
      }
    }
    return Array.from(map.values())
      .map((s) => ({ ...s, avgSales: s.nights ? s.sales / s.nights : 0, avgNett: s.nights ? s.nett / s.nights : 0 }))
      .sort((a, b) => b.avgSales - a.avgSales)
      .slice(0, 10);
  }, [poolForDjStats]);

  const maxDjAvgSales = useMemo(() => Math.max(1, ...djStats.map((d) => d.avgSales)), [djStats]);

  const inputCls = "h-10 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-[11px] font-black text-white/70 outline-none hover:bg-white/10 focus:border-cyan-300/40";
  const pillCls = (active) =>
    `rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-wider transition ${
      active ? "border-cyan-300/40 bg-cyan-400/20 text-cyan-100" : "border-white/10 bg-white/5 text-white/35 hover:text-white"
    }`;

  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
        <div className="min-w-0">
          <div className="text-[10px] font-black uppercase tracking-widest text-white/35">Sales Comparison</div>
          <div className="mt-0.5 truncate text-sm font-black text-white">Workbench</div>
        </div>
        <div className="flex gap-1">
          {[["nights", "Night Compare"], ["djs", "DJ Compare"]].map(([key, label]) => (
            <button key={key} type="button" onClick={() => setSubTab(key)} className={pillCls(subTab === key)}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {subTab === "nights" ? (
        <div className="grid gap-4 p-4 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="space-y-3">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
              <div className="grid gap-2 sm:grid-cols-[1fr_190px]">
                <select value={targetNightId} onChange={(e) => setTargetNightId(e.target.value)} className={inputCls}>
                  {nights.map((night) => (
                    <option key={night.id} value={night.id}>
                      {salesFmtDate(night.date)} · {night.eventLabel || "Untitled"} · {salesFmtRMFull(night.total)}
                    </option>
                  ))}
                </select>
                <div className="flex gap-1">
                  <button type="button" onClick={() => setBasisMode("auto")} className={pillCls(basisMode === "auto")}>Auto</button>
                  <button type="button" onClick={() => setBasisMode("manual")} className={pillCls(basisMode === "manual")}>Manual</button>
                </div>
              </div>

              {targetNight ? (
                <div className="mt-3 grid gap-2 sm:grid-cols-4">
                  <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                    <div className="text-[9px] font-black uppercase tracking-wider text-white/30">Target</div>
                    <div className="mt-1 truncate text-xs font-black text-white">{targetNight.weekdayLabel} · {targetNight.eventLabel}</div>
                    <div className="mt-1 text-[10px] font-bold text-white/35">{(targetNight.djNames || []).slice(0, 3).join(" / ") || "No DJ link"}</div>
                  </div>
                  <div className="rounded-xl border border-cyan-300/15 bg-cyan-400/10 px-3 py-2">
                    <div className="text-[9px] font-black uppercase tracking-wider text-cyan-100/50">Target Sales</div>
                    <div className="mt-1 text-sm font-black text-cyan-100">{salesFmtRMFull(targetNight.total)}</div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                    <div className="text-[9px] font-black uppercase tracking-wider text-white/30">Target Nett</div>
                    <div className={`mt-1 text-sm font-black ${targetNight.nett >= 0 ? "text-emerald-300" : "text-red-300"}`}>{salesFmtRMFull(targetNight.nett)}</div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2">
                    <div className="text-[9px] font-black uppercase tracking-wider text-white/30">Target PAX</div>
                    <div className="mt-1 text-sm font-black text-white">{targetNight.paxNumber ? targetNight.paxNumber.toLocaleString("en-MY") : "—"}</div>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white/40">
                  <Search className="h-4 w-4 shrink-0" />
                  <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search nights / events / DJs..." className="w-full bg-transparent text-xs font-bold text-white outline-none placeholder:text-white/25" />
                </div>
                <select value={djFilter} onChange={(e) => setDjFilter(e.target.value)} className={inputCls}>
                  <option value="">All DJs</option>
                  {djOptions.map((name) => <option key={name} value={name}>{name}</option>)}
                </select>
                <div className="sm:col-span-2">
                  <input value={eventFilter} onChange={(e) => setEventFilter(e.target.value)} list="sales-event-filter" placeholder="Filter by event (type to search)..." className={inputCls} />
                  <datalist id="sales-event-filter">
                    {eventDatalist.map((item) => <option key={item.key} value={item.label} />)}
                  </datalist>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputCls} />
                  <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={inputCls} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input value={minSales} onChange={(e) => setMinSales(e.target.value)} inputMode="numeric" placeholder="Min sales" className={inputCls} />
                  <input value={maxSales} onChange={(e) => setMaxSales(e.target.value)} inputMode="numeric" placeholder="Max sales" className={inputCls} />
                </div>
              </div>

              <div className="mt-2 flex flex-wrap gap-1.5">
                {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((label, idx) => (
                  <button key={label} type="button" onClick={() => toggleWeekday(idx)} className={pillCls(weekdayFilter.includes(idx))}>
                    {label}
                  </button>
                ))}
                <button type="button" onClick={() => setOnlyLinked((v) => !v)} className={pillCls(onlyLinked)}>
                  Linked only
                </button>
                <button type="button" onClick={() => setIncludeZero((v) => !v)} className={pillCls(includeZero)}>
                  Include 0
                </button>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white/35">
                  {filteredNights.length} nights
                </span>
              </div>
            </div>

            {basisMode === "auto" ? (
              <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <button type="button" onClick={() => setAutoSameEvent((v) => !v)} className={pillCls(autoSameEvent)}>Same event</button>
                  <button type="button" onClick={() => setAutoShareDj((v) => !v)} className={pillCls(autoShareDj)}>Shared DJ</button>
                  <button type="button" onClick={() => setAutoSameWeekday((v) => !v)} className={pillCls(autoSameWeekday)}>Same weekday</button>
                  <select value={autoScope} onChange={(e) => setAutoScope(e.target.value)} className={inputCls}>
                    <option value="before">Before target</option>
                    <option value="all">Any date</option>
                  </select>
                  <input value={autoLimit} onChange={(e) => setAutoLimit(e.target.value)} inputMode="numeric" className={inputCls} />
                </div>
                <div className="mt-2 text-[10px] font-bold text-white/35">
                  Auto basis selects top matches from your filtered pool.
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <button type="button" onClick={addAllFiltered} className={pillCls(false)}>Add filtered</button>
                  <button type="button" onClick={clearSelection} className={pillCls(false)}>Clear</button>
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white/35">
                    {selectedNightIds.length} selected
                  </span>
                </div>
                <div className="mt-2 text-[10px] font-bold text-white/35">
                  Tap any night in the list to add/remove it.
                </div>
              </div>
            )}

            <div className="max-h-[520px] overflow-auto rounded-2xl border border-white/10 bg-black/20">
              <div className="border-b border-white/10 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-white/35">
                Night Pool
              </div>
              <div className="grid gap-2 p-3">
                {(filteredNights || []).slice(0, 120).map((night) => {
                  const isTarget = targetNight && night.id === targetNight.id;
                  const active = basisMode === "manual" ? selectedSet.has(night.id) : autoBasisIds.has(night.id);
                  const canSelect = !isTarget;
                  const clickable = basisMode === "manual" && canSelect;
                  return (
                    <button
                      key={night.id}
                      type="button"
                      onClick={() => clickable && toggleNight(night.id)}
                      className={`grid gap-2 rounded-xl border px-3 py-2 text-left transition sm:grid-cols-[1fr_auto] ${
                        isTarget
                          ? "border-purple-300/35 bg-purple-400/12"
                          : active
                          ? "border-cyan-300/35 bg-cyan-400/12"
                          : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]"
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-black text-white">{salesFmtDate(night.date)} · {night.weekdayLabel}</span>
                          {night.linkedEvents.length ? (
                            <span className="rounded-full border border-white/10 bg-black/20 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-white/35">
                              Linked
                            </span>
                          ) : null}
                          {isTarget ? (
                            <span className="rounded-full border border-purple-300/25 bg-purple-400/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-purple-100">
                              Target
                            </span>
                          ) : null}
                        </div>
                        <div className="mt-1 truncate text-xs font-bold text-white/75">{night.eventLabel || "Untitled"}</div>
                        <div className="mt-0.5 truncate text-[10px] font-bold text-white/35">{(night.djNames || []).slice(0, 4).join(" / ") || "No DJ link"}</div>
                      </div>
                      <div className="flex items-center justify-between gap-3 text-right sm:block">
                        <div className="text-xs font-black text-cyan-100">{salesFmtRMFull(night.total)}</div>
                        <div className={`mt-0.5 text-[10px] font-black ${night.nett >= 0 ? "text-emerald-300" : "text-red-300"}`}>{salesFmtRMFull(night.nett)}</div>
                        <div className="mt-1 flex justify-end gap-1">
                          {night.primaryEvent ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                typeof onOpenEvent === "function" && onOpenEvent(night.primaryEvent);
                              }}
                              className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[9px] font-black text-white/40 hover:text-white"
                            >
                              Event
                            </button>
                          ) : null}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="grid gap-2 sm:grid-cols-4">
              <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                <div className="text-[9px] font-black uppercase tracking-wider text-white/30">Basis Nights</div>
                <div className="mt-1 text-lg font-black text-white">{activeBasisStats.nights}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                <div className="text-[9px] font-black uppercase tracking-wider text-white/30">Avg Sales</div>
                <div className="mt-1 text-lg font-black text-white">{activeBasisStats.nights ? salesFmtRMFull(activeBasisStats.avgSales) : "—"}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                <div className="text-[9px] font-black uppercase tracking-wider text-white/30">Median Sales</div>
                <div className="mt-1 text-lg font-black text-white">{activeBasisStats.nights ? salesFmtRMFull(activeBasisStats.medianSales) : "—"}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
                <div className="text-[9px] font-black uppercase tracking-wider text-white/30">Avg Nett</div>
                <div className={`mt-1 text-lg font-black ${activeBasisStats.avgNett >= 0 ? "text-emerald-300" : "text-red-300"}`}>{activeBasisStats.nights ? salesFmtRMFull(activeBasisStats.avgNett) : "—"}</div>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/20">
              <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
                <div className="text-[10px] font-black uppercase tracking-widest text-white/35">Basis Nights</div>
                {basisMode === "auto" && autoBasis.length ? (
                  <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white/35">
                    Auto matched
                  </span>
                ) : null}
              </div>
              <div className="max-h-[520px] overflow-auto">
                {activeBasis.length ? (
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="px-4 py-2 text-left text-[9px] font-black uppercase tracking-wider text-white/25">Date</th>
                        <th className="px-3 py-2 text-left text-[9px] font-black uppercase tracking-wider text-white/25">Event</th>
                        <th className="px-3 py-2 text-left text-[9px] font-black uppercase tracking-wider text-white/25">DJs</th>
                        <th className="px-3 py-2 text-right text-[9px] font-black uppercase tracking-wider text-white/25">Sales</th>
                        <th className="px-4 py-2 text-right text-[9px] font-black uppercase tracking-wider text-white/25">Nett</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeBasis
                        .slice()
                        .sort((a, b) => b.date.localeCompare(a.date))
                        .map((night) => (
                          <tr key={night.id} className="border-b border-white/[0.06]">
                            <td className="px-4 py-2 font-bold text-white/60">{salesFmtDate(night.date)} · {night.weekdayLabel}</td>
                            <td className="px-3 py-2 font-bold text-white/80">{night.eventLabel}</td>
                            <td className="px-3 py-2 text-[10px] font-bold text-white/35">
                              {(night.djNames || []).slice(0, 4).map((name) => (
                                <button
                                  key={name}
                                  type="button"
                                  onClick={() => typeof onOpenDj === "function" && onOpenDj(name)}
                                  className={`mr-1 rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                                    typeof onOpenDj === "function" ? "border-purple-300/25 bg-purple-400/10 text-purple-100 hover:bg-purple-400/20" : "border-white/10 bg-white/[0.03] text-white/40"
                                  }`}
                                >
                                  {name}
                                </button>
                              ))}
                            </td>
                            <td className="px-3 py-2 text-right font-black text-white">{salesFmtRMFull(night.total)}</td>
                            <td className={`px-4 py-2 text-right font-black ${night.nett >= 0 ? "text-emerald-300" : "text-red-300"}`}>{salesFmtRMFull(night.nett)}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="px-4 py-10 text-center text-sm font-bold text-white/35">No basis nights selected.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 p-4 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-3">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white/40">
                <Search className="h-4 w-4 shrink-0" />
                <input value={djCompareQuery} onChange={(e) => setDjCompareQuery(e.target.value)} placeholder="Search DJs..." className="w-full bg-transparent text-xs font-bold text-white outline-none placeholder:text-white/25" />
              </div>
              <div className="mt-2 text-[10px] font-bold text-white/35">Pick up to 8 DJs to compare from your current filter pool.</div>
            </div>

            <div className="max-h-[520px] overflow-auto rounded-2xl border border-white/10 bg-black/20">
              <div className="border-b border-white/10 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-white/35">DJs</div>
              <div className="flex flex-wrap gap-1.5 p-3">
                {filteredDjOptions.slice(0, 120).map((name) => (
                  <button key={name} type="button" onClick={() => toggleDjPick(name)} className={pillCls(djPickedSet.has(name))}>
                    {name}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
              <div className="text-[10px] font-black uppercase tracking-widest text-white/35">Top DJs (current pool)</div>
              <div className="mt-2 space-y-2">
                {topDjInPool.map((dj) => (
                  <button
                    key={dj.name}
                    type="button"
                    onClick={() => toggleDjPick(dj.name)}
                    className={`flex w-full items-center justify-between gap-3 rounded-xl border px-3 py-2 text-left transition ${
                      djPickedSet.has(dj.name) ? "border-cyan-300/35 bg-cyan-400/12" : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]"
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="truncate text-xs font-black text-white">{dj.name}</div>
                      <div className="text-[10px] font-bold text-white/35">{dj.nights} night{dj.nights === 1 ? "" : "s"}</div>
                    </div>
                    <div className="text-right text-xs font-black text-cyan-100">{salesFmtRMFull(dj.avgSales)}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/20">
              <div className="border-b border-white/10 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-white/35">DJ Stats</div>
              {djStats.length ? (
                <div className="overflow-auto">
                  <table className="w-full min-w-[640px] text-xs">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="px-4 py-2 text-left text-[9px] font-black uppercase tracking-wider text-white/25">DJ</th>
                        <th className="px-3 py-2 text-right text-[9px] font-black uppercase tracking-wider text-white/25">Nights</th>
                        <th className="px-3 py-2 text-right text-[9px] font-black uppercase tracking-wider text-white/25">Avg Sales</th>
                        <th className="px-3 py-2 text-right text-[9px] font-black uppercase tracking-wider text-white/25">Median</th>
                        <th className="px-3 py-2 text-right text-[9px] font-black uppercase tracking-wider text-white/25">Avg Nett</th>
                        <th className="px-4 py-2 text-left text-[9px] font-black uppercase tracking-wider text-white/25">Bar</th>
                      </tr>
                    </thead>
                    <tbody>
                      {djStats.map((dj) => (
                        <tr key={dj.name} className="border-b border-white/[0.06]">
                          <td className="px-4 py-2">
                            <button
                              type="button"
                              onClick={() => typeof onOpenDj === "function" && onOpenDj(dj.name)}
                              className={`text-left text-xs font-black ${
                                typeof onOpenDj === "function" ? "text-purple-200 hover:text-purple-100" : "text-white"
                              }`}
                            >
                              {dj.name}
                            </button>
                          </td>
                          <td className="px-3 py-2 text-right font-black text-white/60">{dj.nights}</td>
                          <td className="px-3 py-2 text-right font-black text-white">{salesFmtRMFull(dj.avgSales)}</td>
                          <td className="px-3 py-2 text-right font-black text-white/70">{salesFmtRMFull(dj.medianSales)}</td>
                          <td className={`px-3 py-2 text-right font-black ${dj.avgNett >= 0 ? "text-emerald-300" : "text-red-300"}`}>{salesFmtRMFull(dj.avgNett)}</td>
                          <td className="px-4 py-2">
                            <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                              <div className="h-full rounded-full bg-cyan-300/60" style={{ width: `${Math.min(100, (dj.avgSales / maxDjAvgSales) * 100)}%` }} />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="px-4 py-10 text-center text-sm font-bold text-white/35">Pick DJs to compare.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function WeeklySalesPage({ userRole, onToast, events = [], onOpenEvent, onOpenDj }) {
  const [view, setView]           = useState("weekly");
  const [tab, setTab]             = useState("nights");
  const [month, setMonth]         = useState("APRIL 2026");
  const [allRows, setAllRows]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [editRow, setEditRow]     = useState(null);
  const [expandedPL, setExpandedPL] = useState({});
  const [salesQuery, setSalesQuery] = useState("");
  const [salesDj, setSalesDj] = useState("");
  const [salesEvent, setSalesEvent] = useState("");
  const [salesOnlyLinked, setSalesOnlyLinked] = useState(false);
  const [salesIncludeZero, setSalesIncludeZero] = useState(false);
  const [chartMetric, setChartMetric] = useState("sales");
  const [chartType, setChartType] = useState("bar");
  const [chartGrain, setChartGrain] = useState("week");
  const [chartScope, setChartScope] = useState("month");
  const [chartLimit, setChartLimit] = useState(120);
  const [chartQuery, setChartQuery] = useState("");
  const [chartDj, setChartDj] = useState("");
  const [chartEvent, setChartEvent] = useState("");
  const [chartStart, setChartStart] = useState("");
  const [chartEnd, setChartEnd] = useState("");
  const [chartOnlyLinked, setChartOnlyLinked] = useState(false);
  const [chartIncludeZero, setChartIncludeZero] = useState(false);
  const [chartWeekdays, setChartWeekdays] = useState([]);
  const canEdit = userRole === "admin" || userRole === "superadmin";

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    if (!isSupabaseConfigured) {
      setLoading(false);
      setError("Supabase is not configured.");
      return;
    }
    const { data: rows, error: err } = await supabase
      .from("weekly_sales")
      .select("*")
      .order("date", { ascending: true });
    if (err) { setError(err.message); setLoading(false); return; }
    setAllRows(rows || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const salesMonths = useMemo(() => {
    const months = Array.from(new Set((allRows || []).map((row) => row.month_year || monthYearFromISO(row.date)).filter(Boolean)));
    const sorted = months
      .slice()
      .sort((a, b) => {
        const A = parseSalesMonthYear(a);
        const B = parseSalesMonthYear(b);
        if (A.year != null && B.year != null) {
          return B.year - A.year || B.monthIndex - A.monthIndex;
        }
        return String(b).localeCompare(String(a));
      });
    return sorted.length ? sorted : SALES_MONTHS;
  }, [allRows]);

  useEffect(() => {
    if (salesMonths.length && !salesMonths.includes(month)) setMonth(salesMonths[0]);
  }, [month, salesMonths]);

  const salesMonthsMeta = useMemo(() => salesMonths.map(parseSalesMonthYear), [salesMonths]);
  const years = useMemo(() => {
    const set = new Set(salesMonthsMeta.map((m) => m.year).filter((y) => y != null));
    return Array.from(set).sort((a, b) => b - a);
  }, [salesMonthsMeta]);
  const monthsByYear = useMemo(() => {
    const map = new Map();
    for (const meta of salesMonthsMeta) {
      if (meta.year == null) continue;
      const list = map.get(meta.year) || [];
      list.push(meta);
      map.set(meta.year, list);
    }
    for (const [year, list] of map.entries()) {
      list.sort((a, b) => a.monthIndex - b.monthIndex);
      map.set(year, list);
    }
    return map;
  }, [salesMonthsMeta]);
  const selectedMeta = useMemo(() => parseSalesMonthYear(month), [month]);
  const selectedYear = selectedMeta.year ?? years[0] ?? null;
  const yearMonths = selectedYear != null ? (monthsByYear.get(selectedYear) || []) : [];

  const data = useMemo(() => allRows.filter((row) => (row.month_year || monthYearFromISO(row.date)) === month), [allRows, month]);

  const eventInsights = useMemo(() => buildEventNightInsights(events, allRows), [events, allRows]);
  const linksByRowId = useMemo(() => {
    const links = buildSalesEventLinks(events, data);
    return new Map(links.map((link) => [String(link.row?.id || ""), link]));
  }, [data, events]);

  const analysisRowsSource = useMemo(() => (chartScope === "all" ? allRows : data), [allRows, chartScope, data]);
  const analysisLinks = useMemo(() => buildSalesEventLinks(events, analysisRowsSource), [analysisRowsSource, events]);
  const analysisDjOptions = useMemo(() => {
    const set = new Set();
    for (const link of analysisLinks) for (const name of link.djNames || []) set.add(name);
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [analysisLinks]);
  const analysisEventOptions = useMemo(() => {
    const set = new Set();
    for (const link of analysisLinks) {
      const label = String(link.event?.name || link.row?.event_name || "").trim();
      if (label) set.add(label);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [analysisLinks]);

  const salesLinksAll = useMemo(() => buildSalesEventLinks(events, allRows), [allRows, events]);
  const salesDjOptions = useMemo(() => {
    const set = new Set();
    for (const link of salesLinksAll) for (const name of link.djNames || []) set.add(name);
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [salesLinksAll]);
  const salesEventOptions = useMemo(() => {
    const set = new Set();
    for (const link of salesLinksAll) {
      const label = String(link.event?.name || link.row?.event_name || "").trim();
      if (label) set.add(label);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [salesLinksAll]);

  const toggleChartWeekday = useCallback((idx) => {
    setChartWeekdays((current) => (current.includes(idx) ? current.filter((d) => d !== idx) : [...current, idx]));
  }, []);

  const analysisFiltered = useMemo(() => {
    const needle = chartQuery.trim().toLowerCase();
    const eventNeedleKey = eventNameKey(chartEvent);
    const startISO = chartStart ? String(chartStart) : "";
    const endISO = chartEnd ? String(chartEnd) : "";
    const weekdaySet = new Set(chartWeekdays);

    return analysisLinks
      .map((link) => {
        const row = link.row || {};
        const date = row.date;
        const total = Number(link.total) || 0;
        const nett = Number(link.pl?.nett) || 0;
        const eventLabel = String(link.event?.name || row.event_name || "").trim();
        const eventKey = eventNameKey(eventLabel);
        const djNames = Array.isArray(link.djNames) ? link.djNames : [];
        const weekday = date ? isoToDate(date).getDay() : null;
        const linked = Array.isArray(link.linkedEvents) && link.linkedEvents.length > 0;
        return { date, total, nett, eventLabel, eventKey, djNames, weekday, linked };
      })
      .filter((item) => {
        if (!item.date) return false;
        if (!chartIncludeZero && item.total <= 0) return false;
        if (chartOnlyLinked && !item.linked) return false;
        if (chartDj && !item.djNames.includes(chartDj)) return false;
        if (chartWeekdays.length && (item.weekday == null || !weekdaySet.has(item.weekday))) return false;
        if (startISO && item.date < startISO) return false;
        if (endISO && item.date > endISO) return false;
        if (eventNeedleKey) {
          if (!item.eventKey.includes(eventNeedleKey) && !String(item.eventLabel || "").toLowerCase().includes(chartEvent.trim().toLowerCase())) return false;
        }
        if (!needle) return true;
        const haystack = [
          item.date,
          salesFmtDate(item.date),
          item.eventLabel,
          (item.djNames || []).join(" "),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return haystack.includes(needle);
      });
  }, [analysisLinks, chartDj, chartEnd, chartEvent, chartIncludeZero, chartOnlyLinked, chartQuery, chartStart, chartWeekdays]);

  const analysisPoints = useMemo(() => {
    const metric = chartMetric;
    const grain = chartGrain;
    const map = new Map();
    for (const item of analysisFiltered) {
      const key =
        grain === "night"
          ? item.date
          : grain === "week"
          ? weekKeyFromISO(item.date)
          : grain === "month"
          ? salesMonthKeyFromISO(item.date)
          : String(isoToDate(item.date).getFullYear());
      const current = map.get(key) || { key, value: 0, firstDate: item.date };
      current.value += metric === "nett" ? item.nett : item.total;
      if (item.date < current.firstDate) current.firstDate = item.date;
      map.set(key, current);
    }
    const list = Array.from(map.values())
      .sort((a, b) => String(a.firstDate).localeCompare(String(b.firstDate)))
      .map((p) => {
        const label =
          grain === "night"
            ? salesNightLabelFromISO(p.key)
            : grain === "week"
            ? weekLabelFromKey(p.key)
            : grain === "month"
            ? salesMonthLabelFromKey(p.key)
            : String(p.key);
        return { key: p.key, label, value: p.value, firstDate: p.firstDate };
      });
    const limit = Math.max(10, Math.min(400, Number(chartLimit) || 120));
    if (list.length <= limit) return list;
    return list.slice(-limit);
  }, [analysisFiltered, chartGrain, chartLimit, chartMetric]);

  const salesFilteredLinks = useMemo(() => {
    const needle = salesQuery.trim().toLowerCase();
    const eventNeedleKey = eventNameKey(salesEvent);
    return buildSalesEventLinks(events, view === "weekly" ? data : allRows)
      .filter((link) => {
        const row = link.row || {};
        const date = row.date;
        const total = Number(link.total) || 0;
        const eventLabel = String(link.event?.name || row.event_name || "").trim();
        const eventKey = eventNameKey(eventLabel);
        const djNames = Array.isArray(link.djNames) ? link.djNames : [];
        const linked = Array.isArray(link.linkedEvents) && link.linkedEvents.length > 0;
        if (!date) return false;
        if (!salesIncludeZero && total <= 0) return false;
        if (salesOnlyLinked && !linked) return false;
        if (salesDj && !djNames.includes(salesDj)) return false;
        if (eventNeedleKey) {
          if (!eventKey.includes(eventNeedleKey) && !String(eventLabel || "").toLowerCase().includes(salesEvent.trim().toLowerCase())) return false;
        }
        if (!needle) return true;
        const haystack = [
          date,
          salesFmtDate(date),
          eventLabel,
          (djNames || []).join(" "),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        return haystack.includes(needle);
      });
  }, [allRows, data, events, salesDj, salesEvent, salesIncludeZero, salesOnlyLinked, salesQuery, view]);

  const weeklyFilteredRows = useMemo(() => {
    if (view !== "weekly") return data;
    return salesFilteredLinks.map((link) => link.row);
  }, [data, salesFilteredLinks, view]);

  const weeks = useMemo(() => {
    const map = {};
    for (const row of weeklyFilteredRows) {
      const k = row.week_number;
      if (!map[k]) map[k] = [];
      map[k].push(row);
    }
    return Object.entries(map)
      .sort(([a], [b]) => +a - +b)
      .map(([k, rows]) => ({ weekNum: +k, rows }));
  }, [weeklyFilteredRows]);

  const monthTotals = useMemo(() => {
    return weeklyFilteredRows.reduce(
      (acc, row) => {
        const pl = calcNightPL(row);
        return {
          sales:  acc.sales  + ((row.pos_total || 0) + (row.ticketmelon_total || 0)),
          income: acc.income + pl.incomeTotal,
          cost:   acc.cost   + pl.costTotal,
          nett:   acc.nett   + pl.nett,
        };
      },
      { sales: 0, income: 0, cost: 0, nett: 0 }
    );
  }, [weeklyFilteredRows]);

  const summaryYears = useMemo(() => {
    const set = new Set();
    for (const link of salesLinksAll) {
      const date = link.row?.date;
      if (!date) continue;
      set.add(isoToDate(date).getFullYear());
    }
    return Array.from(set).sort((a, b) => b - a);
  }, [salesLinksAll]);
  const [summaryYear, setSummaryYear] = useState(() => selectedYear ?? summaryYears[0] ?? new Date().getFullYear());
  useEffect(() => {
    if (!summaryYears.length) return;
    if (!summaryYears.includes(summaryYear)) setSummaryYear(summaryYears[0]);
  }, [summaryYear, summaryYears]);

  const monthlySummaryRows = useMemo(() => {
    const map = new Map();
    for (const link of salesFilteredLinks) {
      const row = link.row || {};
      const date = row.date;
      if (!date) continue;
      const year = isoToDate(date).getFullYear();
      if (year !== summaryYear) continue;
      const key = salesMonthKeyFromISO(date);
      const current = map.get(key) || { key, year, firstDate: date, nights: 0, sales: 0, nett: 0, best: null };
      current.nights += 1;
      current.sales += Number(link.total) || 0;
      current.nett += Number(link.pl?.nett) || 0;
      if (date < current.firstDate) current.firstDate = date;
      if (!current.best || (Number(link.total) || 0) > current.best.sales) {
        current.best = { date, label: String(link.event?.name || row.event_name || "").trim(), sales: Number(link.total) || 0 };
      }
      map.set(key, current);
    }
    return Array.from(map.values())
      .sort((a, b) => String(a.firstDate).localeCompare(String(b.firstDate)));
  }, [salesFilteredLinks, summaryYear]);

  const yearlySummaryRows = useMemo(() => {
    const map = new Map();
    for (const link of salesFilteredLinks) {
      const row = link.row || {};
      const date = row.date;
      if (!date) continue;
      const year = isoToDate(date).getFullYear();
      const current = map.get(year) || { year, firstDate: date, nights: 0, sales: 0, nett: 0, best: null };
      current.nights += 1;
      current.sales += Number(link.total) || 0;
      current.nett += Number(link.pl?.nett) || 0;
      if (date < current.firstDate) current.firstDate = date;
      if (!current.best || (Number(link.total) || 0) > current.best.sales) {
        current.best = { date, label: String(link.event?.name || row.event_name || "").trim(), sales: Number(link.total) || 0 };
      }
      map.set(year, current);
    }
    return Array.from(map.values())
      .sort((a, b) => a.year - b.year);
  }, [salesFilteredLinks]);

  async function handleDelete(id) {
    if (!window.confirm("Delete this night? This cannot be undone.")) return;
    const { error: err } = await supabase.from("weekly_sales").delete().eq("id", id);
    if (err) { onToast(err.message, "error"); return; }
    onToast("Night deleted", "success");
    setEditRow(null);
    load();
  }

  async function handleSave(values) {
    if (editRow._new) {
      const { error: err } = await supabase.from("weekly_sales").insert(values);
      if (err) { onToast(err.message, "error"); return; }
      onToast("Night added", "success");
    } else {
      const { error: err } = await supabase
        .from("weekly_sales")
        .update({ ...values, updated_at: new Date().toISOString() })
        .eq("id", editRow.id);
      if (err) { onToast(err.message, "error"); return; }
      onToast("Saved", "success");
    }
    setEditRow(null);
    load();
  }

  const nextWeekNum = weeks.length ? weeks[weeks.length - 1].weekNum + 1 : 1;
  const openEvent = useCallback((event) => {
    if (!event) return;
    if (typeof onOpenEvent === "function") {
      onOpenEvent(event);
      return;
    }
    const url = eventShareUrl(event?.id);
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  }, [onOpenEvent]);

  return (
    <div className="space-y-5 px-1 py-2">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-purple-300" />
          <h1 className="text-lg font-black text-white">Sales</h1>
        </div>
        <div className="flex items-center gap-2">
          {view === "weekly" ? (
            <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-black/20 p-2">
              <select
                value={selectedYear ?? ""}
                onChange={(e) => {
                  const nextYear = Number(e.target.value);
                  if (!Number.isFinite(nextYear)) return;
                  const options = monthsByYear.get(nextYear) || [];
                  const keepMonth = selectedMeta.monthIndex != null ? options.find((m) => m.monthIndex === selectedMeta.monthIndex) : null;
                  setMonth((keepMonth || options[options.length - 1] || options[0] || { label: salesMonths[0] }).label);
                }}
                className="h-10 rounded-xl border border-white/10 bg-white/5 px-3 text-[11px] font-black text-white/70 outline-none hover:bg-white/10 focus:border-purple-300/60"
              >
                {years.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <select
                value={selectedMeta.monthIndex ?? ""}
                onChange={(e) => {
                  const idx = Number(e.target.value);
                  const next = yearMonths.find((m) => m.monthIndex === idx);
                  if (next?.label) setMonth(next.label);
                }}
                className="h-10 min-w-[160px] rounded-xl border border-white/10 bg-white/5 px-3 text-[11px] font-black text-white/70 outline-none hover:bg-white/10 focus:border-purple-300/60"
              >
                {yearMonths.map((m) => (
                  <option key={m.label} value={m.monthIndex}>{m.monthName ? m.monthName[0] + m.monthName.slice(1).toLowerCase() : m.label}</option>
                ))}
              </select>
            </div>
          ) : view === "monthly" ? (
            <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-black/20 p-2">
              <select
                value={summaryYear ?? ""}
                onChange={(e) => setSummaryYear(Number(e.target.value))}
                className="h-10 rounded-xl border border-white/10 bg-white/5 px-3 text-[11px] font-black text-white/70 outline-none hover:bg-white/10 focus:border-purple-300/60"
              >
                {summaryYears.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
          ) : null}
          <button
            onClick={load}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/40 hover:text-white"
            title="Refresh"
          >
            <RefreshCcw className="h-3.5 w-3.5" />
          </button>
          {canEdit && (
            <button
              onClick={() => setEditRow({ _new: true, week_number: nextWeekNum })}
              className="flex h-8 items-center gap-1.5 rounded-xl border border-purple-300/25 bg-purple-400/10 px-3 text-xs font-black text-purple-100 hover:bg-purple-400/20"
            >
              <Plus className="h-3.5 w-3.5" /> Add Night
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-1">
        {[["weekly", "Weekly"], ["monthly", "Monthly"], ["yearly", "Yearly"]].map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setView(key)}
            className={`rounded-lg border px-3 py-2 text-xs font-black transition ${
              view === key ? "border-cyan-300/40 bg-cyan-400/15 text-cyan-100" : "border-white/10 bg-white/5 text-white/40 hover:bg-white/10 hover:text-white"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {(view === "monthly" || view === "yearly" || (view === "weekly" && tab === "nights")) && (
        <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white/40">
              <Search className="h-4 w-4 shrink-0" />
              <input
                value={salesQuery}
                onChange={(e) => setSalesQuery(e.target.value)}
                placeholder="Search nights / events / DJs..."
                className="w-full bg-transparent text-xs font-bold text-white outline-none placeholder:text-white/25"
              />
            </div>
            <select
              value={salesDj}
              onChange={(e) => setSalesDj(e.target.value)}
              className="h-10 rounded-xl border border-white/10 bg-white/5 px-3 text-[11px] font-black text-white/70 outline-none hover:bg-white/10 focus:border-cyan-300/40"
            >
              <option value="">All DJs</option>
              {salesDjOptions.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
            <input
              value={salesEvent}
              onChange={(e) => setSalesEvent(e.target.value)}
              list="sales-summary-event"
              placeholder="Filter by event..."
              className="h-10 rounded-xl border border-white/10 bg-white/5 px-3 text-[11px] font-black text-white/70 outline-none hover:bg-white/10 focus:border-cyan-300/40"
            />
            <datalist id="sales-summary-event">
              {salesEventOptions.slice(0, 200).map((label) => (
                <option key={label} value={label} />
              ))}
            </datalist>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setSalesOnlyLinked((v) => !v)}
              className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-wider transition ${
                salesOnlyLinked ? "border-cyan-300/40 bg-cyan-400/20 text-cyan-100" : "border-white/10 bg-white/5 text-white/35 hover:text-white"
              }`}
            >
              Linked only
            </button>
            <button
              type="button"
              onClick={() => setSalesIncludeZero((v) => !v)}
              className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-wider transition ${
                salesIncludeZero ? "border-cyan-300/40 bg-cyan-400/20 text-cyan-100" : "border-white/10 bg-white/5 text-white/35 hover:text-white"
              }`}
            >
              Include 0
            </button>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white/35">
              {salesFilteredLinks.length} nights
            </span>
          </div>
        </div>
      )}

      {view === "weekly" && (
        <div className="flex gap-1">
          {[["nights", "Nights"], ["compare", "Compare"], ["analysis", "Analysis"]].map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`rounded-lg border px-3 py-2 text-xs font-black transition ${
                tab === key ? "border-purple-300/50 bg-purple-400/20 text-purple-100" : "border-white/10 bg-white/5 text-white/40 hover:bg-white/10 hover:text-white"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* ── States ── */}
      {loading && (
        <div className="py-16 text-center text-sm font-black text-white/25">Loading…</div>
      )}
      {!loading && error && (
        <div className="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-3 text-sm font-bold text-red-300">{error}</div>
      )}
      {!loading && !error && view === "weekly" && weeks.length === 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] py-16 text-center">
          <div className="text-sm font-black text-white/30">No data for {month}</div>
          {canEdit && (
            <button
              onClick={() => setEditRow({ _new: true, week_number: 1 })}
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl border border-purple-300/25 bg-purple-400/10 px-4 py-2 text-xs font-black text-purple-100 hover:bg-purple-400/20"
            >
              <Plus className="h-3.5 w-3.5" /> Add First Night
            </button>
          )}
        </div>
      )}

      {!loading && !error && view === "weekly" && tab === "compare" && allRows.length > 0 && (
        <SalesComparisonWorkbench events={events} salesRows={allRows} onOpenEvent={openEvent} onOpenDj={onOpenDj} />
      )}

      {!loading && !error && view === "weekly" && tab === "analysis" && allRows.length > 0 && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <div className="rounded-2xl border border-white/10 bg-black/20 p-2">
              <select
                value={chartMetric}
                onChange={(e) => setChartMetric(e.target.value)}
                className="h-10 rounded-xl border border-white/10 bg-white/5 px-3 text-[11px] font-black text-white/70 outline-none hover:bg-white/10 focus:border-cyan-300/40"
              >
                <option value="sales">Gross Sales</option>
                <option value="nett">Net Profit</option>
              </select>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-2">
              <select
                value={chartType}
                onChange={(e) => setChartType(e.target.value)}
                className="h-10 rounded-xl border border-white/10 bg-white/5 px-3 text-[11px] font-black text-white/70 outline-none hover:bg-white/10 focus:border-cyan-300/40"
              >
                <option value="bar">Bar</option>
                <option value="line">Line</option>
              </select>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-2">
              <select
                value={chartGrain}
                onChange={(e) => setChartGrain(e.target.value)}
                className="h-10 rounded-xl border border-white/10 bg-white/5 px-3 text-[11px] font-black text-white/70 outline-none hover:bg-white/10 focus:border-cyan-300/40"
              >
                <option value="night">Nights</option>
                <option value="week">Weeks</option>
                <option value="month">Months</option>
                <option value="year">Years</option>
              </select>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-2">
              <select
                value={chartScope}
                onChange={(e) => setChartScope(e.target.value)}
                className="h-10 rounded-xl border border-white/10 bg-white/5 px-3 text-[11px] font-black text-white/70 outline-none hover:bg-white/10 focus:border-cyan-300/40"
              >
                <option value="month">Selected month</option>
                <option value="all">All time</option>
              </select>
            </div>
            <div className="ml-auto rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white/35">
              {month}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white/40">
                <Search className="h-4 w-4 shrink-0" />
                <input
                  value={chartQuery}
                  onChange={(e) => setChartQuery(e.target.value)}
                  placeholder="Search nights / events / DJs..."
                  className="w-full bg-transparent text-xs font-bold text-white outline-none placeholder:text-white/25"
                />
              </div>
              <select value={chartDj} onChange={(e) => setChartDj(e.target.value)} className="h-10 rounded-xl border border-white/10 bg-white/5 px-3 text-[11px] font-black text-white/70 outline-none hover:bg-white/10 focus:border-cyan-300/40">
                <option value="">All DJs</option>
                {analysisDjOptions.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
              <input
                value={chartEvent}
                onChange={(e) => setChartEvent(e.target.value)}
                list="sales-analysis-event"
                placeholder="Filter by event..."
                className="h-10 rounded-xl border border-white/10 bg-white/5 px-3 text-[11px] font-black text-white/70 outline-none hover:bg-white/10 focus:border-cyan-300/40"
              />
              <datalist id="sales-analysis-event">
                {analysisEventOptions.slice(0, 200).map((label) => (
                  <option key={label} value={label} />
                ))}
              </datalist>
              <input type="date" value={chartStart} onChange={(e) => setChartStart(e.target.value)} className="h-10 rounded-xl border border-white/10 bg-white/5 px-3 text-[11px] font-black text-white/70 outline-none hover:bg-white/10 focus:border-cyan-300/40" />
              <input type="date" value={chartEnd} onChange={(e) => setChartEnd(e.target.value)} className="h-10 rounded-xl border border-white/10 bg-white/5 px-3 text-[11px] font-black text-white/70 outline-none hover:bg-white/10 focus:border-cyan-300/40" />
              <input
                value={chartLimit}
                onChange={(e) => setChartLimit(e.target.value)}
                inputMode="numeric"
                className="h-10 rounded-xl border border-white/10 bg-white/5 px-3 text-[11px] font-black text-white/70 outline-none hover:bg-white/10 focus:border-cyan-300/40"
              />
              <div className="flex flex-wrap items-center gap-1.5">
                {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((label, idx) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => toggleChartWeekday(idx)}
                    className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-wider transition ${
                      chartWeekdays.includes(idx)
                        ? "border-cyan-300/40 bg-cyan-400/20 text-cyan-100"
                        : "border-white/10 bg-white/5 text-white/35 hover:text-white"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setChartOnlyLinked((v) => !v)}
                className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-wider transition ${
                  chartOnlyLinked ? "border-cyan-300/40 bg-cyan-400/20 text-cyan-100" : "border-white/10 bg-white/5 text-white/35 hover:text-white"
                }`}
              >
                Linked only
              </button>
              <button
                type="button"
                onClick={() => setChartIncludeZero((v) => !v)}
                className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-wider transition ${
                  chartIncludeZero ? "border-cyan-300/40 bg-cyan-400/20 text-cyan-100" : "border-white/10 bg-white/5 text-white/35 hover:text-white"
                }`}
              >
                Include 0
              </button>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white/35">
                {analysisFiltered.length} nights
              </span>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white/35">
                {analysisPoints.length} points
              </span>
            </div>
          </div>

          <SalesSeriesChart
            points={analysisPoints}
            metricLabel={chartMetric === "nett" ? "Net Profit" : "Gross Sales"}
            chartType={chartType}
          />

          <EventNightAnalytics insights={eventInsights} />
        </div>
      )}

      {!loading && !error && view === "monthly" && (
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/20">
          <div className="border-b border-white/10 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-white/35">Monthly Sales — {summaryYear}</div>
          <div className="overflow-auto">
            <table className="w-full min-w-[860px] text-xs">
              <thead>
                <tr className="border-b border-white/10">
                  {["Month", "Nights", "Gross Sales", "Net Profit", "Avg / night", "Best night"].map((h, i) => (
                    <th key={h} className={`px-4 py-2 text-[9px] font-black uppercase tracking-wider text-white/25 ${i === 0 || i === 5 ? "text-left" : "text-right"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {monthlySummaryRows.map((m) => (
                  <tr key={m.key} className="border-b border-white/[0.06] hover:bg-white/[0.03]">
                    <td className="px-4 py-2">
                      <button
                        type="button"
                        onClick={() => {
                          setMonth(monthYearFromISO(m.firstDate));
                          setView("weekly");
                          setTab("nights");
                        }}
                        className="text-left text-xs font-black text-cyan-100 hover:text-cyan-50"
                        title="Open month"
                      >
                        {salesMonthLabelFromKey(m.key)}
                      </button>
                    </td>
                    <td className="px-4 py-2 text-right font-black text-white/60">{m.nights}</td>
                    <td className="px-4 py-2 text-right font-black text-white">{salesFmtRMFull(m.sales)}</td>
                    <td className={`px-4 py-2 text-right font-black ${m.nett >= 0 ? "text-emerald-300" : "text-red-300"}`}>{salesFmtRMFull(m.nett)}</td>
                    <td className="px-4 py-2 text-right font-black text-white/70">{salesFmtRMFull(m.nights ? m.sales / m.nights : 0)}</td>
                    <td className="px-4 py-2 text-left text-[11px] font-bold text-white/55">
                      {m.best ? (
                        <span className="font-black text-white/70">
                          {salesFmtDate(m.best.date)} · {m.best.label || "—"} · <span className="text-cyan-100">{salesFmtRMFull(m.best.sales)}</span>
                        </span>
                      ) : (
                        <span className="text-white/25">—</span>
                      )}
                    </td>
                  </tr>
                ))}
                {!monthlySummaryRows.length ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-sm font-bold text-white/35">No matching nights.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && !error && view === "yearly" && (
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-black/20">
          <div className="border-b border-white/10 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-white/35">Yearly Sales</div>
          <div className="overflow-auto">
            <table className="w-full min-w-[860px] text-xs">
              <thead>
                <tr className="border-b border-white/10">
                  {["Year", "Nights", "Gross Sales", "Net Profit", "Avg / night", "Best night"].map((h, i) => (
                    <th key={h} className={`px-4 py-2 text-[9px] font-black uppercase tracking-wider text-white/25 ${i === 0 || i === 5 ? "text-left" : "text-right"}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {yearlySummaryRows.map((y) => (
                  <tr key={y.year} className="border-b border-white/[0.06] hover:bg-white/[0.03]">
                    <td className="px-4 py-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSummaryYear(y.year);
                          setView("monthly");
                        }}
                        className="text-left text-xs font-black text-cyan-100 hover:text-cyan-50"
                        title="Open year"
                      >
                        {y.year}
                      </button>
                    </td>
                    <td className="px-4 py-2 text-right font-black text-white/60">{y.nights}</td>
                    <td className="px-4 py-2 text-right font-black text-white">{salesFmtRMFull(y.sales)}</td>
                    <td className={`px-4 py-2 text-right font-black ${y.nett >= 0 ? "text-emerald-300" : "text-red-300"}`}>{salesFmtRMFull(y.nett)}</td>
                    <td className="px-4 py-2 text-right font-black text-white/70">{salesFmtRMFull(y.nights ? y.sales / y.nights : 0)}</td>
                    <td className="px-4 py-2 text-left text-[11px] font-bold text-white/55">
                      {y.best ? (
                        <span className="font-black text-white/70">
                          {salesFmtDate(y.best.date)} · {y.best.label || "—"} · <span className="text-cyan-100">{salesFmtRMFull(y.best.sales)}</span>
                        </span>
                      ) : (
                        <span className="text-white/25">—</span>
                      )}
                    </td>
                  </tr>
                ))}
                {!yearlySummaryRows.length ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-sm font-bold text-white/35">No matching nights.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Week blocks ── */}
      {!loading && !error && view === "weekly" && tab === "nights" && weeks.map(({ weekNum, rows }) => {
        const weekSalesTotal = rows.reduce((s, r) => s + (r.pos_total || 0) + (r.ticketmelon_total || 0), 0);
        const weekPLTotal    = rows.reduce((acc, r) => { const pl = calcNightPL(r); return { nett: acc.nett + pl.nett, cost: acc.cost + pl.costTotal }; }, { nett: 0, cost: 0 });
        const isPLOpen       = !!expandedPL[weekNum];
        const weekDate       = rows[0]?.date;

        return (
          <div key={weekNum} className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
            {/* Week header */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 px-4 py-3">
              <div>
                <div className="text-[9px] font-black uppercase tracking-widest text-white/25">Week {weekNum}</div>
                <div className="mt-0.5 text-[11px] font-black text-white/60">
                  {weekDate ? new Date(weekDate + "T00:00:00").toLocaleDateString("en-MY", { day: "2-digit", month: "short", year: "numeric" }) : ""}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-[9px] font-black uppercase tracking-widest text-white/25">Week Sales</div>
                  <div className="text-sm font-black text-white">{salesFmtRMFull(weekSalesTotal)}</div>
                </div>
                <div className="text-right">
                  <div className="text-[9px] font-black uppercase tracking-widest text-white/25">Week Nett</div>
                  <div className={`text-sm font-black ${weekPLTotal.nett >= 0 ? "text-emerald-300" : "text-red-300"}`}>
                    {salesFmtRMFull(weekPLTotal.nett)}
                  </div>
                </div>
                {canEdit && (
                  <button
                    onClick={() => setEditRow({ _new: true, week_number: weekNum })}
                    className="flex h-7 items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 text-[10px] font-black text-white/40 hover:text-white"
                    title="Add night to this week"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                )}
                <button
                  onClick={() => setExpandedPL((p) => ({ ...p, [weekNum]: !p[weekNum] }))}
                  className={`flex h-7 items-center gap-1.5 rounded-lg border px-2.5 text-[10px] font-black transition ${
                    isPLOpen
                      ? "border-purple-300/30 bg-purple-400/20 text-purple-200"
                      : "border-white/10 bg-white/5 text-white/40 hover:text-white"
                  }`}
                >
                  <Receipt className="h-3 w-3" /> P&amp;L
                </button>
              </div>
            </div>

            {/* Sales table */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-xs">
                <thead>
                  <tr className="border-b border-white/5">
                    {["Date","Event","DJs","PAX","Table Bookings","Door Sales","Cover Charge","POS Total","TicketMelon","Total","Target"].map((h, i) => (
                      <th key={h} className={`px-3 py-2.5 text-[9px] font-black uppercase tracking-wider text-white/25 ${i <= 2 ? "text-left" : "text-right"} ${i === 0 ? "pl-4" : ""}`}>{h}</th>
                    ))}
                    {canEdit && <th className="px-3 py-2.5" />}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const total     = (row.pos_total || 0) + (row.ticketmelon_total || 0);
                    const hitTarget = total >= (row.weekly_target || 0);
                    const link = linksByRowId.get(String(row.id)) || null;
                    const primaryEvent = link?.event || link?.linkedEvents?.[0] || null;
                    const resolvedEventName = primaryEvent?.name || row.event_name;
                    const isNameMismatch = primaryEvent && eventNameKey(primaryEvent.name) !== eventNameKey(row.event_name);
                    return (
                      <tr key={row.id} className="border-b border-white/[0.04] hover:bg-white/[0.015]">
                        <td className="pl-4 pr-3 py-2.5 font-bold text-white/60">{salesFmtDate(row.date)}</td>
                        <td className="px-3 py-2.5 font-bold text-white/85">
                          {primaryEvent ? (
                            <button
                              type="button"
                              onClick={() => openEvent(primaryEvent)}
                              className="text-left font-black text-cyan-100 hover:text-cyan-50"
                              title="Open event"
                            >
                              {resolvedEventName}
                            </button>
                          ) : (
                            <span className="font-black text-white/85">{resolvedEventName}</span>
                          )}
                          {isNameMismatch ? (
                            <div className="mt-0.5 text-[10px] font-bold text-white/35">Sales row: {row.event_name}</div>
                          ) : null}
                          {!primaryEvent ? (
                            <div className="mt-0.5 text-[10px] font-bold text-white/25">No matching event on this date</div>
                          ) : null}
                        </td>
                        <td className="px-3 py-2.5 text-[10px] font-bold text-white/40">
                          {link?.djNames?.length ? (
                            <div className="flex flex-wrap gap-1.5">
                              {link.djNames.map((name) => (
                                <button
                                  key={name}
                                  type="button"
                                  onClick={() => typeof onOpenDj === "function" && onOpenDj(name)}
                                  className={`rounded-full border px-2 py-1 text-[9px] font-black uppercase tracking-wider transition ${
                                    typeof onOpenDj === "function"
                                      ? "border-purple-300/25 bg-purple-400/10 text-purple-100 hover:bg-purple-400/20"
                                      : "border-white/10 bg-white/[0.03] text-white/40"
                                  }`}
                                  title={typeof onOpenDj === "function" ? "Open DJ" : undefined}
                                >
                                  {name}
                                </button>
                              ))}
                            </div>
                          ) : (
                            <span className="text-white/25">No DJ link</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-right text-white/50">{row.pax || "—"}</td>
                        <td className="px-3 py-2.5 text-right tabular-nums text-white/50">{salesFmtRM(row.table_bookings)}</td>
                        <td className="px-3 py-2.5 text-right tabular-nums text-white/50">{salesFmtRM(row.door_sales)}</td>
                        <td className="px-3 py-2.5 text-right tabular-nums text-white/50">{salesFmtRM(row.cover_charge)}</td>
                        <td className="px-3 py-2.5 text-right tabular-nums font-bold text-white/75">{salesFmtRMFull(row.pos_total)}</td>
                        <td className="px-3 py-2.5 text-right tabular-nums text-white/50">{salesFmtRM(row.ticketmelon_total)}</td>
                        <td className={`px-3 py-2.5 text-right tabular-nums font-black ${hitTarget ? "text-emerald-300" : "text-amber-200"}`}>{salesFmtRMFull(total)}</td>
                        <td className="px-3 py-2.5 text-right tabular-nums text-white/30">{salesFmtRMFull(row.weekly_target)}</td>
                        {canEdit && (
                          <td className="px-3 py-2.5">
                            <button
                              onClick={() => setEditRow(row)}
                              className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[9px] font-black text-white/40 hover:text-white"
                            >
                              Edit
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-white/[0.03]">
                    <td colSpan={9} className="pl-4 pr-3 py-2.5 text-[10px] font-black uppercase tracking-wider text-white/35">Grand Total</td>
                    <td className={`px-3 py-2.5 text-right text-sm tabular-nums font-black ${weekSalesTotal > 0 ? "text-white" : "text-white/30"}`}>{salesFmtRMFull(weekSalesTotal)}</td>
                    <td className="px-3 py-2.5" />
                    {canEdit && <td />}
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* P&L breakdown */}
            {isPLOpen && (
              <div className="border-t border-white/10">
                <div className="px-4 pt-3 text-[10px] font-black uppercase tracking-wider text-purple-300/60">Profit &amp; Loss Breakdown</div>
                <PLBreakdownTable rows={rows} />
              </div>
            )}
          </div>
        );
      })}

      {/* ── Monthly summary ── */}
      {!loading && !error && view === "weekly" && tab === "nights" && weeks.length > 0 && (
        <div className="rounded-2xl border border-purple-400/20 bg-purple-400/[0.06] px-6 py-5">
          <div className="mb-3 text-[10px] font-black uppercase tracking-widest text-purple-300/60">
            {month} — Monthly Summary
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <div className="text-[9px] font-black uppercase tracking-wider text-white/30">Gross Sales</div>
              <div className="mt-1 text-lg font-black text-white">{salesFmtRMFull(monthTotals.sales)}</div>
            </div>
            <div>
              <div className="text-[9px] font-black uppercase tracking-wider text-white/30">Total Income</div>
              <div className="mt-1 text-lg font-black text-white">{salesFmtRMFull(monthTotals.income)}</div>
            </div>
            <div>
              <div className="text-[9px] font-black uppercase tracking-wider text-white/30">Total Cost</div>
              <div className="mt-1 text-lg font-black text-red-300">{salesFmtRMFull(monthTotals.cost)}</div>
            </div>
            <div>
              <div className="text-[9px] font-black uppercase tracking-wider text-white/30">Net Profit</div>
              <div className={`mt-1 text-lg font-black ${monthTotals.nett >= 0 ? "text-emerald-300" : "text-red-300"}`}>
                {salesFmtRMFull(monthTotals.nett)}
                {monthTotals.cost > 0 && (
                  <span className="ml-2 text-xs font-bold text-white/35">
                    {salesFmtPct(monthTotals.nett / monthTotals.cost)} ROI
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit / Add modal ── */}
      {editRow && (
        <EditNightModal
          row={editRow}
          monthYear={month}
          onSave={handleSave}
          onDelete={editRow._new ? null : () => handleDelete(editRow.id)}
          onClose={() => setEditRow(null)}
        />
      )}
    </div>
  );
}

// ─── Finance Page (P&L Calculator + Ticket Sales tabs) ───────────────────────
function FinancePage() {
  const [tab, setTab] = useState("pl");
  const [savedScenarios, setSavedScenarios] = useState(readSavedFinanceScenarios);

  return (
    <div className="space-y-4">
      <div className="flex gap-1">
        {[["pl", "P&L Calculator"], ["tickets", "Ticket Sales"]].map(([val, label]) => (
          <button key={val} onClick={() => setTab(val)}
            className={`rounded-lg border px-3 py-2 text-xs font-black transition ${tab === val ? "border-purple-300/50 bg-purple-400/20 text-purple-100" : "border-white/10 bg-white/5 text-white/40 hover:bg-white/10 hover:text-white"}`}>
            {label}
          </button>
        ))}
      </div>
      {tab === "pl"
        ? <FinanceMathPage onScenariosChange={setSavedScenarios} />
        : <TicketSalesPage savedScenarios={savedScenarios} />}
    </div>
  );
}


function DjProfilesPage({ profiles, events, loading, error, canEdit, mentionUsers = [], onToast, onRefreshProfiles, onLogActivity, initialQuery = "" }) {
  const [tab, setTab] = useState("profiles");
  const [query, setQuery] = useState(() => String(initialQuery || ""));
  const [availabilityMonth, setAvailabilityMonth] = useState(() => monthInputValueFromDate(new Date()));
  const derivedProfiles = useMemo(() => deriveDjProfilesFromEvents(events), [events]);
  const availableProfiles = profiles.length ? profiles : derivedProfiles;
  const djUsers = useMemo(() => mentionUsers.filter((user) => String(user.role || "").toLowerCase() === "dj"), [mentionUsers]);
  const availabilityMonthDate = useMemo(() => dateFromMonthInput(availabilityMonth), [availabilityMonth]);
  const availabilityMonthLabel = useMemo(
    () => availabilityMonthDate.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
    [availabilityMonthDate],
  );
  const availabilityMonthRange = useMemo(() => {
    const start = new Date(availabilityMonthDate.getFullYear(), availabilityMonthDate.getMonth(), 1);
    const end = new Date(availabilityMonthDate.getFullYear(), availabilityMonthDate.getMonth() + 1, 0);
    return { startISO: isoFromDate(start), endISO: isoFromDate(end) };
  }, [availabilityMonthDate]);
  const filteredProfiles = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return availableProfiles;
    return availableProfiles.filter((profile) => {
      const genreText = profile.genres.map((genre) => genre.name).join(" ");
      return `${profile.name} ${profile.stageName} ${profile.realName} ${profile.email} ${genreText}`.toLowerCase().includes(needle);
    });
  }, [availableProfiles, query]);
  useEffect(() => {
    if (initialQuery == null) return;
    setQuery(String(initialQuery || ""));
  }, [initialQuery]);
  const monthlyAvailabilityRows = useMemo(() => {
    const rows = [];
    for (const profile of availableProfiles) {
      const keys = profileLookupKeys(profile);
      const profileIsUuid = isSupabaseUuid(profile.id);
      const sets = [];

      for (const event of events || []) {
        if (!event?.date || event.date < availabilityMonthRange.startISO || event.date > availabilityMonthRange.endISO) continue;

        for (const slot of event.slots || []) {
          if (!slotNeedsTime(slot)) continue;
          const assignments = Array.isArray(slot.assignments) ? slot.assignments : [];
          const participantNames = (slot.djParticipants?.length ? slot.djParticipants : parseDjLineup(slot.dj).participants)
            .map(canonicalDjName)
            .filter(Boolean);
          const slotKeys = [
            slot.dj,
            ...participantNames,
            ...assignments.map((assignment) => assignment.dj),
          ]
            .map(normalizeDjLookupKey)
            .filter(Boolean);
          const matchesId = profileIsUuid && (
            (slot.djId && String(slot.djId) === String(profile.id)) ||
            assignments.some((assignment) => assignment.djId && String(assignment.djId) === String(profile.id))
          );
          const matchesName = slotKeys.some((key) => keys.has(key));
          if (!matchesId && !matchesName) continue;

          sets.push({
            key: `${event.id}-${slot.id || slot.assignmentId || sets.length}`,
            date: event.date,
            eventName: event.name,
            stage: event.stage,
            role: slot.role,
            start: slot.start,
            end: slot.end,
          });
        }
      }

      if (!sets.length) continue;
      sets.sort((a, b) => `${a.date} ${a.start || ""}`.localeCompare(`${b.date} ${b.start || ""}`));
      rows.push({ profile, sets });
    }

    return rows.sort((a, b) => (a.profile.stageName || a.profile.name).localeCompare(b.profile.stageName || b.profile.name));
  }, [availableProfiles, availabilityMonthRange.endISO, availabilityMonthRange.startISO, events]);
  const [selectedId, setSelectedId] = useState("");

  useEffect(() => {
    if (!filteredProfiles.length) {
      setSelectedId("");
      return;
    }
    if (!filteredProfiles.some((profile) => profile.id === selectedId)) setSelectedId(filteredProfiles[0].id);
  }, [filteredProfiles, selectedId]);

  const selectedProfile = filteredProfiles.find((profile) => profile.id === selectedId) ?? filteredProfiles[0] ?? null;
  const historyRows = useMemo(() => {
    if (!selectedProfile) return [];
    const selectedIsUuid = isSupabaseUuid(selectedProfile.id);
    const selectedName = String(selectedProfile.name || selectedProfile.stageName || "").trim().toLowerCase();
    const selectedStage = String(selectedProfile.stageName || "").trim().toLowerCase();

    const rows = [];
    for (const event of events || []) {
      for (const slot of event.slots || []) {
        const slotDjId = slot.djId ? String(slot.djId) : "";
        const slotName = String(slot.dj || "").trim().toLowerCase();
        const match =
          (selectedIsUuid && slotDjId && slotDjId === String(selectedProfile.id)) ||
          (!selectedIsUuid && selectedName && slotName === selectedName) ||
          (selectedStage && slotName === selectedStage);
        if (!match) continue;
        if (!String(slot.dj || "").trim() || String(slot.dj || "").toUpperCase().includes("TBD")) continue;

        const fee = slot.fee != null ? Number(slot.fee) : null;
        const profileFee = selectedProfile.fees?.[0]?.amount != null ? Number(selectedProfile.fees[0].amount) : null;
        const displayedFee = fee != null ? fee : profileFee;

        rows.push({
          key: `${event.id}-${slot.id || ""}-${slot.assignmentId || ""}-${slot.role || ""}`,
          date: event.date,
          eventName: event.name,
          role: slot.role,
          start: slot.start,
          end: slot.end,
          fee: displayedFee,
          feeSource: fee != null ? "assignment" : profileFee != null ? "profile" : "unknown",
          stage: event.stage,
        });
      }
    }

    return rows.sort((a, b) => String(b.date).localeCompare(String(a.date)));
  }, [events, selectedProfile]);
  const availabilityWhatsappText = useCallback(
    ({ profile, sets }) => {
      const name = formatDjDisplayName(profile.stageName || profile.name);
      const setLines = sets.map((set) => {
        const date = dayLabelFromISO(set.date);
        const time = set.start && set.end ? formatTimeRange(set.start, set.end, "24") : "TBC";
        return `- ${date} · ${time} · ${set.eventName}${set.stage ? ` · ${set.stage}` : ""}`;
      });
      return [
        `Hi ${name},`,
        `Can you check your availability for ${availabilityMonthLabel}?`,
        "",
        "Sets:",
        ...setLines,
        "",
        "Please let me know which dates you are available for. Thank you!",
      ].join("\n");
    },
    [availabilityMonthLabel],
  );
  const openAvailabilityWhatsApp = useCallback(
    (row) => {
      const url = whatsappLink(row?.profile?.phone, availabilityWhatsappText(row));
      if (!url) {
        onToast?.("Add a phone number to this DJ profile first.", "error");
        return;
      }
      window.open(url, "_blank", "noopener,noreferrer");
    },
    [availabilityWhatsappText, onToast],
  );
  const openAllAvailabilityWhatsApps = useCallback(() => {
    const rowsWithPhones = monthlyAvailabilityRows.filter((row) => whatsappDigits(row.profile.phone));
    if (!rowsWithPhones.length) {
      onToast?.("No scheduled DJs with phone numbers for this month.", "error");
      return;
    }
    rowsWithPhones.forEach((row, index) => {
      window.setTimeout(() => {
        const url = whatsappLink(row.profile.phone, availabilityWhatsappText(row));
        if (url) window.open(url, "_blank", "noopener,noreferrer");
      }, index * 250);
    });
    onToast?.(`Opening ${rowsWithPhones.length} WhatsApp chat${rowsWithPhones.length === 1 ? "" : "s"}.`);
  }, [availabilityWhatsappText, monthlyAvailabilityRows, onToast]);

  const [editOpen, setEditOpen] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    stageName: "",
    realName: "",
    email: "",
    phone: "",
    instagramHandle: "",
    soundcloudUrl: "",
    pressKitUrl: "",
    bio: "",
    homeCity: "",
    country: "",
    status: "Active",
    notes: "",
    linkedUserId: "",
    genresText: "",
    standardFee: "",
  });

  const openEdit = useCallback(() => {
    if (!selectedProfile) return;
    const genresText = selectedProfile.genres.map((g) => g.name).filter(Boolean).join(" / ");
    const standardFee = selectedProfile.fees?.[0]?.amount != null ? String(selectedProfile.fees[0].amount) : "";
    setEditForm({
      name: selectedProfile.name || "",
      stageName: selectedProfile.stageName || "",
      realName: selectedProfile.realName || "",
      email: selectedProfile.email || "",
      phone: selectedProfile.phone || "",
      instagramHandle: selectedProfile.instagramHandle || "",
      soundcloudUrl: selectedProfile.soundcloudUrl || "",
      pressKitUrl: selectedProfile.pressKitUrl || "",
      bio: selectedProfile.bio || "",
      homeCity: selectedProfile.homeCity || "",
      country: selectedProfile.country || "",
      status: selectedProfile.status || "Active",
      notes: selectedProfile.notes || "",
      linkedUserId: selectedProfile.linkedUserId || "",
      genresText,
      standardFee,
    });
    setEditOpen(true);
  }, [selectedProfile]);

  const closeEdit = useCallback(() => {
    if (editSaving) return;
    setEditOpen(false);
  }, [editSaving]);

  const saveEdit = useCallback(async () => {
    if (!selectedProfile) return;
    if (!isSupabaseConfigured) {
      onToast?.("Supabase is not configured.", "error");
      return;
    }
    if (!canEdit) {
      onToast?.("Staff accounts are view-only", "error");
      return;
    }

    const cleanName = canonicalDjName(editForm.name || selectedProfile.name || "Untitled DJ");
    const payload = {
      name: cleanName,
      stage_name: canonicalDjName(editForm.stageName) || null,
      real_name: String(editForm.realName || "").trim() || null,
      email: String(editForm.email || "").trim() || null,
      phone: String(editForm.phone || "").trim() || null,
      instagram_handle: String(editForm.instagramHandle || "").trim() || null,
      soundcloud_url: String(editForm.soundcloudUrl || "").trim() || null,
      press_kit_url: String(editForm.pressKitUrl || "").trim() || null,
      bio: String(editForm.bio || "").trim() || null,
      home_city: String(editForm.homeCity || "").trim() || null,
      country: String(editForm.country || "").trim() || null,
      status: String(editForm.status || "Active").trim() || "Active",
      notes: String(editForm.notes || "").trim() || null,
      linked_user_id: String(editForm.linkedUserId || "").trim() || null,
    };

    const genreTags = splitGenreTags(editForm.genresText).map((t) => t.trim()).filter(Boolean);
    const feeRaw = String(editForm.standardFee || "").trim();
    const feeAmount = feeRaw ? Number.parseFloat(feeRaw.replace(/[^0-9.]/g, "")) : null;

    setEditSaving(true);
    try {
      let djId = isSupabaseUuid(selectedProfile.id) ? String(selectedProfile.id) : "";
      if (!djId) {
        const inserted = await supabase.from("djs").insert({ name: cleanName }).select("id").single();
        if (inserted.error) throw inserted.error;
        djId = String(inserted.data.id);
      }

      const updated = await supabase.from("djs").update(payload).eq("id", djId);
      if (updated.error) throw updated.error;

      if (payload.linked_user_id) {
        const futureLinkedAssignments = await supabase
          .from("event_assignments")
          .select("id, event_slots!inner(events!inner(event_date, status))")
          .eq("dj_id", djId)
          .eq("assignment_status", "Confirmed")
          .eq("event_slots.events.status", "Confirmed")
          .gte("event_slots.events.event_date", isoFromDate(new Date()));
        if (futureLinkedAssignments.error) throw futureLinkedAssignments.error;

        const assignmentIds = (futureLinkedAssignments.data || []).map((row) => row.id).filter(Boolean);
        if (assignmentIds.length) {
          const reopened = await supabase
            .from("event_assignments")
            .update({ assignment_status: "Pending" })
            .in("id", assignmentIds);
          if (reopened.error) throw reopened.error;
        }
      }

      if (genreTags.length) {
        const { error: genreInsertError } = await supabase.from("genres").insert(genreTags.map((name) => ({ name })));
        if (genreInsertError && !String(genreInsertError.message || "").toLowerCase().includes("duplicate")) throw genreInsertError;

        const genresAll = await supabase.from("genres").select("id, name");
        if (genresAll.error) throw genresAll.error;
        const byLower = new Map((genresAll.data || []).map((g) => [String(g.name || "").toLowerCase(), String(g.id)]));
        const genreIds = genreTags.map((t) => byLower.get(String(t).toLowerCase())).filter(Boolean);

        const deleted = await supabase.from("dj_genres").delete().eq("dj_id", djId);
        if (deleted.error) throw deleted.error;

        if (genreIds.length) {
          const rows = genreIds.map((genreId, index) => ({ dj_id: djId, genre_id: genreId, is_primary: index === 0 }));
          const insertedLinks = await supabase.from("dj_genres").insert(rows);
          if (insertedLinks.error) throw insertedLinks.error;
        }
      }

      if (feeAmount != null && Number.isFinite(feeAmount) && feeAmount >= 0) {
        const existingFee = await supabase
          .from("dj_fees")
          .select("id")
          .eq("dj_id", djId)
          .eq("fee_name", "Standard")
          .eq("is_active", true)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (existingFee.error) throw existingFee.error;

        if (existingFee.data?.id) {
          const feeUpdate = await supabase.from("dj_fees").update({ amount: feeAmount, currency_code: "MYR", fee_type: "per_set", is_active: true }).eq("id", existingFee.data.id);
          if (feeUpdate.error) throw feeUpdate.error;
        } else {
          const feeInsert = await supabase.from("dj_fees").insert({ dj_id: djId, fee_name: "Standard", currency_code: "MYR", amount: feeAmount, fee_type: "per_set", is_active: true });
          if (feeInsert.error) throw feeInsert.error;
        }
      }

      onLogActivity?.({
        action: "dj_profile_updated",
        entityType: "dj",
        entityId: djId,
        message: `DJ profile updated · ${cleanName}`,
        meta: { djId, name: cleanName },
      });
      await onRefreshProfiles?.();
      if (djId && djId !== selectedProfile.id) setSelectedId(djId);
      onToast?.("DJ profile saved");
      setEditOpen(false);
    } catch (e) {
      onToast?.(e?.message || "Failed to save DJ profile", "error");
    } finally {
      setEditSaving(false);
    }
  }, [canEdit, editForm, onLogActivity, onRefreshProfiles, onToast, selectedProfile]);

  return (
    <section className="space-y-4">
      <div className="flex gap-1">
        {[["profiles", "DJ Profiles"], ["whatsapp", "WhatsApp"]].map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`rounded-lg border px-3 py-2 text-xs font-black transition ${
              tab === key ? "border-emerald-300/40 bg-emerald-400/15 text-emerald-100" : "border-white/10 bg-white/5 text-white/40 hover:bg-white/10 hover:text-white"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "whatsapp" ? (
        <div className="rounded-2xl border border-white/10 bg-[#12111f] p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-[10px] font-black uppercase tracking-[0.24em] text-white/30">Monthly WhatsApp Availability</div>
              <div className="mt-1 text-xl font-black text-white">{availabilityMonthLabel}</div>
              <div className="mt-1 text-xs font-bold text-white/40">
                {monthlyAvailabilityRows.length} DJ{monthlyAvailabilityRows.length === 1 ? "" : "s"} scheduled this month
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                onClick={() => {
                  const next = new Date(availabilityMonthDate.getFullYear(), availabilityMonthDate.getMonth() - 1, 1);
                  setAvailabilityMonth(monthInputValueFromDate(next));
                }}
                title="Previous month"
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 p-0 text-white/60 hover:bg-white/10 hover:text-white"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <input
                type="month"
                value={availabilityMonth}
                onChange={(event) => setAvailabilityMonth(event.target.value || monthInputValueFromDate(new Date()))}
                className="h-10 rounded-xl border border-white/10 bg-black/20 px-3 text-sm font-black text-white outline-none focus:border-purple-300/60"
              />
              <Button
                onClick={() => {
                  const next = new Date(availabilityMonthDate.getFullYear(), availabilityMonthDate.getMonth() + 1, 1);
                  setAvailabilityMonth(monthInputValueFromDate(next));
                }}
                title="Next month"
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 p-0 text-white/60 hover:bg-white/10 hover:text-white"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                onClick={openAllAvailabilityWhatsApps}
                disabled={!monthlyAvailabilityRows.some((row) => whatsappDigits(row.profile.phone))}
                className="h-10 rounded-xl bg-emerald-400 px-4 text-xs font-black text-black hover:bg-emerald-300 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/35"
              >
                Open All WhatsApps
              </Button>
            </div>
          </div>

          <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {monthlyAvailabilityRows.map((row) => {
              const displayName = row.profile.stageName || row.profile.name;
              const hasPhone = Boolean(whatsappDigits(row.profile.phone));
              const firstSet = row.sets[0];
              return (
                <div key={row.profile.id} className="rounded-xl border border-white/10 bg-black/20 px-3 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedId(row.profile.id);
                          setTab("profiles");
                        }}
                        className="truncate text-left text-sm font-black text-white hover:text-purple-100"
                        title="Open DJ profile"
                      >
                        {displayName}
                      </button>
                      <div className="mt-1 text-[11px] font-bold text-white/45">
                        {row.sets.length} set{row.sets.length === 1 ? "" : "s"}
                        {firstSet ? ` · ${dayLabelFromISO(firstSet.date)}` : ""}
                      </div>
                    </div>
                    <Button
                      onClick={() => openAvailabilityWhatsApp(row)}
                      disabled={!hasPhone}
                      title={hasPhone ? "Send WhatsApp availability request" : "Add DJ phone in profile first"}
                      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-emerald-300/20 bg-emerald-400/10 p-0 text-emerald-100 hover:bg-emerald-400/20 disabled:cursor-not-allowed disabled:border-white/10 disabled:bg-white/5 disabled:text-white/25"
                    >
                      <MessageCircle className="h-4 w-4" />
                      <span className="sr-only">Send WhatsApp</span>
                    </Button>
                  </div>
                  <div className="mt-3 space-y-1.5">
                    {row.sets.slice(0, 3).map((set) => (
                      <div key={set.key} className="flex items-center justify-between gap-2 text-[11px] font-bold text-white/50">
                        <span className="truncate">{set.eventName}</span>
                        <span className="shrink-0 text-cyan-100/75">{set.start && set.end ? formatTimeRange(set.start, set.end, "24") : "TBC"}</span>
                      </div>
                    ))}
                    {row.sets.length > 3 ? (
                      <div className="text-[11px] font-black text-white/30">+{row.sets.length - 3} more</div>
                    ) : null}
                  </div>
                </div>
              );
            })}

            {!monthlyAvailabilityRows.length ? (
              <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-8 text-center text-sm font-bold text-white/35 md:col-span-2 xl:col-span-3">
                No DJ sets found for {availabilityMonthLabel}.
              </div>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="rounded-2xl border border-white/10 bg-[#12111f] p-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.24em] text-white/30">DJ Directory</div>
            <div className="mt-1 text-lg font-black text-white">{availableProfiles.length} DJs</div>
          </div>
          {loading ? <RefreshCcw className="h-4 w-4 animate-spin text-purple-200" /> : null}
        </div>

        <div className="mt-3 flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-white/40">
          <Search className="h-4 w-4 shrink-0" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search DJs..."
            className="w-full bg-transparent text-sm font-bold text-white outline-none placeholder:text-white/30"
          />
        </div>

        <div className="mt-3 max-h-[62svh] space-y-2 overflow-auto pr-1">
          {filteredProfiles.map((profile) => {
            const active = selectedProfile?.id === profile.id;
            const primaryGenre = profile.genres.find((genre) => genre.isPrimary)?.name || profile.genres[0]?.name || "No genre";
            return (
              <button
                key={profile.id}
                onClick={() => setSelectedId(profile.id)}
                className={`w-full rounded-xl border px-3 py-3 text-left transition ${
                  active ? "border-purple-300/60 bg-purple-400/15" : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]"
                }`}
              >
                <div className="truncate text-sm font-black text-white">{profile.stageName || profile.name}</div>
                <div className="mt-1 flex items-center justify-between gap-2">
                  <span className="truncate text-[11px] font-bold text-white/40">{primaryGenre}</span>
                  {profile.fees.length ? (
                    <span className="shrink-0 rounded-full border border-emerald-300/20 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-black text-emerald-100">
                      {profile.fees.length} fee{profile.fees.length === 1 ? "" : "s"}
                    </span>
                  ) : null}
                </div>
              </button>
            );
          })}

          {!filteredProfiles.length ? (
            <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-8 text-center text-sm font-bold text-white/35">
              No DJs match that search.
            </div>
          ) : null}
        </div>
      </aside>

      <div className="min-w-0 rounded-2xl border border-white/10 bg-[#12111f] p-4 sm:p-5">
        {error ? (
          <div className="mb-4 rounded-xl border border-yellow-300/20 bg-yellow-400/10 px-3 py-2 text-xs font-bold text-yellow-100">
            {error}
          </div>
        ) : null}

        {selectedProfile ? (
          <div className="space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="text-[10px] font-black uppercase tracking-[0.24em] text-purple-200/70">{selectedProfile.status}</div>
                <h2 className="mt-1 truncate text-3xl font-black tracking-tight text-white sm:text-4xl">
                  {selectedProfile.stageName || selectedProfile.name}
                </h2>
                {selectedProfile.realName && selectedProfile.realName !== selectedProfile.name ? (
                  <div className="mt-1 text-sm font-bold text-white/45">{selectedProfile.realName}</div>
                ) : null}
              </div>
              <div className="flex items-start gap-2">
                {canEdit ? (
                  <Button
                    onClick={openEdit}
                    title="Edit DJ profile"
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                  >
                    <Pencil className="h-4 w-4" />
                    <span className="sr-only">Edit</span>
                  </Button>
                ) : null}
                <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-right">
                  <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Active Fees</div>
                  <div className="mt-1 text-xl font-black text-emerald-100">{selectedProfile.fees.length}</div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {selectedProfile.genres.length ? (
                selectedProfile.genres.map((genre) => (
                  <span key={genre.id} className={`rounded-full border px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] ${genreTagClass(genre.name)}`}>
                    {genre.name}
                    {genre.isPrimary ? <span className="ml-1 text-white/45">Primary</span> : null}
                  </span>
                ))
              ) : (
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-white/35">
                  No genres saved
                </span>
              )}
            </div>

            <div className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_300px]">
              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="text-[10px] font-black uppercase tracking-[0.24em] text-white/30">Fees</div>
                <div className="mt-3 grid gap-2">
                  {selectedProfile.fees.length ? (
                    selectedProfile.fees.map((fee) => (
                      <div key={fee.id} className="rounded-xl border border-emerald-300/15 bg-emerald-400/10 px-3 py-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="text-sm font-black text-white">{fee.name}</div>
                          <div className="text-sm font-black text-emerald-100">{formatDjFee(fee)}</div>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-bold text-white/45">
                          {fee.setLengthMinutes ? <span>{fee.setLengthMinutes} min set</span> : null}
                          {fee.minBookingHours ? <span>{fee.minBookingHours} hr minimum</span> : null}
                          {fee.validFrom || fee.validUntil ? <span>{fee.validFrom || "Any"} - {fee.validUntil || "Open"}</span> : null}
                        </div>
                        {fee.notes ? <div className="mt-2 text-xs font-bold text-white/50">{fee.notes}</div> : null}
                      </div>
                    ))
                  ) : (
                    <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-8 text-center text-sm font-bold text-white/35">
                      No fees saved for this DJ.
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="text-[10px] font-black uppercase tracking-[0.24em] text-white/30">Profile</div>
                <div className="mt-3 space-y-3 text-sm">
                  {[
                  ["Email", selectedProfile.email],
                  ["Linked User", mentionUsers.find((user) => user.id === selectedProfile.linkedUserId)?.email || selectedProfile.linkedUserId],
                  ["Phone", selectedProfile.phone],
                    ["Instagram", selectedProfile.instagramHandle],
                    ["City", [selectedProfile.homeCity, selectedProfile.country].filter(Boolean).join(", ")],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <div className="text-[10px] font-black uppercase tracking-[0.18em] text-white/25">{label}</div>
                      <div className="mt-0.5 break-words font-bold text-white/70">{value || "-"}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="text-[10px] font-black uppercase tracking-[0.24em] text-white/30">History</div>
                <div className="text-[10px] font-black text-white/35">{historyRows.length} gigs</div>
              </div>
              <div className="mt-3 grid gap-2">
                {historyRows.slice(0, 40).map((row) => (
                  <div key={row.key} className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-[10px] font-black uppercase tracking-[0.18em] text-white/35">{dayLabelFromISO(row.date)}</div>
                        <div className="mt-1 oa-clamp-2 text-sm font-black text-white/80">{row.eventName}</div>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] font-bold text-white/45">
                          <span className="rounded-full border border-white/10 bg-black/20 px-2 py-0.5">{row.role}</span>
                          {row.start && row.end ? <span>{formatTimeRange(row.start, row.end, "24")}</span> : null}
                          {row.stage ? <span>{row.stage}</span> : null}
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="text-[10px] font-black uppercase tracking-[0.18em] text-white/35">Fee</div>
                        <div className="mt-0.5 text-sm font-black text-emerald-100">
                          {row.fee != null ? currency(row.fee, "MYR") : "—"}
                        </div>
                        <div className="text-[10px] font-black text-white/25">
                          {row.feeSource === "assignment" ? "day" : row.feeSource === "profile" ? "profile" : ""}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {!historyRows.length ? (
                  <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-8 text-center text-sm font-bold text-white/35">
                    No history yet for this DJ.
                  </div>
                ) : null}
              </div>
            </div>

            {selectedProfile.bio || selectedProfile.notes ? (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm font-bold leading-6 text-white/60">
                {selectedProfile.bio || selectedProfile.notes}
              </div>
            ) : null}
          </div>
        ) : (
          <div className="flex min-h-[360px] items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-center text-sm font-bold text-white/35">
            No DJ profiles yet.
          </div>
        )}
      </div>
        </div>
      )}
      {editOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-2 backdrop-blur-sm sm:p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeEdit();
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.18 }}
            className="oa-modal-panel flex max-h-[calc(100svh-0.75rem)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-[#16152a] to-[#0a0912] text-white shadow-2xl shadow-black/60 sm:max-h-[calc(100svh-1.5rem)] sm:rounded-3xl"
          >
            <div className="oa-modal-header flex items-start justify-between gap-3 border-b border-white/10 px-3 py-3 sm:px-6 sm:py-5">
              <div>
                <div className="text-base font-black tracking-tight sm:text-xl">Edit DJ Profile</div>
                <div className="mt-1 text-[10px] font-black uppercase tracking-[0.14em] text-white/35 sm:text-[11px] sm:tracking-[0.2em]">
                  {selectedProfile?.stageName || selectedProfile?.name}
                </div>
              </div>
              <button
                onClick={closeEdit}
                className="rounded-xl border border-white/10 bg-white/5 p-2 text-white/50 hover:bg-white/10 hover:text-white"
                disabled={editSaving}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="oa-modal-body min-h-0 flex-1 space-y-4 overflow-y-auto px-3 py-3 sm:px-6 sm:py-5">
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  ["Name", "name"],
                  ["Stage Name", "stageName"],
                  ["Real Name", "realName"],
                  ["Email", "email"],
                  ["Phone", "phone"],
                  ["Instagram", "instagramHandle"],
                  ["Soundcloud", "soundcloudUrl"],
                  ["Press Kit", "pressKitUrl"],
                  ["City", "homeCity"],
                  ["Country", "country"],
                ].map(([label, key]) => (
                  <label key={key} className="block">
                    <span className="text-[10px] font-black uppercase tracking-[0.22em] text-white/30">{label}</span>
                    <input
                      value={editForm[key]}
                      onChange={(e) => setEditForm((p) => ({ ...p, [key]: e.target.value }))}
                      className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm font-black text-white outline-none focus:border-purple-300/60"
                    />
                  </label>
                ))}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="text-[10px] font-black uppercase tracking-[0.22em] text-white/30">Status</span>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm((p) => ({ ...p, status: e.target.value }))}
                    className="mt-1 h-12 w-full rounded-xl border border-white/10 bg-black/20 px-4 text-sm font-black text-white outline-none focus:border-purple-300/60"
                  >
                    {["Active", "Inactive", "Do Not Book"].map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="text-[10px] font-black uppercase tracking-[0.22em] text-white/30">Standard Fee (MYR)</span>
                  <input
                    value={editForm.standardFee}
                    onChange={(e) => setEditForm((p) => ({ ...p, standardFee: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm font-black text-white outline-none focus:border-purple-300/60"
                    placeholder="e.g. 800"
                  />
                </label>
              </div>

              <label className="block">
                <span className="text-[10px] font-black uppercase tracking-[0.22em] text-white/30">Linked Dashboard User</span>
                <select
                  value={editForm.linkedUserId}
                  onChange={(e) => setEditForm((p) => ({ ...p, linkedUserId: e.target.value }))}
                  className="mt-1 h-12 w-full rounded-xl border border-white/10 bg-black/20 px-4 text-sm font-black text-white outline-none focus:border-purple-300/60"
                >
                  <option value="">Not linked</option>
                  {djUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {displayNameForUser(user) || user.email} {user.role ? `(${user.role})` : ""}
                    </option>
                  ))}
                </select>
                {!djUsers.length ? (
                  <div className="mt-2 text-xs font-bold text-yellow-100/70">
                    No DJ users yet. Assign the DJ role in User Management first.
                  </div>
                ) : null}
              </label>

              <label className="block">
                <span className="text-[10px] font-black uppercase tracking-[0.22em] text-white/30">Genres</span>
                <input
                  value={editForm.genresText}
                  onChange={(e) => setEditForm((p) => ({ ...p, genresText: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm font-black text-white outline-none focus:border-purple-300/60"
                  placeholder="TECHNO / TRANCE / HARD TECHNO"
                />
              </label>

              <label className="block">
                <span className="text-[10px] font-black uppercase tracking-[0.22em] text-white/30">Bio</span>
                <textarea
                  value={editForm.bio}
                  onChange={(e) => setEditForm((p) => ({ ...p, bio: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm font-bold text-white outline-none focus:border-purple-300/60"
                />
              </label>

              <label className="block">
                <span className="text-[10px] font-black uppercase tracking-[0.22em] text-white/30">Notes</span>
                <textarea
                  value={editForm.notes}
                  onChange={(e) => setEditForm((p) => ({ ...p, notes: e.target.value }))}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm font-bold text-white outline-none focus:border-purple-300/60"
                />
              </label>
            </div>

            <div className="oa-modal-footer flex items-center justify-end gap-2 border-t border-white/10 px-3 py-3 sm:px-6 sm:py-4">
              <Button
                onClick={closeEdit}
                disabled={editSaving}
                className="h-11 rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-black text-white/70 hover:bg-white/10 hover:text-white disabled:opacity-60"
              >
                Cancel
              </Button>
              <Button
                onClick={saveEdit}
                disabled={editSaving}
                className="h-11 rounded-xl bg-purple-400 px-5 text-sm font-black text-black hover:bg-purple-300 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/35"
              >
                {editSaving ? "Saving..." : "Save"}
              </Button>
            </div>
          </motion.div>
        </div>
      ) : null}
    </section>
  );
}

function PublicEventCard({ event }) {
  const slots = event.slots ?? [];
  const displaySlotName = (slot) => (slot.role === "MC" ? String(slot.dj || "").replace(/^MC\s+/i, "").trim() : slot.dj);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-4 shadow-xl shadow-black/20 backdrop-blur">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.22em] text-purple-200/70">{dayLabelFromISO(event.date)}</div>
          <h3 className="mt-1 text-xl font-black tracking-tight text-white">{event.name}</h3>
        </div>
        <span className={`shrink-0 rounded-full border px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${statusClass(event.status)}`}>
          {statusLabel(event.status)}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {splitGenreTags(event.genre).slice(0, 4).map((genre) => (
          <span key={genre} className={`rounded-full border px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${genreTagClass(genre)}`}>
            {genre}
          </span>
        ))}
      </div>

      {slots.length ? (
        <div className="mt-4 grid gap-2">
          {slots.map((slot, index) => (
            <div
              key={`${event.id}-${index}`}
              className={`rounded-xl border px-3 py-2 ${
                slot.role === "MC" ? "border-purple-300/20 bg-purple-400/10" : "border-cyan-300/15 bg-cyan-400/10"
              }`}
            >
              <div className={`text-[9px] font-black uppercase tracking-[0.16em] ${slot.role === "MC" ? "text-purple-100/70" : "text-cyan-100/65"}`}>
                {slot.role}
              </div>
              <div className="mt-1 text-sm font-black text-white">{displaySlotName(slot)}</div>
              {slotNeedsTime(slot) && slot.start && slot.end ? (
                <div className="mt-1 inline-flex items-center gap-1 rounded-lg border border-cyan-300/20 bg-black/20 px-2 py-1 text-xs font-black text-cyan-100">
                  <Clock className="h-3.5 w-3.5" />
                  {slot.start}-{slot.end}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-sm font-bold text-white/40">Lineup coming soon.</div>
      )}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs font-black uppercase tracking-[0.18em] text-white/35">
        <span>{event.stage}</span>
        <span>{slots.length} set{slots.length === 1 ? "" : "s"}</span>
      </div>
    </div>
  );
}

function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState("");
  const [showRegisterConfirmPassword, setShowRegisterConfirmPassword] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [authBusy, setAuthBusy] = useState(false);
  const [error, setError] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [loginOpen, setLoginOpen] = useState(false);
  const [publicEvents, setPublicEvents] = useState(() => (isSupabaseConfigured ? [] : eventsSeed.map((event) => ({ ...event, id: String(event.id) }))));
  const [publicLoading, setPublicLoading] = useState(isSupabaseConfigured);
  const [publicSyncError, setPublicSyncError] = useState("");
  const [publicLastSync, setPublicLastSync] = useState("");
  const todayISO = useMemo(() => isoFromDate(new Date()), []);
  const publicWeekDates = useMemo(() => weekWedToSat(todayISO).map(isoFromDate), [todayISO]);
  const weekStartISO = publicWeekDates[0];
  const weekEndISO = publicWeekDates[publicWeekDates.length - 1];
  const loadPublicEvents = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    setPublicLoading(true);

    const { data, error: loadError } = await runEventSelect((select) =>
      supabase
        .from("events")
        .select(select)
        .gte("event_date", weekStartISO)
        .lte("event_date", weekEndISO)
        .order("event_date", { ascending: true })
        .order("slot_order", { foreignTable: "event_slots", ascending: true })
    );

    setPublicLoading(false);
    if (loadError || !Array.isArray(data)) {
      setPublicSyncError(loadError?.message || "Could not load live lineup.");
      return;
    }

    setPublicSyncError("");
    setPublicEvents(data.filter((row) => row?.event_date).map(mapSupabaseEvent));
    setPublicLastSync(new Date().toLocaleTimeString("en-MY", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
  }, [weekEndISO, weekStartISO]);

  const submit = (event) => {
    event.preventDefault();
    if (!isSupabaseConfigured) {
      setError("Supabase is not configured for real login.");
      return;
    }

    (async () => {
      setAuthBusy(true);
      setError("");
      setAuthMessage("");
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (signInError) setError(signInError.message || "Could not log in");
      setAuthBusy(false);
    })();
  };

  const register = (event) => {
    event.preventDefault();
    if (!isSupabaseConfigured) {
      setError("Supabase is not configured for real registration.");
      return;
    }
    if (registerPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (registerPassword !== registerConfirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    (async () => {
      setAuthBusy(true);
      setError("");
      setAuthMessage("");
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: registerEmail.trim(),
        password: registerPassword,
        options: {
          emailRedirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
          data: {
            display_name: registerName.trim(),
          },
        },
      });

      if (signUpError) {
        setError(signUpError.message || "Could not create account.");
        setAuthBusy(false);
        return;
      }

      setRegisterName("");
      setRegisterEmail("");
      setRegisterPassword("");
      setRegisterConfirmPassword("");
      setAuthMessage(data?.session ? "Account created. Please contact the admin to approve your email." : "Account created. Check your email to confirm, then please contact the admin to approve your email.");
      setAuthMode("login");
      setAuthBusy(false);
    })();
  };

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let refreshTimer = null;
    const scheduleRefresh = () => {
      if (refreshTimer) window.clearTimeout(refreshTimer);
      refreshTimer = window.setTimeout(loadPublicEvents, 250);
    };

    loadPublicEvents();
    const channel = supabase
      .channel("oa-public-events-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "events" }, scheduleRefresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "event_slots" }, scheduleRefresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "event_assignments" }, scheduleRefresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "djs" }, scheduleRefresh)
      .subscribe((status) => {
        if (status === "SUBSCRIBED") setPublicSyncError("");
      });

    return () => {
      if (refreshTimer) window.clearTimeout(refreshTimer);
      supabase.removeChannel(channel);
    };
  }, [loadPublicEvents]);

  const weekEvents = useMemo(() => {
    return publicEvents
      .filter((event) => publicWeekDates.includes(event.date))
      .sort((a, b) => a.date.localeCompare(b.date) || (a.name || "").localeCompare(b.name || ""));
  }, [publicEvents, publicWeekDates]);

  const displayEvents = weekEvents;
  const weekLabel = `${dayLabelFromISO(weekStartISO)} - ${dayLabelFromISO(weekEndISO)}`;

  return (
    <div className="min-h-[100svh] bg-[#080711] text-white">
      <div className="mx-auto flex min-h-[100svh] max-w-[1320px] flex-col px-4 py-4 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between gap-3">
          <div className="text-3xl font-black tracking-tight">
            O<span className="text-purple-300">&</span>A
          </div>
          <Button
            onClick={() => {
              setAuthMode("login");
              setError("");
              setAuthMessage("");
              setLoginOpen(true);
            }}
            className="h-10 rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-black text-white/70 hover:bg-purple-400 hover:text-black"
          >
            Login
          </Button>
        </header>

        <main className="grid flex-1 gap-8 py-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:py-12">
          <section>
            <div className="text-[11px] font-black uppercase tracking-[0.26em] text-purple-200/70">This week at O&A</div>
            <h1 className="mt-4 max-w-2xl text-4xl font-black tracking-tight text-white sm:text-6xl">
              What’s happening this week
            </h1>
            <div className="mt-6 inline-flex rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-black text-white/65">
              <CalendarDays className="mr-2 h-5 w-5 text-purple-200" />
              {weekLabel}
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-[#0d0c17] p-3 shadow-2xl shadow-black/40 sm:p-4">
            <div className="mb-3 flex flex-wrap items-center justify-end gap-2 rounded-2xl border border-emerald-300/15 bg-emerald-400/10 px-4 py-3">
              <div className="text-[10px] font-black uppercase tracking-[0.16em] text-white/45">
                {publicLoading ? "Syncing..." : `${displayEvents.length} events${publicLastSync ? ` • Updated ${publicLastSync}` : ""}`}
              </div>
            </div>
            {publicSyncError ? (
              <div className="mb-3 rounded-2xl border border-rose-300/25 bg-rose-500/10 px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-rose-100">
                Live lineup issue: {publicSyncError}
              </div>
            ) : null}
            <div className="grid gap-3 md:grid-cols-2">
              {publicLoading && !displayEvents.length ? (
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-10 text-center text-sm font-bold text-white/40 md:col-span-2">
                  Loading live lineup...
                </div>
              ) : displayEvents.length ? (
                displayEvents.map((event) => <PublicEventCard key={event.id} event={event} />)
              ) : (
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-10 text-center text-sm font-bold text-white/40 md:col-span-2">
                  No live events published for this week yet.
                </div>
              )}
            </div>
          </section>
        </main>
      </div>

      {loginOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-2 backdrop-blur-sm sm:p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setLoginOpen(false);
          }}
        >
          <form
            onSubmit={authMode === "login" ? submit : register}
            className="max-h-[calc(100svh-0.75rem)] w-full max-w-sm overflow-y-auto rounded-2xl border border-white/10 bg-[#0d0c17] p-4 shadow-2xl shadow-black/50 sm:max-h-[90vh] sm:rounded-3xl sm:p-6"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-3xl font-black tracking-tight">
                  O<span className="text-purple-300">&</span>A
                </div>
                <div className="mt-2 text-[11px] font-black uppercase tracking-[0.22em] text-white/35">
                  {authMode === "login" ? "Dashboard Login" : "Create Account"}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setLoginOpen(false)}
                className="rounded-xl border border-white/10 bg-white/5 p-2 text-white/50 hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-1 rounded-2xl border border-white/10 bg-white/[0.03] p-1">
              {[
                { key: "login", label: "Login" },
                { key: "register", label: "Register" },
              ].map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => {
                    setAuthMode(item.key);
                    setError("");
                    setAuthMessage("");
                  }}
                  className={`h-10 rounded-xl text-sm font-black transition ${
                    authMode === item.key ? "bg-purple-400 text-black" : "text-white/45 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            {authMode === "login" ? (
              <div className="mt-5 space-y-3">
                <label className="block">
                  <span className="text-[10px] font-black uppercase tracking-[0.22em] text-white/30">Email</span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm font-black text-white outline-none focus:border-purple-300/60"
                    placeholder="Email"
                    autoComplete="email"
                    required
                  />
                </label>

                <label className="block">
                  <span className="text-[10px] font-black uppercase tracking-[0.22em] text-white/30">Password</span>
                  <div className="relative mt-1">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 pr-11 text-sm font-black text-white outline-none focus:border-purple-300/60"
                      placeholder="Password"
                      autoComplete="current-password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-2 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/55 hover:bg-white/10 hover:text-white"
                      title={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </label>
              </div>
            ) : (
              <div className="mt-5 space-y-3">
                <label className="block">
                  <span className="text-[10px] font-black uppercase tracking-[0.22em] text-white/30">Name</span>
                  <input
                    value={registerName}
                    onChange={(e) => setRegisterName(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm font-black text-white outline-none focus:border-purple-300/60"
                    placeholder="Name"
                    autoComplete="name"
                  />
                </label>

                <label className="block">
                  <span className="text-[10px] font-black uppercase tracking-[0.22em] text-white/30">Email</span>
                  <input
                    type="email"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm font-black text-white outline-none focus:border-purple-300/60"
                    placeholder="Email"
                    autoComplete="email"
                    required
                  />
                </label>

                <label className="block">
                  <span className="text-[10px] font-black uppercase tracking-[0.22em] text-white/30">Password</span>
                  <div className="relative mt-1">
                    <input
                      type={showRegisterPassword ? "text" : "password"}
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 pr-11 text-sm font-black text-white outline-none focus:border-purple-300/60"
                      placeholder="Password"
                      autoComplete="new-password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegisterPassword((prev) => !prev)}
                      className="absolute right-2 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/55 hover:bg-white/10 hover:text-white"
                      title={showRegisterPassword ? "Hide password" : "Show password"}
                    >
                      {showRegisterPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </label>

                <label className="block">
                  <span className="text-[10px] font-black uppercase tracking-[0.22em] text-white/30">Confirm Password</span>
                  <div className="relative mt-1">
                    <input
                      type={showRegisterConfirmPassword ? "text" : "password"}
                      value={registerConfirmPassword}
                      onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 pr-11 text-sm font-black text-white outline-none focus:border-purple-300/60"
                      placeholder="Confirm Password"
                      autoComplete="new-password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegisterConfirmPassword((prev) => !prev)}
                      className="absolute right-2 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/55 hover:bg-white/10 hover:text-white"
                      title={showRegisterConfirmPassword ? "Hide password" : "Show password"}
                    >
                      {showRegisterConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </label>
              </div>
            )}

            {error ? <div className="mt-3 rounded-xl border border-rose-300/30 bg-rose-500/10 px-3 py-2 text-xs font-bold text-rose-100">{error}</div> : null}
            {authMessage ? <div className="mt-3 rounded-xl border border-emerald-300/30 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-100">{authMessage}</div> : null}

            <Button
              type="submit"
              disabled={authBusy}
              className="mt-5 h-11 w-full rounded-xl bg-purple-400 text-sm font-black text-black hover:bg-purple-300 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/35"
            >
              {authBusy ? "Please wait..." : authMode === "login" ? "Login" : "Create Account"}
            </Button>
          </form>
        </div>
      ) : null}
    </div>
  );
}

function UserManagementPage({ onToast, onLogActivity }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [users, setUsers] = useState([]);
  const [savingUserId, setSavingUserId] = useState(null);
  const [passwordModalUser, setPasswordModalUser] = useState(null);
  const [passwordDraft, setPasswordDraft] = useState("");
  const [showPasswordDraft, setShowPasswordDraft] = useState(false);
  const [roleByUserId, setRoleByUserId] = useState({});

  const adminApiRequest = useCallback(async (path, { method = "GET", body } = {}) => {
    return dashboardApiRequest(path, { method, body });
  }, []);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const payload = await adminApiRequest("/api/admin/users");
      const nextUsers = Array.isArray(payload?.users) ? payload.users : [];
      setUsers(nextUsers);
      setRoleByUserId((prev) => {
        const next = { ...prev };
        for (const u of nextUsers) next[u.id] = u.role || "";
        return next;
      });
    } catch (e) {
      setError(e?.message || "Failed to load users.");
    } finally {
      setLoading(false);
    }
  }, [adminApiRequest]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const { pendingUsers, approvedUsers } = useMemo(() => {
    const sorted = [...users].sort((a, b) => {
      const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
      if (aTime !== bTime) return bTime - aTime;
      return String(a.email || "").localeCompare(String(b.email || ""));
    });
    return {
      pendingUsers: sorted.filter((user) => !String(user.role || "").trim()),
      approvedUsers: sorted
        .filter((user) => String(user.role || "").trim())
        .sort((a, b) => String(a.email || "").localeCompare(String(b.email || ""))),
    };
  }, [users]);

  const updateUserRole = async (userId) => {
    const nextRole = String(roleByUserId[userId] || "").trim();
    setSavingUserId(userId);
    setError("");
    try {
      await adminApiRequest("/api/admin/set-role", {
        method: "POST",
        body: { userId, role: nextRole || null },
      });
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: nextRole || null } : u)));
      onToast?.("Role updated");
      onLogActivity?.({
        action: "user_role_updated",
        entityType: "user",
        entityId: userId,
        meta: { role: nextRole || null },
      });
    } catch (e) {
      setError(e?.message || "Failed to update role.");
    } finally {
      setSavingUserId(null);
    }
  };

  const openPasswordModal = (user) => {
    setPasswordModalUser(user);
    setPasswordDraft("");
    setShowPasswordDraft(false);
    setError("");
  };

  const closePasswordModal = () => {
    if (savingUserId) return;
    setPasswordModalUser(null);
    setPasswordDraft("");
    setShowPasswordDraft(false);
  };

  const setUserPassword = async () => {
    const userId = passwordModalUser?.id;
    const password = String(passwordDraft || "");
    if (!userId) return;
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setSavingUserId(userId);
    setError("");
    try {
      await adminApiRequest("/api/admin/set-password", {
        method: "POST",
        body: { userId, password },
      });
      closePasswordModal();
      onToast?.("Password updated");
      onLogActivity?.({
        action: "user_password_updated",
        entityType: "user",
        entityId: userId,
        meta: {},
      });
    } catch (e) {
      setError(e?.message || "Failed to set password.");
    } finally {
      setSavingUserId(null);
    }
  };

  const renderUserGroup = (items, { emptyLabel, tone = "default" } = {}) => {
    if (loading) {
      return <div className="px-4 py-8 text-center text-sm font-bold text-white/35">Loading users...</div>;
    }
    if (!items.length) {
      return <div className="px-4 py-8 text-center text-sm font-bold text-white/35">{emptyLabel}</div>;
    }

    return (
      <div className="grid gap-3">
        {items.map((u) => {
          const currentRole = roleByUserId[u.id] ?? u.role ?? "";
          const busy = savingUserId === u.id;
          const isPending = !String(u.role || "").trim();
          return (
            <div
              key={u.id}
              className={`rounded-2xl border px-3 py-3 sm:px-4 ${
                tone === "pending" ? "border-yellow-300/20 bg-yellow-400/10" : "border-white/10 bg-white/[0.03]"
              }`}
            >
              <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.75fr)] lg:items-center">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="min-w-0 truncate text-sm font-black text-white/85">{u.email || "(no email)"}</div>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] ${
                        isPending ? "border-yellow-300/30 bg-yellow-400/10 text-yellow-100" : "border-emerald-300/25 bg-emerald-400/10 text-emerald-100"
                      }`}
                    >
                      {isPending ? "Needs approval" : u.role}
                    </span>
                  </div>
                  <div className="mt-1 truncate text-xs font-bold text-white/35">{u.id}</div>
                  <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-bold text-white/30">
                    <span>Created {u.created_at ? new Date(u.created_at).toLocaleDateString() : "-"}</span>
                    <span>{u.last_sign_in_at ? `Last sign-in ${new Date(u.last_sign_in_at).toLocaleDateString()}` : "Never signed in"}</span>
                  </div>
                </div>

                <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_88px_132px]">
                  <select
                    value={currentRole}
                    onChange={(e) => setRoleByUserId((prev) => ({ ...prev, [u.id]: e.target.value }))}
                    className="h-10 rounded-xl border border-white/10 bg-white/5 px-3 text-xs font-black text-white/70 outline-none hover:bg-white/10 focus:border-purple-300/60"
                  >
                    <option value="">Unassigned</option>
                    <option value="staff">staff</option>
                    <option value="dj">dj</option>
                    <option value="admin">admin</option>
                    <option value="superadmin">superadmin</option>
                  </select>
                  <Button
                    onClick={() => updateUserRole(u.id)}
                    disabled={busy}
                    className="h-10 rounded-xl bg-purple-400 text-xs font-black text-black hover:bg-purple-300 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/35"
                  >
                    Save
                  </Button>
                  <Button
                    onClick={() => openPasswordModal(u)}
                    disabled={busy}
                    className="h-10 rounded-xl border border-emerald-300/25 bg-emerald-400/10 text-xs font-black text-emerald-100 hover:bg-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Set Password
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-lg font-black tracking-tight text-white/90">User Management</div>
          <div className="mt-1 text-xs font-bold text-white/35">Approve new accounts first, then manage active users.</div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={loadUsers}
            disabled={loading}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 text-xs font-black text-white/55 hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCcw className="h-4 w-4" /> Refresh
          </Button>
        </div>
      </div>

      {error ? <div className="rounded-2xl border border-rose-300/30 bg-rose-500/10 px-4 py-3 text-sm font-bold text-rose-100">{error}</div> : null}

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="rounded-2xl border border-yellow-300/20 bg-yellow-400/10 p-3">
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-yellow-100/70">Need Approval</div>
          <div className="mt-1 text-xl font-black text-yellow-100">{pendingUsers.length}</div>
        </div>
        <div className="rounded-2xl border border-emerald-300/20 bg-emerald-400/10 p-3">
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-100/70">Active Users</div>
          <div className="mt-1 text-xl font-black text-emerald-100">{approvedUsers.length}</div>
        </div>
      </div>

      <Card className="rounded-3xl border border-yellow-300/20 bg-yellow-400/[0.04]">
        <CardContent className="p-3 sm:p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="text-sm font-black text-yellow-100">New users needing approval</div>
              <div className="mt-1 text-xs font-bold text-white/35">Unassigned accounts are sorted newest first.</div>
            </div>
            <span className="rounded-full border border-yellow-300/25 bg-yellow-400/10 px-2 py-1 text-[10px] font-black text-yellow-100">
              {pendingUsers.length}
            </span>
          </div>
          {renderUserGroup(pendingUsers, { emptyLabel: "No accounts waiting for approval.", tone: "pending" })}
        </CardContent>
      </Card>

      <Card className="rounded-3xl border border-white/10 bg-white/[0.02]">
        <CardContent className="p-3 sm:p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="text-sm font-black text-white/85">Active users</div>
              <div className="mt-1 text-xs font-bold text-white/35">Approved DJs, staff, admins, and superadmins.</div>
            </div>
            <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-black text-white/45">
              {approvedUsers.length}
            </span>
          </div>
          {renderUserGroup(approvedUsers, { emptyLabel: "No active users found." })}
        </CardContent>
      </Card>

      {passwordModalUser ? (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/75 p-2 backdrop-blur-sm sm:p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closePasswordModal();
          }}
        >
          <div className="oa-modal-panel flex max-h-[calc(100svh-0.75rem)] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-[#16152a] to-[#0a0912] text-white shadow-2xl shadow-black/60 sm:rounded-3xl">
            <div className="oa-modal-header flex items-start justify-between gap-3 border-b border-white/10 px-4 py-4">
              <div className="min-w-0">
                <div className="text-lg font-black tracking-tight text-white">Set Password</div>
                <div className="mt-1 truncate text-xs font-bold text-white/35">{passwordModalUser.email || passwordModalUser.id}</div>
              </div>
              <button
                type="button"
                onClick={closePasswordModal}
                className="rounded-xl border border-white/10 bg-white/5 p-2 text-white/50 hover:bg-white/10 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="oa-modal-body space-y-3 px-4 py-4">
              <label className="block">
                <span className="text-[10px] font-black uppercase tracking-[0.22em] text-white/30">New password</span>
                <div className="relative mt-1">
                  <input
                    type={showPasswordDraft ? "text" : "password"}
                    value={passwordDraft}
                    onChange={(e) => setPasswordDraft(e.target.value)}
                    placeholder="Minimum 8 characters"
                    className="h-11 w-full rounded-xl border border-white/10 bg-white/5 px-3 pr-11 text-sm font-black text-white/80 outline-none focus:border-purple-300/60"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswordDraft((prev) => !prev)}
                    className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/55 hover:bg-white/10 hover:text-white"
                    title={showPasswordDraft ? "Hide password" : "Show password"}
                  >
                    {showPasswordDraft ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </label>
              <div className="rounded-xl border border-yellow-300/20 bg-yellow-400/10 px-3 py-2 text-xs font-bold text-yellow-100">
                This updates the user&apos;s login password immediately.
              </div>
            </div>
            <div className="oa-modal-footer grid gap-2 border-t border-white/10 px-4 py-4 sm:grid-cols-2">
              <Button
                onClick={closePasswordModal}
                disabled={Boolean(savingUserId)}
                className="h-11 rounded-xl bg-white/5 px-5 text-sm font-black text-white/55 hover:bg-white/10 hover:text-white disabled:opacity-60"
              >
                Cancel
              </Button>
              <Button
                onClick={setUserPassword}
                disabled={Boolean(savingUserId)}
                className="h-11 rounded-xl bg-emerald-400 px-5 text-sm font-black text-black hover:bg-emerald-300 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/35"
              >
                {savingUserId ? "Updating..." : "Update Password"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

// ─── DJ Payments ────────────────────────────────────────────────────────────
const PAY_STATUS_CYCLE = ["pending", "invoice_uploaded", "paid"];

function djPayStatusLabel(s) {
  if (s === "paid") return "Paid";
  if (s === "invoice_uploaded") return "Invoice Uploaded";
  return "Pending Invoice";
}
function djPayStatusClass(s) {
  if (s === "paid") return "border-emerald-300/40 bg-emerald-400/10 text-emerald-200";
  if (s === "invoice_uploaded") return "border-yellow-300/40 bg-yellow-400/10 text-yellow-200";
  return "border-rose-300/30 bg-rose-400/10 text-rose-300";
}
function djPayStatusIcon(s) {
  if (s === "paid") return <CheckCircle2 className="h-3 w-3" />;
  if (s === "invoice_uploaded") return <FileCheck className="h-3 w-3" />;
  return <CircleDot className="h-3 w-3" />;
}
const DJ_PAY_STATUS_FILTERS = [
  ["ALL", "All Status", null],
  ["pending", djPayStatusLabel("pending"), "pending"],
  ["invoice_uploaded", djPayStatusLabel("invoice_uploaded"), "invoice_uploaded"],
  ["paid", djPayStatusLabel("paid"), "paid"],
];

function DjPaymentsPage({ events, djProfiles, onRefresh, onToast, onLogActivity }) {
  // Payment status: keyed by assignmentId, stored in localStorage
  const [statusMap, setStatusMap] = useState(() => {
    try { return JSON.parse(localStorage.getItem("oa_djpay_status_v2") || "{}"); }
    catch { return {}; }
  });
  // Fee edits pending save: { assignmentId: string }
  const [feeEdits, setFeeEdits] = useState({});
  const [editingFeeId, setEditingFeeId] = useState(null);
  const [feeEditScopes, setFeeEditScopes] = useState({});
  // Which assignments are currently saving
  const [saving, setSaving] = useState({});
  // Toast-style feedback
  const [saveMsg, setSaveMsg] = useState({});
  const [consoleFeeEdits, setConsoleFeeEdits] = useState({});
  const [editingConsoleFeeId, setEditingConsoleFeeId] = useState(null);
  const [savingConsoleFeeId, setSavingConsoleFeeId] = useState(null);

  // Month cursor — default to current month
  const [monthCursor, setMonthCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  // Filters
  const [filterPayStatus, setFilterPayStatus] = useState("ALL");
  const [filterEventStatus, setFilterEventStatus] = useState("ALL");
  const [search, setSearch] = useState("");

  // Build DJ profile lookup: name (uppercase) → { defaultFee, djId }
  const djProfileMap = useMemo(() => {
    const map = new Map();
    for (const p of (djProfiles || [])) {
      const key = (p.name || "").toUpperCase().trim();
      if (!key) continue;
      const defaultFee = p.fees && p.fees.length ? p.fees[0].amount : null;
      map.set(key, { defaultFee, djId: p.id, hasProfileFee: !!(p.fees && p.fees.length) });
    }
    return map;
  }, [djProfiles]);

  const fmtRM = (n) =>
    n == null ? "—" : `RM ${Number(n).toLocaleString("en-MY", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

  // Month navigation helpers
  const monthLabel = (d) =>
    d.toLocaleDateString("en-MY", { month: "long", year: "numeric" });
  const prevMonth = () =>
    setMonthCursor((c) => new Date(c.getFullYear(), c.getMonth() - 1, 1));
  const nextMonth = () =>
    setMonthCursor((c) => new Date(c.getFullYear(), c.getMonth() + 1, 1));

  // Active month boundaries (YYYY-MM-DD strings for fast comparison)
  const monthStart = `${monthCursor.getFullYear()}-${String(monthCursor.getMonth() + 1).padStart(2, "0")}-01`;
  const monthEnd = (() => {
    const last = new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 0);
    return `${last.getFullYear()}-${String(last.getMonth() + 1).padStart(2, "0")}-${String(last.getDate()).padStart(2, "0")}`;
  })();

  // Filter events → dates with real slots only, within selected month
  const filteredEvents = useMemo(() => {
    const q = search.trim().toLowerCase();
    return events
      .filter((e) => {
        if (e.date < monthStart || e.date > monthEnd) return false;
        if (filterEventStatus !== "ALL" && e.status !== filterEventStatus) return false;
        if (q && !e.name.toLowerCase().includes(q) && !e.slots.some((s) => s.dj.toLowerCase().includes(q))) return false;
        return true;
      })
      .map((e) => ({
        ...e,
        slots: e.slots.filter((s) => s.dj && !s.dj.toUpperCase().includes("TBD") && s.assignmentId),
      }))
      .filter((e) => e.slots.length > 0)
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [events, filterEventStatus, search, monthStart, monthEnd]);

  // Resolve the effective fee for a slot
  const getEffectiveFee = useCallback(
    (slot) => {
      if (feeEdits[slot.assignmentId] !== undefined) return feeEdits[slot.assignmentId];
      if (slot.fee != null) return slot.fee;
      const prof = djProfileMap.get((slot.dj || "").toUpperCase().trim());
      return prof?.defaultFee ?? "";
    },
    [feeEdits, djProfileMap]
  );

  // Resolve payment status for a slot
  const getPayStatus = useCallback(
    (slot) => statusMap[slot.assignmentId] ?? "pending",
    [statusMap]
  );

  const getConsolePayStatus = useCallback(
    (eventId) => statusMap[`console:${eventId}`] ?? "pending",
    [statusMap]
  );

  const getFeeScope = useCallback(
    (assignmentId) => feeEditScopes[assignmentId] || "day",
    [feeEditScopes]
  );

  const ensureDjInDatabase = useCallback(
    async (slot) => {
      const existingDjId = slot?.djId ? String(slot.djId) : "";
      if (existingDjId) return existingDjId;
      if (!isSupabaseConfigured) throw new Error("Supabase is not configured.");
      const name = canonicalDjName(slot?.dj);
      if (!name || name.toUpperCase().includes("TBD")) throw new Error("Invalid DJ name.");

      const existing = await supabase.from("djs").select("id").ilike("name", name).limit(1).maybeSingle();
      if (existing.error) throw existing.error;

      let djId = existing.data?.id ? String(existing.data.id) : "";
      let created = false;
      if (!djId) {
        const inserted = await supabase.from("djs").insert({ name }).select("id").single();
        if (inserted.error) throw inserted.error;
        djId = String(inserted.data.id);
        created = true;
      }

      if (slot?.assignmentId) {
        const { error } = await supabase
          .from("event_assignments")
          .update({ dj_id: djId, notes: null })
          .eq("id", slot.assignmentId);
        if (error) throw error;
      }

      if (created) {
        onLogActivity?.({
          action: "dj_created",
          entityType: "dj",
          entityId: djId,
          message: `DJ created · ${name}`,
          meta: { djId, name },
        });
      }
      onLogActivity?.({
        action: "dj_linked_to_assignment",
        entityType: "event_assignment",
        entityId: slot?.assignmentId ? String(slot.assignmentId) : "",
        meta: { assignmentId: slot?.assignmentId ?? null, djId, name },
      });

      return djId;
    },
    [onLogActivity]
  );

  const cycleStatus = useCallback((assignmentId, current) => {
    const next = PAY_STATUS_CYCLE[(PAY_STATUS_CYCLE.indexOf(current) + 1) % PAY_STATUS_CYCLE.length];
    const isConsolePayment = String(assignmentId).startsWith("console:");
    const entityId = isConsolePayment ? String(assignmentId).replace(/^console:/, "") : assignmentId;
    setStatusMap((prev) => {
      const updated = { ...prev, [assignmentId]: next };
      localStorage.setItem("oa_djpay_status_v2", JSON.stringify(updated));
      return updated;
    });
    onLogActivity?.({
      action: isConsolePayment ? "console_payment_status_updated" : "dj_payment_status_updated",
      entityType: isConsolePayment ? "event" : "event_assignment",
      entityId,
      meta: { from: current, to: next, paymentKey: assignmentId },
    });
  }, [onLogActivity]);

  const saveFee = useCallback(
    async (slot) => {
      const raw = feeEdits[slot.assignmentId];
      if (raw === undefined || String(raw).trim() === "") return;
      const amount = parseFloat(String(raw).replace(/[^0-9.]/g, ""));
      if (isNaN(amount) || amount < 0) return;
      const scope = getFeeScope(slot.assignmentId);

      setSaving((p) => ({ ...p, [slot.assignmentId]: true }));
      try {
        if (!isSupabaseConfigured) throw new Error("Supabase is not configured.");
        let resolvedDjId = slot.djId ?? null;

        if (scope === "day") {
          if (!slot.assignmentId) throw new Error("Missing assignment ID.");
          const { error } = await supabase
            .from("event_assignments")
            .update({ fee: amount })
            .eq("id", slot.assignmentId);
          if (error) throw error;
        } else {
          const ensuredDjId = await ensureDjInDatabase(slot);
          resolvedDjId = ensuredDjId;
          const currentFee = (djProfiles || [])
            .find((profile) => String(profile.id) === String(ensuredDjId))
            ?.fees?.[0];

          const payload = {
            dj_id: ensuredDjId,
            fee_name: "Standard",
            currency_code: "MYR",
            amount,
            fee_type: "per_set",
            is_active: true,
          };

          if (currentFee?.id) {
            const { error } = await supabase
              .from("dj_fees")
              .update({
                amount,
                currency_code: currentFee.currencyCode || "MYR",
                fee_type: currentFee.feeType || "per_set",
                is_active: true,
              })
              .eq("id", currentFee.id);
            if (error) throw error;
          } else {
            const { error } = await supabase.from("dj_fees").insert(payload);
            if (error) throw error;
          }

          if (slot.assignmentId) {
            const { error } = await supabase
              .from("event_assignments")
              .update({ fee: null })
              .eq("id", slot.assignmentId);
            if (error) throw error;
          }
        }

        await onRefresh?.();
        onLogActivity?.({
          action: "dj_fee_updated",
          entityType: scope === "fixed" ? "dj" : "event_assignment",
          entityId: scope === "fixed" ? String(resolvedDjId || "") : String(slot.assignmentId || ""),
          meta: {
            scope,
            amount,
            assignmentId: slot.assignmentId ?? null,
            djId: resolvedDjId ?? null,
            djName: slot.dj ?? null,
          },
        });

        setFeeEdits((p) => {
          const next = { ...p };
          delete next[slot.assignmentId];
          return next;
        });
        setFeeEditScopes((p) => {
          const next = { ...p };
          delete next[slot.assignmentId];
          return next;
        });
        setEditingFeeId(null);
        setSaveMsg((p) => ({ ...p, [slot.assignmentId]: "saved" }));
        setTimeout(() => setSaveMsg((p) => { const n = { ...p }; delete n[slot.assignmentId]; return n; }), 2000);
      } catch (err) {
        onToast?.(err?.message || "Fee save failed", "error");
        setSaveMsg((p) => ({ ...p, [slot.assignmentId]: "error" }));
        setTimeout(() => setSaveMsg((p) => { const n = { ...p }; delete n[slot.assignmentId]; return n; }), 3000);
      } finally {
        setSaving((p) => ({ ...p, [slot.assignmentId]: false }));
      }
    },
    [feeEdits, getFeeScope, djProfiles, onRefresh, onToast, onLogActivity, ensureDjInDatabase]
  );

  const saveConsoleFee = useCallback(
    async (event, amountOverride) => {
      const raw = amountOverride === null ? null : amountOverride !== undefined ? amountOverride : consoleFeeEdits[event.id];
      const amount =
        raw === null
          ? null
          : Number.parseFloat(String(raw ?? "").replace(/[^0-9.]/g, ""));
      if (raw !== null && (!Number.isFinite(amount) || amount < 0)) return;

      setSavingConsoleFeeId(event.id);
      try {
        if (!isSupabaseConfigured) throw new Error("Supabase is not configured.");
        const notes = setDashboardNotes(event.notes, event.ic, event.mentionedUserIds, raw === null ? null : amount);
        const { error } = await supabase.from("events").update({ notes }).eq("id", event.id);
        if (error) throw error;

        await onRefresh?.();
        onLogActivity?.({
          action: raw === null ? "console_fee_removed" : "console_fee_updated",
          entityType: "event",
          entityId: String(event.id),
          message: raw === null ? `Console fee removed · ${event.name}` : `Console fee updated · ${event.name} · RM ${amount}`,
          meta: { eventId: event.id, eventName: event.name, consoleFeeAmount: raw === null ? null : amount },
        });
        setConsoleFeeEdits((prev) => {
          const next = { ...prev };
          delete next[event.id];
          return next;
        });
        setEditingConsoleFeeId(null);
        setSaveMsg((p) => ({ ...p, [`console:${event.id}`]: "saved" }));
        setTimeout(() => setSaveMsg((p) => { const n = { ...p }; delete n[`console:${event.id}`]; return n; }), 2000);
      } catch (err) {
        onToast?.(err?.message || "Console fee save failed", "error");
        setSaveMsg((p) => ({ ...p, [`console:${event.id}`]: "error" }));
        setTimeout(() => setSaveMsg((p) => { const n = { ...p }; delete n[`console:${event.id}`]; return n; }), 3000);
      } finally {
        setSavingConsoleFeeId(null);
      }
    },
    [consoleFeeEdits, onRefresh, onToast, onLogActivity]
  );

  // Filter slots by payment status
  const displayEvents = useMemo(() => {
    if (filterPayStatus === "ALL") return filteredEvents;
    return filteredEvents
      .map((e) => ({
        ...e,
        slots:
          e.consoleFeeAmount != null
            ? e.slots
            : e.slots.filter((s) => getPayStatus(s) === filterPayStatus),
      }))
      .filter((e) => (e.consoleFeeAmount != null ? getConsolePayStatus(e.id) === filterPayStatus : e.slots.length > 0));
  }, [filteredEvents, filterPayStatus, getPayStatus, getConsolePayStatus]);

  // Grand totals across displayed events
  const { totalFee, totalPaid, totalPending, totalInvoiced, missingFeeCount } = useMemo(() => {
    let totalFee = 0, totalPaid = 0, totalPending = 0, totalInvoiced = 0, missingFeeCount = 0;
    for (const ev of displayEvents) {
      if (ev.consoleFeeAmount != null) {
        const feeNum = Number(ev.consoleFeeAmount) || 0;
        const st = getConsolePayStatus(ev.id);
        totalFee += feeNum;
        if (st === "paid") totalPaid += feeNum;
        else if (st === "invoice_uploaded") totalInvoiced += feeNum;
        else totalPending += feeNum;
        continue;
      }
      for (const slot of ev.slots) {
        const fee = getEffectiveFee(slot);
        const feeNum = fee !== "" && fee != null ? Number(fee) : 0;
        const st = getPayStatus(slot);
        totalFee += feeNum;
        if (st === "paid") totalPaid += feeNum;
        else if (st === "invoice_uploaded") totalInvoiced += feeNum;
        else totalPending += feeNum;
        if (fee === "" || fee == null) missingFeeCount++;
      }
    }
    return { totalFee, totalPaid, totalPending, totalInvoiced, missingFeeCount };
  }, [displayEvents, getEffectiveFee, getPayStatus, getConsolePayStatus]);

  const dateLabel = (d) => {
    if (!d) return "Unknown";
    const dt = new Date(d + "T00:00:00");
    return dt.toLocaleDateString("en-MY", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  };

  const roleBadgeClass = (role) => {
    if (role === "Warm-up") return "border-blue-300/30 bg-blue-400/10 text-blue-200";
    if (role === "Closer") return "border-orange-300/30 bg-orange-400/10 text-orange-200";
    if (role === "MC") return "border-purple-300/30 bg-purple-400/10 text-purple-200";
    return "border-white/10 bg-white/5 text-white/50";
  };

  return (
    <section className="space-y-4">
      {/* Header row: title + month nav + search */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.24em] text-white/30">Admin Only</div>
          <h2 className="mt-0.5 text-xl font-black text-white">DJ Payments</h2>
          {missingFeeCount > 0 && (
            <div className="mt-1 flex items-center gap-1.5 text-[10px] font-black text-yellow-300">
              <AlertTriangle className="h-3 w-3" />
              {missingFeeCount} slot{missingFeeCount !== 1 ? "s" : ""} missing fee
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Month navigator */}
          <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-black/20 px-1 py-1">
            <button
              onClick={prevMonth}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-white/40 transition hover:bg-white/10 hover:text-white"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="min-w-[130px] text-center text-xs font-black text-white">
              {monthLabel(monthCursor)}
            </span>
            <button
              onClick={nextMonth}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-white/40 transition hover:bg-white/10 hover:text-white"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
          {/* Search */}
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-white/40">
            <Search className="h-3.5 w-3.5 shrink-0" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search DJ…"
              className="w-28 bg-transparent text-xs font-black text-white outline-none placeholder:text-white/25 sm:w-36"
            />
            {search && (
              <button onClick={() => setSearch("")} className="text-white/30 hover:text-white">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Stats for selected month */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          { label: "Total Fees", val: totalFee, color: "text-white" },
          { label: "Paid", val: totalPaid, color: "text-emerald-300" },
          { label: "Pending", val: totalPending, color: "text-rose-300" },
          { label: "Invoice Up", val: totalInvoiced, color: "text-yellow-300" },
        ].map(({ label, val, color }) => (
          <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 md:p-4">
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">{label}</div>
            <div className={`mt-1 text-base font-black sm:text-lg ${color}`}>{fmtRM(val)}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {/* Event status */}
        <div className="flex gap-1">
          {[["ALL", "All Events"], ["Confirmed", "Confirmed"], ["Unconfirmed", "Unconfirmed"]].map(([val, label]) => (
            <button
              key={val}
              onClick={() => setFilterEventStatus(val)}
              className={`rounded-lg border px-2.5 py-1.5 text-[10px] font-black transition ${
                filterEventStatus === val
                  ? "border-cyan-300/50 bg-cyan-400/20 text-cyan-100"
                  : "border-white/10 bg-white/5 text-white/40 hover:bg-white/10 hover:text-white"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        {/* Payment status */}
        <div className="flex flex-wrap gap-1">
          {DJ_PAY_STATUS_FILTERS.map(([val, label, status]) => (
            <button
              key={val}
              onClick={() => setFilterPayStatus(val)}
              className={`flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-[10px] font-black transition ${
                filterPayStatus === val
                  ? "border-yellow-300/50 bg-yellow-400/20 text-yellow-100"
                  : "border-white/10 bg-white/5 text-white/40 hover:bg-white/10 hover:text-white"
              }`}
            >
              {status ? djPayStatusIcon(status) : null}
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/25">
        {displayEvents.length} night{displayEvents.length !== 1 ? "s" : ""} ·{" "}
        {displayEvents.reduce((s, e) => s + e.slots.length, 0)} DJ slots
      </div>

      {/* Night cards */}
      {displayEvents.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-10 text-center text-sm font-black text-white/30">
          No nights match your filters
        </div>
      ) : (
        <div className="space-y-3">
          {displayEvents.map((ev) => {
            const hasConsoleFee = ev.consoleFeeAmount != null;
            const perDjTotal = ev.slots.reduce((s, slot) => {
              const f = getEffectiveFee(slot);
              return s + (f !== "" && f != null ? Number(f) : 0);
            }, 0);
            const nightTotal = hasConsoleFee ? Number(ev.consoleFeeAmount) || 0 : perDjTotal;
            const consoleStatus = getConsolePayStatus(ev.id);
            const allPaid = hasConsoleFee ? consoleStatus === "paid" : ev.slots.every((s) => getPayStatus(s) === "paid");
            const hasPending = hasConsoleFee ? consoleStatus === "pending" : ev.slots.some((s) => getPayStatus(s) === "pending");
            const nightMissingFee = !hasConsoleFee && ev.slots.some((s) => getEffectiveFee(s) === "" || getEffectiveFee(s) == null);
            const isEditingConsoleFee = editingConsoleFeeId === ev.id;
            const consoleMsg = saveMsg[`console:${ev.id}`];
            const isSavingConsoleFee = savingConsoleFeeId === ev.id;

            return (
              <div key={ev.id} className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
                {/* Night header */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-white/[0.02] px-4 py-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-sm font-black text-white">{dateLabel(ev.date)}</div>
                    <div className="text-sm font-black text-white/50">{ev.name}</div>
                    {hasConsoleFee ? (
                      <span className="rounded-full border border-cyan-300/30 bg-cyan-400/10 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-cyan-100">
                        Console fee
                      </span>
                    ) : null}
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                        hasPending
                          ? "border-rose-300/30 bg-rose-400/10 text-rose-300"
                          : allPaid
                          ? "border-emerald-300/30 bg-emerald-400/10 text-emerald-300"
                          : "border-yellow-300/30 bg-yellow-400/10 text-yellow-300"
                      }`}
                    >
                      {hasPending ? "Has Pending" : allPaid ? "All Paid" : "Partial"}
                    </span>
                    {nightMissingFee && (
                      <span className="flex items-center gap-1 text-[9px] font-black text-yellow-400">
                        <AlertTriangle className="h-3 w-3" /> Missing fee
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center justify-end gap-1.5">
                    {isEditingConsoleFee ? (
                      <>
                        <div className="relative flex items-center">
                          <span className="absolute left-2 text-[10px] font-black text-white/30">RM</span>
                          <input
                            type="number"
                            min="0"
                            step="50"
                            value={consoleFeeEdits[ev.id] ?? ""}
                            onChange={(e) => setConsoleFeeEdits((p) => ({ ...p, [ev.id]: e.target.value }))}
                            placeholder="console fee"
                            className="h-8 w-28 rounded-lg border border-cyan-300/30 bg-black/20 pl-8 pr-2 text-xs font-black text-white outline-none transition focus:border-cyan-300/70"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => saveConsoleFee(ev)}
                          disabled={isSavingConsoleFee}
                          className="flex h-8 items-center gap-1 rounded-lg border border-cyan-300/40 bg-cyan-400/20 px-2 text-[10px] font-black text-cyan-100 hover:bg-cyan-400/30 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isSavingConsoleFee ? <RefreshCcw className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                          {!isSavingConsoleFee && "Save"}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingConsoleFeeId(null);
                            setConsoleFeeEdits((p) => {
                              const next = { ...p };
                              delete next[ev.id];
                              return next;
                            });
                          }}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/45 hover:bg-white/10 hover:text-white"
                          title="Cancel console fee edit"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="text-sm font-black text-white/60">{fmtRM(nightTotal)}</div>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingConsoleFeeId(ev.id);
                            setConsoleFeeEdits((p) => ({ ...p, [ev.id]: hasConsoleFee ? String(ev.consoleFeeAmount) : String(perDjTotal || "") }));
                          }}
                          className="flex h-8 items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 text-[10px] font-black text-white/55 hover:bg-white/10 hover:text-white"
                        >
                          <Pencil className="h-3 w-3" />
                          {hasConsoleFee ? "Edit console" : "Console fee"}
                        </button>
                        {hasConsoleFee ? (
                          <>
                            <button
                              type="button"
                              onClick={() => saveConsoleFee(ev, null)}
                              disabled={isSavingConsoleFee}
                              className="h-8 rounded-lg border border-white/10 bg-white/5 px-2 text-[10px] font-black text-white/45 hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Per DJ
                            </button>
                            <button
                              type="button"
                              onClick={() => cycleStatus(`console:${ev.id}`, consoleStatus)}
                              className={`flex h-8 min-w-[132px] shrink-0 items-center justify-center gap-1.5 rounded-lg border px-2 text-[10px] font-black transition hover:scale-105 ${djPayStatusClass(consoleStatus)}`}
                              title={`${djPayStatusLabel(consoleStatus)} — click to cycle`}
                            >
                              {djPayStatusIcon(consoleStatus)}
                              <span>{djPayStatusLabel(consoleStatus)}</span>
                            </button>
                          </>
                        ) : null}
                      </>
                    )}
                    {consoleMsg === "saved" && <span className="text-[10px] font-black text-emerald-400">Saved</span>}
                    {consoleMsg === "error" && <span className="text-[10px] font-black text-rose-400">Error</span>}
                  </div>
                </div>

                {/* DJ rows */}
                <div className="divide-y divide-white/5">
                  {ev.slots.map((slot) => {
                    const payStatus = getPayStatus(slot);
                    const effectiveFee = getEffectiveFee(slot);
                    const hasSavedFee = slot.fee != null;
                    const hasProfileFee = djProfileMap.get((slot.dj || "").toUpperCase().trim())?.defaultFee != null;
                    const feeIsEdited = feeEdits[slot.assignmentId] !== undefined;
                    const isSaving = saving[slot.assignmentId];
                    const msg = saveMsg[slot.assignmentId];
                    const isEditingFee = editingFeeId === slot.assignmentId;
                    const feeScope = getFeeScope(slot.assignmentId);

                    return (
                      <div
                        key={slot.id}
                        className="grid grid-cols-[1fr_auto] items-center gap-2 px-4 py-3 sm:grid-cols-[minmax(0,1fr)_minmax(260px,auto)_auto]"
                      >
                        {/* DJ info */}
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-xs font-black text-white/90">{slot.dj}</span>
                            <span className={`rounded border px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider ${roleBadgeClass(slot.role)}`}>
                              {slot.role}
                            </span>
                          </div>
                          {slotNeedsTime(slot) && slot.start && slot.end ? (
                            <div className="mt-0.5 text-[10px] font-bold text-white/30">
                              {slot.start}–{slot.end}
                            </div>
                          ) : null}
                        </div>

                        {/* Fee input */}
                        <div className="col-span-2 flex flex-wrap items-center gap-1.5 sm:col-span-1 sm:justify-end">
                          {hasConsoleFee ? (
                            <span className="rounded-lg border border-cyan-300/20 bg-cyan-400/10 px-2 py-1.5 text-[10px] font-black uppercase tracking-wider text-cyan-100">
                              Covered by console
                            </span>
                          ) : isEditingFee ? (
                            <>
                              <div className="relative flex items-center">
                                <span className="absolute left-2 text-[10px] font-black text-white/30">RM</span>
                                <input
                                  type="number"
                                  min="0"
                                  step="50"
                                  value={effectiveFee === "" || effectiveFee == null ? "" : effectiveFee}
                                  onChange={(e) =>
                                    setFeeEdits((p) => ({ ...p, [slot.assignmentId]: e.target.value }))
                                  }
                                  placeholder={hasProfileFee ? "from profile" : "enter fee"}
                                  className={`h-8 w-28 rounded-lg border bg-black/20 pl-8 pr-2 text-xs font-black outline-none transition ${
                                    feeIsEdited
                                      ? "border-purple-300/50 text-white"
                                      : hasSavedFee
                                      ? "border-emerald-300/20 text-emerald-100"
                                      : hasProfileFee
                                      ? "border-white/10 text-white/50"
                                      : "border-yellow-300/30 text-yellow-200"
                                  } focus:border-purple-300/60`}
                                />
                              </div>
                              <div className="grid grid-cols-2 gap-1 rounded-lg border border-white/10 bg-black/20 p-0.5">
                                {[
                                  ["day", "This day"],
                                  ["fixed", "DJ fixed"],
                                ].map(([value, label]) => (
                                  <button
                                    key={value}
                                    type="button"
                                    onClick={() => setFeeEditScopes((p) => ({ ...p, [slot.assignmentId]: value }))}
                                    className={`h-7 rounded-md px-2 text-[9px] font-black transition ${
                                      feeScope === value ? "bg-purple-400 text-black" : "text-white/40 hover:bg-white/10 hover:text-white"
                                    }`}
                                  >
                                    {label}
                                  </button>
                                ))}
                              </div>
                              <button
                                onClick={() => saveFee(slot)}
                                disabled={isSaving || !feeIsEdited}
                                className="flex h-8 items-center gap-1 rounded-lg border border-purple-300/40 bg-purple-400/20 px-2 text-[10px] font-black text-purple-100 hover:bg-purple-400/30 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {isSaving ? <RefreshCcw className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                                {!isSaving && "Save"}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingFeeId(null);
                                  setFeeEdits((p) => {
                                    const next = { ...p };
                                    delete next[slot.assignmentId];
                                    return next;
                                  });
                                  setFeeEditScopes((p) => {
                                    const next = { ...p };
                                    delete next[slot.assignmentId];
                                    return next;
                                  });
                                }}
                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/45 hover:bg-white/10 hover:text-white"
                                title="Cancel fee edit"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </>
                          ) : (
                            <>
                              <div className={`min-w-[92px] rounded-lg border px-2 py-1.5 text-right text-xs font-black ${
                                hasSavedFee
                                  ? "border-emerald-300/20 bg-emerald-400/10 text-emerald-100"
                                  : hasProfileFee
                                  ? "border-white/10 bg-white/5 text-white/55"
                                  : "border-yellow-300/30 bg-yellow-400/10 text-yellow-200"
                              }`}>
                                {fmtRM(effectiveFee === "" ? null : effectiveFee)}
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingFeeId(slot.assignmentId);
                                  setFeeEdits({ [slot.assignmentId]: effectiveFee === "" || effectiveFee == null ? "" : String(effectiveFee) });
                                  setFeeEditScopes((p) => ({ ...p, [slot.assignmentId]: hasSavedFee ? "day" : "fixed" }));
                                }}
                                className="flex h-8 items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 text-[10px] font-black text-white/55 hover:bg-white/10 hover:text-white"
                              >
                                <Pencil className="h-3 w-3" />
                                Edit
                              </button>
                            </>
                          )}
                          {msg === "saved" && (
                            <span className="text-[10px] font-black text-emerald-400">Saved</span>
                          )}
                          {msg === "error" && (
                            <span className="text-[10px] font-black text-rose-400">Error</span>
                          )}
                          {!hasProfileFee && !hasSavedFee && !feeIsEdited && (
                            <span className="text-[9px] font-black text-yellow-400/70">No profile fee</span>
                          )}
                        </div>

                        {/* Status cycle button */}
                        {hasConsoleFee ? (
                          <div className="h-8 w-8 shrink-0" />
                        ) : (
                          <button
                            onClick={() => cycleStatus(slot.assignmentId, payStatus)}
                            className={`flex h-8 min-w-[132px] shrink-0 items-center justify-center gap-1.5 rounded-lg border px-2 text-[10px] font-black transition hover:scale-105 sm:h-7 ${djPayStatusClass(payStatus)}`}
                            title={`${djPayStatusLabel(payStatus)} — click to cycle`}
                          >
                            {djPayStatusIcon(payStatus)}
                            <span>{djPayStatusLabel(payStatus)}</span>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function useDelayedBoolean(value, delayMs = 650) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if (!value) {
      setReady(false);
      return undefined;
    }
    const timer = window.setTimeout(() => setReady(true), delayMs);
    return () => window.clearTimeout(timer);
  }, [delayMs, value]);
  return ready;
}

function formatActivityTimestamp(value) {
  if (!value) return "—";
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return String(value);
  return dt.toLocaleString("en-MY", { year: "numeric", month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function ActivityMonitorPage({ userRole }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filterAction, setFilterAction] = useState("ALL");

  const load = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setError("Supabase is not configured.");
      setItems([]);
      return;
    }

    setLoading(true);
    setError("");
    const { data, error } = await supabase
      .from("activity_log")
      .select("id, actor_user_id, actor_email, actor_role, action, entity_type, entity_id, message, meta, created_at")
      .order("created_at", { ascending: false })
      .limit(250);
    setLoading(false);

    if (error) {
      const message = error.message || "Could not load activity.";
      setError(message.toLowerCase().includes("activity_log") ? "Run supabase/required_dashboard_schema_updates.sql in Supabase SQL Editor to enable the activity monitor." : message);
      setItems([]);
      return;
    }

    setItems(Array.isArray(data) ? data : []);
  }, []);

  useEffect(() => {
    if (userRole !== "superadmin") return;
    load();
  }, [load, userRole]);

  useEffect(() => {
    if (userRole !== "superadmin") return undefined;
    if (!isSupabaseConfigured) return undefined;
    const channel = supabase
      .channel("oa-dashboard-activity")
      .on("postgres_changes", { event: "*", schema: "public", table: "activity_log" }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [load, userRole]);

  const actions = useMemo(() => {
    const set = new Set(items.map((x) => String(x.action || "").trim()).filter(Boolean));
    return ["ALL", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [items]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((x) => {
      if (filterAction !== "ALL" && String(x.action) !== filterAction) return false;
      if (!q) return true;
      const hay = [
        x.actor_email,
        x.actor_role,
        x.action,
        x.entity_type,
        x.entity_id,
        x.message,
        typeof x.meta === "string" ? x.meta : JSON.stringify(x.meta || {}),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [filterAction, items, search]);

  if (userRole !== "superadmin") {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-10 text-center text-sm font-black text-white/30">
        Superadmin only
      </div>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.24em] text-white/30">Superadmin</div>
          <h2 className="mt-0.5 text-xl font-black text-white">Activity Monitor</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-white/40">
            <Search className="h-3.5 w-3.5 shrink-0" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search activity…"
              className="w-44 bg-transparent text-xs font-black text-white outline-none placeholder:text-white/25 sm:w-56"
            />
            {search ? (
              <button onClick={() => setSearch("")} className="text-white/30 hover:text-white" title="Clear">
                <X className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </div>
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="h-10 rounded-xl border border-white/10 bg-black/20 px-3 text-xs font-black text-white/70 outline-none hover:bg-white/5 focus:border-purple-300/60"
          >
            {actions.map((a) => (
              <option key={a} value={a}>
                {a === "ALL" ? "All actions" : a}
              </option>
            ))}
          </select>
          <Button
            onClick={load}
            className="h-10 rounded-xl border border-white/10 bg-white/5 px-4 text-xs font-black text-white/60 hover:bg-white/10 hover:text-white"
          >
            Refresh
          </Button>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-300/20 bg-rose-500/10 px-4 py-3 text-sm font-black text-rose-100">
          {error}
        </div>
      ) : null}

      <div className="rounded-2xl border border-white/10 bg-white/[0.02]">
        <div className="flex items-center justify-between gap-2 border-b border-white/10 px-4 py-3">
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/35">
            {loading ? "Loading…" : `${filtered.length} item${filtered.length !== 1 ? "s" : ""}`}
          </div>
        </div>
        <div className="max-h-[68svh] overflow-auto">
          {filtered.length === 0 ? (
            <div className="px-4 py-10 text-center text-sm font-black text-white/30">No activity</div>
          ) : (
            <div className="divide-y divide-white/5">
              {filtered.map((row) => (
                <div key={row.id} className="px-4 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-black text-white/60">
                          {row.action}
                        </span>
                        {row.entity_type ? (
                          <span className="rounded-full border border-purple-300/20 bg-purple-400/10 px-2 py-0.5 text-[10px] font-black text-purple-100">
                            {row.entity_type}
                          </span>
                        ) : null}
                        {row.entity_id ? (
                          <span className="rounded-full border border-white/10 bg-black/20 px-2 py-0.5 text-[10px] font-black text-white/50">
                            {row.entity_id}
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-1 oa-clamp-2 text-sm font-black text-white/80">
                        {row.message || "—"}
                      </div>
                      <div className="mt-1 oa-clamp-2 text-xs font-bold text-white/40">
                        {row.actor_email || row.actor_user_id} {row.actor_role ? `· ${row.actor_role}` : ""}
                      </div>
                    </div>
                    <div className="shrink-0 text-[10px] font-black text-white/35">
                      {formatActivityTimestamp(row.created_at)}
                    </div>
                  </div>
                  {row.meta && Object.keys(row.meta || {}).length ? (
                    <pre className="mt-2 overflow-auto rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-[10px] font-bold text-white/50">
                      {JSON.stringify(row.meta, null, 2)}
                    </pre>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}


function DashboardApp({ onLogout, userRole, currentUser }) {
  const [activeFilter, setActiveFilter] = useState("All");
  const [dateScope, setDateScope] = useState("Upcoming");
  const [dateSort, setDateSort] = useState("asc");
  const [search, setSearch] = useState("");
  const [events, setEvents] = useState(() => eventsSeed.map((e) => ({ ...e, id: String(e.id) })));
  const [view, setView] = useState(() => (typeof window === "undefined" ? "List" : dashboardViewFromPath(window.location.pathname)));
  const [routeEventId, setRouteEventId] = useState(() => eventShareIdFromLocation());
  const [listGrouping, setListGrouping] = useState("all");
  const [listMonthCursor, setListMonthCursor] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [calendarCursor, setCalendarCursor] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [activeNotificationsTab, setActiveNotificationsTab] = useState("mentions");
  const [notificationsPopoverStyle, setNotificationsPopoverStyle] = useState(null);
  const [mentionUsers, setMentionUsers] = useState([]);
  const [comments, setComments] = useState([]);
  const [commentsError, setCommentsError] = useState("");
  const [pendingNotificationTarget, setPendingNotificationTarget] = useState(null);
  const notificationsButtonRef = React.useRef(null);
  const addButtonRef = React.useRef(null);
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const [addMenuStyle, setAddMenuStyle] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("Add Event Day");
  const [modalInitialDays, setModalInitialDays] = useState(null);
  const [modalDateMode, setModalDateMode] = useState("week");
  const [modalLockDateSelection, setModalLockDateSelection] = useState(false);
  const [modalEditEvent, setModalEditEvent] = useState(null);
  const [previewEvent, setPreviewEvent] = useState(null);
  const [holidaysModalOpen, setHolidaysModalOpen] = useState(false);
  const [malaysiaHolidays, setMalaysiaHolidays] = useState([]);
  const [holidayError, setHolidayError] = useState("");
  const [syncError, setSyncError] = useState("");
  const [syncStatus, setSyncStatus] = useState("");
  const [djProfiles, setDjProfiles] = useState([]);
  const [djProfilesLoading, setDjProfilesLoading] = useState(isSupabaseConfigured);
  const [djProfilesError, setDjProfilesError] = useState("");
  const [djProfilesInitialQuery, setDjProfilesInitialQuery] = useState("");
  const [toast, setToast] = useState(null);
  const [theme, setTheme] = useState(() => {
    if (typeof window === "undefined") return "dark";
    return window.localStorage.getItem("oa_dashboard_theme") || "dark";
  });
  const [timeFormat, setTimeFormat] = useState(() => {
    if (typeof window === "undefined") return "24";
    return window.localStorage.getItem("oa_dashboard_time_format") || "24";
  });
  const [seedDateISO, setSeedDateISO] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });
  const isLightTheme = theme === "light";
  const canEdit = userRole === "admin" || userRole === "superadmin";
  const canAccessFinance = userRole === "admin" || userRole === "superadmin";
  const canAccessSales = userRole === "admin" || userRole === "superadmin";
  const canAccessDjs = userRole === "admin" || userRole === "superadmin";
  const canAccessDjPayments = userRole === "admin" || userRole === "superadmin";
  const canManageUsers = userRole === "superadmin";
  const canViewActivity = userRole === "superadmin";
  const headerIconsOnly = userRole === "superadmin";
  const canUseNotificationCenter = userRole === "staff" || userRole === "dj" || canEdit;
  const notificationButtonLabel = canEdit ? "Alerts" : "Mentions";
  const currentMentionUser = useMemo(() => {
    const matched = mentionUsers.find((user) => user.id === currentUser?.id || String(user.email || "").toLowerCase() === String(currentUser?.email || "").toLowerCase());
    return (
      matched ?? {
        id: currentUser?.id,
        email: currentUser?.email,
        displayName: currentUser?.user_metadata?.display_name || currentUser?.user_metadata?.full_name || currentUser?.email,
      }
    );
  }, [currentUser, mentionUsers]);
  const weekSectionRefs = React.useRef({});
  const eventCardRefs = React.useRef({});
  const [activeWeekKey, setActiveWeekKey] = useState(null);
  const activeWeekKeyRef = React.useRef(null);
  const listWeekNavInitRef = React.useRef({ view: null, grouping: null, monthKey: null });
  const didInitCommentsToastRef = React.useRef(false);
  const knownCommentIdsRef = React.useRef(new Set());

  useEffect(() => {
    window.localStorage.setItem("oa_dashboard_theme", theme);
  }, [theme]);

  useEffect(() => {
    window.localStorage.setItem("oa_dashboard_time_format", timeFormat);
  }, [timeFormat]);

  const showToast = useCallback((message, tone = "success") => {
    setToast({ message, tone, id: Date.now() });
  }, []);

  const [pendingCount, setPendingCount] = useState(0);
  const withPending = useCallback(async (promiseFactory) => {
    setPendingCount((c) => c + 1);
    try {
      return await promiseFactory();
    } finally {
      setPendingCount((c) => Math.max(0, c - 1));
    }
  }, []);
  const showSlowLoading = useDelayedBoolean(pendingCount > 0, 700);

  const logActivity = useCallback(
    (entry) => {
      if (!isSupabaseConfigured) return;
      const actorId = currentUser?.id;
      if (!actorId) return;

      const payload = {
        actor_user_id: actorId,
        actor_email: currentUser?.email || null,
        actor_role: userRole || null,
        action: String(entry?.action || "").trim() || "unknown",
        entity_type: entry?.entityType ? String(entry.entityType) : null,
        entity_id: entry?.entityId ? String(entry.entityId) : null,
        message: entry?.message ? String(entry.message) : null,
        meta: entry?.meta && typeof entry.meta === "object" ? entry.meta : {},
      };

      Promise.resolve()
        .then(() => supabase.from("activity_log").insert(payload))
        .then((res) => {
          if (res?.error) return;
        })
        .catch(() => {});
    },
    [currentUser?.email, currentUser?.id, userRole]
  );

  const denyEdit = useCallback(() => {
    showToast("Staff accounts are view-only", "error");
  }, [showToast]);

  const shareEvent = useCallback(
    async (event) => {
      const url = eventShareUrl(event?.id);
      if (!url) return;
      try {
        if (navigator.share) {
          await navigator.share({
            title: event?.name || "OA event",
            text: event?.date ? `${event.name} · ${dayLabelFromISO(event.date)}` : event?.name || "OA event",
            url,
          });
          return;
        }
        await navigator.clipboard.writeText(url);
        showToast("Event link copied");
      } catch (error) {
        if (error?.name === "AbortError") return;
        try {
          await navigator.clipboard.writeText(url);
          showToast("Event link copied");
        } catch {
          window.prompt("Copy event link", url);
        }
      }
    },
    [showToast]
  );

  const navigateView = useCallback((nextView, { replace = false } = {}) => {
    setRouteEventId("");
    setView(nextView);
    if (typeof window === "undefined") return;
    const nextPath = dashboardPathForView(nextView);
    if (window.location.pathname === nextPath && !window.location.search) return;
    const method = replace ? "replaceState" : "pushState";
    window.history[method]({}, "", nextPath);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const handlePopState = () => {
      setView(dashboardViewFromPath(window.location.pathname));
      setRouteEventId(eventShareIdFromLocation());
    };
    window.addEventListener("popstate", handlePopState);
    if (!routeDashboardViews[normalizeDashboardPath(window.location.pathname)] && !isEventSharePath(window.location.pathname)) {
      navigateView(view, { replace: true });
    }
    return () => window.removeEventListener("popstate", handlePopState);
  }, [navigateView, view]);

  useEffect(() => {
    if (!canAccessFinance && view === "Finance") navigateView("List", { replace: true });
  }, [canAccessFinance, navigateView, view]);

  useEffect(() => {
    if (!canAccessSales && view === "Sales") navigateView("List", { replace: true });
  }, [canAccessSales, navigateView, view]);

  useEffect(() => {
    if (!canAccessDjs && view === "DJs") navigateView("List", { replace: true });
  }, [canAccessDjs, navigateView, view]);

  useEffect(() => {
    if (!canManageUsers && view === "Users") navigateView("List", { replace: true });
  }, [canManageUsers, navigateView, view]);

  useEffect(() => {
    if (!canViewActivity && view === "Activity") navigateView("List", { replace: true });
  }, [canViewActivity, navigateView, view]);

  useEffect(() => {
    if (!canAccessDjPayments && view === "DJPayments") navigateView("List", { replace: true });
  }, [canAccessDjPayments, navigateView, view]);

  useEffect(() => {
    activeWeekKeyRef.current = activeWeekKey;
  }, [activeWeekKey]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!isSupabaseConfigured || !currentUser?.id) return undefined;
    let cancelled = false;

    async function loadMentionUsers() {
      try {
        const payload = await withPending(() => dashboardApiRequest("/api/users"));
        if (!cancelled) setMentionUsers(Array.isArray(payload?.users) ? payload.users : []);
      } catch {
        if (!cancelled) setMentionUsers([]);
      }
    }

    loadMentionUsers();
    return () => {
      cancelled = true;
    };
  }, [currentUser?.id, withPending]);

  const loadComments = useCallback(async () => {
    if (!isSupabaseConfigured) return;

    try {
      const payload = await withPending(() => dashboardApiRequest("/api/comments"));
      setCommentsError("");
      setComments(Array.isArray(payload?.comments) ? payload.comments.map(mapSupabaseComment) : []);
      return;
    } catch {
      // ignore and fallback to direct select
    }

    const { data, error } = await withPending(() =>
      supabase.from("event_comments").select("id, event_id, user_id, body, mention_user_ids, created_at").order("created_at", { ascending: true })
    );
    if (error) {
      const message = error.message || "Could not load comments.";
      setCommentsError(message.toLowerCase().includes("event_comments") ? "Run supabase/event_comments.sql in Supabase SQL Editor to enable comments." : message);
      setComments([]);
      return;
    }

    setCommentsError("");
    setComments(Array.isArray(data) ? data.map(mapSupabaseComment) : []);
  }, [withPending]);

  const loadEvents = useCallback(async () => {
    if (!isSupabaseConfigured) return;

    const { data, error } = await withPending(() =>
      runEventSelect((select) =>
        supabase
          .from("events")
          .select(select)
          .order("event_date", { ascending: true })
          .order("slot_order", { foreignTable: "event_slots", ascending: true })
      )
    );

    if (error) {
      setSyncError(error.message);
      setSyncStatus("");
      return;
    }

    if (!Array.isArray(data)) return;

    setSyncError("");
    setSyncStatus("");
    setEvents(data.filter((row) => row?.event_date).map(mapSupabaseEvent));
  }, [withPending]);

  const loadDjProfiles = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setDjProfilesLoading(false);
      return;
    }

    setDjProfilesLoading(true);
    const { data, error } = await withPending(() =>
      supabase.from("dj_profile_summary").select("*").order("name", { ascending: true })
    );
    setDjProfilesLoading(false);

    if (error) {
      const message = error.message || "";
      setDjProfilesError(message.toLowerCase().includes("dj_profile_summary") ? "Run supabase/dj_profiles_genres_fees.sql in Supabase SQL Editor to enable DJ profiles, genres, and fees." : message);
      setDjProfiles([]);
      return;
    }

    setDjProfilesError("");
    setDjProfiles(Array.isArray(data) ? data.map(mapDjProfile) : []);
  }, [withPending]);

  const findOrCreateDj = useCallback(async (rawName) => {
    const name = canonicalDjName(rawName);
    if (!name || name.toUpperCase().includes("TBD")) return null;

    const existing = await supabase.from("djs").select("id").ilike("name", name).limit(1).maybeSingle();
    if (existing.error) throw existing.error;
    if (existing.data?.id) return existing.data.id;

    const created = await supabase.from("djs").insert({ name }).select("id").single();
    if (created.error?.message?.includes("row-level security policy")) return null;
    if (created.error) throw created.error;
    logActivity({
      action: "dj_created",
      entityType: "dj",
      entityId: created.data.id,
      message: `DJ created · ${name}`,
      meta: { djId: created.data.id, name },
    });
    return created.data.id;
  }, [logActivity]);

  const saveEventToSupabase = useCallback(
    async (event) => {
      const payload = {
        event_name: event.name,
        event_date: event.date,
        day_name: event.day,
        event_type: event.name,
        genre_profile: event.genre,
        stage: event.stage,
        status: event.status,
        notes: setDashboardNotes(event.notes, event.ic, event.mentionedUserIds, event.consoleFeeAmount),
      };

      const savedEvent = isSupabaseUuid(event.id)
        ? await supabase.from("events").update(payload).eq("id", event.id).select("id").single()
        : await supabase.from("events").insert(payload).select("id").single();

      if (savedEvent.error) {
        const message = savedEvent.error.message || "";
        if (event.status === "Need Attention" && message.toLowerCase().includes("check")) {
          throw new Error("Run supabase/required_dashboard_schema_updates.sql in Supabase SQL Editor before saving Need Attention.");
        }
        throw savedEvent.error;
      }

      const deletedSlots = await supabase.from("event_slots").delete().eq("event_id", savedEvent.data.id);
      if (deletedSlots.error) throw deletedSlots.error;

      for (const [slotIndex, slot] of event.slots.entries()) {
        const savedSlot = await supabase
          .from("event_slots")
          .insert({
            event_id: savedEvent.data.id,
            slot_order: slotIndex + 1,
            start_time: slotNeedsTime(slot) ? slot.start : "00:00",
            end_time: slotNeedsTime(slot) ? slot.end : "00:00",
            role: normalizeSlotRole(slot.role),
            expected_energy: slot.energy ?? 3,
          })
          .select("id")
          .single();

        if (savedSlot.error) {
          const message = savedSlot.error.message || "";
          if ((slot.role === "MC" || normalizeSlotRole(slot.role) === "Main") && message.toLowerCase().includes("check")) {
            throw new Error("Run supabase/required_dashboard_schema_updates.sql in Supabase SQL Editor before saving Main/MC slots.");
          }
          throw savedSlot.error;
        }

        const lineup = slotLineupForSave(slot);
        for (const participantName of lineup.participants) {
          const djId = await findOrCreateDj(participantName);
          const savedAssignment = await supabase.from("event_assignments").insert({
            event_slot_id: savedSlot.data.id,
            dj_id: djId,
            assignment_status: event.status === "Confirmed" ? "Confirmed" : "Pending",
            notes: lineup.participants.length > 1 || !djId ? lineup.displayName || slot.dj : null,
          });

          if (savedAssignment.error) throw savedAssignment.error;
        }
      }
    },
    [findOrCreateDj],
  );

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let refreshTimer = null;
    let commentsRefreshTimer = null;
    let djProfilesRefreshTimer = null;

    const scheduleRefresh = () => {
      if (refreshTimer) window.clearTimeout(refreshTimer);
      refreshTimer = window.setTimeout(loadEvents, 250);
    };
    const scheduleCommentsRefresh = () => {
      if (commentsRefreshTimer) window.clearTimeout(commentsRefreshTimer);
      commentsRefreshTimer = window.setTimeout(loadComments, 250);
    };
    const scheduleDjProfilesRefresh = () => {
      if (djProfilesRefreshTimer) window.clearTimeout(djProfilesRefreshTimer);
      djProfilesRefreshTimer = window.setTimeout(loadDjProfiles, 250);
    };

    loadEvents();
    loadComments();
    loadDjProfiles();
    const channel = supabase
      .channel("oa-dashboard-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "events" }, scheduleRefresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "event_slots" }, scheduleRefresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "event_assignments" }, scheduleRefresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "djs" }, () => {
        scheduleRefresh();
        scheduleDjProfilesRefresh();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "genres" }, scheduleDjProfilesRefresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "dj_genres" }, scheduleDjProfilesRefresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "dj_fees" }, scheduleDjProfilesRefresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "event_comments" }, scheduleCommentsRefresh)
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setSyncError("");
          setSyncStatus("Realtime connected");
        }
      });

    return () => {
      if (refreshTimer) window.clearTimeout(refreshTimer);
      if (commentsRefreshTimer) window.clearTimeout(commentsRefreshTimer);
      if (djProfilesRefreshTimer) window.clearTimeout(djProfilesRefreshTimer);
      supabase.removeChannel(channel);
    };
  }, [loadComments, loadDjProfiles, loadEvents]);

  const djOptions = useMemo(() => {
    const set = new Set(["(OPENING TBD)"]);
    for (const e of events) {
      for (const s of e.slots) {
        if (s.dj && s.role !== "MC") set.add(s.dj);
      }
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [events]);

  const genreOptions = useMemo(() => {
    const set = new Set([
      "AFRO",
      "AMAPIANO",
      "BAILE",
      "HIP-HOP",
      "TECH HOUSE",
      "MELODIC TECHNO",
      "TECHNO",
      "HARD TECHNO",
      "HARD GROOVE",
      "TRANCE",
      "BOUNCE",
      "URBAN",
    ]);
    for (const event of events) {
      for (const genre of splitGenreTags(event.genre)) {
        set.add(genre);
      }
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [events]);

  const existingEventsByDate = useMemo(() => {
    const map = new Map();
    for (const event of events) {
      if (!map.has(event.date)) map.set(event.date, event);
    }
    return map;
  }, [events]);

  const eventsById = useMemo(() => new Map(events.map((event) => [event.id, event])), [events]);
  const focusedEvent = routeEventId ? eventsById.get(String(routeEventId)) || null : null;

  const commentsByEventId = useMemo(() => {
    const map = new Map();
    for (const comment of comments) {
      const list = map.get(comment.eventId) ?? [];
      list.push(comment);
      map.set(comment.eventId, list);
    }
    return map;
  }, [comments]);

  useEffect(() => {
    const knownIds = knownCommentIdsRef.current;
    if (!didInitCommentsToastRef.current) {
      knownCommentIdsRef.current = new Set(comments.map((comment) => comment.id));
      didInitCommentsToastRef.current = true;
      return;
    }

    const newComments = comments.filter((comment) => comment?.id && !knownIds.has(comment.id));
    if (!newComments.length) return;

    for (const comment of newComments) knownIds.add(comment.id);
  }, [comments]);

  const todayISO = useMemo(() => isoFromDate(new Date()), []);

  const holidayYears = useMemo(() => {
    const now = new Date();
    return Array.from(new Set([now.getFullYear(), calendarCursor.getFullYear(), calendarCursor.getFullYear() + 1])).sort();
  }, [calendarCursor]);

  useEffect(() => {
    let cancelled = false;

    async function loadMalaysiaHolidays() {
      try {
        setHolidayError("");
        const responses = await Promise.all(
          holidayYears.map((year) =>
            fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/MY`).then((response) => {
              if (response.status === 204) return [];
              if (!response.ok) throw new Error(`Could not load Malaysia holidays for ${year}`);
              return response.json();
            }),
          ),
        );
        if (cancelled) return;
        const merged = responses.flat().filter((holiday) => holiday?.date);
        const source = merged.length ? merged : fallbackMalaysiaHolidays(holidayYears);
        const deduped = Array.from(new Map(source.map((holiday) => [`${holiday.date}-${holiday.name}`, holiday])).values());
        deduped.sort((a, b) => a.date.localeCompare(b.date));
        setMalaysiaHolidays(deduped);
      } catch (error) {
        if (!cancelled) {
          setMalaysiaHolidays(fallbackMalaysiaHolidays(holidayYears));
          setHolidayError("");
        }
      }
    }

    loadMalaysiaHolidays();
    return () => {
      cancelled = true;
    };
  }, [holidayYears]);

  const holidaysByDate = useMemo(() => {
    const map = new Map();
    for (const holiday of malaysiaHolidays) {
      const list = map.get(holiday.date) ?? [];
      list.push(holiday);
      map.set(holiday.date, list);
    }
    return map;
  }, [malaysiaHolidays]);

  const pendingUpcomingEvents = useMemo(() => {
    return events
      .filter((event) => event.date >= todayISO && event.status !== "Confirmed")
      .sort((a, b) => {
        const dateCompare = a.date.localeCompare(b.date);
        if (dateCompare !== 0) return dateCompare;
        return (a.name || "").localeCompare(b.name || "");
      });
  }, [events, todayISO]);

  const pendingUpcomingCount = pendingUpcomingEvents.length;
  const bookingRequests = useMemo(() => {
    const currentUserId = currentUser?.id ? String(currentUser.id) : "";
    if (!currentUserId) return [];
    const rows = [];
    for (const event of events) {
      if (event.date < todayISO || event.status !== "Confirmed") continue;
      for (const slot of event.slots || []) {
        for (const assignment of slot.assignments || []) {
          if (!assignment.assignmentId || String(assignment.linkedUserId || "") !== currentUserId) continue;
          if (assignment.assignmentStatus === "Accepted" || assignment.assignmentStatus === "Rejected") continue;
          rows.push({ event, slot, assignment });
        }
      }
    }
    return rows.sort((a, b) => {
      const dateCompare = a.event.date.localeCompare(b.event.date);
      if (dateCompare !== 0) return dateCompare;
      return (a.event.name || "").localeCompare(b.event.name || "");
    });
  }, [currentUser?.id, events, todayISO]);
  const bookingRequestCount = bookingRequests.length;
  const mentionedEvents = useMemo(() => {
    const currentUserId = currentUser?.id;
    return events
      .filter((event) => {
        if (event.date < todayISO) return false;
        if (currentUserId && (event.mentionedUserIds || []).includes(currentUserId)) return true;
        return textMentionsUser(event.notes, currentMentionUser);
      })
      .sort((a, b) => {
        const dateCompare = a.date.localeCompare(b.date);
        if (dateCompare !== 0) return dateCompare;
        return (a.name || "").localeCompare(b.name || "");
      });
  }, [currentMentionUser, currentUser?.id, events, todayISO]);
  const mentionedComments = useMemo(() => {
    const currentUserId = currentUser?.id;
    if (!currentUserId) return [];
    return comments
      .filter((comment) => {
        const event = eventsById.get(comment.eventId);
        if (!event || event.date < todayISO) return false;
        if ((comment.mentionUserIds || []).includes(currentUserId)) return true;
        return textMentionsUser(comment.body, currentMentionUser);
      })
      .sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
  }, [comments, currentMentionUser, currentUser?.id, eventsById, todayISO]);
  const mentionCount = mentionedEvents.length + mentionedComments.length;
  const notificationBadgeCount = mentionCount + bookingRequestCount + (canEdit ? pendingUpcomingCount : 0);
  const primaryNavCount =
    2 +
    (canAccessDjs ? 1 : 0) +
    (canManageUsers ? 1 : 0) +
    (canViewActivity ? 1 : 0) +
    (canAccessFinance ? 1 : 0) +
    (canAccessDjPayments ? 1 : 0);
  const primaryNavGridClass =
    primaryNavCount >= 6
      ? "grid-cols-3 sm:grid-cols-6"
      : primaryNavCount === 5
        ? "grid-cols-3 sm:grid-cols-5"
        : primaryNavCount === 4
          ? "grid-cols-2 sm:grid-cols-4"
          : "grid-cols-2";

  const updateNotificationsPopoverPosition = useCallback(() => {
    const node = notificationsButtonRef.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    const gutter = 12;
    const width = Math.min(560, Math.max(280, window.innerWidth - gutter * 2));
    const left = Math.max(gutter, Math.min(window.innerWidth - width - gutter, rect.right - width));
    const top = Math.min(window.innerHeight - gutter, rect.bottom + 8);
    setNotificationsPopoverStyle({ position: "fixed", left, top, width });
  }, []);

  useEffect(() => {
    if (!notificationsOpen) return undefined;
    updateNotificationsPopoverPosition();
    let raf = 0;
    const handle = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(updateNotificationsPopoverPosition);
    };
    window.addEventListener("resize", handle);
    window.addEventListener("scroll", handle, { passive: true });
    return () => {
      window.removeEventListener("resize", handle);
      window.removeEventListener("scroll", handle);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [notificationsOpen, updateNotificationsPopoverPosition]);

  const updateAddMenuPosition = useCallback(() => {
    const node = addButtonRef.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    const gutter = 12;
    const width = 176;
    const left = Math.max(gutter, Math.min(window.innerWidth - width - gutter, rect.right - width));
    const top = rect.bottom + 8;
    setAddMenuStyle({ position: "fixed", left, top, width });
  }, []);

  useEffect(() => {
    if (!addMenuOpen) return undefined;
    updateAddMenuPosition();
    let raf = 0;
    const handle = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(updateAddMenuPosition);
    };
    window.addEventListener("resize", handle);
    window.addEventListener("scroll", handle, { passive: true });
    return () => {
      window.removeEventListener("resize", handle);
      window.removeEventListener("scroll", handle);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [addMenuOpen, updateAddMenuPosition]);

  const upcomingMalaysiaHolidays = useMemo(() => {
    return malaysiaHolidays.filter((holiday) => holiday.date >= todayISO).sort((a, b) => a.date.localeCompare(b.date));
  }, [malaysiaHolidays, todayISO]);

  const scopedEvents = useMemo(() => {
    return events.filter((event) => (dateScope === "Past" ? event.date < todayISO : event.date >= todayISO));
  }, [dateScope, events, todayISO]);

  const pastCount = useMemo(() => events.filter((event) => event.date < todayISO).length, [events, todayISO]);
  const upcomingCount = events.length - pastCount;
  const statEvents = view === "Calendar" ? events : scopedEvents;

  const stats = useMemo(() => {
    const total = statEvents.length;
    const confirmed = statEvents.filter((x) => x.status === "Confirmed").length;
    const unconfirmed = statEvents.filter((x) => x.status === "Unconfirmed").length;
    const needAttention = statEvents.filter(eventNeedsAttention).length;
    return { total, confirmed, unconfirmed, needAttention };
  }, [statEvents]);

  const filteredEvents = useMemo(() => {
    return scopedEvents
      .filter((event) => {
        const matchesSearch = `${event.name} ${event.genre} ${event.stage} ${event.notes || ""} ${event.ic || ""} ${event.slots.map((x) => x.dj).join(" ")}`
          .toLowerCase()
          .includes(search.toLowerCase());

        if (!matchesSearch) return false;
        return eventMatchesStatusFilter(event, activeFilter);
      })
      .sort((a, b) => {
        const dateCompare = a.date.localeCompare(b.date);
        if (dateCompare !== 0) return dateSort === "asc" ? dateCompare : -dateCompare;
        return (a.name || "").localeCompare(b.name || "");
      });
  }, [activeFilter, dateSort, scopedEvents, search]);

  const listMonthLabel = useMemo(() => {
    return listMonthCursor.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  }, [listMonthCursor]);

  const listMonthRange = useMemo(() => {
    const start = new Date(listMonthCursor.getFullYear(), listMonthCursor.getMonth(), 1);
    const end = new Date(listMonthCursor.getFullYear(), listMonthCursor.getMonth() + 1, 0);
    return { startISO: isoFromDate(start), endISO: isoFromDate(end) };
  }, [listMonthCursor]);

  const listGroupedSourceEvents = useMemo(() => {
    if (listGrouping !== "month") return filteredEvents;
    return filteredEvents.filter((event) => event.date >= listMonthRange.startISO && event.date <= listMonthRange.endISO);
  }, [filteredEvents, listGrouping, listMonthRange.endISO, listMonthRange.startISO]);

  const calendarFilteredEvents = useMemo(() => {
    return events
      .filter((event) => {
        const matchesSearch = `${event.name} ${event.genre} ${event.stage} ${event.notes || ""} ${event.ic || ""} ${event.slots.map((x) => x.dj).join(" ")}`
          .toLowerCase()
          .includes(search.toLowerCase());

        if (!matchesSearch) return false;
        return eventMatchesStatusFilter(event, activeFilter);
      })
      .sort((a, b) => {
        const dateCompare = a.date.localeCompare(b.date);
        if (dateCompare !== 0) return dateSort === "asc" ? dateCompare : -dateCompare;
        return (a.name || "").localeCompare(b.name || "");
      });
  }, [activeFilter, dateSort, events, search]);

  const groupedEvents = useMemo(() => {
    const groups = new Map();
    for (const event of listGroupedSourceEvents) {
      const key = weekKeyFromISO(event.date);
      const items = groups.get(key) ?? [];
      items.push(event);
      groups.set(key, items);
    }

    return Array.from(groups.entries())
      .map(([key, items]) => ({
        key,
        weekName: `Week ${weekOfMonthFromISO(items[0]?.date ?? key)}`,
        label: weekLabelFromKey(key),
        items,
        confirmed: items.filter((event) => event.status === "Confirmed").length,
        needsAttention: items.filter(eventNeedsAttention).length,
      }))
      .sort((a, b) => (dateSort === "asc" ? a.key.localeCompare(b.key) : b.key.localeCompare(a.key)));
  }, [dateSort, listGroupedSourceEvents]);

  const effectiveWeekKey = useMemo(() => {
    if (!activeWeekKey) return groupedEvents[0]?.key || null;
    return groupedEvents.some((g) => g.key === activeWeekKey) ? activeWeekKey : groupedEvents[0]?.key || null;
  }, [activeWeekKey, groupedEvents]);

  const scrollToWeekKey = useCallback((key) => {
    const node = weekSectionRefs.current?.[key];
    if (!node) return false;
    node.scrollIntoView({ behavior: "smooth", block: "start" });
    return true;
  }, []);

  const scrollToEventCard = useCallback((eventId) => {
    const node = eventCardRefs.current?.[String(eventId)];
    if (!node) return false;
    node.scrollIntoView({ behavior: "smooth", block: "center" });
    return true;
  }, []);

  const weekKeys = useMemo(() => groupedEvents.map((g) => g.key), [groupedEvents]);
  const weekIndex = useMemo(() => {
    if (!effectiveWeekKey) return -1;
    return weekKeys.indexOf(effectiveWeekKey);
  }, [effectiveWeekKey, weekKeys]);
  const canJumpPrevWeek = weekIndex > 0;
  const canJumpNextWeek = weekIndex >= 0 && weekIndex < weekKeys.length - 1;

  useEffect(() => {
    if (view !== "List") {
      listWeekNavInitRef.current = { view, grouping: listGrouping, monthKey: `${listMonthCursor.getFullYear()}-${listMonthCursor.getMonth()}` };
      return;
    }

    if (!weekKeys.length) {
      setActiveWeekKey(null);
      return;
    }

    if (pendingNotificationTarget) return;

    const nextMonthKey = `${listMonthCursor.getFullYear()}-${listMonthCursor.getMonth()}`;
    const prev = listWeekNavInitRef.current;
    const shouldResetActiveWeek = prev.view !== "List" || prev.grouping !== listGrouping || prev.monthKey !== nextMonthKey;
    listWeekNavInitRef.current = { view, grouping: listGrouping, monthKey: nextMonthKey };
    if (!shouldResetActiveWeek) return;

    setActiveWeekKey(weekKeys[0]);
  }, [listGrouping, listMonthCursor, pendingNotificationTarget, view, weekKeys]);

  useEffect(() => {
    if (view !== "List" || !pendingNotificationTarget) return undefined;
    if (!weekKeys.includes(pendingNotificationTarget.weekKey)) return undefined;

    setActiveWeekKey(pendingNotificationTarget.weekKey);
    let attempts = 0;
    let timer = 0;

    const tryScroll = () => {
      attempts += 1;
      if (scrollToEventCard(pendingNotificationTarget.eventId) || attempts >= 10) {
        setPendingNotificationTarget(null);
        return;
      }
      timer = window.setTimeout(tryScroll, 80);
    };

    timer = window.setTimeout(tryScroll, 0);
    return () => {
      if (timer) window.clearTimeout(timer);
    };
  }, [pendingNotificationTarget, scrollToEventCard, view, weekKeys]);

  const openNotificationEvent = useCallback((event) => {
    const weekKey = weekKeyFromISO(event.date);
    setNotificationsOpen(false);
    setSearch("");
    setActiveFilter("All");
    setDateScope(event.date < todayISO ? "Past" : "Upcoming");
    setListGrouping("all");
    navigateView("List");
    setActiveWeekKey(weekKey);
    setPendingNotificationTarget({ eventId: String(event.id), weekKey });
  }, [navigateView, todayISO]);

  const openSingleEvent = useCallback((event) => {
    const eventId = event?.id ? String(event.id) : "";
    if (!eventId) return;
    setNotificationsOpen(false);
    setRouteEventId(eventId);
    if (typeof window === "undefined") return;
    const nextPath = `/event/${encodeURIComponent(eventId)}`;
    if (window.location.pathname === nextPath && !window.location.search) return;
    window.history.pushState({}, "", nextPath);
  }, []);

  const openDjFromName = useCallback((name) => {
    setDjProfilesInitialQuery(String(name || ""));
    navigateView("DJs");
  }, [navigateView]);

  const respondToBookingRequest = useCallback(
    async (event, slot, assignment, nextStatus) => {
      const assignmentId = assignment?.assignmentId ? String(assignment.assignmentId) : "";
      if (!assignmentId) return;
      if (!isSupabaseConfigured) {
        showToast("Supabase is not configured.", "error");
        return;
      }

      const previousEvents = events;
      setEvents((prev) =>
        prev.map((item) =>
          item.id === event.id
            ? {
                ...item,
                slots: item.slots.map((itemSlot) =>
                  itemSlot.id === slot.id
                    ? {
                        ...itemSlot,
                        assignments: (itemSlot.assignments || []).map((itemAssignment) =>
                          String(itemAssignment.assignmentId || "") === assignmentId
                            ? { ...itemAssignment, assignmentStatus: nextStatus }
                            : itemAssignment,
                        ),
                        assignmentStatus: aggregateAssignmentStatus(
                          (itemSlot.assignments || []).map((itemAssignment) =>
                            String(itemAssignment.assignmentId || "") === assignmentId
                              ? { ...itemAssignment, assignmentStatus: nextStatus }
                              : itemAssignment,
                          ),
                        ),
                      }
                    : itemSlot,
                ),
              }
            : item,
        ),
      );

      try {
        const { error } = await supabase.from("event_assignments").update({ assignment_status: nextStatus }).eq("id", assignmentId);
        if (error) throw error;
        showToast(nextStatus === "Accepted" ? "Booking accepted" : "Booking rejected");
        logActivity({
          action: nextStatus === "Accepted" ? "dj_booking_accepted" : "dj_booking_rejected",
          entityType: "event_assignment",
          entityId: assignmentId,
          message: `${nextStatus} · ${assignment.dj} · ${event.name} · ${dayLabelFromISO(event.date)}`,
          meta: { assignmentId, eventId: event.id, djName: assignment.dj, date: event.date, status: nextStatus },
        });
        await loadEvents();
      } catch (error) {
        setEvents(previousEvents);
        showToast(error?.message || "Could not update booking", "error");
      }
    },
    [events, loadEvents, logActivity, showToast],
  );

  const jumpWeek = (direction) => {
    if (view !== "List") return;
    if (!weekKeys.length) return;
    const index = Math.max(0, weekIndex >= 0 ? weekIndex : 0);
    const nextIndex = Math.max(0, Math.min(weekKeys.length - 1, index + direction));
    if (nextIndex === index) return;
    const nextKey = weekKeys[nextIndex];
    setActiveWeekKey(nextKey);
    scrollToWeekKey(nextKey);
  };

  useEffect(() => {
    if (view !== "List") return undefined;
    if (!weekKeys.length) return undefined;

    let raf = 0;
    const threshold = 184;

    const handleScroll = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        let current = weekKeys[0] || null;
        for (const key of weekKeys) {
          const node = weekSectionRefs.current?.[key];
          if (!node) continue;
          const top = node.getBoundingClientRect().top;
          if (top - threshold <= 0) {
            current = key;
          } else {
            break;
          }
        }
        if (current && current !== activeWeekKeyRef.current) setActiveWeekKey(current);
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [view, weekKeys]);

  const saveModalDays = async (modalDays) => {
    if (!canEdit) {
      denyEdit();
      throw new Error("View-only account");
    }
    const existingByDate = new Map(events.map((e) => [e.date, e]));
    if (!modalLockDateSelection) {
      const duplicates = modalDays.filter((day) => existingByDate.has(day.isoDate));
      if (duplicates.length) {
        const labels = duplicates.map((day) => dayLabelFromISO(day.isoDate)).join(", ");
        showToast(`Schedule already exists: ${labels}`, "error");
        throw new Error(`Schedule already exists: ${labels}`);
      }
    }

    const next = [...events];
    let nextId = events.reduce((max, e) => Math.max(max, Number(e.id) || 0), 0) + 1;
    const eventsToSave = [];
    const activityEntries = [];

    for (const d of modalDays) {
      const dateObj = isoToDate(d.isoDate);
      const { day, dayNo, month } = formatEventDatePieces(dateObj);
      const slots = d.slots
        .map((s) => {
          const parsed = parseDjLineup(s.dj);
          const connector = normalizeLineupConnector(s.djConnector || parsed.connector);
          const desiredCount = lineupParticipantCount(connector);
          const participantsSource =
            Array.isArray(s.djParticipants) && s.djParticipants.length ? s.djParticipants : parsed.participants;
          const participants = normalizeLineupParticipants(participantsSource, desiredCount)
            .map(canonicalDjName)
            .filter(Boolean);
          const dj = buildLineupDisplayName({ connector, participants }) || canonicalDjName(s.dj);
          return { ...s, dj, djConnector: connector, djParticipants: participants };
        })
        .filter((s) => s.dj.length && slotHasValidTime(s))
        .map((s) => ({
          dj: s.dj,
          djConnector: s.djConnector,
          djParticipants: s.djParticipants,
          role: s.role,
          start: slotNeedsTime(s) ? s.start : "",
          end: slotNeedsTime(s) ? s.end : "",
          energy: s.energy ?? 3,
          warning: s.dj.toUpperCase().includes("TBD"),
        }));

      let requestedStatus = d.status || (slots.length ? "Unconfirmed" : "Need Attention");
      if (requestedStatus === "No Lineup") requestedStatus = slots.length ? "Unconfirmed" : "Need Attention";
      const status = requestedStatus;
      const name = String(d.name || "").trim() || "Untitled";
      const genre = String(d.genre || "").trim() || "—";
      const stage = d.stage || stageOptions[0];
      const remarks = String(d.remarks || "").trim();

      const existing = existingByDate.get(d.isoDate);
      const event = {
        id: existing?.id ?? String(nextId++),
        date: d.isoDate,
        day,
        dayNo,
        month,
        name,
        genre,
        status,
        stage,
        slots,
        ic: existing?.ic || "",
        mentionedUserIds: mentionedUserIdsFromText(remarks, mentionUsers),
        notes: remarks,
      };
      activityEntries.push({
        action: existing ? "event_day_updated" : "event_day_created",
        entityType: "event_day",
        entityId: d.isoDate,
        message: `${existing ? "Updated" : "Created"} ${name} · ${dayLabelFromISO(d.isoDate)}`,
        meta: { date: d.isoDate, name, status, stage, slotCount: slots.length, mode: modalDateMode },
      });

      if (event.status === "Confirmed") {
        const blockers = getConfirmationBlockers(event);
        if (blockers.length) {
          const message = `${dayLabelFromISO(event.date)} cannot be confirmed: ${blockers.join(" ")}`;
          showToast(message, "error");
          throw new Error(message);
        }
      }

      if (existing) {
        const idx = next.findIndex((x) => x.id === existing.id);
        if (idx >= 0) next[idx] = event;
      } else {
        next.push(event);
      }

      eventsToSave.push(event);
    }

    next.sort((a, b) => a.date.localeCompare(b.date));
    setEvents(next);

    if (isSupabaseConfigured && eventsToSave.length) {
      try {
        setSyncError("");
        setSyncStatus("Saving to Supabase...");
        await Promise.all(eventsToSave.map(saveEventToSupabase));
        await Promise.all([loadEvents(), loadDjProfiles()]);
        setSyncStatus("Saved to Supabase");
        showToast("Saved to database");
        for (const entry of activityEntries) logActivity(entry);
      } catch (error) {
        const message = error.message || "Could not save to Supabase";
        setSyncError(message);
        setSyncStatus("");
        showToast(message.includes("required_dashboard_schema_updates.sql") ? "Run required_dashboard_schema_updates.sql in Supabase first" : "Save failed", "error");
        throw new Error(message);
      }
    }
  };

  const assignIC = (eventId, ic) => {
    if (!canEdit) {
      denyEdit();
      return;
    }
    setEvents((prev) =>
      prev.map((e) => {
        if (e.id !== eventId) return e;
        return { ...e, ic };
      }),
    );

    if (isSupabaseConfigured) {
      (async () => {
        try {
          const existing = events.find((event) => event.id === eventId);
          if (!existing || !isSupabaseUuid(eventId)) return;
          setSyncError("");
          setSyncStatus("Saving PIC...");
          const { error } = await supabase.from("events").update({ notes: setDashboardNotes(existing.notes, ic, existing.mentionedUserIds, existing.consoleFeeAmount) }).eq("id", eventId);
          if (error) throw error;
          setSyncStatus("PIC saved to Supabase");
          showToast("PIC saved to database");
          logActivity({
            action: "event_pic_updated",
            entityType: "event",
            entityId: eventId,
            message: `PIC updated · ${existing.name} · ${dayLabelFromISO(existing.date)}`,
            meta: { eventId, date: existing.date, name: existing.name, ic },
          });
        } catch (error) {
          setSyncError(error.message || "Could not update PIC");
          setSyncStatus("");
          showToast("PIC save failed", "error");
        }
      })();
    }
  };

  const updateEventStatus = (event, status) => {
    if (!canEdit) {
      denyEdit();
      return;
    }
    if (status === "Confirmed") {
      const blockers = getConfirmationBlockers(event);
      if (blockers.length) {
        showToast(blockers.join(" "), "error");
        return;
      }
    }

    const previousEvents = events;
    const updatedEvent = { ...event, status };
    setEvents((prev) => prev.map((item) => (item.id === event.id ? updatedEvent : item)));
    setPreviewEvent((prev) => (prev?.id === event.id ? updatedEvent : prev));

    if (isSupabaseConfigured && isSupabaseUuid(event.id)) {
      (async () => {
        try {
          setSyncError("");
          setSyncStatus("Saving status...");
          const { error } = await supabase
            .from("events")
            .update({ status, notes: setDashboardNotes(updatedEvent.notes, updatedEvent.ic, updatedEvent.mentionedUserIds, updatedEvent.consoleFeeAmount) })
            .eq("id", event.id);
          if (error) {
            const message = error.message || "";
            if (status === "Need Attention" && message.toLowerCase().includes("check")) {
              throw new Error("Run supabase/required_dashboard_schema_updates.sql in Supabase SQL Editor before saving Need Attention.");
            }
            throw error;
          }
          if (status === "Confirmed") {
            const linkedAssignmentIds = (event.slots || [])
              .flatMap((slot) => slot.assignments || [])
              .filter((assignment) => assignment.assignmentId && assignment.linkedUserId)
              .map((assignment) => String(assignment.assignmentId));
            const unlinkedAssignmentIds = (event.slots || [])
              .flatMap((slot) => slot.assignments || [])
              .filter((assignment) => assignment.assignmentId && !assignment.linkedUserId)
              .map((assignment) => String(assignment.assignmentId));

            if (linkedAssignmentIds.length) {
              const assignmentUpdate = await supabase
                .from("event_assignments")
                .update({ assignment_status: "Pending" })
                .in("id", linkedAssignmentIds);
              if (assignmentUpdate.error) throw assignmentUpdate.error;
            }
            if (unlinkedAssignmentIds.length) {
              const assignmentUpdate = await supabase
                .from("event_assignments")
                .update({ assignment_status: "Confirmed" })
                .in("id", unlinkedAssignmentIds);
              if (assignmentUpdate.error) throw assignmentUpdate.error;
            }
          }
          setSyncStatus("Status saved to Supabase");
          if (status === "Confirmed" && event.slots.some((slot) => (slot.assignments || []).some((assignment) => assignment.linkedUserId))) {
            showToast("Night confirmed. Linked DJs were notified.");
          } else {
            showToast(status === "Confirmed" ? "Night confirmed" : "Status saved");
          }
          logActivity({
            action: "event_status_updated",
            entityType: "event",
            entityId: event.id,
            message: `Status updated · ${event.name} · ${dayLabelFromISO(event.date)}`,
            meta: { eventId: event.id, date: event.date, name: event.name, from: event.status, to: status },
          });
        } catch (error) {
          setEvents(previousEvents);
          setPreviewEvent((prev) => (prev?.id === event.id ? event : prev));
          setSyncError(error.message || "Could not update status");
          setSyncStatus("");
          showToast(error.message?.includes("required_dashboard_schema_updates.sql") ? "Run required_dashboard_schema_updates.sql in Supabase first" : "Status save failed", "error");
        }
      })();
      return;
    }

    showToast(status === "Confirmed" ? "Night confirmed locally" : "Status saved locally");
  };

  const addEventComment = useCallback(
    async (event, body) => {
      const cleanBody = String(body || "").trim();
      if (!cleanBody) return;
      const mentionUserIds = mentionedUserIdsFromText(cleanBody, mentionUsers);

      if (!isSupabaseConfigured || !isSupabaseUuid(event.id)) {
        const localComment = {
          id: `local-${Date.now()}`,
          eventId: event.id,
          userId: currentUser?.id || "local",
          body: cleanBody,
          mentionUserIds,
          createdAt: new Date().toISOString(),
        };
        setComments((prev) => [...prev, localComment]);
        showToast("Comment added locally");
        return;
      }

      if (!currentUser?.id) {
        showToast("Login required to comment", "error");
        return;
      }

      const { error } = await supabase.from("event_comments").insert({
        event_id: event.id,
        user_id: currentUser.id,
        body: cleanBody,
        mention_user_ids: mentionUserIds,
      });
      if (error) {
        const message = error.message || "Could not post comment.";
        setCommentsError(message.toLowerCase().includes("event_comments") ? "Run supabase/event_comments.sql in Supabase SQL Editor to enable comments." : message);
        showToast("Comment failed", "error");
        throw error;
      }
      setCommentsError("");
      await loadComments();
      showToast("Comment posted");
      logActivity({
        action: "event_comment_created",
        entityType: "event",
        entityId: event.id,
        message: `Comment added · ${event.name} · ${dayLabelFromISO(event.date)}`,
        meta: { eventId: event.id, date: event.date, name: event.name, mentionCount: mentionUserIds.length },
      });
    },
    [currentUser, loadComments, mentionUsers, showToast, logActivity],
  );

  const deleteEventDay = async (event) => {
    if (!canEdit) {
      denyEdit();
      return;
    }
    const confirmed = window.confirm(`Delete ${event.name} on ${dayLabelFromISO(event.date)}? This removes the day and its set times.`);
    if (!confirmed) return;

    const previousEvents = events;
    setPreviewEvent(null);
    setModalOpen(false);
    setModalInitialDays(null);
    setModalEditEvent(null);
    setEvents((prev) => prev.filter((item) => item.id !== event.id));

    if (isSupabaseConfigured && isSupabaseUuid(event.id)) {
      try {
        setSyncError("");
        setSyncStatus("Deleting day...");
        const { error } = await supabase.from("events").delete().eq("id", event.id);
        if (error) throw error;
        await loadEvents();
        setSyncStatus("Day deleted");
        showToast("Day deleted");
        logActivity({
          action: "event_day_deleted",
          entityType: "event",
          entityId: event.id,
          message: `Deleted ${event.name} · ${dayLabelFromISO(event.date)}`,
          meta: { eventId: event.id, date: event.date, name: event.name },
        });
      } catch (error) {
        setEvents(previousEvents);
        setSyncError(error.message || "Could not delete day");
        setSyncStatus("");
        showToast("Delete failed", "error");
      }
      return;
    }

    showToast("Day deleted locally");
  };

  const openAddModal = (dateISO) => {
    if (!canEdit) {
      denyEdit();
      return;
    }
    if (dateISO) setSeedDateISO(dateISO);
    setModalTitle("Add Event Week");
    setModalInitialDays(null);
    setModalDateMode("week");
    setModalLockDateSelection(false);
    setModalEditEvent(null);
    setModalOpen(true);
  };

  const openAddDayModal = (dateISO) => {
    if (!canEdit) {
      denyEdit();
      return;
    }
    if (dateISO) setSeedDateISO(dateISO);
    setModalTitle("Add Event Day");
    setModalInitialDays(null);
    setModalDateMode("day");
    setModalLockDateSelection(false);
    setModalEditEvent(null);
    setModalOpen(true);
  };

  const changeListMonth = (direction) => {
    if (direction === 0) {
      setListMonthCursor(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
      return;
    }
    setListMonthCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() + direction, 1));
  };

  const openEditModal = (event) => {
    if (!canEdit) {
      denyEdit();
      return;
    }
    const initialDays = [
      {
        isoDate: event.date,
        name: event.name,
        genre: event.genre,
        status:
          event.status === "No Lineup"
            ? (event.slots?.length ? "Unconfirmed" : "Need Attention")
            : event.status || (event.slots?.length ? "Unconfirmed" : "Need Attention"),
        remarks: stripDashboardNotes(event.notes),
        stage: event.stage,
        slots: (event.slots ?? []).map((s) => ({
          dj: s.dj ?? "",
          role: normalizeSlotRole(s.role),
          start: normalizeSlotRole(s.role) === "MC" ? "" : s.start ?? "22:30",
          end: normalizeSlotRole(s.role) === "MC" ? "" : s.end ?? "00:00",
          energy: s.energy ?? 3,
        })),
      },
    ];

    setSeedDateISO(event.date);
    setModalTitle("Edit Event Day");
    setModalInitialDays(initialDays);
    setModalDateMode("day");
    setModalLockDateSelection(true);
    setModalEditEvent(event);
    setModalOpen(true);
  };

  const openEditFromPreview = (event) => {
    setPreviewEvent(null);
    setModalOpen(false);
    setModalInitialDays(null);
    openEditModal(event);
  };

  const changeCalendarMonth = (direction) => {
    if (direction === 0) {
      setCalendarCursor(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
      return;
    }
    setCalendarCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() + direction, 1));
  };

  const calendarEventsByDate = useMemo(() => {
    const map = new Map();
    for (const e of calendarFilteredEvents) {
      const list = map.get(e.date) ?? [];
      list.push(e);
      map.set(e.date, list);
    }
    for (const [key, list] of map.entries()) {
      list.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
      map.set(key, list);
    }
    return map;
  }, [calendarFilteredEvents]);

  useEffect(() => {
    if (view !== "Calendar" || !calendarFilteredEvents.length || (activeFilter === "All" && !search.trim())) return;
    setCalendarCursor((current) => {
      const currentMonthISO = isoFromDate(new Date(current.getFullYear(), current.getMonth(), 1));
      const matchingInCurrentMonth = calendarFilteredEvents.find((event) => {
        const date = isoToDate(event.date);
        return date.getFullYear() === current.getFullYear() && date.getMonth() === current.getMonth();
      });
      const targetEvent =
        matchingInCurrentMonth ??
        calendarFilteredEvents.find((event) => event.date >= currentMonthISO) ??
        calendarFilteredEvents[calendarFilteredEvents.length - 1];
      const targetMonth = monthStartFromISO(targetEvent.date);
      return current.getFullYear() === targetMonth.getFullYear() && current.getMonth() === targetMonth.getMonth() ? current : targetMonth;
    });
  }, [activeFilter, calendarFilteredEvents, search, view]);

  return (
    <div className={`oa-theme-${theme} min-h-[100svh] ${isLightTheme ? "bg-[#f6f3fb] text-[#171321]" : "bg-[#080711] text-white"} sm:p-4 lg:p-5 xl:p-6`}>
      {showSlowLoading ? (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="fixed left-1/2 top-3 z-[90] -translate-x-1/2">
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/50 px-3 py-2 text-xs font-black text-white/80 backdrop-blur">
            <RefreshCcw className="h-3.5 w-3.5 animate-spin" />
            <span>Loading…</span>
            <span className="text-white/35">{pendingCount}</span>
          </div>
        </motion.div>
      ) : null}
      <style>{`
        .oa-theme-light { color-scheme: light; }
        .oa-theme-light [class*="bg-[#0d0c17]"],
        .oa-theme-light [class*="bg-[#12111f]"],
        .oa-theme-light [class*="bg-[#16152a]"],
        .oa-theme-light [class*="bg-[#0a0912]"] { background: #ffffff !important; }
        .oa-theme-light [class*="bg-black"],
        .oa-theme-light [class*="bg-white/5"],
        .oa-theme-light [class*="bg-white/[0.02]"],
        .oa-theme-light [class*="bg-white/[0.03]"] { background-color: rgba(23, 19, 33, 0.045) !important; }
        .oa-theme-light [class*="bg-black/70"],
        .oa-theme-light [class*="bg-black/75"] { background-color: rgba(23, 19, 33, 0.34) !important; }
        .oa-theme-light [class*="from-[#16152a]"][class*="to-[#0a0912]"] {
          --tw-gradient-from: #ffffff var(--tw-gradient-from-position) !important;
          --tw-gradient-to: rgba(255, 255, 255, 0) var(--tw-gradient-to-position) !important;
          --tw-gradient-stops: var(--tw-gradient-from), #fbf9ff var(--tw-gradient-via-position), #f6f3fb var(--tw-gradient-to-position) !important;
          background-image: linear-gradient(to bottom, #ffffff, #fbf9ff, #f6f3fb) !important;
        }
        .oa-theme-light [class*="border-white"] { border-color: rgba(23, 19, 33, 0.14) !important; }
        .oa-theme-light [class*="text-white"] { color: rgba(23, 19, 33, 0.72) !important; }
        .oa-theme-light .text-white { color: #171321 !important; }
        .oa-theme-light [class*="text-purple-100"] { color: #6d28d9 !important; }
        .oa-theme-light [class*="text-purple-200"] { color: #7c3aed !important; }
        .oa-theme-light [class*="text-cyan-100"] { color: #0e7490 !important; }
        .oa-theme-light [class*="text-yellow-100"] { color: #854d0e !important; }
        .oa-theme-light [class*="text-emerald-100"] { color: #047857 !important; }
        .oa-theme-light [class*="text-rose-100"] { color: #be123c !important; }
        .oa-theme-light [class*="text-emerald-200"] { color: #047857 !important; }
        .oa-theme-light [class*="text-rose-200"] { color: #be123c !important; }
        .oa-theme-light [class*="bg-yellow-400/15"] { background-color: rgba(250, 204, 21, 0.2) !important; }
        .oa-theme-light [class*="bg-emerald-400/15"] { background-color: rgba(52, 211, 153, 0.18) !important; }
        .oa-theme-light [class*="bg-rose-500/15"] { background-color: rgba(244, 63, 94, 0.16) !important; }
        .oa-theme-light [class*="bg-purple-400/15"] { background-color: rgba(168, 85, 247, 0.16) !important; }
        .oa-theme-light input,
        .oa-theme-light select,
        .oa-theme-light textarea { color: #171321 !important; background-color: rgba(23, 19, 33, 0.045) !important; }
        .oa-clamp-1 { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .oa-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        @media (max-width: 640px) {
          .oa-modal-panel { max-height: calc(100svh - 0.75rem); }
          .oa-modal-header { padding: 0.6rem 0.75rem; }
          .oa-modal-header h2,
          .oa-modal-header [class*="text-xl"],
          .oa-modal-header [class*="text-lg"] { font-size: 1rem !important; line-height: 1.25rem !important; }
          .oa-modal-body { padding: 0.6rem; }
          .oa-modal-body,
          .oa-modal-body [class*="space-y-4"] { row-gap: 0.6rem; }
          .oa-modal-card { border-radius: 0.875rem; padding: 0.6rem; }
          .oa-modal-footer { padding: 0.6rem; }
          .oa-modal-panel [class*="h-10"],
          .oa-modal-panel [class*="h-11"] { height: 2.25rem !important; min-height: 2.25rem !important; }
          .oa-modal-panel input,
          .oa-modal-panel select,
          .oa-modal-panel button { min-height: 2.25rem; }
          .oa-modal-panel textarea { min-height: 4.5rem; }
        }
      `}</style>
      <div className={`mx-auto min-h-[100svh] max-w-[1320px] overflow-hidden border-white/10 ${isLightTheme ? "bg-white" : "bg-[#0d0c17]"} shadow-2xl shadow-black/20 sm:min-h-0 sm:rounded-3xl sm:border`}>
        <header className="flex flex-col gap-3 border-b border-white/10 px-3 py-3 sm:px-4 sm:py-4 md:flex-row md:flex-wrap md:items-center md:justify-between md:px-6 xl:px-8">
          <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center md:flex-1">
            <div className="mr-1 shrink-0 text-xl font-black leading-none tracking-tight sm:text-2xl md:mr-2 md:text-3xl">O<span className="text-purple-300">&</span>A</div>
            <div
              className={`flex w-full min-w-0 gap-1 overflow-x-auto rounded-2xl border border-white/10 bg-black/20 p-1 pb-1.5 sm:flex-1 md:w-auto md:flex-none md:flex-wrap md:overflow-visible md:pb-1`}
            >
            <Button
              onClick={() => navigateView("List")}
              className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-xl text-[11px] font-black sm:h-10 sm:gap-2 sm:text-sm ${headerIconsOnly ? "w-10 px-0" : "px-2 md:px-4"} ${
                view === "List" ? "bg-purple-400 text-black hover:bg-purple-300" : "bg-white/5 text-white/45 hover:bg-white/10 hover:text-white"
              }`}
            >
              <List className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className={headerIconsOnly ? "sr-only" : ""}>List</span>
            </Button>
            <Button
              onClick={() => navigateView("Calendar")}
              className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-xl text-[11px] font-black sm:h-10 sm:gap-2 sm:text-sm ${headerIconsOnly ? "w-10 px-0" : "px-2 md:px-4"} ${
                view === "Calendar"
                  ? "bg-purple-400 text-black hover:bg-purple-300"
                  : "bg-white/5 text-white/45 hover:bg-white/10 hover:text-white"
              }`}
            >
              <CalendarDays className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className={headerIconsOnly ? "sr-only" : ""}>Calendar</span>
            </Button>
            {canAccessDjs ? (
              <Button
                onClick={() => navigateView("DJs")}
                className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-xl text-[11px] font-black sm:h-10 sm:gap-2 sm:text-sm ${headerIconsOnly ? "w-10 px-0" : "px-2 md:px-4"} ${
                  view === "DJs"
                    ? "bg-purple-400 text-black hover:bg-purple-300"
                    : "bg-white/5 text-white/45 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Music className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className={headerIconsOnly ? "sr-only" : ""}>DJs</span>
              </Button>
            ) : null}
            {canManageUsers ? (
              <Button
                onClick={() => navigateView("Users")}
                className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-xl text-[11px] font-black sm:h-10 sm:gap-2 sm:text-sm ${headerIconsOnly ? "w-10 px-0" : "px-2 md:px-4"} ${
                  view === "Users"
                    ? "bg-purple-400 text-black hover:bg-purple-300"
                    : "bg-white/5 text-white/45 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className={headerIconsOnly ? "sr-only" : ""}>Users</span>
              </Button>
            ) : null}
            {canViewActivity ? (
              <Button
                onClick={() => navigateView("Activity")}
                className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-xl text-[11px] font-black sm:h-10 sm:gap-2 sm:text-sm ${headerIconsOnly ? "w-10 px-0" : "px-2 md:px-4"} ${
                  view === "Activity"
                    ? "bg-purple-400 text-black hover:bg-purple-300"
                    : "bg-white/5 text-white/45 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Receipt className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className={headerIconsOnly ? "sr-only" : ""}>Activity</span>
              </Button>
            ) : null}
            {canAccessFinance ? (
              <Button
                onClick={() => navigateView("Finance")}
                className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-xl text-[11px] font-black sm:h-10 sm:gap-2 sm:text-sm ${headerIconsOnly ? "w-10 px-0" : "px-2 md:px-4"} ${
                  view === "Finance"
                    ? "bg-purple-400 text-black hover:bg-purple-300"
                    : "bg-white/5 text-white/45 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Calculator className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className={headerIconsOnly ? "sr-only" : ""}>Finance</span>
              </Button>
            ) : null}
            {canAccessSales ? (
              <Button
                onClick={() => navigateView("Sales")}
                className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-xl text-[11px] font-black sm:h-10 sm:gap-2 sm:text-sm ${headerIconsOnly ? "w-10 px-0" : "px-2 md:px-4"} ${
                  view === "Sales"
                    ? "bg-purple-400 text-black hover:bg-purple-300"
                    : "bg-white/5 text-white/45 hover:bg-white/10 hover:text-white"
                }`}
              >
                <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className={headerIconsOnly ? "sr-only" : ""}>Sales</span>
              </Button>
            ) : null}
            {canAccessDjPayments ? (
              <Button
                onClick={() => navigateView("DJPayments")}
                className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-xl text-[11px] font-black sm:h-10 sm:gap-2 sm:text-sm ${headerIconsOnly ? "w-10 px-0" : "px-2 md:px-4"} ${
                  view === "DJPayments"
                    ? "bg-purple-400 text-black hover:bg-purple-300"
                    : "bg-white/5 text-white/45 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Banknote className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className={headerIconsOnly ? "sr-only" : ""}>Payments</span>
              </Button>
            ) : null}
            </div>
          </div>
          <div className="flex w-full items-stretch gap-1.5 overflow-x-auto pb-1.5 md:ml-auto md:w-auto md:flex-wrap md:items-center md:justify-end md:gap-2 md:overflow-visible md:pb-0">
            <Button
              onClick={() => setHolidaysModalOpen(true)}
              className={`inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-cyan-300/25 bg-cyan-400/10 text-xs font-black text-cyan-100 hover:bg-cyan-400/20 sm:h-10 ${headerIconsOnly ? "w-11 px-0" : "px-3 md:px-5"}`}
            >
              <CalendarDays className="h-4 w-4 shrink-0" />
              <span className={headerIconsOnly ? "sr-only" : ""}>Holidays</span>
            </Button>
            {canUseNotificationCenter ? (
            <div className="relative">
              <Button
                ref={notificationsButtonRef}
                onClick={() => {
                  updateNotificationsPopoverPosition();
                  setActiveNotificationsTab(bookingRequestCount ? "bookings" : mentionCount || !canEdit ? "mentions" : "pending");
                  setNotificationsOpen(true);
                }}
                className={`inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-yellow-300/25 bg-yellow-400/10 text-xs font-black text-yellow-100 hover:bg-yellow-400/20 sm:h-10 ${headerIconsOnly ? "w-11 px-0" : "px-3 md:px-5"}`}
                title={canEdit ? "Notification center" : "Mentions notification center"}
              >
                <Bell className="h-4 w-4 shrink-0" />
                <span className={headerIconsOnly ? "sr-only" : ""}>{notificationButtonLabel}</span>
              </Button>
              {notificationBadgeCount ? (
                <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full border border-rose-300/40 bg-rose-500/30 px-1 text-[10px] font-black text-rose-50">
                  {notificationBadgeCount}
                </span>
              ) : null}
            </div>
            ) : null}
            {canEdit ? (
              <div>
                <Button
                  ref={addButtonRef}
                  onClick={() => {
                    updateAddMenuPosition();
                    setAddMenuOpen((open) => !open);
                  }}
                  className={`inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-purple-400 text-xs font-black text-black hover:bg-purple-300 sm:h-10 ${headerIconsOnly ? "w-11 px-0" : "px-3 md:px-6"}`}
                >
                  <Plus className="h-4 w-4 shrink-0" />
                  <span className={headerIconsOnly ? "sr-only" : ""}>Add</span>
                  {headerIconsOnly ? null : <ChevronDown className="h-3.5 w-3.5 shrink-0" />}
                </Button>
                {addMenuOpen ? (
                  <div style={addMenuStyle || undefined} className="z-40 overflow-hidden rounded-2xl border border-white/10 bg-[#12111f] p-1 shadow-2xl shadow-black/50">
                    <button
                      type="button"
                      onClick={() => {
                        setAddMenuOpen(false);
                        openAddDayModal();
                      }}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-xs font-black text-white/75 hover:bg-purple-400 hover:text-black"
                    >
                      <CalendarDays className="h-4 w-4" />
                      Add Day
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAddMenuOpen(false);
                        openAddModal();
                      }}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-xs font-black text-white/75 hover:bg-purple-400 hover:text-black"
                    >
                      <CalendarDays className="h-4 w-4" />
                      Add Week
                    </button>
                  </div>
                ) : null}
              </div>
            ) : null}
            <Button
              onClick={() => setTimeFormat(timeFormat === "24" ? "12" : "24")}
              title={timeFormat === "24" ? "24-hour time" : "AM/PM time"}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 px-1 text-white/55 hover:bg-white/10 hover:text-white sm:h-10 sm:w-10 sm:px-0"
            >
              <Clock className="h-4 w-4 shrink-0" />
              <span className="sr-only">{timeFormat === "24" ? "24-hour time" : "AM/PM time"}</span>
            </Button>
            <Button
              onClick={() => setTheme(isLightTheme ? "dark" : "light")}
              title={isLightTheme ? "Switch to dark mode" : "Switch to light mode"}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 px-1 text-white/55 hover:bg-white/10 hover:text-white sm:h-10 sm:w-10 sm:px-0"
            >
              {isLightTheme ? <Moon className="h-4 w-4 shrink-0" /> : <Sun className="h-4 w-4 shrink-0" />}
              <span className="sr-only">{isLightTheme ? "Dark mode" : "Light mode"}</span>
            </Button>
            <Button
              onClick={onLogout}
              title={userRole ? `${userRole.toUpperCase()} Logout` : "Logout"}
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 px-1 text-white/55 hover:bg-white/10 hover:text-white sm:h-10 sm:w-10 sm:px-0"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              <span className="sr-only">Logout</span>
            </Button>
          </div>
        </header>

        {notificationsOpen && canUseNotificationCenter ? (
          <div
            className="fixed inset-0 z-[80] bg-black/40 backdrop-blur-sm"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) setNotificationsOpen(false);
            }}
          >
            <div style={notificationsPopoverStyle || undefined} className="overflow-hidden rounded-3xl border border-white/10 bg-[#0d0c17] shadow-2xl shadow-black/60">
              <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
                <div className="min-w-0">
                  <div className="text-[10px] font-black uppercase tracking-[0.22em] text-white/30">Notification Center</div>
                  <div className="mt-0.5 truncate text-sm font-black text-white/85">
                    {canEdit
                      ? `Bookings · ${bookingRequestCount} · Mentions · ${mentionCount} · ${pendingUpcomingCount} pending`
                      : `Bookings · ${bookingRequestCount} · Mentions · ${mentionCount}`}
                  </div>
                </div>
                <button
                  onClick={() => setNotificationsOpen(false)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/55 hover:bg-white/10 hover:text-white"
                  title="Close"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className={`grid gap-1 border-b border-white/10 bg-white/[0.02] p-2 ${canEdit ? "grid-cols-3" : "grid-cols-2"}`}>
                <button
                  onClick={() => setActiveNotificationsTab("bookings")}
                  className={`rounded-xl px-3 py-2 text-xs font-black ${activeNotificationsTab === "bookings" ? "bg-emerald-400 text-black" : "text-white/45 hover:bg-white/5 hover:text-white"}`}
                >
                  Bookings {bookingRequestCount ? <span className={activeNotificationsTab === "bookings" ? "text-black/50" : "text-white/25"}>{bookingRequestCount}</span> : null}
                </button>
                <button
                  onClick={() => setActiveNotificationsTab("mentions")}
                  className={`rounded-xl px-3 py-2 text-xs font-black ${activeNotificationsTab === "mentions" ? "bg-cyan-400 text-black" : "text-white/45 hover:bg-white/5 hover:text-white"}`}
                >
                  Mentions {mentionCount ? <span className={activeNotificationsTab === "mentions" ? "text-black/50" : "text-white/25"}>{mentionCount}</span> : null}
                </button>
                {canEdit ? (
                  <button
                    onClick={() => setActiveNotificationsTab("pending")}
                    className={`rounded-xl px-3 py-2 text-xs font-black ${activeNotificationsTab === "pending" ? "bg-yellow-300 text-black" : "text-white/45 hover:bg-white/5 hover:text-white"}`}
                  >
                    Pending {pendingUpcomingCount ? <span className={activeNotificationsTab === "pending" ? "text-black/50" : "text-white/25"}>{pendingUpcomingCount}</span> : null}
                  </button>
                ) : null}
              </div>

              {activeNotificationsTab === "bookings" ? (
                bookingRequestCount ? (
                  <div className="max-h-[60svh] overflow-auto p-2">
                    {bookingRequests.map(({ event, slot, assignment }) => (
                      <div
                        key={`${event.id}-${assignment.assignmentId}`}
                        className="rounded-2xl border border-emerald-300/20 bg-emerald-400/10 px-4 py-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="text-xs font-black text-emerald-100">{dayLabelFromISO(event.date)}</div>
                          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${assignmentStatusClass(assignment.assignmentStatus)}`}>
                            {assignmentStatusLabel(assignment.assignmentStatus)}
                          </span>
                        </div>
                        <div className="mt-1 text-sm font-black text-white">{event.name}</div>
                        <div className="mt-0.5 text-xs font-black text-emerald-100">{assignment.dj}</div>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] font-bold text-white/50">
                          <span>{slot.role}</span>
                          {slot.start && slot.end ? <span>{formatTimeRange(slot.start, slot.end, timeFormat)}</span> : null}
                          <span>{event.stage}</span>
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => respondToBookingRequest(event, slot, assignment, "Accepted")}
                            className="rounded-xl bg-emerald-400 px-3 py-2 text-xs font-black text-black hover:bg-emerald-300"
                          >
                            Accept
                          </button>
                          <button
                            type="button"
                            onClick={() => respondToBookingRequest(event, slot, assignment, "Rejected")}
                            className="rounded-xl border border-rose-300/30 bg-rose-500/15 px-3 py-2 text-xs font-black text-rose-100 hover:bg-rose-400 hover:text-black"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="px-4 py-8 text-center text-sm font-bold text-white/45">No booking requests for you.</div>
                )
              ) : activeNotificationsTab === "mentions" ? (
                mentionCount ? (
                  <div className="max-h-[60svh] overflow-auto p-2">
                    {mentionedEvents.map((event) => (
                      <button
                        key={`mention-${event.id}-${event.date}`}
                        onClick={() => openNotificationEvent(event)}
                        className="w-full rounded-2xl border border-cyan-300/20 bg-cyan-400/10 px-4 py-3 text-left hover:bg-cyan-400/15"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="text-xs font-black text-cyan-100">{dayLabelFromISO(event.date)}</div>
                          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${statusClass(event.status)}`}>
                            {statusLabel(event.status)}
                          </span>
                        </div>
                        <div className="mt-1 text-sm font-black text-white">{event.name}</div>
                        <div className="oa-clamp-2 mt-1 text-xs font-bold text-white/55">
                          <MentionText text={event.notes} users={mentionUsers} />
                        </div>
                      </button>
                    ))}
                    {mentionedComments.map((comment) => {
                      const event = eventsById.get(comment.eventId);
                      if (!event) return null;
                      return (
                        <button
                          key={`comment-mention-${comment.id}`}
                          onClick={() => openNotificationEvent(event)}
                          className="mt-2 w-full rounded-2xl border border-cyan-300/20 bg-cyan-400/10 px-4 py-3 text-left hover:bg-cyan-400/15"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="text-xs font-black text-cyan-100">{dayLabelFromISO(event.date)}</div>
                            <span className="rounded-full border border-cyan-300/25 bg-cyan-400/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-cyan-100">
                              Comment
                            </span>
                          </div>
                          <div className="mt-1 text-sm font-black text-white">{event.name}</div>
                          <div className="mt-0.5 text-[10px] font-bold text-white/35">
                            {displayNameForUserId(comment.userId, mentionUsers, currentUser)} · {formatCommentTime(comment.createdAt)}
                          </div>
                          <div className="oa-clamp-2 mt-1 text-xs font-bold text-white/55">
                            <MentionText text={comment.body} users={mentionUsers} />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="px-4 py-8 text-center text-sm font-bold text-white/45">No mentions for you yet.</div>
                )
              ) : pendingUpcomingCount ? (
                <div className="max-h-[60svh] overflow-auto p-2">
                  {pendingUpcomingEvents.map((event) => {
                    const holidayList = holidaysByDate.get(event.date) ?? [];
                    const holidayName = holidayList[0] ? holidayList[0].localName || holidayList[0].name : "";
                    return (
                      <button
                        key={`${event.id}-${event.date}`}
                        onClick={() => openNotificationEvent(event)}
                        className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-left hover:bg-white/[0.06]"
                        title={holidayList.length ? holidayList.map(holidayLabel).join(", ") : undefined}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="text-xs font-black text-white/85">{dayLabelFromISO(event.date)}</div>
                          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${statusClass(event.status)}`}>
                            {statusLabel(event.status)}
                          </span>
                        </div>
                        <div className="mt-1 text-sm font-black text-white">{event.name}</div>
                        {holidayName ? (
                          <div className="mt-1 text-[11px] font-bold text-cyan-100/80">
                            🎉 {holidayName}
                          </div>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="px-4 py-8 text-center text-sm font-bold text-white/45">No upcoming pending events.</div>
              )}
            </div>
          </div>
        ) : null}

        {syncError ? (
          <div className="border-b border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm font-bold text-rose-100 md:px-6 xl:px-8">
            Supabase sync issue: {syncError}
          </div>
        ) : !isSupabaseConfigured ? (
          <div className="border-b border-yellow-400/20 bg-yellow-400/10 px-4 py-3 text-sm font-bold text-yellow-100 md:px-6 xl:px-8">
            Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in this environment.
          </div>
        ) : null}

        {!routeEventId && view !== "Finance" && view !== "DJs" && view !== "DJPayments" ? (
        <section className="grid grid-cols-2 gap-2 border-b border-white/10 px-3 py-3 sm:grid-cols-4 sm:px-4 md:px-6 xl:gap-4 xl:px-8 xl:py-6">
          <Stat number={stats.total} label="Events" />
          <Stat number={stats.confirmed} label="Confirmed" tone="text-emerald-300" />
          <Stat number={stats.unconfirmed} label="Pending" tone="text-yellow-300" />
          <Stat number={stats.needAttention} label="Need Attention" tone="text-purple-300" />
        </section>
        ) : null}

        {!routeEventId && view !== "Finance" && view !== "DJs" && view !== "DJPayments" ? (
        <section className="sticky top-0 z-10 grid gap-2 border-b border-white/10 bg-[#0d0c17]/95 px-3 py-2.5 backdrop-blur sm:px-4 md:flex md:flex-wrap md:items-center md:px-6 xl:px-8">
          {view === "List" ? (
          <div className="mx-auto grid w-full max-w-md grid-cols-2 items-center gap-1 rounded-2xl border border-white/10 bg-white/[0.03] p-1 sm:max-w-none md:mx-0 md:flex md:w-auto md:max-w-full md:overflow-x-auto">
            {[
              { key: "Upcoming", label: "Upcoming", count: upcomingCount },
              { key: "Past", label: "Past Events", count: pastCount },
            ].map((item) => {
              const active = dateScope === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => setDateScope(item.key)}
                  className={`shrink-0 rounded-xl px-3 py-2 text-[11px] font-black transition md:rounded-full md:px-4 md:text-sm ${
                    active ? "bg-white text-black" : "text-white/45 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {item.label} <span className={active ? "text-black/50" : "text-white/25"}>{item.count}</span>
                </button>
              );
            })}
          </div>
          ) : null}

          <div className="grid w-full grid-cols-2 gap-1.5 min-[420px]:grid-cols-4 md:flex md:w-auto md:flex-wrap md:justify-start md:px-0">
            {filterItems.map((item) => {
              const Icon = item.icon;
              const active = activeFilter === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => setActiveFilter(item.key)}
                  className={`flex min-w-0 items-center justify-center gap-1.5 rounded-xl border px-2 py-2 text-[10px] font-black transition md:rounded-full md:px-4 md:text-sm ${
                    active ? "border-purple-300 bg-purple-400 text-black" : "border-white/10 bg-white/5 text-white/45 hover:text-white"
                  }`}
                >
                  {Icon && <Icon className="h-3.5 w-3.5" />} {item.label}
                </button>
              );
            })}
          </div>

          {view === "List" ? (
            <div className="flex flex-wrap items-center justify-center gap-2 md:ml-auto md:justify-start">
              <div className="flex items-center gap-1 rounded-2xl border border-white/10 bg-white/[0.03] p-1">
                <button
                  onClick={() => setListGrouping("month")}
                  className={`rounded-xl px-3 py-2 text-[11px] font-black transition md:rounded-full md:text-sm ${
                    listGrouping === "month" ? "bg-white text-black" : "text-white/45 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  Month
                </button>
                <button
                  onClick={() => setListGrouping("all")}
                  className={`rounded-xl px-3 py-2 text-[11px] font-black transition md:rounded-full md:text-sm ${
                    listGrouping === "all" ? "bg-white text-black" : "text-white/45 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  All
                </button>
              </div>

              {listGrouping === "month" ? (
                <div className="flex items-center gap-1.5 rounded-2xl border border-white/10 bg-white/[0.03] p-1">
                  <button
                    onClick={() => changeListMonth(-1)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
                    title="Previous month"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => changeListMonth(0)}
                    className="h-9 rounded-xl border border-white/10 bg-white/5 px-3 text-[11px] font-black text-white/70 hover:bg-white/10"
                    title="Jump to current month"
                  >
                    {listMonthLabel}
                  </button>
                  <button
                    onClick={() => changeListMonth(1)}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white"
                    title="Next month"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="grid grid-cols-[96px_minmax(0,1fr)] gap-2 md:contents">
            <select
              value={dateSort}
              onChange={(e) => setDateSort(e.target.value)}
              className="h-10 rounded-xl border border-white/10 bg-white/5 px-2 text-[11px] font-black text-white/70 outline-none hover:bg-white/10 focus:border-purple-300/60 sm:h-11 sm:px-3 sm:text-sm lg:ml-auto"
            >
              <option value="asc">Date ↑</option>
              <option value="desc">Date ↓</option>
            </select>

            <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-white/40 sm:min-w-[260px] lg:flex-none xl:min-w-[340px]">
              <Search className="h-4 w-4 shrink-0" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search..."
                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/30"
              />
            </div>
          </div>
        </section>
        ) : null}

        <main className="space-y-4 px-3 py-3 sm:px-4 md:px-6 xl:px-8 xl:py-6">
          {routeEventId ? (
            focusedEvent ? (
              <section className="mx-auto max-w-4xl space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
                  <div className="min-w-0">
                    <div className="text-[10px] font-black uppercase tracking-[0.22em] text-white/35">Shared Event</div>
                    <div className="mt-1 truncate text-sm font-black text-white/80">{dayLabelFromISO(focusedEvent.date)} · {focusedEvent.name}</div>
                  </div>
                  <Button
                    onClick={() => navigateView("List", { replace: true })}
                    className="h-10 rounded-xl bg-white/5 px-4 text-xs font-black text-white/60 hover:bg-white/10 hover:text-white"
                  >
                    Back to All Events
                  </Button>
                </div>
                <EventCard
                  event={focusedEvent}
                  holidays={holidaysByDate.get(focusedEvent.date) ?? []}
                  timeFormat={timeFormat}
                  canEdit={canEdit}
                  mentionUsers={mentionUsers}
                  comments={commentsByEventId.get(focusedEvent.id) ?? []}
                  currentUser={currentUser}
                  commentsError={commentsError}
                  onEdit={() => openEditModal(focusedEvent)}
                  onAssignIC={(ic) => assignIC(focusedEvent.id, ic)}
                  onConfirm={() => updateEventStatus(focusedEvent, "Confirmed")}
                  onShare={() => shareEvent(focusedEvent)}
                  onOpenDetails={() => setPreviewEvent(focusedEvent)}
                  onAddComment={addEventComment}
                />
              </section>
            ) : (
              <section className="mx-auto max-w-2xl rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-10 text-center">
                <div className="text-lg font-black text-white">Event not found</div>
                <div className="mt-2 text-sm font-bold text-white/45">This link does not match an event currently available in the dashboard.</div>
                <Button
                  onClick={() => navigateView("List", { replace: true })}
                  className="mt-5 h-10 rounded-xl bg-purple-400 px-4 text-xs font-black text-black hover:bg-purple-300"
                >
                  Back to All Events
                </Button>
              </section>
            )
          ) : view === "Users" ? (
            <UserManagementPage onToast={showToast} onLogActivity={logActivity} />
          ) : view === "Activity" && canViewActivity ? (
            <ActivityMonitorPage userRole={userRole} />
          ) : view === "Finance" ? (
            <FinancePage />
          ) : view === "Sales" && canAccessSales ? (
            <WeeklySalesPage userRole={userRole} onToast={showToast} events={events} onOpenEvent={openSingleEvent} onOpenDj={openDjFromName} />
          ) : view === "DJPayments" && canAccessDjPayments ? (
            <DjPaymentsPage
              events={events}
              djProfiles={djProfiles}
              onRefresh={async () => {
                await Promise.all([loadEvents(), loadDjProfiles()]);
              }}
              onToast={showToast}
              onLogActivity={logActivity}
            />
          ) : view === "DJs" && canAccessDjs ? (
            <DjProfilesPage
              profiles={djProfiles}
              events={events}
              loading={djProfilesLoading}
              error={djProfilesError}
              canEdit={canEdit}
              mentionUsers={mentionUsers}
              onToast={showToast}
              onRefreshProfiles={loadDjProfiles}
              onLogActivity={logActivity}
              initialQuery={djProfilesInitialQuery}
            />
          ) : view === "List" ? (
            <>
              {groupedEvents.map((group) => (
                <section
                  key={group.key}
                  ref={(node) => {
                    if (!node) return;
                    weekSectionRefs.current[group.key] = node;
                  }}
                  className="scroll-mt-40 space-y-3 border-t border-white/10 pt-4 first:border-t-0 first:pt-0 xl:space-y-4 xl:pt-5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-[0.25em] text-white/25">{group.weekName}</div>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <h2 className="text-base font-black text-white/85 md:text-lg">{group.label}</h2>
                        {canEdit ? (
                          <button
                            onClick={() => openAddDayModal(group.key)}
                            className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-purple-300/25 bg-purple-400/10 px-3 text-[11px] font-black text-purple-100 hover:bg-purple-400/20"
                            title="Add a day in this week"
                          >
                            <Plus className="h-3.5 w-3.5" />
                            Add Day
                          </button>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-white/35">
                      <span className="rounded-full border border-white/10 bg-white/5 px-2 py-1">{group.items.length} events</span>
                      <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-1 text-emerald-200/80">
                        {group.confirmed} confirmed
                      </span>
                      {group.needsAttention ? (
                        <span className="rounded-full border border-rose-400/20 bg-rose-400/10 px-2 py-1 text-rose-200/80">
                          {group.needsAttention} attention
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {group.items.map((event) => (
                    <div
                      key={event.id}
                      ref={(node) => {
                        if (node) {
                          eventCardRefs.current[String(event.id)] = node;
                        } else {
                          delete eventCardRefs.current[String(event.id)];
                        }
                      }}
                      className="scroll-mt-44"
                    >
                      <EventCard
                        event={event}
                        holidays={holidaysByDate.get(event.date) ?? []}
                        timeFormat={timeFormat}
                        canEdit={canEdit}
                        mentionUsers={mentionUsers}
                        comments={commentsByEventId.get(event.id) ?? []}
                        currentUser={currentUser}
                        commentsError={commentsError}
                        onEdit={() => openEditModal(event)}
                        onAssignIC={(ic) => assignIC(event.id, ic)}
                        onConfirm={() => updateEventStatus(event, "Confirmed")}
                        onShare={() => shareEvent(event)}
                        onOpenDetails={() => setPreviewEvent(event)}
                        onAddComment={addEventComment}
                      />
                    </div>
                  ))}
                </section>
              ))}
              {!filteredEvents.length ? (
                <div className="rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-10 text-center text-sm font-bold text-white/35">
                  No {dateScope === "Past" ? "past" : "upcoming"} events match this view.
                </div>
              ) : null}
            </>
          ) : (
            <CalendarView
              cursorMonth={calendarCursor}
              onChangeMonth={changeCalendarMonth}
              eventsByDate={calendarEventsByDate}
              holidaysByDate={holidaysByDate}
              onSelectDate={(iso) => (canEdit ? openAddDayModal(iso) : denyEdit())}
              onPreviewEvent={setPreviewEvent}
            />
          )}
        </main>
      </div>

      {view === "List" && weekKeys.length > 1 ? (
        <div className="fixed bottom-5 left-1/2 z-[55] -translate-x-1/2 sm:bottom-6">
          <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/40 p-2 shadow-2xl shadow-black/40 backdrop-blur">
            <Button
              onClick={() => jumpWeek(-1)}
              disabled={!canJumpPrevWeek}
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:bg-white/5 disabled:text-white/20"
              title="Previous week"
            >
              <ChevronUp className="h-5 w-5" />
            </Button>
            <Button
              onClick={() => jumpWeek(1)}
              disabled={!canJumpNextWeek}
              className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:bg-white/5 disabled:text-white/20"
              title="Next week"
            >
              <ChevronDown className="h-5 w-5" />
            </Button>
          </div>
        </div>
      ) : null}

      <AddEventDayModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setModalInitialDays(null);
          setModalLockDateSelection(false);
          setModalEditEvent(null);
        }}
        timeFormat={timeFormat}
        seedDateISO={seedDateISO}
        onChangeSeedDate={setSeedDateISO}
        onSave={saveModalDays}
        djOptions={djOptions}
        djProfiles={djProfiles}
        genreOptions={genreOptions}
        existingEventsByDate={existingEventsByDate}
        holidaysByDate={holidaysByDate}
        onPreviewEvent={setPreviewEvent}
        editEvent={modalEditEvent}
        onDeleteDay={deleteEventDay}
        title={modalTitle}
        initialDays={modalInitialDays}
        dateMode={modalDateMode}
        lockDateSelection={modalLockDateSelection}
        mentionUsers={mentionUsers}
      />

      <EventDetailsModal
        event={previewEvent}
        timeFormat={timeFormat}
        mentionUsers={mentionUsers}
        djProfiles={djProfiles}
        comments={previewEvent ? commentsByEventId.get(previewEvent.id) ?? [] : []}
        commentsError={commentsError}
        currentUser={currentUser}
        onAddComment={addEventComment}
        onClose={() => setPreviewEvent(null)}
        onEdit={openEditFromPreview}
        onDelete={deleteEventDay}
        onConfirm={(event) => updateEventStatus(event, "Confirmed")}
        onShare={shareEvent}
        canEdit={canEdit}
      />

      <MalaysiaHolidaysModal
        open={holidaysModalOpen}
        holidays={upcomingMalaysiaHolidays}
        error={holidayError}
        onClose={() => setHolidaysModalOpen(false)}
      />

      {toast ? (
        <div
          className={`fixed left-1/2 top-5 z-[60] w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 rounded-2xl border px-4 py-3 text-center text-sm font-black shadow-2xl backdrop-blur ${
            toast.tone === "error"
              ? "border-rose-300/30 bg-rose-500/20 text-rose-50 shadow-rose-950/40"
              : "border-emerald-300/30 bg-emerald-500/20 text-emerald-50 shadow-emerald-950/40"
          }`}
        >
          {toast.message}
        </div>
      ) : null}
    </div>
  );
}

export default function OABookingDashboard() {
  const [authLoading, setAuthLoading] = useState(isSupabaseConfigured);
  const [session, setSession] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [roleError, setRoleError] = useState("");

  const loadUserRole = useCallback(async (user) => {
    if (!isSupabaseConfigured || !user?.id) {
      setUserRole(null);
      setRoleError("");
      return;
    }

    const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", user.id).maybeSingle();
    if (error) {
      setUserRole(null);
      setRoleError(error.message || "Could not load user role.");
      return;
    }

    if (!data?.role) {
      setUserRole(null);
      setRoleError("Please contact the admin to approve your email.");
      return;
    }

    setUserRole(data.role);
    setRoleError("");
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setAuthLoading(false);
      return undefined;
    }

    let cancelled = false;

    supabase.auth.getSession().then(async ({ data }) => {
      if (cancelled) return;
      setSession(data.session ?? null);
      if (data.session?.user) await loadUserRole(data.session.user);
      setAuthLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession ?? null);
      if (nextSession?.user) {
        loadUserRole(nextSession.user);
      } else {
        setUserRole(null);
        setRoleError("");
      }
    });

    return () => {
      cancelled = true;
      listener.subscription.unsubscribe();
    };
  }, [loadUserRole]);

  const logout = async () => {
    if (isSupabaseConfigured) await supabase.auth.signOut();
    setSession(null);
    setUserRole(null);
    setRoleError("");
  };

  if (authLoading) {
    return (
      <div className="flex min-h-[100svh] items-center justify-center bg-[#080711] p-4 text-white">
        <div className="rounded-3xl border border-white/10 bg-[#0d0c17] px-6 py-5 text-sm font-black text-white/55">Checking login...</div>
      </div>
    );
  }

  if (!session) return <LoginScreen />;

  if (!userRole) {
    return (
      <div className="flex min-h-[100svh] items-center justify-center bg-[#080711] p-4 text-white">
        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0d0c17] p-6 shadow-2xl shadow-black/50">
          <div className="text-3xl font-black tracking-tight">
            O<span className="text-purple-300">&</span>A
          </div>
          <div className="mt-4 rounded-2xl border border-rose-300/25 bg-rose-500/10 px-4 py-3 text-sm font-bold text-rose-100">
            {roleError || "Please contact the admin to approve your email."}
          </div>
          <div className="mt-3 text-xs font-bold leading-5 text-white/45">
            Your account has been created, but an admin needs to approve your email before you can access the dashboard.
          </div>
          <Button onClick={logout} className="mt-5 h-11 w-full rounded-xl bg-white/5 text-sm font-black text-white/65 hover:bg-white/10 hover:text-white">
            Logout
          </Button>
        </div>
      </div>
    );
  }

  return <DashboardApp onLogout={logout} userRole={userRole} currentUser={session.user} />;
}

function Stat({ number, label, tone = "text-white" }) {
  return (
    <div className="rounded-2xl bg-white/[0.02] p-2.5 text-center md:p-4 xl:p-5">
      <div className={`text-2xl font-black sm:text-3xl md:text-4xl ${tone}`}>{number}</div>
      <div className="mt-1 text-[9px] font-black uppercase tracking-[0.12em] text-white/25 sm:text-[10px] sm:tracking-[0.2em] md:text-xs">{label}</div>
    </div>
  );
}
