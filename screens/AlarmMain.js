import React, { useState, useEffect, useRef } from "react";
import { StyleSheet, View, Text, FlatList, Modal, NativeModules, Platform, Vibration } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Audio } from 'expo-av';
import { fonts } from "../styles/fonts";
import { useSettings } from "../context/SettingsContext";
import MetroTouchable from "../components/core/MetroTouchable";
import AddAlarmBottomBar from "../components/compound/AddAlarmBottomBar";
import AlarmListItem from "../components/compound/AlarmListItem";
import AlarmEditorPage from "./alarm/AlarmEditorPage";
import { TimePickerPage, RepeatsPage } from "./alarm/AlarmSubPages";
import { DEFAULT_RINGTONE, getRingtone } from "../data/ringtones";
import RingtoneScreen from "./RingtoneScreen";

const STORAGE_KEY = '@metro_alarms';
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const SNOOZE_MINUTES = 5;
const nativeAlarm = Platform.OS === 'android' ? NativeModules.MetroAlarm : null;

// Alarms are stored with numeric hour24/minute so triggering never depends on
// string formatting. Older builds stored { time: '08:00', ampm: 'AM', state }.
const migrateAlarm = (a) => {
  if (typeof a.hour24 === 'number' && typeof a.minute === 'number') {
    return { name: 'Alarm', repeat: [], sound: DEFAULT_RINGTONE, ...a };
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
    sound: a.sound || DEFAULT_RINGTONE,
    snooze: a.snooze !== false,
  };
};

