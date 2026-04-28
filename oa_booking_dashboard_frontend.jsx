import React, { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  CalendarDays,
  List,
  Plus,
  Search,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ChevronDown,
  Clock,
  X,
  Zap,
  Trash2,
  Pencil,
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
    status: "No Lineup",
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
    status: "No Lineup",
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
    status: "No Lineup",
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
    status: "No Lineup",
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
    status: "No Lineup",
    stage: "Main Stage",
    slots: [],
  },
];

const statusConfig = {
  Confirmed: "border-emerald-400/70 bg-emerald-400/10 text-emerald-300",
  Unconfirmed: "border-yellow-400/70 bg-yellow-400/10 text-yellow-300",
  "No Lineup": "border-rose-400/70 bg-rose-400/10 text-rose-300",
  Urgent: "border-purple-400/70 bg-purple-400/10 text-purple-300",
};

const filterItems = [
  { key: "All", label: "All", icon: null },
  { key: "Attention", label: "Attention", icon: AlertTriangle },
  { key: "Confirmed", label: "Confirmed", icon: CheckCircle2 },
  { key: "No Lineup", label: "No Lineup", icon: XCircle },
];

function getStatusColor(status) {
  if (status === "No Lineup") return "bg-rose-400";
  if (status === "Unconfirmed") return "bg-yellow-300";
  if (status === "Confirmed") return "bg-emerald-400";
  return "bg-purple-400";
}

