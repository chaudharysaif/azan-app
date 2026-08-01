import React, { useEffect, useState, useCallback } from 'react';
import {
    StyleSheet,
    Text,
    View,
    ScrollView,
    TouchableOpacity,
    TextInput,
    ActivityIndicator,
    RefreshControl,
    Alert,
    SafeAreaView,
    StatusBar,
    Modal,
    Platform,
} from 'react-native';

const API_BASE = 'https://slogan-mud-curing.ngrok-free.dev/api';

const PRAYER_EMOJIS: Record<string, string> = {
    fajr: '🌙',
    dhuhr: '☀️',
    asr: '🌤️',
    maghrib: '🌅',
    isha: '🌙',
    jumah: '🕌',
};

const PRAYER_LABELS: Record<string, string> = {
    fajr: 'Fajr',
    dhuhr: 'Dhuhr',
    asr: 'Asr',
    maghrib: 'Maghrib',
    isha: 'Isha',
    jumah: 'Jumah',
};

interface PrayerTime {
    id: number;
    masjid_id: number;
    prayer_name: string;
    adhan_time: string;
    prayer_time: string;
    is_live: 'yes' | 'no';
    status: string;
}

interface MasjidData {
    id: number;
    name: string;
    updated_at: string;
    masjid_prayer_times: PrayerTime[];
}

// Convert "HH:mm:ss" → "HH:mm" for display/editing
function toHHMM(time: string): string {
    return time ? time.slice(0, 5) : '';
}

// Format "HH:mm" to "h:mm AM/PM"
function to12Hour(hhmm: string): string {
    if (!hhmm) return '';
    const [h, m] = hhmm.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;
    return `${hour}:${String(m).padStart(2, '0')} ${ampm}`;
}

// Format ISO updated_at to "Today 9:30 AM" or date string
function formatUpdated(isoString: string): string {
    if (!isoString) return '';
    const date = new Date(isoString);
    const now = new Date();
    const isToday =
        date.getDate() === now.getDate() &&
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear();
    const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    return isToday ? `Today ${timeStr}` : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ` ${timeStr}`;
}

// Detect current / next prayer (rough heuristic by current time)
function getCurrentPrayer(prayers: PrayerTime[]): string | null {
    const now = new Date();
    const nowMins = now.getHours() * 60 + now.getMinutes();
    let nextPrayer: string | null = null;
    let minDiff = Infinity;

    for (const p of prayers) {
        if (p.prayer_name === 'jumah') continue;
        const [h, m] = p.prayer_time.split(':').map(Number);
        const pMins = h * 60 + m;
        const diff = pMins - nowMins;
        if (diff > 0 && diff < minDiff) {
            minDiff = diff;
            nextPrayer = p.prayer_name;
        }
    }
    return nextPrayer;
}

