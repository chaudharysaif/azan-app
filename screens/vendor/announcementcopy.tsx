import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import {
    Dimensions, StyleSheet, Text, View,
    TouchableOpacity, TextInput, ScrollView,
    SafeAreaView, StatusBar, Platform, Alert, ActivityIndicator,
} from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const GREEN = '#1C8846';
const GREEN_LIGHT = '#E8F5EC';

export default function Announcement() {
    const navigation = useNavigation<any>();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [sending, setSending] = useState(false);

    const handleSend = async () => {
        if (!title.trim()) {
            Alert.alert('Missing title', 'Please enter a title for your announcement.');
            return;
        }
        if (!description.trim()) {
            Alert.alert('Missing description', 'Please enter a description.');
            return;
        }
        setSending(true);
        try {
            // TODO: replace with your API call
            await new Promise<void>(resolve => setTimeout(() => resolve(), 1500));
            Alert.alert('Sent!', 'Your announcement has been sent to all followers.');
            setTitle('');
            setDescription('');
        } catch {
            Alert.alert('Error', 'Failed to send announcement. Please try again.');
        } finally {
            setSending(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor={GREEN} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation?.goBack?.()}>
                    <Text style={styles.backArrow}>←</Text>
                </TouchableOpacity>
                <View style={styles.headerTextGroup} pointerEvents="none">
                    <Text style={styles.headerTitle}>Announcement</Text>
                    <Text style={styles.headerSub}>Notify all followers instantly</Text>
                </View>
            </View>

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
            >
                {/* Form card */}
                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <View style={styles.iconBadge}>
                            <Text style={styles.iconEmoji}>📢</Text>
                        </View>
                        <View>
                            <Text style={styles.cardTitle}>New announcement</Text>
                            <Text style={styles.cardSub}>Fill in the details below to broadcast</Text>
                        </View>
                    </View>

                    {/* Title field */}
                    <View style={styles.field}>
                        <Text style={styles.fieldLabel}>TITLE</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="e.g. Eid prayer schedule change"
                            placeholderTextColor="#9FB8A6"
                            value={title}
                            onChangeText={setTitle}
                            maxLength={80}
                        />
                    </View>

                    {/* Description field */}
                    <View style={styles.field}>
                        <Text style={styles.fieldLabel}>DESCRIPTION</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            placeholder="Write your announcement here…"
                            placeholderTextColor="#9FB8A6"
                            value={description}
                            onChangeText={setDescription}
                            multiline
                            maxLength={300}
                            textAlignVertical="top"
                        />
                        <Text style={styles.charCount}>{description.length} / 300</Text>
                    </View>
                </View>

                {/* Tip box */}
                <View style={styles.tipBox}>
                    <Text style={styles.tipIcon}>💡</Text>
                    <Text style={styles.tipText}>
                        Keep your title short and clear. All followers will receive a push notification with this announcement.
                    </Text>
                </View>
            </ScrollView>

            {/* Send button */}
            <View style={styles.saveWrapper}>
                <TouchableOpacity
                    style={[styles.saveBtn, sending && { opacity: 0.75 }]}
                    onPress={handleSend}
                    activeOpacity={0.85}
                    disabled={sending}
                >
                    {sending
                        ? <ActivityIndicator color="#fff" />
                        : <>
                            <Text style={styles.saveBtnIcon}>📣</Text>
                            <Text style={styles.saveBtnText}>Send announcement</Text>
                        </>
                    }
                </TouchableOpacity>
                <Text style={styles.saveNote}>All followers will be notified instantly</Text>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#F2F6F3' },

    // Header
    header: {
        backgroundColor: GREEN,
        padding: 10,
        minHeight: SCREEN_HEIGHT * 0.10,
        flexDirection: 'row',
        alignItems: 'center',
    },
    backBtn: {
        width: 36, height: 36,
        borderRadius: 10,
        backgroundColor: 'rgba(255,255,255,0.15)',
        alignItems: 'center', justifyContent: 'center',
        zIndex: 1,
    },
    backArrow: { color: '#fff', fontSize: 20, lineHeight: 22 },
    headerTextGroup: {
        position: 'absolute',
        left: 0, right: 0,
        alignItems: 'center',
        paddingHorizontal: 56,
    },
    headerTitle: { color: '#fff', fontSize: 20, fontWeight: '700' },
    headerSub: { color: 'rgba(255,255,255,0.72)', fontSize: 12, marginTop: 2 },

    // Scroll
    scroll: { flex: 1 },
    scrollContent: { padding: 16 },

    // Card
    card: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 14,
        borderWidth: 1.5,
        borderColor: '#E4EDE7',
        elevation: 2,
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
    },
    cardHeader: {
        flexDirection: 'row', alignItems: 'center',
        gap: 10, marginBottom: 20,
    },
    iconBadge: {
        width: 42, height: 42,
        borderRadius: 12,
        backgroundColor: GREEN_LIGHT,
        alignItems: 'center', justifyContent: 'center',
    },
    iconEmoji: { fontSize: 20 },
    cardTitle: { fontSize: 17, fontWeight: '700', color: '#1A2E1F' },
    cardSub: { fontSize: 12, color: '#7A9A82', marginTop: 2 },

    // Fields
    field: { marginBottom: 16 },
    fieldLabel: {
        fontSize: 10, fontWeight: '700',
        color: '#7A9A82', letterSpacing: 0.8,
        marginBottom: 6,
    },
    input: {
        borderWidth: 1.5,
        borderColor: '#D6E8DB',
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 14,
        color: '#1A2E1F',
        backgroundColor: '#F2F6F3',
    },
    textArea: { minHeight: 110, paddingTop: 12 },
    charCount: {
        textAlign: 'right', fontSize: 11,
        color: '#9FB8A6', marginTop: 4,
    },

    // Tip
    tipBox: {
        flexDirection: 'row', gap: 8,
        backgroundColor: '#FFFBEB',
        borderColor: '#F9C84E',
        borderWidth: 1,
        borderRadius: 10,
        padding: 12,
        marginBottom: 16,
    },
    tipIcon: { fontSize: 14 },
    tipText: { flex: 1, fontSize: 12, color: '#92600A', lineHeight: 18 },

    // Save
    saveWrapper: {
        paddingHorizontal: 16,
        paddingBottom: Platform.OS === 'android' ? 20 : 8,
        paddingTop: 12,
        backgroundColor: '#F2F6F3',
        borderTopWidth: 1,
        borderTopColor: '#E4EDE7',
    },
    saveBtn: {
        backgroundColor: GREEN,
        borderRadius: 14,
        paddingVertical: 16,
        flexDirection: 'row',
        alignItems: 'center', justifyContent: 'center',
        gap: 10,
        elevation: 5,
        shadowColor: GREEN,
        shadowOpacity: 0.35,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
    },
    saveBtnIcon: { fontSize: 18 },
    saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    saveNote: {
        textAlign: 'center', color: '#7A9A82',
        fontSize: 12, marginTop: 8,
    },
});