import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { fonts } from '../styles/fonts';
import MetroTouchable from '../components/core/MetroTouchable';
import { useSettings } from '../context/SettingsContext';

const ACCENT = '#0078D7';

// WP world clock settings (ref 012554): SETTINGS overline, "world clock"
// lowercase title, a "Date display" radio group, and outlined accept/cancel
// buttons pinned to the bottom. Changes only commit on accept.
const Radio = ({ label, selected, onPress }) => (
  <MetroTouchable style={styles.radioRow} onPress={onPress}>
    <View style={styles.radioOuter}>
      {selected ? <View style={styles.radioInner} /> : null}
    </View>
    <Text style={[styles.radioLabel, fonts.regular]}>{label}</Text>
  </MetroTouchable>
);

export default function WorldClockSettings({ navigation }) {
  const { settings, setSetting } = useSettings();
  const [draft, setDraft] = useState(settings.dateDisplay || 'relative');

  const accept = () => {
    setSetting('dateDisplay', draft);
    navigation.goBack();
  };

  return (
    <View style={styles.page}>
      <View style={styles.body}>
        <Text style={[styles.overline, fonts.regular]}>SETTINGS</Text>
        <Text style={[styles.title, fonts.light]}>world clock</Text>

        <Text style={[styles.groupLabel, fonts.regular]}>Date display</Text>
        <Radio
          label="Yesterday/Today/Tomorrow"
          selected={draft === 'relative'}
          onPress={() => setDraft('relative')}
        />
        <Radio
          label="Day of Week (Monday)"
          selected={draft === 'weekday'}
          onPress={() => setDraft('weekday')}
        />
      </View>

      <View style={styles.buttonRow}>
        <MetroTouchable style={styles.button} onPress={accept}>
          <Text style={[styles.buttonText, fonts.regular]}>accept</Text>
        </MetroTouchable>
        <MetroTouchable style={styles.button} onPress={() => navigation.goBack()}>
          <Text style={[styles.buttonText, fonts.regular]}>cancel</Text>
        </MetroTouchable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: 'black' },
  body: { flex: 1, paddingHorizontal: 20, paddingTop: 30 },

  overline: { color: '#bbb', fontSize: 13, letterSpacing: 2, textTransform: 'uppercase' },
  title: { color: 'white', fontSize: 48, marginBottom: 20, marginLeft: -2 },

  groupLabel: { color: '#888', fontSize: 14, marginBottom: 10 },
  radioRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  radioOuter: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: 'white', justifyContent: 'center', alignItems: 'center' },
  radioInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: ACCENT },
  radioLabel: { color: 'white', fontSize: 16, marginLeft: 12 },

  buttonRow: { flexDirection: 'row', justifyContent: 'center', paddingBottom: 20 },
  button: { borderColor: 'white', borderWidth: 2, paddingHorizontal: 26, paddingVertical: 10, marginHorizontal: 8, minWidth: 120, alignItems: 'center' },
  buttonText: { color: 'white', fontSize: 16 },
});
