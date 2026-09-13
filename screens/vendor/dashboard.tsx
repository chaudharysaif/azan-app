import { useNavigation } from "@react-navigation/native";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Animated,
    Dimensions,
    Easing,
    PermissionsAndroid,
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
import { Room, RoomEvent, createLocalAudioTrack, Track } from "livekit-client";

// ─── Responsive helper ────────────────────────────────────────────────────────
// wp(4) means "4% of the screen width" — works on every screen size automatically
const { width: SW, height: SH } = Dimensions.get('window');
const wp = (percent: number) => (SW * percent) / 100;
const hp = (percent: number) => (SH * percent) / 100;

// ─── Constants ────────────────────────────────────────────────────────────────
const API_BASE = 'https://slogan-mud-curing.ngrok-free.dev/api';
const GREEN = '#199b4d';
const GREEN_LIGHT = '#EAF4EC';

const PRAYER_EMOJIS: Record<string, string> = {
    fajr: '🌙', dhuhr: '☀️', asr: '🌤️',
    maghrib: '🌅', isha: '🌃', jumah: '🕌',
};
const PRAYER_LABELS: Record<string, string> = {
    fajr: 'Fajr', dhuhr: 'Dhuhr', asr: 'Asr',
    maghrib: 'Maghrib', isha: 'Isha', jumah: 'Jumah',
};
const PRAYER_ORDER = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha', 'jumah'];

