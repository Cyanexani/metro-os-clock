import React, { useState, useEffect, useRef } from "react";
import { StyleSheet, View, Dimensions, Text, Vibration, ScrollView } from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';
import Svg, { Circle } from 'react-native-svg';
import Button from "../components/core/Button";
import { fonts } from "../styles/fonts";
import MetroTouchable from "../components/core/MetroTouchable";
import MetroTile from "../components/core/MetroTile";
import NewTimerBottomBar from "../components/compound/NewTimerBottomBar";
import { getRingtone, DEFAULT_RINGTONE } from "../data/ringtones";
import { useSettings } from "../context/SettingsContext";

const SAVED_KEY = '@metro_saved_timers';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("screen");

function useInterval(callback, intervalDelay) {
  const savedCallback = useRef();
 
  // Remember the latest callback.
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);
 
  // Set up the interval.
  useEffect(() => {
    function tick() {
      savedCallback.current();
    }
    if (intervalDelay !== null) {
      let id = setInterval(tick, intervalDelay);
      return () => clearInterval(id);
    }
  }, [intervalDelay]);
}

const TimerMain = ({
  navigation,
  route,
  setTabIndex
}) => {  
  const { settings } = useSettings();
  
  const [selectedHour, setSelectedHour] = useState(0);
  const [selectedMinute, setSelectedMinute] = useState(0);
  const [selectedSecond, setSelectedSecond] = useState(0);
  
  const [currentSec, setCurrentSec] = useState(0);
  const [delay, setDelay] = useState(null);
  const [finished, setFinished] = useState(false);
  const [savedTimers, setSavedTimers] = useState([]);
  const [savedLoaded, setSavedLoaded] = useState(false);
  const soundRef = useRef(null);

  const stopSound = async () => {
    if (soundRef.current) {
      try { await soundRef.current.stopAsync(); } catch (e) { }
      try { await soundRef.current.unloadAsync(); } catch (e) { }
      soundRef.current = null;
    }
  };

  const playSound = async () => {
    try {
      await stopSound();
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true, shouldDuckAndroid: false }).catch(() => {});
      const { sound } = await Audio.Sound.createAsync(
        getRingtone(DEFAULT_RINGTONE).module,
        { isLooping: true, volume: 1.0, shouldPlay: true },
      );
      soundRef.current = sound;
    } catch (e) { }
  };

  // Clean up sound on unmount
  useEffect(() => () => { stopSound(); }, []);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(SAVED_KEY);
        if (raw !== null) setSavedTimers(JSON.parse(raw));
      } catch (e) { }
      setSavedLoaded(true);
    })();
  }, []);

  useEffect(() => {
    if (savedLoaded) AsyncStorage.setItem(SAVED_KEY, JSON.stringify(savedTimers)).catch(() => { });
  }, [savedTimers, savedLoaded]);

  // A newly created timer arriving from TimerNew is remembered as a preset.
  useEffect(() => {
    const t = route.params?.timer;
    if (!t) return;
    const total = t.selectedHour * 3600 + t.selectedMinute * 60 + t.selectedSecond;
    if (total <= 0) return;
    setSavedTimers((prev) => {
      if (prev.some((p) => p.total === total)) return prev;
      return [...prev, { id: `${total}`, h: t.selectedHour, m: t.selectedMinute, s: t.selectedSecond, total }];
    });
  }, [route.params?.timer]);

  const labelFor = (h, m, s) => {
    const parts = [];
    if (h) parts.push(`${h}h`);
    if (m) parts.push(`${m}m`);
    if (s) parts.push(`${s}s`);
    return parts.join(' ') || '0s';
  };

  const loadPreset = (preset) => {
    setDelay(null);
    setFinished(false);
    Vibration.cancel();
    setSelectedHour(preset.h);
    setSelectedMinute(preset.m);
    setSelectedSecond(preset.s);
    setCurrentSec(preset.total);
  };

  const removePreset = (id) => setSavedTimers((prev) => prev.filter((p) => p.id !== id));



  useEffect(() => {
    if (route.params?.timer) {
      const h = route.params?.timer.selectedHour;
      const m = route.params?.timer.selectedMinute;
      const s = route.params?.timer.selectedSecond;
      setSelectedHour(h);
      setSelectedMinute(m);
      setSelectedSecond(s);
      setDelay(1000); // Start Timer
      const msec = (h*3600) + (m*60) + s;
      setCurrentSec(msec);
    }
  }, [route.params?.timer])

  useInterval(() => {

    setCurrentSec((currentMsec) => {
      if (currentMsec > 1) {
        return (currentMsec-1);
      } else {
        setDelay(null);
        setFinished(true);
        if (settings.vibrateOnAlarm) {
          Vibration.vibrate([500, 1000, 500, 1000], true);
        }
        playSound();
        return 0;
      }

    });
  }, delay);

  const handleReset = () => {
    setDelay(null); // Stop timer
    setFinished(false);
    Vibration.cancel();
    stopSound();
    const sec = (selectedHour*3600) + (selectedMinute*60) + selectedSecond;
    setCurrentSec(sec);
    console.log("Reset!");
  }
  const handleStartStop = () => {
    setDelay(prevDelay => prevDelay ? null : 1000); // Start or stop timer
  }

  const dismissFinished = () => {
    Vibration.cancel();
    stopSound();
    setFinished(false);
    const sec = (selectedHour*3600) + (selectedMinute*60) + selectedSecond;
    setCurrentSec(sec);
  }


  const totalSec = (selectedHour*3600) + (selectedMinute*60) + selectedSecond;
  const circleRadius = 120;
  const circleCircumference = 2 * Math.PI * circleRadius;
  const progress = totalSec > 0 ? (currentSec / totalSec) : 1;
  const strokeDashoffset = circleCircumference - (progress * circleCircumference);

  return (
    <View style={styles.container}>

      <View style={styles.timerItemContainer}>
        <View style={styles.ringContainer}>
          <View style={styles.numberRow}>
            <Text style={[styles.timerText, fonts.light]}>
              {String(Math.floor((currentSec / (60*60)) % 24)).padStart(2, '0')}
            </Text>
            <Text style={[styles.timerText, fonts.light, { paddingBottom: 6 }]}>
              :
            </Text>

            <Text style={[styles.timerText, fonts.light]}>
              {String(Math.floor((currentSec / (60)) % 60)).padStart(2, '0')}
            </Text>
            <Text style={[styles.timerText, fonts.light, { paddingBottom: 6 }]}>
              :
            </Text>

            <Text style={[styles.timerText, fonts.light]}>
              {String(Math.floor(currentSec % 60)).padStart(2, '0')}
            </Text>
          </View>
        </View>
        <View style={styles.buttonContainer}>
          <Button text={"reset"} onPress={handleReset} classOverride="flex-grow" ></Button>
          <Button text={delay ? "stop" : "start"} onPress={handleStartStop} disabled={currentSec==0?true:false} classOverride="flex-grow" ></Button>
          {/* <Button text={"Stop"} ></Button> */}
        </View>

      </View>

      {/* Saved timer presets as Metro tiles */}
      {savedTimers.length > 0 && (
        <View style={styles.savedContainer}>
          <Text style={[styles.savedHeading, fonts.light]}>saved</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.savedRow}
          >
            {savedTimers.map((preset) => (
              <MetroTile
                key={preset.id}
                size="small"
                color="#0078D7"
                label={labelFor(preset.h, preset.m, preset.s)}
                onPress={() => loadPreset(preset)}
                onLongPress={() => removePreset(preset.id)}
              />
            ))}
          </ScrollView>
        </View>
      )}
      
      {/* Bottom bar */}
      <View style={styles.bottomBarContainer}>
        <NewTimerBottomBar navigation={navigation} methods={
          {
            newTimer: async () => {
              console.log("Clicked on Add New Timer");
              setDelay(null);
              navigation.navigate("TimerNew", {
                initialHour: selectedHour,
                initialMinute: selectedMinute,
                initialSecond: selectedSecond
              });
            }
          }
        }></NewTimerBottomBar>
      </View>

      {/* Time's up overlay */}
      {finished && (
        <View style={styles.finishedOverlay}>
          <Text style={[styles.finishedLabel, fonts.regular]}>TIMER</Text>
          <Text style={[styles.finishedText, fonts.extraLight]}>time's up</Text>
          <MetroTouchable style={styles.finishedButton} onPress={dismissFinished}>
            <Text style={[styles.finishedButtonText, fonts.regular]}>dismiss</Text>
          </MetroTouchable>
        </View>
      )}

    </View>
  );
};


