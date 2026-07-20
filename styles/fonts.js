import { StyleSheet } from "react-native";

// Selawik — Microsoft's open metric-compatible Segoe substitute. Use these
// families only; never fontWeight, which knocks Android back to Roboto.
export const fonts = StyleSheet.create({
    regular: {
        fontFamily: 'selawikRegular'
    },
    light: {
        fontFamily: 'selawikLight'
    },
    extraLight: {
        fontFamily: 'selawikSemiLight'
    },
    semibold: {
        fontFamily: 'selawikSemibold'
    },
    bold: {
        fontFamily: 'selawikBold'
    },
})
