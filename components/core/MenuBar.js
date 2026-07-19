import { useState } from "react";
import { Pressable, ScrollView, Text, TouchableWithoutFeedback, View } from "react-native";
import RoundedButton from "./RoundedButton";
import { fonts } from "../../styles/fonts";

const ShortMenu = ({ children, handleExpand }) => {
    return (
        <View className="bg-[#222222] h-14 w-full flex flex-row justify-between items-center">
            {children }
            <TouchableWithoutFeedback onPress={handleExpand}>
                <View className="w-[15%] h-full items-start justify-center flex flex-row gap-1 pt-2">
                    <View className="w-1 h-1 bg-white rounded-full" />
                    <View className="w-1 h-1 bg-white rounded-full" />
                    <View className="w-1 h-1 bg-white rounded-full" />
                </View>
            </TouchableWithoutFeedback>
        </View>
    )
}

export const MenuBar = ({ options, controls, height=14 }) => {
    const [expanded, setExpanded] = useState(false);
    if (!expanded) {
        return (
            <ShortMenu handleExpand={() => setExpanded(true)}>
                {controls}
            </ShortMenu>
        )
    } else {
        return ( 
            <View className={`bg-[#222222] h-2/5 w-full flex flex-col`}>
                <ShortMenu handleExpand={() => setExpanded(false)}>
                    {controls}
                </ShortMenu>
                <ScrollView className="w-full h-full">
                    <View className="flex flex-col gap-16 mx-4 w-full my-4">
                        {/* sadly there is no gap in react-native yet */}
                        {options}
                    </View>
                </ScrollView>
            </View>
        );   
    }
}


export const QuickMenu = ({
    options,
    overflow = []
}) => {
    const [expanded, setExpanded] = useState(false);
    const hasOverflow = overflow.length > 0;
    return (
        <View className="flex flex-col w-full bg-black/90">
            {expanded && hasOverflow && (
                <View className="w-full flex flex-col pb-2">
                    {overflow.map((item) => (
                        <TouchableWithoutFeedback
                            key={item.text}
                            onPress={() => { setExpanded(false); item.onPress && item.onPress(); }}
                        >
                            <View className="w-full px-6 py-3">
                                <Text className="text-white text-xl lowercase" style={fonts.light}>{item.text}</Text>
                            </View>
                        </TouchableWithoutFeedback>
                    ))}
                </View>
            )}
            <View className={`flex flex-row w-full ${expanded && hasOverflow ? 'h-[100px]' : 'h-[72px]'} items-center`}>
                <View className="flex-1 flex-row justify-center items-start pt-3">
                    {options.map((option) => (
                        <Pressable key={option.text} onPress={option.onPress} hitSlop={12}>
                            <View className="flex flex-col items-center mx-4">
                                <RoundedButton Icon={option.Icon} />
                                {expanded && hasOverflow && (
                                    <Text className="text-white text-xs mt-2 lowercase" style={fonts.light}>{option.text}</Text>
                                )}
                            </View>
                        </Pressable>
                    ))}
                </View>
                {hasOverflow && (
                    <TouchableWithoutFeedback onPress={() => setExpanded(!expanded)}>
                        <View className="absolute right-4 bottom-0 h-[72px] justify-center flex-row gap-1 items-center px-4">
                            <View className="w-1.5 h-1.5 bg-white rounded-full" />
                            <View className="w-1.5 h-1.5 bg-white rounded-full" />
                            <View className="w-1.5 h-1.5 bg-white rounded-full" />
                        </View>
                    </TouchableWithoutFeedback>
                )}
            </View>
        </View>
    )
}
