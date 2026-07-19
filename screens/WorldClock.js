import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TextInput, FlatList, Modal } from 'react-native';
import * as Battery from 'expo-battery';
import { Plus } from 'react-native-feather';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fonts } from '../styles/fonts';
import MetroTouchable from '../components/core/MetroTouchable';

const STORAGE_KEY = '@world_clock_cities';
const ACCENT = '#0078D7';

// Hardcoded city database for the search and map plotting
const CITY_DATABASE = [
  { id: 'seattle', name: 'Seattle, WA, USA', tz: 'America/Los_Angeles', x: 18, y: 30 },
  { id: 'london', name: 'London, United Kingdom', tz: 'Europe/London', x: 48, y: 28 },
  { id: 'sydney', name: 'Sydney, NSW, Australia', tz: 'Australia/Sydney', x: 87, y: 75 },
  { id: 'vaduz', name: 'Vaduz, Liechtenstein', tz: 'Europe/Vaduz', x: 51, y: 30 },
  { id: 'valencia', name: 'Valencia, Spain', tz: 'Europe/Madrid', x: 48, y: 35 },
  { id: 'vancouver', name: 'Vancouver, BC, Canada', tz: 'America/Vancouver', x: 17, y: 25 },
  { id: 'vatican', name: 'Vatican City, Vatican City', tz: 'Europe/Vatican', x: 51, y: 36 },
  { id: 'tokyo', name: 'Tokyo, Japan', tz: 'Asia/Tokyo', x: 85, y: 38 },
  { id: 'newyork', name: 'New York, NY, USA', tz: 'America/New_York', x: 28, y: 35 },
  { id: 'paris', name: 'Paris, France', tz: 'Europe/Paris', x: 49, y: 31 },
  { id: 'delhi', name: 'New Delhi, India', tz: 'Asia/Kolkata', x: 70, y: 45 },
  { id: 'dubai', name: 'Dubai, UAE', tz: 'Asia/Dubai', x: 63, y: 46 },
];

// Intl.DateTimeFormat construction is expensive; build each formatter once
// per timezone and reuse it on every tick.
const timeFormatters = new Map();
const dateFormatters = new Map();

const getTimeFormatter = (tz) => {
  if (!timeFormatters.has(tz)) {
    timeFormatters.set(tz, new Intl.DateTimeFormat('en-US', {
      timeZone: tz, hour: 'numeric', minute: '2-digit', hour12: true,
    }));
  }
  return timeFormatters.get(tz);
};

// en-CA gives YYYY-MM-DD, which compares lexicographically as a date.
const getDateFormatter = (tz) => {
  const key = tz || 'local';
  if (!dateFormatters.has(key)) {
    dateFormatters.set(key, new Intl.DateTimeFormat('en-CA', tz
      ? { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }
      : { year: 'numeric', month: '2-digit', day: '2-digit' }));
  }
  return dateFormatters.get(key);
};

const getFormattedTimeForTz = (date, tz) => {
  try {
    // formatToParts instead of splitting the formatted string: modern ICU
    // separates time and dayPeriod with U+202F, not a plain space.
    const parts = getTimeFormatter(tz).formatToParts(date);
    let timeText = '';
    let ampm = '';
    for (const part of parts) {
      if (part.type === 'hour' || part.type === 'minute' || part.type === 'literal') {
        if (part.type === 'literal' && part.value.trim() === '') continue;
        timeText += part.value;
      } else if (part.type === 'dayPeriod') {
        ampm = part.value;
      }
    }

    const targetDate = getDateFormatter(tz).format(date);
    const localDate = getDateFormatter(null).format(date);
    let dayText = 'Today';
    if (targetDate > localDate) dayText = 'Tomorrow';
    else if (targetDate < localDate) dayText = 'Yesterday';

    return { time: timeText, ampm, dayText };
  } catch (e) {
    return { time: '--:--', ampm: '', dayText: '' };
  }
};

