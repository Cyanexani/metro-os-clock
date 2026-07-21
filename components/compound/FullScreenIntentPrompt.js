import React, { useEffect, useState } from 'react';
import { Modal, View, Text, StyleSheet, Platform, NativeModules } from 'react-native';
import { fonts } from '../../styles/fonts';
import MetroTouchable from '../core/MetroTouchable';

const ACCENT = '#0078D7';
const nativeAlarm = Platform.OS === 'android' ? NativeModules.MetroAlarm : null;

// Android 14+ ships with "full-screen notifications" denied for sideloaded
// apps. Without it the alarm/timer ringing page never appears over the lock
// screen — the system silently downgrades it to a regular notification. This
// re-prompts on every launch until the permission is actually granted (unlike
// the battery prompt, we can query the real state, so no stored flag needed).
export default function FullScreenIntentPrompt() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!nativeAlarm?.canUseFullScreenIntent) return;
    nativeAlarm
      .canUseFullScreenIntent()
      .then((granted) => { if (!granted) setVisible(true); })
      .catch(() => {});
  }, []);

  const openSettings = () => {
    nativeAlarm?.openFullScreenIntentSettings?.().catch(() => {});
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={() => setVisible(false)}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={[styles.title, fonts.light]}>alarms on lock screen</Text>
          <Text style={[styles.body, fonts.regular]}>
            android is blocking full-screen alarms. allow "full-screen
            notifications" so alarms and timers ring over the lock screen
            instead of showing a small notification.
          </Text>
          <View style={styles.buttons}>
            <MetroTouchable style={styles.button} onPress={openSettings}>
              <Text style={[styles.buttonText, fonts.regular]}>open settings</Text>
            </MetroTouchable>
            <MetroTouchable style={styles.button} onPress={() => setVisible(false)}>
              <Text style={[styles.buttonText, fonts.regular]}>not now</Text>
            </MetroTouchable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: { backgroundColor: 'black', borderWidth: 2, borderColor: ACCENT, padding: 24 },
  title: { color: 'white', fontSize: 32, marginBottom: 16 },
  body: { color: '#ccc', fontSize: 16, lineHeight: 24, marginBottom: 28 },
  buttons: { flexDirection: 'row', justifyContent: 'flex-end' },
  button: { paddingHorizontal: 20, paddingVertical: 12, marginLeft: 8, backgroundColor: '#222' },
  buttonText: { color: 'white', fontSize: 16 },
});
