import { View, Text } from "react-native";

const RoundedButton = ({
    classOverrides = "",
    Icon
}) => {
    return (
        <View className={`rounded-full border-white border-2 h-12 w-12 flex items-center justify-center ${classOverrides}`}>
            {Icon}
        </View>
    )
}

export default RoundedButton; 