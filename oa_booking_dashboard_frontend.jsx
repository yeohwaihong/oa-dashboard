import React, { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  CalendarDays,
  Calculator,
  List,
  Users,
  Plus,
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { isSupabaseConfigured, supabase } from "./src/supabaseClient.js";

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
  includeSuggestedFixedCosts: false,
  hasPartnerSplit: false,
  currencyCode: "MYR",
  exchangeRateToMyr: 1,
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
  const next = Number.parseFloat(value);
  return Number.isFinite(next) ? next : 0;
}

function formatInputNumber(value) {
  return toAmount(value).toFixed(2);
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
  return `${formatClockTime(start, mode)}-${formatClockTime(end, mode)}`;
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
        startM: minutesFromTime(slot.start),
        endM: minutesFromTime(slot.end),
      }))
      .filter((slot) => slot.start && slot.end);

    const dayErrors = [];
    const dayConflicts = new Set();

    for (const slot of slots) {
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
        name
      )
    )
  )
`;

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

function stripIcNote(notes) {
  return String(notes || "").replace(icNotePattern, "").trim();
}

function setIcInNotes(notes, ic) {
  const cleanNotes = stripIcNote(notes);
  const cleanIc = String(ic || "").trim();
  return [cleanNotes, cleanIc ? `[dashboard:ic=${cleanIc}]` : ""].filter(Boolean).join("\n");
}

function isSupabaseUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value));
}

function firstRelated(value) {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function mapSupabaseEvent(row) {
  const date = row.event_date;
  const dateObj = isoToDate(date);
  const { day, dayNo, month } = formatEventDatePieces(dateObj);
  const slots = Array.isArray(row.event_slots)
    ? [...row.event_slots]
        .sort((a, b) => (a.slot_order ?? 0) - (b.slot_order ?? 0))
        .map((slot) => {
          const assignment = firstRelated(slot.event_assignments);
          const dj = assignment?.djs?.name || assignment?.notes || "(OPENING TBD)";
          return {
            id: String(slot.id),
            assignmentId: assignment?.id ? String(assignment.id) : null,
            dj,
            role: normalizeSlotRole(slot.role),
            start: timeForInput(slot.start_time),
            end: timeForInput(slot.end_time),
            energy: slot.expected_energy ?? 3,
            warning: dj.toUpperCase().includes("TBD"),
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
    notes: stripIcNote(row.notes),
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

      <div className="-mx-3 overflow-x-auto px-3 sm:mx-0 sm:px-0">
        <div className="grid min-w-[720px] grid-cols-7 gap-1 sm:min-w-0 sm:gap-2">
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
                className={`group min-h-[96px] rounded-xl border p-1.5 text-left transition sm:min-h-[108px] sm:rounded-2xl sm:p-2 md:min-h-[126px] md:p-3 ${
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
                      className="truncate rounded-md border border-cyan-300/30 bg-cyan-400/10 px-1 py-0.5 text-[9px] font-black text-cyan-100 sm:rounded-lg sm:px-2 sm:py-1 sm:text-[10px]"
                      title={holidayLabel(holiday)}
                    >
                      🎉 {holiday.localName || holiday.name}
                    </div>
                  ))}
                  {dayEvents.slice(0, 3).map((event) => (
                    <button
                      key={event.id}
                      type="button"
                      className={`oa-clamp-2 block w-full rounded-md border px-1 py-1 text-left text-[10px] font-black leading-tight sm:oa-clamp-1 sm:rounded-lg sm:px-2 sm:py-1.5 sm:text-[10px] md:text-xs ${getStatusCalendarClass(event.status)}`}
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
        const slots = d.slots.map((s, i) => (i === idx ? { ...s, ...patch } : s));
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
      className="fixed inset-0 z-50 flex items-stretch justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.18 }}
        className="flex h-[100svh] w-full max-w-4xl flex-col overflow-hidden border border-white/10 bg-gradient-to-b from-[#16152a] to-[#0a0912] text-white shadow-2xl shadow-black/60 sm:h-auto sm:max-h-[calc(100svh-1.5rem)] sm:rounded-3xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-white/10 px-3 py-3 sm:px-6 sm:py-5">
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

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3 py-3 sm:space-y-4 sm:px-6 sm:py-5">
          {!lockDateSelection ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 md:p-4">
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
                    className={`min-h-12 rounded-lg border px-1 py-1 text-left text-[11px] font-black transition sm:min-h-16 sm:rounded-xl sm:px-1.5 sm:text-xs ${
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
              const dayErrors = validation.errorsByDate[day.isoDate] ?? [];
              const dayConflictSlots = validation.conflictSlots[day.isoDate] ?? new Set();
              const smartSchedule = getSmartSchedule(day.isoDate);
              const smartScheduleInvalid = minutesFromTime(smartSchedule.end) <= minutesFromTime(smartSchedule.start);
              const dayConfirmationBlockers = getConfirmationBlockers({ date: day.isoDate, slots: day.slots });

              return (
                <div
                  key={day.isoDate}
                  className={`rounded-2xl border bg-white/[0.03] p-3 sm:p-4 ${dayErrors.length ? "border-rose-300/40" : "border-white/10"}`}
                >
                  <div className="text-[11px] font-black uppercase tracking-[0.2em] text-purple-200/80">{header}</div>

                  <div className="mt-3 grid gap-3 md:grid-cols-2">
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
                        {day.slots.map((slot, idx) => (
                          <div
                            key={`${day.isoDate}-${idx}`}
                            className={`grid grid-cols-2 items-center gap-2 rounded-xl border bg-black/20 p-2 sm:grid-cols-[minmax(180px,1fr)_110px_110px_120px_40px] ${
                              dayConflictSlots.has(idx) ? "border-rose-300/50" : "border-white/10"
                            }`}
                          >
                            <div className="col-span-2 sm:col-span-1">
                              <input
                                list={djListId}
                                value={slot.dj}
                                onChange={(e) => updateSlot(day.isoDate, idx, { dj: e.target.value })}
                                placeholder="Select DJ"
                                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm font-black text-white/85 outline-none focus:border-purple-300/60 sm:px-2 sm:py-2 sm:text-xs"
                              />
                              <datalist id={djListId}>
                                {djOptions.map((dj) => (
                                  <option key={dj} value={dj} />
                                ))}
                              </datalist>
                            </div>

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

                            <select
                              value={slot.role}
                              onChange={(e) => updateSlot(day.isoDate, idx, { role: e.target.value })}
                              className="col-span-2 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm font-black text-white/50 outline-none focus:border-purple-300/60 sm:col-span-1 sm:px-2 sm:py-2 sm:text-xs"
                            >
                              {roleOptions.map((r) => (
                                <option key={r} value={r}>
                                  {r}
                                </option>
                              ))}
                            </select>

                            <button
                              onClick={() => removeSlot(day.isoDate, idx)}
                              className="col-span-2 flex h-10 w-full items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/40 hover:bg-rose-400/20 hover:text-rose-200 sm:col-span-1 sm:h-9 sm:w-9"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
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
                    <div className="text-[10px] font-black uppercase tracking-[0.25em] text-white/30">Remarks</div>
                    <textarea
                      value={day.remarks || ""}
                      onChange={(e) => setDayField(day.isoDate, { remarks: e.target.value })}
                      className="mt-1 min-h-20 w-full resize-y rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm font-bold text-white/75 outline-none placeholder:text-white/25 focus:border-purple-300/60"
                      placeholder="Add remarks for this night..."
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid gap-2 border-t border-white/10 px-3 py-3 sm:flex sm:flex-wrap sm:items-center sm:justify-between sm:gap-3 sm:px-6 sm:py-4">
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

function EventCard({ event, holidays, timeFormat, canEdit, onEdit, onAssignIC, onConfirm }) {
  const scheduleValidation = validateScheduleDays([{ isoDate: event.date, slots: event.slots }]);
  const conflictSlots = scheduleValidation.conflictSlots[event.date] ?? new Set();
  const confirmationBlockers = getConfirmationBlockers(event);
  const dayHolidays = holidays ?? [];
  const holidaySummary = dayHolidays[0] ? dayHolidays[0].localName || dayHolidays[0].name : "";
  const holidayExtra = dayHolidays.length > 1 ? ` +${dayHolidays.length - 1}` : "";
  const holidayTitle = dayHolidays.length ? dayHolidays.map(holidayLabel).join(", ") : "";

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
                    </span>
                  ))
                ) : (
                  <span className="text-xs font-bold text-rose-300">No lineup</span>
                )}
              </div>
              <div className="mt-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/30 md:text-xs">{event.stage}</div>
              {event.notes ? (
                <div className="mt-2 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs font-bold text-white/55">
                  {event.notes}
                </div>
              ) : null}
            </div>

            <div className="col-span-2 grid grid-cols-[minmax(0,1fr)_auto_auto] gap-1.5 border-t border-white/10 pt-3 sm:col-span-1 sm:flex sm:flex-col sm:items-end sm:gap-2 sm:border-t-0 sm:pt-0">
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

function EventDetailsModal({ event, timeFormat, onClose, onEdit, onDelete, onConfirm, canEdit }) {
  if (!event) return null;
  const confirmationBlockers = getConfirmationBlockers(event);

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 p-3 backdrop-blur-sm sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.18 }}
        className="flex max-h-[calc(100svh-1.5rem)] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-[#16152a] to-[#0a0912] text-white shadow-2xl shadow-black/60"
      >
        <div className="flex items-start justify-between gap-4 border-b border-white/10 px-4 py-4 sm:px-6 sm:py-5">
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

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full border px-3 py-1 text-xs font-black uppercase tracking-wider ${statusClass(event.status)}`}>
              {statusLabel(event.status)}
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
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
              <div className="text-[10px] font-black uppercase tracking-[0.24em] text-white/30">Remarks</div>
              <div className="mt-2 whitespace-pre-wrap text-sm font-bold text-white/70">{event.notes}</div>
            </div>
          ) : null}

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
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
                    <div className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs font-black text-white/65">
                      <Clock className="h-3.5 w-3.5" />
                      {formatTimeRange(slot.start, slot.end, timeFormat)}
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
        </div>

        <div className="grid gap-2 border-t border-white/10 px-4 py-4 sm:flex sm:flex-wrap sm:items-center sm:justify-between sm:gap-3 sm:px-6">
          <Button
            onClick={onClose}
            className="h-11 rounded-xl bg-white/5 px-5 text-sm font-black text-white/55 hover:bg-white/10 hover:text-white"
          >
            Close
          </Button>
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
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 p-3 backdrop-blur-sm sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.18 }}
        className="flex max-h-[calc(100svh-1.5rem)] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-[#16152a] to-[#0a0912] text-white shadow-2xl shadow-black/60"
      >
        <div className="flex items-start justify-between gap-4 border-b border-white/10 px-4 py-4 sm:px-6 sm:py-5">
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

        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
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

