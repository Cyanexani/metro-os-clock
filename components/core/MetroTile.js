import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { fonts } from '../../styles/fonts';
import MetroTouchable from './MetroTouchable';

// Windows Phone "Live Tile": a flat, square-ish coloured block with a small
// label bottom-left and optional big content. Uses the Metro tilt press.
const SIZES = {
  small: 72,
  medium: 150,
  wide: 320,
};

const MetroTile = ({
  label,
  value,
  size = 'medium',
  color = '#0078D7',
  onPress,
  onLongPress,
  style,
}) => {
  const dim = SIZES[size] || SIZES.medium;
  const isWide = size === 'wide';
  return (
    <MetroTouchable onPress={onPress} onLongPress={onLongPress} style={[styles.wrap, style]}>
      <View style={[styles.tile, { backgroundColor: color, height: dim, width: isWide ? SIZES.wide : dim }]}>
        {value != null ? (
          <Text style={[styles.value, fonts.light]} numberOfLines={1}>{value}</Text>
        ) : null}
        {label != null ? (
          <Text style={[styles.label, fonts.regular]} numberOfLines={1}>{label}</Text>
        ) : null}
      </View>
    </MetroTouchable>
  );
};

const styles = StyleSheet.create({
  wrap: { margin: 5 },
  tile: { padding: 10, justifyContent: 'flex-end' },
  value: { color: 'white', fontSize: 34, position: 'absolute', top: 8, left: 10 },
  label: { color: 'white', fontSize: 14 },
});

export default MetroTile;
export { SIZES as TILE_SIZES };