export default function UpdateNamazTime({ route, navigation }: any) {
    const { masjidId } = route.params;

    const [masjid, setMasjid] = useState<MasjidData | null>(null);
    const [prayerTimes, setPrayerTimes] = useState<PrayerTime[]>([]);
    const [editingField, setEditingField] = useState<{ prayer: string; field: 'adhan' | 'prayer' } | null>(null);
    const [editValue, setEditValue] = useState('');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [nextPrayer, setNextPrayer] = useState<string | null>(null);

    const fetchMasjidData = useCallback(async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);

        try {
            const response = await fetch(`${API_BASE}/masjid/details/${masjidId}`, {
                headers: { 'ngrok-skip-browser-warning': 'true' },
            });
            const json = await response.json();
            if (json.status === 'success' && json.data) {
                setMasjid(json.data);
                const times: PrayerTime[] = json.data.masjid_prayer_times || [];
                setPrayerTimes(times);
                setNextPrayer(getCurrentPrayer(times));
            } else {
                Alert.alert('Error', 'Could not load masjid data.');
            }
        } catch (error) {
            Alert.alert('Network Error', 'Failed to fetch masjid data. Please try again.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [masjidId]);

    useEffect(() => {
        fetchMasjidData();
    }, [fetchMasjidData]);

    // Open the inline edit modal
    const openEdit = (prayerName: string, field: 'adhan' | 'prayer') => {
        const pt = prayerTimes.find(p => p.prayer_name === prayerName);
        if (!pt) return;
        const current = field === 'adhan' ? toHHMM(pt.adhan_time) : toHHMM(pt.prayer_time);
        setEditValue(current);
        setEditingField({ prayer: prayerName, field });
    };

    const applyEdit = () => {
        if (!editingField) return;
        // Validate HH:mm format
        const timeRegex = /^([01]?\d|2[0-3]):([0-5]\d)$/;
        if (!timeRegex.test(editValue)) {
            Alert.alert('Invalid Time', 'Please enter time in HH:MM format (e.g. 05:10, 13:30)');
            return;
        }
        setPrayerTimes(prev =>
            prev.map(pt => {
                if (pt.prayer_name !== editingField.prayer) return pt;
                return {
                    ...pt,
                    adhan_time: editingField.field === 'adhan' ? editValue + ':00' : pt.adhan_time,
                    prayer_time: editingField.field === 'prayer' ? editValue + ':00' : pt.prayer_time,
                };
            })
        );
        setEditingField(null);
        setEditValue('');
    };

    const cancelEdit = () => {
        setEditingField(null);
        setEditValue('');
    };

    const saveAllPrayerTimes = async () => {
        setSaving(true);
        try {
            const payload = {
                masjid_id: masjidId,
                prayer_times: prayerTimes.map(pt => ({
                    prayer_name: pt.prayer_name,
                    adhan_time: toHHMM(pt.adhan_time),
                    prayer_time: toHHMM(pt.prayer_time),
                    is_live: pt.is_live,
                })),
            };

            const response = await fetch(`${API_BASE}/masjid/prayer-times`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'ngrok-skip-browser-warning': 'true',
                },
                body: JSON.stringify(payload),
            });

            const json = await response.json();
            if (json.status === 'success') {
                Alert.alert('Saved', 'Prayer times updated successfully. All followers will be notified.');
                fetchMasjidData(); // refresh to get server-confirmed data
            } else {
                Alert.alert('Save Failed', json.message || 'An error occurred while saving.');
            }
        } catch (error) {
            Alert.alert('Network Error', 'Failed to save prayer times. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    // ── Loading skeleton ─────────────────────────────────────────────────
    if (loading) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <StatusBar barStyle="light-content" backgroundColor="#1B6B2F" />
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Edit Prayer Times</Text>
                </View>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#1B6B2F" />
                    <Text style={styles.loadingText}>Loading prayer times…</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor="#1B6B2F" />

            {/* ── Saving overlay ── */}
            <Modal transparent visible={saving} animationType="fade">
                <View style={styles.savingOverlay}>
                    <View style={styles.savingCard}>
                        <ActivityIndicator size="large" color="#1B6B2F" />
                        <Text style={styles.savingText}>Saving prayer times…</Text>
                        <Text style={styles.savingSubText}>Notifying all followers</Text>
                    </View>
                </View>
            </Modal>

            {/* ── Edit time modal ── */}
            <Modal transparent visible={!!editingField} animationType="slide">
                <TouchableOpacity style={styles.editOverlay} activeOpacity={1} onPress={cancelEdit}>
                    <TouchableOpacity activeOpacity={1} style={styles.editCard}>
                        <Text style={styles.editModalTitle}>
                            {editingField
                                ? `${PRAYER_LABELS[editingField.prayer]} — ${editingField.field === 'adhan' ? 'Azan Time' : 'Namaz Time'}`
                                : ''}
                        </Text>
                        <Text style={styles.editModalHint}>Enter time in 24-hour format (HH:MM)</Text>
                        <TextInput
                            style={styles.editInput}
                            value={editValue}
                            onChangeText={setEditValue}
                            placeholder="e.g. 05:10"
                            keyboardType="numbers-and-punctuation"
                            maxLength={5}
                            autoFocus
                            selectTextOnFocus
                        />
                        <View style={styles.editActions}>
                            <TouchableOpacity style={styles.cancelBtn} onPress={cancelEdit}>
                                <Text style={styles.cancelBtnText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.applyBtn} onPress={applyEdit}>
                                <Text style={styles.applyBtnText}>Apply</Text>
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>

            {/* ── Header ── */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation?.goBack?.()}>
                    <Text style={styles.backArrow}>←</Text>
                </TouchableOpacity>
                <View style={styles.headerTextGroup}>
                    <Text style={styles.headerTitle}>Edit Prayer Times</Text>
                    <Text style={styles.headerSub}>
                        {masjid?.name ? masjid.name.replace(/\b\w/g, c => c.toUpperCase()) : ''} · Changes notify all followers instantly
                    </Text>
                </View>
            </View>

            {/* ── Last updated banner ── */}
            {masjid?.updated_at && (
                <View style={styles.updatedBanner}>
                    <Text style={styles.updatedIcon}>🕐</Text>
                    <Text style={styles.updatedText}>
                        Last updated: {formatUpdated(masjid.updated_at)}
                    </Text>
                </View>
            )}

            {/* ── Prayer list ── */}
            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={() => fetchMasjidData(true)}
                        colors={['#1B6B2F']}
                        tintColor="#1B6B2F"
                        title="Pull to refresh"
                    />
                }
            >
                {prayerTimes.map(pt => {
                    const isNext = pt.prayer_name === nextPrayer;
                    return (
                        <View
                            key={pt.prayer_name}
                            style={[styles.prayerCard, isNext && styles.prayerCardNext]}
                        >
                            {/* Prayer header row */}
                            <View style={styles.prayerCardHeader}>
                                <View style={styles.prayerNameRow}>
                                    <View style={[styles.emojiBadge, isNext && styles.emojiBadgeNext]}>
                                        <Text style={styles.emojiText}>
                                            {PRAYER_EMOJIS[pt.prayer_name] || '🕌'}
                                        </Text>
                                    </View>
                                    <Text style={[styles.prayerName, isNext && styles.prayerNameNext]}>
                                        {PRAYER_LABELS[pt.prayer_name]}
                                    </Text>
                                </View>
                                {isNext && (
                                    <View style={styles.nextBadge}>
                                        <Text style={styles.nextBadgeText}>Next</Text>
                                    </View>
                                )}
                            </View>

                            {/* Time fields */}
                            <View style={styles.timeRow}>
                                <View style={styles.timeField}>
                                    <Text style={styles.timeLabel}>AZAN TIME</Text>
                                    <TouchableOpacity
                                        style={[styles.timeBox, isNext && styles.timeBoxNext]}
                                        onPress={() => openEdit(pt.prayer_name, 'adhan')}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={styles.timeValue}>
                                            {to12Hour(toHHMM(pt.adhan_time))}
                                        </Text>
                                        <Text style={styles.editIcon}>✏️</Text>
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.timeDivider} />

                                <View style={styles.timeField}>
                                    <Text style={styles.timeLabel}>NAMAZ TIME</Text>
                                    <TouchableOpacity
                                        style={[styles.timeBox, isNext && styles.timeBoxNext]}
                                        onPress={() => openEdit(pt.prayer_name, 'prayer')}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={styles.timeValue}>
                                            {to12Hour(toHHMM(pt.prayer_time))}
                                        </Text>
                                        <Text style={styles.editIcon}>✏️</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    );
                })}

                {/* Bottom spacer so last card isn't hidden behind save button */}
                <View style={{ height: 10 }} />
            </ScrollView>

            {/* ── Save button (fixed bottom) ── */}
            <View style={styles.saveWrapper}>
                <TouchableOpacity
                    style={styles.saveBtn}
                    onPress={saveAllPrayerTimes}
                    activeOpacity={0.85}
                    disabled={saving}
                >
                    <Text style={styles.saveBtnIcon}>💾</Text>
                    <Text style={styles.saveBtnText}>Save All Prayer Times</Text>
                </TouchableOpacity>
                <Text style={styles.saveNote}>All followers will be notified instantly</Text>
            </View>
        </SafeAreaView>
    );
}

