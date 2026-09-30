import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import InstructionsScreen from '../screens/InstructionsScreen';
import DressDetailScreen from '../screens/DressDetailScreen';
import TryOnScreen from '../screens/TryOnScreen';
import UploadDressScreen from '../screens/UploadDressScreen';
import MainTabs from './MainTabs';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  return (
    <NavigationContainer
      documentTitle={{ formatter: () => 'Vestir' }}
    >
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Signup" component={SignupScreen} />
        <Stack.Screen name="Instructions" component={InstructionsScreen} />
        <Stack.Screen name="Home" component={MainTabs} />
        <Stack.Screen
          name="DressDetail"
          component={DressDetailScreen}
          options={{ animation: 'slide_from_right' }}
        />
        <Stack.Screen
          name="TryOn"
          component={TryOnScreen}
          options={{ animation: 'slide_from_bottom', presentation: 'fullScreenModal' }}
        />
        <Stack.Screen
          name="UploadDress"
          component={UploadDressScreen}
          options={{ animation: 'slide_from_bottom', presentation: 'modal' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}