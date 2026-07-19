import React, { useMemo } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import Animated from 'react-native-reanimated';
import worldMap from '../../assets/world-map.png';
import { lonToX, latToY } from '../../data/cities';

// The source map is a standard equirectangular projection (lon -180..180 → x,
// lat 90..-90 → y). All positions are percentages of the map's own box so the
// overlay stays aligned with the image at any rendered size.

// ── Day/night terminator ───────────────────────────────────────────────────
// Compute the subsolar point (where the sun is directly overhead) for `date`,
// then trace the great-circle terminator as a lon→lat curve. The night side is
// filled with a soft polygon. This is astronomical-grade enough to look right
// without a dependency; it recomputes only when `date` changes (once on open).
const buildTerminatorPath = (date) => {
  const rad = Math.PI / 180;
  const deg = 180 / Math.PI;

  // Days since J2000.0
  const julian = date.getTime() / 86400000 + 2440587.5;
  const n = julian - 2451545.0;

  // Sun's ecliptic longitude
  const L = (280.46 + 0.9856474 * n) % 360;
  const g = ((357.528 + 0.9856003 * n) % 360) * rad;
  const lambda = (L + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) * rad;

  // Obliquity of the ecliptic
  const epsilon = 23.439 * rad;

  // Declination of the sun
  const decl = Math.asin(Math.sin(epsilon) * Math.sin(lambda));

  // Greenwich hour angle → subsolar longitude
  const utcHours = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;
  const subsolarLon = -15 * (utcHours - 12);

  // For each longitude, the terminator latitude where the sun is on the horizon.
  const tanDecl = Math.tan(decl);
  const points = [];
  for (let lon = -180; lon <= 180; lon += 2) {
    const hourAngle = (lon - subsolarLon) * rad;
    const lat = Math.atan(-Math.cos(hourAngle) / tanDecl) * deg;
    points.push([lon, lat]);
  }

  // The hemisphere that is dark depends on the sign of the declination.
  const nightIsNorth = decl > 0 ? false : true;
  const capLat = nightIsNorth ? -90 : 90;

  // Build an SVG path in percentage space, then close it over the dark pole.
  let d = '';
  points.forEach(([lon, lat], i) => {
    const x = lonToX(lon);
    const y = latToY(lat);
    d += `${i === 0 ? 'M' : 'L'}${x.toFixed(3)},${y.toFixed(3)} `;
  });
  const yCap = latToY(capLat);
  d += `L100,${yCap.toFixed(3)} L0,${yCap.toFixed(3)} Z`;
  return d;
};

const WorldMap = ({
  cities = [],
  selectedId = null,
  date,
  mapAnimatedStyle,
}) => {
  const terminatorPath = useMemo(
    () => buildTerminatorPath(date || new Date()),
    // Recompute at most once per minute — the terminator barely moves.
    [date ? Math.floor(date.getTime() / 60000) : 0]
  );

  return (
    <Animated.View style={[styles.mapBox, mapAnimatedStyle]}>
      {/* Ocean base */}
      <View style={styles.ocean} />

      {/* Landmasses — the gray PNG tinted toward Metro's lit-land blue */}
      <Image source={worldMap} style={styles.landImage} resizeMode="stretch" />

      {/* Day/night terminator shadow, drawn in percentage viewBox space */}
      <Svg style={StyleSheet.absoluteFill} viewBox="0 0 100 100" preserveAspectRatio="none">
        <Defs>
          <LinearGradient id="nightFade" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#050B16" stopOpacity="0.72" />
            <Stop offset="1" stopColor="#050B16" stopOpacity="0.72" />
          </LinearGradient>
        </Defs>
        <Path d={terminatorPath} fill="url(#nightFade)" />
      </Svg>

      {/* City pins, absolutely positioned by projected percentage. The real WP
          world clock map shows glowing dots only — no text labels. The wrapper
          is a zero-size point at the coordinate; the dot is centred on it. */}
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
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  mapBox: { width: '100%', height: '100%', overflow: 'hidden', backgroundColor: '#060D1A' },
  ocean: { ...StyleSheet.absoluteFillObject, backgroundColor: '#060D1A' },
  // tintColor recolors the gray land silhouette to Metro's lit-land blue.
  landImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%', tintColor: '#1A2E4A' },
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
});

export default WorldMap;
