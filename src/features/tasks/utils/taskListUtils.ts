import type { Task, TaskPriority } from "./tasksRepository";

export type TaskView =
  | "all"
  | "inbox"
  | "today"
  | "important"
  | "upcoming"
  | "overdue"
  | "completed";

export type TaskSortMode =
  | "default"
  | "dueDate"
  | "priority"
  | "newest"
  | "oldest";

export const taskSortOptions: { key: TaskSortMode; label: string }[] = [
  { key: "default", label: "Default" },
  { key: "dueDate", label: "Due date" },
  { key: "priority", label: "Priority" },
  { key: "newest", label: "Newest" },
  { key: "oldest", label: "Oldest" },
];

const priorityRank: Record<TaskPriority, number> = {
  urgent: 4,
  high: 3,
  normal: 2,
  low: 1,
};

function getTimestamp(value: string | null) {
  if (!value) {
    return null;
  }

  const timestamp = new Date(value).getTime();

  return Number.isFinite(timestamp) ? timestamp : null;
}

export function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function getLocalDayKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getTomorrowDayKey(date = new Date()) {
  return getLocalDayKey(new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1));
}

export function isTaskOverdue(task: Task, now = new Date()) {
  const dueTimestamp = getTimestamp(task.due_at);

  return (
    !task.completed &&
    dueTimestamp !== null &&
    dueTimestamp < now.getTime()
  );
}

function matchesView(task: Task, view: TaskView, now: Date) {
  if (view === "all") {
    return !task.completed;
  }

  if (view === "inbox") {
    return !task.completed && !task.due_at && (!task.planned_day || task.planned_day < getLocalDayKey(now));
  }

  if (view === "completed") {
    return !!task.completed;
  }

  if (view === "important") {
    return !task.completed && (task.priority === "urgent" || task.priority === "high");
  }

  if (view === "today") {
    const dueTimestamp = getTimestamp(task.due_at);
    return !task.completed && (
      task.planned_day === getLocalDayKey(now) ||
      (dueTimestamp !== null && dueTimestamp < now.getTime()) ||
      (dueTimestamp !== null && isSameDay(new Date(dueTimestamp), now))
    );
  }

  const dueTimestamp = getTimestamp(task.due_at);

  if (
    view === "upcoming" &&
    task.planned_day &&
    task.planned_day > getLocalDayKey(now) &&
    (dueTimestamp === null || (dueTimestamp > now.getTime() && !isSameDay(new Date(dueTimestamp), now)))
  ) {
    return !task.completed;
  }

  if (dueTimestamp === null) {
    return false;
  }

  const dueDate = new Date(dueTimestamp);

  if (view === "overdue") {
    return isTaskOverdue(task, now);
  }

  return (
    !task.completed &&
    dueTimestamp > now.getTime() &&
    !isSameDay(dueDate, now)
  );
}

function compareNullableTimestamps(
  a: string | null,
  b: string | null,
  direction: "asc" | "desc",
) {
  const aTimestamp = getTimestamp(a);
  const bTimestamp = getTimestamp(b);

  if (aTimestamp === null && bTimestamp === null) {
    return 0;
  }

  if (aTimestamp === null) {
    return 1;
  }

  if (bTimestamp === null) {
    return -1;
  }

  return direction === "asc"
    ? aTimestamp - bTimestamp
    : bTimestamp - aTimestamp;
}

export function filterAndSortTasks(
  tasks: Task[],
  view: TaskView,
  sortMode: TaskSortMode,
  now = new Date(),
) {
  const filtered = tasks.filter((task) => matchesView(task, view, now));

  if (sortMode === "default") {
    if (view === "important") {
      return filtered.sort((a, b) => priorityRank[b.priority] - priorityRank[a.priority]);
    }
    if (view === "today") {
      return filtered.sort((a, b) => {
        const overdue = Number(isTaskOverdue(b, now)) - Number(isTaskOverdue(a, now));
        return overdue || priorityRank[b.priority] - priorityRank[a.priority];
      });
    }
    return filtered;
  }

  return filtered.sort((a, b) => {
    if (sortMode === "dueDate") {
      return compareNullableTimestamps(a.due_at, b.due_at, "asc");
    }

    if (sortMode === "priority") {
      return priorityRank[b.priority] - priorityRank[a.priority];
    }

    return compareNullableTimestamps(
      a.created_at,
      b.created_at,
      sortMode === "newest" ? "desc" : "asc",
    );
  });
}
