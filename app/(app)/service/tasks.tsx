import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator, AppState, KeyboardAvoidingView, Modal, Platform,
  Pressable, RefreshControl, ScrollView, StyleSheet, Text, View,
} from "react-native";
import * as Haptics from "expo-haptics";
import { router, useFocusEffect } from "expo-router";
import {
  ArrowDownUp, ArrowLeft, CalendarClock, CalendarDays, Check, Flag,
  ListChecks, Plus, Repeat2, Search, Trash2, X,
} from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  filterAndSortTasks, getLocalDayKey, getTomorrowDayKey, isSameDay,
  isTaskOverdue, taskSortOptions, type TaskSortMode, type TaskView,
} from "@/src/features/tasks/taskListUtils";
import {
  addTask, deleteTask, getTasks, setTaskPlannedDay, toggleTask,
  type Task, type TaskPriority,
} from "@/src/features/tasks/tasksRepository";
import { colors, typography } from "@/src/theme";
import { Input } from "@/src/components/ui/Input";
import { IconButton } from "@/src/components/ui/IconButton";

const ui = {
  background: colors.background, ink: colors.foreground, muted: colors.muted,
  line: colors.foreground, accent: colors.green, accentSoft: colors.yellow,
  blue: colors.blue, warning: colors.destructive, warningSoft: colors.pink,
};
const views: { key: TaskView; label: string; color: string }[] = [
  { key: "today", label: "Today", color: colors.green },
  { key: "inbox", label: "Inbox", color: colors.yellow },
  { key: "upcoming", label: "Upcoming", color: colors.blue },
  { key: "important", label: "Important", color: colors.orange },
  { key: "all", label: "All", color: colors.white },
  { key: "completed", label: "Done", color: colors.purple },
];
const viewTitles: Record<TaskView, string> = {
  today: "Today", inbox: "Inbox", upcoming: "Upcoming", important: "Important",
  all: "All tasks", overdue: "Overdue", completed: "Completed",
};
const emptyMessages: Record<TaskView, string> = {
  today: "Nothing on your plate today.", inbox: "Your inbox is clear.",
  upcoming: "Nothing planned ahead.", important: "No high-priority tasks.",
  all: "No open tasks yet.", overdue: "Nothing overdue.",
  completed: "Completed tasks will appear here.",
};
const UNDO_DELETE_MS = 4_800;
const priorityOptions: { key: TaskPriority; label: string }[] = [
  { key: "normal", label: "Normal" }, { key: "low", label: "Low" },
  { key: "high", label: "High" }, { key: "urgent", label: "Urgent" },
];
type PendingDelete = { task: Task };

