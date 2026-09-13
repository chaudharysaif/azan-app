import React, { useState } from 'react';
import {Dimensions, Image, StyleSheet, Text, TextInput, TouchableOpacity, View} from 'react-native';
import { useNavigation } from '@react-navigation/native';

import API from '../api/endpoints';
import ErrorMessage from '../../components/error-message';
import ApiErrorAlert from '../../components/api-error-alert';

// ─── Responsive helpers ───────────────────────────────────────────────────────
const { width: SW, height: SH } = Dimensions.get('window');
const wp = (percent: number) => (SW * percent) / 100;
const hp = (percent: number) => (SH * percent) / 100;

// ─── Constants ────────────────────────────────────────────────────────────────
const GREEN = '#199b4d';
export default function MasjidLogin() {
    const navigation = useNavigation<any>();

    const [uniqueId, setUniqueId] = useState('');
    const [password, setPassword] = useState('');
    const [uniqueIdError, setUniqueIdError] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [apiError, setApiError] = useState('');
    const [showApiError, setShowApiError] = useState(false);

    const handleLogin = async () => {
        setUniqueIdError('');
        setPasswordError('');

        let hasError = false;
        if (!uniqueId.trim()) { setUniqueIdError('Unique ID is required'); hasError = true; }
        if (!password.trim()) { setPasswordError('Password is required'); hasError = true; }
        if (hasError) return;

        try {
            const response = await fetch(API.MASJID_LOGIN,
                {
                    method: 'POST',
                    headers: {
                        Accept: 'application/json',
                        'Content-Type': 'application/json',
                        'ngrok-skip-browser-warning': 'true',
                    },
                    body: JSON.stringify({ unique_id: uniqueId, password }),
                }
            );
            const data = await response.json();
            if (response.ok && data.status === 'success') {
                navigation.navigate('Dashboard', { masjidId: data.data.id });
                return;
            }
            setApiError(data.message || 'Invalid Unique ID or Password.');
            setShowApiError(true);
        } catch {
            setApiError('Something went wrong. Please check your internet connection and try again.');
            setShowApiError(true);
        }
    };

    const closeApiError = () => { setShowApiError(false); setApiError(''); };

    return (
        <View style={S.container}>

            {/* Top section */}
            <View style={S.topSection}>
                <Image
                    source={require('../../assets/images/icon.png')}
                    style={S.logo}
                    resizeMode="contain"
                />
                <Text style={S.heading}>Masjid Login</Text>
                <Text style={S.subHeading}>Login to manage your Masjid dashboard.</Text>
            </View>

            {/* Card */}
            <View style={S.card}>

                <Text style={S.label}>Unique ID</Text>
                <TextInput
                    style={[S.input, uniqueIdError ? S.inputError : null]}
                    placeholder="Enter unique ID"
                    placeholderTextColor="#999"
                    autoCapitalize="none"
                    value={uniqueId}
                    onChangeText={(text) => {
                        setUniqueId(text);
                        if (text.trim()) setUniqueIdError('');
                    }}
                />
                <ErrorMessage message={uniqueIdError} />

                <Text style={[S.label, S.passwordLabel]}>Password</Text>
                <TextInput
                    style={[S.input, passwordError ? S.inputError : null]}
                    placeholder="Enter password"
                    placeholderTextColor="#999"
                    secureTextEntry
                    value={password}
                    onChangeText={(text) => {
                        setPassword(text);
                        if (text.trim()) setPasswordError('');
                    }}
                />
                <ErrorMessage message={passwordError} />

                <TouchableOpacity style={S.loginButton} activeOpacity={0.8} onPress={handleLogin}>
                    <Text style={S.loginButtonText}>Login</Text>
                </TouchableOpacity>
            </View>

            <ApiErrorAlert visible={showApiError} message={apiError} onClose={closeApiError} />
        </View>
    );
}

const S = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F7FA', paddingHorizontal: wp(6) },

    // Top section
    topSection: { alignItems: 'center', marginTop: hp(8), marginBottom: hp(4) },
    logo: { width: wp(27), height: wp(27), marginBottom: hp(1.8) },
    heading: { fontSize: wp(7.5), fontWeight: 'bold', color: GREEN },
    subHeading: { fontSize: wp(3.8), color: '#666', textAlign: 'center', marginTop: hp(1), paddingHorizontal: wp(6) },

    // Card
    card: { backgroundColor: '#fff', borderRadius: wp(4.5), padding: wp(5.5), elevation: 5, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 3 } },

    // Labels
    label: { fontSize: wp(3.8), fontWeight: '600', color: GREEN, marginBottom: hp(1) },
    passwordLabel: { marginTop: hp(2.2) },

    // Input
    input: { height: hp(6.5), borderWidth: 1, borderColor: '#D8D8D8', borderRadius: wp(3), paddingHorizontal: wp(4), fontSize: wp(4), backgroundColor: '#FAFAFA', color: '#222' },
    inputError: { borderColor: '#D32F2F' },

    // Button
    loginButton: { marginTop: hp(3.5), backgroundColor: GREEN, height: hp(7), borderRadius: wp(3.5), justifyContent: 'center', alignItems: 'center' },
    loginButtonText: { color: '#fff', fontSize: wp(4.5), fontWeight: '700' },
});