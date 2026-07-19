import React, { useState, useEffect, useRef } from "react";
import { StyleSheet, View, Text, FlatList, Modal, TextInput, ScrollView, Vibration } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { fonts } from "../styles/fonts";
import ToggleSwitch from "../components/core/ToggleSwitch";
import MetroTouchable from "../components/core/MetroTouchable";
import TimePicker from "../components/core/TimePicker";
import AddAlarmBottomBar from "../components/compound/AddAlarmBottomBar";

const STORAGE_KEY = '@metro_alarms';
const ACCENT = '#0078D7';
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOUR_VALUES = ['12', '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11'];
const MINUTE_VALUES = new Array(60).fill(0).map((_, i) => String(i).padStart(2, '0'));
const AMPM_VALUES = ['AM', 'PM'];
const SNOOZE_MINUTES = 5;

// Alarms are stored with numeric hour24/minute so triggering never depends on
// string formatting. Older builds stored { time: '08:00', ampm: 'AM', state }.
const migrateAlarm = (a) => {
  if (typeof a.hour24 === 'number' && typeof a.minute === 'number') {
    return { repeat: [], ...a };
  }
  const match = typeof a.time === 'string' && a.time.match(/^(\d{1,2}):(\d{1,2})$/);
  if (!match) return null;
  let hour24 = parseInt(match[1], 10) % 12;
  if (a.ampm === 'PM') hour24 += 12;
  return {
    id: a.id,
    hour24,
    minute: parseInt(match[2], 10),
    enabled: a.state !== false,
    name: a.name || 'Alarm',
    repeat: a.repeat || [],
  };
};

const formatTime = (hour24, minute) => {
  const h = hour24 % 12 || 12;
  return `${h}:${String(minute).padStart(2, '0')}`;
};

// While the app is foregrounded the in-app ringing overlay handles the alarm,
// so scheduled notifications shouldn't also alert.
try {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: false,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
} catch (e) { }

const formatRepeat = (repeat) => {
  if (!repeat || repeat.length === 0) return 'only once';
  if (repeat.length === 7) return 'every day';
  if (repeat.length === 5 && !repeat.includes('Sat') && !repeat.includes('Sun')) return 'weekdays';
  return DAYS.filter(d => repeat.includes(d)).map(d => d.toLowerCase()).join(', ');
};

