import { HabitFormModal } from "@/src/features/habits/HabitFormModal";
import {
  cancelHabitReminder,
  syncHabitReminder,
} from "@/src/features/habits/habitReminders";
import { getHabitStats } from "@/src/features/habits/habitStats";
import {
  addDays,
  dayToDate,
  deleteHabit,
  getHabitById,
  getHabitLogs,
  getHabitRevisions,
  getLocalDay,
  getRuleForDay,
  Habit,
  HabitDraft,
  HabitLog,
  HabitRevision,
  isScheduledOnDay,
  setHabitArchived,
  setHabitProgress,
  updateHabit,
} from "@/src/features/habits/habitsRepository";
import { useCurrentDay } from "@/src/features/habits/useCurrentDay";
import { colors, typography } from "@/src/theme";
import * as Haptics from "expo-haptics";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import {
  Archive,
  ArrowLeft,
  Bell,
  Check,
  ChevronLeft,
  ChevronRight,
  Pencil,
  RotateCcw,
  Trash2,
} from "lucide-react-native";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function HabitDetailScreen() {
  const { habitId } = useLocalSearchParams<{ habitId: string }>();
  const id = Number(habitId);
  const [habit, setHabit] = useState<Habit | null>(null);
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [revisions, setRevisions] = useState<HabitRevision[]>([]);
  const [selectedDay, setSelectedDay] = useState(getLocalDay());
  const [calendarEnd, setCalendarEnd] = useState(getLocalDay());
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const today = useCurrentDay();
  const previousToday = useRef(today);
  useEffect(() => {
    if (previousToday.current !== today) {
      const oldToday = previousToday.current;
      setSelectedDay((selected) => selected === oldToday ? today : selected);
      setCalendarEnd((end) => end === oldToday ? today : end);
      previousToday.current = today;
    }
  }, [today]);
  const load = useCallback(async () => {
    if (!Number.isInteger(id) || id <= 0) {
      setLoading(false);
      return;
    }
    try {
      const [nextHabit, nextLogs, nextRevisions] = await Promise.all([
        getHabitById(id),
        getHabitLogs(id),
        getHabitRevisions(id),
      ]);
      setHabit(nextHabit ?? null);
      setLogs(nextLogs);
      setRevisions(nextRevisions);
    } catch {
      Alert.alert("Could not load habit", "Please try again.");
    } finally {
      setLoading(false);
    }
  }, [id]);
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  if (loading)
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Loading habit…</Text>
      </View>
    );
  if (!habit)
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Habit not found</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.link}>Go back</Text>
        </Pressable>
      </View>
    );

  const habitData = habit;
  let reminderActive = false;
  try {
    const ids: unknown = JSON.parse(habitData.notification_ids || "[]");
    reminderActive = Array.isArray(ids) && ids.length > 0;
  } catch {
    reminderActive = false;
  }
  const stats = getHabitStats(habitData, logs, revisions, today);
  const byDay = new Map(logs.map((log) => [log.day, log]));
  const log = byDay.get(selectedDay);
  const count = log?.count || 0;
  const skipped = log?.skipped === 1;
  const selectedRule = getRuleForDay(habitData, revisions, selectedDay);
  const scheduled = isScheduledOnDay(habitData, revisions, selectedDay);
  const days = Array.from({ length: 35 }, (_, index) =>
    addDays(calendarEnd, index - 34),
  );
  const dayLabel = dayToDate(selectedDay).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
  const weekNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const schedule =
    habitData.weekdays === 127
      ? "Every day"
      : weekNames
          .filter((_, day) => !!(habitData.weekdays & (1 << day)))
          .join(", ");

  async function setProgress(nextCount: number, nextSkipped = false) {
    if (busy || !scheduled || habitData.archived || selectedDay > today) return;
    setBusy(true);
    try {
      await setHabitProgress(
        id,
        selectedDay,
        nextCount,
        nextSkipped,
      );
      await load();
      void Haptics.selectionAsync().catch(() => {});
    } catch {
      Alert.alert("Could not update progress", "Please try again.");
    } finally {
      setBusy(false);
    }
  }
  async function save(draft: HabitDraft) {
    await updateHabit(id, draft);
    const fresh = await getHabitById(id);
    if (fresh) {
      // Keep the previous IDs long enough to cancel the old schedule.
      const warning = await syncHabitReminder({
        ...fresh,
        notification_ids: habitData.notification_ids,
      }).catch(() => "Reminder could not be scheduled.");
      if (warning) Alert.alert("Habit saved", warning);
    }
    setEditing(false);
    await load();
  }
  function archive() {
    Alert.alert(
      habitData.archived ? "Restore habit?" : "Archive habit?",
      habitData.archived
        ? "This habit will return to your routine."
        : "Your history will stay safe. You can restore it later.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: habitData.archived ? "Restore" : "Archive",
          onPress: async () => {
            try {
              await setHabitArchived(id, !habitData.archived);
              const fresh = await getHabitById(id);
              if (fresh) {
                const warning = await syncHabitReminder(fresh).catch(() => "Reminder could not be updated.");
                if (warning) Alert.alert("Habit updated", warning);
              }
              await load();
            } catch {
              Alert.alert("Could not change habit", "Please try again.");
            }
          },
        },
      ],
    );
  }
  function remove() {
    Alert.alert(
      "Delete habit permanently?",
      "All of its history will be removed. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await cancelHabitReminder(habitData);
              await deleteHabit(id);
              router.back();
            } catch {
              Alert.alert("Could not delete habit", "Please try again.");
            }
          },
        },
      ],
    );
  }

  return (
    <>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable
            style={styles.iconButton}
            onPress={() => router.back()}
            accessibilityLabel="Go back"
          >
            <ArrowLeft size={21} color={colors.foreground} />
          </Pressable>
          <Text style={styles.headerTitle}>Habit details</Text>
          <Pressable
            style={styles.iconButton}
            onPress={() => setEditing(true)}
            accessibilityLabel="Edit habit"
          >
            <Pencil size={19} color={colors.foreground} />
          </Pressable>
        </View>
        <View style={[styles.hero, { backgroundColor: habitData.color }]}>
          <Text style={styles.eyebrow}>
            {habitData.archived ? "PAUSED HABIT" : "YOUR HABIT"}
          </Text>
          <Text style={styles.title}>{habitData.title}</Text>
          {!!habitData.cue && <Text style={styles.cue}>{habitData.cue}</Text>}
          <View style={styles.heroDivider} />
          <Text style={styles.heroMeta}>
            {schedule} · {habitData.target_count} {habitData.unit}
          </Text>
          {!!habitData.reminder_time && (
            <View style={styles.reminder}>
              <Bell size={14} color={colors.foreground} />
              <Text style={styles.heroMeta}>
                {reminderActive ? "Reminder" : "Reminder pending"} at {habitData.reminder_time}
              </Text>
            </View>
          )}
        </View>
        <Text style={styles.sectionTitle}>Your progress</Text>
        <View style={styles.statsGrid}>
          <Stat value={stats.currentStreak} label="Current streak" />
          <Stat value={stats.bestStreak} label="Best streak" />
          <Stat value={`${stats.consistency}%`} label="Last 30 days" />
          <Stat value={stats.completedDays} label="Days completed" />
        </View>
        <Text style={styles.helper}>
          Streaks count scheduled days. A skipped day is neutral; an unfinished
          today leaves the previous streak intact.
        </Text>
        <View style={styles.historyHeader}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Older habit history"
            disabled={days[0] <= habitData.start_day}
            onPress={() => {
              const end = addDays(calendarEnd, -35);
              setCalendarEnd(end);
              setSelectedDay(end);
            }}
            style={styles.historyArrow}
          ><ChevronLeft size={20} color={colors.foreground} /></Pressable>
          <Text style={styles.historyTitle}>
            {dayToDate(days[0]).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })} – {dayToDate(calendarEnd).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Newer habit history"
            disabled={calendarEnd >= today}
            onPress={() => {
              const end = addDays(calendarEnd, 35) > today ? today : addDays(calendarEnd, 35);
              setCalendarEnd(end);
              setSelectedDay(end);
            }}
            style={styles.historyArrow}
          ><ChevronRight size={20} color={colors.foreground} /></Pressable>
        </View>
        <View style={styles.calendar}>
          {days.map((day) => {
            const entry = byDay.get(day);
            const due = isScheduledOnDay(habitData, revisions, day);
            const dayRule = getRuleForDay(habitData, revisions, day);
            const done =
              due &&
              !entry?.skipped &&
              (entry?.count || 0) >= dayRule.target_count;
            const partial = due && !done && !!entry?.count;
            const skip = entry?.skipped === 1;
            return (
              <Pressable
                key={day}
                disabled={!due}
                onPress={() => setSelectedDay(day)}
                accessibilityLabel={`${day}, ${done ? "complete" : skip ? "skipped" : partial ? "in progress" : due ? "not complete" : "rest day"}`}
                accessibilityState={{ selected: day === selectedDay }}
                style={[
                  styles.cell,
                  !due && styles.restCell,
                  done && { backgroundColor: habitData.color },
                  partial && styles.partialCell,
                  skip && styles.skipCell,
                  day === selectedDay && styles.selectedCell,
                ]}
              >
                <Text style={styles.cellText}>{dayToDate(day).getDate()}</Text>
                {done && (
                  <Check size={11} color={colors.foreground} strokeWidth={3} />
                )}
              </Pressable>
            );
          })}
        </View>
        <View style={styles.legend}>
          <Text style={styles.helper}>□ Scheduled</Text>
          <Text style={styles.helper}>● Done</Text>
          <Text style={styles.helper}>◌ Rest day</Text>
        </View>
        <View style={styles.dayPanel}>
          <Text style={styles.dayTitle}>{dayLabel}</Text>
          {!scheduled ? (
            <Text style={styles.muted}>
              {selectedRule.archived ? "This habit was paused on this day." : "Rest day — this habit is not scheduled."}
            </Text>
          ) : habitData.archived ? (
            <Text style={styles.muted}>
              Restore this habit to track it again.
            </Text>
          ) : (
            <>
              <Text style={styles.muted}>
                {skipped
                  ? "Skipped without breaking your streak"
                  : `${count} of ${selectedRule.target_count} ${selectedRule.unit}`}
              </Text>
              <View style={styles.controls}>
                <Pressable
                  disabled={busy || (count === 0 && !skipped)}
                  onPress={() => void setProgress(Math.max(0, count - 1))}
                  style={styles.control}
                  accessibilityLabel="Remove one"
                >
                  <Text style={styles.controlText}>−</Text>
                </Pressable>
                <Pressable
                  disabled={
                    busy || (!skipped && count >= selectedRule.target_count)
                  }
                  onPress={() =>
                    void setProgress(
                      Math.min(
                        selectedRule.target_count,
                        (skipped ? 0 : count) + 1,
                      ),
                    )
                  }
                  style={[styles.control, styles.primaryControl]}
                  accessibilityLabel="Add one"
                >
                  <Text style={styles.controlText}>+ Add progress</Text>
                </Pressable>
                <Pressable
                  disabled={busy}
                  onPress={() => void setProgress(0, !skipped)}
                  style={styles.control}
                  accessibilityLabel={skipped ? "Undo skip" : "Skip day"}
                >
                  <Text style={styles.skipText}>
                    {skipped ? "Undo skip" : "Skip"}
                  </Text>
                </Pressable>
              </View>
              {selectedRule.target_count > 1 &&
                (skipped || count < selectedRule.target_count) && (
                  <Pressable
                    disabled={busy}
                    onPress={() => void setProgress(selectedRule.target_count)}
                    style={[styles.control, styles.primaryControl]}
                    accessibilityLabel="Complete daily goal"
                  >
                    <Text style={styles.controlText}>Complete daily goal</Text>
                  </Pressable>
                )}
            </>
          )}
        </View>
        <View style={styles.footer}>
          <Pressable onPress={archive} style={styles.footerButton}>
            {habitData.archived ? (
              <RotateCcw size={19} color={colors.foreground} />
            ) : (
              <Archive size={19} color={colors.foreground} />
            )}
            <Text style={styles.footerText}>
              {habitData.archived ? "Restore habit" : "Archive habit"}
            </Text>
          </Pressable>
          <Pressable onPress={remove} style={styles.footerButton}>
            <Trash2 size={19} color={colors.destructive} />
            <Text style={[styles.footerText, { color: colors.destructive }]}>
              Delete habit
            </Text>
          </Pressable>
        </View>
      </ScrollView>
      {editing && (
        <HabitFormModal
          habit={habitData}
          onClose={() => setEditing(false)}
          onSave={save}
        />
      )}
    </>
  );
}

