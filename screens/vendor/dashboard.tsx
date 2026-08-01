import { useNavigation } from "@react-navigation/native";
import React, { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Dimensions,
    Platform,
    RefreshControl,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const API_BASE = 'https://slogan-mud-curing.ngrok-free.dev/api';
const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const GREEN = '#1B6B2F';
const GREEN_LIGHT = '#EAF4EC';
const GREEN_BORDER = '#B8DABD';

const PRAYER_EMOJIS: Record<string, string> = {
    fajr: '🌙', dhuhr: '☀️', asr: '🌤️',
    maghrib: '🌅', isha: '🌃', jumah: '🕌',
};
const PRAYER_LABELS: Record<string, string> = {
    fajr: 'Fajr', dhuhr: 'Dhuhr', asr: 'Asr',
    maghrib: 'Maghrib', isha: 'Isha', jumah: 'Jumah',
};
const PRAYER_ORDER = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha', 'jumah'];

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
    unique_id: string;
    name: string;
    city: string;
    address_line_one: string;
    status: string;
    masjid_prayer_times: PrayerTime[];
}

function toHHMM(t: string) { return t ? t.slice(0, 5) : ''; }

function to12Hour(hhmm: string) {
    if (!hhmm) return '--:--';
    const [h, m] = hhmm.split(':').map(Number);
    return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
}

function capitalize(s: string) {
    return s ? s.replace(/\b\w/g, c => c.toUpperCase()) : '';
}

function getNextPrayer(prayers: PrayerTime[]): string | null {
    const now = new Date();
    const nowMins = now.getHours() * 60 + now.getMinutes();
    let next: string | null = null;
    let minDiff = Infinity;
    for (const p of prayers) {
        if (p.prayer_name === 'jumah') continue;
        const [h, m] = p.prayer_time.split(':').map(Number);
        const diff = (h * 60 + m) - nowMins;
        if (diff > 0 && diff < minDiff) { minDiff = diff; next = p.prayer_name; }
    }
    return next;
}

