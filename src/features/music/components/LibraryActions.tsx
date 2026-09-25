import { FolderPlus, ScanSearch } from "lucide-react-native";
import { Platform, StyleSheet, Text, View } from "react-native";

import { Button } from "@/src/components/ui/Button";
import { colors, spacing, typography } from "@/src/theme";

type Props = {
  busy: "scan" | "import" | null;
  message: string | null;
  error: string | null;
  onScan: () => void;
  onImport: () => void;
};

export function LibraryActions({ busy, message, error, onScan, onImport }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.actions}>
        {Platform.OS === "android" && (
          <Button
            variant="accent"
            loading={busy === "scan"}
            disabled={busy !== null}
            onPress={onScan}
            leftIcon={<ScanSearch size={18} color={colors.foreground} />}
            style={styles.button}
          >Scan phone</Button>
        )}
        <Button
          variant="secondary"
          loading={busy === "import"}
          disabled={busy !== null}
          onPress={onImport}
          leftIcon={<FolderPlus size={18} color={colors.foreground} />}
          style={styles.button}
        >Import files</Button>
      </View>
      {Platform.OS === "ios" && (
        <Text style={styles.helper}>Choose your audio files from Files to keep them in Niloofar.</Text>
      )}
      {message && <Text accessibilityRole="alert" style={styles.message}>{message}</Text>}
      {error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  button: { flexGrow: 1 },
  helper: { ...typography.muted, color: colors.muted },
  message: { ...typography.muted, color: colors.foreground },
  error: { ...typography.muted, color: colors.destructive },
});
