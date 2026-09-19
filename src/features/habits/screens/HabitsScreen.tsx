import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { ArrowLeft, Check, ChevronLeft, ChevronRight, Download, Plus, Upload } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { HabitFormModal } from "@/src/features/habits/HabitFormModal";
import { cancelHabitNotifications, syncHabitReminder } from "@/src/features/habits/habitReminders";
import { createHabitBackup, pickHabitBackup, restoreHabitBackup, shareHabitBackup, type HabitBackup } from "@/src/features/habits/habitBackup";
import { useCurrentDay } from "@/src/features/habits/useCurrentDay";
import { addDays, createHabit, dayToDate, getHabitById, getHabitsForDay, getLocalDay, HabitDraft, HabitWithStatus, isScheduled, setHabitProgress } from "@/src/features/habits/habitsRepository";
import { colors, typography } from "@/src/theme";

export default function HabitsScreen() {
  const [day, setDay] = useState(getLocalDay());
  const [habits, setHabits] = useState<HabitWithStatus[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [transferBusy, setTransferBusy] = useState(false);
  const today = useCurrentDay();
  const previousToday = useRef(today);

  useEffect(() => {
    if (previousToday.current !== today) {
      const oldToday = previousToday.current;
      setDay((selected) => selected === oldToday ? today : selected);
      previousToday.current = today;
    }
  }, [today]);

  const load = useCallback(async () => {
    try {
      setHabits(await getHabitsForDay(day, showArchived));
    } catch {
      Alert.alert("Could not load habits", "Please try again.");
    } finally {
      setLoading(false);
    }
  }, [day, showArchived]);
  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const shown = habits.filter((habit) => showArchived ? !!habit.archived : !habit.day_rule.archived && isScheduled({ start_day: habit.start_day, weekdays: habit.day_rule.weekdays }, day));
  const done = shown.filter((habit) => habit.count >= habit.day_rule.target_count && !habit.skipped);
  const pending = shown.filter((habit) => habit.count < habit.day_rule.target_count && !habit.skipped);
  const skipped = shown.filter((habit) => !!habit.skipped);
  const dueCount = done.length + pending.length;
  const progress = dueCount ? Math.round(done.length / dueCount * 100) : 0;
  const dates = Array.from({ length: 7 }, (_, index) => addDays(day, index - 3));

  async function change(habit: HabitWithStatus, delta: number) {
    if (busyId !== null || day > today || habit.archived) return;
    setBusyId(habit.id);
    try {
      const next = Math.max(0, Math.min(habit.day_rule.target_count, (habit.skipped ? 0 : habit.count) + delta));
      await setHabitProgress(habit.id, day, next);
      await load();
      void Haptics.selectionAsync().catch(() => {});
    } catch {
      Alert.alert("Could not update habit", "Please try again.");
    } finally {
      setBusyId(null);
    }
  }
  async function save(draft: HabitDraft) {
    const id = await createHabit(draft);
    const created = await getHabitById(id);
    if (created) {
      const warning = await syncHabitReminder(created).catch(() => "Reminder could not be scheduled.");
      if (warning) Alert.alert("Habit saved", warning);
    }
    setShowForm(false);
    setShowArchived(false);
    setDay(getLocalDay());
    if (day === today) await load();
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  }
  function open(habit: HabitWithStatus) {
    router.push({ pathname: "/(app)/service/habits/[habitId]", params: { habitId: String(habit.id) } });
  }

  async function exportData() {
    if (transferBusy) return;
    setTransferBusy(true);
    try {
      await shareHabitBackup();
    } catch (error) {
      Alert.alert("Could not export habits", error instanceof Error ? error.message : "Please try again.");
    } finally {
      setTransferBusy(false);
    }
  }

  async function applyBackup(backup: HabitBackup) {
    setTransferBusy(true);
    let oldHabits: HabitBackup["habits"] = [];
    let replaced = false;
    try {
      oldHabits = (await createHabitBackup()).habits;
      for (const habit of oldHabits) await cancelHabitNotifications(habit);
      await restoreHabitBackup(backup);
      replaced = true;
      let reminderWarnings = 0;
      for (const habit of backup.habits) {
        try {
          if (await syncHabitReminder({ ...habit, notification_ids: null })) reminderWarnings++;
        } catch {
          reminderWarnings++;
        }
      }
      setShowArchived(false);
      setDay(today);
      setHabits(await getHabitsForDay(today, false));
      Alert.alert("Habits restored", reminderWarnings ? `${backup.habits.length} habits restored. ${reminderWarnings} reminders need attention.` : `${backup.habits.length} habits restored.`);
    } catch (error) {
      if (!replaced) await Promise.allSettled(oldHabits.map(syncHabitReminder));
      Alert.alert("Could not restore habits", error instanceof Error ? error.message : "Your current data was kept.");
    } finally {
      setTransferBusy(false);
    }
  }

  async function importData() {
    if (transferBusy) return;
    setTransferBusy(true);
    try {
      const backup = await pickHabitBackup();
      if (!backup) return;
      Alert.alert(
        "Replace habit data?",
        `This file contains ${backup.habits.length} habits and ${backup.logs.length} daily records. Your current habit data will be replaced.`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Restore", style: "destructive", onPress: () => void applyBackup(backup) },
        ],
      );
    } catch (error) {
      Alert.alert("Could not read backup", error instanceof Error ? error.message : "Please choose a valid backup file.");
    } finally {
      setTransferBusy(false);
    }
  }

  return (
    <>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable style={styles.iconButton} onPress={() => router.back()} accessibilityLabel="Go back"><ArrowLeft size={21} color={colors.foreground} /></Pressable>
          <View style={{ flex: 1 }}><Text style={styles.eyebrow}>ONE DAY AT A TIME</Text><Text style={styles.title}>Habits</Text></View>
          <Pressable style={[styles.iconButton, { backgroundColor: colors.yellow }]} onPress={() => setShowForm(true)} accessibilityLabel="Create habit"><Plus size={22} color={colors.foreground} /></Pressable>
        </View>
        <View style={styles.hero}>
          <Text style={styles.heroEyebrow}>{day === today ? "TODAY'S ROUTINE" : dayToDate(day).toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" }).toUpperCase()}</Text>
          <View style={styles.heroLine}><Text style={styles.heroNumber}>{showArchived ? shown.length : `${done.length}/${dueCount}`}</Text><Text style={styles.heroCaption}>{showArchived ? "archived habits" : "habits complete"}</Text></View>
          {!showArchived && <><View style={styles.track}><View style={[styles.fill, { width: `${progress}%` }]} /></View><Text style={styles.heroFoot}>{shown.length === 0 ? "Add a habit to build your routine." : dueCount === 0 ? "A lighter day. Skips do not count against you." : progress === 100 ? "You showed up for every habit today ✨" : "Every small action counts."}</Text></>}
        </View>
        <View style={styles.dateNav}>
          <Pressable onPress={() => setDay(addDays(day, -7))} style={styles.navArrow} accessibilityLabel="Previous week"><ChevronLeft size={20} color={colors.foreground} /></Pressable>
          <Text style={styles.dateLabel}>{dayToDate(day).toLocaleDateString(undefined, { month: "long", year: "numeric" })}</Text>
          <Pressable onPress={() => setDay(addDays(day, 7) > today ? today : addDays(day, 7))} style={styles.navArrow} accessibilityLabel="Next week" disabled={day === today}><ChevronRight size={20} color={colors.foreground} /></Pressable>
        </View>
        <View style={styles.days}>{dates.map((item) => {
          const date = dayToDate(item);
          const future = item > today;
          return <Pressable key={item} disabled={future} onPress={() => setDay(item)} accessibilityLabel={date.toDateString()} accessibilityState={{ selected: item === day, disabled: future }} style={[styles.day, item === day && styles.daySelected, future && styles.dayFuture]}>
            <Text style={styles.dayName}>{date.toLocaleDateString(undefined, { weekday: "short" }).slice(0, 2)}</Text>
            <Text style={styles.dayNumber}>{date.getDate()}</Text>
            {item === today && <View style={styles.todayDot} />}
          </Pressable>;
        })}</View>
        {day !== today && <Pressable onPress={() => setDay(today)} style={styles.todayLink}><Text style={styles.linkText}>Jump to today</Text></Pressable>}
        <View style={styles.sectionHead}><Text style={styles.sectionTitle}>{showArchived ? "Archived" : "Your routine"}</Text><Pressable onPress={() => setShowArchived(!showArchived)} accessibilityRole="button"><Text style={styles.linkText}>{showArchived ? "Active habits" : "View archive"}</Text></Pressable></View>
        {loading ? <Text style={styles.hint}>Loading habits…</Text> : shown.length === 0 ? (
          <View style={styles.empty}><Text style={styles.emptyIcon}>✦</Text><Text style={styles.emptyTitle}>{showArchived ? "No archived habits" : habits.length ? "A free day" : "Start with one small habit"}</Text><Text style={styles.hint}>{showArchived ? "Habits you pause will appear here." : habits.length ? "Nothing is scheduled for this day. Rest is part of the routine." : "Pick something easy enough to repeat. You can build from there."}</Text>{!showArchived && <Pressable onPress={() => setShowForm(true)} style={styles.emptyAction}><Text style={styles.actionText}>Create a habit</Text></Pressable>}</View>
        ) : <>
          {!showArchived && pending.length > 0 && <Text style={styles.groupLabel}>UP NEXT · {pending.length}</Text>}
          {(showArchived ? shown : pending).map((habit) => <HabitCard key={habit.id} habit={habit} disabled={busyId !== null || showArchived || !!habit.archived} onOpen={() => open(habit)} onAdd={() => change(habit, 1)} onSubtract={() => change(habit, -1)} onComplete={() => change(habit, habit.day_rule.target_count)} />)}
          {!showArchived && done.length > 0 && <Text style={styles.groupLabel}>DONE · {done.length}</Text>}
          {!showArchived && done.map((habit) => <HabitCard key={habit.id} habit={habit} disabled={busyId !== null || !!habit.archived} onOpen={() => open(habit)} onAdd={() => change(habit, 1)} onSubtract={() => change(habit, -1)} onComplete={() => change(habit, habit.day_rule.target_count)} />)}
          {!showArchived && skipped.length > 0 && <Text style={styles.groupLabel}>SKIPPED · {skipped.length}</Text>}
          {!showArchived && skipped.map((habit) => <HabitCard key={habit.id} habit={habit} disabled={busyId !== null || !!habit.archived} onOpen={() => open(habit)} onAdd={() => change(habit, 1)} onSubtract={() => change(habit, -1)} onComplete={() => change(habit, habit.day_rule.target_count)} />)}
        </>}
        <View style={styles.backupActions}>
          <Pressable accessibilityRole="button" disabled={transferBusy} onPress={() => void exportData()} style={styles.backupButton}>
            <Download size={18} color={colors.foreground} /><Text style={styles.backupLabel}>Export habits</Text>
          </Pressable>
          <Pressable accessibilityRole="button" disabled={transferBusy} onPress={() => void importData()} style={styles.backupButton}>
            <Upload size={18} color={colors.foreground} /><Text style={styles.backupLabel}>Restore backup</Text>
          </Pressable>
        </View>
        {transferBusy && <ActivityIndicator accessibilityLabel="Working with habit backup" color={colors.foreground} />}
      </ScrollView>
      {showForm && <HabitFormModal onClose={() => setShowForm(false)} onSave={save} />}
    </>
  );
}

function HabitCard({ habit, disabled, onOpen, onAdd, onSubtract, onComplete }: { habit: HabitWithStatus; disabled: boolean; onOpen: () => void; onAdd: () => void; onSubtract: () => void; onComplete: () => void }) {
  const target = habit.day_rule.target_count;
  const complete = habit.count >= target && !habit.skipped;
  return <View style={styles.card}>
    <Pressable onPress={onOpen} style={styles.cardMain} accessibilityLabel={`Open ${habit.title}`}>
      <View style={[styles.colorMark, { backgroundColor: habit.color }]} />
      <View style={{ flex: 1 }}><Text style={styles.cardTitle} numberOfLines={1}>{habit.title}</Text><Text style={styles.cardSub} numberOfLines={1}>{habit.skipped ? "Skipped" : habit.cue || `${habit.count} of ${target} ${habit.day_rule.unit}`}</Text></View>
      <ChevronRight size={19} color={colors.foreground} />
    </Pressable>
    {!habit.archived && <View style={styles.cardActions}>
      <Text style={styles.countLabel}>{habit.skipped ? "—" : `${habit.count} / ${target} ${habit.day_rule.unit}`}</Text>
      <View style={styles.actionRow}>
        {target > 1 && !complete && <Pressable disabled={disabled} onPress={onComplete} style={[styles.smallButton, styles.finishButton]} accessibilityLabel={`Complete ${habit.title} goal`}><Text style={styles.finishText}>Done</Text></Pressable>}
        {habit.count > 0 && !habit.skipped && <Pressable disabled={disabled} onPress={onSubtract} style={styles.smallButton} accessibilityLabel={`Undo ${habit.title}`}><Text style={styles.smallButtonText}>−</Text></Pressable>}
        <Pressable disabled={disabled || complete} onPress={onAdd} style={[styles.smallButton, styles.addButton, complete && styles.completeButton]} accessibilityLabel={complete ? `${habit.title} complete` : `Log ${habit.title}`}><Text style={styles.smallButtonText}>{complete ? <Check size={18} color={colors.foreground} /> : "+"}</Text></Pressable>
      </View>
    </View>}
  </View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 56, gap: 12 },
  backupActions: { flexDirection: "row", gap: 10, marginTop: 18 },
  backupButton: { flex: 1, minHeight: 48, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, paddingHorizontal: 8, borderWidth: 2, borderColor: colors.foreground, borderRadius: 8, backgroundColor: colors.white },
  backupLabel: { ...typography.muted, color: colors.foreground, fontWeight: "700", flexShrink: 1 },
  header: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 10 },
  iconButton: { width: 44, height: 44, borderRadius: 13, borderWidth: 2, borderColor: colors.foreground, backgroundColor: colors.white, alignItems: "center", justifyContent: "center" },
  eyebrow: { ...typography.label, color: colors.muted },
  title: { ...typography.h1, color: colors.foreground },
  hero: { backgroundColor: colors.purple, borderRadius: 20, borderWidth: 2, borderColor: colors.foreground, padding: 20, gap: 8 },
  heroEyebrow: { ...typography.label, color: colors.foreground, fontWeight: "700" },
  heroLine: { flexDirection: "row", alignItems: "baseline", gap: 10 },
  heroNumber: { fontSize: 44, fontWeight: "800", color: colors.foreground },
  heroCaption: { ...typography.body, color: colors.foreground },
  track: { height: 12, borderRadius: 6, borderWidth: 2, borderColor: colors.foreground, backgroundColor: colors.white, overflow: "hidden" },
  fill: { height: "100%", backgroundColor: colors.green },
  heroFoot: { ...typography.muted, color: colors.foreground },
  dateNav: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 12 },
  navArrow: { width: 35, height: 35, alignItems: "center", justifyContent: "center" },
  dateLabel: { ...typography.h3, color: colors.foreground },
  days: { flexDirection: "row", gap: 5 },
  day: { flex: 1, height: 66, borderRadius: 12, borderWidth: 2, borderColor: colors.foreground, backgroundColor: colors.white, alignItems: "center", justifyContent: "center" },
  daySelected: { backgroundColor: colors.yellow },
  dayFuture: { opacity: 0.35 },
  dayName: { fontSize: 11, fontWeight: "600", color: colors.foreground },
  dayNumber: { fontSize: 17, fontWeight: "800", color: colors.foreground },
  todayDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: colors.foreground, position: "absolute", bottom: 4 },
  todayLink: { alignSelf: "center" },
  linkText: { ...typography.muted, color: colors.foreground, textDecorationLine: "underline", fontWeight: "700" },
  sectionHead: { marginTop: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sectionTitle: { ...typography.h2, color: colors.foreground },
  groupLabel: { ...typography.label, color: colors.muted, marginTop: 12, fontWeight: "700" },
  card: { borderWidth: 2, borderColor: colors.foreground, borderRadius: 16, backgroundColor: colors.white, overflow: "hidden" },
  cardMain: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  colorMark: { width: 36, height: 36, borderRadius: 11, borderWidth: 2, borderColor: colors.foreground },
  cardTitle: { ...typography.h4, color: colors.foreground },
  cardSub: { ...typography.muted, color: colors.muted },
  cardActions: { paddingHorizontal: 14, paddingBottom: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  countLabel: { ...typography.muted, color: colors.foreground, flexShrink: 1 },
  actionRow: { flexDirection: "row", gap: 8 },
  smallButton: { width: 34, height: 34, borderRadius: 10, borderWidth: 2, borderColor: colors.foreground, alignItems: "center", justifyContent: "center", backgroundColor: colors.white },
  addButton: { backgroundColor: colors.yellow },
  finishButton: { width: "auto", paddingHorizontal: 10, backgroundColor: colors.green },
  finishText: { fontSize: 12, fontWeight: "800", color: colors.foreground },
  completeButton: { backgroundColor: colors.green },
  smallButtonText: { fontSize: 22, fontWeight: "700", color: colors.foreground, lineHeight: 25 },
  empty: { alignItems: "center", backgroundColor: colors.white, borderWidth: 2, borderColor: colors.foreground, borderRadius: 18, padding: 28, gap: 9 },
  emptyIcon: { fontSize: 34, color: colors.purple },
  emptyTitle: { ...typography.h3, color: colors.foreground, textAlign: "center" },
  hint: { ...typography.muted, color: colors.muted, textAlign: "center" },
  emptyAction: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, borderWidth: 2, borderColor: colors.foreground, backgroundColor: colors.green, marginTop: 8 },
  actionText: { ...typography.button, color: colors.foreground },
});
