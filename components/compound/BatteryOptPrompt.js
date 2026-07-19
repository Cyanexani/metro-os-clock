import React from 'react';
import { Modal, View, Text, StyleSheet, Platform, Linking } from 'react-native';
import { fonts } from '../../styles/fonts';
import MetroTouchable from '../core/MetroTouchable';
import { useSettings } from '../../context/SettingsContext';

const ACCENT = '#0078D7';

// One-time nudge asking the user to exempt the app from battery optimization.
// Android's Doze mode can delay or drop the scheduled notifications the alarms
// rely on, so for reliable ringing the app should be allowed to ignore it.
export default function BatteryOptPrompt() {
  const { settings, setSetting, loaded } = useSettings();

  // Android only, once, and not until settings have loaded (so we don't flash
  // the prompt before reading the persisted "already shown" flag).
  const visible =
    Platform.OS === 'android' && loaded && !settings.batteryPromptShown;

  const dismiss = () => setSetting('batteryPromptShown', true);

  const openSettings = () => {
    // Linking.openSettings() opens this app's system settings page, where the
    // user can reach "Battery > Unrestricted". For a direct jump to the
    // battery-optimization list, install `expo-intent-launcher` and fire
    // IntentLauncher.startActivityAsync(
    //   'android.settings.IGNORE_BATTERY_OPTIMIZATION_SETTINGS').
    Linking.openSettings().catch(() => {});
    dismiss();
  };

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={dismiss}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={[styles.title, fonts.light]}>reliable alarms</Text>
          <Text style={[styles.body, fonts.regular]}>
            android may pause this app in the background and delay your alarms.
            allow it to ignore battery optimization so alarms always ring on time.
          </Text>
          <View style={styles.buttons}>
            <MetroTouchable style={styles.button} onPress={openSettings}>
              <Text style={[styles.buttonText, fonts.regular]}>open settings</Text>
            </MetroTouchable>
            <MetroTouchable style={styles.button} onPress={dismiss}>
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
