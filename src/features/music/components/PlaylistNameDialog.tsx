import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Modal, Platform, StyleSheet, Text, View } from "react-native";

import { Button } from "@/src/components/ui/Button";
import { Input } from "@/src/components/ui/Input";
import { colors, radius, spacing, typography } from "@/src/theme";

type Props = {
  visible: boolean;
  title: string;
  initialName?: string;
  onSave: (name: string) => Promise<void>;
  onClose: () => void;
};

export function PlaylistNameDialog({ visible, title, initialName = "", onSave, onClose }: Props) {
  const [name, setName] = useState(initialName);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setName(initialName);
      setError(null);
    }
  }, [initialName, visible]);

  const save = () => {
    if (busy) return;
    setBusy(true);
    void onSave(name)
      .then(() => setError(null))
      .catch((caught: unknown) => {
        setError(caught instanceof Error ? caught.message : "Could not save playlist.");
      })
      .finally(() => setBusy(false));
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.overlay}
      >
        <View style={styles.card}>
          <Text accessibilityRole="header" style={styles.title}>{title}</Text>
          <Input
            label="Playlist name"
            value={name}
            onChangeText={setName}
            maxLength={80}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={save}
            error={error ?? undefined}
          />
          <View style={styles.actions}>
            <Button variant="outline" disabled={busy} onPress={onClose}>Cancel</Button>
            <Button variant="accent" loading={busy} onPress={save}>Save</Button>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    padding: spacing.xl,
    backgroundColor: "rgba(26, 26, 26, 0.55)",
  },
  card: {
    gap: spacing.xl,
    padding: spacing.xl,
    borderWidth: 2,
    borderColor: colors.foreground,
    borderRadius: radius.sm,
    backgroundColor: colors.background,
  },
  title: { ...typography.h2, color: colors.foreground },
  actions: { flexDirection: "row", justifyContent: "flex-end", gap: spacing.sm },
});
