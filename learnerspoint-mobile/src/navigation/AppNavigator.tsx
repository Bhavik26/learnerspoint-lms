import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StyleSheet, Text, View } from 'react-native';

import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import HomeScreen from '../screens/HomeScreen';
import CartScreen from '../screens/CartScreen';
import LiveSessionScreen from '../screens/LiveSessionScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabIcon({ char, focused }: { char: string; focused: boolean }) {
  return (
    <View style={styles.tabIconContainer}>
      <Text style={[styles.tabIconText, { color: focused ? '#3DBFF2' : '#94a3b8' }]}>
        {char}
      </Text>
    </View>
  );
}

function MainTabNavigator({ onLogoutSuccess }: { onLogoutSuccess: () => void }) {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: '#3DBFF2',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarLabelStyle: styles.tabBarLabel,
      }}
    >
      <Tab.Screen 
        name="Catalog" 
        component={HomeScreen} 
        options={{
          tabBarIcon: ({ focused }) => <TabIcon char="📚" focused={focused} />
        }}
      />
      <Tab.Screen 
        name="Cart" 
        component={CartScreen} 
        options={{
          tabBarIcon: ({ focused }) => <TabIcon char="🛒" focused={focused} />
        }}
      />
      <Tab.Screen 
        name="Live" 
        component={LiveSessionScreen} 
        options={{
          tabBarIcon: ({ focused }) => <TabIcon char="🔴" focused={focused} />
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        initialParams={{ onLogoutSuccess }}
        options={{
          tabBarIcon: ({ focused }) => <TabIcon char="👤" focused={focused} />
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator({ isLoggedIn, onLoginSuccess, onLogoutSuccess }: { 
  isLoggedIn: boolean; 
  onLoginSuccess: () => void; 
  onLogoutSuccess: () => void; 
}) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isLoggedIn ? (
        <Stack.Screen name="MainTabs">
          {() => <MainTabNavigator onLogoutSuccess={onLogoutSuccess} />}
        </Stack.Screen>
      ) : (
        <>
          <Stack.Screen 
            name="Login" 
            component={LoginScreen} 
            initialParams={{ onLoginSuccess }}
          />
          <Stack.Screen 
            name="Signup" 
            component={SignupScreen} 
          />
        </>
      )}
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#0f172a',
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    height: 64,
    paddingBottom: 8,
    paddingTop: 8,
  },
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconText: {
    fontSize: 20,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    marginTop: 2,
  },
});
