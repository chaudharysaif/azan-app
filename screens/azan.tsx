import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { wp, hp } from '../components/responsive';
import DeviceInfo from 'react-native-device-info';
import API from './api/endpoints';
import ApiErrorAlert from '../components/api-error-alert';
import { getDeviceId } from '../components/deviceid';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Azan() {
    const navigation = useNavigation<any>();
    const [loadingUser, setLoadingUser] = useState(false);
    const [loadingMasjid, setLoadingMasjid] = useState(false);
    const [apiError, setApiError] = useState('');
    const [showApiError, setShowApiError] = useState(false);

    const handleUserPress = async () => {
        setLoadingUser(true);
        try {
            const deviceId = await getDeviceId();
            const deviceName = await DeviceInfo.getUniqueId();
            const response = await fetch(API.LOGIN, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ device_id: deviceId, device_name: deviceName }),
            });
            const data = await response.json();
            if (response.ok && data.success === true) {
                const masjidId = await AsyncStorage.getItem('selectedMasjidId');
                navigation.navigate('MainTabs', {
                    initialTab: masjidId ? 'Home' : 'Search',
                });
                return;
            }
            setApiError(data.message);
            setShowApiError(true);
        } catch {
            setApiError('Something went wrong. Please check your internet connection and try again.');
            setShowApiError(true);
        } finally {
            setLoadingUser(false);
        }
    };

    const handleMasjidPress = async () => {
        console.log('Masjid button clicked');

        setLoadingMasjid(true);

        try {
            console.log('Checking AsyncStorage...');

            const token = await AsyncStorage.getItem('token');
            const masjidId = await AsyncStorage.getItem('masjidId');

            console.log('Retrieved Token:', token);
            console.log('Retrieved Masjid ID:', masjidId);

            if (!token) {
                console.log('Token not found');
                navigation.navigate('Login');
                return;
            }

            console.log('Token found, calling profile API...');

            const response = await fetch(API.MASJID_PROFILE, {
                method: 'GET',
                headers: {
                    Accept: 'application/json',
                    Authorization: `Bearer ${token}`,
                },
            });

            console.log('API status:', response.status);

            const data = await response.json();

            console.log('Profile response:', data);

            if (response.ok && data.status === 'success') {
                navigation.navigate('Dashboard', {
                    masjidId: data.data.masjid.id,
                });
            } else {
                await AsyncStorage.removeItem('token');
                navigation.navigate('Login');
            }

        } catch (error) {
            console.log('Masjid error:', error);
            setApiError('Something went wrong. Please try again.');
            setShowApiError(true);
        } finally {
            setLoadingMasjid(false);
        }
    };

    const closeApiError = () => { setShowApiError(false); setApiError(''); };

    return (
        <View style={styles.container}>
            {/* Logo */}
            <Image source={require('../assets/images/icon.png')} style={styles.logo} resizeMode="contain" />

            <Text style={styles.title}>Azan App</Text>
            <Text style={styles.subtitle}>
                Prayer Time & Masjid Companion
            </Text>

            {/* Bottom Buttons */}
            <View style={styles.buttonContainer}>
                <TouchableOpacity activeOpacity={0.85} style={styles.button} onPress={handleUserPress} disabled={loadingUser || loadingMasjid}>
                    {loadingUser ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <Text style={styles.buttonText}>User</Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity activeOpacity={0.85} style={styles.button} onPress={handleMasjidPress} disabled={loadingUser || loadingMasjid}>
                    {loadingMasjid ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <Text style={styles.buttonText}>Masjid</Text>
                    )}
                </TouchableOpacity>
            </View>
            <ApiErrorAlert visible={showApiError} message={apiError} onClose={closeApiError} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
    },

    logo: {
        width: wp(55),
        height: wp(55),
    },

    title: {
        fontSize: wp(7.5),
        fontWeight: 'bold',
        color: '#199b4d',
    },

    subtitle: {
        fontSize: wp(3.8),
        color: '#199b4d',
        opacity: 0.9,
    },

    buttonContainer: {
        position: 'absolute',
        bottom: hp(5),
        width: wp(80),
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },

    button: {
        width: wp(38),
        backgroundColor: '#199b4d',
        paddingVertical: hp(1.8),
        borderRadius: wp(8),
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 4,
    },

    buttonText: {
        fontSize: wp(4.5),
        fontWeight: '700',
        color: '#fff',
    },
});