import React, { useState, useRef, useEffect } from "react";
import { StyleSheet, View, Text, ScrollView, Pressable } from "react-native";
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
    const hrs = Math.floor(totalMin / 60);
    return {
      main: `${pad(hrs)}:${pad(totalMin % 60)}:${pad(sec)}`,
      cs: pad(cs),
    };
  }
  return {
    main: `${pad(totalMin)}:${pad(sec)}`,
    cs: pad(cs),
  };
};

const StopwatchMain = () => {
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [laps, setLaps] = useState([]);

  const accumulatedRef = useRef(0);
  const startStampRef = useRef(0);
  const timerRef = useRef(null);

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

  const { main, cs } = formatElapsed(elapsed);
  
  const lapSplits = laps.map(l => l.split);
  const minSplit = laps.length >= 2 ? Math.min(...lapSplits) : -1;
  const maxSplit = laps.length >= 2 ? Math.max(...lapSplits) : -1;

  return (
    <View style={styles.container}>
      <View style={styles.displayContainer}>
        <View style={styles.timeRow}>
          <Text style={[styles.mainText, fonts.extraLight]}>{main}</Text>
          <Text style={[styles.csText, fonts.extraLight]}>.{cs}</Text>
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
                {lapFmt.main}.{lapFmt.cs}
              </Text>
            </View>
          );
        })}
      </ScrollView>

      <View style={styles.appBar}>
        <Pressable
          style={({ pressed }) => [
            styles.appBarButton,
            { opacity: (!running && elapsed === 0) ? 0.3 : (pressed ? 0.5 : 1) }
          ]}
          onPress={handleResetOrLap}
          disabled={!running && elapsed === 0}
        >
          <Text style={[styles.appBarButtonText, fonts.regular]}>
            {running ? "lap" : "reset"}
          </Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.appBarButton,
            { opacity: pressed ? 0.5 : 1 }
          ]}
          onPress={handleStartStop}
        >
          <Text style={[styles.appBarButtonText, fonts.regular]}>
            {running ? "stop" : "start"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "black", width: "100%" },
  displayContainer: { marginTop: "20%", alignItems: "center", marginBottom: 20 },
  timeRow: { flexDirection: "row", alignItems: "baseline" },
  mainText: { fontSize: 72, color: "white", includeFontPadding: false },
  csText: { fontSize: 72, color: "white", includeFontPadding: false },
  lapsContainer: { flex: 1, marginHorizontal: 24 },
  lapsContent: { paddingBottom: 80 },
  lapRow: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    paddingVertical: 12,
  },
  lapIndex: { fontSize: 14 },
  lapSplit: { fontSize: 16 },
  appBar: {
    height: 64,
    backgroundColor: "#111111",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  appBarButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    minWidth: 80,
    alignItems: "center",
  },
  appBarButtonText: {
    color: "white",
    fontSize: 14,
  },
});

export default StopwatchMain;
