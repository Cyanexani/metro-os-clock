import React from 'react';
import { Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';

// Metro UI 'tilt' button: content scales down slightly while pressed.
const MetroTouchable = ({ children, onPress, onLongPress, disabled, style }) => {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Pressable
      disabled={disabled}
      onPressIn={() => { scale.value = withTiming(0.95, { duration: 150 }); }}
      onPressOut={() => { scale.value = withTiming(1, { duration: 200 }); }}
      onPress={onPress}
      onLongPress={onLongPress}
      style={style}
    >
      <Animated.View style={animatedStyle}>
        {children}
      </Animated.View>
    </Pressable>
  );
};

export default MetroTouchable;
