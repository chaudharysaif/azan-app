import React from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function Azan() {
    const navigation = useNavigation<any>();

    const handleUserPress = () => {
        navigation.navigate('MainTabs');
    };

    const handleMasjidPress = () => {
        navigation.navigate('Dashboard', { masjidId: 3 });
    };

    return (
        <View style={styles.container}>
            {/* Logo */}
            <Image
                source={require('../assets/images/icon.png')}
                style={styles.logo}
                resizeMode="contain"
            />

            {/* Title */}
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
                >
                    <Text style={styles.buttonText}>User</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    activeOpacity={0.85}
                    style={styles.button}
                    onPress={handleMasjidPress}
                >
                    <Text style={styles.buttonText}>Masjid</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#1c8846',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 25,
    },

    logo: {
        width: 180,
        height: 180,
        marginBottom: 20,
    },

    title: {
        fontSize: 34,
        fontWeight: 'bold',
        color: '#fff',
        marginTop: 10,
    },

    subtitle: {
        fontSize: 16,
        color: '#fff',
        marginTop: 8,
        opacity: 0.9,
    },

    buttonContainer: {
        position: 'absolute',
        bottom: 40,
        width: '88%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },

    button: {
        width: '47%',
        backgroundColor: '#ffffff',
        paddingVertical: 16,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 4,
    },

    buttonText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#156b15',
    },
});