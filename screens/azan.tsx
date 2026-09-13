import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { wp, hp } from '../components/responsive';
import DeviceInfo from 'react-native-device-info';
import API from './api/endpoints';
import ErrorMessage from '../components/error-message';
import ApiErrorAlert from '../components/api-error-alert';

export default function Azan() {
    const navigation = useNavigation<any>();
    const [loadingUser, setLoadingUser] = useState(false);
    const [loadingMasjid, setLoadingMasjid] = useState(false);
    const [apiError, setApiError] = useState('');
    const [showApiError, setShowApiError] = useState(false);

    const handleUserPress = async () => {
        setLoadingUser(true);
        try {
            const deviceId = await DeviceInfo.getUniqueId();
            const response = await fetch(API.LOGIN, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ device_id: deviceId }),
            });
            const data = await response.json();
            console.log('login response:', data);
            if (response && data.success === true) {
                navigation.navigate('MainTabs');
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

    const handleMasjidPress = () => {
        setLoadingMasjid(true);
        setTimeout(() => {
            setLoadingMasjid(false);
            navigation.navigate('Login');
        }, 800);
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
                <TouchableOpacity
                    activeOpacity={0.85}
                    style={styles.button}
                    onPress={handleUserPress}
                    disabled={loadingUser || loadingMasjid}
                >
                    {loadingUser ? (
                        <ActivityIndicator size="small" color="#199b4d" />
                    ) : (
                        <Text style={styles.buttonText}>User</Text>
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    activeOpacity={0.85}
                    style={styles.button}
                    onPress={handleMasjidPress}
                    disabled={loadingUser || loadingMasjid}
                >
                    {loadingMasjid ? (
                        <ActivityIndicator size="small" color="#199b4d" />
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
        backgroundColor: '#199b4d',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: wp(6),
    },

    logo: {
        width: wp(40),
        height: wp(40),
        marginBottom: hp(2.5),
    },

    title: {
        fontSize: wp(7.5),
        fontWeight: 'bold',
        color: '#fff',
        marginTop: hp(1.2),
    },

    subtitle: {
        fontSize: wp(3.8),
        color: '#fff',
        marginTop: hp(1),
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
        backgroundColor: '#ffffff',
        paddingVertical: hp(1.8),
        borderRadius: wp(8),
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 4,
    },

    buttonText: {
        fontSize: wp(4.2),
        fontWeight: '700',
        color: '#199b4d',
    },
});