export default function AlarmMain({ navigation }) {
  const [alarms, setAlarms] = useState([]);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [ringingAlarm, setRingingAlarm] = useState(null);

  // Editor state (add + edit share the modal)
  const [isEditorVisible, setEditorVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [draftHour24, setDraftHour24] = useState(8);
  const [draftMinute, setDraftMinute] = useState(0);
  const [draftName, setDraftName] = useState('Alarm');
  const [draftRepeat, setDraftRepeat] = useState([]);

  // Which alarm+minute combos already rang, and the pending snooze target.
  const firedRef = useRef(new Set());
  const snoozeRef = useRef(null);
  const alarmsRef = useRef(alarms);
  alarmsRef.current = alarms;
  const ringingRef = useRef(ringingAlarm);
  ringingRef.current = ringingAlarm;

  useEffect(() => {
    const loadAlarms = async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved !== null) {
          setAlarms(JSON.parse(saved).map(migrateAlarm).filter(Boolean));
        }
      } catch (e) { }
      setHasLoaded(true);
    };
    loadAlarms();
  }, []);

  useEffect(() => {
    if (hasLoaded) {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(alarms));
    }
  }, [alarms, hasLoaded]);

  // Notification permission + Android alarm channel. Guarded: the native
  // module is missing in builds prebuilt before expo-notifications was added.
  useEffect(() => {
    const setup = async () => {
      try {
        await Notifications.requestPermissionsAsync();
        await Notifications.setNotificationChannelAsync('alarms', {
          name: 'Alarms',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [500, 1000, 500, 1000],
        });
      } catch (e) { }
    };
    setup();
  }, []);

  // Mirror the alarm list into OS-scheduled notifications so alarms also ring
  // when the app is backgrounded or closed. All notifications belong to this
  // screen, so cancel-all + reschedule keeps them in sync without ID
  // bookkeeping. Runs are chained so a rapid toggle can't interleave.
  const syncChainRef = useRef(Promise.resolve());
  useEffect(() => {
    if (!hasLoaded) return;
    const resync = async () => {
      try {
        await Notifications.cancelAllScheduledNotificationsAsync();
        for (const alarm of alarms) {
          if (!alarm.enabled) continue;
          const content = {
            title: alarm.name,
            body: `${formatTime(alarm.hour24, alarm.minute)} ${alarm.hour24 >= 12 ? 'PM' : 'AM'}`,
            sound: true,
            data: { alarmId: alarm.id },
          };
          if (alarm.repeat.length === 0) {
            const next = new Date();
            next.setHours(alarm.hour24, alarm.minute, 0, 0);
            if (next.getTime() <= Date.now()) next.setDate(next.getDate() + 1);
            await Notifications.scheduleNotificationAsync({
              content,
              trigger: { channelId: 'alarms', date: next },
            });
          } else {
            for (const day of alarm.repeat) {
              await Notifications.scheduleNotificationAsync({
                content,
                trigger: {
                  channelId: 'alarms',
                  weekday: DAYS.indexOf(day) + 1,
                  hour: alarm.hour24,
                  minute: alarm.minute,
                  repeats: true,
                },
              });
            }
          }
        }
        // Re-add a pending snooze — the cancel-all above just cleared it.
        // A snooze dies with its alarm: skip it if the alarm was disabled or deleted.
        const snooze = snoozeRef.current;
        if (snooze && !alarms.find(a => a.id === snooze.alarm.id && a.enabled)) {
          snoozeRef.current = null;
        } else if (snooze && snooze.date.getTime() > Date.now()) {
          await Notifications.scheduleNotificationAsync({
            content: { title: snooze.alarm.name, body: 'Snoozed alarm', sound: true, data: { alarmId: snooze.alarm.id } },
            trigger: { channelId: 'alarms', date: snooze.date },
          });
        }
      } catch (e) { }
    };
    syncChainRef.current = syncChainRef.current.then(resync);
  }, [alarms, hasLoaded]);

  // A one-time alarm that rang in the background stays enabled in storage;
  // turn it off when the user opens its notification.
  useEffect(() => {
    let sub = null;
    try {
      sub = Notifications.addNotificationResponseReceivedListener((response) => {
        const alarmId = response?.notification?.request?.content?.data?.alarmId;
        const alarm = alarmsRef.current.find(a => a.id === alarmId);
        if (alarm && alarm.repeat.length === 0) {
          setAlarms(prev => prev.map(a => a.id === alarmId ? { ...a, enabled: false } : a));
        }
      });
    } catch (e) { }
    return () => { if (sub) sub.remove(); };
  }, []);

  // In-app trigger loop for the foreground ringing overlay (vibration +
  // snooze/dismiss). Background ringing is covered by the scheduled
  // notifications above.
  useEffect(() => {
    const checkAlarms = () => {
      if (ringingRef.current) return;
      const now = new Date();
      const h = now.getHours();
      const m = now.getMinutes();
      const day = DAYS[now.getDay()];

      const snooze = snoozeRef.current;
      if (snooze && snooze.hour24 === h && snooze.minute === m) {
        snoozeRef.current = null;
        const stillArmed = alarmsRef.current.find(a => a.id === snooze.alarm.id && a.enabled);
        if (stillArmed) {
          setRingingAlarm(snooze.alarm);
          Vibration.vibrate([500, 1000, 500, 1000], true);
        }
        return;
      }

      const triggered = alarmsRef.current.find(a =>
        a.enabled &&
        a.hour24 === h &&
        a.minute === m &&
        (a.repeat.length === 0 || a.repeat.includes(day)) &&
        !firedRef.current.has(`${a.id}@${h}:${m}`)
      );

      if (triggered) {
        if (firedRef.current.size > 100) firedRef.current.clear();
        firedRef.current.add(`${triggered.id}@${h}:${m}`);
        setRingingAlarm(triggered);
        Vibration.vibrate([500, 1000, 500, 1000], true);
      }
    };
    const interval = setInterval(checkAlarms, 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleAlarm = (id) => {
    setAlarms(prev => prev.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a));
  };

  const deleteAlarm = (id) => {
    setAlarms(prev => prev.filter(a => a.id !== id));
  };

  const openAdd = () => {
    setEditingId(null);
    setDraftHour24(8);
    setDraftMinute(0);
    setDraftName('Alarm');
    setDraftRepeat([]);
    setEditorVisible(true);
  };

  const openEdit = (alarm) => {
    setEditingId(alarm.id);
    setDraftHour24(alarm.hour24);
    setDraftMinute(alarm.minute);
    setDraftName(alarm.name);
    setDraftRepeat(alarm.repeat);
    setEditorVisible(true);
  };

  const handleSave = () => {
    const draft = {
      hour24: draftHour24,
      minute: draftMinute,
      enabled: true,
      name: draftName.trim() || 'Alarm',
      repeat: draftRepeat,
    };
    if (editingId) {
      setAlarms(prev => prev.map(a => a.id === editingId ? { ...a, ...draft } : a));
    } else {
      setAlarms(prev => [...prev, { id: Date.now().toString(), ...draft }]);
    }
    setEditorVisible(false);
  };

  const toggleDraftDay = (day) => {
    setDraftRepeat(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  };

  const dismissAlarm = () => {
    Vibration.cancel();
    const alarm = ringingAlarm;
    if (alarm && alarm.repeat.length === 0) {
      // One-time alarms turn off once they've rung; repeating ones stay armed.
      setAlarms(prev => prev.map(a => a.id === alarm.id ? { ...a, enabled: false } : a));
    }
    setRingingAlarm(null);
  };

  const snoozeAlarm = () => {
    Vibration.cancel();
    const alarm = ringingAlarm;
    if (alarm) {
      const target = new Date(Date.now() + SNOOZE_MINUTES * 60 * 1000);
      snoozeRef.current = { alarm, date: target, hour24: target.getHours(), minute: target.getMinutes() };
      // Also ring if the app gets backgrounded during the snooze window.
      Notifications.scheduleNotificationAsync({
        content: { title: alarm.name, body: 'Snoozed alarm', sound: true, data: { alarmId: alarm.id } },
        trigger: { channelId: 'alarms', date: target },
      }).catch(() => { });
    }
    setRingingAlarm(null);
  };

  // The draft hour picker works in 12-hour units; AM/PM is a separate picker.
  const draftHour12Index = draftHour24 % 12;
  const draftIsPm = draftHour24 >= 12;
  const setDraftHour12 = (index) => setDraftHour24(index + (draftIsPm ? 12 : 0));
  const setDraftAmpm = (index) => setDraftHour24((draftHour24 % 12) + (index === 1 ? 12 : 0));

  const renderItem = ({ item }) => (
    <MetroTouchable
      style={styles.itemContainer}
      onPress={() => openEdit(item)}
      onLongPress={() => deleteAlarm(item.id)}
    >
      <View style={styles.itemRow}>
        <View style={itemStyles.infoContainer}>
          <Text style={[itemStyles.time, fonts.extraLight, !item.enabled && itemStyles.dimmed]}>
            {formatTime(item.hour24, item.minute)}
            <Text style={itemStyles.ampm}> {item.hour24 >= 12 ? 'PM' : 'AM'}</Text>
          </Text>
          <Text style={[itemStyles.name, fonts.regular, !item.enabled && itemStyles.dimmed]}>
            {item.name}
          </Text>
          <Text style={[itemStyles.repeat, fonts.light, !item.enabled && itemStyles.dimmed]}>
            {formatRepeat(item.repeat)}
          </Text>
        </View>
        <View style={itemStyles.toggleSwitch}>
          <ToggleSwitch
            isOn={item.enabled}
            onToggle={() => toggleAlarm(item.id)}
            toggleOnColor={ACCENT}
          />
        </View>
      </View>
    </MetroTouchable>
  );

  return (
    <View style={styles.container}>
      <FlatList
        contentContainerStyle={styles.list}
        data={alarms}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          hasLoaded ? <Text style={[styles.emptyText, fonts.light]}>tap + to add an alarm</Text> : null
        }
      />
      <View style={styles.bottomBarContainer}>
        <AddAlarmBottomBar navigation={navigation} methods={{ addAlarm: openAdd }} />
      </View>

      {/* Add / Edit Alarm. Mounted only while open so the TimePickers pick up
          the current draft as their initial selection. */}
      {isEditorVisible && (
      <Modal visible={isEditorVisible} animationType="slide" transparent={false} onRequestClose={() => setEditorVisible(false)}>
        <ScrollView style={modalStyles.container} contentContainerStyle={modalStyles.content}>
          <Text style={[modalStyles.title, fonts.regular]}>
            {editingId ? 'EDIT ALARM' : 'ADD AN ALARM'}
          </Text>

          <View style={modalStyles.pickerRow}>
            <TimePicker
              values={HOUR_VALUES}
              unit="h"
              initialSelectedIndex={draftHour12Index}
              selectionColor={ACCENT}
              activeTextColor="white"
              squareCount={3}
              onValueChange={setDraftHour12}
            />
            <TimePicker
              values={MINUTE_VALUES}
              unit="m"
              initialSelectedIndex={draftMinute}
              selectionColor={ACCENT}
              activeTextColor="white"
              squareCount={3}
              onValueChange={(index) => setDraftMinute(index)}
            />
            <TimePicker
              values={AMPM_VALUES}
              initialSelectedIndex={draftIsPm ? 1 : 0}
              selectionColor={ACCENT}
              activeTextColor="white"
              squareCount={3}
              onValueChange={setDraftAmpm}
            />
          </View>

          <Text style={[modalStyles.fieldLabel, fonts.light]}>name</Text>
          <TextInput
            style={[modalStyles.nameInput, fonts.regular]}
            value={draftName}
            onChangeText={setDraftName}
            placeholder="Alarm"
            placeholderTextColor="#888"
          />

          <Text style={[modalStyles.fieldLabel, fonts.light]}>repeats</Text>
          <View style={modalStyles.dayRow}>
            {DAYS.map(day => {
              const active = draftRepeat.includes(day);
              return (
                <MetroTouchable
                  key={day}
                  style={[modalStyles.dayChip, active && modalStyles.dayChipActive]}
                  onPress={() => toggleDraftDay(day)}
                >
                  <Text style={[modalStyles.dayChipText, fonts.regular, active && modalStyles.dayChipTextActive]}>
                    {day.toLowerCase()}
                  </Text>
                </MetroTouchable>
              );
            })}
          </View>

          <View style={modalStyles.buttonRow}>
            <MetroTouchable style={modalStyles.actionButton} onPress={handleSave}>
              <Text style={[modalStyles.actionText, fonts.regular]}>save</Text>
            </MetroTouchable>
            <MetroTouchable style={modalStyles.actionButton} onPress={() => setEditorVisible(false)}>
              <Text style={[modalStyles.actionText, fonts.regular]}>cancel</Text>
            </MetroTouchable>
          </View>
        </ScrollView>
      </Modal>
      )}

      {/* Ringing overlay */}
      {ringingAlarm && (
        <View style={styles.ringingOverlay}>
          <Text style={[styles.ringingName, fonts.regular]}>{ringingAlarm.name}</Text>
          <Text style={[styles.ringingTime, fonts.extraLight]}>
            {formatTime(ringingAlarm.hour24, ringingAlarm.minute)}
            <Text style={styles.ringingAmpm}> {ringingAlarm.hour24 >= 12 ? 'PM' : 'AM'}</Text>
          </Text>

          <View style={styles.ringingButtons}>
            <MetroTouchable style={styles.ringingButton} onPress={snoozeAlarm}>
              <Text style={[styles.ringingButtonText, fonts.regular]}>snooze</Text>
            </MetroTouchable>
            <MetroTouchable style={styles.ringingButton} onPress={dismissAlarm}>
              <Text style={[styles.ringingButtonText, fonts.regular]}>dismiss</Text>
            </MetroTouchable>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "black", marginTop: 25 },
  list: { paddingBottom: 100 },
  emptyText: { color: '#888', fontSize: 18, marginStart: 20, marginTop: 30 },
  itemContainer: { marginStart: 20, marginBottom: 25 },
  itemRow: { flexDirection: "row", width: "100%" },
  bottomBarContainer: { width: "100%", position: 'absolute', bottom: 0 },

  ringingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#004A87', justifyContent: 'center', alignItems: 'center', zIndex: 100 },
  ringingName: { color: 'white', fontSize: 24, letterSpacing: 2, marginBottom: 10 },
  ringingTime: { color: 'white', fontSize: 96, includeFontPadding: false },
  ringingAmpm: { fontSize: 30 },
  ringingButtons: { flexDirection: 'row', marginTop: 50 },
  ringingButton: { borderColor: 'white', borderWidth: 2, paddingHorizontal: 30, paddingVertical: 12, marginHorizontal: 10 },
  ringingButtonText: { color: 'white', fontSize: 18 },
});

const itemStyles = StyleSheet.create({
  infoContainer: { flex: 2 },
  time: { color: "white", fontSize: 48, marginBottom: -5, includeFontPadding: false },
  ampm: { fontSize: 18 },
  name: { color: "#ccc", fontSize: 16 },
  repeat: { color: "#888", fontSize: 14 },
  dimmed: { color: '#555' },
  toggleSwitch: { flexDirection: "row", flex: 1, justifyContent: 'flex-end', margin: 16, marginRight: 40 },
});

const modalStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  content: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 40 },
  title: { color: 'white', fontSize: 18, letterSpacing: 2, marginBottom: 20 },
  pickerRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 20 },
  fieldLabel: { color: '#888', fontSize: 16, marginBottom: 5 },
  nameInput: { color: 'white', fontSize: 24, borderBottomWidth: 2, borderBottomColor: '#333', paddingVertical: 8, marginBottom: 30 },
  dayRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 40 },
  dayChip: { borderWidth: 2, borderColor: '#333', paddingHorizontal: 10, paddingVertical: 8, marginRight: 8, marginBottom: 8 },
  dayChipActive: { backgroundColor: ACCENT, borderColor: ACCENT },
  dayChipText: { color: '#888', fontSize: 14 },
  dayChipTextActive: { color: 'white' },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between' },
  actionButton: { flex: 1, alignItems: 'center', padding: 16, marginHorizontal: 5, backgroundColor: '#222' },
  actionText: { color: 'white', fontSize: 18 },
});