function FinanceMathPage() {
  const [inputs, setInputs] = useState(financeDefaultInputs);
  const [savedScenarios, setSavedScenarios] = useState(readSavedFinanceScenarios);
  const [activeScenarioId, setActiveScenarioId] = useState(null);

  const persistScenarios = (next) => {
    setSavedScenarios(next);
    writeSavedFinanceScenarios(next);
  };

  const setInput = (key, value) => {
    setInputs((prev) => ({
      ...prev,
      [key]: typeof prev[key] === "number" ? toAmount(value) : value,
    }));
  };

  const setSuggestedFixedCosts = (enabled) => {
    const currentFx = inputs.currencyCode === "MYR" ? 1 : Math.max(toAmount(inputs.exchangeRateToMyr), 0.0001);
    setInputs((prev) => ({
      ...prev,
      includeSuggestedFixedCosts: enabled,
      ...(enabled
        ? {
            ...financeSuggestedFixedCosts,
            utilities: financeSuggestedFixedCosts.utilities / currentFx,
          }
        : {
            serviceRate: 0,
            sstRate: 0,
            bottleCostRate: 0,
            utilities: 0,
          }),
    }));
  };

  const saveScenario = () => {
    const now = new Date().toISOString();
    if (activeScenarioId) {
      const next = savedScenarios.map((scenario) =>
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
      persistScenarios(next);
      return;
    }

    const scenario = createFinanceScenario(inputs);
    persistScenarios([scenario, ...savedScenarios]);
    setActiveScenarioId(scenario.id);
  };

  const saveAsNewScenario = () => {
    const scenario = createFinanceScenario(inputs);
    persistScenarios([scenario, ...savedScenarios]);
    setActiveScenarioId(scenario.id);
  };

  const loadScenario = (scenario) => {
    setInputs({ ...financeDefaultInputs, ...scenario.inputs });
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
  };

  const hasPartnerSplit = Boolean(inputs.hasPartnerSplit);
  const includeSuggestedFixedCosts = Boolean(inputs.includeSuggestedFixedCosts);
  const inputCurrency = inputs.currencyCode || "MYR";
  const exchangeRateToMyr = inputCurrency === "MYR" ? 1 : Math.max(toAmount(inputs.exchangeRateToMyr), 0);
  const toMyr = (value) => toAmount(value) * exchangeRateToMyr;
  const share = (value) => Math.max(0, Math.min(100, toAmount(value))) / 100;
  const splitShare = (value) => (hasPartnerSplit ? share(value) : 1);
  const barSales = toMyr(inputs.barSales);
  const onlineTicketSales = toMyr(inputs.onlineTicketSales);
  const doorSales = toMyr(inputs.doorSales);
  const sponsorship = toMyr(inputs.sponsorship);
  const ambassadorCommission = toMyr(inputs.ambassadorCommission);
  const utilities = includeSuggestedFixedCosts ? toMyr(inputs.utilities) : 0;
  const manpower = toMyr(inputs.manpower);
  const artistCost = toMyr(inputs.artistCost);
  const puspal = toMyr(inputs.puspal);
  const hotel = toMyr(inputs.hotel);
  const rider = toMyr(inputs.rider);
  const supportingDj = toMyr(inputs.supportingDj);
  const mc = toMyr(inputs.mc);
  const marketing = toMyr(inputs.marketing);
  const merchandise = toMyr(inputs.tshirt);
  const otherCost = toMyr(inputs.otherCost);
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
    ["Online Ticket & Door Sales", onlineTicketSales, onlineTicketOa, onlineTicketSales - onlineTicketOa],
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
    ["artistCost", "International Artist Cost"],
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
        <td className="py-2 text-right font-black text-white/55">{currency(amount)}</td>
        <td className="py-2 text-right font-black text-purple-100">{currency(oa)}</td>
        {hasPartnerSplit ? <td className="py-2 text-right font-black text-cyan-100">{currency(partner)}</td> : null}
      </tr>
    ));

  const renderMobileRows = (rows) =>
    rows.map(([label, amount, oa, partner]) => (
      <div key={label} className="rounded-xl border border-white/10 bg-black/20 p-3">
        <div className="text-xs font-black text-white/80">{label}</div>
        <div className={`mt-2 grid gap-2 text-[11px] font-black uppercase tracking-[0.12em] text-white/30 ${hasPartnerSplit ? "grid-cols-3" : "grid-cols-2"}`}>
          <div>
            Amount
            <div className="mt-0.5 text-sm tracking-normal text-white/55">{currency(amount)}</div>
          </div>
          <div>
            O&A
            <div className="mt-0.5 text-sm tracking-normal text-purple-100">{currency(oa)}</div>
          </div>
          {hasPartnerSplit ? (
            <div>
              {inputs.partnerName || "Partner"}
              <div className="mt-0.5 text-sm tracking-normal text-cyan-100">{currency(partner)}</div>
            </div>
          ) : null}
        </div>
      </div>
    ));

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-3 sm:p-5">
        <div className="grid gap-3 md:flex md:flex-wrap md:items-start md:justify-between">
          <div>
            <div className="text-[10px] font-black uppercase tracking-[0.24em] text-purple-200/60">Financial Math</div>
            <h1 className="mt-1 text-xl font-black tracking-tight text-white sm:text-2xl">{inputs.eventName}</h1>
            {activeScenarioId ? <div className="mt-1 text-sm font-bold text-white/35">Saved finance event loaded. Edit inputs, then save to update it.</div> : null}
          </div>
          <div className="grid grid-cols-3 gap-1.5 sm:flex sm:flex-wrap sm:gap-2">
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
            <div className="grid gap-2 sm:grid-cols-[1fr_1fr] lg:grid-cols-1">
              <label>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Input Currency</span>
                <select
                  value={inputCurrency}
                  onChange={(e) => {
                    const nextCurrency = e.target.value;
                    setInputs((prev) => ({
                      ...prev,
                      currencyCode: nextCurrency,
                      exchangeRateToMyr: nextCurrency === "MYR" ? 1 : prev.exchangeRateToMyr || 1,
                    }));
                  }}
                  className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm font-black text-white/80 outline-none focus:border-purple-300/60"
                >
                  <option value="MYR">MYR / RM</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="SGD">SGD</option>
                  <option value="GBP">GBP</option>
                  <option value="AUD">AUD</option>
                </select>
              </label>
              <label>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Rate to RM</span>
                <DecimalInput
                  value={inputs.exchangeRateToMyr}
                  onChange={(value) => setInput("exchangeRateToMyr", value)}
                  disabled={inputCurrency === "MYR"}
                />
              </label>
            </div>
            <div className="rounded-xl border border-purple-300/20 bg-purple-400/10 px-3 py-2 text-xs font-bold text-purple-100/80">
              Enter amounts in {inputCurrency}. Totals convert to RM at {currency(exchangeRateToMyr, "MYR")} per 1 {inputCurrency}.
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
        setDraft(formatInputNumber(value));
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
          <div className="text-[10px] font-black uppercase tracking-[0.16em] text-white/30">{totalLabel} O&A</div>
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
        <table className={`w-full text-sm ${hasPartnerSplit ? "min-w-[560px]" : "min-w-[420px]"}`}>
          <thead className="text-[10px] uppercase tracking-[0.18em] text-white/30">
            <tr>
              <th className="pb-2 text-left">Item</th>
              <th className="pb-2 text-right">Amount</th>
              <th className="pb-2 text-right">O&A</th>
              {hasPartnerSplit ? <th className="pb-2 text-right">{partnerName || "Partner"}</th> : null}
            </tr>
          </thead>
          <tbody>{rows}</tbody>
          <tfoot>
            <tr className="border-t border-white/10 text-base">
              <td className="pt-3 font-black text-white">{totalLabel}</td>
              <td />
              <td className="pt-3 text-right font-black text-purple-100">{currency(oaTotal)}</td>
              {hasPartnerSplit ? <td className="pt-3 text-right font-black text-cyan-100">{currency(partnerTotal)}</td> : null}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
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
              <div className="mt-1 inline-flex items-center gap-1 rounded-lg border border-cyan-300/20 bg-black/20 px-2 py-1 text-xs font-black text-cyan-100">
                <Clock className="h-3.5 w-3.5" />
                {slot.start}-{slot.end}
              </div>
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

    const { data, error: loadError } = await supabase
      .from("events")
      .select(supabaseEventSelect)
      .gte("event_date", weekStartISO)
      .lte("event_date", weekEndISO)
      .order("event_date", { ascending: true })
      .order("slot_order", { foreignTable: "event_slots", ascending: true });

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
    <div className="min-h-screen bg-[#080711] text-white">
      <div className="mx-auto flex min-h-screen max-w-[1320px] flex-col px-4 py-4 sm:px-6 lg:px-8">
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setLoginOpen(false);
          }}
        >
          <form
            onSubmit={authMode === "login" ? submit : register}
            className="max-h-[90vh] w-full max-w-sm overflow-y-auto rounded-3xl border border-white/10 bg-[#0d0c17] p-6 shadow-2xl shadow-black/50"
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

