import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { Save } from 'react-native-feather';
import { fonts } from '../../styles/fonts';
import MetroTouchable from '../../components/core/MetroTouchable';
import ToggleSwitch from '../../components/core/ToggleSwitch';

const ACCENT = '#0078D7';

// A tappable labelled box: small grey label above a thin-outlined value box.
// This is the WP "select" affordance used on the alarm editor page.
const FieldBox = ({ label, value, onPress }) => (
  <View style={styles.field}>
    <Text style={[styles.fieldLabel, fonts.regular]}>{label}</Text>
    <MetroTouchable style={styles.fieldBox} onPress={onPress}>
      <Text style={[styles.fieldValue, fonts.regular]}>{value}</Text>
    </MetroTouchable>
  </View>
);

// Full-screen alarm editor (add or edit). Time / Repeats / Sound open their own
// pages; Name is edited inline. Bottom app bar carries the circular check/close.
export default function AlarmEditorPage({
  mode,
  timeText,
  repeatText,
  soundName,
  name,
  onChangeName,
  snooze,
  onToggleSnooze,
  onOpenTime,
  onOpenRepeats,
  onOpenSound,
  onSave,
  onCancel,
}) {
  return (
    <View style={styles.page}>
      <View style={styles.body}>
        <Text style={[styles.overline, fonts.regular]}>ALARMS</Text>
        <Text style={[styles.title, fonts.light]}>{mode === 'edit' ? 'edit' : 'new'}</Text>

        <FieldBox label="Time" value={timeText} onPress={onOpenTime} />
        <FieldBox label="Repeats" value={repeatText} onPress={onOpenRepeats} />
        <FieldBox label="Sound" value={soundName} onPress={onOpenSound} />

        <View style={styles.field}>
          <Text style={[styles.fieldLabel, fonts.regular]}>Name</Text>
          <TextInput
            style={[styles.nameInput, fonts.regular]}
            value={name}
            onChangeText={onChangeName}
            placeholder="Alarm"
            placeholderTextColor="#888"
          />
        </View>

        <View style={styles.snoozeRow}>
          <Text style={[styles.fieldLabel, fonts.regular, { marginBottom: 0 }]}>Snooze</Text>
          <ToggleSwitch isOn={snooze} onToggle={onToggleSnooze} toggleOnColor={ACCENT} />
        </View>
      </View>

      <View style={styles.appBar}>
        <View style={styles.appBarButtons}>
          <MetroTouchable style={styles.circleBtn} onPress={onSave}>
            {/* WP save glyph — floppy disk (ref 012148) */}
            <Save stroke="white" width={20} height={20} />
          </MetroTouchable>
        </View>
        <Text style={[styles.dots, fonts.regular]}>•••</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#081109' },
  body: { flex: 1, paddingHorizontal: 20, paddingTop: 30 },

  overline: { color: '#bbb', fontSize: 13, letterSpacing: 2, textTransform: 'uppercase' },
  title: { color: 'white', fontSize: 48, marginBottom: 24, marginLeft: -2 },

  field: { marginBottom: 20 },
  fieldLabel: { color: '#888', fontSize: 14, marginBottom: 6 },
  fieldBox: { borderWidth: 2, borderColor: 'white', paddingVertical: 12, paddingHorizontal: 12 },
  fieldValue: { color: 'white', fontSize: 20 },

  nameInput: { backgroundColor: '#d6d6d6', color: 'black', fontSize: 20, paddingVertical: 12, paddingHorizontal: 12 },

  snoozeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },

  appBar: { height: 65, backgroundColor: '#0D190F', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderTopWidth: 1, borderTopColor: '#203022' },
  appBarButtons: { flexDirection: 'row' },
  circleBtn: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: 'white', justifyContent: 'center', alignItems: 'center', marginHorizontal: 12 },
  circleGlyph: { color: 'white', fontSize: 22, lineHeight: 26 },
  dots: { position: 'absolute', right: 24, color: 'white', fontSize: 24 },
});
