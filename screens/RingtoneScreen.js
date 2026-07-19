import React, { useState, useEffect, useRef } from "react";
import { StyleSheet, View, Text, FlatList, Pressable } from "react-native";
import { Audio } from 'expo-av';
import { fonts } from "../styles/fonts";
import { RINGTONES, getRingtone } from "../data/ringtones";

export default function RingtoneScreen(props) {
  const routeParams = props.route?.params || {};
  const currentSoundParam = routeParams.currentSound || props.currentSound;
  
  const [selectedSound, setSelectedSound] = useState(currentSoundParam);
  const previewRef = useRef(null);
  const flatListRef = useRef(null);

  useEffect(() => {
    return () => {
      stopPreview();
    };
  }, []);

  const stopPreview = async () => {
    if (previewRef.current) {
      try { await previewRef.current.stopAsync(); } catch (e) { }
      try { await previewRef.current.unloadAsync(); } catch (e) { }
      previewRef.current = null;
    }
  };

  const playPreview = async (soundId) => {
    await stopPreview();
    try {
      const { sound } = await Audio.Sound.createAsync(
        getRingtone(soundId).module,
        { isLooping: false, volume: 1.0, shouldPlay: true },
      );
      previewRef.current = sound;
    } catch (e) {}
  };

  const handleSelect = (soundId) => {
    setSelectedSound(soundId);
    playPreview(soundId);
  };

  const handleSave = () => {
    stopPreview();
    if (props.onSelect) {
      props.onSelect(selectedSound);
    }
    if (props.onClose) {
      props.onClose();
    } else if (props.navigation) {
      props.navigation.navigate({
        name: 'AlarmMain',
        params: { selectedSound },
        merge: true,
      });
    }
  };

  const renderItem = ({ item }) => {
    const isSelected = item.id === selectedSound;
    return (
      <Pressable style={styles.row} onPress={() => handleSelect(item.id)}>
        <Text style={[styles.name, fonts.regular, isSelected && styles.selectedText]}>
          {item.name.toLowerCase()}
        </Text>
        {isSelected && (
          <Text style={[styles.checkmark, fonts.regular]}>✓</Text>
        )}
      </Pressable>
    );
  };

  const initialIndex = RINGTONES.findIndex(r => r.id === currentSoundParam);
  const validInitialIndex = initialIndex >= 0 ? initialIndex : 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, fonts.light]}>sound</Text>
      </View>
      <FlatList
        ref={flatListRef}
        data={RINGTONES}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        initialScrollIndex={validInitialIndex}
        onScrollToIndexFailed={(info) => {
          setTimeout(() => {
            if (flatListRef.current) {
              flatListRef.current.scrollToIndex({ index: info.index, animated: true });
            }
          }, 500);
        }}
        getItemLayout={(data, index) => ({
          length: 60,
          offset: 60 * index,
          index,
        })}
      />
      <View style={styles.bottomBar}>
        <Pressable style={styles.button} onPress={handleSave}>
          <Text style={[styles.buttonText, fonts.regular]}>save</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  header: { paddingTop: 40, paddingBottom: 20, paddingHorizontal: 20 },
  title: { color: 'white', fontSize: 48, letterSpacing: -1 },
  list: { paddingBottom: 80 },
  row: { height: 60, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20 },
  name: { color: 'white', fontSize: 24 },
  selectedText: { color: '#0078D7' },
  checkmark: { color: '#0078D7', fontSize: 24 },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#111', padding: 15, flexDirection: 'row', justifyContent: 'center' },
  button: { paddingHorizontal: 30, paddingVertical: 10 },
  buttonText: { color: 'white', fontSize: 18 }
});