function UserManagementPage({ onToast }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [savingUserId, setSavingUserId] = useState(null);
  const [passwordByUserId, setPasswordByUserId] = useState({});
  const [showPasswordByUserId, setShowPasswordByUserId] = useState({});
  const [roleByUserId, setRoleByUserId] = useState({});

  const adminApiRequest = useCallback(async (path, { method = "GET", body } = {}) => {
    if (!isSupabaseConfigured) {
      throw new Error("Supabase is not configured.");
    }

    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) throw new Error("No active session.");

    const res = await fetch(path, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(body ? { "Content-Type": "application/json" } : null),
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const text = await res.text();
    let payload = null;
    try {
      payload = text ? JSON.parse(text) : null;
    } catch {
      payload = { error: text || `Request failed (${res.status})` };
    }

    if (!res.ok) {
      throw new Error(payload?.error || `Request failed (${res.status})`);
    }

    return payload;
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

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users
      .filter((u) => {
        if (!q) return true;
        return String(u.email || "")
          .toLowerCase()
          .includes(q) || String(u.id || "").toLowerCase().includes(q);
      })
      .sort((a, b) => String(a.email || "").localeCompare(String(b.email || "")));
  }, [search, users]);

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
    } catch (e) {
      setError(e?.message || "Failed to update role.");
    } finally {
      setSavingUserId(null);
    }
  };

  const setUserPassword = async (userId) => {
    const password = String(passwordByUserId[userId] || "");
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
      setPasswordByUserId((prev) => ({ ...prev, [userId]: "" }));
      onToast?.("Password updated");
    } catch (e) {
      setError(e?.message || "Failed to set password.");
    } finally {
      setSavingUserId(null);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-lg font-black tracking-tight text-white/90">User Management</div>
          <div className="mt-1 text-xs font-bold text-white/35">Assign roles and reset passwords for Supabase Auth users.</div>
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

      <Card className="rounded-3xl border border-white/10 bg-white/[0.02]">
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-white/40">
              <Search className="h-4 w-4 shrink-0" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search email or user id..."
                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/30"
              />
            </div>
          </div>

          <div className="mt-4 overflow-hidden rounded-2xl border border-white/10">
            <div className="grid grid-cols-[minmax(0,1fr)_148px] gap-0 border-b border-white/10 bg-white/[0.03] px-4 py-3 text-[10px] font-black uppercase tracking-[0.22em] text-white/30 md:grid-cols-[minmax(0,1fr)_170px_1fr]">
              <div>User</div>
              <div className="hidden md:block">Created</div>
              <div className="text-right">Actions</div>
            </div>

            {loading ? (
              <div className="px-4 py-6 text-center text-sm font-bold text-white/35">Loading users...</div>
            ) : !filteredUsers.length ? (
              <div className="px-4 py-8 text-center text-sm font-bold text-white/35">No users match this filter.</div>
            ) : (
              filteredUsers.map((u) => {
                const currentRole = roleByUserId[u.id] ?? u.role ?? "";
                const busy = savingUserId === u.id;
                return (
                  <div key={u.id} className="grid grid-cols-1 gap-3 border-b border-white/10 px-4 py-4 last:border-b-0 md:grid-cols-[minmax(0,1fr)_170px_1fr] md:items-center">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-black text-white/85">{u.email || "(no email)"}</div>
                      <div className="mt-1 truncate text-xs font-bold text-white/35">{u.id}</div>
                      {u.last_sign_in_at ? (
                        <div className="mt-1 text-[11px] font-bold text-white/30">Last sign-in: {new Date(u.last_sign_in_at).toLocaleString()}</div>
                      ) : (
                        <div className="mt-1 text-[11px] font-bold text-white/30">Never signed in</div>
                      )}
                    </div>

                    <div className="hidden text-xs font-bold text-white/35 md:block">{u.created_at ? new Date(u.created_at).toLocaleDateString() : "-"}</div>

                    <div className="grid gap-2">
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_104px]">
                        <select
                          value={currentRole}
                          onChange={(e) => setRoleByUserId((prev) => ({ ...prev, [u.id]: e.target.value }))}
                          className="h-10 rounded-xl border border-white/10 bg-white/5 px-3 text-xs font-black text-white/70 outline-none hover:bg-white/10 focus:border-purple-300/60"
                        >
                          <option value="">Unassigned</option>
                          <option value="staff">staff</option>
                          <option value="admin">admin</option>
                        </select>
                        <Button
                          onClick={() => updateUserRole(u.id)}
                          disabled={busy}
                          className="h-10 rounded-xl bg-purple-400 text-xs font-black text-black hover:bg-purple-300 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/35"
                        >
                          Save
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_132px]">
                        <div className="relative">
                          <input
                            type={showPasswordByUserId[u.id] ? "text" : "password"}
                            value={passwordByUserId[u.id] || ""}
                            onChange={(e) => setPasswordByUserId((prev) => ({ ...prev, [u.id]: e.target.value }))}
                            placeholder="New password (min 8)"
                            className="h-10 w-full rounded-xl border border-white/10 bg-white/5 px-3 pr-10 text-xs font-black text-white/70 outline-none hover:bg-white/10 focus:border-purple-300/60"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPasswordByUserId((prev) => ({ ...prev, [u.id]: !prev[u.id] }))}
                            className="absolute right-1.5 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/55 hover:bg-white/10 hover:text-white"
                            title={showPasswordByUserId[u.id] ? "Hide password" : "Show password"}
                          >
                            {showPasswordByUserId[u.id] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                        <Button
                          onClick={() => setUserPassword(u.id)}
                          disabled={busy}
                          className="h-10 rounded-xl border border-emerald-300/25 bg-emerald-400/10 text-xs font-black text-emerald-100 hover:bg-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          Set Password
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function DashboardApp({ onLogout, userRole }) {
  const [activeFilter, setActiveFilter] = useState("All");
  const [dateScope, setDateScope] = useState("Upcoming");
  const [dateSort, setDateSort] = useState("asc");
  const [search, setSearch] = useState("");
  const [events, setEvents] = useState(() => eventsSeed.map((e) => ({ ...e, id: String(e.id) })));
  const [view, setView] = useState("List");
  const [listGrouping, setListGrouping] = useState("all");
  const [listMonthCursor, setListMonthCursor] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [calendarCursor, setCalendarCursor] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationsPopoverStyle, setNotificationsPopoverStyle] = useState(null);
  const notificationsButtonRef = React.useRef(null);
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
  const canEdit = userRole === "admin";
  const canAccessFinance = userRole === "admin";
  const canManageUsers = userRole === "admin";
  const weekSectionRefs = React.useRef({});
  const [activeWeekKey, setActiveWeekKey] = useState(null);
  const activeWeekKeyRef = React.useRef(null);
  const listWeekNavInitRef = React.useRef({ view: null, grouping: null, monthKey: null });

  useEffect(() => {
    window.localStorage.setItem("oa_dashboard_theme", theme);
  }, [theme]);

  useEffect(() => {
    window.localStorage.setItem("oa_dashboard_time_format", timeFormat);
  }, [timeFormat]);

  const showToast = useCallback((message, tone = "success") => {
    setToast({ message, tone, id: Date.now() });
  }, []);

  const denyEdit = useCallback(() => {
    showToast("Staff accounts are view-only", "error");
  }, [showToast]);

  useEffect(() => {
    if (!canAccessFinance && view === "Finance") setView("List");
  }, [canAccessFinance, view]);

  useEffect(() => {
    if (!canManageUsers && view === "Users") setView("List");
  }, [canManageUsers, view]);

  useEffect(() => {
    activeWeekKeyRef.current = activeWeekKey;
  }, [activeWeekKey]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const loadEvents = useCallback(async () => {
    if (!isSupabaseConfigured) return;

    const { data, error } = await supabase
      .from("events")
      .select(supabaseEventSelect)
      .order("event_date", { ascending: true })
      .order("slot_order", { foreignTable: "event_slots", ascending: true });

    if (error) {
      setSyncError(error.message);
      setSyncStatus("");
      return;
    }

    if (!Array.isArray(data)) return;

    setSyncError("");
    setSyncStatus("");
    setEvents(data.filter((row) => row?.event_date).map(mapSupabaseEvent));
  }, []);

  const findOrCreateDj = useCallback(async (rawName) => {
    const name = String(rawName || "").trim();
    if (!name || name.toUpperCase().includes("TBD")) return null;

    const existing = await supabase.from("djs").select("id").eq("name", name).limit(1).maybeSingle();
    if (existing.error) throw existing.error;
    if (existing.data?.id) return existing.data.id;

    const created = await supabase.from("djs").insert({ name }).select("id").single();
    if (created.error?.message?.includes("row-level security policy")) return null;
    if (created.error) throw created.error;
    return created.data.id;
  }, []);

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
        notes: setIcInNotes(event.notes, event.ic),
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
            start_time: slot.start,
            end_time: slot.end,
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

        const djId = await findOrCreateDj(slot.dj);
        const savedAssignment = await supabase.from("event_assignments").insert({
          event_slot_id: savedSlot.data.id,
          dj_id: djId,
          assignment_status: event.status === "Confirmed" ? "Confirmed" : "Pending",
          notes: djId ? null : slot.dj,
        });

        if (savedAssignment.error) throw savedAssignment.error;
      }
    },
    [findOrCreateDj],
  );

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    let refreshTimer = null;

    const scheduleRefresh = () => {
      if (refreshTimer) window.clearTimeout(refreshTimer);
      refreshTimer = window.setTimeout(loadEvents, 250);
    };

    loadEvents();
    const channel = supabase
      .channel("oa-dashboard-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "events" }, scheduleRefresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "event_slots" }, scheduleRefresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "event_assignments" }, scheduleRefresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "djs" }, scheduleRefresh)
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setSyncError("");
          setSyncStatus("Realtime connected");
        }
      });

    return () => {
      if (refreshTimer) window.clearTimeout(refreshTimer);
      supabase.removeChannel(channel);
    };
  }, [loadEvents]);

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
    if (!canEdit || !notificationsOpen) return undefined;
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
  }, [canEdit, notificationsOpen, updateNotificationsPopoverPosition]);

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
    if (!node) return;
    node.scrollIntoView({ behavior: "smooth", block: "start" });
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

    const nextMonthKey = `${listMonthCursor.getFullYear()}-${listMonthCursor.getMonth()}`;
    const prev = listWeekNavInitRef.current;
    const shouldAutoJump = prev.view !== "List" || prev.grouping !== listGrouping || prev.monthKey !== nextMonthKey;
    listWeekNavInitRef.current = { view, grouping: listGrouping, monthKey: nextMonthKey };
    if (!shouldAutoJump) return;

    setActiveWeekKey(weekKeys[0]);
    window.setTimeout(() => scrollToWeekKey(weekKeys[0]), 0);
    window.setTimeout(() => scrollToWeekKey(weekKeys[0]), 160);
  }, [listGrouping, listMonthCursor, scrollToWeekKey, view, weekKeys]);

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

    for (const d of modalDays) {
      const dateObj = isoToDate(d.isoDate);
      const { day, dayNo, month } = formatEventDatePieces(dateObj);
      const slots = d.slots
        .map((s) => ({ ...s, dj: String(s.dj || "").trim() }))
        .filter((s) => s.dj.length && minutesFromTime(s.end) > minutesFromTime(s.start))
        .map((s) => ({
          dj: s.dj,
          role: s.role,
          start: s.start,
          end: s.end,
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
        notes: remarks,
      };

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
        await loadEvents();
        setSyncStatus("Saved to Supabase");
        showToast("Saved to database");
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
          const { error } = await supabase.from("events").update({ notes: setIcInNotes(existing.notes, ic) }).eq("id", eventId);
          if (error) throw error;
          setSyncStatus("PIC saved to Supabase");
          showToast("PIC saved to database");
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
            .update({ status, notes: setIcInNotes(updatedEvent.notes, updatedEvent.ic) })
            .eq("id", event.id);
          if (error) {
            const message = error.message || "";
            if (status === "Need Attention" && message.toLowerCase().includes("check")) {
              throw new Error("Run supabase/required_dashboard_schema_updates.sql in Supabase SQL Editor before saving Need Attention.");
            }
            throw error;
          }
          setSyncStatus("Status saved to Supabase");
          showToast(status === "Confirmed" ? "Night confirmed" : "Status saved");
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
        remarks: stripIcNote(event.notes),
        stage: event.stage,
        slots: (event.slots ?? []).map((s) => ({
          dj: s.dj ?? "",
          role: normalizeSlotRole(s.role),
          start: s.start ?? "22:30",
          end: s.end ?? "00:00",
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
    <div className={`oa-theme-${theme} min-h-screen ${isLightTheme ? "bg-[#f6f3fb] text-[#171321]" : "bg-[#080711] text-white"} sm:p-4 lg:p-5 xl:p-6`}>
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
      `}</style>
      <div className={`mx-auto min-h-screen max-w-[1320px] overflow-hidden border-white/10 ${isLightTheme ? "bg-white" : "bg-[#0d0c17]"} shadow-2xl shadow-black/20 sm:min-h-0 sm:rounded-3xl sm:border`}>
        <header className="flex flex-col gap-3 border-b border-white/10 px-3 py-3 sm:px-4 sm:py-4 md:flex-row md:items-center md:justify-between md:px-6 xl:px-8">
          <div className="flex items-center gap-2">
            <div className="mr-1 shrink-0 text-xl font-black leading-none tracking-tight sm:text-2xl md:mr-2 md:text-3xl">O<span className="text-purple-300">&</span>A</div>
            <div
              className={`grid min-w-0 flex-1 gap-1 rounded-2xl border border-white/10 bg-black/20 p-1 md:flex md:flex-none ${
                canAccessFinance && canManageUsers ? "grid-cols-4" : canAccessFinance ? "grid-cols-3" : "grid-cols-2"
              }`}
            >
            <Button
              onClick={() => setView("List")}
              className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-xl px-2 text-[11px] font-black sm:h-10 sm:gap-2 sm:text-sm md:px-4 ${
                view === "List" ? "bg-purple-400 text-black hover:bg-purple-300" : "bg-white/5 text-white/45 hover:bg-white/10 hover:text-white"
              }`}
            >
              <List className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span>List</span>
            </Button>
            <Button
              onClick={() => setView("Calendar")}
              className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-xl px-2 text-[11px] font-black sm:h-10 sm:gap-2 sm:text-sm md:px-4 ${
                view === "Calendar"
                  ? "bg-purple-400 text-black hover:bg-purple-300"
                  : "bg-white/5 text-white/45 hover:bg-white/10 hover:text-white"
              }`}
            >
              <CalendarDays className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span>Calendar</span>
            </Button>
            {canManageUsers ? (
              <Button
                onClick={() => setView("Users")}
                className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-xl px-2 text-[11px] font-black sm:h-10 sm:gap-2 sm:text-sm md:px-4 ${
                  view === "Users"
                    ? "bg-purple-400 text-black hover:bg-purple-300"
                    : "bg-white/5 text-white/45 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span>Users</span>
              </Button>
            ) : null}
            {canAccessFinance ? (
              <Button
                onClick={() => setView("Finance")}
                className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-xl px-2 text-[11px] font-black sm:h-10 sm:gap-2 sm:text-sm md:px-4 ${
                  view === "Finance"
                    ? "bg-purple-400 text-black hover:bg-purple-300"
                    : "bg-white/5 text-white/45 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Calculator className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span>Finance</span>
              </Button>
            ) : null}
            </div>
          </div>
          <div className="grid w-full grid-cols-4 items-stretch gap-1.5 sm:grid-cols-6 md:w-auto md:flex md:flex-wrap md:items-center md:gap-2">
            <Button
              onClick={() => setHolidaysModalOpen(true)}
              className="inline-flex h-11 w-full flex-col items-center justify-center gap-0.5 rounded-xl border border-cyan-300/25 bg-cyan-400/10 px-1 text-[9px] font-black text-cyan-100 hover:bg-cyan-400/20 sm:h-10 sm:w-auto sm:flex-row sm:gap-2 sm:px-3 sm:text-xs md:px-5"
            >
              <CalendarDays className="h-4 w-4 shrink-0" />
              <span>Holidays</span>
            </Button>
            {canEdit ? (
              <div className="relative">
                <Button
                  ref={notificationsButtonRef}
                  onClick={() => {
                    updateNotificationsPopoverPosition();
                    setNotificationsOpen(true);
                  }}
                  className="inline-flex h-11 w-full flex-col items-center justify-center gap-0.5 rounded-xl border border-yellow-300/25 bg-yellow-400/10 px-1 text-[9px] font-black text-yellow-100 hover:bg-yellow-400/20 sm:h-10 sm:w-auto sm:flex-row sm:gap-2 sm:px-3 sm:text-xs md:px-5"
                >
                  <Bell className="h-4 w-4 shrink-0" />
                  <span>Alerts</span>
                </Button>
                {pendingUpcomingCount ? (
                  <span className="absolute -right-1 -top-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full border border-rose-300/40 bg-rose-500/30 px-1 text-[10px] font-black text-rose-50">
                    {pendingUpcomingCount}
                  </span>
                ) : null}
              </div>
            ) : null}
            {canEdit ? (
              <Button
                onClick={() => openAddDayModal()}
                className="inline-flex h-11 w-full flex-col items-center justify-center gap-0.5 rounded-xl border border-purple-300/30 bg-purple-400/10 px-1 text-[9px] font-black text-purple-100 hover:bg-purple-400/20 sm:h-10 sm:w-auto sm:flex-row sm:gap-2 sm:px-3 sm:text-xs md:px-5"
              >
                <Plus className="h-4 w-4 shrink-0" />
                <span>Add Day</span>
              </Button>
            ) : null}
            {canEdit ? (
              <Button
                onClick={() => openAddModal()}
                className="inline-flex h-11 w-full flex-col items-center justify-center gap-0.5 rounded-xl bg-purple-400 px-1 text-[9px] font-black text-black hover:bg-purple-300 sm:h-10 sm:w-auto sm:flex-row sm:gap-2 sm:px-3 sm:text-xs md:px-6"
              >
                <Plus className="h-4 w-4 shrink-0" />
                <span>Add Week</span>
              </Button>
            ) : null}
            <Button
              onClick={() => setTimeFormat(timeFormat === "24" ? "12" : "24")}
              title={timeFormat === "24" ? "24-hour time" : "AM/PM time"}
              className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-white/10 bg-white/5 px-1 text-white/55 hover:bg-white/10 hover:text-white sm:h-10 sm:w-10 sm:px-0"
            >
              <Clock className="h-4 w-4 shrink-0" />
              <span className="sr-only">{timeFormat === "24" ? "24-hour time" : "AM/PM time"}</span>
            </Button>
            <Button
              onClick={() => setTheme(isLightTheme ? "dark" : "light")}
              title={isLightTheme ? "Switch to dark mode" : "Switch to light mode"}
              className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-white/10 bg-white/5 px-1 text-white/55 hover:bg-white/10 hover:text-white sm:h-10 sm:w-10 sm:px-0"
            >
              {isLightTheme ? <Moon className="h-4 w-4 shrink-0" /> : <Sun className="h-4 w-4 shrink-0" />}
              <span className="sr-only">{isLightTheme ? "Dark mode" : "Light mode"}</span>
            </Button>
            <Button
              onClick={onLogout}
              title={userRole ? `${userRole.toUpperCase()} Logout` : "Logout"}
              className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-white/10 bg-white/5 px-1 text-white/55 hover:bg-white/10 hover:text-white sm:h-10 sm:w-10 sm:px-0"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              <span className="sr-only">Logout</span>
            </Button>
          </div>
        </header>

        {canEdit && notificationsOpen ? (
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
                    Upcoming · {pendingUpcomingCount} pending
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

              {pendingUpcomingCount ? (
                <div className="max-h-[60svh] overflow-auto p-2">
                  {pendingUpcomingEvents.map((event) => {
                    const holidayList = holidaysByDate.get(event.date) ?? [];
                    const holidayName = holidayList[0] ? holidayList[0].localName || holidayList[0].name : "";
                    return (
                      <button
                        key={`${event.id}-${event.date}`}
                        onClick={() => {
                          const weekKey = weekKeyFromISO(event.date);
                          setNotificationsOpen(false);
                          setView("List");
                          setActiveWeekKey(weekKey);
                          window.setTimeout(() => scrollToWeekKey(weekKey), 0);
                          window.setTimeout(() => scrollToWeekKey(weekKey), 140);
                        }}
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

        {view !== "Finance" ? (
        <section className="grid grid-cols-2 gap-2 border-b border-white/10 px-3 py-3 sm:grid-cols-4 sm:px-4 md:px-6 xl:gap-4 xl:px-8 xl:py-6">
          <Stat number={stats.total} label="Events" />
          <Stat number={stats.confirmed} label="Confirmed" tone="text-emerald-300" />
          <Stat number={stats.unconfirmed} label="Pending" tone="text-yellow-300" />
          <Stat number={stats.needAttention} label="Need Attention" tone="text-purple-300" />
        </section>
        ) : null}

        {view !== "Finance" ? (
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

          <div className="-mx-1 flex justify-center gap-1.5 overflow-x-auto px-1 md:mx-0 md:justify-start md:flex-wrap md:overflow-visible md:px-0">
            {filterItems.map((item) => {
              const Icon = item.icon;
              const active = activeFilter === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => setActiveFilter(item.key)}
                  className={`flex shrink-0 items-center gap-1.5 rounded-xl border px-2.5 py-2 text-[11px] font-black transition md:rounded-full md:px-4 md:text-sm ${
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
          {view === "Users" ? (
            <UserManagementPage onToast={showToast} />
          ) : view === "Finance" ? (
            <FinanceMathPage />
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
                    <EventCard
                      key={event.id}
                      event={event}
                      holidays={holidaysByDate.get(event.date) ?? []}
                      timeFormat={timeFormat}
                      canEdit={canEdit}
                      onEdit={() => openEditModal(event)}
                      onAssignIC={(ic) => assignIC(event.id, ic)}
                      onConfirm={() => updateEventStatus(event, "Confirmed")}
                    />
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
      />

      <EventDetailsModal
        event={previewEvent}
        timeFormat={timeFormat}
        onClose={() => setPreviewEvent(null)}
        onEdit={openEditFromPreview}
        onDelete={deleteEventDay}
        onConfirm={(event) => updateEventStatus(event, "Confirmed")}
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
          className={`fixed bottom-5 right-5 z-[60] rounded-2xl border px-4 py-3 text-sm font-black shadow-2xl backdrop-blur ${
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
      setRoleError("No admin/staff role assigned for this account.");
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
      <div className="flex min-h-screen items-center justify-center bg-[#080711] p-4 text-white">
        <div className="rounded-3xl border border-white/10 bg-[#0d0c17] px-6 py-5 text-sm font-black text-white/55">Checking login...</div>
      </div>
    );
  }

  if (!session) return <LoginScreen />;

  if (!userRole) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#080711] p-4 text-white">
        <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0d0c17] p-6 shadow-2xl shadow-black/50">
          <div className="text-3xl font-black tracking-tight">
            O<span className="text-purple-300">&</span>A
          </div>
          <div className="mt-4 rounded-2xl border border-rose-300/25 bg-rose-500/10 px-4 py-3 text-sm font-bold text-rose-100">
            {roleError || "No role assigned for this account."}
          </div>
          <div className="mt-3 text-xs font-bold leading-5 text-white/45">
            Add this user to `public.user_roles` as `admin` or `staff`, then log in again.
          </div>
          <Button onClick={logout} className="mt-5 h-11 w-full rounded-xl bg-white/5 text-sm font-black text-white/65 hover:bg-white/10 hover:text-white">
            Logout
          </Button>
        </div>
      </div>
    );
  }

  return <DashboardApp onLogout={logout} userRole={userRole} />;
}

function Stat({ number, label, tone = "text-white" }) {
  return (
    <div className="rounded-2xl bg-white/[0.02] p-2.5 text-center md:p-4 xl:p-5">
      <div className={`text-2xl font-black sm:text-3xl md:text-4xl ${tone}`}>{number}</div>
      <div className="mt-1 text-[9px] font-black uppercase tracking-[0.12em] text-white/25 sm:text-[10px] sm:tracking-[0.2em] md:text-xs">{label}</div>
    </div>
  );
}
