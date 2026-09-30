import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { colors, type } from '../theme/tokens';
import HomeScreen from '../screens/HomeScreen';
import FavouritesScreen from '../screens/FavouritesScreen';
import { useFavourites } from '../context/FavouritesContext';

const Tab = createBottomTabNavigator();

// Plain-text tab icons (👗 / ♥) to avoid pulling in an icon font dependency
// for this UI pass. Swap in @expo/vector-icons later if you want real icons.
export default function MainTabs() {
  const { favourites } = useFavourites();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.emerald,
        tabBarInactiveTintColor: colors.clay,
        tabBarStyle: { borderTopColor: colors.clayLight },
        tabBarLabelStyle: { fontFamily: type.label.fontFamily, fontSize: 12 },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 18, color }}>👗</Text>,
        }}
      />
      <Tab.Screen
        name="FavouritesTab"
        component={FavouritesScreen}
        options={{
          title: favourites.length ? `Favourites (${favourites.length})` : 'Favourites',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 18, color }}>♥</Text>,
        }}
      />
    </Tab.Navigator>
  );
}
