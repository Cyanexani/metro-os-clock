import React, { useState, useRef, useEffect } from "react";
import { StyleSheet, View, Text, ScrollView, Pressable, AppState, Dimensions } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { fonts } from "../styles/fonts";

// Elapsed time is anchored to wall-clock timestamps so pause/resume never
// drifts: accumulated ms plus the timestamp of the last start.
const formatElapsed = (ms) => {
  const totalCs = Math.floor(ms / 10);
  const cs = totalCs % 100;
  const totalSec = Math.floor(totalCs / 100);
  const sec = totalSec % 60;
  const totalMin = Math.floor(totalSec / 60);
  const pad = (n, w = 2) => String(n).padStart(w, "0");

  if (totalMin >= 60) {
    return {
      main: `${pad(Math.floor(totalMin / 60))}:${pad(totalMin % 60)}:${pad(sec)}.${pad(cs)}`,
    };
  }
  return {
    main: `${pad(totalMin)}:${pad(sec)}:${pad(cs)}`,
  };
};

const StopwatchMain = () => {
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [laps, setLaps] = useState([]);

  const accumulatedRef = useRef(0);
  const startStampRef = useRef(0);
  const timerRef = useRef(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const loadState = async () => {
      try {
        const saved = await AsyncStorage.getItem("@metro_stopwatch");
        if (saved) {
          const parsed = JSON.parse(saved);
          accumulatedRef.current = parsed.accumulated;
          startStampRef.current = parsed.startStamp;
          setLaps(parsed.laps || []);
          setElapsed(parsed.running ? parsed.accumulated + (Date.now() - parsed.startStamp) : parsed.accumulated);
          setRunning(parsed.running);
        }
      } catch (e) {}
      setLoaded(true);
    };
    loadState();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    const saveState = async () => {
      try {
        const state = {
          accumulated: accumulatedRef.current,
          startStamp: startStampRef.current,
          running,
          laps
        };
        await AsyncStorage.setItem("@metro_stopwatch", JSON.stringify(state));
      } catch (e) {}
    };
    saveState();
  }, [running, laps, loaded]);

  useEffect(() => {
    if (running) {
      const tick = () => {
        setElapsed(accumulatedRef.current + (Date.now() - startStampRef.current));
        timerRef.current = setTimeout(tick, 30);
      };
      tick();
      return () => clearTimeout(timerRef.current);
    }
  }, [running]);

  const handleStartStop = () => {
    if (running) {
      accumulatedRef.current += Date.now() - startStampRef.current;
      setElapsed(accumulatedRef.current);
      setRunning(false);
    } else {
      startStampRef.current = Date.now();
      setRunning(true);
    }
  };

  const handleResetOrLap = () => {
    if (running) {
      setLaps((prev) => {
        const split = prev.length > 0 ? elapsed - prev[0].total : elapsed;
        return [{ id: prev.length + 1, total: elapsed, split }, ...prev];
      });
    } else {
      accumulatedRef.current = 0;
      setElapsed(0);
      setLaps([]);
    }
  };

  const { main } = formatElapsed(elapsed);
  
  const lapSplits = laps.map(l => l.split);
  const minSplit = laps.length >= 2 ? Math.min(...lapSplits) : -1;
  const maxSplit = laps.length >= 2 ? Math.max(...lapSplits) : -1;

  return (
    <View style={styles.container}>
      <View style={styles.displayContainer}>
        <View style={styles.timeRing}>
          <View style={styles.timeRow}>
            <Text style={[styles.mainText, fonts.extraLight]}>{main}</Text>
          </View>
        </View>
        <View style={styles.controlRow}>
          <Pressable
            style={({ pressed }) => [styles.controlButton, { opacity: (!running && elapsed === 0) ? 0.3 : (pressed ? 0.5 : 1) }]}
            onPress={handleResetOrLap}
            disabled={!running && elapsed === 0}
          >
            <Text style={[styles.controlText, fonts.regular]}>{running ? 'lap' : 'reset'}</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.controlButton, { opacity: pressed ? 0.5 : 1 }]}
            onPress={handleStartStop}
          >
            <Text style={[styles.controlText, fonts.regular]}>{running ? 'stop' : 'start'}</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={styles.lapsContainer}
        contentContainerStyle={styles.lapsContent}
        bounces={false}
        overScrollMode="never"
        showsVerticalScrollIndicator={false}
      >
        {laps.map((lap) => {
          const lapFmt = formatElapsed(lap.split);
          let rowColor = "white";
          let labelColor = "#888888";
          
          if (laps.length >= 2) {
            if (lap.split === minSplit) {
              rowColor = "#0078D7"; // accent color for fastest
              labelColor = "#0078D7";
            } else if (lap.split === maxSplit) {
              rowColor = "#CC4400"; // red/orange for slowest
              labelColor = "#CC4400";
            }
          }

          return (
            <View key={lap.id} style={styles.lapRow}>
              <Text style={[styles.lapIndex, fonts.regular, { color: labelColor }]}>
                lap {lap.id}
              </Text>
              <Text style={[styles.lapSplit, fonts.regular, { color: rowColor }]}>
                {lapFmt.main}
              </Text>
            </View>
          );
        })}
      </ScrollView>

    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "black", width: "100%" },
  displayContainer: { flex: 1, alignItems: "center", justifyContent: "center", marginBottom: 20 },
  timeRing: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeRow: { flexDirection: "row", alignItems: "baseline" },
  mainText: { fontSize: 64, color: "white", includeFontPadding: false, letterSpacing: -1 },
  csText: { display: 'none' },
  lapsContainer: { maxHeight: 220, marginHorizontal: 24 },
  lapsContent: { paddingBottom: 80 },
  lapRow: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    paddingVertical: 12,
  },
  lapIndex: { fontSize: 14 },
  lapSplit: { fontSize: 16 },
  controlRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginTop: 60,
  },
  controlButton: {
    borderWidth: 2,
    borderColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    minWidth: 94,
    alignItems: "center",
  },
  controlText: {
    color: "white",
    fontSize: 14,
  },
});

export default StopwatchMain;
