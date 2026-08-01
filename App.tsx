import React, { useEffect, useState } from 'react';
import { StatusBar, useColorScheme, Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import {
  SafeAreaProvider,
  SafeAreaView,
} from 'react-native-safe-area-context';

import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  House,
  Compass,
  Search as SearchIcon,
  CircleDot,
} from 'lucide-react-native';

import Azan from './screens/azan';
import Login from './screens/vendor/login';
import VerifyOtp from './screens/verifyotp';
import Home from './screens/home';
import Tasbeeh from './screens/tasbeeh';
import Search from './screens/search';
import Qibla from './screens/qibla';
import Details from './screens/details';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Dashboard from './screens/vendor/dashboard';
import UpdateNamazTime from './screens/vendor/updateNamazTime';
import Announcement from './screens/vendor/announcement';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs({ initialTab }: any) {
  const [showModal, setShowModal] = useState(false);
  const navigation = useNavigation<any>();

  return (
    <>
      <Tab.Navigator
        initialRouteName={initialTab}
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarActiveTintColor: '#1c8846',
          tabBarInactiveTintColor: 'gray',

          tabBarIcon: ({ color, size }) => {
            switch (route.name) {
              case 'Home':
                return <House color={color} size={size} />;

              case 'Search':
                return <SearchIcon color={color} size={size} />;

              case 'Qibla':
                return <Compass color={color} size={size} />;

              case 'Tasbeeh':
                return <CircleDot color={color} size={size} />;

              default:
                return null;
            }
          },
        })}
      >
        <Tab.Screen
          name="Home"
          component={Home}
          listeners={({ navigation }) => ({
            tabPress: async (e) => {
              e.preventDefault();
              const id = await AsyncStorage.getItem(
                'selectedMasjidId'
              );

              if (!id) {
                setShowModal(true);
                navigation.navigate("Search");
              } else {
                navigation.navigate("Home");
              }
            },
          })}
        />
        <Tab.Screen name="Search" component={Search} />
        <Tab.Screen name="Qibla" component={Qibla} />
        <Tab.Screen name="Tasbeeh" component={Tasbeeh} />
      </Tab.Navigator>

      <Modal
        transparent
        visible={showModal}
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.title}>Select Masjid First</Text>

            <Text style={styles.message}>
              Please search and select your Masjid first to access the Home page.
            </Text>

            <TouchableOpacity
              style={styles.button}
              onPress={() => setShowModal(false)}
            >
              <Text style={styles.buttonText}>OK</Text>
            </TouchableOpacity>

          </View>
        </View>
      </Modal>
    </>
  );
}

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const [loading, setLoading] = useState(true);
  const [initialTab, setInitialTab] = useState("Search");

  useEffect(() => {
    const checkMasjid = async () => {
      // await AsyncStorage.removeItem('selectedMasjidId');
      const id = await AsyncStorage.getItem('selectedMasjidId');
      console.log("Selected Masjid ID:", id);
      setInitialTab(id ? "Home" : "Search");
      setLoading(false);
    };

    checkMasjid();
  }, []);

  if (loading) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1, backgroundColor: 'transparent' }} edges={['top', 'right', 'left']}>
        <NavigationContainer>
          <StatusBar
            translucent={true}
            backgroundColor="transparent"
            barStyle={isDarkMode ? 'light-content' : 'dark-content'}
          />

          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Azan" component={Azan} />
            <Stack.Screen name="Details" component={Details} />
            <Stack.Screen name="MainTabs">
              {props => (
                <MainTabs
                  {...props}
                  initialTab={initialTab}
                />
              )}
            </Stack.Screen>
            <Stack.Screen name="Login" component={Login} />
            {/* <Stack.Screen name="Verifyotp" component={VerifyOtp} /> */}
            <Stack.Screen name="Dashboard" component={Dashboard} />
            <Stack.Screen name="UpdateNamazTime" component={UpdateNamazTime} />
            <Stack.Screen name="Announcement" component={Announcement} />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaView> 
    </SafeAreaProvider>
  );
}

export default App;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },

  modal: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
  },

  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1c8846',
    marginBottom: 12,
  },

  message: {
    fontSize: 15,
    color: '#555',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 22,
  },

  button: {
    backgroundColor: '#1c8846',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },

  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
});