const formatTime = (hour24, minute, use24Hour) => {
  if (use24Hour) {
    return `${String(hour24).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  }
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
  const { settings } = useSettings();
  const [alarms, setAlarms] = useState([]);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [ringingAlarm, setRingingAlarm] = useState(null);

  // Editor state (add + edit share the modal)
  const [isEditorVisible, setEditorVisible] = useState(false);
  const [subPage, setSubPage] = useState(null); // null | 'time' | 'repeats'
  const [showRingtoneSheet, setShowRingtoneSheet] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [draftHour24, setDraftHour24] = useState(8);
  const [draftMinute, setDraftMinute] = useState(0);
  const [draftName, setDraftName] = useState('Alarm');
  const [draftRepeat, setDraftRepeat] = useState([]);
  const [draftSound, setDraftSound] = useState(DEFAULT_RINGTONE);
  const [draftSnooze, setDraftSnooze] = useState(true);

  // Which alarm+minute combos already rang, and the pending snooze target.
  const firedRef = useRef(new Set());
  const snoozeRef = useRef(null);
  const alarmsRef = useRef(alarms);
  alarmsRef.current = alarms;
  const ringingRef = useRef(ringingAlarm);
  ringingRef.current = ringingAlarm;
  const soundRef = useRef(null);
  const previewRef = useRef(null);

  // Configure audio so alarms play even when the phone is in silent mode.
  useEffect(() => {
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: false,
    }).catch(() => { });
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => { });
        soundRef.current = null;
      }
    };
  }, []);

  const stopRingtone = async () => {
    if (soundRef.current) {
      try { await soundRef.current.stopAsync(); } catch (e) { }
      try { await soundRef.current.unloadAsync(); } catch (e) { }
      soundRef.current = null;
    }
  };

  const stopPreview = async () => {
    if (previewRef.current) {
      try { await previewRef.current.stopAsync(); } catch (e) { }
      try { await previewRef.current.unloadAsync(); } catch (e) { }
      previewRef.current = null;
    }
  };

  const playPreview = async (soundId) => {
    await stopPreview();
    try {
      const { sound } = await Audio.Sound.createAsync(
        getRingtone(soundId).module,
        { isLooping: false, volume: 1.0, shouldPlay: true },
      );
      previewRef.current = sound;
      setTimeout(() => { stopPreview(); }, 3000);
    } catch (e) {}
  };

  const playRingtone = async (soundId) => {
    try {
      await stopRingtone();
      const { sound } = await Audio.Sound.createAsync(
        getRingtone(soundId).module,
        { isLooping: true, volume: 1.0, shouldPlay: true },
      );
      soundRef.current = sound;
    } catch (e) { }
  };

  // Play/stop the looping ringtone alongside the ringing overlay.
  useEffect(() => {
    if (ringingAlarm) {
      playRingtone(ringingAlarm.sound);
    } else {
      stopRingtone();
    }
  }, [ringingAlarm]);

  useEffect(() => {
    const loadAlarms = async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved !== null) {
          let loadedAlarms = JSON.parse(saved).map(migrateAlarm).filter(Boolean);
          if (nativeAlarm?.consumeFiredAlarmIds) {
            const firedIds = await nativeAlarm.consumeFiredAlarmIds();
            const fired = new Set(firedIds || []);
            loadedAlarms = loadedAlarms.map(alarm =>
              fired.has(alarm.id) ? { ...alarm, enabled: false } : alarm
            );
          }
          setAlarms(loadedAlarms);
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
          sound: 'default',
          bypassDnd: true,
          lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
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
        if (nativeAlarm) {
          await nativeAlarm.syncAlarms(JSON.stringify(alarms));
          return;
        }
        for (const alarm of alarms) {
          if (!alarm.enabled) continue;
          const content = {
            title: alarm.name,
            body: settings.use24Hour 
              ? formatTime(alarm.hour24, alarm.minute, true) 
              : `${formatTime(alarm.hour24, alarm.minute, false)} ${alarm.hour24 >= 12 ? 'PM' : 'AM'}`,
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
  }, [alarms, hasLoaded, settings.use24Hour]);

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
    // Native AlarmManager owns Android ringing, including foreground, locked,
    // background, and killed-app states. Avoid a second JS ringtone on top.
    if (nativeAlarm) return undefined;

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
          if (settings.vibrateOnAlarm) {
            Vibration.vibrate([500, 1000, 500, 1000], true);
          }
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
        if (settings.vibrateOnAlarm) {
          Vibration.vibrate([500, 1000, 500, 1000], true);
        }
      }
    };
    const interval = setInterval(checkAlarms, 1000);
    return () => clearInterval(interval);
  }, [settings.vibrateOnAlarm]);

  const toggleAlarm = (id) => {
    setAlarms(prev => prev.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a));
  };

  const deleteAlarm = (id) => {
    setAlarms(prev => prev.filter(a => a.id !== id));
  };

  const openAdd = () => {
    // WP seeds the picker with the phone's current time rounded to the
    // nearest hour (16:53 → 17:00).
    const now = new Date();
    const rounded = (now.getHours() + (now.getMinutes() >= 30 ? 1 : 0)) % 24;
    setEditingId(null);
    setDraftHour24(rounded);
    setDraftMinute(0);
    setDraftName('Alarm');
    setDraftRepeat([]);
    setDraftSound(DEFAULT_RINGTONE);
    setDraftSnooze(true);
    setSubPage(null);
    setEditorVisible(true);
  };

  const openEdit = (alarm) => {
    setEditingId(alarm.id);
    setDraftHour24(alarm.hour24);
    setDraftMinute(alarm.minute);
    setDraftName(alarm.name);
    setDraftRepeat(alarm.repeat);
    setDraftSound(alarm.sound || DEFAULT_RINGTONE);
    setDraftSnooze(alarm.snooze !== false);
    setSubPage(null);
    setEditorVisible(true);
  };

  const handleSave = () => {
    const draft = {
      hour24: draftHour24,
      minute: draftMinute,
      enabled: true,
      name: draftName.trim() || 'Alarm',
      repeat: draftRepeat,
      sound: draftSound,
      snooze: draftSnooze,
    };
    if (editingId) {
      setAlarms(prev => prev.map(a => a.id === editingId ? { ...a, ...draft } : a));
    } else {
      setAlarms(prev => [...prev, { id: Date.now().toString(), ...draft }]);
    }
    stopPreview();
    setSubPage(null);
    setEditorVisible(false);
  };

  const toggleDraftDay = (day) => {
    setDraftRepeat(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  };

  const dismissAlarm = () => {
    Vibration.cancel();
    stopRingtone();
    const alarm = ringingAlarm;
    if (alarm && alarm.repeat.length === 0) {
      // One-time alarms turn off once they've rung; repeating ones stay armed.
      setAlarms(prev => prev.map(a => a.id === alarm.id ? { ...a, enabled: false } : a));
    }
    setRingingAlarm(null);
  };

  const snoozeAlarm = () => {
    Vibration.cancel();
    stopRingtone();
    const alarm = ringingAlarm;
    if (alarm) {
      if (alarm.snooze !== false) {
        const target = new Date(Date.now() + SNOOZE_MINUTES * 60 * 1000);
        snoozeRef.current = { alarm, date: target, hour24: target.getHours(), minute: target.getMinutes() };
        // Also ring if the app gets backgrounded during the snooze window.
        Notifications.scheduleNotificationAsync({
          content: { title: alarm.name, body: 'Snoozed alarm', sound: true, data: { alarmId: alarm.id } },
          trigger: { channelId: 'alarms', date: target },
        }).catch(() => { });
      } else {
        if (alarm.repeat.length === 0) {
          setAlarms(prev => prev.map(a => a.id === alarm.id ? { ...a, enabled: false } : a));
        }
      }
    }
    setRingingAlarm(null);
  };

  const renderItem = ({ item: a }) => (
    <AlarmListItem
      alarm={a}
      use24Hour={settings.use24Hour}
      onPress={() => openEdit(a)}
      onLongPress={() => deleteAlarm(a.id)}
      onToggle={() => toggleAlarm(a.id)}
    />
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
        <AddAlarmBottomBar navigation={navigation} methods={{ addAlarm: openAdd, deleteAll: () => setAlarms([]) }} />
      </View>

      {/* Add / Edit Alarm — full-screen WP page. Mounted only while open so the
          pickers pick up the current draft. The Time and Repeats sub-pages
          render over the editor. */}
      {isEditorVisible && (
        <Modal visible={isEditorVisible} animationType="slide" onRequestClose={() => { stopPreview(); setSubPage(null); setEditorVisible(false); }}>
          {subPage === 'time' ? (
            <TimePickerPage
              hour24={draftHour24}
              minute={draftMinute}
              use24Hour={settings.use24Hour}
              onChange={(h, m) => { setDraftHour24(h); setDraftMinute(m); }}
              onAccept={() => setSubPage(null)}
              onCancel={() => setSubPage(null)}
            />
          ) : subPage === 'repeats' ? (
            <RepeatsPage
              repeat={draftRepeat}
              onToggleDay={toggleDraftDay}
              onAccept={() => setSubPage(null)}
              onCancel={() => setSubPage(null)}
            />
          ) : (
            <AlarmEditorPage
              mode={editingId ? 'edit' : 'new'}
              timeText={`${formatTime(draftHour24, draftMinute, settings.use24Hour)}${settings.use24Hour ? '' : ` ${draftHour24 >= 12 ? 'PM' : 'AM'}`}`}
              repeatText={formatRepeat(draftRepeat)}
              soundName={(getRingtone(draftSound)?.name || '').toLowerCase()}
              name={draftName}
              onChangeName={setDraftName}
              snooze={draftSnooze}
              onToggleSnooze={() => setDraftSnooze(!draftSnooze)}
              onOpenTime={() => setSubPage('time')}
              onOpenRepeats={() => setSubPage('repeats')}
              onOpenSound={() => setShowRingtoneSheet(true)}
              onSave={handleSave}
              onCancel={() => { stopPreview(); setSubPage(null); setEditorVisible(false); }}
            />
          )}
        </Modal>
      )}

      {showRingtoneSheet && (
        <Modal visible={showRingtoneSheet} animationType="slide" onRequestClose={() => setShowRingtoneSheet(false)}>
          <RingtoneScreen 
            currentSound={draftSound} 
            onSelect={setDraftSound} 
            onClose={() => setShowRingtoneSheet(false)} 
          />
        </Modal>
      )}

      {/* Ringing overlay */}
      {ringingAlarm && (
        <View style={styles.ringingOverlay}>
          <Text style={[styles.ringingName, fonts.regular]}>{ringingAlarm.name}</Text>
          <Text style={[styles.ringingTime, fonts.extraLight]}>
            {formatTime(ringingAlarm.hour24, ringingAlarm.minute, settings.use24Hour)}
            {!settings.use24Hour && (
              <Text style={styles.ringingAmpm}> {ringingAlarm.hour24 >= 12 ? 'PM' : 'AM'}</Text>
            )}
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
  bottomBarContainer: { width: "100%", position: 'absolute', bottom: 0, zIndex: 10 },

  ringingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#004A87', justifyContent: 'center', alignItems: 'center', zIndex: 100 },
  ringingName: { color: 'white', fontSize: 24, letterSpacing: 2, marginBottom: 10 },
  ringingTime: { color: 'white', fontSize: 96, includeFontPadding: false },
  ringingAmpm: { fontSize: 30 },
  ringingButtons: { flexDirection: 'row', marginTop: 50 },
  ringingButton: { borderColor: 'white', borderWidth: 2, paddingHorizontal: 30, paddingVertical: 12, marginHorizontal: 10 },
  ringingButtonText: { color: 'white', fontSize: 18 },
});
