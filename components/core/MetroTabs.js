import React, { useCallback, useState } from "react";
import Animated, {
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  useAnimatedRef,
  useAnimatedScrollHandler,
} from "react-native-reanimated";
import { View, StyleSheet, Dimensions, TouchableOpacity, Text } from "react-native";
import { fonts } from "../../styles/fonts";


// `window` excludes the system bars. Using `screen` here made every page
// roughly one navigation-bar taller and let transformed content overlap the
// next screen on Android.
const { width: SCREEN_WIDTH } = Dimensions.get("window");

// slightly smaller snap to value to make the next screen peep out
// Normal value is 20. Making it 0 for testing. 
// TODO: Make the right padding a property
// const SCREEN_SNAP_INTERVAL = SCREEN_WIDTH - 0;

// let curIndex = 0;

/**
 * @param {Object} props
 * @param {Array} props.screens
 */
const MetroTabs = ({
  screens, 
  rightOverlapWidth = 20
}) => {
  const SCREEN_SNAP_INTERVAL = SCREEN_WIDTH - rightOverlapWidth;
  // console.log(screens);
  const screenCnt = screens.length;

  const animatedRef = useAnimatedRef();
  // main animated node
  // everything else is interpolated on this node
  const scrollViewX = useSharedValue(0);
  // Measured x of each pivot header within the header row.
  const headerPositions = useSharedValue(new Array(screenCnt).fill(0));
  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollViewX.value = event.contentOffset.x;
  });

  // WP Pivot: the small app title is FIXED; the header row slides so the
  // ACTIVE title lands at the left edge. A blanket parallax factor drifts
  // out of sync with the real title widths — by the last tab "world clock"
  // overshot off-screen entirely.
  const snapPoints = screens.map((_, i) => i * SCREEN_SNAP_INTERVAL);
  const animatedHeaderTransformStyle = useAnimatedStyle(() => {
    return {
      transform: [{
        translateX: interpolate(
          scrollViewX.value,
          snapPoints,
          headerPositions.value.map((x) => -x),
          'clamp'
        )
      }]
    };
  });

  // scrolls to the correct screen when one of the tabs are pressed
  const onTabPress = useCallback(async (index) => {
    animatedRef.current
      ?.scrollTo({ animatedRef: animatedRef, x: index * SCREEN_SNAP_INTERVAL, animated: true });
  }, []);

  // Record where each header actually sits so the slide can align it.
  const onHeaderLayout = useCallback((index, event) => {
    const { x } = event.nativeEvent.layout;
    const next = [...headerPositions.value];
    next[index] = x;
    headerPositions.value = next;
  }, []);

  const setTabIndex = (index) => {
    animatedRef.current
      ?.scrollTo({ animatedRef: animatedRef, x: index * SCREEN_SNAP_INTERVAL, animated: true });
  }


  return (
    <View style={styles.container}>
      <Animated.Text style={styles.appTitle}>CLOCK</Animated.Text>
      <Animated.View
        style={[
          styles.tabContainer, 
          animatedHeaderTransformStyle,
          {width: SCREEN_WIDTH*screenCnt}
        ]}
      >
        {screens.map((item, index) => (
          <HeaderItem
            key={index}
            item={item}
            index={index}
            onPress={onTabPress}
            maxLen={screens.length}
            scrollViewX={scrollViewX}
            onLayout={(event) => onHeaderLayout(index, event)}
            screenSnapInterval={SCREEN_SNAP_INTERVAL}
          />
        ))}
      </Animated.View>

      <Animated.ScrollView
        style={styles.pager}
        horizontal
        bounces={true}
        ref={animatedRef}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        pagingEnabled={true}
        snapToAlignment={'start'}
        decelerationRate={'fast'}
        // overScrollMode={"never"} to fix a stupid Android 14 bug.
        // Ref 1: https://github.com/facebook/react-native/issues/41034
        // Ref 2: https://issuetracker.google.com/issues/286422637?pli=1
        overScrollMode={"never"} 
        snapToInterval={SCREEN_SNAP_INTERVAL}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.screenList}
      >
        {/* {screens.map((item) => (
          <View 
            key={item.key} 
            style={[ styles.screenContainer, {width: SCREEN_SNAP_INTERVAL} ]}>
              {item.screen}
          </View>
        ))} */}
        
        {/* Adding setTabIndex prop to screens so children can change tabs */}
        {screens.map((item) => (
          <View 
            key={item.key} 
            style={[ styles.screenContainer, {width: SCREEN_SNAP_INTERVAL} ]}>
              {React.cloneElement(item.screen, { setTabIndex })}
          </View>
        ))}

        {/* {screens.map((item, index) => renderItem(item, index))} */}
      </Animated.ScrollView>
      
    </View>
  );
};

const activeColor = "rgba(255, 255, 255, 1)";
const inactiveColor = "rgba(255, 255, 255, 0.4)";

const HeaderItem = ({ item, index, maxLen, scrollViewX, onPress, onLayout, screenSnapInterval }) => {

  const animatedHeaderColorStyle = useAnimatedStyle(() => {
    const newColor = interpolateColor(scrollViewX.value,
      // array of snap intervals
      new Array(maxLen)
        .fill(0)
        .map((_, i) => screenSnapInterval * i),
  
      // generate a color array with active color in the index position
      new Array(maxLen)
        .fill(0)
        .map((_, i) => (i === index ? activeColor : inactiveColor)),
    );
    // const bg = index == 0 ? "blue" : index == 1 ? "green" : "magenta";
    return {
      color: newColor,
      // backgroundColor: bg,
    };
  });
  
  return (
    <TouchableOpacity onPress={() => onPress(index)} onLayout={onLayout}>
      <Animated.Text style={[
        styles.tabText,
        animatedHeaderColorStyle,
        fonts.light
      ]}>
        {item.title}
      </Animated.Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 0,
    backgroundColor: "black",
    flex: 1,
    overflow: 'hidden',
  },
  appTitle: {
    color: 'white',
    fontFamily: 'selawikLight',
    fontSize: 38,
    paddingLeft: 20,
    paddingTop: 12,
    lineHeight: 44,
    textTransform: 'lowercase',
  },
  screenContainer: {
    height: '100%',
  },
  pager: { flex: 1 },
  screenList: {
    paddingEnd: 20,
    alignItems: 'stretch',
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "transparent",
    paddingTop: 2,
    paddingBottom: 6,
  },
  tabText: {
    paddingRight: 10,
    paddingLeft: 20,
    fontSize: 48,
    lineHeight: 54,
  },
});

export default MetroTabs;
