import React, { useState, useEffect, useRef } from "react";
import { StyleSheet, View, Dimensions, Text, Vibration } from "react-native";
import { Audio } from 'expo-av';
import Svg, { Circle } from 'react-native-svg';
import Button from "../components/core/Button";
import { fonts } from "../styles/fonts";
import MetroTouchable from "../components/core/MetroTouchable";
import NewTimerBottomBar from "../components/compound/NewTimerBottomBar";
import { getRingtone, DEFAULT_RINGTONE } from "../data/ringtones";
import { useSettings } from "../context/SettingsContext";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const RING_SIZE = Math.min(330, SCREEN_WIDTH - 54);
const RING_RADIUS = (RING_SIZE - 12) / 2;

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
  const circleCircumference = 2 * Math.PI * RING_RADIUS;
  const progress = totalSec > 0 ? (currentSec / totalSec) : 1;
  const strokeDashoffset = circleCircumference - (progress * circleCircumference);

  return (
    <View style={styles.container}>

      <View style={styles.timerItemContainer}>
        <View style={styles.ringContainer}>
          <Svg width={RING_SIZE} height={RING_SIZE} style={styles.ringSvg}>
            <Circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RING_RADIUS}
              stroke="#143650"
              strokeWidth={6}
              fill="none"
            />
            <Circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RING_RADIUS}
              stroke="#0078D7"
              strokeWidth={6}
              fill="none"
              strokeDasharray={circleCircumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
            />
          </Svg>
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
      paddingBottom: 72,
    },
    bottomBarContainer: {
      width: "100%",
      position: 'absolute',
      bottom: 0,
      flex: 1,
    },
    timerItemContainer: {
      flex: 1,
      width: "100%",
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      paddingBottom: 120,
    },
    ringContainer: {
      justifyContent: 'center',
      alignItems: 'center',
      width: RING_SIZE,
      height: RING_SIZE,
    },
    ringSvg: { position: 'absolute' },
    numberRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 2,
    },
    buttonContainer: {
      position: 'absolute',
      bottom: 40,
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
  });



export default TimerMain;
