import React, { useState } from 'react';
import {
    Alert,
    Image,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function MasjidLogin() {
    const navigation = useNavigation<any>();

    const [uniqueId, setUniqueId] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = async () => {
        try {
            const response = await fetch('https://slogan-mud-curing.ngrok-free.dev/api/masjid/login', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    unique_id: uniqueId,
                    password,
                }),
            });
            const data = await response.json();
            console.log(data);
            if (response.ok && data.status === 'success') {
                navigation.navigate('Dashboard', {masjidId: data.data.id});
            } else {
                Alert.alert(data.message || 'Invalid Unique ID or Password.');
            }
        }
        catch (error) {
            console.error('Error during login:', error);
        }
    };


    return (
        <View style={styles.container}>
            <View style={styles.topSection}>
                <Image
                    source={require('../../assets/images/icon.png')}
                    style={styles.logo}
                    resizeMode="contain"
                />

                <Text style={styles.heading}>Masjid Login</Text>

                <Text style={styles.subHeading}>
                    Login to manage your Masjid dashboard.
                </Text>
            </View>

            <View style={styles.card}>
                <Text style={styles.label}>Unique ID</Text>

                <TextInput
                    style={styles.input}
                    placeholder="Enter unique ID"
                    placeholderTextColor="#999"
                    autoCapitalize="none"
                    value={uniqueId}
                    onChangeText={setUniqueId}
                />

                <Text style={[styles.label, { marginTop: 18 }]}>
                    Password
                </Text>

                <TextInput
                    style={styles.input}
                    placeholder="Enter password"
                    placeholderTextColor="#999"
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                />

                <TouchableOpacity
                    style={styles.loginButton}
                    activeOpacity={0.8}
                    onPress={handleLogin}
                >
                    <Text style={styles.loginButtonText}>Login</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F7FA',
        paddingHorizontal: 24,
    },

    topSection: {
        alignItems: 'center',
        marginTop: 70,
        marginBottom: 35,
    },

    logo: {
        width: 110,
        height: 110,
        marginBottom: 15,
    },

    heading: {
        fontSize: 30,
        fontWeight: 'bold',
        color: '#1C8846',
    },

    subHeading: {
        fontSize: 15,
        color: '#666',
        textAlign: 'center',
        marginTop: 8,
        paddingHorizontal: 25,
    },

    card: {
        backgroundColor: '#fff',
        borderRadius: 18,
        padding: 22,
        elevation: 5,
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 10,
        shadowOffset: {
            width: 0,
            height: 3,
        },
    },

    label: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1C8846',
        marginBottom: 8,
    },

    input: {
        height: 52,
        borderWidth: 1,
        borderColor: '#D8D8D8',
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 16,
        backgroundColor: '#FAFAFA',
        color: '#222',
    },

    loginButton: {
        marginTop: 30,
        backgroundColor: '#1C8846',
        height: 54,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },

    loginButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
    },
});