// ─── Types ────────────────────────────────────────────────────────────────────
interface PrayerTime {
    id: number; masjid_id: number; prayer_name: string;
    adhan_time: string; prayer_time: string;
    is_live: 'yes' | 'no'; status: string;
}
interface MasjidData {
    id: number; unique_id: string; name: string;
    city: string; address_line_one: string;
    status: string; masjid_prayer_times: PrayerTime[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
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
    const nowMin = now.getHours() * 60 + now.getMinutes();
    let next: string | null = null;
    let minDiff = Infinity;
    for (const p of prayers) {
        if (p.prayer_name === 'jumah') continue;
        const [h, m] = p.prayer_time.split(':').map(Number);
        const diff = h * 60 + m - nowMin;
        if (diff > 0 && diff < minDiff) { minDiff = diff; next = p.prayer_name; }
    }
    return next;
}

// ─── Live badge ───────────────────────────────────────────────────────────────
function LiveBadge({ pulse, listenerCount }: { pulse: Animated.Value; listenerCount: number }) {
    const scaleVal = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.5] });
    return (
        <View style={S.liveBadge}>
            <Animated.View style={[S.liveDotRing, { transform: [{ scale: scaleVal }] }]} />
            <View style={S.liveDot} />
            <Text style={S.liveBadgeText}>LIVE · {listenerCount} listening</Text>
        </View>
    );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export default function Dashboard({ route }: any) {
    const navigation = useNavigation<any>();
    const { masjidId } = route.params;

    const [masjid, setMasjid] = useState<MasjidData | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [nextPrayer, setNextPrayer] = useState<string | null>(null);
    const [isLive, setIsLive] = useState(false);
    const [liveStatus, setLiveStatus] = useState<'idle' | 'connecting' | 'streaming' | 'error'>('idle');
    const [listenerCount, setListenerCount] = useState(0);

    const roomRef = useRef<Room | null>(null);
    const pulseAnim = useRef(new Animated.Value(0)).current;
    const pulseLoop = useRef<Animated.CompositeAnimation | null>(null);

    // Pulse dot while streaming
    useEffect(() => {
        if (liveStatus === 'streaming') {
            pulseLoop.current = Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, { toValue: 1, duration: 700, easing: Easing.out(Easing.ease), useNativeDriver: true }),
                    Animated.timing(pulseAnim, { toValue: 0, duration: 700, easing: Easing.in(Easing.ease), useNativeDriver: true }),
                ])
            );
            pulseLoop.current.start();
        } else {
            pulseLoop.current?.stop();
            pulseAnim.setValue(0);
        }
    }, [liveStatus]);

    // Stop stream when screen unmounts
    useEffect(() => () => { stopStreaming(); }, []);

    // Fetch masjid details
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
        } catch (e) { console.error('Fetch error:', e); }
        finally { setLoading(false); setRefreshing(false); }
    }, [masjidId]);

    useEffect(() => { fetchData(); }, [fetchData]);

    // Request mic permission (Android)
    const requestMicPermission = async (): Promise<boolean> => {
        const result = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
            {
                title: 'Microphone Permission',
                message: 'Required to broadcast the live Azan to your followers.',
                buttonPositive: 'Allow',
            }
        );
        if (result !== PermissionsAndroid.RESULTS.GRANTED) {
            Alert.alert('Permission Denied', 'Microphone access is required to broadcast.');
            return false;
        }
        return true;
    };

    // Start live broadcast
    const startStreaming = async () => {
        if (!await requestMicPermission()) { setIsLive(false); return; }
        setLiveStatus('connecting');
        try {
            const res = await fetch(`${API_BASE}/masjid/live/start`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
                body: JSON.stringify({ masjid_id: masjidId }),
            });
            const json = await res.json();
            if (json.status !== 'success') throw new Error(json.message || 'Failed to start live session');

            const { token, url } = json.data;
            const room = new Room();
            roomRef.current = room;

            room.on(RoomEvent.ParticipantConnected, () => setListenerCount(room.remoteParticipants.size));
            room.on(RoomEvent.ParticipantDisconnected, () => setListenerCount(room.remoteParticipants.size));
            room.on(RoomEvent.Disconnected, () => {
                setLiveStatus('idle'); setIsLive(false);
                setListenerCount(0); roomRef.current = null;
            });

            await room.connect(url, token);
            const audioTrack = await createLocalAudioTrack({
                echoCancellation: true, noiseSuppression: true, autoGainControl: true,
            });
            await room.localParticipant.publishTrack(audioTrack, { source: Track.Source.Microphone });
            setListenerCount(room.remoteParticipants.size);
            setLiveStatus('streaming');
        } catch (e: any) {
            Alert.alert('Connection Error', e?.message || 'Could not start broadcast. Please try again.');
            try { roomRef.current?.disconnect(); } catch (_) { }
            roomRef.current = null;
            setIsLive(false);
            setLiveStatus('error');
        }
    };

    // Stop live broadcast
    const stopStreaming = async () => {
        try {
            const pub = roomRef.current?.localParticipant.getTrackPublication(Track.Source.Microphone);
            if (pub?.track) await roomRef.current?.localParticipant.unpublishTrack(pub.track);
        } catch (_) { }
        try { roomRef.current?.disconnect(); } catch (_) { }
        roomRef.current = null;
        try {
            await fetch(`${API_BASE}/masjid/live/stop`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
                body: JSON.stringify({ masjid_id: masjidId }),
            });
        } catch (_) { }
        setLiveStatus('idle');
        setListenerCount(0);
    };

    const handleToggle = async (val: boolean) => {
        setIsLive(val);
        if (val) await startStreaming(); else await stopStreaming();
    };

    // ── Loading screen ────────────────────────────────────────────────────────
    if (loading) {
        return (
            <SafeAreaView style={S.safeArea}>
                <StatusBar barStyle="light-content" backgroundColor={GREEN} />
                <View style={S.heroSkeleton} />
                <View style={S.loadingBody}>
                    <ActivityIndicator size="large" color={GREEN} />
                    <Text style={S.loadingText}>Loading dashboard…</Text>
                </View>
            </SafeAreaView>
        );
    }

    const prayers = masjid?.masjid_prayer_times ?? [];
    const ordered = PRAYER_ORDER.map(n => prayers.find(p => p.prayer_name === n)).filter(Boolean) as PrayerTime[];
    const streaming = liveStatus === 'streaming';

    // ── Main screen ───────────────────────────────────────────────────────────
    return (
        <SafeAreaView style={S.safeArea}>
            <StatusBar barStyle="light-content" backgroundColor={GREEN} />

            <ScrollView
                style={S.scroll}
                contentContainerStyle={S.scrollContent}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={() => fetchData(true)} colors={[GREEN]} tintColor={GREEN} />
                }
                showsVerticalScrollIndicator={false}
            >
                {/* ── Hero ── */}
                <View style={S.hero}>
                    <View style={S.heroTopBar}>
                        <View style={S.statusPill}>
                            <View style={S.statusDot} />
                            <Text style={S.statusPillText}>{masjid?.status === 'active' ? 'Active' : 'Inactive'}</Text>
                        </View>
                        <Text style={S.masjidIdText}>ID: {masjid?.unique_id ?? 'N/A'}</Text>
                    </View>
                    <Text style={S.heroName} numberOfLines={2} adjustsFontSizeToFit>
                        {capitalize(masjid?.name ?? '')}
                    </Text>
                    <View style={S.heroLocationRow}>
                        <Text style={S.heroLocationIcon}>📍</Text>
                        <Text style={S.heroLocationText} numberOfLines={1}>
                            {[masjid?.address_line_one, masjid?.city].filter(Boolean).map(s => capitalize(s as string)).join(', ')}
                        </Text>
                    </View>
                </View>

                {/* ── Body ── */}
                <View style={S.body}>

                    {/* Live Azan card */}
                    <View style={[S.azanCard, streaming && S.azanCardLive]}>
                        <View style={S.azanCardTop}>
                            <View style={S.azanCardLeft}>
                                <Text style={S.azanMicEmoji}>🎙️</Text>
                                <View style={S.azanCardTextBlock}>
                                    <Text style={S.azanCardTitle}>Live Azan</Text>
                                    <Text style={S.azanCardSub} numberOfLines={1}>
                                        {streaming
                                            ? `${listenerCount} follower${listenerCount !== 1 ? 's' : ''} listening`
                                            : 'Turn on to broadcast Azan live'}
                                    </Text>
                                </View>
                            </View>
                            <View style={S.azanSwitchRow}>
                                {liveStatus === 'connecting' && (
                                    <ActivityIndicator size="small" color={GREEN} style={{ marginRight: 8 }} />
                                )}
                                <Switch
                                    trackColor={{ false: '#d3d3d3', true: '#4CAF50' }}
                                    thumbColor="#ffffff"
                                    onValueChange={handleToggle}
                                    value={isLive}
                                    disabled={liveStatus === 'connecting'}
                                />
                            </View>
                        </View>

                        {streaming && <LiveBadge pulse={pulseAnim} listenerCount={listenerCount} />}

                        <View style={[S.statusBar, streaming && S.statusBarLive]}>
                            <View style={[
                                S.statusBarDot,
                                liveStatus === 'streaming' && S.dotGreen,
                                liveStatus === 'error' && S.dotRed,
                            ]} />
                            <Text style={S.statusBarText} numberOfLines={2}>
                                {liveStatus === 'idle' && 'Microphone off — toggle to start'}
                                {liveStatus === 'connecting' && 'Connecting to server…'}
                                {liveStatus === 'streaming' && 'Streaming · All followers can hear you'}
                                {liveStatus === 'error' && 'Connection failed — please retry'}
                            </Text>
                        </View>
                    </View>

                    {/* Prayer times */}
                    <Text style={S.sectionTitle}>Prayer Times</Text>

                    <View style={S.colHeaderRow}>
                        <View style={{ flex: 1.4 }} />
                        <Text style={S.colHeader}>AZAN</Text>
                        <Text style={S.colHeader}>JAMA'AT</Text>
                    </View>

                    <View style={S.prayerList}>
                        {ordered.map((pt, i) => {
                            const isNext = pt.prayer_name === nextPrayer;
                            const isLast = i === ordered.length - 1;
                            return (
                                <View key={pt.prayer_name}>
                                    <View style={[S.prayerRow, isNext && S.prayerRowNext]}>
                                        <View style={[S.emojiBox, isNext && S.emojiBoxNext]}>
                                            <Text style={S.prayerEmoji}>{PRAYER_EMOJIS[pt.prayer_name]}</Text>
                                        </View>
                                        <View style={S.prayerNameCol}>
                                            <Text style={[S.prayerName, isNext && S.prayerNameNext]} numberOfLines={1}>
                                                {PRAYER_LABELS[pt.prayer_name]}
                                            </Text>
                                            {isNext && (
                                                <View style={S.nextBadge}>
                                                    <Text style={S.nextBadgeText}>Next</Text>
                                                </View>
                                            )}
                                            {pt.prayer_name === 'jumah' && !isNext && (
                                                <View style={S.friBadge}>
                                                    <Text style={S.friBadgeText}>Fri</Text>
                                                </View>
                                            )}
                                        </View>
                                        <Text style={[S.timeCell, isNext && S.timeCellNext]} numberOfLines={1}>
                                            {to12Hour(toHHMM(pt.adhan_time))}
                                        </Text>
                                        <Text style={[S.timeCell, isNext && S.timeCellNext]} numberOfLines={1}>
                                            {to12Hour(toHHMM(pt.prayer_time))}
                                        </Text>
                                    </View>
                                    {!isLast && <View style={S.rowDivider} />}
                                </View>
                            );
                        })}
                    </View>

                    <View style={S.sectionDivider} />

                    {/* Manage */}
                    <Text style={S.sectionTitle}>Manage</Text>
                    <View style={S.actionsRow}>
                        <TouchableOpacity
                            style={S.actionCard}
                            activeOpacity={0.82}
                            onPress={() => navigation.navigate('UpdateNamazTime', { masjidId })}
                        >
                            <Text style={S.actionEmoji}>🕐</Text>
                            <Text style={S.actionTitle}>Edit Prayer Times</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[S.actionCard, S.actionCardOutline]}
                            activeOpacity={0.82}
                            onPress={() => navigation.navigate('Announcement')}
                        >
                            <Text style={S.actionEmoji}>📢</Text>
                            <Text style={[S.actionTitle, S.actionTitleDark]}>Announcements</Text>
                        </TouchableOpacity>
                    </View>

                    <Text style={S.footerText}>Changes notify all followers instantly</Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
