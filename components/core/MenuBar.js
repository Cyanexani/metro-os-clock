import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import RoundedButton from './RoundedButton';
import { fonts } from '../../styles/fonts';

const BAR_COLOR = '#111111';

const OverflowDots = ({ onPress }) => (
  <Pressable style={styles.dotsHit} onPress={onPress} hitSlop={8}>
    <View style={styles.dotsRow}>
      <View style={styles.dot} />
      <View style={styles.dot} />
      <View style={styles.dot} />
    </View>
  </Pressable>
);

const ShortMenu = ({ children, handleExpand }) => (
  <View style={styles.shortMenu}>
    {children}
    <OverflowDots onPress={handleExpand} />
  </View>
);

export const MenuBar = ({ options, controls }) => {
  const [expanded, setExpanded] = useState(false);

  if (!expanded) {
    return <ShortMenu handleExpand={() => setExpanded(true)}>{controls}</ShortMenu>;
  }

  return (
    <View style={styles.menuBarExpanded}>
      <ShortMenu handleExpand={() => setExpanded(false)}>{controls}</ShortMenu>
      <ScrollView>
        <View style={styles.menuOptions}>{options}</View>
      </ScrollView>
    </View>
  );
};

export const QuickMenu = ({ options, overflow = [] }) => {
  const [expanded, setExpanded] = useState(false);
  const hasOverflow = overflow.length > 0;

  return (
    <View style={styles.quickMenu}>
      {expanded && hasOverflow ? (
        <View style={styles.overflowPanel}>
          {overflow.map(item => (
            <Pressable
              key={item.text}
              style={({ pressed }) => [styles.overflowItem, pressed && styles.pressed]}
              onPress={() => {
                setExpanded(false);
                item.onPress && item.onPress();
              }}
            >
              <Text style={[styles.overflowText, fonts.light]}>{item.text}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      <View style={styles.quickRow}>
        <View style={styles.actionArea}>
          {options.map(option => (
            <Pressable key={option.text} onPress={option.onPress} hitSlop={10}>
              <View style={styles.action}>
                <RoundedButton Icon={option.Icon} />
                {expanded && hasOverflow ? (
                  <Text style={[styles.actionLabel, fonts.light]}>{option.text}</Text>
                ) : null}
              </View>
            </Pressable>
          ))}
        </View>
        {hasOverflow ? (
          <OverflowDots onPress={() => setExpanded(value => !value)} />
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  quickMenu: { width: '100%', backgroundColor: BAR_COLOR },
  quickRow: { height: 72, flexDirection: 'row', alignItems: 'center' },
  actionArea: { flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  action: { alignItems: 'center', marginHorizontal: 16 },
  actionLabel: { color: 'white', fontSize: 12, marginTop: 2, textTransform: 'lowercase' },
  dotsHit: { position: 'absolute', right: 0, bottom: 0, width: 72, height: 72, alignItems: 'center', justifyContent: 'center' },
  dotsRow: { flexDirection: 'row', gap: 4 },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: 'white' },
  overflowPanel: { backgroundColor: BAR_COLOR, paddingTop: 6, paddingBottom: 8 },
  overflowItem: { paddingHorizontal: 22, paddingVertical: 12 },
  overflowText: { color: 'white', fontSize: 20, textTransform: 'lowercase' },
  pressed: { opacity: 0.55 },
  shortMenu: { height: 56, width: '100%', backgroundColor: '#222222', flexDirection: 'row', alignItems: 'center' },
  menuBarExpanded: { width: '100%', maxHeight: '40%', backgroundColor: '#222222' },
  menuOptions: { paddingHorizontal: 16, paddingVertical: 16 },
});
