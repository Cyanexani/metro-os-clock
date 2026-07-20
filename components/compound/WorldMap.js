import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import worldMap from '../../assets/world-map.png';
import { lonToX, latToY } from '../../data/cities';
import { MAP_DISPLAY_H } from './useMapZoom';

// The source map is a standard equirectangular projection (lon -180..180 → x,
// lat 90..-90 → y). All positions are percentages of the map's own box so the
// overlay stays aligned with the image at any rendered size.


// `date` prop retained for API compatibility; the WP7 reference map is
// uniformly lit — no day/night terminator.
const WorldMap = ({
  cities = [],
  selectedId = null,
  date,
  mapAnimatedStyle,
}) => {
  return (
    // Full-screen clipping layer behind the page content. Idle, the map strip
    // sits in the top MAP_DISPLAY_H; selecting a city scales it up so the map
    // spreads across the whole screen behind the header and rows
    // (refs 012501/012508/012512), while this layer stops it bleeding into
    // the adjacent pivot tabs.
    <View style={styles.clipViewport} pointerEvents="none" collapsable={false}>
      <Animated.View style={[styles.mapBox, mapAnimatedStyle]}>
        {/* Ocean base */}
        <View style={styles.ocean} />

        {/* Landmasses — the gray PNG tinted to the WP lit-land near-white */}
        <Image source={worldMap} style={styles.landImage} resizeMode="stretch" />


        {/* City pins — glowing dots only, no text labels, per the reference
            stills. The wrapper is a zero-size point at the coordinate; the
            dot is centred on it. */}
        {cities.map((city) => {
          const active = city.id === selectedId;
          return (
            <View
              key={city.id}
              pointerEvents="none"
              style={[styles.pinWrap, { left: `${city.x}%`, top: `${city.y}%` }]}
            >
              <View style={[styles.pinDot, active && styles.pinDotActive]} />
            </View>
          );
        })}

        {/* The source silhouette includes Antarctica; the reference map crop
            ends at the southern ocean, so mask that strip. Black-on-black when
            zoomed, so it never reads as a band. */}
        <View style={styles.southernOceanMask} />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  clipViewport: { ...StyleSheet.absoluteFillObject, overflow: 'hidden', backgroundColor: '#000000' },
  // The transformable strip the zoom math targets: full width, MAP_DISPLAY_H
  // tall, anchored to the top of the screen.
  mapBox: { width: '100%', height: MAP_DISPLAY_H, overflow: 'hidden', backgroundColor: '#000000' },
  ocean: { ...StyleSheet.absoluteFillObject, backgroundColor: '#000000' },
  // tintColor recolors the gray land silhouette to the WP lit-land near-white.
  landImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%', tintColor: '#DDE3E8' },
  pinWrap: {
    position: 'absolute',
    width: 0,
    height: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinDot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: -4,
    marginTop: -4,
    backgroundColor: 'white',
    shadowColor: 'white',
    shadowOpacity: 0.9,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 0 },
  },
  pinDotActive: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginLeft: -5,
    marginTop: -5,
    backgroundColor: '#4FA3FF',
    shadowColor: '#4FA3FF',
  },
  southernOceanMask: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    // latToY(-60) ≈ 83.3% — everything below is only Antarctica.
    height: '16.6%',
    backgroundColor: '#000000',
  },
});

// Seconds update the clock rows several times per second. The map only needs
// to change when the minute/selection changes, avoiding a visible image blink.
export default React.memo(WorldMap, (prev, next) => {
  const prevMinute = prev.date ? Math.floor(prev.date.getTime() / 60000) : 0;
  const nextMinute = next.date ? Math.floor(next.date.getTime() / 60000) : 0;
  return prevMinute === nextMinute
    && prev.selectedId === next.selectedId
    && prev.cities === next.cities;
});