export default function Dashboard({ route }: any) {
    const navigation = useNavigation<any>();
    const { masjidId } = route.params;

    const [masjid, setMasjid] = useState<MasjidData | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [nextPrayer, setNextPrayer] = useState<string | null>(null);

    const [isEnabled, setIsEnabled] = useState(false);
    const toggleSwitch = () => {
        setIsEnabled(previousState => !previousState);
    };

    const fetchData = useCallback(async (isRefresh = false) => {
        isRefresh ? setRefreshing(true) : setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/masjid/details/${masjidId}`, {
                headers: { 'ngrok-skip-browser-warning': 'true' },
            });
            const json = await res.json();
            if (json.status === 'success' && json.data) {
                setMasjid(json.data);
                setNextPrayer(getNextPrayer(json.data.masjid_prayer_times || []));
            }
        } catch (e) {
            console.error('Error fetching masjid data:', e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [masjidId]);

    useEffect(() => { fetchData(); }, [fetchData]);

    if (loading) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <StatusBar barStyle="light-content" backgroundColor={GREEN} />
                <View style={styles.heroSkeleton} />
                <View style={styles.loadingBody}>
                    <ActivityIndicator size="large" color={GREEN} />
                    <Text style={styles.loadingText}>Loading dashboard…</Text>
                </View>
            </SafeAreaView>
        );
    }

    const prayers = masjid?.masjid_prayer_times ?? [];
    const ordered = PRAYER_ORDER
        .map(n => prayers.find(p => p.prayer_name === n))
        .filter(Boolean) as PrayerTime[];

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor={GREEN} />

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing}
                        onRefresh={() => fetchData(true)}
                        colors={[GREEN]}
                        tintColor={GREEN}
                    />
                }
                showsVerticalScrollIndicator={false}
            >
                {/* ── Green hero ── */}
                <View style={styles.hero}>
                    <View style={styles.heroTopBar}>
                        <View style={styles.statusPill}>
                            <View style={styles.statusDot} />
                            <Text style={styles.statusPillText}>
                                {masjid?.status === 'active' ? 'Active' : 'Inactive'}
                            </Text>
                        </View>
                        <Text style={styles.masjidIdText}>
                            ID: {masjid?.unique_id ?? 'N/A'}
                        </Text>
                    </View>

                    <Text style={styles.heroName}>{capitalize(masjid?.name ?? '')}</Text>

                    <View style={styles.heroLocationRow}>
                        <Text style={styles.heroLocationIcon}>📍</Text>
                        <Text style={styles.heroLocationText} numberOfLines={1}>
                            {[masjid?.address_line_one, masjid?.city]
                                .filter(Boolean).map((s) => capitalize(s as string)).join(', ')}
                        </Text>
                    </View>
                </View>

                {/* ── White body ── */}
                <View style={styles.body}>
                    <View style={styles.container}>
                        <Text style={styles.text}>
                            {isEnabled ? 'ON' : 'OFF'}
                        </Text>

                        <Switch
                            trackColor={{ false: '#d3d3d3', true: '#4CAF50' }}
                            thumbColor={isEnabled ? '#ffffff' : '#ffffff'}
                            ios_backgroundColor="#d3d3d3"
                            onValueChange={toggleSwitch}
                            value={isEnabled}
                        />
                    </View>

                    {/* Prayer times section */}
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Prayer Times</Text>
                    </View>

                    {/* Column headers */}
                    <View style={styles.prayerColHeaders}>
                        <View style={{ flex: 1 }} />
                        <Text style={styles.colHeader}>AZAN</Text>
                        <Text style={styles.colHeader}>JAMA'AT</Text>
                    </View>

                    <View style={styles.prayerList}>
                        {ordered.map((pt, i) => {
                            const isNext = pt.prayer_name === nextPrayer;
                            const isLast = i === ordered.length - 1;
                            return (
                                <View key={pt.prayer_name}>
                                    <View style={[styles.prayerRow, isNext && styles.prayerRowNext]}>
                                        {/* Emoji */}
                                        <View style={[styles.prayerEmojiBg, isNext && styles.prayerEmojiBgNext]}>
                                            <Text style={styles.prayerEmoji}>
                                                {PRAYER_EMOJIS[pt.prayer_name]}
                                            </Text>
                                        </View>

                                        {/* Name + optional badge */}
                                        <View style={styles.prayerNameCol}>
                                            <Text style={[styles.prayerName, isNext && styles.prayerNameNext]}>
                                                {PRAYER_LABELS[pt.prayer_name]}
                                            </Text>
                                            {isNext && (
                                                <View style={styles.nextBadge}>
                                                    <Text style={styles.nextBadgeText}>Next</Text>
                                                </View>
                                            )}
                                            {pt.prayer_name === 'jumah' && !isNext && (
                                                <View style={styles.friBadge}>
                                                    <Text style={styles.friBadgeText}>Fri</Text>
                                                </View>
                                            )}
                                        </View>

                                        {/* Azan time */}
                                        <Text style={[styles.timeCell, isNext && styles.timeCellNext]}>
                                            {to12Hour(toHHMM(pt.adhan_time))}
                                        </Text>

                                        {/* Jama'at time */}
                                        <Text style={[styles.timeCell, isNext && styles.timeCellNext]}>
                                            {to12Hour(toHHMM(pt.prayer_time))}
                                        </Text>
                                    </View>
                                    {!isLast && <View style={styles.rowDivider} />}
                                </View>
                            );
                        })}
                    </View>

                    <View style={styles.sectionDivider} />

                    {/* Manage section */}
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Manage</Text>
                    </View>

                    <View style={styles.actionsRow}>
                        {/* Edit Prayer Times */}
                        <TouchableOpacity
                            style={styles.actionCard}
                            activeOpacity={0.82}
                            onPress={() => navigation.navigate('UpdateNamazTime', { masjidId })}
                        >
                            <Text style={styles.actionEmoji}>🕐</Text>
                            <Text style={styles.actionTitle}>Edit Prayer Times</Text>
                        </TouchableOpacity>

                        {/* Announcements */}
                        <TouchableOpacity
                            style={[styles.actionCard, styles.actionCardOutline]}
                            activeOpacity={0.82}
                            onPress={() => navigation.navigate('Announcement')}
                        >
                            <Text style={styles.actionEmoji}>📢</Text>
                            <Text style={[styles.actionTitle, styles.actionTitleDark]}>Announcements</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Changes notify all followers instantly</Text>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    text: {
        marginBottom: 10,
        fontSize: 18,
        fontWeight: '600',
    },
    safeArea: { flex: 1, backgroundColor: GREEN },
    scroll: { flex: 1 },
    scrollContent: { flexGrow: 1 },

    // Loading
    heroSkeleton: { height: SCREEN_HEIGHT * 0.20, backgroundColor: GREEN },
    loadingBody: {
        flex: 1, backgroundColor: '#fff',
        borderTopLeftRadius: 28, borderTopRightRadius: 28,
        alignItems: 'center', justifyContent: 'center', gap: 12,
    },
    loadingText: { color: '#7A9A82', fontSize: 14 },

    // Hero
    hero: {
        backgroundColor: GREEN,
        minHeight: SCREEN_HEIGHT * 0.20,
        paddingTop: Platform.OS === 'android' ? 14 : 8,
        paddingHorizontal: 22,
        paddingBottom: 45,
        justifyContent: 'flex-end',
    },
    heroTopBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    statusPill: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.15)',
        paddingHorizontal: 12, paddingVertical: 5,
        borderRadius: 20, gap: 6,
    },
    statusDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#6EF08A' },
    statusPillText: { color: '#fff', fontSize: 12, fontWeight: '600' },
    masjidIdText: { color: 'rgba(255,255,255,0.55)', fontSize: 13, fontWeight: '500' },
    heroName: {
        color: '#fff', fontSize: 28, fontWeight: '800',
        lineHeight: 34, marginBottom: 10, letterSpacing: -0.3,
    },
    heroLocationRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    heroLocationIcon: { fontSize: 13 },
    heroLocationText: {
        color: 'rgba(255,255,255,0.72)', fontSize: 13, flex: 1,
    },

    // Body
    body: {
        flex: 1, backgroundColor: '#fff',
        borderTopLeftRadius: 28, borderTopRightRadius: 28,
        marginTop: -20,
        paddingTop: 24, paddingHorizontal: 18, paddingBottom: 40,
        shadowColor: '#000', shadowOpacity: 0.06,
        shadowRadius: 12, shadowOffset: { width: 0, height: -4 },
        elevation: 8,
    },

    // Section
    sectionHeader: { marginBottom: 10, marginTop: 4 },
    sectionTitle: { fontSize: 17, fontWeight: '700', color: '#1A2E1F' },
    sectionDivider: { height: 1, backgroundColor: '#EEF3EF', marginVertical: 22 },

    // Prayer list
    prayerColHeaders: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 4,
        marginBottom: 6,
    },
    colHeader: {
        width: 76,
        textAlign: 'center',
        fontSize: 10,
        fontWeight: '700',
        color: '#90A899',
        letterSpacing: 0.8,
    },
    prayerList: {
        backgroundColor: '#F8FBF8',
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: '#E6EFE8',
        overflow: 'hidden',
    },
    prayerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 13,
        gap: 10,
    },
    prayerRowNext: {
        backgroundColor: GREEN_LIGHT,
    },
    prayerEmojiBg: {
        width: 34, height: 34, borderRadius: 10,
        backgroundColor: '#EDF4EE',
        alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
    },
    prayerEmojiBgNext: { backgroundColor: '#C5E0CA' },
    prayerEmoji: { fontSize: 17 },
    prayerNameCol: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 7,
    },
    prayerName: { fontSize: 15, fontWeight: '600', color: '#1A2E1F' },
    prayerNameNext: { color: GREEN },
    nextBadge: {
        backgroundColor: GREEN, borderRadius: 20,
        paddingHorizontal: 8, paddingVertical: 2,
    },
    nextBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
    friBadge: {
        backgroundColor: '#EDF0FF', borderRadius: 20,
        paddingHorizontal: 8, paddingVertical: 2,
    },
    friBadgeText: { color: '#5865C0', fontSize: 10, fontWeight: '700' },
    timeCell: {
        width: 76, textAlign: 'center',
        fontSize: 13, fontWeight: '600', color: '#2A3E2F',
    },
    timeCellNext: { color: GREEN },
    rowDivider: { height: 1, backgroundColor: '#E6EFE8', marginHorizontal: 14 },

    // Actions
    actionsRow: { flexDirection: 'row', gap: 12 },
    actionCard: {
        flex: 1,
        backgroundColor: GREEN,
        borderRadius: 16,
        paddingVertical: 20,
        alignItems: 'center',
        gap: 10,
        shadowColor: GREEN,
        shadowOpacity: 0.25,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 4,
    },
    actionCardOutline: {
        backgroundColor: '#F4F8F5',
        borderWidth: 1.5,
        borderColor: '#DCE9DE',
        shadowOpacity: 0,
        elevation: 0,
    },
    actionEmoji: { fontSize: 26 },
    actionTitle: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '700',
        textAlign: 'center',
    },
    actionTitleDark: { color: '#1A2E1F' },

    // Footer
    footer: { alignItems: 'center', marginTop: 28 },
    footerText: { color: '#B0C4B4', fontSize: 12 },
});