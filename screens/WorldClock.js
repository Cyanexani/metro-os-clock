import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, FlatList, Modal, Pressable } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fonts } from '../styles/fonts';
import { useSettings } from '../context/SettingsContext';
import MetroTouchable from '../components/core/MetroTouchable';
import WorldMap from '../components/compound/WorldMap';
import AnimatedCityRow from '../components/compound/AnimatedCityRow';
import WorldClockHeader from '../components/compound/WorldClockHeader';
import WorldClockAppBar from '../components/compound/WorldClockAppBar';
import useMapZoom, { MAP_DISPLAY_H } from '../components/compound/useMapZoom';
import { CITY_DATABASE } from '../data/cities';

const STORAGE_KEY = '@world_clock_cities';

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

// "Date display: Day of Week" mode (settings ref 012554) — the row's day line
// shows the weekday name in the city's timezone instead of Today/Yesterday.
const weekdayFormatters = new Map();
const getWeekdayForTz = (date, tz) => {
  const key = tz || 'local';
  if (!weekdayFormatters.has(key)) {
    weekdayFormatters.set(key, new Intl.DateTimeFormat('en-US', {
      timeZone: tz || undefined,
      weekday: 'long',
    }));
  }
  try {
    return weekdayFormatters.get(key).format(date);
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

    return { time: timeText, ampm, dayText };
  } catch (e) {
    return { time: '--:--', ampm: '', dayText: '' };
  }
};

export default function WorldClock({ navigation }) {
  const { settings } = useSettings();
  const { mapAnimatedStyle, selectCity, deselect, selectedId } = useMapZoom();
  const [time, setTime] = useState(new Date());
  const [myCities, setMyCities] = useState([]);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isModalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [reorderMode, setReorderMode] = useState(false);

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

  const moveCity = (index, direction) => {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= myCities.length) return;
    setMyCities(prev => {
      const next = [...prev];
      [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
      return next;
    });
  };

  const filteredSearch = (searchQuery.trim() === ''
    ? CITY_DATABASE
    : CITY_DATABASE.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
  ).slice(0, 100);

  // Match the local city to the database so its header label is formatted
  // identically to the rows below (Title Case "City, Region, Country"). Fall
  // back to prettifying the IANA zone if the exact zone isn't in the database.
  const localTzInfo = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const localDbCity = localTzInfo ? CITY_DATABASE.find(c => c.tz === localTzInfo) : null;
  const prettifyZone = (tz) => tz
    ? tz.split('/').pop().replace(/_/g, ' ').replace(/\b\w/g, ch => ch.toUpperCase())
    : 'Local time';
  const localCityName = localDbCity ? localDbCity.name : prettifyZone(localTzInfo);
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
        <Text style={[styles.overline, fonts.regular]} pointerEvents="none">
          WORLD CLOCK
        </Text>
      </Pressable>

      {/* Local Time Header */}
      <WorldClockHeader
        timeText={localTimeText}
        ampm={localAmpm}
        cityName={localCityName}
        dayText={settings.dateDisplay === 'weekday' ? getWeekdayForTz(time, null) : 'Today'}
        dimmed={selectedId !== null}
      />

      {/* Cities List */}
      <ScrollView
        style={styles.listContainer}
        contentContainerStyle={styles.listContent}
        bounces={false}
        overScrollMode="never"
        showsVerticalScrollIndicator={false}
      >
        {myCities.map((city, index) => {
          const { time: cTime, ampm: cAmpm, dayText: cDay } = getFormattedTimeForTz(time, city.tz, settings.use24Hour, settings.showSeconds);
          const rowDay = settings.dateDisplay === 'weekday'
            ? getWeekdayForTz(time, city.tz)
            : (cDay || 'Today');

          return (
            <AnimatedCityRow
              key={city.id}
              city={city}
              timeText={cTime}
              ampm={cAmpm}
              dayText={rowDay}
              selectedId={selectedId}
              reorderMode={reorderMode}
              onMoveUp={() => moveCity(index, -1)}
              onMoveDown={() => moveCity(index, 1)}
              onPress={reorderMode ? undefined : () => selectCity(city)}
              onLongPress={reorderMode ? undefined : () => handleRemoveCity(city.id)}
            />
          );
        })}
      </ScrollView>

      {/* Bottom App Bar */}
      <WorldClockAppBar
        onAdd={() => setModalVisible(true)}
        onOpenSettings={() => navigation && navigation.navigate('WorldClockSettings')}
        onReorder={() => setReorderMode(true)}
        reorderMode={reorderMode}
        onDoneReorder={() => setReorderMode(false)}
      />

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

  mapContainer: { width: '100%', height: MAP_DISPLAY_H, backgroundColor: '#000000', overflow: 'hidden' },

  overline: {
    position: 'absolute',
    top: 12,
    left: 20,
    color: 'white',
    fontSize: 13,
    letterSpacing: 1,
  },

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
