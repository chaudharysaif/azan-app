import { useNavigation } from '@react-navigation/native';
import react, { useState } from 'react';
import { Dimensions, StyleSheet, Text, View, TouchableOpacity, TextInput, Button } from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function Announcement() {

    const navigation = useNavigation<any>();
    const [text, setText] = useState('');
    const [description, setDescription] = useState('');

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation?.goBack?.()}>
                    <Text style={styles.backArrow}>←</Text>
                </TouchableOpacity>

                <View style={styles.headerTextGroup}>
                    <Text style={styles.headerTitle}>Announcement</Text>
                </View>
                <View style={styles.headerRightSpace} />
            </View>

            <View style={styles.announcementSection}>
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>📢 New Announcement</Text>
                    <Text style={styles.cardSubtitle}>
                        Share important updates with all followers.
                    </Text>

                    <View style={styles.fieldContainer}>
                        <Text style={styles.label}>Title</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter announcement title"
                            placeholderTextColor="#9CA3AF"
                            value={text}
                            onChangeText={setText}
                        />
                    </View>

                    <View style={styles.fieldContainer}>
                        <Text style={styles.label}>Description</Text>
                        <TextInput
                            style={styles.textArea}
                            placeholder="Write your announcement..."
                            placeholderTextColor="#9CA3AF"
                            value={description}
                            onChangeText={setDescription}
                            multiline
                            numberOfLines={5}
                            textAlignVertical="top"
                        />
                    </View>

                    <TouchableOpacity style={styles.submitButton}>
                        <Text style={styles.submitButtonText}>
                            📤 Publish Announcement
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },

    // Header
    header: {
        backgroundColor: '#1C8846',
        width: '100%',
        minHeight: SCREEN_HEIGHT * 0.10,
        alignItems: 'center',
        padding: 10,
        flexDirection: 'row',
    },
    heroText: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: 10,
    },
    backBtn: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: 'rgba(255,255,255,0.15)',
        alignItems: 'center',
        justifyContent: 'center',
    },

    headerTextGroup: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },

    headerRightSpace: {
        width: 36,
    },

    backArrow: {
        color: '#fff',
        fontSize: 28,
        lineHeight: 22,
        paddingBottom: 12
    },

    headerTitle: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '700',
        textAlign: 'center',
    },

    // Announcement Section
    announcementSection: {
        flex: 1,
        backgroundColor: '#F4F8F5',
        padding: 16,
    },

    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 18,
        padding: 20,
        borderWidth: 1,
        borderColor: '#D8E9DD',
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 10,
        shadowOffset: {
            width: 0,
            height: 4,
        },
        elevation: 4,
    },

    cardTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#1C8846',
    },

    cardSubtitle: {
        marginTop: 6,
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 24,
        lineHeight: 20,
    },

    fieldContainer: {
        marginBottom: 18,
    },

    label: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1C8846',
        marginBottom: 8,
    },

    input: {
        backgroundColor: '#F8FAF9',
        borderWidth: 1,
        borderColor: '#CFE3D5',
        borderRadius: 12,
        paddingHorizontal: 16,
        height: 52,
        fontSize: 16,
        color: '#222',
    },

    textArea: {
        backgroundColor: '#F8FAF9',
        borderWidth: 1,
        borderColor: '#CFE3D5',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingTop: 14,
        minHeight: 140,
        fontSize: 16,
        color: '#222',
        textAlignVertical: 'top',
    },

    submitButton: {
        marginTop: 10,
        backgroundColor: '#1C8846',
        height: 54,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
    },

    submitButtonText: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '700',
    },
});