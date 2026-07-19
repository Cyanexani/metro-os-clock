import React, { useState, useRef, useEffect } from "react";
import { StyleSheet, View, Text, ScrollView } from "react-native";
import Button from "../components/core/Button";
import { fonts } from "../styles/fonts";

// Elapsed time is anchored to wall-clock timestamps so pause/resume never
// drifts: accumulated ms plus the timestamp of the last start.
const formatElapsed = (ms) => {
  const totalCs = Math.floor(ms / 10);
  const cs = totalCs % 100;
  const totalSec = Math.floor(totalCs / 100);
  const sec = totalSec % 60;
  const totalMin = Math.floor(totalSec / 60);
  const min = totalMin % 60;
  const hrs = Math.floor(totalMin / 60);
  const pad = (n, w = 2) => String(n).padStart(w, "0");
  return {
    main: hrs > 0 ? `${pad(hrs)}:${pad(min)}:${pad(sec)}` : `${pad(min)}:${pad(sec)}`,
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
      setLaps((prev) => [{ id: prev.length + 1, total: elapsed }, ...prev]);
    } else {
      accumulatedRef.current = 0;
      setElapsed(0);
      setLaps([]);
    }
  };

  const { main, cs } = formatElapsed(elapsed);

  return (
    <View style={styles.container}>
      <View style={styles.displayContainer}>
        <View style={styles.timeRow}>
          <Text style={[styles.mainText, fonts.extraLight]}>{main}</Text>
          <Text style={[styles.csText, fonts.regular]}>.{cs}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.lapsContainer}
        contentContainerStyle={styles.lapsContent}
        bounces={false}
        overScrollMode="never"
        showsVerticalScrollIndicator={false}
      >
        {laps.map((lap, i) => {
          const prev = laps[i + 1];
          const split = prev ? lap.total - prev.total : lap.total;
          const lapFmt = formatElapsed(split);
          const totFmt = formatElapsed(lap.total);
          return (
            <View key={lap.id} style={styles.lapRow}>
              <Text style={[styles.lapIndex, fonts.regular]}>{String(lap.id).padStart(2, "0")}</Text>
              <Text style={[styles.lapSplit, fonts.light]}>{lapFmt.main}.{lapFmt.cs}</Text>
              <Text style={[styles.lapTotal, fonts.light]}>{totFmt.main}.{totFmt.cs}</Text>
            </View>
          );
        })}
      </ScrollView>

      <View style={styles.buttonContainer}>
        <Button
          text={running ? "lap" : "reset"}
          onPress={handleResetOrLap}
          disabled={!running && elapsed === 0}
          classOverride="flex-grow"
        />
        <Button
          text={running ? "stop" : "start"}
          onPress={handleStartStop}
          classOverride="flex-grow"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "black", width: "100%" },
  displayContainer: { marginTop: "30%", alignItems: "center" },
  timeRow: { flexDirection: "row", alignItems: "baseline" },
  mainText: { fontSize: 84, color: "white", includeFontPadding: false },
  csText: { fontSize: 32, color: "#888", marginLeft: 4 },
  lapsContainer: { flex: 1, marginTop: 20, marginHorizontal: 20 },
  lapsContent: { paddingBottom: 120 },
  lapRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#222" },
  lapIndex: { color: "#0078D7", fontSize: 16, width: 40 },
  lapSplit: { color: "white", fontSize: 16, flex: 1, textAlign: "center" },
  lapTotal: { color: "#888", fontSize: 16, width: 90, textAlign: "right" },
  buttonContainer: {
    position: "absolute",
    bottom: 90,
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
    paddingHorizontal: 20,
    gap: 10,
  },
});

export default StopwatchMain;
