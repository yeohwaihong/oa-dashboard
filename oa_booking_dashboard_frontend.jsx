import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  CalendarDays,
  List,
  Plus,
  Search,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Headphones,
  ChevronDown,
  Clock,
  Sparkles,
  X,
  Zap,
  Trash2,
  Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

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
  { key: "Mr. Yang", label: "Mr. Yang", icon: Headphones },
];

function getStatusColor(status) {
  if (status === "No Lineup") return "bg-rose-400";
  if (status === "Unconfirmed") return "bg-yellow-300";
  if (status === "Confirmed") return "bg-emerald-400";
  return "bg-purple-400";
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

function buildTimeOptions() {
  const options = [];
  for (let minutes = 22 * 60; minutes <= 28 * 60; minutes += 30) {
    const displayHour = Math.floor(minutes / 60) % 24;
    const m = minutes % 60;
    const label = `${String(displayHour).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    options.push(label);
  }
  return options;
}

const timeOptions = buildTimeOptions();
const roleOptions = ["Warm-up", "Driver", "Peak", "Closer"];
const stageOptions = ["Centre Stage", "Main Stage"];

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

function CalendarView({ cursorMonth, onChangeMonth, eventsByDate, onSelectDate, onEditEvent, onAssignIC }) {
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
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-3">
        <div className="text-sm font-black tracking-tight text-white">{monthLabel}</div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onChangeMonth(-1)}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-black text-white/60 hover:bg-white/10 hover:text-white"
          >
            Prev
          </button>
          <button
            onClick={() => onChangeMonth(0)}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-black text-white/60 hover:bg-white/10 hover:text-white"
          >
            Today
          </button>
          <button
            onClick={() => onChangeMonth(1)}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-black text-white/60 hover:bg-white/10 hover:text-white"
          >
            Next
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {weekdayLabels.map((label) => (
          <div key={label} className="px-2 text-[10px] font-black uppercase tracking-[0.25em] text-white/30">
            {label}
          </div>
        ))}

        {days.map((d) => {
          const iso = isoFromDate(d);
          const isCurrentMonth = d.getMonth() === cursorMonth.getMonth();
          const isToday = iso === isoFromDate(new Date());
          const dayEvents = eventsByDate.get(iso) ?? [];

          return (
            <button
              key={iso}
              onClick={() => onSelectDate(iso)}
              className={`group min-h-[92px] rounded-2xl border p-2 text-left transition ${
                isCurrentMonth ? "border-white/10 bg-white/[0.02]" : "border-white/5 bg-white/[0.01] opacity-60"
              } hover:border-purple-300/30 hover:bg-purple-400/5`}
            >
              <div className="flex items-center justify-between">
                <div className={`text-xs font-black ${isToday ? "text-purple-200" : "text-white/80"}`}>{d.getDate()}</div>
                {dayEvents.length ? (
                  <div className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-black text-white/50">
                    {dayEvents.length}
                  </div>
                ) : null}
              </div>

              <div className="mt-2 space-y-1">
                {dayEvents.slice(0, 2).map((event) => (
                  <div
                    key={event.id}
                    className="flex w-full items-center justify-between gap-2 rounded-lg border border-white/10 bg-black/20 px-2 py-1"
                    onMouseDown={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditEvent(event);
                      }}
                      className="min-w-0 flex-1 truncate text-left text-[10px] font-black text-white/70 hover:text-white"
                      title={event.name}
                    >
                      {event.name}
                    </button>
                    <select
                      value={event.ic || ""}
                      onChange={(e) => onAssignIC(event.id, e.target.value)}
                      className="h-6 w-[88px] shrink-0 rounded-md border border-white/10 bg-white/5 px-1 text-[10px] font-black text-white/60 outline-none hover:bg-white/10 focus:border-purple-300/60"
                    >
                      <option value="">IC…</option>
                      <option value="Ashwin">Ashwin</option>
                      <option value="Wai Hong">Wai Hong</option>
                    </select>
                  </div>
                ))}
                {dayEvents.length > 2 ? (
                  <div className="text-[10px] font-black text-white/30">+{dayEvents.length - 2} more</div>
                ) : null}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function AddEventDayModal({ open, onClose, seedDateISO, onChangeSeedDate, onSave, djOptions, title = "Add Event Day", initialDays }) {
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

  const headerDates = useMemo(() => weekWedToSat(seedDateISO), [seedDateISO]);

  useEffect(() => {
    if (!open) return;
    setHasAutofilled(false);
    if (initialDays?.length) {
      setDays(initialDays);
      return;
    }
    setDays(
      weekWedToSat(seedDateISO).map((d) => {
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
  }, [initialDays, open]);

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

  const setDayField = (isoDate, patch) => {
    setDays((prev) => prev.map((d) => (d.isoDate === isoDate ? { ...d, ...patch } : d)));
  };

  const addSlot = (isoDate) => {
    setDays((prev) =>
      prev.map((d) => {
        if (d.isoDate !== isoDate) return d;
        const nextRole = roleOptions[Math.min(d.slots.length, roleOptions.length - 1)];
        const start = d.slots.length ? d.slots[d.slots.length - 1].end : "22:30";
        const startIndex = Math.max(0, timeOptions.indexOf(start));
        const end = timeOptions[Math.min(timeOptions.length - 1, startIndex + 3)] ?? "00:00";
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
    return timeOptions[Math.min(timeOptions.length - 1, Math.max(0, startIndex + 3))] ?? nextEnd;
  };

  const applyQuickSchedule = (isoDate) => {
    setDays((prev) =>
      prev.map((d) => {
        if (d.isoDate !== isoDate) return d;
        return {
          ...d,
          slots: [
            { dj: "", role: "Warm-up", start: "22:30", end: "00:00", energy: 2 },
            { dj: "", role: "Peak", start: "00:00", end: "01:30", energy: 4 },
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

  const save = () => {
    onSave(modalDays);
    onClose();
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.18 }}
        className="w-full max-w-2xl overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-[#16152a] to-[#0a0912] text-white shadow-2xl shadow-black/60"
      >
        <div className="flex items-start justify-between gap-4 border-b border-white/10 px-6 py-5">
          <div>
            <div className="text-lg font-black tracking-tight">{title}</div>
            <div className="mt-1 text-[11px] font-black uppercase tracking-[0.2em] text-white/35">Pick any date in the week</div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl border border-white/10 bg-white/5 p-2 text-white/50 hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 px-6 py-5">
          <div className="flex items-center gap-3">
            <input
              type="date"
              value={seedDateISO}
              onChange={(e) => {
                onChangeSeedDate(e.target.value);
                setDays((prev) => {
                  const nextDates = weekWedToSat(e.target.value);
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
              }}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-bold text-white/80 outline-none focus:border-purple-300/60"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={autoFill}
              className="inline-flex h-10 items-center gap-2 rounded-xl border border-purple-300/40 bg-purple-400/10 px-4 text-xs font-black text-purple-100 hover:bg-purple-400/20"
            >
              <Zap className="h-4 w-4" /> Auto-fill Wed – Sat
            </Button>
            <div className="text-xs font-bold text-white/35">{hasAutofilled ? "You can still edit manually below" : "or fill manually below"}</div>
          </div>

          <div className="max-h-[62vh] space-y-4 overflow-auto pr-2">
            {modalDays.map((day) => {
              const date = isoToDate(day.isoDate);
              const weekday = date.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase();
              const month = date.toLocaleDateString("en-US", { month: "short" }).toUpperCase();
              const header = `${weekday} · ${date.getDate()} ${month}`;
              const djListId = `dj-options-${day.isoDate}`;

              return (
                <div key={day.isoDate} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
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
                      <input
                        value={day.genre}
                        onChange={(e) => setDayField(day.isoDate, { genre: e.target.value })}
                        className="mt-1 w-full rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-sm font-black text-white/70 outline-none focus:border-purple-300/60"
                        placeholder="AFRO / AMAPIANO"
                      />
                    </div>
                  </div>

                  <div className="mt-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="text-[10px] font-black uppercase tracking-[0.25em] text-white/30">DJs & Timings</div>
                      <div className="flex items-center gap-2">
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
                            className="grid grid-cols-[1fr_110px_110px_110px_36px] items-center gap-2 rounded-xl border border-white/10 bg-black/20 p-2"
                          >
                            <div>
                              <input
                                list={djListId}
                                value={slot.dj}
                                onChange={(e) => updateSlot(day.isoDate, idx, { dj: e.target.value })}
                                placeholder="Select DJ"
                                className="w-full rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-xs font-black text-white/85 outline-none focus:border-purple-300/60"
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
                              className="w-full rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-xs font-black text-white/70 outline-none focus:border-purple-300/60"
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
                              className="w-full rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-xs font-black text-white/70 outline-none focus:border-purple-300/60"
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
                              className="w-full rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-xs font-black text-white/50 outline-none focus:border-purple-300/60"
                            >
                              {roleOptions.map((r) => (
                                <option key={r} value={r}>
                                  {r}
                                </option>
                              ))}
                            </select>

                            <button
                              onClick={() => removeSlot(day.isoDate, idx)}
                              className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/40 hover:bg-rose-400/20 hover:text-rose-200"
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

        <div className="flex items-center justify-between gap-3 border-t border-white/10 px-6 py-4">
          <Button
            onClick={onClose}
            className="h-11 rounded-xl bg-white/5 px-5 text-sm font-black text-white/50 hover:bg-white/10 hover:text-white"
          >
            Cancel
          </Button>
          <Button
            onClick={save}
            className="h-11 flex-1 rounded-xl bg-purple-400 px-5 text-sm font-black text-black hover:bg-purple-300"
          >
            Save Events
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

function EventCard({ event, expanded, onToggle, onEdit, onAssignIC }) {
  const warnings = [];
  if (!event.slots.length) warnings.push("No lineup assigned");
  if (event.slots.some((x) => x.warning || x.dj.includes("TBD"))) warnings.push("Opening slot TBD");
  if (event.slots.length && !event.slots.some((x) => ["Peak", "Closer"].includes(x.role))) warnings.push("Missing peak DJ");

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="overflow-hidden rounded-2xl border border-white/10 bg-[#12111f] text-white shadow-xl shadow-black/20">
        <CardContent className="relative p-0">
          <div className={`absolute left-0 top-0 h-full w-1.5 ${getStatusColor(event.status)}`} />

          <div className="grid grid-cols-[58px_1fr_auto] gap-4 px-5 py-4 pl-6">
            <div className="text-center leading-none text-white/70">
              <div className="text-[10px] font-bold tracking-widest">{event.day}</div>
              <div className="mt-1 text-3xl font-black text-white">{event.dayNo}</div>
              <div className="mt-1 text-[10px] font-bold tracking-widest">{event.month}</div>
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="truncate text-sm font-black tracking-wide text-white md:text-base">{event.name}</h3>
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${statusConfig[event.status]}`}>
                  {event.status}
                </span>
              </div>
              <div className="mt-1 text-[11px] font-bold uppercase tracking-widest text-white/35">{event.genre}</div>

              <div className="mt-2 flex flex-wrap gap-1.5">
                {event.slots.length ? (
                  event.slots.map((slot, idx) => (
                    <span key={idx} className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-bold text-white/70">
                      {slot.dj}
                    </span>
                  ))
                ) : (
                  <span className="text-xs font-bold text-rose-300">No lineup</span>
                )}
              </div>
            </div>

            <div className="flex flex-col items-end justify-between gap-2">
              <button
                onClick={onToggle}
                className="rounded-lg border border-white/10 bg-white/5 p-1.5 text-white/50 hover:bg-white/10 hover:text-white"
              >
                <ChevronDown className={`h-4 w-4 transition ${expanded ? "rotate-180" : ""}`} />
              </button>
              <div className="flex flex-col items-end gap-1">
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/25">Assign</div>
                <select
                  value={event.ic || ""}
                  onChange={(e) => onAssignIC(e.target.value)}
                  className="h-8 rounded-lg border border-white/10 bg-white/5 px-2 text-xs font-black text-white/70 outline-none hover:bg-white/10 focus:border-purple-300/60"
                >
                  <option value="">IC…</option>
                  <option value="Ashwin">Ashwin</option>
                  <option value="Wai Hong">Wai Hong</option>
                </select>
              </div>
              <button
                onClick={onEdit}
                className="inline-flex h-8 items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 text-xs font-black text-white/60 hover:bg-purple-400 hover:text-black"
              >
                <Pencil className="h-3.5 w-3.5" /> Edit
              </button>
              <div className="text-[10px] text-white/30">{event.stage}</div>
            </div>
          </div>

          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t border-white/10 px-6 pb-5 pt-4"
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
                      <div key={idx} className="flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-3 py-2">
                        <div>
                          <div className="text-xs font-black text-white">{slot.role} · {slot.dj}</div>
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

export default function OABookingDashboard() {
  const [activeFilter, setActiveFilter] = useState("All");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState(5);
  const [events, setEvents] = useState(eventsSeed);
  const [view, setView] = useState("List");
  const [calendarCursor, setCalendarCursor] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("Add Event Day");
  const [modalInitialDays, setModalInitialDays] = useState(null);
  const [seedDateISO, setSeedDateISO] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });

  const djOptions = useMemo(() => {
    const set = new Set(["(OPENING TBD)"]);
    for (const e of events) {
      for (const s of e.slots) {
        if (s.dj) set.add(s.dj);
      }
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [events]);

  const stats = useMemo(() => {
    const total = events.length;
    const confirmed = events.filter((x) => x.status === "Confirmed").length;
    const unconfirmed = events.filter((x) => x.status === "Unconfirmed").length;
    const noLineup = events.filter((x) => x.status === "No Lineup" || !x.slots.length).length;
    const urgent = events.filter((x) => !x.slots.length || x.slots.some((s) => s.dj.includes("TBD"))).length;
    return { total, confirmed, unconfirmed, noLineup, urgent };
  }, [events]);

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const matchesSearch = `${event.name} ${event.genre} ${event.stage} ${event.ic || ""} ${event.slots.map((x) => x.dj).join(" ")}`
        .toLowerCase()
        .includes(search.toLowerCase());

      if (!matchesSearch) return false;
      if (activeFilter === "All") return true;
      if (activeFilter === "Attention") return event.status === "No Lineup" || event.slots.some((s) => s.dj.includes("TBD"));
      if (activeFilter === "Mr. Yang") return event.slots.some((s) => s.dj.toLowerCase().includes("yang"));
      return event.status === activeFilter;
    });
  }, [activeFilter, events, search]);

  const saveModalDays = (modalDays) => {
    setEvents((prev) => {
      const existingByDate = new Map(prev.map((e) => [e.date, e]));
      const next = [...prev];
      let nextId = prev.reduce((max, e) => Math.max(max, e.id), 0) + 1;

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
          id: existing?.id ?? nextId++,
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
        };

        if (existing) {
          const idx = next.findIndex((x) => x.id === existing.id);
          if (idx >= 0) next[idx] = event;
        } else {
          next.push(event);
        }
      }

      next.sort((a, b) => a.date.localeCompare(b.date));
      return next;
    });
  };

  const assignIC = (eventId, ic) => {
    setEvents((prev) => prev.map((e) => (e.id === eventId ? { ...e, ic } : e)));
  };

  const openAddModal = (dateISO) => {
    if (dateISO) setSeedDateISO(dateISO);
    setModalTitle("Add Event Day");
    setModalInitialDays(null);
    setModalOpen(true);
  };

  const openEditModal = (event) => {
    const dates = weekWedToSat(event.date);
    const byDate = new Map(events.map((e) => [e.date, e]));
    const initialDays = dates.map((d) => {
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const existing = byDate.get(iso);
      if (!existing) {
        return {
          isoDate: iso,
          name: "",
          genre: "",
          confirmed: false,
          stage: stageOptions[0],
          slots: [],
        };
      }

      return {
        isoDate: existing.date,
        name: existing.name,
        genre: existing.genre,
        confirmed: existing.status === "Confirmed",
        stage: existing.stage,
        slots: (existing.slots ?? []).map((s) => ({
          dj: s.dj ?? "",
          role: s.role ?? "Warm-up",
          start: s.start ?? "22:30",
          end: s.end ?? "00:00",
          energy: s.energy ?? 3,
        })),
      };
    });

    setSeedDateISO(event.date);
    setModalTitle("Edit Event Week");
    setModalInitialDays(initialDays);
    setModalOpen(true);
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
    <div className="min-h-screen bg-[#080711] p-4 text-white md:p-8">
      <div className="mx-auto max-w-5xl overflow-hidden rounded-3xl border border-white/10 bg-[#0d0c17] shadow-2xl shadow-black/50">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-4 md:px-6">
          <div className="flex items-center gap-3">
            <div className="text-xl font-black tracking-tight">O<span className="text-purple-300">&</span>A</div>
            <Button
              onClick={() => setView("List")}
              className={`h-9 rounded-xl px-4 text-xs font-black ${
                view === "List" ? "bg-purple-400 text-black hover:bg-purple-300" : "bg-white/5 text-white/45 hover:bg-white/10 hover:text-white"
              }`}
            >
              <List className="mr-2 h-4 w-4" /> List
            </Button>
            <Button
              onClick={() => setView("Calendar")}
              className={`h-9 rounded-xl px-4 text-xs font-black ${
                view === "Calendar"
                  ? "bg-purple-400 text-black hover:bg-purple-300"
                  : "bg-white/5 text-white/45 hover:bg-white/10 hover:text-white"
              }`}
            >
              <CalendarDays className="mr-2 h-4 w-4" /> Calendar
            </Button>
          </div>
          <Button
            onClick={() => openAddModal()}
            className="h-9 rounded-xl bg-purple-400 px-4 text-xs font-black text-black hover:bg-purple-300"
          >
            <Plus className="mr-2 h-4 w-4" /> ADD DAY
          </Button>
        </header>

        <section className="grid grid-cols-2 gap-2 border-b border-white/10 px-4 py-4 sm:grid-cols-5 md:px-6">
          <Stat number={stats.total} label="Events" />
          <Stat number={stats.confirmed} label="Confirmed" tone="text-emerald-300" />
          <Stat number={stats.unconfirmed} label="Unconfirmed" tone="text-yellow-300" />
          <Stat number={stats.noLineup} label="No Lineup" tone="text-rose-300" />
          <Stat number={stats.urgent} label="Urgent" tone="text-purple-300" />
        </section>

        <section className="sticky top-0 z-10 flex flex-wrap items-center gap-2 border-b border-white/10 bg-[#0d0c17]/95 px-4 py-3 backdrop-blur md:px-6">
          {filterItems.map((item) => {
            const Icon = item.icon;
            const active = activeFilter === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setActiveFilter(item.key)}
                className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-black transition ${
                  active ? "border-purple-300 bg-purple-400 text-black" : "border-white/10 bg-white/5 text-white/45 hover:text-white"
                }`}
              >
                {Icon && <Icon className="h-3.5 w-3.5" />} {item.label}
              </button>
            );
          })}

          <div className="ml-auto flex min-w-[220px] items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white/40">
            <Search className="h-4 w-4" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-white/30"
            />
          </div>
        </section>

        <main className="space-y-3 px-4 py-4 md:px-6">
          {view === "List" ? (
            <>
              <div className="mb-3 flex items-center gap-2 rounded-2xl border border-purple-400/20 bg-purple-400/10 p-3 text-xs font-bold text-purple-100">
                <Sparkles className="h-4 w-4" /> Music Director Mode: attention filter shows missing lineups, TBD slots, and risky nights first.
              </div>

              {filteredEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  expanded={expandedId === event.id}
                  onToggle={() => setExpandedId(expandedId === event.id ? null : event.id)}
                  onEdit={() => openEditModal(event)}
                  onAssignIC={(ic) => assignIC(event.id, ic)}
                />
              ))}
            </>
          ) : (
            <CalendarView
              cursorMonth={calendarCursor}
              onChangeMonth={changeCalendarMonth}
              eventsByDate={calendarEventsByDate}
              onSelectDate={(iso) => openAddModal(iso)}
              onEditEvent={openEditModal}
              onAssignIC={assignIC}
            />
          )}
        </main>
      </div>

      <AddEventDayModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setModalInitialDays(null);
        }}
        seedDateISO={seedDateISO}
        onChangeSeedDate={setSeedDateISO}
        onSave={saveModalDays}
        djOptions={djOptions}
        title={modalTitle}
        initialDays={modalInitialDays}
      />
    </div>
  );
}

function Stat({ number, label, tone = "text-white" }) {
  return (
    <div className="rounded-2xl bg-white/[0.02] p-3 text-center">
      <div className={`text-2xl font-black ${tone}`}>{number}</div>
      <div className="mt-1 text-[10px] font-black uppercase tracking-[0.2em] text-white/25">{label}</div>
    </div>
  );
}
