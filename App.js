import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { FavouritesProvider } from './src/context/FavouritesContext';
import { DressesProvider } from './src/context/DressesContext';
import RootNavigator from './src/navigation/RootNavigator';

export default function App() {
  return (
    <DressesProvider>
      <FavouritesProvider>
        <StatusBar style="dark" />
        <RootNavigator />
      </FavouritesProvider>
    </DressesProvider>
  );
}
