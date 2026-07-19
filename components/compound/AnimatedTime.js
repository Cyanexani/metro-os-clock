import React, { useEffect, useRef } from 'react';
import { Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';

// Renders a time string that cross-dissolves whenever the value changes —
// old text fades out and the new text fades in, ~150ms, matching the real
// World Clock's near-instant swap (no flip, no slide, no number roll).
const FADE_MS = 150;

const AnimatedTime = ({ value, style }) => {
  const opacity = useSharedValue(1);
  const prev = useRef(value);

  useEffect(() => {
    if (prev.current !== value) {
      prev.current = value;
      opacity.value = withSequence(
        withTiming(0, { duration: FADE_MS / 2, easing: Easing.out(Easing.quad) }),
        withTiming(1, { duration: FADE_MS / 2, easing: Easing.in(Easing.quad) }),
      );
    }
  }, [value]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.Text style={[style, animatedStyle]} numberOfLines={1}>
      {value}
    </Animated.Text>
  );
};

export default AnimatedTime;
