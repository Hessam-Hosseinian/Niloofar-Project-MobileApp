import { useState } from "react";
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { X } from "lucide-react-native";
import { colors, typography } from "@/src/theme";
import { Habit, HabitDraft } from "./habitsRepository";

const palette = [colors.green, colors.yellow, colors.pink, colors.purple, colors.blue, colors.orange];
const starters = [
  { title: "Read", target: 10, unit: "pages", color: colors.purple },
  { title: "Move", target: 20, unit: "minutes", color: colors.green },
  { title: "Drink water", target: 8, unit: "glasses", color: colors.blue },
  { title: "Meditate", target: 5, unit: "minutes", color: colors.yellow },
];
const weekdays = ["S", "M", "T", "W", "T", "F", "S"];
const defaultDraft: HabitDraft = {
  title: "", color: colors.green, cue: null, weekdays: 127,
  target_count: 1, unit: "times", reminder_time: null,
};

export function HabitFormModal({ habit, onClose, onSave }: {
  habit?: Habit | null;
  onClose: () => void;
  onSave: (draft: HabitDraft) => Promise<void>;
}) {
  const [title, setTitle] = useState(habit?.title || "");
  const [cue, setCue] = useState(habit?.cue || "");
  const [color, setColor] = useState(habit?.color || defaultDraft.color);
  const [days, setDays] = useState(habit?.weekdays ?? 127);
  const [target, setTarget] = useState(String(habit?.target_count || 1));
  const [unit, setUnit] = useState(habit?.unit || "times");
  const [reminder, setReminder] = useState(!!habit?.reminder_time);
  const [time, setTime] = useState(habit?.reminder_time || "09:00");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function save() {
    const count = Number(target);
    if (!title.trim()) return setError("Give this habit a name.");
    if (!days) return setError("Choose at least one day.");
    if (!Number.isInteger(count) || count < 1 || count > 999) return setError("Goal must be between 1 and 999.");
    if (reminder && !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) return setError("Use 24-hour time, for example 09:00.");
    setError("");
    setBusy(true);
    try {
      await onSave({
        title: title.trim(), cue: cue.trim() || null, color, weekdays: days,
        target_count: count, unit: unit.trim() || "times", reminder_time: reminder ? time : null,
      });
    } catch {
      setError("Could not save this habit. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaProvider>
        <SafeAreaView edges={["top", "bottom", "left", "right"]} style={styles.screen}>
          <KeyboardAvoidingView style={styles.screen} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
          <View style={styles.top}>
            <View><Text style={styles.eyebrow}>MAKE IT YOURS</Text><Text style={styles.title}>{habit ? "Edit habit" : "New habit"}</Text></View>
            <Pressable onPress={onClose} accessibilityLabel="Close habit form" style={styles.close}><X size={22} color={colors.foreground} /></Pressable>
          </View>
          {!habit && <>
            <Text style={styles.label}>Start with an idea</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.starters}>
              {starters.map((starter) => <Pressable key={starter.title} onPress={() => {
                setTitle(starter.title); setTarget(String(starter.target)); setUnit(starter.unit); setColor(starter.color);
              }} style={[styles.starter, { backgroundColor: starter.color }]} accessibilityLabel={`Use ${starter.title} starter`}>
                <Text style={styles.starterText}>{starter.title}</Text>
              </Pressable>)}
            </ScrollView>
          </>}
          <Text style={styles.label}>What do you want to do?</Text>
          <TextInput value={title} onChangeText={setTitle} placeholder="e.g. Read a book" maxLength={70} style={styles.input} placeholderTextColor={colors.muted} accessibilityLabel="Habit name" />
          <Text style={styles.label}>After what cue? <Text style={styles.optional}>optional</Text></Text>
          <TextInput value={cue} onChangeText={setCue} placeholder="e.g. After breakfast" maxLength={100} style={styles.input} placeholderTextColor={colors.muted} accessibilityLabel="Habit cue" />
          <Text style={styles.label}>Choose a color</Text>
          <View style={styles.row}>{palette.map((item) => <Pressable key={item} onPress={() => setColor(item)} accessibilityLabel={`Color ${item}`} accessibilityState={{ selected: item === color }} style={[styles.color, { backgroundColor: item }, item === color && styles.selectedColor]} />)}</View>
          <Text style={styles.label}>Repeat on</Text>
          <View style={styles.row}>{weekdays.map((label, index) => <Pressable key={index} onPress={() => setDays(days ^ (1 << index))} accessibilityLabel={["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][index]} accessibilityState={{ selected: !!(days & (1 << index)) }} style={[styles.weekday, !!(days & (1 << index)) && styles.weekdayOn]}><Text style={styles.weekdayText}>{label}</Text></Pressable>)}</View>
          <Pressable onPress={() => setDays(127)} style={styles.inlineLink}><Text style={styles.linkText}>Every day</Text></Pressable>
          <Text style={styles.label}>Daily goal</Text>
          <View style={styles.row}>
            <TextInput value={target} onChangeText={setTarget} keyboardType="number-pad" maxLength={3} style={[styles.input, styles.numberInput]} accessibilityLabel="Daily target" />
            <TextInput value={unit} onChangeText={setUnit} placeholder="times" maxLength={20} style={[styles.input, styles.unitInput]} placeholderTextColor={colors.muted} accessibilityLabel="Unit" />
          </View>
          <View style={styles.reminderRow}><View><Text style={styles.label}>Reminder</Text><Text style={styles.hint}>A gentle nudge on scheduled days</Text></View><Switch value={reminder} onValueChange={setReminder} trackColor={{ true: colors.green }} /></View>
          {reminder && <><Text style={styles.label}>Time (24-hour)</Text><TextInput value={time} onChangeText={setTime} placeholder="09:00" keyboardType="numbers-and-punctuation" maxLength={5} style={styles.input} accessibilityLabel="Reminder time" /><Text style={styles.hint}>Available in installed app builds; notification permission is required.</Text></>}
          {!!error && <Text style={styles.error}>{error}</Text>}
          <Pressable onPress={save} disabled={busy} accessibilityRole="button" style={[styles.save, busy && styles.disabled]}><Text style={styles.saveText}>{busy ? "Saving…" : habit ? "Save changes" : "Create habit"}</Text></Pressable>
        </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  content: { padding: 24, paddingBottom: 48, gap: 10 },
  top: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  starters: { gap: 8, paddingVertical: 3 },
  starter: { paddingHorizontal: 13, paddingVertical: 9, borderWidth: 2, borderColor: colors.foreground, borderRadius: 10 },
  starterText: { fontWeight: "700", color: colors.foreground },
  eyebrow: { ...typography.label, color: colors.muted },
  title: { ...typography.h1, color: colors.foreground },
  close: { width: 40, height: 40, borderWidth: 2, borderColor: colors.foreground, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: colors.white },
  label: { ...typography.label, color: colors.foreground, marginTop: 12 },
  optional: { color: colors.muted },
  input: { height: 50, backgroundColor: colors.white, borderWidth: 2, borderColor: colors.foreground, borderRadius: 12, paddingHorizontal: 14, fontSize: 16, color: colors.foreground },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  color: { width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: colors.foreground },
  selectedColor: { borderWidth: 4, transform: [{ scale: 1.12 }] },
  weekday: { flex: 1, height: 42, borderRadius: 10, borderWidth: 2, borderColor: colors.foreground, backgroundColor: colors.white, alignItems: "center", justifyContent: "center" },
  weekdayOn: { backgroundColor: colors.yellow },
  weekdayText: { fontWeight: "800", color: colors.foreground },
  inlineLink: { alignSelf: "flex-start", paddingVertical: 4 },
  linkText: { color: colors.foreground, textDecorationLine: "underline", fontWeight: "700" },
  numberInput: { width: 84, textAlign: "center" },
  unitInput: { flex: 1 },
  reminderRow: { marginTop: 10, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  hint: { fontSize: 12, color: colors.muted },
  error: { color: colors.destructive, fontWeight: "700", marginTop: 6 },
  save: { marginTop: 20, backgroundColor: colors.green, borderWidth: 2, borderColor: colors.foreground, borderRadius: 14, padding: 16, alignItems: "center" },
  saveText: { fontSize: 17, fontWeight: "800", color: colors.foreground },
  disabled: { opacity: 0.5 },
});
