import { useState, useRef, useCallback } from 'react';
import { Dimensions } from 'react-native';
import {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';

// Metro's ease-in-out for the map moves.
const EASE = Easing.bezier(0.4, 0, 0.2, 1);
const ZOOM_SCALE = 2.8;
const ZOOM_MS = 450; // pan + zoom from idle
const SWEEP_MS = 350; // lateral move between cities at the same zoom
const RESET_MS = 400; // zoom back out

// The map is displayed full-width at a fixed height (~38% of the screen, per
// the WP world-clock layout). Both this hook and WorldClock's mapContainer use
// MAP_DISPLAY_H so the zoom-to-centre math matches the pixels on screen.
const WIN = Dimensions.get('window');
const VIEWPORT_W = WIN.width;
export const MAP_DISPLAY_H = Math.round(WIN.height * 0.38);
const VIEWPORT_H = MAP_DISPLAY_H;

// Translate needed to bring a city's projected point to the viewport centre
// when the map is scaled by `s` about its centre.
//   screenOffset(v) = s * v + t   →   t = -s * v   to land v at centre.
// If on-device the pan direction is inverted, this is the one line to flip.
const centreOn = (xPct, yPct, s) => {
  const tx = (xPct / 100) * VIEWPORT_W;
  const ty = (yPct / 100) * VIEWPORT_H;
  return {
    tx: -s * (tx - VIEWPORT_W / 2),
    ty: -s * (ty - VIEWPORT_H / 2),
  };
};

export default function useMapZoom() {
  const scale = useSharedValue(1);
  const transX = useSharedValue(0);
  const transY = useSharedValue(0);

  const [selectedId, setSelectedId] = useState(null);
  const selectedRef = useRef(null);

  const mapAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: transX.value },
      { translateY: transY.value },
      { scale: scale.value },
    ],
  }));

  const deselect = useCallback(() => {
    scale.value = withTiming(1, { duration: RESET_MS, easing: EASE });
    transX.value = withTiming(0, { duration: RESET_MS, easing: EASE });
    transY.value = withTiming(0, { duration: RESET_MS, easing: EASE });
    selectedRef.current = null;
    setSelectedId(null);
  }, []);

  const selectCity = useCallback((city) => {
    if (!city) return;
    const alreadyZoomed = selectedRef.current !== null;
    // Tapping the same city again toggles back to the full map.
    if (selectedRef.current === city.id) {
      deselect();
      return;
    }

    const target = centreOn(city.x, city.y, ZOOM_SCALE);
    // Lateral sweep (no zoom change) when already zoomed; full zoom otherwise.
    const dur = alreadyZoomed ? SWEEP_MS : ZOOM_MS;

    scale.value = withTiming(ZOOM_SCALE, { duration: dur, easing: EASE });
    transX.value = withTiming(target.tx, { duration: dur, easing: EASE });
    transY.value = withTiming(target.ty, { duration: dur, easing: EASE });

    selectedRef.current = city.id;
    setSelectedId(city.id);
  }, [deselect]);

  return { mapAnimatedStyle, selectCity, deselect, selectedId, VIEWPORT_H };
}