const GREEN = '#1B6B2F';
const GREEN_LIGHT = '#E8F5EC';
const GREEN_BORDER = '#A8D5B5';

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F2F6F3',
    },

    // ── Header ──────────────────────────────────────────────────────────
    header: {
        backgroundColor: GREEN,
        paddingTop: Platform.OS === 'android' ? 42 : 20,
        paddingBottom: 16,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    backBtn: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: 'rgba(255,255,255,0.15)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    backArrow: {
        color: '#fff',
        fontSize: 20,
        lineHeight: 22,
    },
    headerTextGroup: {
        flex: 1,
    },
    headerTitle: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '700',
    },
    headerSub: {
        color: 'rgba(255,255,255,0.75)',
        fontSize: 12,
        marginTop: 2,
    },

    // ── Updated banner ───────────────────────────────────────────────────
    updatedBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFBEB',
        borderColor: '#F9C84E',
        borderWidth: 1,
        borderRadius: 10,
        marginHorizontal: 16,
        marginTop: 14,
        paddingHorizontal: 14,
        paddingVertical: 10,
        gap: 8,
    },
    updatedIcon: {
        fontSize: 14,
    },
    updatedText: {
        color: '#92600A',
        fontSize: 13,
        fontWeight: '500',
    },

    // ── Scroll ───────────────────────────────────────────────────────────
    scroll: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingTop: 14,
    },

    // ── Prayer card ───────────────────────────────────────────────────────
    prayerCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1.5,
        borderColor: '#E4EDE7',
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    prayerCardNext: {
        borderColor: GREEN,
        backgroundColor: GREEN_LIGHT,
    },
    prayerCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 14,
    },
    prayerNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    emojiBadge: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: '#F0F4F1',
        alignItems: 'center',
        justifyContent: 'center',
    },
    emojiBadgeNext: {
        backgroundColor: '#C8E6CF',
    },
    emojiText: {
        fontSize: 20,
    },
    prayerName: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1A2E1F',
    },
    prayerNameNext: {
        color: GREEN,
    },
    nextBadge: {
        backgroundColor: GREEN,
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 4,
    },
    nextBadgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },

    // ── Time fields ───────────────────────────────────────────────────────
    timeRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 12,
    },
    timeField: {
        flex: 1,
    },
    timeDivider: {
        width: 1,
        height: 52,
        backgroundColor: '#E4EDE7',
        alignSelf: 'flex-end',
        marginBottom: 0,
    },
    timeLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: '#7A9A82',
        letterSpacing: 0.8,
        marginBottom: 6,
    },
    timeBox: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#F2F6F3',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#D6E8DB',
        paddingHorizontal: 12,
        paddingVertical: 10,
    },
    timeBoxNext: {
        backgroundColor: '#fff',
        borderColor: GREEN_BORDER,
    },
    timeValue: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1A2E1F',
    },
    editIcon: {
        fontSize: 13,
    },

    // ── Save button ───────────────────────────────────────────────────────
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
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        shadowColor: GREEN,
        shadowOpacity: 0.35,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 5,
    },
    saveBtnIcon: {
        fontSize: 18,
    },
    saveBtnText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    saveNote: {
        textAlign: 'center',
        color: '#7A9A82',
        fontSize: 12,
        marginTop: 8,
    },

    // ── Loading ───────────────────────────────────────────────────────────
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    loadingText: {
        color: '#7A9A82',
        fontSize: 14,
    },

    // ── Saving overlay ────────────────────────────────────────────────────
    savingOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.45)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    savingCard: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 32,
        alignItems: 'center',
        gap: 12,
        width: 220,
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 20,
        elevation: 10,
    },
    savingText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1A2E1F',
    },
    savingSubText: {
        fontSize: 12,
        color: '#7A9A82',
    },

    // ── Edit modal ────────────────────────────────────────────────────────
    editOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'flex-end',
    },
    editCard: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    },
    editModalTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1A2E1F',
        marginBottom: 4,
    },
    editModalHint: {
        fontSize: 12,
        color: '#7A9A82',
        marginBottom: 16,
    },
    editInput: {
        borderWidth: 2,
        borderColor: GREEN,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 22,
        fontWeight: '700',
        color: '#1A2E1F',
        textAlign: 'center',
        letterSpacing: 2,
        marginBottom: 16,
    },
    editActions: {
        flexDirection: 'row',
        gap: 12,
    },
    cancelBtn: {
        flex: 1,
        borderWidth: 1.5,
        borderColor: '#D6E8DB',
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
    },
    cancelBtnText: {
        color: '#7A9A82',
        fontWeight: '600',
        fontSize: 15,
    },
    applyBtn: {
        flex: 1,
        backgroundColor: GREEN,
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
    },
    applyBtnText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 15,
    },
});