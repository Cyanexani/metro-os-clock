import { StatusBar, View } from 'react-native';
import MetroTabs from './components/core/MetroTabs';
import WorldClock from './screens/WorldClock';
import * as Font from 'expo-font';
import { AppTitle } from './components/core/AppTitle';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AlarmMain from './screens/AlarmMain';
import TimerMain from './screens/TimerMain';
import StopwatchMain from './screens/StopwatchMain';
import TimerNew from './screens/TimerNew';
import SettingsScreen from './screens/SettingsScreen';
import { SettingsProvider } from './context/SettingsContext';
import RingtoneScreen from './screens/RingtoneScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  const [fontsLoaded] = Font.useFonts({
    'notoSansLight': require('./assets/fonts/NotoSans-Light.ttf'),
    'notoSansRegular': require('./assets/fonts/NotoSans-Regular.ttf'),
    'notoSansExtraLight': require('./assets/fonts/NotoSans-ExtraLight.ttf'),
    'openSansLight': require('./assets/fonts/OpenSans-Light.ttf'),
    'openSansRegular': require('./assets/fonts/OpenSans-Regular.ttf'),
  });

  if (!fontsLoaded) {
    // Return a loading component or null while fonts are loading
    return null;
  }

  return (
    <SettingsProvider>
    <View style={{ flex: 1, backgroundColor: 'black' }}>
      <StatusBar barStyle="light-content" backgroundColor="black" translucent={false} />
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="ClockMain" component={ClockMain} />
          <Stack.Screen name="TimerNew" component={TimerNew} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="RingtoneScreen" component={RingtoneScreen} options={{ headerShown: false }} />
          {/* Add more screens here so we can navigate to them */}
        </Stack.Navigator>
      </NavigationContainer>
    </View>
    </SettingsProvider>
  );
}

// The main landing page of clock app.
// It consists of multiple screens: AlarmMain, Timer, Stopwatch, WorldClock
// All 4 screens are treated as a single continuous screen called "ClockMain",
// They have individual Bottom Bars but a same shared App Title Bar.

// Navigation between direct children of ClockMain are done using setTabIndex of MetroTabs.
// Because, if navigation.navigate is used, only that comp will be rendered without MetroTab
// Comps that don't need MetroTab, can be navigated to using navigation.navigate. Just 
// add them to Stack.screen above.
const ClockMain = ({navigation, route}) => {
  return (
    <View style={{backgroundColor: "black", flex: 1}}>

      <MetroTabs
        rightOverlapWidth={0}
        screens={[
          { key: "0", title: "alarm", screen: <AlarmMain navigation={navigation} route={route}/> },
          { key: "1", title: "timer", screen: <TimerMain navigation={navigation} route={route}/> },
          { key: "2", title: "stopwatch", screen: <StopwatchMain navigation={navigation} route={route}/> },
          { key: "3", title: "world clock", screen: <WorldClock navigation={navigation} route={route}/> },
        ]}
      />
    </View>
  );
}
