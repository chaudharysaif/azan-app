import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { MoreVertical, LogOut } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';

export default function ThreeDotMenu() {
    const [visible, setVisible] = useState(false);
    const navigation = useNavigation<any>();

    const handleLogout = async () => {
        try {
            setVisible(false);
            await AsyncStorage.removeItem('selectedMasjidId');

            navigation.getParent()?.reset({
                index: 0,
                routes: [{ name: 'Azan' }],
            });
        } catch {
            // ignore storage errors — still reset to the entry screen
        }
    };

    return (
        <>
            <TouchableOpacity style={styles.menuButton} onPress={() => setVisible(true)}>
                <MoreVertical size={25} color="#fff" />
            </TouchableOpacity>

            <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setVisible(false)}>
                <TouchableOpacity style={styles.overlay} activeOpacity={1}
                    onPress={() => setVisible(false)}
                >
                    <View style={styles.dropdown}>
                        <TouchableOpacity style={styles.logoutButton}
                            onPress={handleLogout}
                        >
                            <LogOut size={19} color="#e53935" />
                            <Text style={styles.logoutText}>Logout</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    menuButton: {
        padding: 4,
        alignItems: 'center',
        justifyContent: 'center',
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.15)',
    },
    dropdown: {
        position: 'absolute',
        top: 48,
        right: 15,
        width: 125,
        backgroundColor: '#fff',
        borderRadius: 10,
        elevation: 8,
        paddingVertical: 4,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 9,
        gap: 10,
    },
    logoutText: {
        color: '#e53935',
        fontSize: 15,
        fontWeight: '600',
    },
});