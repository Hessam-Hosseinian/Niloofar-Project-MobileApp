import { useCallback, useState } from "react";

import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { router, useFocusEffect, useLocalSearchParams } from "expo-router";

import {
  ArrowLeft,
  CalendarDays,
  Check,
  Flag,
  Plus,
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
  deleteTask,
  getTaskById,
  Task,
  TaskPriority,
  toggleTask,
  updateTask,
} from "@/src/features/tasks/tasksRepository";

import { colors, typography } from "@/src/theme";

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

export default function TaskDetailScreen() {
  const { taskId } = useLocalSearchParams<{
    taskId: string;
  }>();

  const id = Number(taskId);

  const [task, setTask] = useState<Task | null>(null);

  const [title, setTitle] = useState("");

  const [notes, setNotes] = useState("");

  const [priority, setPriority] = useState<TaskPriority>("normal");

  const [dueAt, setDueAt] = useState<string | null>(null);

  const [showDatePicker, setShowDatePicker] = useState(false);

  const [subtasks, setSubtasks] = useState<Subtask[]>([]);

  const [subtaskTitle, setSubtaskTitle] = useState("");

  const loadTask = useCallback(async () => {
    const result = await getTaskById(id);

    if (!result) {
      return;
    }

    setTask(result);
    setTitle(result.title);
    setNotes(result.notes ?? "");
    setPriority(result.priority);
    setDueAt(result.due_at);

    const subtaskResult = await getSubtasks(id);

    setSubtasks(subtaskResult);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      loadTask();
    }, [loadTask]),
  );

  async function handleSave() {
    const value = title.trim();

    if (!value) {
      return;
    }

    await updateTask(id, {
      title: value,
      notes: notes.trim() || null,
      dueAt,
      priority,
    });

    await loadTask();
  }

  async function handleToggle() {
    if (!task) return;

    await toggleTask(task.id, !task.completed);

    await loadTask();
  }

  async function handleDelete() {
    await deleteTask(id);

    router.back();
  }

  async function handleAddSubtask() {
    const value = subtaskTitle.trim();

    if (!value) return;

    await addSubtask(id, value);

    setSubtaskTitle("");

    const result = await getSubtasks(id);

    setSubtasks(result);
  }

  async function handleToggleSubtask(subtask: Subtask) {
    await toggleSubtask(subtask.id, !subtask.completed);

    const result = await getSubtasks(id);

    setSubtasks(result);
  }

  async function handleDeleteSubtask(subtaskId: number) {
    await deleteSubtask(subtaskId);

    const result = await getSubtasks(id);

    setSubtasks(result);
  }

  const completedSubtasks = subtasks.filter((item) => item.completed).length;

  const subtaskProgress =
    subtasks.length === 0
      ? 0
      : Math.round((completedSubtasks / subtasks.length) * 100);

  if (!task) {
    return null;
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <IconButton
          accessibilityLabel="Go back"
          variant="outline"
          icon={<ArrowLeft size={20} color={colors.foreground} />}
          onPress={() => router.back()}
        />

        <IconButton
          accessibilityLabel="Delete task"
          variant="outline"
          icon={<Trash2 size={20} color={colors.destructive} />}
          onPress={handleDelete}
        />
      </View>

      <View>
        <Text style={styles.eyebrow}>TASK</Text>

        <Text style={styles.pageTitle}>Task details</Text>
      </View>

      <Card>
        <View style={styles.form}>
          <Input
            label="Title"
            value={title}
            onChangeText={setTitle}
            placeholder="Task title"
          />

          <Input
            label="Notes"
            value={notes}
            onChangeText={setNotes}
            placeholder="Add some notes..."
            multiline
          />
        </View>
      </Card>

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
                onPress={() => setPriority(item.key)}
                style={[
                  styles.priorityChip,
                  selected && {
                    backgroundColor: item.color,
                  },
                ]}
              >
                <Text style={styles.priorityText}>{item.label}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <CalendarDays size={18} color={colors.foreground} />

          <Text style={styles.sectionTitle}>Due date</Text>
        </View>

        <Pressable onPress={() => setShowDatePicker(true)}>
          <Card
            variant={dueAt ? "yellow" : "default"}
            title={
              dueAt ? new Date(dueAt).toLocaleDateString() : "Set due date"
            }
            description={
              dueAt
                ? new Date(dueAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "Choose when this task should be done."
            }
          />
        </Pressable>

        {showDatePicker && (
          <DateTimePicker
            value={dueAt ? new Date(dueAt) : new Date()}
            mode="datetime"
            minimumDate={new Date()}
            onChange={(_, date) => {
              setShowDatePicker(false);

              if (date) {
                setDueAt(date.toISOString());
              }
            }}
          />
        )}

        {dueAt && (
          <Button variant="outline" onPress={() => setDueAt(null)}>
            Clear due date
          </Button>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Subtasks</Text>

        <View style={styles.subtaskAdd}>
          <View style={styles.subtaskInput}>
            <Input
              placeholder="Add a subtask..."
              value={subtaskTitle}
              onChangeText={setSubtaskTitle}
              onSubmitEditing={handleAddSubtask}
            />
          </View>

          <IconButton
            accessibilityLabel="Add subtask"
            variant="accent"
            icon={<Plus size={20} color={colors.foreground} />}
            onPress={handleAddSubtask}
          />
        </View>

        <View style={styles.subtaskProgress}>
          <Text style={styles.subtaskProgressText}>
            {completedSubtasks}/{subtasks.length} done
          </Text>

          <Text style={styles.subtaskProgressValue}>{subtaskProgress}%</Text>
        </View>

        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${subtaskProgress}%`,
              },
            ]}
          />
        </View>

        {subtasks.length === 0 ? (
          <Text style={styles.muted}>No subtasks yet.</Text>
        ) : (
          <View style={styles.subtaskList}>
            {subtasks.map((subtask) => {
              const completed = !!subtask.completed;

              return (
                <View key={subtask.id} style={styles.subtaskRow}>
                  <Pressable
                    onPress={() => handleToggleSubtask(subtask)}
                    style={[
                      styles.subtaskCheckbox,
                      completed && styles.subtaskCheckboxDone,
                    ]}
                  >
                    {completed && (
                      <Check
                        size={15}
                        strokeWidth={3}
                        color={colors.foreground}
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
                    onPress={() => handleDeleteSubtask(subtask.id)}
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

      <Button variant="primary" onPress={handleSave}>
        Save changes
      </Button>

      <Button
        variant={task.completed ? "outline" : "accent"}
        onPress={handleToggle}
        leftIcon={<Check size={18} color={colors.foreground} />}
      >
        {task.completed ? "Mark as active" : "Mark as completed"}
      </Button>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 48,
    gap: 28,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  eyebrow: {
    ...typography.label,
    color: colors.muted,
  },

  pageTitle: {
    ...typography.h1,
    color: colors.foreground,
  },

  form: {
    gap: 16,
  },

  section: {
    gap: 14,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  sectionTitle: {
    ...typography.h3,
    color: colors.foreground,
  },

  priorityGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  priorityChip: {
    minHeight: 40,

    paddingHorizontal: 16,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: colors.white,

    borderWidth: 2,
    borderColor: colors.foreground,
    borderRadius: 8,
  },

  priorityText: {
    ...typography.button,
    color: colors.foreground,
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
    height: 12,
    overflow: "hidden",

    backgroundColor: colors.white,

    borderWidth: 2,
    borderColor: colors.foreground,
    borderRadius: 999,
  },

  progressFill: {
    height: "100%",
    backgroundColor: colors.green,
  },

  subtaskAdd: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  subtaskInput: {
    flex: 1,
  },

  subtaskList: {
    gap: 10,
  },

  subtaskRow: {
    minHeight: 54,

    flexDirection: "row",
    alignItems: "center",

    gap: 12,

    paddingHorizontal: 12,

    backgroundColor: colors.white,

    borderWidth: 2,
    borderColor: colors.foreground,
    borderRadius: 8,
  },

  subtaskCheckbox: {
    width: 26,
    height: 26,

    alignItems: "center",
    justifyContent: "center",

    borderWidth: 2,
    borderColor: colors.foreground,
    borderRadius: 6,

    backgroundColor: colors.white,
  },

  subtaskCheckboxDone: {
    backgroundColor: colors.green,
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
});
