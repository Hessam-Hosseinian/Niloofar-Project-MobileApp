import { useState } from "react";
import {
  type AccessibilityActionEvent,
  type GestureResponderEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { formatPlaybackTime } from "@/src/features/music/utils/duration";
import { colors, radius, spacing, typography } from "@/src/theme";

type PlaybackProgressProps = {
  currentTime: number;
  duration: number;
  disabled?: boolean;
  onSeek: (seconds: number) => void;
};

export function PlaybackProgress({
  currentTime,
  duration,
  disabled = false,
  onSeek,
}: PlaybackProgressProps) {
  const [trackWidth, setTrackWidth] = useState(0);
  const usableDuration = Number.isFinite(duration) ? Math.max(duration, 0) : 0;
  const usableTime = Number.isFinite(currentTime)
    ? Math.min(Math.max(currentTime, 0), usableDuration || currentTime)
    : 0;
  const progress = usableDuration > 0 ? usableTime / usableDuration : 0;
  const canSeek = !disabled && usableDuration > 0;

  function handlePress(event: GestureResponderEvent) {
    if (!canSeek || trackWidth <= 0) {
      return;
    }

    const ratio = Math.min(
      Math.max(event.nativeEvent.locationX / trackWidth, 0),
      1,
    );
    onSeek(ratio * usableDuration);
  }

  function handleAccessibilityAction(event: AccessibilityActionEvent) {
    if (!canSeek) {
      return;
    }

    const delta = event.nativeEvent.actionName === "increment" ? 10 : -10;
    onSeek(usableTime + delta);
  }

  return (
    <View style={styles.container}>
      <Pressable
        accessibilityRole="adjustable"
        accessibilityLabel="Playback position"
        accessibilityState={{ disabled: !canSeek }}
        accessibilityValue={{
          min: 0,
          max: Math.round(usableDuration),
          now: Math.round(usableTime),
          text: `${formatPlaybackTime(usableTime)} of ${formatPlaybackTime(usableDuration)}`,
        }}
        accessibilityActions={[
          { name: "increment", label: "Seek forward 10 seconds" },
          { name: "decrement", label: "Seek backward 10 seconds" },
        ]}
        disabled={!canSeek}
        onAccessibilityAction={handleAccessibilityAction}
        onPress={handlePress}
        onLayout={(event) => setTrackWidth(event.nativeEvent.layout.width)}
        style={styles.touchTarget}
      >
        <View style={[styles.track, !canSeek && styles.trackDisabled]}>
          <View style={[styles.fill, { width: `${progress * 100}%` }]} />
          {canSeek && (
            <View
              pointerEvents="none"
              style={[styles.thumb, { left: `${progress * 100}%` }]}
            />
          )}
        </View>
      </Pressable>

      <View style={styles.times}>
        <Text style={styles.time}>{formatPlaybackTime(usableTime)}</Text>
        <Text style={styles.time}>{formatPlaybackTime(usableDuration)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  touchTarget: {
    minHeight: 44,
    justifyContent: "center",
  },
  track: {
    height: 10,
    position: "relative",
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: colors.foreground,
    borderRadius: radius.pill,
  },
  trackDisabled: {
    opacity: 0.55,
  },
  fill: {
    height: "100%",
    backgroundColor: colors.green,
    borderRadius: radius.pill,
  },
  thumb: {
    position: "absolute",
    top: -6,
    width: 18,
    height: 18,
    marginLeft: -9,
    backgroundColor: colors.yellow,
    borderWidth: 2,
    borderColor: colors.foreground,
    borderRadius: 9,
  },
  times: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  time: {
    ...typography.muted,
    fontVariant: ["tabular-nums"],
    color: colors.muted,
  },
});