export default function TasksScreen() {
  const insets = useSafeAreaInsets();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [view, setView] = useState<TaskView>("today");
  const [sortMode, setSortMode] = useState<TaskSortMode>("default");
  const [sortOpen, setSortOpen] = useState(false);
  const [priorityOpen, setPriorityOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [draftTitle, setDraftTitle] = useState("");
  const [draftPlan, setDraftPlan] = useState<string | null>(getLocalDayKey);
  const [draftPriority, setDraftPriority] = useState<TaskPriority>("normal");
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);
  const [todayKey, setTodayKey] = useState(getLocalDayKey);
  const mountedRef = useRef(true);
  const pendingDeleteRef = useRef<PendingDelete | null>(null);
  const deleteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadTasks = useCallback(async (showLoading = true) => {
    if (showLoading && mountedRef.current) setLoading(true);
    try {
      const result = await getTasks();
      const pendingId = pendingDeleteRef.current?.task.id;
      if (mountedRef.current) {
        setTasks(pendingId ? result.filter((task) => task.id !== pendingId) : result);
        setError(null);
      }
    } catch (loadError) {
      console.warn("Unable to load tasks", loadError);
      if (mountedRef.current) setError("Tasks could not be loaded.");
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  const commitPendingDelete = useCallback(async () => {
    const pending = pendingDeleteRef.current;
    if (!pending) return;
    pendingDeleteRef.current = null;
    if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current);
    deleteTimerRef.current = null;
    if (mountedRef.current) setPendingDelete(null);
    try {
      await deleteTask(pending.task.id);
    } catch (deleteError) {
      console.warn("Unable to delete task", deleteError);
      if (mountedRef.current) {
        setTasks((current) => current.some((item) => item.id === pending.task.id)
          ? current : [...current, pending.task]);
        setError("The task could not be deleted.");
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current);
      const pending = pendingDeleteRef.current;
      pendingDeleteRef.current = null;
      if (pending) void deleteTask(pending.task.id).catch((deleteError) => {
        console.warn("Unable to finalize task deletion", deleteError);
      });
    };
  }, []);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const refreshDay = () => {
      const now = new Date();
      setTodayKey(getLocalDayKey(now));
      const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      clearTimeout(timer);
      timer = setTimeout(refreshDay, midnight.getTime() - now.getTime() + 1000);
    };
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") refreshDay();
    });
    refreshDay();
    return () => { clearTimeout(timer); subscription.remove(); };
  }, []);

  useFocusEffect(useCallback(() => { void loadTasks(false); }, [loadTasks]));

  async function handleAdd() {
    const title = draftTitle.trim();
    if (!title || adding) return;
    setAdding(true);
    setError(null);
    try {
      await addTask(title, { plannedDay: draftPlan, priority: draftPriority });
      setDraftTitle("");
      if (view === "completed") setView("inbox");
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      await loadTasks(false);
    } catch (addError) {
      console.warn("Unable to add task", addError);
      setError("The task could not be added.");
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      if (mountedRef.current) setAdding(false);
    }
  }

  async function handleToggle(task: Task) {
    const completed = !task.completed;
    setTasks((current) => current.map((item) => item.id === task.id
      ? { ...item, completed: completed ? 1 : 0 } : item));
    void Haptics.selectionAsync();
    try {
      await toggleTask(task.id, completed);
      await loadTasks(false);
    } catch (toggleError) {
      console.warn("Unable to update task", toggleError);
      await loadTasks(false);
      setError("The task could not be updated.");
    }
  }

  async function handlePlanToday(task: Task) {
    const plannedDay = task.planned_day === todayKey ? null : todayKey;
    setTasks((current) => current.map((item) => item.id === task.id
      ? { ...item, planned_day: plannedDay } : item));
    void Haptics.selectionAsync();
    try {
      await setTaskPlannedDay(task.id, plannedDay);
    } catch (planError) {
      console.warn("Unable to plan task", planError);
      await loadTasks(false);
      setError("The daily plan could not be updated.");
    }
  }

  async function handleDelete(task: Task) {
    if (pendingDeleteRef.current) await commitPendingDelete();
    const pending = { task };
    pendingDeleteRef.current = pending;
    setPendingDelete(pending);
    setTasks((current) => current.filter((item) => item.id !== task.id));
    deleteTimerRef.current = setTimeout(() => { void commitPendingDelete(); }, UNDO_DELETE_MS);
    void Haptics.selectionAsync();
  }

  async function handleUndoDelete() {
    if (!pendingDeleteRef.current) return;
    pendingDeleteRef.current = null;
    if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current);
    deleteTimerRef.current = null;
    setPendingDelete(null);
    await loadTasks(false);
  }

  async function handleRefresh() {
    setRefreshing(true);
    await loadTasks(false);
    if (mountedRef.current) setRefreshing(false);
  }

  function openTask(task: Task) {
    router.push({ pathname: "/(app)/service/tasks/[taskId]", params: { taskId: String(task.id) } });
  }

  const query = searchQuery.trim().toLocaleLowerCase();
  const visibleTasks = query
    ? tasks.filter((task) => `${task.title} ${task.notes ?? ""}`.toLocaleLowerCase().includes(query))
    : filterAndSortTasks(tasks, view, sortMode);
  const overdueTasks = !query && view === "today"
    ? visibleTasks.filter((task) => isTaskOverdue(task)) : [];
  const mainTasks = overdueTasks.length
    ? visibleTasks.filter((task) => !isTaskOverdue(task)) : visibleTasks;
  const suggestions = !query && view === "today"
    ? filterAndSortTasks(tasks, "inbox", "priority").slice(0, 3) : [];
  const activeCount = tasks.filter((task) => !task.completed).length;
  const completedCount = tasks.filter((task) => !!task.completed).length;
  const progress = tasks.length ? Math.round(completedCount / tasks.length * 100) : 0;
  const viewCount = filterAndSortTasks(tasks, view, "default").length;
  const dateLabel = new Date().toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });

  return (
    <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.foreground} />}>
        <View style={styles.header}>
          <IconButton accessibilityLabel="Go back" variant="outline" icon={<ArrowLeft size={20} color={colors.foreground} />} onPress={() => router.back()} />
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>PRODUCTIVITY</Text>
            <Text style={styles.headerTitle}>My tasks</Text>
            <Text style={styles.headerMeta}>{activeCount} open · {filterAndSortTasks(tasks, "today", "default").length} for today</Text>
          </View>
        </View>

        <View style={styles.summaryWrapper}>
          <View style={styles.summaryShadow} />
          <View style={styles.summary}>
            <View><Text style={styles.summaryLabel}>TASK PROGRESS</Text><Text style={styles.summaryValue}>{progress}%</Text></View>
            <View style={styles.summaryStats}>
              <View><Text style={styles.statValue}>{activeCount}</Text><Text style={styles.statLabel}>Active</Text></View>
              <View><Text style={styles.statValue}>{completedCount}</Text><Text style={styles.statLabel}>Done</Text></View>
            </View>
          </View>
        </View>

        <View style={styles.addSection}>
          <Text style={styles.addTitle}>Quick add</Text>
          <Input accessibilityLabel="New task title" placeholder="What needs your attention?" value={draftTitle} onChangeText={setDraftTitle} onSubmitEditing={() => void handleAdd()} returnKeyType="done" editable={!adding}
            rightElement={<Pressable accessibilityRole="button" accessibilityLabel="Add task" disabled={!draftTitle.trim() || adding} onPress={() => void handleAdd()} style={[styles.quickAddButton, (!draftTitle.trim() || adding) && styles.quickAddButtonDisabled]}>
              {adding ? <ActivityIndicator size="small" color={colors.foreground} /> : <Plus size={19} color={colors.foreground} />}
            </Pressable>}
          />
          {!!draftTitle.trim() && <View style={styles.composerOptions}>
            {[{ label: "Inbox", value: null }, { label: "Today", value: todayKey }, { label: "Tomorrow", value: getTomorrowDayKey() }].map((option) => (
              <Pressable key={option.label} accessibilityRole="radio" accessibilityState={{ selected: draftPlan === option.value }} onPress={() => setDraftPlan(option.value)} style={[styles.optionChip, draftPlan === option.value && styles.optionChipActive]}><Text style={styles.optionText}>{option.label}</Text></Pressable>
            ))}
            <Pressable accessibilityRole="button" accessibilityLabel={`Priority: ${draftPriority}. Change priority`} onPress={() => setPriorityOpen(true)} style={styles.priorityControl}><Flag size={16} color={colors.foreground} /><Text style={styles.priorityControlText}>{draftPriority === "normal" ? "Priority" : draftPriority}</Text></Pressable>
          </View>}
        </View>

        <Input accessibilityLabel="Search all tasks" placeholder="Search tasks and notes" value={searchQuery} onChangeText={setSearchQuery} returnKeyType="search" leftIcon={<Search size={18} color={colors.foreground} />} rightElement={searchQuery ? <Pressable accessibilityRole="button" accessibilityLabel="Clear search" onPress={() => setSearchQuery("")} hitSlop={8}><X size={18} color={colors.foreground} /></Pressable> : undefined} />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
          {views.map((item) => (
            <Pressable key={item.key} accessibilityRole="tab" accessibilityState={{ selected: view === item.key }} onPress={() => {
              setView(item.key);
              setDraftPlan(item.key === "today" ? todayKey : item.key === "upcoming" ? getTomorrowDayKey() : null);
              setDraftPriority(item.key === "important" ? "high" : "normal");
              setSearchQuery("");
              void Haptics.selectionAsync();
            }} style={[styles.tab, view === item.key && { backgroundColor: item.color }]}>
              <Text style={styles.tabText}>{item.label}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.listHeading}>
          <View style={styles.listHeadingCopy}>
            <Text style={styles.viewTitle}>{query ? "Search results" : viewTitles[view]}</Text>
            <Text style={styles.viewSubtitle}>{query ? `${visibleTasks.length} matches` : view === "today" ? dateLabel : `${viewCount} tasks`}</Text>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Sort tasks" onPress={() => setSortOpen(true)} style={styles.sortButton}>
            <ArrowDownUp size={17} color={ui.muted} /><Text style={styles.sortLabel}>{taskSortOptions.find((item) => item.key === sortMode)?.label}</Text>
          </Pressable>
        </View>

        {error && <View accessibilityLiveRegion="polite" style={styles.errorBanner}><Text style={styles.errorText}>{error}</Text><Pressable accessibilityRole="button" accessibilityLabel="Refresh tasks" onPress={() => void loadTasks()} style={styles.errorAction}><Text style={styles.errorActionText}>Refresh</Text></Pressable></View>}
        {loading ? <ActivityIndicator size="large" color={ui.accent} style={styles.loading} /> : visibleTasks.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyMark}><Check size={25} color={colors.foreground} /></View>
            <Text style={styles.emptyTitle}>{query ? "No results" : emptyMessages[view]}</Text>
            <Text style={styles.emptyHint}>{query ? "Try a different search." : view === "today" ? "Add a task or pick one from your inbox." : "Add a task whenever you're ready."}</Text>
          </View>
        ) : (
          <View>
            {overdueTasks.length > 0 && <TaskSection title="Overdue" count={overdueTasks.length} tone="warning" tasks={overdueTasks} onOpen={openTask} onToggle={handleToggle} onPlan={handlePlanToday} onDelete={handleDelete} />}
            {mainTasks.length > 0 && <TaskSection title={query ? "Matches" : view === "today" && overdueTasks.length ? "Today" : undefined} count={mainTasks.length} tasks={mainTasks} onOpen={openTask} onToggle={handleToggle} onPlan={handlePlanToday} onDelete={handleDelete} />}
          </View>
        )}

        {suggestions.length > 0 && (
          <View style={styles.suggestions}>
            <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>From your inbox</Text><Text style={styles.sectionCount}>PLAN FOR TODAY</Text></View>
            {suggestions.map((task) => (
              <Pressable key={task.id} accessibilityRole="button" accessibilityLabel={`Add ${task.title} to Today`} onPress={() => void handlePlanToday(task)} style={styles.suggestionRow}>
                <Plus size={18} color={colors.foreground} /><Text numberOfLines={1} style={styles.suggestionText}>{task.title}</Text><CalendarDays size={17} color={colors.muted} />
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>

      {pendingDelete && <View accessibilityLiveRegion="polite" style={[styles.snackbarWrapper, { bottom: Math.max(insets.bottom + 16, 28) }]}><View style={styles.snackbar}><Text style={styles.snackbarText}>Task deleted</Text><Pressable accessibilityRole="button" onPress={() => void handleUndoDelete()} style={styles.undoButton}><Text style={styles.undoText}>Undo</Text></Pressable></View></View>}

      <Modal transparent animationType="fade" visible={sortOpen} onRequestClose={() => setSortOpen(false)}>
        <View style={styles.modalBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} accessibilityLabel="Close sort options" onPress={() => setSortOpen(false)} />
          <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
            <Text style={styles.sheetTitle}>Sort tasks</Text>
            {taskSortOptions.map((option) => <Pressable key={option.key} accessibilityRole="radio" accessibilityState={{ selected: sortMode === option.key }} onPress={() => { setSortMode(option.key); setSortOpen(false); }} style={styles.sheetAction}><Text style={styles.sheetActionText}>{option.label}</Text>{sortMode === option.key && <Check size={19} color={ui.accent} />}</Pressable>)}
          </View>
        </View>
      </Modal>

      <Modal transparent animationType="fade" visible={priorityOpen} onRequestClose={() => setPriorityOpen(false)}>
        <View style={styles.modalBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} accessibilityLabel="Close priority options" onPress={() => setPriorityOpen(false)} />
          <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 20) }]}>
            <Text style={styles.sheetTitle}>Priority</Text>
            {priorityOptions.map((option) => <Pressable key={option.key} accessibilityRole="radio" accessibilityState={{ selected: draftPriority === option.key }} onPress={() => { setDraftPriority(option.key); setPriorityOpen(false); }} style={styles.sheetAction}><Text style={styles.sheetActionText}>{option.label}</Text>{draftPriority === option.key && <Check size={19} color={ui.accent} />}</Pressable>)}
          </View>
        </View>
      </Modal>

    </KeyboardAvoidingView>
  );
}