function Stat({ value, label }: { value: string | number; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 60, gap: 14 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
    gap: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  iconButton: {
    width: 44,
    height: 44,
    borderWidth: 2,
    borderColor: colors.foreground,
    borderRadius: 12,
    backgroundColor: colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { ...typography.h3, color: colors.foreground },
  hero: {
    borderWidth: 2,
    borderColor: colors.foreground,
    borderRadius: 20,
    padding: 22,
    gap: 8,
  },
  eyebrow: { ...typography.label, fontWeight: "700", color: colors.foreground },
  title: { fontSize: 28, fontWeight: "800", color: colors.foreground },
  cue: { ...typography.body, color: colors.foreground },
  heroDivider: {
    height: 2,
    backgroundColor: colors.foreground,
    opacity: 0.3,
    marginVertical: 4,
  },
  heroMeta: {
    ...typography.muted,
    color: colors.foreground,
    fontWeight: "700",
  },
  reminder: { flexDirection: "row", alignItems: "center", gap: 6 },
  sectionTitle: { ...typography.h2, color: colors.foreground, marginTop: 8 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  stat: {
    width: "48%",
    flexGrow: 1,
    borderWidth: 2,
    borderColor: colors.foreground,
    borderRadius: 15,
    backgroundColor: colors.white,
    padding: 14,
  },
  statValue: { fontSize: 26, fontWeight: "800", color: colors.foreground },
  statLabel: { ...typography.muted, color: colors.muted },
  helper: { ...typography.muted, color: colors.muted },
  historyHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  historyTitle: { ...typography.h3, color: colors.foreground, flexShrink: 1, textAlign: "center" },
  historyArrow: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  calendar: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.foreground,
    borderRadius: 16,
    padding: 12,
  },
  cell: {
    width: "12.4%",
    aspectRatio: 1,
    borderWidth: 1.5,
    borderColor: colors.foreground,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
  },
  restCell: { borderColor: "#D5D0CB", backgroundColor: "#F4F1ED" },
  partialCell: { backgroundColor: colors.yellow },
  skipCell: { backgroundColor: "#E8E2F6" },
  selectedCell: { borderWidth: 3 },
  cellText: { fontSize: 11, fontWeight: "700", color: colors.foreground },
  legend: { flexDirection: "row", justifyContent: "space-around" },
  dayPanel: {
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.foreground,
    borderRadius: 16,
    padding: 16,
    gap: 10,
  },
  dayTitle: { ...typography.h3, color: colors.foreground },
  muted: { ...typography.muted, color: colors.muted },
  controls: { flexDirection: "row", gap: 8 },
  control: {
    minHeight: 42,
    paddingHorizontal: 11,
    borderWidth: 2,
    borderColor: colors.foreground,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
  },
  primaryControl: { backgroundColor: colors.green, flex: 1 },
  controlText: { fontSize: 16, fontWeight: "800", color: colors.foreground },
  skipText: { fontSize: 12, fontWeight: "700", color: colors.foreground },
  footer: { marginTop: 16, gap: 10 },
  footerButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    padding: 12,
  },
  footerText: {
    ...typography.body,
    color: colors.foreground,
    fontWeight: "700",
  },
  link: {
    ...typography.body,
    color: colors.foreground,
    textDecorationLine: "underline",
  },
});