const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: 'black',
      width: "100%",
      flexDirection: "column",
      // Centre the ring in the free area above the app bar; the bar is
      // absolutely positioned at the bottom, so reserve its height instead
      // of shoving content down with top padding.
      justifyContent: 'center',
      paddingBottom: 65,
    },
    bottomBarContainer: {
      width: "100%",
      position: 'absolute',
      bottom: 0,
      flex: 1,
    },
    timerItemContainer: {
      width: "100%",
      flexDirection: 'column',
      alignItems: 'center',
      gap: 20,
    },
    ringContainer: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    numberRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 2,
    },
    buttonContainer: {
      position: 'absolute',
      bottom: 80,
      width: "100%",
      flexDirection: 'row',
      justifyContent: 'center',
      paddingHorizontal: 20,
      gap: 10,
    },
    timerText: {
      fontSize: 64,
      color: "white",
      // fontWeight: "bold",

    },
    finishedOverlay: {
      position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: '#004A87', justifyContent: 'center', alignItems: 'center', zIndex: 100,
    },
    finishedLabel: { color: 'white', fontSize: 24, letterSpacing: 2, marginBottom: 10 },
    finishedText: { color: 'white', fontSize: 72, includeFontPadding: false, marginBottom: 50 },
    finishedButton: { borderColor: 'white', borderWidth: 2, paddingHorizontal: 30, paddingVertical: 12 },
    finishedButtonText: { color: 'white', fontSize: 18 },
    savedContainer: {
      position: 'absolute',
      bottom: 160,
      width: '100%',
      paddingLeft: 15,
    },
    savedHeading: { color: '#888', fontSize: 14, marginLeft: 5, marginBottom: 6 },
    savedRow: { paddingRight: 15 },
  });



export default TimerMain;