function TaskSection({ title, count, tone, tasks, onOpen, onToggle, onPlan, onDelete }: {
  title?: string; count: number; tone?: "warning"; tasks: Task[];
  onOpen: (task: Task) => void; onToggle: (task: Task) => void;
  onPlan: (task: Task) => void; onDelete: (task: Task) => void;
}) {
  return <View style={styles.section}>
    {title && <View style={styles.sectionHeader}><Text style={[styles.sectionTitle, tone === "warning" && { color: ui.warning }]}>{title}</Text><Text style={styles.sectionCount}>{count}</Text></View>}
    {tasks.map((task) => <TaskRow key={task.id} task={task} onOpen={() => onOpen(task)} onToggle={() => onToggle(task)} onPlan={() => onPlan(task)} onDelete={() => onDelete(task)} />)}
  </View>;
}

function TaskRow({ task, onOpen, onToggle, onPlan, onDelete }: { task: Task; onOpen: () => void; onToggle: () => void; onPlan: () => void; onDelete: () => void }) {
  const completed = !!task.completed;
  const overdue = isTaskOverdue(task);
  const due = task.due_at ? new Date(task.due_at) : null;
  const dueLabel = due && Number.isFinite(due.getTime())
    ? `${isSameDay(due, new Date()) ? "Today" : due.toLocaleDateString([], { month: "short", day: "numeric" })} · ${due.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : null;
  const plannedLabel = task.planned_day === getLocalDayKey() ? "My Day" : task.planned_day === getTomorrowDayKey() ? "Tomorrow" : null;
  const subtaskTotal = task.subtask_total ?? 0;
  return <View style={styles.taskWrapper}><View style={styles.taskShadow} /><View style={styles.taskRow}>
    <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: completed }} accessibilityLabel={completed ? `Mark ${task.title} active` : `Complete ${task.title}`} onPress={onToggle} hitSlop={8} style={[styles.checkbox, completed && styles.checkboxDone]}>{completed && <Check size={17} strokeWidth={3} color={colors.foreground} />}</Pressable>
    <Pressable accessibilityRole="button" accessibilityLabel={`Open ${task.title}`} onPress={onOpen} style={styles.taskBody}>
      <View style={styles.taskTitleRow}>{task.priority !== "normal" && <View style={[styles.priorityMark, { backgroundColor: task.priority === "urgent" ? ui.warning : task.priority === "high" ? ui.accent : ui.blue }]} />}<Text numberOfLines={2} style={[styles.taskTitle, completed && styles.taskTitleDone]}>{task.title}</Text></View>
      {(dueLabel || plannedLabel || task.repeat_type !== "none" || subtaskTotal > 0) && <View style={styles.metadata}>
        {dueLabel && <View style={styles.metaItem}><CalendarClock size={13} color={overdue ? ui.warning : ui.muted} /><Text style={[styles.metaText, overdue && { color: ui.warning }]}>{dueLabel}</Text></View>}
        {plannedLabel && <View style={styles.metaItem}><CalendarDays size={13} color={ui.accent} /><Text style={[styles.metaText, { color: ui.accent }]}>{plannedLabel}</Text></View>}
        {task.repeat_type !== "none" && <View style={styles.metaItem}><Repeat2 size={13} color={ui.muted} /><Text style={styles.metaText}>{task.repeat_type}</Text></View>}
        {subtaskTotal > 0 && <View style={styles.metaItem}><ListChecks size={13} color={ui.muted} /><Text style={styles.metaText}>{task.subtask_completed ?? 0}/{subtaskTotal}</Text></View>}
      </View>}
    </Pressable>
    {!completed && <Pressable accessibilityRole="button" accessibilityLabel={task.planned_day === getLocalDayKey() ? `Remove ${task.title} from Today` : `Plan ${task.title} for Today`} onPress={onPlan} hitSlop={7} style={styles.rowAction}><CalendarDays size={18} color={task.planned_day === getLocalDayKey() ? colors.foreground : colors.muted} /></Pressable>}
    <Pressable accessibilityRole="button" accessibilityLabel={`Delete ${task.title}`} onPress={onDelete} hitSlop={7} style={styles.rowAction}><Trash2 size={18} color={colors.destructive} /></Pressable>
  </View></View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: ui.background },
  content: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 104, gap: 22 },
  header: { flexDirection: "row", alignItems: "center", gap: 16 },
  headerCopy: { flex: 1 },
  eyebrow: { ...typography.label, color: colors.muted },
  headerTitle: { ...typography.h1, color: colors.foreground },
  headerMeta: { ...typography.muted, marginTop: 1, color: colors.muted },
  summaryWrapper: { position: "relative" },
  summaryShadow: { position: "absolute", left: 6, top: 6, width: "100%", height: "100%", backgroundColor: colors.foreground, borderRadius: 8 },
  summary: { minHeight: 126, padding: 18, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 16, backgroundColor: colors.yellow, borderWidth: 2, borderColor: colors.foreground, borderRadius: 8 },
  summaryLabel: { ...typography.label, color: colors.foreground },
  summaryValue: { fontFamily: "SpaceGrotesk_600SemiBold", fontSize: 36, lineHeight: 42, color: colors.foreground },
  summaryStats: { flexDirection: "row", gap: 22 },
  statValue: { ...typography.h2, textAlign: "center", color: colors.foreground },
  statLabel: { ...typography.muted, color: colors.foreground },
  addSection: { gap: 8 },
  addTitle: { ...typography.h4, color: colors.foreground },
  quickAddButton: { width: 32, height: 32, alignItems: "center", justifyContent: "center", backgroundColor: colors.pink, borderWidth: 2, borderColor: colors.foreground, borderRadius: 7 },
  quickAddButtonDisabled: { backgroundColor: colors.background, opacity: 0.55 },
  searchBar: { minHeight: 48, flexDirection: "row", alignItems: "center", gap: 10, marginHorizontal: 20, borderBottomWidth: 1, borderBottomColor: ui.line },
  searchInput: { flex: 1, height: 48, fontFamily: "SpaceGrotesk_400Regular", fontSize: 16, color: ui.ink },
  tabsFrame: { borderBottomWidth: 1, borderBottomColor: ui.line },
  tabs: { gap: 10, paddingRight: 20 },
  tab: { minHeight: 42, paddingHorizontal: 13, alignItems: "center", justifyContent: "center", backgroundColor: colors.white, borderWidth: 2, borderColor: colors.foreground, borderRadius: 8 },
  tabText: { ...typography.button, color: colors.foreground },
  tabTextActive: { fontFamily: "SpaceGrotesk_700Bold", color: ui.ink },
  listScroll: { flex: 1 },
  listContent: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 28, gap: 20 },
  listHeading: { minHeight: 40, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  listHeadingCopy: { flex: 1, minWidth: 0 },
  viewTitle: { ...typography.h4, color: colors.foreground },
  viewSubtitle: { fontFamily: "SpaceGrotesk_400Regular", fontSize: 13, lineHeight: 19, color: ui.muted },
  sortButton: { minHeight: 40, flexDirection: "row", alignItems: "center", gap: 7, paddingHorizontal: 12, backgroundColor: colors.white, borderWidth: 2, borderColor: colors.foreground, borderRadius: 8 },
  sortLabel: { fontFamily: "SpaceGrotesk_500Medium", fontSize: 13, color: colors.foreground },
  errorBanner: { minHeight: 56, flexDirection: "row", alignItems: "center", gap: 12, padding: 12, backgroundColor: colors.pink, borderWidth: 2, borderColor: colors.foreground, borderRadius: 8 },
  errorText: { flex: 1, fontFamily: "SpaceGrotesk_500Medium", fontSize: 13, color: ui.warning },
  errorAction: { minHeight: 32, justifyContent: "center", paddingHorizontal: 4 },
  errorActionText: { fontFamily: "SpaceGrotesk_600SemiBold", fontSize: 13, color: ui.warning },
  loading: { marginTop: 80 },
  section: { gap: 14 },
  sectionHeader: { minHeight: 32, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  sectionTitle: { fontFamily: "SpaceGrotesk_600SemiBold", fontSize: 14, color: ui.ink },
  sectionCount: { fontFamily: "SpaceGrotesk_600SemiBold", fontSize: 11, color: ui.muted },
  taskWrapper: { position: "relative" },
  taskShadow: { position: "absolute", left: 4, top: 4, width: "100%", height: "100%", backgroundColor: colors.foreground, borderRadius: 8 },
  taskRow: { minHeight: 68, flexDirection: "row", alignItems: "center", gap: 8, padding: 14, backgroundColor: colors.white, borderWidth: 2, borderColor: colors.foreground, borderRadius: 8 },
  checkbox: { width: 32, height: 32, alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: colors.foreground, borderRadius: 6, backgroundColor: colors.white },
  checkboxDone: { backgroundColor: colors.green },
  taskBody: { flex: 1, minWidth: 0, paddingVertical: 3, gap: 5 },
  taskTitleRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  taskTitle: { ...typography.body, flex: 1, color: colors.foreground },
  taskTitleDone: { color: ui.muted, textDecorationLine: "line-through" },
  priorityMark: { width: 5, height: 17, borderRadius: 2 },
  metadata: { flexDirection: "row", flexWrap: "wrap", columnGap: 11, rowGap: 3 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 3 },
  metaText: { fontFamily: "SpaceGrotesk_400Regular", fontSize: 11.5, lineHeight: 16, color: ui.muted },
  rowAction: { width: 35, height: 42, alignItems: "center", justifyContent: "center" },
  empty: { alignItems: "center", paddingVertical: 44, paddingHorizontal: 20, gap: 7 },
  emptyMark: { width: 56, height: 56, alignItems: "center", justifyContent: "center", backgroundColor: colors.green, borderWidth: 2, borderColor: colors.foreground, borderRadius: 28, marginBottom: 5 },
  emptyTitle: { fontFamily: "SpaceGrotesk_600SemiBold", fontSize: 17, textAlign: "center", color: ui.ink },
  emptyHint: { fontFamily: "SpaceGrotesk_400Regular", fontSize: 13, lineHeight: 19, textAlign: "center", color: ui.muted },
  suggestions: { paddingTop: 10, gap: 2 },
  suggestionRow: { minHeight: 48, flexDirection: "row", alignItems: "center", gap: 11, paddingHorizontal: 12, backgroundColor: colors.white, borderWidth: 2, borderColor: colors.foreground, borderRadius: 8 },
  suggestionText: { flex: 1, fontFamily: "SpaceGrotesk_500Medium", fontSize: 14, color: ui.ink },
  footer: { paddingHorizontal: 20, paddingTop: 11, borderTopWidth: 1, borderTopColor: ui.line, backgroundColor: ui.background },
  addBar: { height: 48, flexDirection: "row", alignItems: "center", gap: 11 },
  addIcon: { width: 34, height: 34, alignItems: "center", justifyContent: "center", borderRadius: 17, backgroundColor: ui.accent },
  addBarText: { fontFamily: "SpaceGrotesk_600SemiBold", fontSize: 15, color: ui.accent },
  composer: { gap: 12 },
  composerInputRow: { minHeight: 42, flexDirection: "row", alignItems: "center", gap: 10 },
  composerInput: { flex: 1, minWidth: 0, fontFamily: "SpaceGrotesk_500Medium", fontSize: 16, color: ui.ink },
  composerOptions: { flexDirection: "row", flexWrap: "wrap", gap: 8, paddingTop: 2 },
  optionChip: { minHeight: 34, alignItems: "center", justifyContent: "center", paddingHorizontal: 10, borderWidth: 2, borderColor: colors.foreground, borderRadius: 7, backgroundColor: colors.white },
  optionChipActive: { backgroundColor: colors.yellow },
  optionText: { fontFamily: "SpaceGrotesk_500Medium", fontSize: 12, color: colors.foreground },
  optionTextActive: { color: ui.accent },
  priorityControl: { minHeight: 34, flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 9, borderWidth: 2, borderColor: colors.foreground, borderRadius: 7, backgroundColor: colors.white },
  priorityControlText: { fontFamily: "SpaceGrotesk_500Medium", fontSize: 12, textTransform: "capitalize", color: colors.foreground },
  saveTaskButton: { height: 42, alignItems: "center", justifyContent: "center", borderRadius: 6, backgroundColor: ui.accent },
  saveTaskButtonDisabled: { opacity: 0.42 },
  saveTaskText: { fontFamily: "SpaceGrotesk_600SemiBold", fontSize: 14, color: "#FFFFFF" },
  snackbarWrapper: { position: "absolute", left: 20, right: 20 },
  snackbar: { minHeight: 58, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 16, paddingHorizontal: 16, borderWidth: 2, borderColor: colors.foreground, borderRadius: 8, backgroundColor: colors.yellow },
  snackbarText: { ...typography.body, color: colors.foreground },
  undoButton: { minWidth: 68, minHeight: 38, alignItems: "center", justifyContent: "center", paddingHorizontal: 8, backgroundColor: colors.white, borderWidth: 2, borderColor: colors.foreground, borderRadius: 8 },
  undoText: { ...typography.button, color: colors.foreground },
  modalBackdrop: { flex: 1, justifyContent: "flex-end", padding: 20, backgroundColor: "rgba(26, 26, 26, 0.45)" },
  sheet: { paddingTop: 18, paddingHorizontal: 18, gap: 8, backgroundColor: colors.background, borderWidth: 2, borderColor: colors.foreground, borderRadius: 8 },
  sheetTitle: { ...typography.h2, color: colors.foreground, marginBottom: 8 },
  sheetAction: { minHeight: 48, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 14, backgroundColor: colors.white, borderWidth: 2, borderColor: colors.foreground, borderRadius: 8 },
  sheetActionText: { flex: 1, fontFamily: "SpaceGrotesk_500Medium", fontSize: 15, color: ui.ink },
});
