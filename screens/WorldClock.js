import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, FlatList, Modal, Pressable } from 'react-native';
import { Plus } from 'react-native-feather';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fonts } from '../styles/fonts';
import { useSettings } from '../context/SettingsContext';
import MetroTouchable from '../components/core/MetroTouchable';
import WorldMap from '../components/compound/WorldMap';
import AnimatedCityRow from '../components/compound/AnimatedCityRow';
import AnimatedTime from '../components/compound/AnimatedTime';
import useMapZoom, { MAP_DISPLAY_H } from '../components/compound/useMapZoom';
import { CITY_DATABASE } from '../data/cities';

const STORAGE_KEY = '@world_clock_cities';
const ACCENT = '#0078D7';

const timeFormatters = new Map();
const dateFormatters = new Map();

const getTimeFormatter = (tz, use24Hour, showSeconds) => {
  const key = `${tz}-${use24Hour}-${showSeconds}`;
  if (!timeFormatters.has(key)) {
    timeFormatters.set(key, new Intl.DateTimeFormat('en-US', {
      timeZone: tz || undefined,
      hour: use24Hour ? '2-digit' : 'numeric',
      minute: '2-digit',
      second: showSeconds ? '2-digit' : undefined,
      hour12: !use24Hour,
      hourCycle: use24Hour ? 'h23' : undefined,
    }));
  }
  return timeFormatters.get(key);
};

const getDateFormatter = (tz) => {
  const key = tz || 'local';
  if (!dateFormatters.has(key)) {
    dateFormatters.set(key, new Intl.DateTimeFormat('en-CA', {
      timeZone: tz || undefined,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }));
  }
  return dateFormatters.get(key);
};

const getOffsetDiffStr = (date, tz) => {
  if (!tz) return 'same time';
  const getParts = (t) => {
    const dtf = new Intl.DateTimeFormat('en-US', {
      timeZone: t, year: 'numeric', month: 'numeric', day: 'numeric',
      hour: 'numeric', minute: 'numeric', hour12: false
    });
    const parts = dtf.formatToParts(date);
    const map = {};
    parts.forEach(p => map[p.type] = p.value);
    return map;
  };
  try {
    const target = getParts(tz);
    const local = getParts(undefined);
    const tDate = Date.UTC(target.year, target.month - 1, target.day, target.hour, target.minute);
    const lDate = Date.UTC(local.year, local.month - 1, local.day, local.hour, local.minute);
    let diff = (tDate - lDate) / 3600000;
    
    if (Math.abs(diff) < 0.05) return 'same time';
    const sign = diff > 0 ? '+' : '';
    return `${sign}${diff}h`;
  } catch (e) {
    return '';
  }
};

const getFormattedTimeForTz = (date, tz, use24Hour, showSeconds) => {
  try {
    const parts = getTimeFormatter(tz, use24Hour, showSeconds).formatToParts(date);
    let timeText = '';
    let ampm = '';
    for (const part of parts) {
      if (part.type === 'hour' || part.type === 'minute' || part.type === 'second' || part.type === 'literal') {
        if (part.type === 'literal' && part.value.trim() === '') continue;
        timeText += part.value;
      } else if (part.type === 'dayPeriod') {
        ampm = part.value.toLowerCase();
      }
    }

    const targetDate = getDateFormatter(tz).format(date);
    const localDate = getDateFormatter(null).format(date);
    let dayText = '';
    if (targetDate > localDate) dayText = 'tomorrow';
    else if (targetDate < localDate) dayText = 'yesterday';

    const offsetText = getOffsetDiffStr(date, tz);

    return { time: timeText, ampm, dayText, offsetText };
  } catch (e) {
    return { time: '--:--', ampm: '', dayText: '', offsetText: '' };
  }
};

