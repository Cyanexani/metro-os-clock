import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { fonts } from '../../styles/fonts';
import AnimatedTime from './AnimatedTime';

const ACCENT = '#0078D7';
const DIM_MS = 250;

// The local-time header (refs 012453/012512): a very large thin time whose top
// overlaps the bottom edge of the world map, a small AM/PM, the current city
// in accent blue, then the grey day line. When a list city is selected the
// whole header recedes to 0.3 opacity like the unselected rows do.
export default function WorldClockHeader({ timeText, ampm, cityName, dayText, dimmed }) {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withTiming(dimmed ? 0.3 : 1, {
      duration: DIM_MS,
      easing: Easing.out(Easing.quad),
    });
  }, [dimmed]);

  const dimStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View style={[styles.container, dimStyle]}>
      <View style={styles.timeRow}>
        <AnimatedTime value={timeText} style={[styles.time, fonts.extraLight]} />
        {ampm ? <Text style={[styles.ampm, fonts.regular]}>{ampm}</Text> : null}
      </View>
      <Text style={[styles.city, fonts.regular]}>{cityName}</Text>
      <Text style={[styles.day, fonts.regular]}>{dayText || 'Today'}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  // Negative top margin pulls the big digits up over the map's bottom edge,
  // as in the reference stills.
  container: { paddingHorizontal: 20, marginTop: -34, paddingBottom: 10 },
  timeRow: { flexDirection: 'row', alignItems: 'baseline' },
  time: { color: 'white', fontSize: 84, includeFontPadding: false },
  ampm: { color: 'white', fontSize: 30, marginLeft: 10, textTransform: 'uppercase' },
  city: { color: ACCENT, fontSize: 16, marginTop: 0 },
  day: { color: '#8a8a8a', fontSize: 13, marginTop: 1 },
});
