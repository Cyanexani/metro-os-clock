import React from "react";
import { Play } from "react-native-feather";
import { QuickMenu } from "../core/MenuBar";

const StartTimerBottomBar = ({
    navigation,
    methods
}) => {
  return (
    <QuickMenu 
      options={[
        {
          text: "start",
          onPress: methods.startTimer,
          Icon: <Play width={20} stroke={"white"} strokeWidth={3}/>
        }
      ]}
    />
  )
}

export default StartTimerBottomBar;