export default function WorldClock() {
  const [time, setTime] = useState(new Date());
  const [batteryLevel, setBatteryLevel] = useState(null);

  const [myCities, setMyCities] = useState([]);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [selectedCityId, setSelectedCityId] = useState(null);

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
          setMyCities([CITY_DATABASE[0], CITY_DATABASE[1], CITY_DATABASE[2]]);
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

  // Displayed times are minute-precision, so only re-render on minute change.
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setTime(prev => prev.getMinutes() === now.getMinutes() ? prev : now);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Battery — everything guarded: the native module may be missing in builds
  // prebuilt before expo-battery was added.
  useEffect(() => {
    let sub = null;
    const initBattery = async () => {
      try {
        const level = await Battery.getBatteryLevelAsync();
        setBatteryLevel(level);
        sub = Battery.addBatteryLevelListener(({ batteryLevel }) => setBatteryLevel(batteryLevel));
      } catch (e) { }
    };
    initBattery();
    return () => { if (sub) sub.remove(); };
  }, []);

  const handleAddCity = (city) => {
    if (!myCities.find(c => c.id === city.id)) {
      setMyCities([...myCities, city]);
    }
    setSearchQuery('');
    setModalVisible(false);
  };

  const handleRemoveSelected = () => {
    if (selectedCityId && myCities.length > 1) {
      setMyCities(myCities.filter(c => c.id !== selectedCityId));
      setSelectedCityId(null);
    }
  };

  const filteredSearch = CITY_DATABASE.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View style={styles.container}>
      {/* Map Area */}
      <View style={styles.mapContainer}>
        <Image
          source={require('../assets/world-map.png')}
          style={styles.mapImage}
          resizeMode="contain"
        />

        {/* Map Dots */}
        {myCities.map((city, index) => {
          const isPrimary = index === 0;
          const isSelected = selectedCityId === city.id;
          const isHighlighted = isSelected || (isPrimary && !selectedCityId);

          return (
            <View
              key={`dot-${city.id}`}
              style={[
                styles.mapDot,
                { left: `${city.x}%`, top: `${city.y}%` },
                isHighlighted && styles.mapDotHighlighted,
              ]}
            />
          );
        })}

        {/* Battery */}
        {batteryLevel !== null && (
          <View style={styles.batteryBadge}>
            <Text style={[styles.batteryText, fonts.regular]}>{Math.round(batteryLevel * 100)}%</Text>
          </View>
        )}
      </View>

      {/* Cities List */}
      <ScrollView style={styles.listContainer}>
        {myCities.map((city, index) => {
          const { time: cTime, ampm: cAmpm, dayText: cDay } = getFormattedTimeForTz(time, city.tz);
          const isPrimary = index === 0;
          const isSelected = selectedCityId === city.id;

          if (isPrimary) {
            return (
              <MetroTouchable
                key={city.id}
                style={styles.primaryCityBlock}
                onPress={() => setSelectedCityId(isSelected ? null : city.id)}
              >
                <View style={styles.timeRow}>
                  <Text style={[styles.primaryTime, fonts.extraLight]}>{cTime}</Text>
                  <Text style={[styles.primaryAmpm, fonts.regular]}>{cAmpm}</Text>
                </View>
                <Text style={[styles.primaryCityName, fonts.regular]}>{city.name}</Text>
                <Text style={[styles.dayText, fonts.regular]}>{cDay}</Text>
              </MetroTouchable>
            );
          }

          return (
            <MetroTouchable
              key={city.id}
              style={[styles.secondaryCityBlock, isSelected && styles.selectedBlock]}
              onPress={() => setSelectedCityId(isSelected ? null : city.id)}
            >
              <View style={styles.timeRow}>
                <Text style={[styles.secondaryTime, fonts.extraLight]}>{cTime}</Text>
                <Text style={[styles.secondaryAmpm, fonts.regular]}>{cAmpm}</Text>
              </View>
              <Text style={[isSelected ? styles.secondaryCityNameSelected : styles.secondaryCityName, fonts.regular]}>{city.name}</Text>
              <Text style={[isSelected ? styles.dayTextSelected : styles.dayText, fonts.regular]}>{cDay}</Text>
            </MetroTouchable>
          );
        })}
      </ScrollView>

      {/* Bottom App Bar */}
      <View style={styles.appBar}>
        {selectedCityId && myCities[0] && selectedCityId !== myCities[0].id ? (
          <MetroTouchable style={styles.fab} onPress={handleRemoveSelected}>
            <Text style={styles.fabMinus}>-</Text>
          </MetroTouchable>
        ) : (
          <MetroTouchable style={styles.fab} onPress={() => setModalVisible(true)}>
            <Plus stroke="white" width={24} height={24} />
          </MetroTouchable>
        )}
      </View>

      {/* Add Location Modal */}
      <Modal visible={isModalVisible} animationType="slide" transparent={false} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalContainer}>
          <Text style={[styles.modalTitle, fonts.regular]}>ADD A LOCATION</Text>
          <TextInput
            style={[styles.searchInput, fonts.regular]}
            placeholder="Search..."
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
                <Text style={[styles.searchResultText, fonts.regular]}>{item.name}</Text>
              </MetroTouchable>
            )}
            style={styles.searchResultsList}
          />
          <View style={styles.appBar}>
            <MetroTouchable style={styles.fab} onPress={() => setModalVisible(false)}>
              <Text style={styles.fabClose}>X</Text>
            </MetroTouchable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black' },
  mapContainer: { height: 220, width: '100%', backgroundColor: 'black', position: 'relative', justifyContent: 'center', alignItems: 'center' },
  mapImage: { width: '100%', height: '100%', opacity: 0.6, tintColor: '#444' },

  mapDot: { position: 'absolute', width: 6, height: 6, borderRadius: 3, backgroundColor: 'white', opacity: 0.8 },
  mapDotHighlighted: { width: 8, height: 8, borderRadius: 4, backgroundColor: ACCENT, opacity: 1 },

  batteryBadge: { position: 'absolute', top: 0, right: 20, paddingHorizontal: 6, paddingVertical: 2 },
  batteryText: { color: '#555', fontSize: 12 },
  listContainer: { flex: 1 },
  timeRow: { flexDirection: 'row', alignItems: 'baseline' },
  primaryCityBlock: { paddingHorizontal: 20, paddingVertical: 5, marginBottom: 20 },
  primaryTime: { color: 'white', fontSize: 84, includeFontPadding: false },
  primaryAmpm: { color: 'white', fontSize: 24, marginLeft: 8 },
  primaryCityName: { color: ACCENT, fontSize: 18, marginTop: -5 },
  dayText: { color: '#888', fontSize: 14 },
  dayTextSelected: { color: '#ccc', fontSize: 14 },
  secondaryCityBlock: { paddingHorizontal: 20, paddingVertical: 12 },
  selectedBlock: { backgroundColor: '#004A87' },
  secondaryTime: { color: 'white', fontSize: 42, includeFontPadding: false },
  secondaryAmpm: { color: 'white', fontSize: 18, marginLeft: 6 },
  secondaryCityName: { color: '#ccc', fontSize: 16 },
  secondaryCityNameSelected: { color: 'white', fontSize: 16 },
  appBar: { height: 65, backgroundColor: 'black', flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  fab: { width: 44, height: 44, borderRadius: 22, borderWidth: 2, borderColor: 'white', justifyContent: 'center', alignItems: 'center' },
  fabMinus: { color: 'white', fontSize: 24, marginTop: -4 },
  fabClose: { color: 'white', fontSize: 14 },

  // Modal styles
  modalContainer: { flex: 1, backgroundColor: 'black', paddingTop: 40 },
  modalTitle: { color: 'white', fontSize: 16, paddingHorizontal: 20, marginBottom: 10 },
  searchInput: { backgroundColor: 'white', color: 'black', fontSize: 20, marginHorizontal: 20, padding: 10, borderRadius: 2 },
  searchResultsList: { backgroundColor: 'white', marginHorizontal: 20, marginTop: 2, flex: 1, marginBottom: 20 },
  searchResultItem: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  searchResultText: { color: 'black', fontSize: 18 },
});
