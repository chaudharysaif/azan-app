import react, { useState } from 'react';
import { Dimensions, StyleSheet, Text, View, TouchableOpacity, TextInput, Button } from 'react-native';
import BackButton from '../../components/back-button';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function Announcement() {

    const [text, setText] = useState('');
    const [description, setDescription] = useState('');

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <BackButton />

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
        backgroundColor: '#199b4d',
        width: '100%',
        minHeight: SCREEN_HEIGHT * 0.10,
        alignItems: 'center',
        padding: 10,
        flexDirection: 'row',
    },

    headerTextGroup: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },

    headerRightSpace: {
        width: 36,
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
        color: '#199b4d',
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
        color: '#199b4d',
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
        backgroundColor: '#199b4d',
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