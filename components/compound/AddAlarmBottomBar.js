import React from "react";
import { Plus } from "react-native-feather";
import { QuickMenu } from "../core/MenuBar";

const AddAlarmBottomBar = ({
    navigation,
    methods
}) => {
  return (
    <QuickMenu
      options={[
        {
          text: "add",
          onPress: methods.addAlarm,
          Icon: <Plus width={20} stroke={"white"} strokeWidth={3}/>
        }
      ]}
      overflow={[
        { text: "delete all", onPress: methods.deleteAll },
        { text: "settings", onPress: () => navigation.navigate("Settings") },
      ]}
    />
  )
}

export default AddAlarmBottomBar;

