import { useCallback, useMemo, useRef, useState } from "react";

import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { router, useFocusEffect } from "expo-router";

import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
} from "lucide-react-native";

import { Button } from "@/src/components/ui/Button";
import { Input } from "@/src/components/ui/Input";
import {
  type CalendarEvent,
  type CalendarTask,
  createEvent,
  deleteEvent,
  getEventsForRange,
  getTasksForRange,
} from "@/src/features/calendar/calendarRepository";

import { colors, typography } from "@/src/theme";

export default function CalendarScreen() {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const [selectedDate, setSelectedDate] = useState(new Date());

  const [events, setEvents] = useState<CalendarEvent[]>([]);

  const [tasks, setTasks] = useState<CalendarTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [eventTitle, setEventTitle] = useState("");
  const [eventDescription, setEventDescription] = useState("");
  const [eventTime, setEventTime] = useState("09:00");
  const [allDay, setAllDay] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const requestId = useRef(0);

  const monthStart = useMemo(() => {
    return new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  }, [currentMonth]);

  const monthEnd = useMemo(() => {
    return new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
  }, [currentMonth]);

  const loadMonth = useCallback(async () => {
    const request = ++requestId.current;
    setLoading(true);
    try {
      const [eventResult, taskResult] = await Promise.all([
        getEventsForRange(monthStart.toISOString(), monthEnd.toISOString()),
        getTasksForRange(monthStart.toISOString(), monthEnd.toISOString()),
      ]);
      if (request !== requestId.current) return;
      setEvents(eventResult);
      setTasks(taskResult);
      setError(null);
    } catch (loadError) {
      console.warn("Unable to load calendar", loadError);
      if (request === requestId.current) {
        setEvents([]);
        setTasks([]);
        setError("Calendar could not be loaded. Please try again.");
      }
    } finally {
      if (request === requestId.current) setLoading(false);
    }
  }, [monthStart, monthEnd]);

  const monthDays = useMemo(() => getMonthDays(currentMonth), [currentMonth]);
  const selectedDayStart = startOfDay(selectedDate);

  const selectedDayEnd = endOfDay(selectedDate);

  const selectedTasks = tasks.filter((task) => {
    const due = new Date(task.due_at);

    return due >= selectedDayStart && due < selectedDayEnd;
  });

  const selectedEvents = events.filter((event) => {
    return eventOccursOnDay(event, selectedDayStart, selectedDayEnd);
  });
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  useFocusEffect(
    useCallback(() => {
      void loadMonth();
      return () => {
        requestId.current += 1;
      };
    }, [loadMonth]),
  );

  function changeMonth(offset: number) {
    const nextMonth = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() + offset,
      1,
    );
    const lastDay = new Date(
      nextMonth.getFullYear(),
      nextMonth.getMonth() + 1,
      0,
    ).getDate();
    requestId.current += 1;
    setEvents([]);
    setTasks([]);
    setLoading(true);
    setCurrentMonth(nextMonth);
    setSelectedDate(
      new Date(
        nextMonth.getFullYear(),
        nextMonth.getMonth(),
        Math.min(selectedDate.getDate(), lastDay),
      ),
    );
  }

  function goToToday() {
    const today = new Date();
    requestId.current += 1;
    setEvents([]);
    setTasks([]);
    setLoading(true);
    setCurrentMonth(today);
    setSelectedDate(today);
  }

  function openCreate() {
    setEventTitle("");
    setEventDescription("");
    setEventTime("09:00");
    setAllDay(false);
    setFormError(null);
    setCreateOpen(true);
  }

  async function saveEvent() {
    const title = eventTitle.trim();
    if (!title || saving) {
      setFormError("Add an event title.");
      return;
    }
    const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(eventTime.trim());
    if (!allDay && !match) {
      setFormError("Enter time in 24-hour HH:MM format.");
      return;
    }
    const start = new Date(selectedDate);
    start.setHours(
      allDay ? 0 : Number(match?.[1]),
      allDay ? 0 : Number(match?.[2]),
      0,
      0,
    );
    const end = new Date(start);
    if (allDay) end.setDate(end.getDate() + 1);
    else end.setHours(end.getHours() + 1);

    setSaving(true);
    setFormError(null);
    try {
      await createEvent({
        title,
        description: eventDescription.trim() || null,
        startsAt: start.toISOString(),
        endsAt: end.toISOString(),
        allDay,
      });
      setCreateOpen(false);
      await loadMonth();
    } catch (saveError) {
      console.warn("Unable to create calendar event", saveError);
      setFormError("Event could not be saved. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function confirmDeleteEvent(event: CalendarEvent) {
    const remove = async () => {
      try {
        await deleteEvent(event.id);
        setSelectedEvent(null);
        await loadMonth();
      } catch (deleteError) {
        console.warn("Unable to delete calendar event", deleteError);
        setSelectedEvent(null);
        setError("Event could not be deleted. Please try again.");
      }
    };
    if (Platform.OS === "web") {
      if (globalThis.confirm(`Delete “${event.title}”?`)) void remove();
      return;
    }
    Alert.alert("Delete event?", `Delete “${event.title}”?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => void remove() },
    ]);
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.screen}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={() => router.back()}
            style={styles.iconButton}
          >
            <ArrowLeft size={20} color={colors.foreground} />
          </Pressable>

          <View style={styles.headerText}>
            <Text style={styles.eyebrow}>ORGANIZE</Text>

            <Text style={styles.title}>Calendar</Text>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add event"
            onPress={openCreate}
            style={styles.iconButton}
          >
            <Plus size={20} color={colors.foreground} />
          </Pressable>
        </View>

        <View style={styles.monthHeader}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Previous month"
            onPress={() => changeMonth(-1)}
            style={styles.monthButton}
          >
            <ChevronLeft size={20} color={colors.foreground} />
          </Pressable>

          <Text style={styles.monthTitle}>
            {currentMonth.toLocaleDateString(undefined, {
              month: "long",
              year: "numeric",
            })}
          </Text>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Next month"
            onPress={() => changeMonth(1)}
            style={styles.monthButton}
          >
            <ChevronRight size={20} color={colors.foreground} />
          </Pressable>
        </View>

        <View style={styles.calendarCard}>
          <View style={styles.weekHeader}>
            {weekDays.map((day) => (
              <Text key={day} style={styles.weekDay}>
                {day}
              </Text>
            ))}
          </View>

          <View style={styles.daysGrid}>
            {monthDays.map((date, index) => {
              if (!date) {
                return <View key={`empty-${index}`} style={styles.dayCell} />;
              }

              const selected = isSameDay(date, selectedDate);

              const today = isSameDay(date, new Date());

              const dayStart = startOfDay(date);

              const dayEnd = endOfDay(date);

              const dayHasTasks = tasks.some((task) => {
                const due = new Date(task.due_at);

                return due >= dayStart && due < dayEnd;
              });

              const dayHasEvents = events.some((event) =>
                eventOccursOnDay(event, dayStart, dayEnd),
              );

              return (
                <Pressable
                  key={date.toISOString()}
                  accessibilityRole="button"
                  accessibilityLabel={date.toLocaleDateString(undefined, {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })}
                  accessibilityState={{ selected }}
                  onPress={() => setSelectedDate(date)}
                  style={[styles.dayCell, selected && styles.dayCellSelected]}
                >
                  <Text
                    style={[
                      styles.dayNumber,

                      today && styles.todayNumber,

                      selected && styles.selectedDayNumber,
                    ]}
                  >
                    {date.getDate()}
                  </Text>

                  <View style={styles.indicatorRow}>
                    {dayHasTasks && (
                      <View
                        style={[
                          styles.indicator,
                          {
                            backgroundColor: colors.pink,
                          },
                        ]}
                      />
                    )}

                    {dayHasEvents && (
                      <View
                        style={[
                          styles.indicator,
                          {
                            backgroundColor: colors.blue,
                          },
                        ]}
                      />
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
        <View style={styles.selectedDayHeader}>
          <View style={styles.selectedDayCopy}>
            <Text style={styles.selectedDayLabel}>SELECTED DAY</Text>

            <Text style={styles.selectedDayTitle}>
              {selectedDate.toLocaleDateString(undefined, {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </Text>
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={goToToday}
            style={styles.todayButton}
          >
            <Text style={styles.todayButtonText}>Today</Text>
          </Pressable>
        </View>
        <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View
                style={[
                  styles.legendDot,
                  {
                    backgroundColor: colors.pink,
                  },
                ]}
              />

              <Text style={styles.legendText}>Task</Text>
            </View>

            <View style={styles.legendItem}>
              <View
                style={[
                  styles.legendDot,
                  {
                    backgroundColor: colors.blue,
                  },
                ]}
              />

              <Text style={styles.legendText}>Event</Text>
            </View>
        </View>
        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
            <Button size="small" variant="outline" onPress={() => void loadMonth()}>
              Retry
            </Button>
          </View>
        )}
        {loading && <ActivityIndicator color={colors.foreground} />}
        {!loading && selectedTasks.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tasks</Text>

            <View style={styles.itemList}>
              {selectedTasks.map((task) => (
                <Pressable
                  key={`task-${task.id}`}
                  accessibilityRole="button"
                  accessibilityLabel={`Open task ${task.title}`}
                  onPress={() =>
                    router.push({
                      pathname: "/(app)/service/tasks/[taskId]",
                      params: {
                        taskId: String(task.id),
                      },
                    })
                  }
                  style={styles.calendarItem}
                >
                  <View
                    style={[
                      styles.itemAccent,
                      {
                        backgroundColor: colors.pink,
                      },
                    ]}
                  />

                  <View style={styles.itemContent}>
                    <Text style={styles.itemTitle}>{task.title}</Text>

                    <Text style={styles.itemMeta}>
                      {new Date(task.due_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                  </View>

                  {task.completed ? (
                    <Text style={styles.completedLabel}>Done</Text>
                  ) : null}
                </Pressable>
              ))}
            </View>
          </View>
        )}
        {!loading && selectedEvents.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Events</Text>

            <View style={styles.itemList}>
              {selectedEvents.map((event) => (
                <Pressable
                  key={`event-${event.id}`}
                  accessibilityRole="button"
                  accessibilityLabel={`View ${event.title}`}
                  onPress={() => setSelectedEvent(event)}
                  style={styles.calendarItem}
                >
                  <View
                    style={[
                      styles.itemAccent,
                      {
                        backgroundColor: colors.blue,
                      },
                    ]}
                  />

                  <View style={styles.itemContent}>
                    <Text style={styles.itemTitle}>{event.title}</Text>

                    <Text style={styles.itemMeta}>
                      {event.all_day
                        ? "All day"
                        : new Date(event.starts_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        )}
        {!loading && !error && selectedTasks.length === 0 && selectedEvents.length === 0 && (
          <View style={styles.emptyDay}>
            <Text style={styles.emptyDayTitle}>Nothing planned</Text>

            <Text style={styles.emptyDayText}>This day is completely free.</Text>
          </View>
        )}
      </ScrollView>

      <Modal
        visible={createOpen}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!saving) setCreateOpen(false);
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalBackdrop}
        >
          <Pressable
            accessibilityLabel="Close event form"
            onPress={() => {
              if (!saving) setCreateOpen(false);
            }}
            style={styles.modalDismiss}
          />
          <ScrollView
            style={styles.modalSheet}
            contentContainerStyle={styles.modalContent}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
          >
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.eyebrow}>NEW EVENT</Text>
                <Text style={styles.modalTitle}>Plan your day</Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close"
                onPress={() => setCreateOpen(false)}
                disabled={saving}
                style={styles.iconButton}
              >
                <X size={20} color={colors.foreground} />
              </Pressable>
            </View>
            <Text style={styles.modalDate}>
              {selectedDate.toLocaleDateString(undefined, {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </Text>
            <Input
              label="Title"
              accessibilityLabel="Event title"
              value={eventTitle}
              onChangeText={(value) => {
                setEventTitle(value);
                setFormError(null);
              }}
              placeholder="What are you planning?"
              autoFocus
            />
            <Input
              label="Notes"
              accessibilityLabel="Event notes"
              value={eventDescription}
              onChangeText={setEventDescription}
              placeholder="Optional details"
              multiline
            />
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: allDay }}
              onPress={() => setAllDay((value) => !value)}
              style={[styles.allDayOption, allDay && styles.allDaySelected]}
            >
              <Text style={styles.allDayText}>All day</Text>
              <Text style={styles.allDayText}>{allDay ? "✓" : "○"}</Text>
            </Pressable>
            {!allDay && (
              <Input
                label="Start time (24-hour HH:MM)"
                accessibilityLabel="Event start time"
                value={eventTime}
                onChangeText={(value) => {
                  setEventTime(value);
                  setFormError(null);
                }}
                placeholder="09:00"
                keyboardType="numbers-and-punctuation"
                maxLength={5}
              />
            )}
            <Text style={styles.modalHint}>
              {allDay ? "Runs until the next day." : "Events last one hour."}
            </Text>
            {formError && (
              <Text accessibilityLiveRegion="polite" style={styles.formError}>
                {formError}
              </Text>
            )}
            <Button variant="accent" onPress={() => void saveEvent()} loading={saving}>
              Save event
            </Button>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={selectedEvent !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedEvent(null)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable
            accessibilityLabel="Close event details"
            onPress={() => setSelectedEvent(null)}
            style={styles.modalDismiss}
          />
          {selectedEvent && (
            <View style={[styles.modalSheet, styles.modalContent]}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{selectedEvent.title}</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Close"
                  onPress={() => setSelectedEvent(null)}
                  style={styles.iconButton}
                >
                  <X size={20} color={colors.foreground} />
                </Pressable>
              </View>
              <Text style={styles.modalDate}>
                {new Date(selectedEvent.starts_at).toLocaleString(undefined, {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  hour: selectedEvent.all_day ? undefined : "2-digit",
                  minute: selectedEvent.all_day ? undefined : "2-digit",
                })}
                {selectedEvent.all_day ? " · All day" : ""}
              </Text>
              {selectedEvent.description && (
                <Text style={styles.eventDescription}>
                  {selectedEvent.description}
                </Text>
              )}
              <Button
                variant="destructive"
                onPress={() => confirmDeleteEvent(selectedEvent)}
              >
                Delete event
              </Button>
            </View>
          )}
        </View>
      </Modal>
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
    paddingTop: 24,
    paddingBottom: 48,
    gap: 24,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
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

  monthHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  monthButton: {
    width: 40,
    height: 40,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: colors.white,

    borderWidth: 2,
    borderColor: colors.foreground,
    borderRadius: 8,
  },

  monthTitle: {
    ...typography.h2,
    color: colors.foreground,
  },

  placeholder: {
    padding: 24,

    alignItems: "center",

    gap: 6,

    backgroundColor: colors.yellow,

    borderWidth: 2,
    borderColor: colors.foreground,
    borderRadius: 8,
  },

  placeholderTitle: {
    ...typography.h3,
    color: colors.foreground,
  },

  placeholderText: {
    ...typography.muted,
    color: colors.foreground,
  },

  calendarCard: {
    padding: 12,

    backgroundColor:
      colors.white,

    borderWidth: 2,
    borderColor:
      colors.foreground,
    borderRadius: 8,
  },

  weekHeader: {
    flexDirection: 'row',

    marginBottom: 8,
  },

  weekDay: {
    width: '14.2857%',

    textAlign: 'center',

    ...typography.label,

    color: colors.muted,
  },

  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },

  dayCell: {
    width: '14.2857%',
    aspectRatio: 0.9,

    alignItems: 'center',
    justifyContent: 'center',

    gap: 5,

    borderRadius: 6,
  },

  dayCellSelected: {
    backgroundColor:
      colors.yellow,

    borderWidth: 2,
    borderColor:
      colors.foreground,
  },

  dayNumber: {
    ...typography.body,
    color: colors.foreground,
  },

  todayNumber: {
    fontFamily:
      'SpaceGrotesk_700Bold',
  },

  selectedDayNumber: {
    fontFamily:
      'SpaceGrotesk_700Bold',
  },

  indicatorRow: {
    minHeight: 6,

    flexDirection: 'row',

    gap: 3,
  },

  indicator: {
    width: 6,
    height: 6,

    borderRadius: 999,
  },

  selectedDayHeader: {
    flexDirection: 'row',
    justifyContent:
      'space-between',
    alignItems: 'flex-end',

    gap: 12,
  },

  selectedDayCopy: { flex: 1, minWidth: 0 },

  selectedDayLabel: {
    ...typography.label,
    color: colors.muted,
  },

  selectedDayTitle: {
    ...typography.h3,
    color: colors.foreground,

    marginTop: 2,
  },

  legend: {
    flexDirection: "row",
    gap: 14,
  },

  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  legendDot: {
    width: 8,
    height: 8,

    borderRadius: 999,
  },

  legendText: {
    ...typography.muted,
    color: colors.muted,
  },

  section: {
    gap: 12,
  },

  sectionTitle: {
    ...typography.h3,
    color: colors.foreground,
  },

  itemList: {
    gap: 10,
  },

  calendarItem: {
    minHeight: 66,

    flexDirection: 'row',
    alignItems: 'center',

    overflow: 'hidden',

    backgroundColor:
      colors.white,

    borderWidth: 2,
    borderColor:
      colors.foreground,
    borderRadius: 8,
  },

  itemAccent: {
    width: 8,
    alignSelf: 'stretch',
  },

  itemContent: {
    flex: 1,

    paddingHorizontal: 12,
    paddingVertical: 10,
  },

  itemTitle: {
    ...typography.body,
    color: colors.foreground,
  },

  itemMeta: {
    ...typography.muted,
    color: colors.muted,

    marginTop: 2,
  },

  completedLabel: {
    ...typography.label,

    marginRight: 12,

    color: colors.green,
  },

  emptyDay: {
    paddingVertical: 30,

    alignItems: 'center',

    gap: 4,
  },

  emptyDayTitle: {
    ...typography.h4,
    color: colors.foreground,
  },

  emptyDayText: {
    ...typography.muted,
    color: colors.muted,
  },

  todayButton: {
    minHeight: 34,
    paddingHorizontal: 10,
    justifyContent: "center",
    backgroundColor: colors.yellow,
    borderWidth: 2,
    borderColor: colors.foreground,
    borderRadius: 8,
  },
  todayButtonText: { ...typography.muted, color: colors.foreground },
  errorBanner: {
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    backgroundColor: colors.pink,
    borderWidth: 2,
    borderColor: colors.foreground,
    borderRadius: 8,
  },
  errorText: { ...typography.muted, flex: 1, color: colors.foreground },
  modalBackdrop: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "rgba(26, 26, 26, 0.5)",
  },
  modalDismiss: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  modalSheet: {
    maxHeight: "85%",
    width: "100%",
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: colors.foreground,
    borderRadius: 8,
  },
  modalContent: { padding: 18, gap: 16 },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  modalTitle: { ...typography.h2, flexShrink: 1, color: colors.foreground },
  modalDate: { ...typography.body, color: colors.foreground },
  modalHint: { ...typography.muted, color: colors.muted },
  formError: { ...typography.muted, color: colors.destructive },
  allDayOption: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.foreground,
    borderRadius: 8,
  },
  allDaySelected: { backgroundColor: colors.green },
  allDayText: { ...typography.button, color: colors.foreground },
  eventDescription: { ...typography.body, color: colors.foreground },
});
function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function endOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
}

function eventOccursOnDay(event: CalendarEvent, dayStart: Date, dayEnd: Date) {
  const start = new Date(event.starts_at);
  if (start >= dayEnd) return false;
  if (!event.ends_at) return start >= dayStart;
  const end = new Date(event.ends_at);
  return Number.isFinite(end.getTime()) && end > dayStart;
}

function getMonthDays(month: Date) {
  const year = month.getFullYear();
  const monthIndex = month.getMonth();

  const firstDay = new Date(year, monthIndex, 1);

  const lastDay = new Date(year, monthIndex + 1, 0);

  const result: (Date | null)[] = [];

  const leadingEmptyDays = firstDay.getDay();

  for (let i = 0; i < leadingEmptyDays; i++) {
    result.push(null);
  }

  for (let day = 1; day <= lastDay.getDate(); day++) {
    result.push(new Date(year, monthIndex, day));
  }

  while (result.length % 7 !== 0) {
    result.push(null);
  }

  return result;
}
