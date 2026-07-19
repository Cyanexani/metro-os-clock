import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { fonts } from '../../styles/fonts';
import AnimatedTime from './AnimatedTime';

const ACCENT = '#0078D7';

// The local-time header that overlaps the bottom of the world map: a very large
// thin time with a small AM/PM, the current city in accent blue, then the day.
export default function WorldClockHeader({ timeText, ampm, cityName, dayText }) {
  return (
    <View style={styles.container}>
      <View style={styles.timeRow}>
        <AnimatedTime value={timeText} style={[styles.time, fonts.extraLight]} />
        {ampm ? <Text style={[styles.ampm, fonts.regular]}>{ampm}</Text> : null}
      </View>
      <Text style={[styles.city, fonts.regular]}>{cityName}</Text>
      <Text style={[styles.day, fonts.regular]}>{dayText || 'Today'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 },
  timeRow: { flexDirection: 'row', alignItems: 'baseline' },
  time: { color: 'white', fontSize: 80, includeFontPadding: false },
  ampm: { color: 'white', fontSize: 30, marginLeft: 8, textTransform: 'uppercase' },
  city: { color: ACCENT, fontSize: 16, marginTop: 2 },
  day: { color: '#8a8a8a', fontSize: 13 },
});
