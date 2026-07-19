import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { fonts } from '../styles/fonts';
import { AppTitle } from '../components/core/AppTitle';
import ToggleSwitch from '../components/core/ToggleSwitch';
import MetroTouchable from '../components/core/MetroTouchable';
import { useSettings } from '../context/SettingsContext';

const ACCENT = '#0078D7';

const Row = ({ label, description, value, onToggle }) => (
  <View style={styles.row}>
    <View style={styles.rowText}>
      <Text style={[styles.rowLabel, fonts.regular]}>{label}</Text>
      {description ? <Text style={[styles.rowDesc, fonts.light]}>{description}</Text> : null}
    </View>
    <ToggleSwitch isOn={value} onToggle={onToggle} toggleOnColor={ACCENT} />
  </View>
);

export default function SettingsScreen({ navigation }) {
  const { settings, setSetting } = useSettings();

  return (
    <View style={styles.container}>
      <AppTitle title={'clock'} />
      <Text style={[styles.pageTitle, fonts.light]}>settings</Text>

      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        bounces={false}
        overScrollMode="never"
        showsVerticalScrollIndicator={false}
      >
        <Row
          label="24-hour clock"
          description="show times in 24-hour format"
          value={settings.use24Hour}
          onToggle={() => setSetting('use24Hour', !settings.use24Hour)}
        />
        <Row
          label="show seconds"
          description="display seconds where available"
          value={settings.showSeconds}
          onToggle={() => setSetting('showSeconds', !settings.showSeconds)}
        />
        <Row
          label="week starts monday"
          description="first day of the week"
          value={settings.weekStartsMonday}
          onToggle={() => setSetting('weekStartsMonday', !settings.weekStartsMonday)}
        />
        <Row
          label="vibrate on alarm"
          description="vibrate when an alarm rings"
          value={settings.vibrateOnAlarm}
          onToggle={() => setSetting('vibrateOnAlarm', !settings.vibrateOnAlarm)}
        />
      </ScrollView>

      <View style={styles.appBar}>
        <MetroTouchable style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={[styles.backText, fonts.regular]}>back</Text>
        </MetroTouchable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  pageTitle: { color: 'white', fontSize: 42, marginStart: 12, marginBottom: 20 },
  list: { flex: 1 },
  listContent: { paddingBottom: 100 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 18 },
  rowText: { flex: 1, marginRight: 20 },
  rowLabel: { color: 'white', fontSize: 20 },
  rowDesc: { color: '#888', fontSize: 14, marginTop: 2 },
  appBar: { height: 65, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', position: 'absolute', bottom: 0, width: '100%' },
  backButton: { borderColor: 'white', borderWidth: 2, paddingHorizontal: 30, paddingVertical: 10 },
  backText: { color: 'white', fontSize: 16 },
});
