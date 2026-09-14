import { useCallback, useState } from "react";

import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { router, useFocusEffect } from "expo-router";

import { ArrowLeft, Check, Plus, Trash2 } from "lucide-react-native";

import { Button } from "@/src/components/ui/Button";
import { IconButton } from "@/src/components/ui/IconButton";
import { Input } from "@/src/components/ui/Input";

import {
  addTask,
  deleteTask,
  getTasks,
  Task,
  toggleTask,
} from "@/src/features/tasks/tasksRepository";

import { colors, typography } from "@/src/theme";

type TaskView = "all" | "today" | "upcoming" | "overdue" | "completed";

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isOverdue(task: Task) {
  if (!task.due_at || task.completed) {
    return false;
  }

  return new Date(task.due_at).getTime() < Date.now();
}

const taskViews: {
  key: TaskView;
  label: string;
  color: string;
}[] = [
  {
    key: "all",
    label: "All",
    color: colors.yellow,
  },
  {
    key: "today",
    label: "Today",
    color: colors.green,
  },
  {
    key: "upcoming",
    label: "Upcoming",
    color: colors.blue,
  },
  {
    key: "overdue",
    label: "Overdue",
    color: colors.pink,
  },
  {
    key: "completed",
    label: "Done",
    color: colors.purple,
  },
];

export default function TasksScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);

  const [title, setTitle] = useState("");

  const [loading, setLoading] = useState(true);

  const [view, setView] = useState<TaskView>("all");

  const loadTasks = useCallback(async () => {
    setLoading(true);

    const result = await getTasks();

    setTasks(result);

    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadTasks();
    }, [loadTasks]),
  );

  async function handleAdd() {
    const value = title.trim();

    if (!value) {
      return;
    }

    await addTask(value);

    setTitle("");

    await loadTasks();
  }

  async function handleToggle(task: Task) {
    await toggleTask(task.id, !task.completed);

    await loadTasks();
  }

  async function handleDelete(id: number) {
    await deleteTask(id);

    await loadTasks();
  }

  const filteredTasks = tasks.filter((task) => {
    if (view === "all") {
      return !task.completed;
    }

    if (view === "completed") {
      return !!task.completed;
    }

    if (!task.due_at) {
      return false;
    }

    const due = new Date(task.due_at);

    if (view === "today") {
      return !task.completed && isSameDay(due, new Date());
    }

    if (view === "overdue") {
      return isOverdue(task);
    }

    if (view === "upcoming") {
      return (
        !task.completed &&
        due.getTime() > new Date().getTime() &&
        !isSameDay(due, new Date())
      );
    }

    return true;
  });

  const total = tasks.length;

  const completedCount = tasks.filter((task) => task.completed).length;

  const activeCount = total - completedCount;

  const progress =
    total === 0 ? 0 : Math.round((completedCount / total) * 100);

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

        <View style={styles.headerText}>
          <Text style={styles.eyebrow}>PRODUCTIVITY</Text>

          <Text style={styles.title}>Tasks</Text>
        </View>
      </View>

      <View style={styles.summaryWrapper}>
        <View style={styles.summaryShadow} />

        <View style={styles.summary}>
          <View>
            <Text style={styles.summaryLabel}>TASK PROGRESS</Text>

            <Text style={styles.summaryValue}>{progress}%</Text>
          </View>

          <View style={styles.summaryStats}>
            <View>
              <Text style={styles.statValue}>{activeCount}</Text>

              <Text style={styles.statLabel}>Active</Text>
            </View>

            <View>
              <Text style={styles.statValue}>{completedCount}</Text>

              <Text style={styles.statLabel}>Done</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.addSection}>
        <Input
          placeholder="What do you need to do?"
          value={title}
          onChangeText={setTitle}
          returnKeyType="done"
          onSubmitEditing={handleAdd}
        />

        <Button
          variant="primary"
          onPress={handleAdd}
          leftIcon={<Plus size={18} color={colors.foreground} />}
        >
          Add task
        </Button>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.viewTabs}
      >
        {taskViews.map((item) => {
          const selected = view === item.key;

          return (
            <Pressable
              key={item.key}
              onPress={() => setView(item.key)}
              style={[
                styles.viewTab,
                selected && {
                  backgroundColor: item.color,
                },
              ]}
            >
              <Text style={styles.viewTabText}>{item.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {loading ? (
        <Text style={styles.muted}>Loading tasks...</Text>
      ) : filteredTasks.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Nothing here</Text>

          <Text style={styles.muted}>This view has no tasks yet.</Text>
        </View>
      ) : (
        <View style={styles.taskList}>
          {filteredTasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              onToggle={() => handleToggle(task)}
              onDelete={() => handleDelete(task.id)}
              onPress={() =>
                router.push({
                  pathname: "/(app)/service/tasks/[taskId]",
                  params: { taskId: String(task.id) },
                })
              }
            />
          ))}
        </View>
      )}
    </ScrollView>
  );
}
type TaskRowProps = {
  task: Task;

  onToggle: () => void;
  onDelete: () => void;
  onPress: () => void;
};

