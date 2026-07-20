import React, { useRef, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { fonts } from '../../styles/fonts';
import MetroTouchable from '../../components/core/MetroTouchable';

// The alarm time picker in the supplied WP references uses the classic amber
// selection tile; blue remains the app accent elsewhere.
const ACCENT = '#F4A300';

const HOUR_LABELS = ['12', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11'];
const MINUTE_LABELS = new Array(60).fill(0).map((_, i) => String(i).padStart(2, '0'));
const AMPM_LABELS = ['AM', 'PM'];

const DAYS_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAYS_ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Shared bottom app bar: circular accept / cancel, dots at the far right.
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
    <Text style={[styles.dots, fonts.regular]}>•••</Text>
  </View>
);

// A single tap-to-select tile. Selected = filled accent square; others outlined.
const Tile = ({ label, selected, onPress }) => (
  <MetroTouchable
    style={[styles.tile, selected ? styles.tileSelected : styles.tileIdle]}
    onPress={onPress}
  >
    <Text style={[selected ? styles.tileTextSelected : styles.tileTextIdle, fonts.light]}>
      {label}
    </Text>
  </MetroTouchable>
);

// Each column scrolls independently; on mount it centres its selected tile so
// all three selected tiles line up in one row (refs 012248/012259).
const Column = ({ labels, selectedIndex, onSelect }) => {
  const scrollRef = useRef(null);

  useEffect(() => {
    // Centre the selected tile in the viewport on mount.
    const y = Math.max(0, selectedIndex * TILE_ROW_H - PICKER_VIEW_H / 2 + TILE_ROW_H / 2 + COLUMN_PAD);
    scrollRef.current?.scrollTo({ y, animated: false });
  }, []);

  return (
    <ScrollView
      ref={scrollRef}
      style={styles.column}
      contentContainerStyle={styles.columnContent}
      showsVerticalScrollIndicator={false}
    >
      {labels.map((label, i) => (
        <Tile key={label + i} label={label} selected={i === selectedIndex} onPress={() => onSelect(i)} />
      ))}
    </ScrollView>
  );
};

export function TimePickerPage({ hour24, minute, onChange, onAccept, onCancel }) {
  const pm = hour24 >= 12;
  const hour12Index = hour24 % 12; // 0 => 12, 1 => 1 ...

  const setHour = (index) => {
    // index 0 is the "12" label => 0 hours before the PM offset.
    const base = index; // 0..11 maps directly onto hour24 % 12
    onChange(base + (pm ? 12 : 0), minute);
  };
  const setMinute = (index) => onChange(hour24, index);
  const setAmpm = (index) => onChange((hour24 % 12) + (index === 1 ? 12 : 0), minute);

  return (
    <View style={styles.page}>
      <Text style={[styles.overline, fonts.regular]}>TIME</Text>
      <View style={styles.pickerRow}>
        <Column labels={HOUR_LABELS} selectedIndex={hour12Index} onSelect={setHour} />
        <Column labels={MINUTE_LABELS} selectedIndex={minute} onSelect={setMinute} />
        <Column labels={AMPM_LABELS} selectedIndex={pm ? 1 : 0} onSelect={setAmpm} />
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
              <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
                {checked ? <Text style={styles.checkGlyph}>✓</Text> : null}
              </View>
              <Text style={[styles.dayText, fonts.regular]}>{full}</Text>
            </MetroTouchable>
          );
        })}
      </ScrollView>
      <AppBar onAccept={onAccept} onCancel={onCancel} />
    </View>
  );
}

const TILE = 90;
const TILE_ROW_H = TILE + 12; // tile + marginVertical 6 top/bottom
const COLUMN_PAD = 120;
const PICKER_VIEW_H = Dimensions.get('window').height - 160; // page minus overline+app bar

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#081109', paddingTop: 30 },
  overline: { color: '#bbb', fontSize: 13, letterSpacing: 2, textTransform: 'uppercase', paddingHorizontal: 20, marginBottom: 8 },

  pickerRow: { flex: 1, flexDirection: 'row', justifyContent: 'center', paddingHorizontal: 12 },
  column: { flexGrow: 0, width: TILE + 12, marginHorizontal: 3 },
  columnContent: { alignItems: 'center', paddingVertical: 120 },
  tile: { width: TILE, height: TILE, marginVertical: 6, justifyContent: 'center', alignItems: 'center' },
  tileSelected: { backgroundColor: ACCENT },
  tileIdle: { borderWidth: 2, borderColor: '#3a3a3a' },
  tileTextSelected: { color: 'white', fontSize: 40 },
  tileTextIdle: { color: '#d0d0d0', fontSize: 36 },

  daysContent: { paddingHorizontal: 20, paddingTop: 8 },
  dayRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
  checkbox: { width: 26, height: 26, borderWidth: 2, borderColor: 'white', justifyContent: 'center', alignItems: 'center' },
  checkboxChecked: { backgroundColor: 'transparent' },
  checkGlyph: { color: 'white', fontSize: 18, lineHeight: 20 },
  dayText: { color: 'white', fontSize: 22, marginLeft: 14 },

  appBar: { height: 65, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderTopWidth: 1, borderTopColor: '#1a1a1a' },
  appBarButtons: { flexDirection: 'row' },
  circleBtn: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: 'white', justifyContent: 'center', alignItems: 'center', marginHorizontal: 12 },
  circleGlyph: { color: 'white', fontSize: 22, lineHeight: 26 },
  dots: { position: 'absolute', right: 24, color: 'white', fontSize: 24 },
});
