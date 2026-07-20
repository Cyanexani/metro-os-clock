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

// The WP map is a shallow strip, but a little taller than its source aspect on
// modern narrow phones. Keep it bounded so it never consumes half the page.
const WIN = Dimensions.get('window');
const VIEWPORT_W = WIN.width;
export const MAP_DISPLAY_H = Math.round(Math.min(WIN.height * 0.31, WIN.width * 0.68));
const VIEWPORT_H = MAP_DISPLAY_H;

// Translate the selected city to the centre of the clipped map viewport.
const centreOn = (xPct, yPct, s) => {
  const px = (xPct / 100) * VIEWPORT_W;
  const py = (yPct / 100) * VIEWPORT_H;
  return {
    tx: -s * (px - VIEWPORT_W / 2),
    ty: -s * (py - VIEWPORT_H / 2),
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

  return { mapAnimatedStyle, selectCity, deselect, selectedId };
}
