import { useState } from "react";
import { ScrollView, Text, TouchableWithoutFeedback, View } from "react-native";
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
        <View className={`flex flex-col w-full bg-[#222]`}>
            {expanded && hasOverflow && (
                <View className="w-full flex flex-col border-b border-[#333]">
                    {overflow.map((item) => (
                        <TouchableWithoutFeedback
                            key={item.text}
                            onPress={() => { setExpanded(false); item.onPress && item.onPress(); }}
                        >
                            <View className="w-full px-5 py-3">
                                <Text className="text-white text-base lowercase" style={fonts.light}>{item.text}</Text>
                            </View>
                        </TouchableWithoutFeedback>
                    ))}
                </View>
            )}
            <View className={` ${expanded ? "h-20" : "h-14"} flex flex-row w-full `}>
                <View className="w-[15%] flex"/>
                <View className="w-[70%] justify-center flex-row">
                    {options.map((option) => {
                        return (
                            <TouchableWithoutFeedback key={option.text} onPress={option.onPress}>
                                <View className="flex flex-col justify-between items-start mx-4 my-2 mb-3">
                                    <RoundedButton Icon={option.Icon} />
                                    {expanded && (<Text className="text-white text-sm" style={fonts.light}>{option.text}</Text>)}
                                </View>
                            </TouchableWithoutFeedback>
                        )
                    })}
                </View>
                <TouchableWithoutFeedback onPress={() => setExpanded(!expanded)}>
                    <View className="w-[15%] h-full items-start justify-center flex flex-row gap-1 pt-2">
                        <View className="w-1 h-1 bg-white rounded-full" />
                        <View className="w-1 h-1 bg-white rounded-full" />
                        <View className="w-1 h-1 bg-white rounded-full" />
                    </View>
                </TouchableWithoutFeedback>
            </View>
        </View>
    )
}
