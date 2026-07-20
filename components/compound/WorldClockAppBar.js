import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { fonts } from '../../styles/fonts';
import MetroTouchable from '../core/MetroTouchable';

// WP world clock app bar (refs 012453/012508/012544): a LIGHT GREY bar with a
// dark circled + centred and dark ••• at the right. Tapping ••• expands the
// same grey panel downward-in-place: the + gains an "add" label beneath it and
// the overflow menu ("settings", "reorder list") lists in black text.
const BAR_GREY = '#BEBEBE';
const INK = '#1f1f1f';

export default function WorldClockAppBar({ onAdd, onOpenSettings, onReorder, reorderMode = false, onDoneReorder }) {
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
          <Text style={[styles.dots, fonts.regular]}>•••</Text>
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
          {reorderMode ? (
            <MetroTouchable
              style={styles.menuItem}
              onPress={() => { setExpanded(false); onDoneReorder && onDoneReorder(); }}
            >
              <Text style={[styles.menuText, fonts.regular]}>done</Text>
            </MetroTouchable>
          ) : (
            <MetroTouchable
              style={styles.menuItem}
              onPress={() => { setExpanded(false); onReorder && onReorder(); }}
            >
              <Text style={[styles.menuText, fonts.regular]}>reorder list</Text>
            </MetroTouchable>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { backgroundColor: BAR_GREY },
  topRow: { height: 65, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  addWrap: { alignItems: 'center' },
  circleBtn: { width: 44, height: 44, borderRadius: 22, borderWidth: 2.5, borderColor: INK, justifyContent: 'center', alignItems: 'center' },
  plus: { color: INK, fontSize: 26, lineHeight: 30, fontWeight: '300' },
  addLabel: { color: INK, fontSize: 12, marginTop: 2 },
  dotsHit: { position: 'absolute', right: 8, top: 0, padding: 10 },
  dots: { color: INK, fontSize: 16, letterSpacing: 1 },
  menu: { paddingBottom: 10 },
  menuItem: { paddingVertical: 12, paddingHorizontal: 20 },
  menuText: { color: INK, fontSize: 20 },
});
