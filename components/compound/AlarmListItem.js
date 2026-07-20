import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { fonts } from '../../styles/fonts';
import MetroTouchable from '../core/MetroTouchable';
import ToggleSwitch from '../core/ToggleSwitch';

const ACCENT = '#0078D7';
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const formatTime = (hour24, minute, use24Hour) => {
  if (use24Hour) {
    return `${String(hour24).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  }
  const h = hour24 % 12 || 12;
  return `${h}:${String(minute).padStart(2, '0')}`;
};

const formatRepeat = (repeat) => {
  if (!repeat || repeat.length === 0) return 'only once';
  if (repeat.length === 7) return 'every day';
  if (repeat.length === 5 && !repeat.includes('Sat') && !repeat.includes('Sun')) return 'weekdays';
  return DAYS.filter(d => repeat.includes(d)).map(d => d.toLowerCase()).join(', ');
};

// A single alarm row: big thin time + name + repeat summary on the left,
// enable toggle on the right. Disabled alarms dim to grey.
const AlarmListItem = ({ alarm, use24Hour, onPress, onLongPress, onToggle }) => {
  const off = !alarm.enabled;
  return (
    <View style={styles.row}>
      <MetroTouchable style={styles.info} onPress={onPress} onLongPress={onLongPress}>
        <View style={styles.timeRow}>
          <Text style={[styles.time, fonts.extraLight, off && styles.dimmed]}>
            {formatTime(alarm.hour24, alarm.minute, use24Hour)}
          </Text>
          {!use24Hour && (
            <Text style={[styles.ampm, fonts.regular, off && styles.dimmed]}>
              {' '}{alarm.hour24 >= 12 ? 'PM' : 'AM'}
            </Text>
          )}
        </View>
        <Text style={[styles.name, fonts.regular, off && styles.dimmed]}>
          {alarm.name.toLowerCase()}
        </Text>
        <Text style={[styles.repeat, fonts.regular, off && styles.dimmed]}>
          {formatRepeat(alarm.repeat)}
        </Text>
      </MetroTouchable>
      <View style={styles.toggle}>
        <ToggleSwitch isOn={alarm.enabled} onToggle={onToggle} toggleOnColor={ACCENT} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', width: '100%', marginStart: 20, marginBottom: 25 },
  info: { flex: 2 },
  timeRow: { flexDirection: 'row', alignItems: 'baseline' },
  time: { color: 'white', fontSize: 48, marginBottom: -5, includeFontPadding: false },
  ampm: { fontSize: 18, color: 'white' },
  name: { color: '#ccc', fontSize: 16 },
  repeat: { color: '#888', fontSize: 14 },
  dimmed: { color: '#555' },
  toggle: { flex: 1, flexDirection: 'row', justifyContent: 'flex-end', margin: 16, marginRight: 40 },
});

export default AlarmListItem;
