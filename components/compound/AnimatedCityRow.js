import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { fonts } from '../../styles/fonts';
import MetroTouchable from '../core/MetroTouchable';
import AnimatedTime from './AnimatedTime';

const ACCENT = '#0078D7';
const DIM_MS = 250;

// A single World Clock city row. When another city is selected the row recedes
// to 0.3 opacity (but stays fully interactive); the selected row stays at 1.0.
const AnimatedCityRow = ({
  city,
  timeText,
  ampm,
  dayText,
  offsetText,
  selectedId,
  onPress,
  onLongPress,
}) => {
  const dimmed = selectedId !== null && selectedId !== city.id;
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withTiming(dimmed ? 0.3 : 1, {
      duration: DIM_MS,
      easing: Easing.out(Easing.quad),
    });
  }, [dimmed]);

  const rowStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View style={rowStyle}>
      <MetroTouchable style={styles.cityRow} onPress={onPress} onLongPress={onLongPress}>
        <View style={styles.cityRowLeft}>
          <View style={styles.timeRow}>
            <AnimatedTime value={timeText} style={[styles.cityTime, fonts.extraLight]} />
            <Text style={[styles.cityAmpm, fonts.regular]}>{ampm}</Text>
          </View>
          <Text style={[styles.cityName, fonts.regular]}>{city.name.toLowerCase()}</Text>
          {dayText ? <Text style={[styles.cityDay, fonts.regular]}>{dayText}</Text> : null}
        </View>
        <View style={styles.cityRowRight}>
          <Text style={[styles.offsetText, fonts.regular]}>{offsetText}</Text>
        </View>
      </MetroTouchable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  cityRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15 },
  cityRowLeft: { flex: 1 },
  cityRowRight: { justifyContent: 'flex-start', alignItems: 'flex-end', paddingTop: 10 },
  timeRow: { flexDirection: 'row', alignItems: 'baseline' },
  cityTime: { color: 'white', fontSize: 48, includeFontPadding: false },
  cityAmpm: { color: 'white', fontSize: 18, marginLeft: 6 },
  cityName: { color: 'white', fontSize: 16, marginTop: -2 },
  cityDay: { color: '#888', fontSize: 14, marginTop: 2 },
  offsetText: { color: ACCENT, fontSize: 14 },
});

export default AnimatedCityRow;
