import React, { useRef, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { fonts } from '../../styles/fonts';
import MetroTouchable from '../../components/core/MetroTouchable';

// The alarm time picker in the supplied WP references uses the classic amber
// selection tile; blue remains the app accent elsewhere.
const ACCENT = '#F4A300';

const HOUR12_LABELS = ['12', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11'];
const HOUR24_LABELS = new Array(24).fill(0).map((_, i) => String(i).padStart(2, '0'));
const MINUTE_LABELS = new Array(60).fill(0).map((_, i) => String(i).padStart(2, '0'));
const AMPM_LABELS = ['AM', 'PM'];

const DAYS_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAYS_ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Shared bottom app bar: circular accept / cancel only — the WP picker pages
// have no overflow menu, so no ••• here.
const AppBar = ({ onAccept, onCancel }) => (
  <View style={styles.appBar}>
    <View style={styles.appBarButtons}>
      <MetroTouchable style={styles.circleBtn} onPress={onAccept}>
        <Text style={styles.circleGlyph}>✓</Text>
      </MetroTouchable>
      <MetroTouchable style={styles.circleBtn} onPress={onCancel}>
        <Text style={styles.circleGlyph}>✕</Text>
      </MetroTouchable>
    </View>
  </View>
);

const TILE = 90;
const TILE_GAP = 12;
const TILE_ROW_H = TILE + TILE_GAP;
// The fixed selection slot: one tile-row down from the top of the picker so
// all three amber tiles sit on the same line (ref 012156's 7|00|AM row).
const SLOT_TOP = TILE_ROW_H * 1.5;

// WP tile wheel column. The amber tile is FIXED at the slot line; the values
// scroll through it. The surrounding white outlined tiles are only visible
// while the user is touching/scrolling this column — at rest the column shows
// just its amber tile on an otherwise empty page (refs 012156/012248/012259).
// Selection updates live as tiles pass the slot so the amber highlight never
// lags the scroll.
const WheelColumn = ({ labels, selectedIndex, onSelect }) => {
  const scrollRef = useRef(null);
  const [interacting, setInteracting] = useState(false);
  const hideTimer = useRef(null);
  const lastIndex = useRef(selectedIndex);

  const showNeighbours = () => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    setInteracting(true);
  };
  // Keep neighbours visible briefly after the finger lifts, like WP does.
  const scheduleHide = () => {
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setInteracting(false), 700);
  };

  const indexForOffset = (y) => {
    const i = Math.round(y / TILE_ROW_H);
    return Math.max(0, Math.min(labels.length - 1, i));
  };

  const liveSelect = (e) => {
    const i = indexForOffset(e.nativeEvent.contentOffset.y);
    if (i !== lastIndex.current) {
      lastIndex.current = i;
      onSelect(i);
    }
  };

  return (
    <View style={styles.wheel}>
      <ScrollView
        ref={scrollRef}
        style={StyleSheet.absoluteFill}
        contentContainerStyle={{
          paddingTop: SLOT_TOP,
          paddingBottom: PICKER_VIEW_H - SLOT_TOP - TILE_ROW_H,
        }}
        contentOffset={{ x: 0, y: selectedIndex * TILE_ROW_H }}
        snapToInterval={TILE_ROW_H}
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={liveSelect}
        onScrollBeginDrag={showNeighbours}
        onMomentumScrollEnd={(e) => { liveSelect(e); scheduleHide(); }}
        onScrollEndDrag={(e) => { liveSelect(e); scheduleHide(); }}
      >
        {labels.map((label, i) => {
          const isSelected = i === selectedIndex;
          return (
            <View key={label + i} style={styles.tileSlot}>
              <View
                style={[
                  styles.tile,
                  isSelected
                    ? styles.tileSelected
                    : interacting
                      ? styles.tileIdle
                      : styles.tileHidden,
                ]}
              >
                <Text
                  style={[
                    isSelected ? styles.tileTextSelected : styles.tileTextIdle,
                    fonts.light,
                    !isSelected && !interacting && styles.textHidden,
                  ]}
                >
                  {label}
                </Text>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

export function TimePickerPage({ hour24, minute, use24Hour = false, onChange, onAccept, onCancel }) {
  const pm = hour24 >= 12;

  if (use24Hour) {
    // 24-hour clock setting: one 0–23 hour wheel, no AM/PM column.
    return (
      <View style={styles.page}>
        <Text style={[styles.overline, fonts.regular]}>TIME</Text>
        <View style={styles.pickerRow}>
          <WheelColumn labels={HOUR24_LABELS} selectedIndex={hour24} onSelect={(i) => onChange(i, minute)} />
          <WheelColumn labels={MINUTE_LABELS} selectedIndex={minute} onSelect={(i) => onChange(hour24, i)} />
        </View>
        <AppBar onAccept={onAccept} onCancel={onCancel} />
      </View>
    );
  }

  const hour12Index = hour24 % 12; // 0 => 12, 1 => 1 ...
  const setHour = (index) => onChange(index + (pm ? 12 : 0), minute);
  const setMinute = (index) => onChange(hour24, index);
  const setAmpm = (index) => onChange((hour24 % 12) + (index === 1 ? 12 : 0), minute);

  return (
    <View style={styles.page}>
      <Text style={[styles.overline, fonts.regular]}>TIME</Text>
      <View style={styles.pickerRow}>
        <WheelColumn labels={HOUR12_LABELS} selectedIndex={hour12Index} onSelect={setHour} />
        <WheelColumn labels={MINUTE_LABELS} selectedIndex={minute} onSelect={setMinute} />
        <WheelColumn labels={AMPM_LABELS} selectedIndex={pm ? 1 : 0} onSelect={setAmpm} />
      </View>
      <AppBar onAccept={onAccept} onCancel={onCancel} />
    </View>
  );
}

export function RepeatsPage({ repeat, onToggleDay, onAccept, onCancel }) {
  return (
    <View style={styles.page}>
      <Text style={[styles.overline, fonts.regular]}>ALARM REPEATS ON</Text>
      <ScrollView contentContainerStyle={styles.daysContent} showsVerticalScrollIndicator={false}>
        {DAYS_FULL.map((full, i) => {
          const abbr = DAYS_ABBR[i];
          const checked = repeat.includes(abbr);
          return (
            <MetroTouchable key={abbr} style={styles.dayRow} onPress={() => onToggleDay(abbr)}>
              {/* MetroTouchable renders children inside an inner Animated.View,
                  so the row direction must live on this wrapper, not on the
                  touchable's own style. */}
              <View style={styles.dayRowInner}>
                <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
                  {checked ? <Text style={styles.checkGlyph}>✓</Text> : null}
                </View>
                <Text style={[styles.dayText, fonts.regular]}>{full}</Text>
              </View>
            </MetroTouchable>
          );
        })}
      </ScrollView>
      <AppBar onAccept={onAccept} onCancel={onCancel} />
    </View>
  );
}

const PICKER_VIEW_H = Dimensions.get('window').height - 160; // page minus overline+app bar

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: 'black', paddingTop: 30 },
  overline: { color: '#bbb', fontSize: 13, letterSpacing: 2, textTransform: 'uppercase', paddingHorizontal: 20, marginBottom: 8 },

  pickerRow: { flex: 1, flexDirection: 'row', justifyContent: 'center', paddingHorizontal: 12 },
  wheel: { width: TILE + TILE_GAP, marginHorizontal: 3, height: PICKER_VIEW_H, overflow: 'hidden' },
  tileSlot: { height: TILE_ROW_H, alignItems: 'center', justifyContent: 'center' },
  tile: { width: TILE, height: TILE, justifyContent: 'center', alignItems: 'center' },
  tileSelected: { backgroundColor: ACCENT },
  tileIdle: { borderWidth: 2, borderColor: '#3a3a3a' },
  tileHidden: { borderWidth: 0 },
  tileTextSelected: { color: 'white', fontSize: 40 },
  tileTextIdle: { color: '#d0d0d0', fontSize: 36 },
  textHidden: { opacity: 0 },

  daysContent: { paddingHorizontal: 20, paddingTop: 8 },
  dayRow: { paddingVertical: 14 },
  dayRowInner: { flexDirection: 'row', alignItems: 'center' },
  checkbox: { width: 26, height: 26, borderWidth: 2, borderColor: 'white', justifyContent: 'center', alignItems: 'center' },
  checkboxChecked: { backgroundColor: 'transparent' },
  checkGlyph: { color: 'white', fontSize: 18, lineHeight: 20 },
  dayText: { color: 'white', fontSize: 22, marginLeft: 14 },

  appBar: { height: 65, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderTopWidth: 1, borderTopColor: '#1a1a1a', backgroundColor: 'black' },
  appBarButtons: { flexDirection: 'row' },
  circleBtn: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: 'white', justifyContent: 'center', alignItems: 'center', marginHorizontal: 12 },
  circleGlyph: { color: 'white', fontSize: 22, lineHeight: 26 },
});
