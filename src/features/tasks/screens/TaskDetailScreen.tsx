import { useCallback, useEffect, useRef, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { router, useFocusEffect, useLocalSearchParams } from "expo-router";

import {
  ArrowLeft,
  Bell,
  CalendarDays,
  Check,
  Flag,
  Minus,
  Plus,
  Repeat2,
  Timer,
  Trash2,
} from "lucide-react-native";

import {
  addSubtask,
  deleteSubtask,
  getSubtasks,
  Subtask,
  toggleSubtask,
} from "@/src/features/tasks/subtasksRepository";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { IconButton } from "@/src/components/ui/IconButton";
import { Input } from "@/src/components/ui/Input";

import {
  cancelTaskReminder,
  scheduleTaskReminder,
} from "@/src/features/tasks/notifications";

import type { RepeatType } from "@/src/features/tasks/tasksRepository";

import {
  deleteTask,
  getTaskById,
  Task,
  TaskPriority,
  toggleTask,
  updateTask,
} from "@/src/features/tasks/tasksRepository";

import { colors, typography } from "@/src/theme";
import { getLocalDayKey, getTomorrowDayKey } from "@/src/features/tasks/taskListUtils";

const detailUi = {
  background: colors.background,
  ink: colors.foreground,
  muted: colors.muted,
  line: colors.foreground,
  accent: colors.green,
  accentSoft: colors.yellow,
  warning: colors.destructive,
};

const priorities: {
  key: TaskPriority;
  label: string;
  color: string;
}[] = [
  {
    key: "low",
    label: "Low",
    color: colors.blue,
  },
  {
    key: "normal",
    label: "Normal",
    color: colors.green,
  },
  {
    key: "high",
    label: "High",
    color: colors.orange,
  },
  {
    key: "urgent",
    label: "Urgent",
    color: colors.pink,
  },
];

const reminderOptions = [
  {
    label: "None",
    value: null,
  },
  {
    label: "10 min",
    value: 10,
  },
  {
    label: "30 min",
    value: 30,
  },
  {
    label: "1 hour",
    value: 60,
  },
  {
    label: "1 day",
    value: 24 * 60,
  },
];

export default function TaskDetailScreen() {
  const insets = useSafeAreaInsets();
  const { taskId } = useLocalSearchParams<{
    taskId: string;
  }>();

  const id = Number(taskId);

  const [task, setTask] = useState<Task | null>(null);

  const [loadState, setLoadState] = useState<
    "loading" | "ready" | "notFound" | "error"
  >("loading");

  const [busy, setBusy] = useState(false);

  const [actionError, setActionError] = useState<string | null>(null);

  const mountedRef = useRef(true);

  const [title, setTitle] = useState("");

  const [notes, setNotes] = useState("");

  const [priority, setPriority] = useState<TaskPriority>("normal");

  const [dueAt, setDueAt] = useState<string | null>(null);
  const [plannedDay, setPlannedDay] = useState<string | null>(null);

  const [reminderMinutes, setReminderMinutes] = useState<number | null>(null);

  const [subtasks, setSubtasks] = useState<Subtask[]>([]);

  const [subtaskTitle, setSubtaskTitle] = useState("");

  const [repeatType, setRepeatType] = useState<RepeatType>("none");

  const [repeatInterval, setRepeatInterval] = useState(1);

  const repeatOptions: {
    key: RepeatType;
    label: string;
  }[] = [
    {
      key: "none",
      label: "Never",
    },
    {
      key: "daily",
      label: "Daily",
    },
    {
      key: "weekly",
      label: "Weekly",
    },
    {
      key: "monthly",
      label: "Monthly",
    },
  ];

  const [showDatePicker, setShowDatePicker] = useState(false);

  const [showTimePicker, setShowTimePicker] = useState(false);

  const [pendingDate, setPendingDate] = useState<Date | null>(null);

  const loadTask = useCallback(async (showLoading = true) => {
    if (!Number.isInteger(id) || id <= 0) {
      setTask(null);
      setLoadState("notFound");
      return;
    }

    if (showLoading) {
      setLoadState("loading");
    }

    try {
      const result = await getTaskById(id);

      if (!result) {
        if (mountedRef.current) {
          setTask(null);
          setSubtasks([]);
          setLoadState("notFound");
        }
        return;
      }

      const subtaskResult = await getSubtasks(id);

      if (!mountedRef.current) {
        return;
      }

      setRepeatType(result.repeat_type);
      setRepeatInterval(Math.max(1, result.repeat_interval));
      setTask(result);
      setTitle(result.title);
      setNotes(result.notes ?? "");
      setPriority(result.priority);
      setDueAt(result.due_at);
      setPlannedDay(result.planned_day);
      setReminderMinutes(result.reminder_minutes);
      setSubtasks(subtaskResult);
      setLoadState("ready");
      setActionError(null);
    } catch (loadError) {
      console.warn("Unable to load task", loadError);

      if (mountedRef.current) {
        setTask(null);
        setLoadState("error");
      }
    }
  }, [id]);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadTask();
    }, [loadTask]),
  );

  async function handleSave() {
    if (!task || busy) {
      return;
    }

    const value = title.trim();

    if (!value) {
      setActionError("Add a title before saving.");
      return;
    }

    if (
      !task.completed &&
      dueAt &&
      reminderMinutes !== null &&
      new Date(dueAt).getTime() - reminderMinutes * 60_000 <= Date.now()
    ) {
      setActionError("Choose a later due date or a shorter reminder.");
      return;
    }

    let notificationId: string | null = null;
    setBusy(true);
    setActionError(null);

    try {
      if (!task.completed && dueAt && reminderMinutes !== null) {
        notificationId = await scheduleTaskReminder(
          value,
          dueAt,
          reminderMinutes,
        );
      }

      await updateTask(id, {
        title: value,
        notes: notes.trim() || null,
        dueAt,
        plannedDay,
        priority,
        repeatType,
        repeatInterval,
        reminderMinutes: dueAt ? reminderMinutes : null,
        notificationId,
      });

      await cancelTaskReminder(task.notification_id);

      await loadTask(false);
    } catch (saveError) {
      console.warn("Unable to save task", saveError);
      await cancelTaskReminder(notificationId);
      setActionError("Changes could not be saved. Please try again.");
    } finally {
      if (mountedRef.current) {
        setBusy(false);
      }
    }
  }

  async function handleToggle() {
    if (!task || busy) {
      return;
    }

    const willComplete = !task.completed;
    setBusy(true);
    setActionError(null);

    try {
      await toggleTask(task.id, willComplete);
      await loadTask(false);
    } catch (toggleError) {
      console.warn("Unable to update task", toggleError);
      setActionError("The task status could not be updated.");
    } finally {
      if (mountedRef.current) {
        setBusy(false);
      }
    }
  }

  async function deleteCurrentTask() {
    if (!task || busy) {
      return;
    }

    setBusy(true);
    setActionError(null);

    try {
      await deleteTask(id);
      router.back();
    } catch (deleteError) {
      console.warn("Unable to delete task", deleteError);
      setActionError("The task could not be deleted.");
      if (mountedRef.current) {
        setBusy(false);
      }
    }
  }

  function handleDelete() {
    if (!task || busy) return;
    const message = `Delete “${task.title}”? This cannot be undone.`;
    if (Platform.OS === "web") {
      if (globalThis.confirm(message)) void deleteCurrentTask();
      return;
    }
    Alert.alert("Delete task?", message, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => void deleteCurrentTask() },
    ]);
  }

  async function handleAddSubtask() {
    const value = subtaskTitle.trim();

    if (!value || busy) return;

    setBusy(true);
    setActionError(null);

    try {
      await addSubtask(id, value);
      setSubtaskTitle("");
      setSubtasks(await getSubtasks(id));
    } catch (subtaskError) {
      console.warn("Unable to add subtask", subtaskError);
      setActionError("The subtask could not be added.");
    } finally {
      if (mountedRef.current) setBusy(false);
    }
  }

  async function handleToggleSubtask(subtask: Subtask) {
    if (busy) return;

    setBusy(true);
    setActionError(null);

    try {
      await toggleSubtask(subtask.id, !subtask.completed);
      setSubtasks(await getSubtasks(id));
    } catch (subtaskError) {
      console.warn("Unable to update subtask", subtaskError);
      setActionError("The subtask could not be updated.");
    } finally {
      if (mountedRef.current) setBusy(false);
    }
  }

  async function handleDeleteSubtask(subtaskId: number) {
    if (busy) return;

    setBusy(true);
    setActionError(null);

    try {
      await deleteSubtask(subtaskId);
      setSubtasks(await getSubtasks(id));
    } catch (subtaskError) {
      console.warn("Unable to delete subtask", subtaskError);
      setActionError("The subtask could not be deleted.");
    } finally {
      if (mountedRef.current) setBusy(false);
    }
  }

  const completedSubtasks = subtasks.filter((item) => item.completed).length;

  const subtaskProgress =
    subtasks.length === 0
      ? 0
      : Math.round((completedSubtasks / subtasks.length) * 100);

  const isDirty = !!task && (
    title !== task.title ||
    notes !== (task.notes ?? "") ||
    priority !== task.priority ||
    dueAt !== task.due_at ||
    plannedDay !== task.planned_day ||
    reminderMinutes !== task.reminder_minutes ||
    repeatType !== task.repeat_type ||
    repeatInterval !== task.repeat_interval
  );

  function handleBack() {
    if (!isDirty) {
      router.back();
      return;
    }
    if (Platform.OS === "web") {
      if (globalThis.confirm("Discard unsaved changes?")) router.back();
      return;
    }
    Alert.alert("Unsaved changes", "Discard your edits to this task?", [
      { text: "Keep editing", style: "cancel" },
      { text: "Discard", style: "destructive", onPress: () => router.back() },
    ]);
  }

  if (loadState === "loading") {
    return (
      <TaskDetailState title="Loading task...">
        <ActivityIndicator size="large" color={colors.foreground} />
      </TaskDetailState>
    );
  }

  if (loadState === "error") {
    return (
      <TaskDetailState
        title="Could not load task"
        description="Check the local database and try again."
        onRetry={() => void loadTask()}
      />
    );
  }

  if (loadState === "notFound" || !task) {
    return (
      <TaskDetailState
        title="Task not found"
        description="This task does not exist or has already been deleted."
      />
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={handleBack} style={styles.headerIcon}>
            <ArrowLeft size={22} color={detailUi.ink} />
          </Pressable>
          <Text style={styles.headerTitle}>Task</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Delete task" onPress={handleDelete} disabled={busy} style={styles.headerIcon}>
            <Trash2 size={20} color={detailUi.warning} />
          </Pressable>
        </View>

        {actionError && <Text style={styles.errorText}>{actionError}</Text>}

        <View style={styles.form}>
          <TextInput
            accessibilityLabel="Task title"
            value={title}
            onChangeText={setTitle}
            placeholder="Task title"
            placeholderTextColor={detailUi.muted}
            multiline
            style={styles.titleInput}
          />
          <TextInput
            accessibilityLabel="Task notes"
            value={notes}
            onChangeText={setNotes}
            placeholder="Add notes"
            placeholderTextColor={detailUi.muted}
            multiline
            textAlignVertical="top"
            style={styles.notesInput}
          />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Flag size={18} color={colors.foreground} />

            <Text style={styles.sectionTitle}>Priority</Text>
          </View>

          <View style={styles.priorityGrid}>
            {priorities.map((item) => {
              const selected = priority === item.key;

              return (
                <Pressable
                  key={item.key}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  onPress={() => setPriority(item.key)}
                  style={[
                    styles.priorityChip,
                    selected && styles.priorityChipSelected,
                  ]}
                >
                  <View style={[styles.priorityDot, { backgroundColor: item.color }]} />
                  <Text style={styles.priorityText}>{item.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <CalendarDays size={18} color={colors.foreground} />

            <Text style={styles.sectionTitle}>Plan</Text>
          </View>

          <View style={styles.repeatGrid}>
            {[
              { label: "No plan", value: null },
              { label: "Today", value: getLocalDayKey() },
              { label: "Tomorrow", value: getTomorrowDayKey() },
            ].map((option) => (
              <Pressable
                key={option.label}
                accessibilityRole="radio"
                accessibilityState={{ selected: plannedDay === option.value }}
                onPress={() => setPlannedDay(option.value)}
                style={[
                  styles.repeatOption,
                  plannedDay === option.value && styles.repeatOptionSelected,
                ]}
              >
                <Text style={styles.repeatOptionText}>{option.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <CalendarDays size={18} color={colors.foreground} />

            <Text style={styles.sectionTitle}>Due date</Text>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={dueAt ? "Change due date" : "Set due date"}
            onPress={() => {
              setPendingDate(dueAt ? new Date(dueAt) : new Date());

              setShowDatePicker(true);
            }}
            style={styles.dateRow}
          >
            <CalendarDays size={19} color={detailUi.accent} />
            <Text style={styles.dateValue}>
              {dueAt
                ? `${new Date(dueAt).toLocaleDateString()} · ${new Date(dueAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                : "Set a date and time"}
            </Text>
            <Plus size={18} color={detailUi.muted} />
          </Pressable>

          {showDatePicker && (
            <DateTimePicker
              value={pendingDate ?? new Date()}
              mode="date"
              minimumDate={new Date()}
              onValueChange={(_, selectedDate) => {
                if (!selectedDate) {
                  return;
                }

                setPendingDate(selectedDate);

                setShowDatePicker(false);
                setShowTimePicker(true);
              }}
              onDismiss={() => {
                setShowDatePicker(false);
              }}
            />
          )}

          {showTimePicker && (
            <DateTimePicker
              value={pendingDate ?? new Date()}
              mode="time"
              onValueChange={(_, selectedTime) => {
                if (!selectedTime) {
                  return;
                }

                const base = pendingDate ?? new Date();

                const combined = new Date(base);

                combined.setHours(
                  selectedTime.getHours(),
                  selectedTime.getMinutes(),
                  0,
                  0,
                );

                if (combined.getTime() <= Date.now()) {
                  setActionError("Choose a future date and time.");
                  setPendingDate(null);
                  setShowTimePicker(false);
                  return;
                }

                setDueAt(combined.toISOString());
                setActionError(null);

                setPendingDate(null);
                setShowTimePicker(false);
              }}
              onDismiss={() => {
                setPendingDate(null);
                setShowTimePicker(false);
              }}
            />
          )}

          {dueAt && <Pressable accessibilityRole="button" onPress={() => {
            setDueAt(null);
            setPendingDate(null);
            setReminderMinutes(null);
          }} style={styles.clearDate}><Text style={styles.clearDateText}>Remove due date</Text></Pressable>}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Bell size={18} color={colors.foreground} />

            <Text style={styles.sectionTitle}>Reminder</Text>
          </View>

          {!dueAt ? (
            <Text style={styles.muted}>
              Set a due date before adding a reminder.
            </Text>
          ) : (
            <View style={styles.reminderGrid}>
              {reminderOptions.map((option) => {
                const selected = reminderMinutes === option.value;

                return (
                  <Pressable
                    key={option.value === null ? "none" : String(option.value)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    onPress={() => setReminderMinutes(option.value)}
                    style={[
                      styles.reminderOption,
                      selected && styles.reminderOptionSelected,
                    ]}
                  >
                    <Text style={styles.reminderOptionText}>{option.label}</Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Repeat2 size={18} color={detailUi.ink} />
            <Text style={styles.sectionTitle}>Repeat</Text>
          </View>
          <View style={styles.repeatGrid}>
            {repeatOptions.map((option) => (
              <Pressable key={option.key} accessibilityRole="radio" accessibilityState={{ selected: repeatType === option.key }} disabled={busy} onPress={() => setRepeatType(option.key)} style={[styles.repeatOption, repeatType === option.key && styles.repeatOptionSelected]}>
                <Text style={styles.repeatOptionText}>{option.label}</Text>
              </Pressable>
            ))}
          </View>
          {repeatType !== "none" && <View style={styles.repeatIntervalRow}>
            <Pressable accessibilityRole="button" accessibilityLabel="Decrease repeat interval" disabled={busy || repeatInterval <= 1} onPress={() => setRepeatInterval((current) => Math.max(1, current - 1))} style={[styles.repeatStepButton, repeatInterval <= 1 && styles.repeatStepDisabled]}><Minus size={18} color={detailUi.ink} /></Pressable>
            <Text style={styles.repeatIntervalText}>Every {repeatInterval} {getRepeatUnit(repeatType, repeatInterval)}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Increase repeat interval" disabled={busy} onPress={() => setRepeatInterval((current) => current + 1)} style={styles.repeatStepButton}><Plus size={18} color={detailUi.ink} /></Pressable>
          </View>}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Subtasks</Text>

          <View style={styles.subtaskAdd}>
            <TextInput
              accessibilityLabel="New subtask title"
              placeholder="Add a subtask"
              placeholderTextColor={detailUi.muted}
              value={subtaskTitle}
              onChangeText={setSubtaskTitle}
              onSubmitEditing={handleAddSubtask}
              returnKeyType="done"
              style={styles.subtaskInput}
            />
            <Pressable accessibilityRole="button" accessibilityLabel="Add subtask" onPress={handleAddSubtask} disabled={busy || !subtaskTitle.trim()} style={styles.subtaskAddButton}>
              <Plus size={20} color={detailUi.accent} />
            </Pressable>
          </View>

          {subtasks.length > 0 && <View style={styles.subtaskProgress}>
            <Text style={styles.subtaskProgressText}>
              {completedSubtasks}/{subtasks.length} done
            </Text>

            <Text style={styles.subtaskProgressValue}>{subtaskProgress}%</Text>
          </View>}

          {subtasks.length > 0 && <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${subtaskProgress}%`,
                },
              ]}
            />
          </View>}

          {subtasks.length === 0 ? (
            <Text style={styles.muted}>No subtasks yet.</Text>
          ) : (
            <View style={styles.subtaskList}>
              {subtasks.map((subtask) => {
                const completed = !!subtask.completed;

                return (
                  <View key={subtask.id} style={styles.subtaskRow}>
                    <Pressable
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: completed, disabled: busy }}
                      accessibilityLabel={`${subtask.title}, ${completed ? "completed" : "not completed"}`}
                      onPress={() => handleToggleSubtask(subtask)}
                      disabled={busy}
                      style={[
                        styles.subtaskCheckbox,
                        completed && styles.subtaskCheckboxDone,
                      ]}
                    >
                      {completed && (
                        <Check
                          size={15}
                          strokeWidth={3}
                          color="#FFFFFF"
                        />
                      )}
                    </Pressable>

                    <Text
                      style={[
                        styles.subtaskTitle,
                        completed && styles.subtaskTitleDone,
                      ]}
                    >
                      {subtask.title}
                    </Text>

                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Delete ${subtask.title}`}
                      onPress={() => handleDeleteSubtask(subtask.id)}
                      disabled={busy}
                      hitSlop={8}
                      style={styles.subtaskDelete}
                    >
                      <Trash2 size={18} color={colors.destructive} />
                    </Pressable>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        <View style={styles.actions}>
          <Pressable accessibilityRole="button" disabled={busy || isDirty} onPress={() => router.push({ pathname: "/(app)/service/tasks/[taskId]/focus", params: { taskId: String(task.id) } })} style={[styles.actionRow, (busy || isDirty) && styles.actionDisabled]}>
            <Timer size={19} color={detailUi.accent} /><Text style={styles.actionText}>Start focus session</Text>
          </Pressable>
          <Pressable accessibilityRole="button" disabled={busy || isDirty} onPress={handleToggle} style={[styles.actionRow, (busy || isDirty) && styles.actionDisabled]}>
            <Check size={19} color={detailUi.accent} /><Text style={styles.actionText}>{task.completed ? "Mark as active" : "Mark as completed"}</Text>
          </Pressable>
        </View>
      </ScrollView>
      {isDirty && (
        <View
          style={[styles.saveBar, { paddingBottom: Math.max(insets.bottom, 16) }]}
        >
          <Text style={styles.saveBarTitle}>Unsaved changes</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Save task" onPress={handleSave} disabled={busy || !title.trim()} style={[styles.saveButton, (busy || !title.trim()) && styles.actionDisabled]}>
            {busy ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Text style={styles.saveButtonText}>Save</Text>}
          </Pressable>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

function getRepeatUnit(repeatType: RepeatType, interval: number) {
  const units: Record<Exclude<RepeatType, "none">, string> = {
    daily: "day",
    weekly: "week",
    monthly: "month",
  };

  if (repeatType === "none") {
    return "time";
  }

  const unit = units[repeatType];

  return interval === 1 ? unit : `${unit}s`;
}

function TaskDetailState({
  title,
  description,
  onRetry,
  children,
}: {
  title: string;
  description?: string;
  onRetry?: () => void;
  children?: React.ReactNode;
}) {
  return (
    <View style={styles.stateScreen}>
      <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()} style={styles.headerIcon}>
        <ArrowLeft size={22} color={detailUi.ink} />
      </Pressable>
      <View style={styles.stateContent}>
        {children}
        <Text style={styles.stateTitle}>{title}</Text>
        {description && <Text style={styles.stateDescription}>{description}</Text>}
        {onRetry && <Pressable accessibilityRole="button" onPress={onRetry} style={styles.saveButton}><Text style={styles.saveButtonText}>Try again</Text></Pressable>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: detailUi.background,
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 36,
    gap: 22,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    minHeight: 50,
  },

  form: {
    gap: 8,
    paddingBottom: 8,
  },

  section: {
    gap: 12,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: detailUi.line,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  sectionTitle: {
    fontFamily: "SpaceGrotesk_600SemiBold",
    fontSize: 15,
    lineHeight: 21,
    color: detailUi.ink,
  },

  priorityGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  priorityChip: {
    minHeight: 36,
    paddingHorizontal: 11,
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F3F6F3",
    borderWidth: 1,
    borderColor: "transparent",
    borderRadius: 6,
  },

  priorityText: {
    fontFamily: "SpaceGrotesk_500Medium",
    fontSize: 13,
    color: detailUi.ink,
  },

  reminderGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  reminderOption: {
    minHeight: 36,
    paddingHorizontal: 11,
    alignItems: "center",
    justifyContent: "center",

    backgroundColor: "#F3F6F3",
    borderWidth: 1,
    borderColor: "transparent",
    borderRadius: 6,
  },

  reminderOptionSelected: {
    backgroundColor: detailUi.accentSoft,
    borderColor: detailUi.accent,
  },

  reminderOptionText: {
    fontFamily: "SpaceGrotesk_500Medium",
    fontSize: 13,
    color: detailUi.ink,
  },

  subtaskProgress: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  subtaskProgressText: {
    ...typography.muted,
    color: colors.muted,
  },

  subtaskProgressValue: {
    ...typography.h4,
    color: colors.foreground,
  },

  progressTrack: {
    height: 5,
    overflow: "hidden",

    backgroundColor: detailUi.line,
    borderRadius: 999,
  },

  progressFill: {
    height: "100%",
    backgroundColor: detailUi.accent,
  },

  subtaskAdd: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  subtaskInput: {
    flex: 1,
    minHeight: 44,
    borderBottomWidth: 1,
    borderBottomColor: detailUi.line,
    fontFamily: "SpaceGrotesk_400Regular",
    fontSize: 15,
    color: detailUi.ink,
  },

  subtaskList: {
    gap: 0,
  },

  subtaskRow: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",

    gap: 12,

    paddingHorizontal: 2,
    borderBottomWidth: 1,
    borderBottomColor: detailUi.line,
  },

  subtaskCheckbox: {
    width: 24,
    height: 24,

    alignItems: "center",
    justifyContent: "center",

    borderWidth: 2,
    borderColor: detailUi.muted,
    borderRadius: 12,
    backgroundColor: detailUi.background,
  },

  subtaskCheckboxDone: {
    borderColor: detailUi.accent,
    backgroundColor: detailUi.accent,
  },

  subtaskTitle: {
    ...typography.body,
    flex: 1,
    color: colors.foreground,
  },

  subtaskTitleDone: {
    color: colors.muted,
    textDecorationLine: "line-through",
  },

  subtaskDelete: {
    width: 36,
    height: 36,

    alignItems: "center",
    justifyContent: "center",
  },

  muted: {
    ...typography.muted,
    color: colors.muted,
  },
  errorText: {
    ...typography.muted,
    color: colors.destructive,
  },
  saveBar: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: detailUi.background,
    borderTopWidth: 1,
    borderTopColor: detailUi.line,
  },
  saveBarTitle: { fontFamily: "SpaceGrotesk_500Medium", fontSize: 14, color: detailUi.ink },
  repeatGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  repeatOption: {
    minHeight: 36,
    paddingHorizontal: 11,
    alignItems: "center",
    justifyContent: "center",

    backgroundColor: "#F3F6F3",
    borderWidth: 1,
    borderColor: "transparent",
    borderRadius: 6,
  },

  repeatOptionSelected: {
    backgroundColor: detailUi.accentSoft,
    borderColor: detailUi.accent,
  },

  repeatOptionText: {
    fontFamily: "SpaceGrotesk_500Medium",
    fontSize: 13,
    color: detailUi.ink,
  },
  repeatIntervalRow: {
    minHeight: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingHorizontal: 8,
    backgroundColor: "#F3F6F3",
    borderRadius: 6,
  },
  repeatStepButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  repeatStepDisabled: {
    opacity: 0.35,
  },
  repeatIntervalText: {
    ...typography.body,
    flex: 1,
    textAlign: "center",
    color: colors.foreground,
  },
  headerIcon: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontFamily: "SpaceGrotesk_700Bold", fontSize: 20, color: detailUi.ink },
  titleInput: {
    minHeight: 60,
    paddingVertical: 8,
    fontFamily: "SpaceGrotesk_600SemiBold",
    fontSize: 24,
    lineHeight: 31,
    color: detailUi.ink,
  },
  notesInput: {
    minHeight: 64,
    maxHeight: 150,
    paddingVertical: 8,
    fontFamily: "SpaceGrotesk_400Regular",
    fontSize: 15,
    lineHeight: 22,
    color: detailUi.ink,
  },
  priorityChipSelected: { backgroundColor: detailUi.accentSoft, borderColor: detailUi.accent },
  priorityDot: { width: 9, height: 9, borderRadius: 5 },
  dateRow: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    backgroundColor: "#F3F6F3",
    borderRadius: 6,
  },
  dateValue: { flex: 1, fontFamily: "SpaceGrotesk_500Medium", fontSize: 14, color: detailUi.ink },
  clearDate: { alignSelf: "flex-start", minHeight: 34, justifyContent: "center" },
  clearDateText: { fontFamily: "SpaceGrotesk_500Medium", fontSize: 13, color: detailUi.warning },
  subtaskAddButton: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  actions: { borderTopWidth: 1, borderTopColor: detailUi.line },
  actionRow: { minHeight: 52, flexDirection: "row", alignItems: "center", gap: 12, borderBottomWidth: 1, borderBottomColor: detailUi.line },
  actionText: { fontFamily: "SpaceGrotesk_500Medium", fontSize: 15, color: detailUi.ink },
  actionDisabled: { opacity: 0.45 },
  saveButton: { minWidth: 84, height: 42, alignItems: "center", justifyContent: "center", paddingHorizontal: 16, borderRadius: 6, backgroundColor: detailUi.accent },
  saveButtonText: { fontFamily: "SpaceGrotesk_600SemiBold", fontSize: 14, color: "#FFFFFF" },
  stateScreen: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 14,
    backgroundColor: detailUi.background,
  },
  stateContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 24,
    paddingBottom: 90,
  },
  stateTitle: {
    fontFamily: "SpaceGrotesk_600SemiBold",
    fontSize: 19,
    textAlign: "center",
    color: detailUi.ink,
  },
  stateDescription: {
    ...typography.muted,
    textAlign: "center",
    color: colors.muted,
  },
});
