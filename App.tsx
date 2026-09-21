import React from 'react';
import { StyleSheet } from 'react-native';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';

import { store, persistor } from './src/store';
import { RootNavigator } from './src/navigation/RootNavigator';

import { View, ActivityIndicator } from 'react-native';

export default function App() {
  return (
    <GestureHandlerRootView style={styles.container}>
      <Provider store={store}>
        <PersistGate
          loading={
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }]}>
              <ActivityIndicator size="large" color="#0F766E" />
            </View>
          }
          persistor={persistor}
        >
          <SafeAreaProvider>
            <StatusBar style="dark" />
            <RootNavigator />
          </SafeAreaProvider>
        </PersistGate>
      </Provider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
