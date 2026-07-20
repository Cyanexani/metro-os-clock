import React from 'react';
import { Text } from 'react-native';

// The real World Clock swaps the digits instantly — no fade, flip, slide, or
// number roll. A cross-dissolve here fired on every value change, which with
// seconds enabled meant a visible flicker once per second, so we render plain
// text.
const AnimatedTime = ({ value, style }) => (
  <Text style={style} numberOfLines={1}>
    {value}
  </Text>
);

export default AnimatedTime;