export default function WorldClock() {
  const { settings } = useSettings();
  const { mapAnimatedStyle, selectCity, deselect, selectedId } = useMapZoom();
  const [time, setTime] = useState(new Date());
  const [myCities, setMyCities] = useState([]);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isModalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Load saved cities
  useEffect(() => {
    const loadCities = async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved !== null) {
          setMyCities(JSON.parse(saved));
        } else {
          const pick = (id) => CITY_DATABASE.find(c => c.id === id);
          setMyCities([
            pick('seattle-wa-usa'),
            pick('london-united-kingdom'),
            pick('tokyo-japan'),
          ].filter(Boolean));
        }
      } catch (e) { }
      setHasLoaded(true);
    };
    loadCities();
  }, []);

  // Save cities
  useEffect(() => {
    if (hasLoaded) {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(myCities));
    }
  }, [myCities, hasLoaded]);

  // Displayed times update based on settings
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setTime(prev => {
        if (settings.showSeconds) return now; // always update if showing seconds
        return prev.getMinutes() === now.getMinutes() ? prev : now;
      });
    }, settings.showSeconds ? 250 : 1000);
    return () => clearInterval(interval);
  }, [settings.showSeconds]);

  const handleAddCity = (city) => {
    if (!myCities.find(c => c.id === city.id)) {
      setMyCities([...myCities, city]);
    }
    setSearchQuery('');
    setModalVisible(false);
  };

  const handleRemoveCity = (id) => {
    setMyCities(myCities.filter(c => c.id !== id));
  };

  const filteredSearch = (searchQuery.trim() === ''
    ? CITY_DATABASE
    : CITY_DATABASE.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
  ).slice(0, 100);

  const localTzInfo = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const localCityName = localTzInfo ? localTzInfo.split('/').pop().replace(/_/g, ' ').toLowerCase() : 'local time';
  const { time: localTimeText, ampm: localAmpm } = getFormattedTimeForTz(time, null, settings.use24Hour, settings.showSeconds);

  return (
    <View style={styles.container}>
      {/* World map with day/night terminator and city pins.
          Tapping the map (away from the list) zooms back out. */}
      <Pressable style={styles.mapContainer} onPress={deselect}>
        <WorldMap
          cities={myCities}
          selectedId={selectedId}
          date={time}
          mapAnimatedStyle={mapAnimatedStyle}
        />
      </Pressable>

      {/* Local Time Header */}
      <View style={styles.localTimeContainer}>
        <View style={styles.timeRow}>
          <AnimatedTime value={localTimeText} style={[styles.localTime, fonts.extraLight]} />
          <Text style={[styles.localAmpm, fonts.regular]}>{localAmpm}</Text>
        </View>
        <Text style={[styles.localCityName, fonts.regular]}>{localCityName}</Text>
      </View>

      {/* Cities List */}
      <ScrollView
        style={styles.listContainer}
        contentContainerStyle={styles.listContent}
        bounces={false}
        overScrollMode="never"
        showsVerticalScrollIndicator={false}
      >
        {myCities.map((city) => {
          const { time: cTime, ampm: cAmpm, dayText: cDay, offsetText } = getFormattedTimeForTz(time, city.tz, settings.use24Hour, settings.showSeconds);

          return (
            <AnimatedCityRow
              key={city.id}
              city={city}
              timeText={cTime}
              ampm={cAmpm}
              dayText={cDay}
              offsetText={offsetText}
              selectedId={selectedId}
              onPress={() => selectCity(city)}
              onLongPress={() => handleRemoveCity(city.id)}
            />
          );
        })}
      </ScrollView>

      {/* Bottom App Bar */}
      <View style={styles.appBar}>
        <MetroTouchable style={styles.fab} onPress={() => setModalVisible(true)}>
          <Plus stroke="white" width={24} height={24} />
        </MetroTouchable>
      </View>

      {/* Add Location Modal */}
      <Modal visible={isModalVisible} animationType="slide" transparent={false} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalContainer}>
          <TextInput
            style={[styles.searchInput, fonts.regular]}
            placeholder="search..."
            placeholderTextColor="#888"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
          <FlatList
            data={filteredSearch}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <MetroTouchable style={styles.searchResultItem} onPress={() => handleAddCity(item)}>
                <Text style={[styles.searchResultText, fonts.regular]}>{item.name.toLowerCase()}</Text>
              </MetroTouchable>
            )}
            style={styles.searchResultsList}
          />
          <View style={styles.appBar}>
            <MetroTouchable style={styles.fab} onPress={() => setModalVisible(false)}>
              <Text style={styles.fabClose}>x</Text>
            </MetroTouchable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },

  mapContainer: { width: '100%', height: MAP_DISPLAY_H, backgroundColor: '#060D1A' },

  localTimeContainer: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 },
  timeRow: { flexDirection: 'row', alignItems: 'baseline' },
  localTime: { color: 'white', fontSize: 64, includeFontPadding: false },
  localAmpm: { color: 'white', fontSize: 22, marginLeft: 8 },
  localCityName: { color: ACCENT, fontSize: 18, marginTop: -5 },

  listContainer: { flex: 1 },
  listContent: { paddingBottom: 20 },

  appBar: { height: 65, backgroundColor: 'black', flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  fab: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: 'white', justifyContent: 'center', alignItems: 'center' },
  fabClose: { color: 'white', fontSize: 20, marginBottom: 2 },

  modalContainer: { flex: 1, backgroundColor: 'black', paddingTop: 40 },
  searchInput: { backgroundColor: 'white', color: 'black', fontSize: 20, marginHorizontal: 20, padding: 12, borderRadius: 0, marginBottom: 10 },
  searchResultsList: { backgroundColor: 'black', marginHorizontal: 20, flex: 1, marginBottom: 20 },
  searchResultItem: { paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#333' },
  searchResultText: { color: 'white', fontSize: 18 },
});
