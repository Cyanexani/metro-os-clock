import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { fonts } from '../../styles/fonts';
import MetroTouchable from '../core/MetroTouchable';

// WP world clock app bar. Collapsed: a centred circular + and the ••• at the
// right. Tapping ••• expands to reveal the "add" label plus the overflow menu
// ("settings", "reorder list"), matching the real Alarms & Clock app bar.
export default function WorldClockAppBar({ onAdd, onOpenSettings, onReorder }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={styles.bar}>
      <View style={styles.topRow}>
        <View style={styles.addWrap}>
          <MetroTouchable style={styles.circleBtn} onPress={onAdd}>
            <Text style={styles.plus}>+</Text>
          </MetroTouchable>
          {expanded ? <Text style={[styles.addLabel, fonts.regular]}>add</Text> : null}
        </View>
        <MetroTouchable style={styles.dotsHit} onPress={() => setExpanded(e => !e)}>
          <Text style={[styles.dots, fonts.regular]}>⋯</Text>
        </MetroTouchable>
      </View>

      {expanded && (
        <View style={styles.menu}>
          <MetroTouchable
            style={styles.menuItem}
            onPress={() => { setExpanded(false); onOpenSettings && onOpenSettings(); }}
          >
            <Text style={[styles.menuText, fonts.regular]}>settings</Text>
          </MetroTouchable>
          <MetroTouchable
            style={styles.menuItem}
            onPress={() => { setExpanded(false); onReorder && onReorder(); }}
          >
            <Text style={[styles.menuText, fonts.regular]}>reorder list</Text>
          </MetroTouchable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { backgroundColor: '#111', paddingBottom: 8 },
  topRow: { height: 65, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  addWrap: { alignItems: 'center' },
  circleBtn: { width: 48, height: 48, borderRadius: 24, borderWidth: 2, borderColor: 'white', justifyContent: 'center', alignItems: 'center' },
  plus: { color: 'white', fontSize: 28, lineHeight: 32 },
  addLabel: { color: '#ccc', fontSize: 11, marginTop: 4 },
  dotsHit: { position: 'absolute', right: 12, padding: 12 },
  dots: { color: 'white', fontSize: 24 },
  menu: { paddingTop: 4 },
  menuItem: { paddingVertical: 14, paddingHorizontal: 20 },
  menuText: { color: 'white', fontSize: 18 },
});
