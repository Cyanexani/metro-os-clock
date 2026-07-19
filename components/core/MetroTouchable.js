import React, { useRef } from 'react';
import { Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSpring } from 'react-native-reanimated';

// Windows Phone "tilt" effect: pressing a surface tilts it in 3D perspective
// toward the touch point — press the top and the top edge rotates away, press
// a corner and it dips. Springs back flat on release. This is the signature
// Metro press interaction, not a flat scale-down.
const MAX_TILT = 6; // degrees

const MetroTouchable = ({ children, onPress, onLongPress, disabled, style }) => {
  const rotateX = useSharedValue(0);
  const rotateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const size = useRef({ w: 0, h: 0 });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 600 },
      { rotateX: `${rotateX.value}deg` },
      { rotateY: `${rotateY.value}deg` },
      { scale: scale.value },
    ],
  }));

  const onPressIn = (e) => {
    const { w, h } = size.current;
    if (!w || !h) {
      scale.value = withTiming(0.97, { duration: 100 });
      return;
    }
    const { locationX, locationY } = e.nativeEvent;
    // Map touch position to a -0.5..0.5 range from the element centre.
    const nx = Math.max(-0.5, Math.min(0.5, locationX / w - 0.5));
    const ny = Math.max(-0.5, Math.min(0.5, locationY / h - 0.5));
    // Touch above centre tilts the top back (negative rotateX feels correct
    // with the perspective origin), touch left tilts the left edge back.
    rotateX.value = withTiming(-ny * MAX_TILT * 2, { duration: 90 });
    rotateY.value = withTiming(nx * MAX_TILT * 2, { duration: 90 });
    scale.value = withTiming(0.97, { duration: 90 });
  };

  const onPressOut = () => {
    rotateX.value = withSpring(0, { damping: 12, stiffness: 180 });
    rotateY.value = withSpring(0, { damping: 12, stiffness: 180 });
    scale.value = withSpring(1, { damping: 12, stiffness: 180 });
  };

  return (
    <Pressable
      disabled={disabled}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      onPress={onPress}
      onLongPress={onLongPress}
      onLayout={(e) => { size.current = { w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height }; }}
      style={style}
    >
      <Animated.View style={animatedStyle}>
        {children}
      </Animated.View>
    </Pressable>
  );
};

export default MetroTouchable;