function TaskRow({ task, onToggle, onDelete, onPress }: TaskRowProps) {
  const completed = !!task.completed;

  return (
    <View style={styles.taskWrapper}>
      <View style={styles.taskShadow} />

      <View style={styles.task}>
        <Pressable
          onPress={onToggle}
          hitSlop={8}
          style={[styles.checkbox, completed && styles.checkboxCompleted]}
        >
          {completed && (
            <Check size={17} strokeWidth={3} color={colors.foreground} />
          )}
        </Pressable>

        <Pressable onPress={onPress} style={styles.taskContent}>
          <Text style={[styles.taskTitle, completed && styles.completedTitle]}>
            {task.title}
          </Text>

          {task.priority !== "normal" && (
            <Text style={styles.taskMeta}>{task.priority.toUpperCase()}</Text>
          )}
        </Pressable>

        <Pressable onPress={onDelete} hitSlop={8} style={styles.deleteButton}>
          <Trash2 size={19} color={colors.destructive} />
        </Pressable>
      </View>
    </View>
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
    alignItems: "center",
    gap: 16,
  },

  headerText: {
    flex: 1,
  },

  eyebrow: {
    ...typography.label,
    color: colors.muted,
  },

  title: {
    ...typography.h1,
    color: colors.foreground,
  },

  addSection: {
    gap: 14,
  },

  summaryWrapper: {
    position: "relative",
  },

  summaryShadow: {
    position: "absolute",
    left: 6,
    top: 6,

    width: "100%",
    height: "100%",

    backgroundColor: colors.foreground,

    borderRadius: 8,
  },

  summary: {
    minHeight: 130,

    padding: 20,

    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",

    backgroundColor: colors.yellow,

    borderWidth: 2,
    borderColor: colors.foreground,
    borderRadius: 8,
  },

  summaryLabel: {
    ...typography.label,
    color: colors.foreground,
  },

  summaryValue: {
    fontFamily: "SpaceGrotesk_500Medium",
    fontSize: 38,
    lineHeight: 44,

    color: colors.foreground,
  },

  summaryStats: {
    flexDirection: "row",
    gap: 24,
  },

  statValue: {
    ...typography.h2,
    textAlign: "center",
    color: colors.foreground,
  },

  statLabel: {
    ...typography.muted,
    color: colors.foreground,
  },

  viewTabs: {
    gap: 10,
    paddingRight: 20,
  },

  viewTab: {
    minHeight: 40,

    paddingHorizontal: 16,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: colors.white,

    borderWidth: 2,
    borderColor: colors.foreground,
    borderRadius: 8,
  },

  viewTabText: {
    ...typography.button,
    color: colors.foreground,
  },

  section: {
    gap: 14,
  },

  sectionTitle: {
    ...typography.h3,
    color: colors.foreground,
  },

  taskList: {
    gap: 14,
  },

  taskWrapper: {
    position: "relative",
  },

  taskShadow: {
    position: "absolute",

    left: 4,
    top: 4,

    width: "100%",
    height: "100%",

    backgroundColor: colors.foreground,

    borderRadius: 8,
  },

  task: {
    minHeight: 68,

    flexDirection: "row",
    alignItems: "center",

    gap: 12,
    padding: 14,

    backgroundColor: colors.white,

    borderWidth: 2,
    borderColor: colors.foreground,
    borderRadius: 8,
  },

  checkbox: {
    width: 28,
    height: 28,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: colors.white,

    borderWidth: 2,
    borderColor: colors.foreground,
    borderRadius: 6,
  },

  checkboxCompleted: {
    backgroundColor: colors.green,
  },

  taskContent: {
    flex: 1,
    gap: 2,
  },

  taskTitle: {
    ...typography.body,
    color: colors.foreground,
  },

  taskMeta: {
    ...typography.label,
    color: colors.muted,
  },

  completedTitle: {
    color: colors.muted,
    textDecorationLine: "line-through",
  },

  deleteButton: {
    width: 38,
    height: 38,

    alignItems: "center",
    justifyContent: "center",
  },

  empty: {
    alignItems: "center",

    paddingVertical: 40,

    gap: 6,
  },

  emptyTitle: {
    ...typography.h3,
    color: colors.foreground,
  },

  muted: {
    ...typography.muted,
    color: colors.muted,
  },
});