function getStatusCalendarClass(status) {
  if (status === "No Lineup") return "border-rose-300/40 bg-rose-500/15 text-rose-100";
  if (status === "Unconfirmed") return "border-yellow-300/40 bg-yellow-400/15 text-yellow-100";
  if (status === "Confirmed") return "border-emerald-300/40 bg-emerald-400/15 text-emerald-100";
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
  const [hRaw, mRaw] = time.split(":").map(Number);
  const h = hRaw < 10 ? hRaw + 24 : hRaw;
  return h * 60 + mRaw;
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

function joinGenreTags(tags) {
  return Array.from(new Set(tags.map((tag) => String(tag || "").trim()).filter(Boolean))).join(" / ");
}

function parseIc(notes) {
  return String(notes || "").match(icNotePattern)?.[1] || "";
}

function setIcInNotes(notes, ic) {
  const cleanNotes = String(notes || "").replace(icNotePattern, "").trim();
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

  return {
    id: String(row.id),
    date,
    day,
    dayNo,
    month,
    name: row.event_name || "Untitled",
    genre: row.genre_profile || "—",
    status: row.status || "No Lineup",
    stage: row.stage || stageOptions[0],
    slots,
    ic: parseIc(row.notes),
    notes: row.notes || "",
  };
}

function isoFromDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
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

function CalendarView({ cursorMonth, onChangeMonth, eventsByDate, onSelectDate, onPreviewEvent }) {
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
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3 md:px-5">
        <div className="text-base font-black tracking-tight text-white md:text-lg">{monthLabel}</div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onChangeMonth(-1)}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-black text-white/60 hover:bg-white/10 hover:text-white md:px-4"
          >
            Prev
          </button>
          <button
            onClick={() => onChangeMonth(0)}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-black text-white/60 hover:bg-white/10 hover:text-white md:px-4"
          >
            Today
          </button>
          <button
            onClick={() => onChangeMonth(1)}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-black text-white/60 hover:bg-white/10 hover:text-white md:px-4"
          >
            Next
          </button>
        </div>
      </div>

      <div className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
        <div className="grid min-w-[720px] grid-cols-7 gap-2 md:min-w-0">
          {weekdayLabels.map((label) => (
            <div key={label} className="px-2 text-[10px] font-black uppercase tracking-[0.25em] text-white/30 md:text-xs">
              {label}
            </div>
          ))}

          {days.map((d) => {
            const iso = isoFromDate(d);
            const isCurrentMonth = d.getMonth() === cursorMonth.getMonth();
            const isToday = iso === isoFromDate(new Date());
            const dayEvents = eventsByDate.get(iso) ?? [];

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
                className={`group min-h-[108px] rounded-2xl border p-2 text-left transition md:min-h-[126px] md:p-3 ${
                  isCurrentMonth ? "border-white/10 bg-white/[0.02]" : "border-white/5 bg-white/[0.01] opacity-60"
                } hover:border-purple-300/30 hover:bg-purple-400/5`}
              >
                <div className="flex items-center justify-between">
                  <div className={`text-sm font-black ${isToday ? "text-purple-200" : "text-white/80"}`}>{d.getDate()}</div>
                  {dayEvents.length ? (
                    <div className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-black text-white/50">
                      {dayEvents.length}
                    </div>
                  ) : null}
                </div>

                <div className="mt-2 space-y-1.5">
                  {dayEvents.slice(0, 3).map((event) => (
                    <button
                      key={event.id}
                      type="button"
                      className={`block w-full truncate rounded-lg border px-2 py-1.5 text-left text-[10px] font-black md:text-xs ${getStatusCalendarClass(event.status)}`}
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                      e.stopPropagation();
                      onPreviewEvent(event);
                    }}
                      title={`${event.name} · ${event.status}`}
                    >
                      {event.name}
                    </button>
                  ))}
                  {dayEvents.length > 3 ? (
                    <div className="text-[10px] font-black text-white/30">+{dayEvents.length - 3} more</div>
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
  seedDateISO,
  onChangeSeedDate,
  onSave,
  djOptions,
  genreOptions,
  existingEventsByDate,
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
        confirmed: false,
        stage: stageOptions[0],
        slots: [],
      };
    });
  });

  const [hasAutofilled, setHasAutofilled] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [genreDrafts, setGenreDrafts] = useState({});
  const [pickerMonth, setPickerMonth] = useState(() => new Date(isoToDate(seedDateISO).getFullYear(), isoToDate(seedDateISO).getMonth(), 1));

  const headerDates = useMemo(() => (dateMode === "day" ? [isoToDate(seedDateISO)] : weekWedToSat(seedDateISO)), [dateMode, seedDateISO]);
  const selectedRangeLabel = useMemo(() => (dateMode === "day" ? dayLabelFromISO(seedDateISO) : weekRangeLabelFromDates(headerDates)), [dateMode, headerDates, seedDateISO]);
  const selectedWeekName = `Week ${weekOfMonthFromISO(seedDateISO)}`;
  const pickerMonthLabel = pickerMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const pickerDays = useMemo(() => monthGridDates(pickerMonth), [pickerMonth]);
  const selectedISOSet = useMemo(() => new Set(headerDates.map(isoFromDate)), [headerDates]);
  const selectedFilledDays = useMemo(() => headerDates.map(isoFromDate).filter((iso) => existingEventsByDate.has(iso)), [existingEventsByDate, headerDates]);

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
            confirmed: false,
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
          confirmed: false,
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
        confirmed: false,
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
    setDays((prev) =>
      prev.map((d) => {
        if (d.isoDate !== isoDate) return d;
        return {
          ...d,
          slots: [
            { dj: "", role: "Warm-up", start: "22:30", end: "00:00", energy: 2 },
            { dj: "", role: "Main", start: "00:00", end: "01:30", energy: 4 },
            { dj: "", role: "Closer", start: "01:30", end: "03:00", energy: 4 },
          ],
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
          confirmed: false,
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 backdrop-blur-sm sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.18 }}
        className="max-h-[calc(100svh-1.5rem)] w-full max-w-4xl overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-[#16152a] to-[#0a0912] text-white shadow-2xl shadow-black/60"
      >
        <div className="flex items-start justify-between gap-4 border-b border-white/10 px-4 py-4 sm:px-6 sm:py-5">
          <div>
            <div className="text-lg font-black tracking-tight sm:text-xl">{title}</div>
            <div className="mt-1 text-[11px] font-black uppercase tracking-[0.2em] text-white/35">
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

        <div className="space-y-4 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
          {!lockDateSelection ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-3 md:p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-[10px] font-black uppercase tracking-[0.25em] text-white/30">{dateMode === "day" ? "Pick available day" : "Pick available week"}</div>
                <div className="mt-1 text-sm font-black text-white/85">{pickerMonthLabel}</div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPickerMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-black text-white/55 hover:bg-white/10 hover:text-white"
                >
                  Prev
                </button>
                <button
                  onClick={() => setPickerMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1))}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-black text-white/55 hover:bg-white/10 hover:text-white"
                >
                  Today
                </button>
                <button
                  onClick={() => setPickerMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-black text-white/55 hover:bg-white/10 hover:text-white"
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
                    className={`min-h-16 rounded-xl border px-1.5 py-1 text-left text-xs font-black transition ${
                      isFilled
                        ? getStatusCalendarClass(existingEvent.status)
                        : isSelected
                          ? "border-purple-200 bg-purple-400 text-black"
                          : weekFilled && dateMode === "week"
                            ? "border-yellow-300/25 bg-yellow-400/10 text-yellow-100/80"
                            : "border-white/10 bg-black/20 text-white/65 hover:border-purple-300/40 hover:bg-purple-400/10 hover:text-white"
                    } ${isCurrentMonth ? "" : "opacity-35"}`}
                    title={isFilled ? `${existingEvent.name || "Schedule"} · ${existingEvent.status}` : "Available"}
                  >
                    <span className="block text-center text-xs font-black">{d.getDate()}</span>
                    {isFilled ? (
                      <span className="mt-1 block truncate text-center text-[9px] font-black uppercase leading-tight tracking-[0.08em]">
                        {existingEvent.name}
                      </span>
                    ) : weekFilled && dateMode === "week" ? (
                      <span className="mt-1 block text-center text-[9px] font-black uppercase leading-tight tracking-[0.08em]">Busy week</span>
                    ) : null}
                  </button>
                );
              })}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em]">
              <span className="rounded-full border border-white/10 bg-black/20 px-2 py-1 text-white/45">Selected: {selectedWeekName} · {selectedRangeLabel}</span>
              <span className="rounded-full border border-emerald-300/20 bg-emerald-400/10 px-2 py-1 text-emerald-100/70">Open</span>
              <span className={`rounded-full border px-2 py-1 ${statusConfig.Confirmed}`}>Confirmed</span>
              <span className={`rounded-full border px-2 py-1 ${statusConfig.Unconfirmed}`}>Unconfirmed</span>
              <span className={`rounded-full border px-2 py-1 ${statusConfig["No Lineup"]}`}>No Lineup</span>
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
          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={autoFill}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-purple-300/40 bg-purple-400/10 px-4 text-xs font-black text-purple-100 hover:bg-purple-400/20"
            >
              <Zap className="h-4 w-4" /> Auto-fill Wed – Sat
            </Button>
            <div className="text-xs font-bold text-white/35">{hasAutofilled ? "You can still edit manually below" : "or fill manually below"}</div>
          </div>
          ) : null}

          <div className="max-h-[58vh] space-y-4 overflow-auto pr-1 sm:max-h-[62vh] sm:pr-2">
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

              return (
                <div
                  key={day.isoDate}
                  className={`rounded-2xl border bg-white/[0.03] p-4 ${dayErrors.length ? "border-rose-300/40" : "border-white/10"}`}
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
                            className="rounded-lg border border-white/10 bg-white/5 px-3 text-xs font-black text-white/55 hover:bg-purple-400 hover:text-black"
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
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => applyQuickSchedule(day.isoDate)}
                          className="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-black text-white/60 hover:bg-white/10 hover:text-white"
                        >
                          Quick schedule
                        </button>
                        <button
                          onClick={() => addSlot(day.isoDate)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-black text-white/60 hover:bg-white/10 hover:text-white"
                        >
                          <Plus className="h-3.5 w-3.5" /> Add slot
                        </button>
                      </div>
                    </div>

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
                                  {t}
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
                                  {t}
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

                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <label className="flex items-center gap-2 text-xs font-bold text-white/50">
                      <input
                        type="checkbox"
                        checked={day.confirmed}
                        onChange={(e) => setDayField(day.isoDate, { confirmed: e.target.checked })}
                        className="h-4 w-4 rounded border-white/20 bg-white/5 text-purple-400 focus:ring-purple-300/50"
                      />
                      Confirmed
                    </label>

                    <select
                      value={day.stage}
                      onChange={(e) => setDayField(day.isoDate, { stage: e.target.value })}
                      className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs font-black text-white/70 outline-none focus:border-purple-300/60"
                    >
                      {stageOptions.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 px-4 py-4 sm:px-6">
          <Button
            onClick={onClose}
            className="h-11 rounded-xl bg-white/5 px-5 text-sm font-black text-white/50 hover:bg-white/10 hover:text-white"
          >
            Cancel
          </Button>
          <div className="flex flex-1 flex-wrap items-center justify-end gap-2">
            {lockDateSelection && editEvent ? (
              <Button
                onClick={() => onDeleteDay(editEvent)}
                disabled={isSaving}
                className="inline-flex h-11 items-center gap-2 rounded-xl border border-rose-300/30 bg-rose-500/15 px-5 text-sm font-black text-rose-100 hover:bg-rose-400 hover:text-black disabled:cursor-not-allowed disabled:opacity-60"
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

function EventCard({ event, expanded, onToggle, onEdit, onAssignIC }) {
  const scheduleValidation = validateScheduleDays([{ isoDate: event.date, slots: event.slots }]);
  const conflictSlots = scheduleValidation.conflictSlots[event.date] ?? new Set();
  const warnings = [];
  if (!event.slots.length) warnings.push("No lineup assigned");
  if (event.slots.some((x) => x.warning || x.dj.includes("TBD"))) warnings.push("Opening slot TBD");
  if (event.slots.length && !event.slots.some((x) => ["Main", "Closer"].includes(x.role))) warnings.push("Missing main DJ");
  if (scheduleValidation.errorsByDate[event.date]) warnings.push(...scheduleValidation.errorsByDate[event.date]);

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

          <div className="grid grid-cols-[52px_minmax(0,1fr)] gap-3 px-4 py-4 pl-6 sm:grid-cols-[64px_minmax(0,1fr)_auto] sm:gap-4 sm:px-5 md:grid-cols-[72px_minmax(0,1fr)_auto] md:px-7 md:py-5">
            <div className="text-center leading-none text-white/70">
              <div className="text-[10px] font-bold tracking-widest md:text-xs">{event.day}</div>
              <div className="mt-1 text-3xl font-black text-white md:text-4xl">{event.dayNo}</div>
              <div className="mt-1 text-[10px] font-bold tracking-widest md:text-xs">{event.month}</div>
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="min-w-0 text-lg font-black tracking-wide text-white md:text-xl">{event.name}</h3>
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${statusConfig[event.status]}`}>
                  {event.status}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {splitGenreTags(event.genre).map((genre) => (
                  <span key={genre} className="rounded-md border border-white/10 bg-black/20 px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-white/35">
                    {genre}
                  </span>
                ))}
              </div>

              <div className="mt-2 flex flex-wrap gap-1.5">
                {event.slots.length ? (
                  event.slots.map((slot, idx) => (
                    <span
                      key={idx}
                      className={`inline-flex flex-col gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-black md:px-3 md:py-2 md:text-sm ${
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
                      <span>
                        {slot.dj} <span className={conflictSlots.has(idx) ? "text-rose-100/70" : "text-white/40"}>{slot.start}-{slot.end}</span>
                      </span>
                    </span>
                  ))
                ) : (
                  <span className="text-xs font-bold text-rose-300">No lineup</span>
                )}
              </div>
              <div className="mt-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/30 md:text-xs">{event.stage}</div>
            </div>

            <div className="col-span-2 flex items-center justify-between gap-2 border-t border-white/10 pt-3 sm:col-span-1 sm:flex-col sm:items-end sm:border-t-0 sm:pt-0">
              <button
                onClick={onToggle}
                className="rounded-lg border border-white/10 bg-white/5 p-2 text-white/50 hover:bg-white/10 hover:text-white sm:p-1.5 md:p-2"
              >
                <ChevronDown className={`h-4 w-4 transition ${expanded ? "rotate-180" : ""}`} />
              </button>
              <div className="flex items-center gap-2 sm:flex-col sm:items-end sm:gap-1">
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/25">PIC</div>
                <select
                  value={event.ic || ""}
                  onChange={(e) => onAssignIC(e.target.value)}
                  className="h-10 rounded-lg border border-white/10 bg-white/5 px-3 text-sm font-black text-white/70 outline-none hover:bg-white/10 focus:border-purple-300/60 sm:h-8 sm:px-2 sm:text-xs md:h-9 md:text-sm"
                >
                  <option value="">PIC</option>
                  <option value="Wai Hong">Wai Hong</option>
                  <option value="Ashwin">Ashwin</option>
                </select>
              </div>
              <button
                onClick={onEdit}
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 text-sm font-black text-white/60 hover:bg-purple-400 hover:text-black sm:h-8 sm:text-xs md:h-9 md:text-sm"
              >
                <Pencil className="h-3.5 w-3.5" /> Edit
              </button>
            </div>
          </div>

          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t border-white/10 px-4 pb-5 pt-4 md:px-7"
            >
              {event.slots.length ? (
                <>
                  <div className="relative mt-2 h-4 rounded-full bg-white/5">
                    {event.slots.map((slot, index) => {
                      const left = timeToPercent(slot.start);
                      const right = timeToPercent(slot.end);
                      const width = Math.max(5, right - left);
                      const bg = slot.energy >= 5 ? "bg-rose-400" : slot.energy >= 4 ? "bg-yellow-300" : slot.energy >= 3 ? "bg-emerald-400" : "bg-purple-300";
                      return (
                        <div
                          key={index}
                          className={`absolute top-0 h-4 rounded-sm ${bg}`}
                          style={{ left: `${left}%`, width: `${width}%` }}
                          title={`${slot.dj} — ${slot.role} (${slot.start}-${slot.end})`}
                        />
                      );
                    })}
                  </div>
                  <div className="mt-2 flex justify-between text-[10px] font-bold text-white/25">
                    <span>10PM</span><span>12AM</span><span>2AM</span><span>4AM</span>
                  </div>

                  <div className="mt-4 grid gap-2 md:grid-cols-2">
                    {event.slots.map((slot, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center justify-between rounded-xl border px-3 py-2 ${
                          conflictSlots.has(idx) ? "border-rose-300/50 bg-rose-500/10" : "border-white/10 bg-black/20"
                        }`}
                      >
                        <div>
                          <div className="mb-1 w-fit rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-[0.14em] text-white/45">
                            {slot.role}
                          </div>
                          <div className="text-sm font-black text-white">{slot.dj}</div>
                          <div className="mt-0.5 flex items-center gap-1 text-[10px] font-bold text-white/35">
                            <Clock className="h-3 w-3" /> {slot.start}–{slot.end} · Energy {slot.energy}/5
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : null}

              {warnings.length > 0 && (
                <div className="mt-4 rounded-xl border border-yellow-400/20 bg-yellow-400/10 p-3">
                  {warnings.map((warning, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs font-bold text-yellow-200">
                      <AlertTriangle className="h-3.5 w-3.5" /> {warning}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function EventDetailsModal({ event, onClose, onEdit, onDelete }) {
  if (!event) return null;

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
        className="max-h-[calc(100svh-1.5rem)] w-full max-w-2xl overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-[#16152a] to-[#0a0912] text-white shadow-2xl shadow-black/60"
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

        <div className="space-y-4 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`rounded-full border px-3 py-1 text-xs font-black uppercase tracking-wider ${statusConfig[event.status]}`}>
              {event.status}
            </span>
            {splitGenreTags(event.genre).map((genre) => (
              <span key={genre} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-black text-white/55">
                {genre}
              </span>
            ))}
            {event.ic ? (
              <span className="rounded-full border border-purple-300/30 bg-purple-400/10 px-3 py-1 text-xs font-black text-purple-100">PIC {event.ic}</span>
            ) : null}
          </div>

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
                      {slot.start}-{slot.end}
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

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 px-4 py-4 sm:px-6">
          <Button
            onClick={onClose}
            className="h-11 rounded-xl bg-white/5 px-5 text-sm font-black text-white/55 hover:bg-white/10 hover:text-white"
          >
            Close
          </Button>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={() => onDelete(event)}
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-rose-300/30 bg-rose-500/15 px-5 text-sm font-black text-rose-100 hover:bg-rose-400 hover:text-black"
            >
              <Trash2 className="h-4 w-4" />
              <span>Delete Day</span>
            </Button>
            <Button
              onClick={() => onEdit(event)}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-purple-400 px-5 text-sm font-black text-black hover:bg-purple-300"
            >
              <Pencil className="h-4 w-4" />
              <span>Edit Day</span>
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function OABookingDashboard() {
  const [activeFilter, setActiveFilter] = useState("All");
  const [dateScope, setDateScope] = useState("Upcoming");
  const [dateSort, setDateSort] = useState("asc");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState("5");
  const [events, setEvents] = useState(() => eventsSeed.map((e) => ({ ...e, id: String(e.id) })));
  const [view, setView] = useState("List");
  const [calendarCursor, setCalendarCursor] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("Add Event Day");
  const [modalInitialDays, setModalInitialDays] = useState(null);
  const [modalDateMode, setModalDateMode] = useState("week");
  const [modalLockDateSelection, setModalLockDateSelection] = useState(false);
  const [modalEditEvent, setModalEditEvent] = useState(null);
  const [previewEvent, setPreviewEvent] = useState(null);
  const [syncError, setSyncError] = useState("");
  const [syncStatus, setSyncStatus] = useState("");
  const [toast, setToast] = useState(null);
  const [seedDateISO, setSeedDateISO] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });

  const showToast = useCallback((message, tone = "success") => {
    setToast({ message, tone, id: Date.now() });
  }, []);

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
    setSyncStatus("Live from Supabase");
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

      if (savedEvent.error) throw savedEvent.error;

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
            throw new Error("Supabase needs the role SQL update before Main/MC slots can save.");
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

  const scopedEvents = useMemo(() => {
    return events.filter((event) => (dateScope === "Past" ? event.date < todayISO : event.date >= todayISO));
  }, [dateScope, events, todayISO]);

  const pastCount = useMemo(() => events.filter((event) => event.date < todayISO).length, [events, todayISO]);
  const upcomingCount = events.length - pastCount;

  const stats = useMemo(() => {
    const total = scopedEvents.length;
    const confirmed = scopedEvents.filter((x) => x.status === "Confirmed").length;
    const unconfirmed = scopedEvents.filter((x) => x.status === "Unconfirmed").length;
    const noLineup = scopedEvents.filter((x) => x.status === "No Lineup" || !x.slots.length).length;
    const urgent = scopedEvents.filter((x) => !x.slots.length || x.slots.some((s) => s.dj.includes("TBD"))).length;
    return { total, confirmed, unconfirmed, noLineup, urgent };
  }, [scopedEvents]);

  const filteredEvents = useMemo(() => {
    return scopedEvents
      .filter((event) => {
        const matchesSearch = `${event.name} ${event.genre} ${event.stage} ${event.ic || ""} ${event.slots.map((x) => x.dj).join(" ")}`
          .toLowerCase()
          .includes(search.toLowerCase());

        if (!matchesSearch) return false;
        if (activeFilter === "All") return true;
        if (activeFilter === "Attention") return event.status === "No Lineup" || event.slots.some((s) => s.dj.includes("TBD"));
        return event.status === activeFilter;
      })
      .sort((a, b) => {
        const dateCompare = a.date.localeCompare(b.date);
        if (dateCompare !== 0) return dateSort === "asc" ? dateCompare : -dateCompare;
        return (a.name || "").localeCompare(b.name || "");
      });
  }, [activeFilter, dateSort, scopedEvents, search]);

  const groupedEvents = useMemo(() => {
    const groups = new Map();
    for (const event of filteredEvents) {
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
        needsAttention: items.filter((event) => event.status === "No Lineup" || event.slots.some((slot) => slot.dj.includes("TBD"))).length,
      }))
      .sort((a, b) => (dateSort === "asc" ? a.key.localeCompare(b.key) : b.key.localeCompare(a.key)));
  }, [dateSort, filteredEvents]);

  const saveModalDays = async (modalDays) => {
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

      const status = d.confirmed ? "Confirmed" : slots.length ? "Unconfirmed" : "No Lineup";
      const name = String(d.name || "").trim() || "Untitled";
      const genre = String(d.genre || "").trim() || "—";
      const stage = d.stage || stageOptions[0];

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
        notes: existing?.notes || "",
      };

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
        showToast(message.includes("role SQL") ? "Run the role SQL in Supabase first" : "Save failed", "error");
        throw new Error(message);
      }
    }
  };

  const assignIC = (eventId, ic) => {
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

  const deleteEventDay = async (event) => {
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
    if (dateISO) setSeedDateISO(dateISO);
    setModalTitle("Add Event Week");
    setModalInitialDays(null);
    setModalDateMode("week");
    setModalLockDateSelection(false);
    setModalEditEvent(null);
    setModalOpen(true);
  };

  const openAddDayModal = (dateISO) => {
    if (dateISO) setSeedDateISO(dateISO);
    setModalTitle("Add Event Day");
    setModalInitialDays(null);
    setModalDateMode("day");
    setModalLockDateSelection(false);
    setModalEditEvent(null);
    setModalOpen(true);
  };

  const openEditModal = (event) => {
    const initialDays = [
      {
        isoDate: event.date,
        name: event.name,
        genre: event.genre,
        confirmed: event.status === "Confirmed",
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
    for (const e of filteredEvents) {
      const list = map.get(e.date) ?? [];
      list.push(e);
      map.set(e.date, list);
    }
    for (const [key, list] of map.entries()) {
      list.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
      map.set(key, list);
    }
    return map;
  }, [filteredEvents]);

  return (
    <div className="min-h-screen bg-[#080711] p-3 text-white sm:p-4 lg:p-6 xl:p-8">
      <div className="mx-auto max-w-[1600px] overflow-hidden rounded-3xl border border-white/10 bg-[#0d0c17] shadow-2xl shadow-black/50">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-4 md:px-6 xl:px-8">
          <div className="flex max-w-full flex-wrap items-center gap-2">
            <div className="mr-1 text-2xl font-black leading-none tracking-tight md:mr-2 md:text-3xl">O<span className="text-purple-300">&</span>A</div>
            <Button
              onClick={() => setView("List")}
              className={`inline-flex h-11 items-center gap-2 rounded-xl px-4 text-sm font-black md:px-5 ${
                view === "List" ? "bg-purple-400 text-black hover:bg-purple-300" : "bg-white/5 text-white/45 hover:bg-white/10 hover:text-white"
              }`}
            >
              <List className="h-4 w-4" />
              <span>List</span>
            </Button>
            <Button
              onClick={() => setView("Calendar")}
              className={`inline-flex h-11 items-center gap-2 rounded-xl px-4 text-sm font-black md:px-5 ${
                view === "Calendar"
                  ? "bg-purple-400 text-black hover:bg-purple-300"
                  : "bg-white/5 text-white/45 hover:bg-white/10 hover:text-white"
              }`}
            >
              <CalendarDays className="h-4 w-4" />
              <span>Calendar</span>
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={() => openAddDayModal()}
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-purple-300/40 bg-purple-400/10 px-4 text-sm font-black text-purple-100 hover:bg-purple-400/20 md:px-5"
            >
              <Plus className="h-4 w-4" />
              <span>ADD DAY</span>
            </Button>
            <Button
              onClick={() => openAddModal()}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-purple-400 px-4 text-sm font-black text-black hover:bg-purple-300 md:px-6"
            >
              <Plus className="h-4 w-4" />
              <span>ADD WEEK</span>
            </Button>
          </div>
        </header>

        {syncError ? (
          <div className="border-b border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm font-bold text-rose-100 md:px-6 xl:px-8">
            Supabase sync issue: {syncError}
          </div>
        ) : !isSupabaseConfigured ? (
          <div className="border-b border-yellow-400/20 bg-yellow-400/10 px-4 py-3 text-sm font-bold text-yellow-100 md:px-6 xl:px-8">
            Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in this environment.
          </div>
        ) : null}

        <section className="grid grid-cols-2 gap-2 border-b border-white/10 px-4 py-4 sm:grid-cols-5 md:px-6 xl:gap-4 xl:px-8 xl:py-6">
          <Stat number={stats.total} label="Events" />
          <Stat number={stats.confirmed} label="Confirmed" tone="text-emerald-300" />
          <Stat number={stats.unconfirmed} label="Unconfirmed" tone="text-yellow-300" />
          <Stat number={stats.noLineup} label="No Lineup" tone="text-rose-300" />
          <Stat number={stats.urgent} label="Urgent" tone="text-purple-300" />
        </section>

        <section className="sticky top-0 z-10 flex flex-wrap items-center gap-2 border-b border-white/10 bg-[#0d0c17]/95 px-4 py-3 backdrop-blur md:px-6 xl:px-8">
          <div className="flex max-w-full items-center gap-1 overflow-x-auto rounded-full border border-white/10 bg-white/[0.03] p-1">
            {[
              { key: "Upcoming", label: "Upcoming", count: upcomingCount },
              { key: "Past", label: "Past Events", count: pastCount },
            ].map((item) => {
              const active = dateScope === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => setDateScope(item.key)}
                  className={`shrink-0 rounded-full px-3 py-2 text-xs font-black transition md:px-4 md:text-sm ${
                    active ? "bg-white text-black" : "text-white/45 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {item.label} <span className={active ? "text-black/50" : "text-white/25"}>{item.count}</span>
                </button>
              );
            })}
          </div>

          {filterItems.map((item) => {
            const Icon = item.icon;
            const active = activeFilter === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setActiveFilter(item.key)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-black transition md:px-4 md:text-sm ${
                  active ? "border-purple-300 bg-purple-400 text-black" : "border-white/10 bg-white/5 text-white/45 hover:text-white"
                }`}
              >
                {Icon && <Icon className="h-3.5 w-3.5" />} {item.label}
              </button>
            );
          })}

          <select
            value={dateSort}
            onChange={(e) => setDateSort(e.target.value)}
            className="h-11 rounded-lg border border-white/10 bg-white/5 px-3 text-sm font-black text-white/70 outline-none hover:bg-white/10 focus:border-purple-300/60 lg:ml-auto"
          >
            <option value="asc">Date ↑</option>
            <option value="desc">Date ↓</option>
          </select>

          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-white/40 sm:min-w-[260px] lg:flex-none xl:min-w-[340px]">
            <Search className="h-4 w-4" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/30"
            />
          </div>
        </section>

        <main className="space-y-4 px-4 py-4 md:px-6 xl:px-8 xl:py-6">
          {view === "List" ? (
            <>
              {groupedEvents.map((group) => (
                <section key={group.key} className="space-y-3 border-t border-white/10 pt-4 first:border-t-0 first:pt-0 xl:space-y-4 xl:pt-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-[0.25em] text-white/25">{group.weekName}</div>
                      <h2 className="mt-1 text-base font-black text-white/85 md:text-lg">{group.label}</h2>
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
                      expanded={expandedId === event.id}
                      onToggle={() => setExpandedId(expandedId === event.id ? null : event.id)}
                      onEdit={() => openEditModal(event)}
                      onAssignIC={(ic) => assignIC(event.id, ic)}
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
              onSelectDate={(iso) => openAddDayModal(iso)}
              onPreviewEvent={setPreviewEvent}
            />
          )}
        </main>
      </div>

      <AddEventDayModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setModalInitialDays(null);
          setModalLockDateSelection(false);
          setModalEditEvent(null);
        }}
        seedDateISO={seedDateISO}
        onChangeSeedDate={setSeedDateISO}
        onSave={saveModalDays}
        djOptions={djOptions}
        genreOptions={genreOptions}
        existingEventsByDate={existingEventsByDate}
        onPreviewEvent={setPreviewEvent}
        editEvent={modalEditEvent}
        onDeleteDay={deleteEventDay}
        title={modalTitle}
        initialDays={modalInitialDays}
        dateMode={modalDateMode}
        lockDateSelection={modalLockDateSelection}
      />

      <EventDetailsModal event={previewEvent} onClose={() => setPreviewEvent(null)} onEdit={openEditFromPreview} onDelete={deleteEventDay} />

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

function Stat({ number, label, tone = "text-white" }) {
  return (
    <div className="rounded-2xl bg-white/[0.02] p-3 text-center md:p-4 xl:p-5">
      <div className={`text-3xl font-black md:text-4xl ${tone}`}>{number}</div>
      <div className="mt-1 text-[10px] font-black uppercase tracking-[0.2em] text-white/25 md:text-xs">{label}</div>
    </div>
  );
}
