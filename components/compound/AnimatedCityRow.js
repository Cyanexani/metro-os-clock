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

  // WP world clock list rows: white name, grey day line, no accent, no offset.
  // 'Today' is the default day label; a crossing shows Tomorrow/Yesterday.
  const dayLabel = dayText ? dayText.charAt(0).toUpperCase() + dayText.slice(1) : 'Today';

  return (
    <Animated.View style={rowStyle}>
      <MetroTouchable style={styles.cityRow} onPress={onPress} onLongPress={onLongPress}>
        <View style={styles.timeRow}>
          <AnimatedTime value={timeText} style={[styles.cityTime, fonts.extraLight]} />
          {ampm ? <Text style={[styles.cityAmpm, fonts.regular]}>{ampm}</Text> : null}
        </View>
        <Text style={[styles.cityName, fonts.regular]}>{city.name}</Text>
        <Text style={[styles.cityDay, fonts.regular]}>{dayLabel}</Text>
      </MetroTouchable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  cityRow: { paddingHorizontal: 20, paddingVertical: 10 },
  timeRow: { flexDirection: 'row', alignItems: 'baseline' },
  cityTime: { color: 'white', fontSize: 30, includeFontPadding: false },
  cityAmpm: { color: 'white', fontSize: 14, marginLeft: 4, textTransform: 'uppercase' },
  cityName: { color: 'white', fontSize: 16, marginTop: 1 },
  cityDay: { color: '#8a8a8a', fontSize: 13 },
});

export default AnimatedCityRow;
