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
const ZOOM_SCALE = 3.2;
const ZOOM_MS = 450; // pan + zoom from idle
const SWEEP_MS = 350; // lateral move between cities at the same zoom
const RESET_MS = 400; // zoom back out

// Idle, the map is a full-width strip (~38% of the screen) at the top. When a
// city is selected the strip scales up until the map covers the WHOLE screen
// and the city sits at the screen's centre, with the header/rows drawn over
// it (refs 012512/012544). The zoom math therefore centres on the window,
// not the strip.
const WIN = Dimensions.get('window');
const VIEWPORT_W = WIN.width;
// Match the source image's aspect (1280x712) so land isn't stretched.
export const MAP_DISPLAY_H = Math.round(WIN.width * (712 / 1280));
const SCREEN_H = WIN.height;

// Translate needed to bring a city's projected point to the SCREEN centre
// when the strip is scaled by `s` about its own centre.
//   screenPos(p) = stripCentre + s * (p - stripCentre) + t
// Solve for t with screenPos = (W/2, SCREEN_H/2).
const centreOn = (xPct, yPct, s) => {
  const px = (xPct / 100) * VIEWPORT_W;
  const py = (yPct / 100) * MAP_DISPLAY_H;
  return {
    tx: -s * (px - VIEWPORT_W / 2),
    ty: SCREEN_H / 2 - MAP_DISPLAY_H / 2 - s * (py - MAP_DISPLAY_H / 2),
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