// wp(n) = n% of screen width  →  adapts to any device automatically
// hp(n) = n% of screen height →  used sparingly (only for hero height)
const S = StyleSheet.create({

    safeArea: { flex: 1, backgroundColor: GREEN },
    scroll: { flex: 1 },
    scrollContent: { flexGrow: 1 },

    // Loading
    heroSkeleton: { height: hp(18), backgroundColor: GREEN },
    loadingBody: { flex: 1, backgroundColor: '#fff', borderTopLeftRadius: wp(7), borderTopRightRadius: wp(7), alignItems: 'center', justifyContent: 'center', gap: 12 },
    loadingText: { color: '#7A9A82', fontSize: wp(3.5) },

    // Hero
    hero: { backgroundColor: GREEN, minHeight: hp(18), paddingTop: hp(2), paddingHorizontal: wp(5), paddingBottom: hp(5.5), justifyContent: 'flex-end' },
    heroTopBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: hp(1.5) },
    statusPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: wp(3), paddingVertical: hp(0.6), borderRadius: 20, gap: wp(1.5) },
    statusDot: { width: wp(1.8), height: wp(1.8), borderRadius: wp(1), backgroundColor: '#6EF08A' },
    statusPillText: { color: '#fff', fontSize: wp(3), fontWeight: '600' },
    masjidIdText: { color: 'rgba(255,255,255,0.55)', fontSize: wp(3), fontWeight: '500' },
    heroName: { color: '#fff', fontSize: wp(6), fontWeight: '800', marginBottom: hp(1), letterSpacing: -0.3 },
    heroLocationRow: { flexDirection: 'row', alignItems: 'center', gap: wp(1.5) },
    heroLocationIcon: { fontSize: wp(3.5) },
    heroLocationText: { color: 'rgba(255,255,255,0.72)', fontSize: wp(3.2), flex: 1 },

    // Body
    body: { flex: 1, backgroundColor: '#fff', borderTopLeftRadius: wp(7), borderTopRightRadius: wp(7), marginTop: -hp(2.5), paddingTop: hp(3), paddingHorizontal: wp(4.5), paddingBottom: hp(5), elevation: 8, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: -4 } },

    // Azan card
    azanCard: { backgroundColor: '#F8FBF8', borderRadius: wp(4.5), borderWidth: 1.5, borderColor: '#E0EDE2', padding: wp(3.5), marginBottom: hp(2.5), overflow: 'hidden' },
    azanCardLive: { backgroundColor: GREEN_LIGHT, borderColor: '#6EBF7F' },
    azanCardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    azanCardLeft: { flexDirection: 'row', alignItems: 'center', gap: wp(2.5), flex: 1, marginRight: wp(2) },
    azanCardTextBlock: { flex: 1 },
    azanMicEmoji: { fontSize: wp(6.5) },
    azanCardTitle: { fontSize: wp(3.8), fontWeight: '700', color: '#1A2E1F' },
    azanCardSub: { fontSize: wp(2.8), color: '#6A8F70', marginTop: 2 },
    azanSwitchRow: { flexDirection: 'row', alignItems: 'center', flexShrink: 0 },

    liveBadge: { flexDirection: 'row', alignItems: 'center', marginTop: hp(1.2), gap: wp(2) },
    liveDotRing: { position: 'absolute', left: 0, width: wp(3), height: wp(3), borderRadius: wp(1.5), backgroundColor: 'rgba(27,107,47,0.25)' },
    liveDot: { width: wp(2.5), height: wp(2.5), borderRadius: wp(1.25), backgroundColor: GREEN },
    liveBadgeText: { fontSize: wp(3), fontWeight: '700', color: GREEN, letterSpacing: 0.5 },

    statusBar: { flexDirection: 'row', alignItems: 'center', gap: wp(2), backgroundColor: 'rgba(0,0,0,0.04)', borderRadius: wp(2.5), paddingHorizontal: wp(3), paddingVertical: hp(1), marginTop: hp(1.2) },
    statusBarLive: { backgroundColor: 'rgba(27,107,47,0.10)' },
    statusBarDot: { width: wp(2), height: wp(2), borderRadius: wp(1), backgroundColor: '#B0C4B4', flexShrink: 0 },
    dotGreen: { backgroundColor: '#3CB96A' },
    dotRed: { backgroundColor: '#E05252' },
    statusBarText: { fontSize: wp(3), color: '#4A6E50', flex: 1 },

    // Section
    sectionTitle: { fontSize: wp(4.2), fontWeight: '700', color: '#1A2E1F', marginBottom: hp(1.2), marginTop: hp(0.5) },
    sectionDivider: { height: 1, backgroundColor: '#EEF3EF', marginVertical: hp(2.5) },

    // Prayer table
    colHeaderRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: wp(1), marginBottom: hp(0.8) },
    colHeader: { flex: 1, textAlign: 'center', fontSize: wp(2.5), fontWeight: '700', color: '#90A899', letterSpacing: 0.8 },

    prayerList: { backgroundColor: '#F8FBF8', borderRadius: wp(4), borderWidth: 1.5, borderColor: '#E6EFE8', overflow: 'hidden' },
    prayerRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: wp(3), paddingVertical: hp(1.5), gap: wp(2) },
    prayerRowNext: { backgroundColor: GREEN_LIGHT },

    emojiBox: { width: wp(8.5), height: wp(8.5), borderRadius: wp(2.5), backgroundColor: '#EDF4EE', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    emojiBoxNext: { backgroundColor: '#C5E0CA' },
    prayerEmoji: { fontSize: wp(4) },

    prayerNameCol: { flex: 1.4, flexDirection: 'row', alignItems: 'center', gap: wp(1.5) },
    prayerName: { fontSize: wp(3.5), fontWeight: '600', color: '#1A2E1F' },
    prayerNameNext: { color: GREEN },

    nextBadge: { backgroundColor: GREEN, borderRadius: 20, paddingHorizontal: wp(1.8), paddingVertical: 2 },
    nextBadgeText: { color: '#fff', fontSize: wp(2.5), fontWeight: '700' },
    friBadge: { backgroundColor: '#EDF0FF', borderRadius: 20, paddingHorizontal: wp(1.8), paddingVertical: 2 },
    friBadgeText: { color: '#5865C0', fontSize: wp(2.5), fontWeight: '700' },

    timeCell: { flex: 1, textAlign: 'center', fontSize: wp(3), fontWeight: '600', color: '#2A3E2F' },
    timeCellNext: { color: GREEN },
    rowDivider: { height: 1, backgroundColor: '#E6EFE8', marginHorizontal: wp(3) },

    // Actions
    actionsRow: { flexDirection: 'row', gap: wp(3) },
    actionCard: { flex: 1, backgroundColor: GREEN, borderRadius: wp(4), paddingVertical: hp(2.2), paddingHorizontal: wp(2), alignItems: 'center', gap: hp(1), elevation: 4, shadowColor: GREEN, shadowOpacity: 0.25, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
    actionCardOutline: { backgroundColor: '#F4F8F5', borderWidth: 1.5, borderColor: '#DCE9DE', shadowOpacity: 0, elevation: 0 },
    actionEmoji: { fontSize: wp(6) },
    actionTitle: { color: '#fff', fontSize: wp(3.2), fontWeight: '700', textAlign: 'center' },
    actionTitleDark: { color: '#1A2E1F' },

    // Footer
    footerText: { color: '#B0C4B4', fontSize: wp(3), textAlign: 'center', marginTop: hp(3.5) },
});