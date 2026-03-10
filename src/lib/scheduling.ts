import { supabase } from "./supabase";

export interface TimeSlot {
  time: string; // "HH:MM" format
  isAvailable: boolean;
  reason?: string; // "booked" | "past"
}

/**
 * Generates an array of time strings from start to end with given duration steps.
 * @param startTime "HH:MM"
 * @param endTime "HH:MM" (exclusive for the last slot start)
 * @param durationMinutes number of minutes per slot
 */
export function generateSlots(
  startTime: string,
  endTime: string,
  durationMinutes: number
): string[] {
  const slots: string[] = [];
  const [startH, startM] = startTime.split(":").map(Number);
  const [endH, endM] = endTime.split(":").map(Number);

  let currentMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  // We generate slots until adding one more duration would exceed end time
  while (currentMinutes + durationMinutes <= endMinutes) {
    const h = Math.floor(currentMinutes / 60);
    const m = currentMinutes % 60;
    slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    currentMinutes += durationMinutes;
  }

  return slots;
}

/**
 * Fetches the doctor's schedule for a given date, generates all slots,
 * and marks which are available vs. booked.
 */
export async function getAvailableSlots(
  doctorId: string,
  date: string // "YYYY-MM-DD"
): Promise<{ slots: TimeSlot[]; slotDuration: number; error: string | null }> {
  const dayOfWeek = new Date(`${date}T12:00:00`).getDay(); // 0=Sunday

  // 1. Get doctor's schedule for that day of week
  const { data: schedule, error: schedErr } = await supabase
    .from("doctor_schedules" as any)
    .select("*")
    .eq("doctor_id", doctorId)
    .eq("day_of_week", dayOfWeek)
    .eq("is_active", true)
    .maybeSingle();

  if (schedErr) {
    return { slots: [], slotDuration: 30, error: schedErr.message };
  }

  if (!schedule) {
    return {
      slots: [],
      slotDuration: 30,
      error: "El médico no tiene horario configurado para este día.",
    };
  }

  const { start_time, end_time, slot_duration } = schedule as any;

  // 2. Generate all theoretical slots
  const allTimes = generateSlots(start_time, end_time, slot_duration);

  // 3. Fetch existing appointments for that date
  const dayStart = `${date}T00:00:00`;
  const dayEnd = `${date}T23:59:59`;

  const { data: appointments } = await supabase
    .from("appointments")
    .select("start_time, end_time, status")
    .eq("doctor_id", doctorId)
    .gte("start_time", dayStart)
    .lte("start_time", dayEnd)
    .in("status", ["pending", "confirmed"]);

  const bookedRanges = (appointments || []).map((a: any) => ({
    start: new Date(a.start_time).getHours() * 60 + new Date(a.start_time).getMinutes(),
    end: new Date(a.end_time).getHours() * 60 + new Date(a.end_time).getMinutes(),
  }));

  const now = new Date();
  const selectedDate = new Date(`${date}T00:00:00`);
  const isToday = now.toDateString() === selectedDate.toDateString();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // 4. Mark availability
  const slots: TimeSlot[] = allTimes.map((time) => {
    const [h, m] = time.split(":").map(Number);
    const slotStartMin = h * 60 + m;
    const slotEndMin = slotStartMin + slot_duration;

    // Check if in the past
    if (isToday && slotStartMin <= currentMinutes) {
      return { time, isAvailable: false, reason: "past" };
    }

    // Check if overlaps with any booked appointment
    const isBooked = bookedRanges.some((b) => slotStartMin < b.end && slotEndMin > b.start);

    return {
      time,
      isAvailable: !isBooked,
      reason: isBooked ? "booked" : undefined,
    };
  });

  return { slots, slotDuration: slot_duration, error: null };
}
