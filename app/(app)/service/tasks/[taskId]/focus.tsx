import { useCallback, useEffect, useRef, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  AppState,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { router, useLocalSearchParams } from "expo-router";

import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ArrowLeft, Pause, Play, RotateCcw } from "lucide-react-native";

import {
  completeFocusSession,
  createFocusSession,
  discardFocusSession,
} from "@/src/features/tasks/focusRepository";

import { getTaskById, type Task } from "@/src/features/tasks/tasksRepository";

import { colors, typography } from "@/src/theme";

const focusPresets = [
  {
    label: "15 min",
    seconds: 15 * 60,
  },
  {
    label: "25 min",
    seconds: 25 * 60,
  },
  {
    label: "50 min",
    seconds: 50 * 60,
  },
];

export default function FocusScreen() {
  const insets = useSafeAreaInsets();
  const { taskId } = useLocalSearchParams<{
    taskId: string;
  }>();

  const id = Number(taskId);
  const validId = Number.isInteger(id) && id > 0;

  const [task, setTask] = useState<Task | null>(null);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">(
    validId ? "loading" : "error",
  );
  const [error, setError] = useState<string | null>(null);

  const [duration, setDuration] = useState(25 * 60);

  const [secondsLeft, setSecondsLeft] = useState(25 * 60);

  const [running, setRunning] = useState(false);
  const [starting, setStarting] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [completed, setCompleted] = useState(false);

  const sessionId = useRef<number | null>(null);
  const secondsLeftRef = useRef(duration);
  const deadlineRef = useRef<number | null>(null);
  const startPendingRef = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    let active = true;
    if (!validId) return;
    void getTaskById(id)
      .then((result) => {
        if (!active) return;
        setTask(result);
        setLoadState(result ? "ready" : "error");
      })
      .catch((loadError) => {
        console.warn("Unable to load focus task", loadError);
        if (active) setLoadState("error");
      });
    return () => {
      active = false;
    };
  }, [id, validId]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      const currentSessionId = sessionId.current;
      sessionId.current = null;
      if (currentSessionId) {
        void discardFocusSession(currentSessionId).catch((discardError) => {
          console.warn("Unable to discard focus session", discardError);
        });
      }
    };
  }, []);

  const finishSession = useCallback(async () => {
    setRunning(false);
    deadlineRef.current = null;
    const currentSessionId = sessionId.current;
    sessionId.current = null;
    setSessionStarted(false);
    try {
      if (currentSessionId) {
        await completeFocusSession(currentSessionId, duration);
      }
      if (mountedRef.current) {
        setCompleted(true);
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (saveError) {
      console.warn("Unable to save focus session", saveError);
      if (mountedRef.current) {
        setError("The session ended, but its result could not be saved.");
      }
    }
  }, [duration]);

  const updateClock = useCallback(() => {
    if (deadlineRef.current === null) return;
    const next = Math.max(0, Math.ceil((deadlineRef.current - Date.now()) / 1000));
    secondsLeftRef.current = next;
    setSecondsLeft(next);
    if (next === 0) void finishSession();
  }, [finishSession]);

  useEffect(() => {
    if (!running) return;
    const interval = setInterval(updateClock, 1000);
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") updateClock();
    });
    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [running, updateClock]);

  async function start() {
    if (running || startPendingRef.current) return;
    startPendingRef.current = true;
    setStarting(true);
    setError(null);
    if (secondsLeftRef.current === 0) {
      secondsLeftRef.current = duration;
      setSecondsLeft(duration);
      setCompleted(false);
    }
    try {
      if (!sessionId.current) {
        const createdId = await createFocusSession(id);
        if (!mountedRef.current) {
          await discardFocusSession(createdId);
          return;
        }
        sessionId.current = createdId;
        setSessionStarted(true);
      }
      deadlineRef.current = Date.now() + secondsLeftRef.current * 1000;
      setRunning(true);
      void Haptics.selectionAsync();
    } catch (startError) {
      console.warn("Unable to start focus session", startError);
      if (mountedRef.current) {
        setError("Could not start this session. Please try again.");
      }
    } finally {
      startPendingRef.current = false;
      if (mountedRef.current) setStarting(false);
    }
  }

  function pause() {
    if (deadlineRef.current !== null) {
      secondsLeftRef.current = Math.max(0, Math.ceil((deadlineRef.current - Date.now()) / 1000));
      setSecondsLeft(secondsLeftRef.current);
    }
    if (secondsLeftRef.current === 0) {
      void finishSession();
      return;
    }
    deadlineRef.current = null;
    setRunning(false);
    void Haptics.selectionAsync();
  }

  async function reset() {
    setRunning(false);
    deadlineRef.current = null;
    const currentSessionId = sessionId.current;
    sessionId.current = null;
    setSessionStarted(false);
    secondsLeftRef.current = duration;
    setSecondsLeft(duration);
    setCompleted(false);
    setError(null);
    if (currentSessionId) {
      try {
        await discardFocusSession(currentSessionId);
      } catch (discardError) {
        console.warn("Unable to discard focus session", discardError);
        setError("Could not clear the previous session.");
      }
    }
  }

  function leaveSession() {
    deadlineRef.current = null;
    setRunning(false);
    const currentSessionId = sessionId.current;
    sessionId.current = null;
    if (currentSessionId) {
      void discardFocusSession(currentSessionId).catch((discardError) => {
        console.warn("Unable to discard focus session", discardError);
      });
    }
    router.back();
  }

  function handleBack() {
    if (!sessionId.current) {
      leaveSession();
      return;
    }
    const message = "Leaving now will discard this focus session.";
    if (Platform.OS === "web") {
      if (globalThis.confirm(message)) leaveSession();
      return;
    }
    Alert.alert("Leave focus?", message, [
      { text: "Keep focusing", style: "cancel" },
      { text: "Leave", style: "destructive", onPress: leaveSession },
    ]);
  }

  const minutes = Math.floor(secondsLeft / 60);

  const seconds = secondsLeft % 60;

  const progress = 1 - secondsLeft / duration;

  if (loadState !== "ready" || !task) {
    return (
      <View
        style={[
          styles.screen,
          styles.fallback,
          { paddingTop: 24 },
        ]}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={handleBack}
          style={styles.iconButton}
        >
          <ArrowLeft size={22} color={colors.foreground} />
        </Pressable>
        {loadState === "loading" ? (
          <ActivityIndicator size="large" color={colors.foreground} />
        ) : (
          <Text style={styles.fallbackText}>This task is no longer available.</Text>
        )}
      </View>
    );
  }

  return (
    <View
      style={[
        styles.screen,
        {
          paddingTop: 24,
          paddingBottom: Math.max(insets.bottom + 20, 32),
        },
      ]}
    >
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Leave focus session"
          disabled={starting}
          onPress={handleBack}
          style={styles.iconButton}
        >
          <ArrowLeft size={22} color={colors.foreground} />
        </Pressable>

        <Text style={styles.headerLabel}>FOCUS MODE</Text>

        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.center}>
        <Text style={styles.taskLabel}>WORKING ON</Text>

        <Text style={styles.taskTitle} numberOfLines={3}>
          {task.title}
        </Text>
        <View style={styles.presets}>
          {focusPresets.map((preset) => {
            const selected = duration === preset.seconds;

            return (
              <Pressable
                key={preset.seconds}
                accessibilityRole="radio"
                accessibilityState={{
                  selected,
                  disabled: running || sessionStarted || starting,
                }}
                disabled={running || sessionStarted || starting}
                onPress={() => {
                  setDuration(preset.seconds);

                  setSecondsLeft(preset.seconds);
                  secondsLeftRef.current = preset.seconds;
                  setCompleted(false);
                }}
                style={[
                  styles.preset,
                  selected && styles.presetSelected,
                  (running || sessionStarted || starting) && styles.presetDisabled,
                ]}
              >
                <Text style={styles.presetText}>{preset.label}</Text>
              </Pressable>
            );
          })}
        </View>
        <View style={styles.timerWrapper}>
          <View style={styles.timerShadow} />

          <View style={styles.timer}>
            <Text style={styles.timerText}>
              {String(minutes).padStart(2, "0")}:
              {String(seconds).padStart(2, "0")}
            </Text>

            <Text style={styles.timerCaption}>
              {completed
                ? "Session complete"
                : running
                  ? "Stay focused"
                  : sessionStarted
                    ? "Paused"
                    : "Ready when you are"}
            </Text>
          </View>
        </View>

        <View
          accessibilityRole="progressbar"
          accessibilityValue={{ min: 0, max: 100, now: Math.round(progress * 100) }}
          style={styles.progressTrack}
        >
          <View
            style={[
              styles.progressFill,
              {
                width: `${progress * 100}%`,
              },
            ]}
          />
        </View>

        {error && (
          <Text accessibilityLiveRegion="polite" style={styles.errorText}>
            {error}
          </Text>
        )}
        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={running ? "Pause focus timer" : "Start focus timer"}
            disabled={starting}
            onPress={running ? pause : start}
            style={[styles.primaryAction, starting && styles.presetDisabled]}
          >
            {starting ? (
              <ActivityIndicator color={colors.foreground} />
            ) : running ? (
              <Pause size={28} color={colors.foreground} />
            ) : (
              <Play size={28} color={colors.foreground} />
            )}

            <Text style={styles.actionText}>
              {running
                ? "Pause"
                : starting
                  ? "Starting"
                  : completed
                    ? "Start again"
                    : sessionStarted
                      ? "Resume"
                      : "Start"}
            </Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Reset focus timer"
            disabled={starting}
            onPress={() => void reset()}
            style={styles.secondaryAction}
          >
            <RotateCcw size={22} color={colors.foreground} />

            <Text style={styles.actionText}>Reset</Text>
          </Pressable>
        </View>
        {sessionStarted && (
          <Text style={styles.sessionHint}>
            Reset or leave to discard this session.
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,

    paddingHorizontal: 20,

    backgroundColor: colors.background,
  },

  fallback: {
    gap: 40,
    alignItems: "flex-start",
  },

  fallbackText: {
    ...typography.h3,
    color: colors.foreground,
  },

  errorText: {
    ...typography.muted,
    color: colors.destructive,
    textAlign: "center",
  },

  sessionHint: {
    ...typography.muted,
    color: colors.muted,
    textAlign: "center",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  headerLabel: {
    ...typography.label,
    color: colors.foreground,
  },

  headerSpacer: {
    width: 44,
  },

  iconButton: {
    width: 44,
    height: 44,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: colors.white,

    borderWidth: 2,
    borderColor: colors.foreground,
    borderRadius: 8,
  },

  center: {
    flex: 1,

    justifyContent: "center",

    gap: 24,
  },

  taskLabel: {
    ...typography.label,

    textAlign: "center",

    color: colors.muted,
  },

  taskTitle: {
    ...typography.h2,

    textAlign: "center",

    color: colors.foreground,
  },

  timerWrapper: {
    position: "relative",
  },

  timerShadow: {
    position: "absolute",

    left: 8,
    top: 8,

    width: "100%",
    height: "100%",

    backgroundColor: colors.foreground,

    borderRadius: 8,
  },

  timer: {
    minHeight: 220,

    alignItems: "center",
    justifyContent: "center",

    gap: 6,

    backgroundColor: colors.yellow,

    borderWidth: 2,
    borderColor: colors.foreground,
    borderRadius: 8,
  },

  timerText: {
    fontFamily: "SpaceGrotesk_500Medium",

    fontSize: 58,
    lineHeight: 68,

    color: colors.foreground,
  },

  timerCaption: {
    ...typography.body,

    color: colors.foreground,
  },

  progressTrack: {
    height: 14,

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

  actions: {
    flexDirection: "row",
    gap: 14,
  },

  primaryAction: {
    flex: 1,

    minHeight: 64,

    flexDirection: "row",

    alignItems: "center",
    justifyContent: "center",

    gap: 8,

    backgroundColor: colors.green,

    borderWidth: 2,
    borderColor: colors.foreground,
    borderRadius: 8,
  },

  secondaryAction: {
    minWidth: 110,

    flexDirection: "row",

    alignItems: "center",
    justifyContent: "center",

    gap: 8,

    backgroundColor: colors.white,

    borderWidth: 2,
    borderColor: colors.foreground,
    borderRadius: 8,
  },

  actionText: {
    ...typography.button,

    color: colors.foreground,
  },
  presets: {
    flexDirection: "row",
    gap: 10,
  },

  preset: {
    flex: 1,
    minHeight: 44,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: colors.white,

    borderWidth: 2,
    borderColor: colors.foreground,
    borderRadius: 8,
  },

  presetSelected: {
    backgroundColor: colors.purple,
  },

  presetDisabled: {
    opacity: 0.5,
  },

  presetText: {
    ...typography.button,
    color: colors.foreground,
  },
});
