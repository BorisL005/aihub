module.exports = {
  preset: "jest-expo",
  transformIgnorePatterns: [
    // expo-router (added KAN-5) ships its standard-navigation dependency as ESM - needs
    // transforming like the rest of the Expo/RN ecosystem already allowlisted here.
    "node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|expo-router|standard-navigation|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)",
  ],
};
