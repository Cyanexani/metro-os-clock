import React, { useEffect } from 'react';
import { TouchableWithoutFeedback, StyleSheet } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  Easing,
  Extrapolation,
  interpolateColor,
} from 'react-native-reanimated';

const BORDER_WIDTH = 3;

// This is a CONTROLLED component and state is stored by its parent.
// Parent can update the state in onToggle call back function

const ToggleSwitch = ({
  onToggle,
  isOn = false,
  toggleOffColor = 'transparent',
  toggleOnColor = '#0078D7',
  knobColorOff = 'white',
  knobColorOn = 'white',
  outerBorderColor = 'white',
  height = 32,
  width = 68,
}) => {
  const InterpolateXInput = [0, 1];
  const CONTAINER_WIDTH = width;
  const CONTAINER_HEIGHT = height;
  const BORDER_WIDTH = 2;
  // Make the knob a perfect square inside the track
  const KNOB_SIZE = CONTAINER_HEIGHT - (BORDER_WIDTH * 2) - 8; 
  const KNOB_WIDTH = KNOB_SIZE;
  const KNOB_HEIGHT = KNOB_SIZE;
  
  const sharedValue = useSharedValue(isOn ? 1 : 0);

  const containerScale = {
    height: CONTAINER_HEIGHT,
    width: CONTAINER_WIDTH,
  };
  const containerColors = {
    borderColor: isOn ? toggleOnColor : outerBorderColor,
  };

  const knobScale = {
    height: KNOB_HEIGHT,
    width: KNOB_WIDTH,
  };

  const knobColors = {
    backgroundColor: isOn ? knobColorOn : knobColorOff,
  };

  useEffect(() => {
    animateSharedValue(isOn ? 1 : 0);
    // setToggled(isOn);
  }, [isOn])

  const onChangeToggle = () => {
    // const newState = !toggled;
    // setToggled(newState);
    // if (onToggle)
    //   onToggle(newState);
    if (onToggle)
      onToggle();
  };

  const animateSharedValue = (toValue) => {
    sharedValue.value = withTiming(toValue, {
      duration: 300,
      easing: Easing.bezier(0.4, 0.0, 0.2, 1),
    });
  }

  const onPressSwitch = () => {
    if (sharedValue.value === 0)
      animateSharedValue(1);
    else
      animateSharedValue(0);
    onChangeToggle();
  };

  const knobTranslateStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateX: interpolate(
            sharedValue.value,
            InterpolateXInput,
            [4, CONTAINER_WIDTH - KNOB_WIDTH - (BORDER_WIDTH * 2) - 4],
            Extrapolation.CLAMP,
          ),
        },
      ],
    };
  });

  const containerColorStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: interpolateColor(sharedValue.value, InterpolateXInput, [
        toggleOffColor,
        toggleOnColor,
      ]),
    };
  });

  return (
    <TouchableWithoutFeedback onPress={onPressSwitch}>
      <Animated.View style={[styles.containerStyle, containerScale, containerColors, containerColorStyle]}>
        <Animated.View
          style={[styles.knobStyle, knobScale, knobTranslateStyle, knobColors]}
        />
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  containerStyle: {
    justifyContent: 'center',
    borderWidth: 2,
  },
  knobStyle: {
    position: 'absolute',
  },
});

export default ToggleSwitch;

