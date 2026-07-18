import React, { useState } from "react";
import { StyleSheet, View, Text } from "react-native";

import StartTimerBottomBar from "../components/compound/StartTimerBottomBar";
import TimePicker from "../components/core/TimePicker";
import { AppTitle } from '../components/core/AppTitle';



const TimerNew = ({
  navigation,
  route
}) => {  
  
  const params = route.params || {};
  const initialH = typeof params.initialHour === 'number' ? Math.min(Math.max(0, params.initialHour), 23) : 0;
  const initialM = typeof params.initialMinute === 'number' ? Math.min(Math.max(0, params.initialMinute), 59) : 0;
  const initialS = typeof params.initialSecond === 'number' ? Math.min(Math.max(0, params.initialSecond), 59) : 0;

  const listHours = new Array(24).fill(0).map((_, i) => String(i).padStart(2, '0'));
  const listMinutes = new Array(60).fill(0).map((_, i) => String(i).padStart(2, '0'));
  const listSeconds = new Array(60).fill(0).map((_, i) => String(i).padStart(2, '0'));

  const [hour, setHour] = useState(initialH);
  const [minute, setMinute] = useState(initialM);
  const [second, setSecond] = useState(initialS);

  const handleHourChange = (index, value) => {
    if (index >= 0 && index < 24) {
      setHour(index);
    }
  }
  const handleMinuteChange = (index, value) => {
    if (index >= 0 && index < 60) {
      setMinute(index);
    }
  }
  const handleSecondChange = (index, value) => {
    if (index >= 0 && index < 60) {
      setSecond(index);
    }
  }

  return (
    <View style={styles.container}>
      <AppTitle title={"clock"}></AppTitle>
      <Text style={styles.title}>
        new timer
      </Text>
      {/* Time pickers */}
      <View style={styles.timePickerContainer}>
        <TimePicker
          values={listHours}
          unit="h"
          initialSelectedIndex={initialH}
          activeTextColor='white'
          squareCount={5}
          onValueChange={handleHourChange}
        />
        <TimePicker
          values={listMinutes}
          unit="m"
          initialSelectedIndex={initialM}
          activeTextColor='white'
          squareCount={5}
          onValueChange={handleMinuteChange}
        />
        <TimePicker
          values={listSeconds}
          unit="s"
          initialSelectedIndex={initialS}
          activeTextColor='white'
          squareCount={5}
          onValueChange={handleSecondChange}
        />
      </View>

      {/* padding */}
      {/* <View style={{height: "30%", backgroundColor: 'black'}}></View> */}
      {/* Bottom bar */}
      <View style={styles.bottomBarContainer}>
        <StartTimerBottomBar navigation={navigation} methods={
          {
            startTimer: async () => {
              // Return selected values to ClockMain, which will further pass them to TimerMain
              // Directly navigating to TimerMain will drop the MetroTab lol
              navigation.navigate({
                name: "ClockMain", 
                params: {
                  timer: {
                    selectedHour: hour,
                    selectedMinute: minute,
                    selectedSecond: second,
                    started: true,
                  },
                }, 
                // https://reactnavigation.org/docs/upgrading-from-5.x/#params-are-now-overwritten-on-navigation-instead-of-merging
                merge: true, 
              });
            }
          }
        }></StartTimerBottomBar>
      </View>  
    </View>
  );
};


const styles = StyleSheet.create({
    container: {
      flex: 1,
      flexDirection: 'column',
      backgroundColor: 'black',
      width: "100%",
      // justifyContent: 'center',
      // alignItems: 'center',
      // height: "80%", // So we can see the bottom bar (TODO: Make it responsive)
    },
    timePickerContainer: {
      // flex: 1,
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: 80,
      // gap: 20,
    },
    bottomBarContainer: {
      width: "100%",
      position: 'absolute',
      bottom: 0,
      flex: 1,
    },
    title: {
      color: 'white',
      paddingRight: 10,
      paddingLeft: 10,
      fontSize: 60
    }
  });



export default TimerNew;