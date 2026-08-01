import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    RefreshControl,
    ActivityIndicator,
    FlatList,
    ImageBackground,
} from 'react-native';
import API from './api/endpoints';

export default function Home({ route }: any) {
    const [loading, setLoading] = useState(true);
    const routeMasjidId = route?.params?.masjidId;
    const [masjidId, setMasjidId] = useState<number | null>(null);
    const [masjid, setMasjid] = useState<MasjidDetails | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const navigation = useNavigation<any>();
    const [mutedPrayers, setMutedPrayers] = useState<number[]>([]);

    const toggleMute = (id: number) => {
        setMutedPrayers(prev =>
            prev.includes(id)
                ? prev.filter(item => item !== id)
                : [...prev, id]
        );
    };

    type PrayerTime = {
        id: number;
        prayer_name: string;
        adhan_time: string;
        prayer_time: string;
        is_live: string;
        status: string;
    };

    type MasjidDetails = {
        id: number;
        name: string;
        city: string;
        map_location: string;
        status: string;
        image: string | null;
        address_line_one: string;
        address_line_two: string;
        masjid_prayer_times: PrayerTime[];
    };

    const fetchMasjidDetails = async () => {
        if (!masjidId) return;
        try {
            const response = await fetch(
                API.GET_MASJID_DETAILS(masjidId),
            );
            const data = await response.json();
            console.log("Masjid Details:", data);
            setMasjid(data.data);
        } catch (error) {
            console.log(error);
        } finally {
            setLoading(false);
        }
    };

    const onRefresh = async () => {
        try {
            setRefreshing(true);
            await fetchMasjidDetails();
        } catch (error) {
            console.log(error);
        } finally {
            setRefreshing(false);
        }
    };

    useEffect(() => {
        const initializeMasjid = async () => {
            try {
                if (routeMasjidId) {
                    setMasjidId(routeMasjidId);
                    await AsyncStorage.setItem('selectedMasjidId', routeMasjidId.toString());
                    return;
                }
                const storedId = await AsyncStorage.getItem('selectedMasjidId');
                if (storedId) {
                    setMasjidId(Number(storedId));
                }
            } catch (error) {
                console.log(error);
            }
        };
        initializeMasjid();
    }, [routeMasjidId]);

    useEffect(() => {
        if (masjidId) {
            fetchMasjidDetails();
        }
    }, [masjidId]);

    const formatTime = (time: string) => {
        const [hours, minutes] = time.split(":");
        const date = new Date();
        date.setHours(Number(hours));
        date.setMinutes(Number(minutes));

        return date.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const getNextPrayer = () => {
        if (!masjid?.masjid_prayer_times?.length) return null;

        const currentTime = new Date().toTimeString().slice(0, 8);
        for (const prayer of masjid.masjid_prayer_times) {
            if (prayer.prayer_time > currentTime) {
                return prayer;
            }
        }
        return masjid.masjid_prayer_times[0];
    };

    const nextPrayer = getNextPrayer();
    const [timeLeft, setTimeLeft] = useState({
        hours: "00",
        minutes: "00",
        seconds: "00",
    });

    const calculateTimeLeft = () => {
        if (!nextPrayer) return;

        const now = new Date();
        const prayerDate = new Date();
        const [hours, minutes, seconds] =
            nextPrayer.prayer_time.split(":");

        prayerDate.setHours(
            Number(hours),
            Number(minutes),
            Number(seconds || 0),
            0
        );

        if (prayerDate <= now) {
            prayerDate.setDate(prayerDate.getDate() + 1);
        }

        const diff = prayerDate.getTime() - now.getTime();
        const hrs = Math.floor(diff / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((diff % (1000 * 60)) / 1000);

        setTimeLeft({
            hours: String(hrs).padStart(2, "0"),
            minutes: String(mins).padStart(2, "0"),
            seconds: String(secs).padStart(2, "0"),
        });
    };

    useEffect(() => {
        calculateTimeLeft();
        const interval = setInterval(() => {
            calculateTimeLeft();
        }, 1000);
        return () => clearInterval(interval);
    }, [nextPrayer]);

    const getCurrentPrayer = (prayers: PrayerTime[]) => {
        const current = new Date().toTimeString().slice(0, 8);
        for (const prayer of prayers) {
            if (prayer.prayer_time > current) {
                return prayer.id;
            }
        }
        return prayers[0]?.id;
    };

    if (loading) {
        return (
            <View style={styles.loader}>
                <ActivityIndicator size="large" color="#1E8E4A" />
            </View>
        )
    }

    return (
        <View style={styles.container}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={['#1E8E4A']}
                        tintColor="#1E8E4A"
                    />
                }
            >
                <ImageBackground
                    source={{
                        uri: `https://slogan-mud-curing.ngrok-free.dev/storage/${masjid?.image}`
                    }}
                    style={styles.hero}
                    imageStyle={styles.heroImage}
                />

                {/* <View style={styles.header}>
                    <Text style={styles.greeting}>Assalamu Alaikum</Text>
                    <Text style={styles.name}> {masjid?.name}</Text>
                </View> */}

                <View style={styles.bodyWrapper}>

                    <View style={styles.card}>
                        <Text style={styles.prayerTime}>
                            {/* {nextPrayer ? formatTime(nextPrayer.prayer_time) : "--"} · {masjid?.name} */}
                            {masjid?.name}
                        </Text>

                        <Text style={styles.nextPrayer}>NEXT SALAH</Text>
                        <Text style={styles.prayerName}>
                            {nextPrayer
                                ? nextPrayer.prayer_name.charAt(0).toUpperCase() +
                                nextPrayer.prayer_name.slice(1)
                                : "--"}
                        </Text>

                        <View style={styles.timerRow}>
                            <View style={styles.timerBox}>
                                <Text style={styles.timerNumber}>{timeLeft.hours}</Text>
                                <Text style={styles.timerLabel}>HRS</Text>
                            </View>

                            <View>
                                <Text style={styles.timerColon}>:</Text>
                            </View>

                            <View style={styles.timerBox}>
                                <Text style={styles.timerNumber}>{timeLeft.minutes}</Text>
                                <Text style={styles.timerLabel}>MIN</Text>
                            </View>

                            <View><Text style={styles.timerColon}>:</Text></View>

                            <View style={styles.timerBox}>
                                <Text style={styles.timerNumber}>{timeLeft.seconds}</Text>
                                <Text style={styles.timerLabel}>SEC</Text>
                            </View>
                        </View>
                    </View>

                    {/* Mosque Card */}
                    <View style={styles.mosqueCard}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.mosqueText}>🕌 {masjid?.name}</Text>
                            <Text style={styles.mosqueSubText}>📍 {masjid?.address_line_one}, {masjid?.address_line_two}</Text>
                        </View>
                        <View style={styles.distancePill}>
                            <Text style={styles.distance}>3.0 km</Text>
                        </View>
                    </View>

                    {/* Today's Prayers */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Salah Time</Text>

                            {/* <TouchableOpacity onPress={() => navigation.navigate("Details", { masjidId })}>
                                <Text style={styles.seeAll}>See All</Text>
                            </TouchableOpacity> */}
                        </View>

                        {/* <View style={styles.prayerGrid}>
                            {masjid?.masjid_prayer_times.map((item, index) => (
                                <View
                                    key={item.id}
                                    style={[
                                        styles.prayerBox,
                                        item.id === nextPrayer?.id && styles.activePrayer
                                    ]}
                                >
                                    <Text
                                        style={[
                                            styles.prayerText,
                                            item.id === nextPrayer?.id && { color: "#fff" },
                                        ]}
                                    >
                                        {item.prayer_name.charAt(0).toUpperCase() +
                                            item.prayer_name.slice(1)}
                                    </Text>

                                    <Text
                                        style={[
                                            styles.prayerTimeText,
                                            item.id === nextPrayer?.id && { color: "#fff" },
                                        ]}
                                    >
                                        {formatTime(item.prayer_time)}
                                    </Text>
                                </View>
                            ))}
                        </View> */}

                        <FlatList
                            data={masjid?.masjid_prayer_times || []}
                            keyExtractor={item => item.id.toString()}
                            showsVerticalScrollIndicator={false}
                            scrollEnabled={false}
                            renderItem={({ item }) => {
                                const activePrayer = item.id === getCurrentPrayer(masjid?.masjid_prayer_times || []);
                                return (
                                    <View
                                        style={[
                                            styles.prayerCard,
                                            activePrayer && styles.activePrayerCard,
                                        ]}
                                    >
                                        <View style={styles.leftSection}>
                                            <View
                                                style={[
                                                    styles.dot, activePrayer && { backgroundColor: '#fff' },
                                                ]}
                                            />

                                            <Text
                                                style={[
                                                    styles.allPrayerName, activePrayer && { color: '#fff' },
                                                ]}
                                            >
                                                {item.prayer_name.charAt(0).toUpperCase() + item.prayer_name.slice(1)}
                                            </Text>
                                        </View>

                                        <View style={styles.timeSection}>
                                            <Text
                                                style={[
                                                    styles.azanText, activePrayer && { color: '#eafff0' },
                                                ]}
                                            >
                                                Azan — {formatTime(item.adhan_time)}
                                            </Text>

                                            <Text
                                                style={[
                                                    styles.allPrayerTime, activePrayer && { color: '#fff' },
                                                ]}
                                            >
                                                {formatTime(item.prayer_time)}
                                            </Text>
                                        </View>

                                        <TouchableOpacity
                                            onPress={() =>
                                                toggleMute(item.id)
                                            }
                                            style={styles.muteButton}
                                        >
                                            <Text style={{ fontSize: 20 }}>
                                                {mutedPrayers.includes(item.id) ? '🔇' : '🔊'}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                );
                            }}
                        />
                    </View>


                    {/* Live Azan Card */}
                    {/* <View style={styles.liveCard}>
                        <Text style={styles.liveTitle}>🔊 Live Azan Streaming</Text>
                        <Text style={styles.liveSub}>
                            {masjid?.name} · Now broadcasting
                        </Text>
                    </View> */}

                    {/* Quick Access */}
                    {/* <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Quick Access</Text>

                        <View style={styles.quickRow}>
                            <View style={styles.quickItem}>
                                <Text style={styles.quickIcon}>🧭</Text>
                                <Text>Qibla</Text>
                            </View>
                            <View style={styles.quickItem}>
                                <Text style={styles.quickIcon}>📿</Text>
                                <Text>Tasbeeh</Text>
                            </View>
                            <View style={styles.quickItem}>
                                <Text style={styles.quickIcon}>🤲</Text>
                                <Text>Dua</Text>
                            </View>
                            <View style={styles.quickItem}>
                                <Text style={styles.quickIcon}>🌙</Text>
                                <Text>Ramzan</Text>
                            </View>
                        </View>
                    </View> */}

                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
    },

    header: {
        padding: 20,
        paddingTop: 50,
    },

    hero: {
        height: 280,
        justifyContent: 'flex-end',
        backgroundColor: '#e8e8e8',
    },

    heroImage: {
        resizeMode: 'cover',
    },

    greeting: {
        color: '#fff',
        fontSize: 16,
    },

    loader: {
        flex: 1,
        justifyContent: 'center',
        backgroundColor: '#ffffff',
    },

    bodyWrapper: {
        backgroundColor: '#ffffff',
        marginTop: -16,
        borderTopLeftRadius: 22,
        borderTopRightRadius: 22,
        paddingTop: 4,
    },

    timerColon: {
        color: '#1E8E4A',
        fontSize: 25,
        fontWeight: 'bold',
        marginHorizontal: 5,
        marginTop: 10,
    },

    name: {
        color: '#fff',
        fontSize: 22,
        fontWeight: 'bold',
    },

    card: {
        backgroundColor: '#ffffff',
        marginHorizontal: 20,
        marginTop: 24,
        borderRadius: 22,
        padding: 22,
        borderWidth: 1,
        borderColor: '#eef1ee',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 3,
    },

    nextPrayer: {
        color: '#1E8E4A',
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 1,
    },

    prayerName: {
        color: '#111',
        fontSize: 26,
        fontWeight: 'bold',
        marginBottom: 14,
        marginTop: 4,
    },

    prayerTime: {
        color: '#555',
        fontSize: 18,
        marginBottom: 6,
        fontWeight: '600',
    },

    timerRow: {
        flexDirection: 'row',
        justifyContent: 'space-evenly',
        alignItems: 'center',
    },

    timerBox: {
        backgroundColor: '#1E8E4A',
        paddingVertical: 12,
        borderRadius: 14,
        alignItems: 'center',
        width: 72,
    },

    timerNumber: {
        color: '#fff',
        fontSize: 19,
        fontWeight: 'bold',
    },

    timerLabel: {
        color: '#dff5e6',
        fontSize: 10,
        marginTop: 2,
    },

    mosqueCard: {
        backgroundColor: '#ffffff',
        marginHorizontal: 20,
        marginTop: 16,
        marginBottom: 16,
        padding: 16,
        borderRadius: 18,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#eef1ee',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },

    mosqueText: {
        color: '#111',
        fontWeight: '700',
        fontSize: 15,
        marginBottom: 4,
    },

    mosqueSubText: {
        color: '#777',
        fontSize: 13,
    },

    distancePill: {
        backgroundColor: '#eafaf0',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
    },

    distance: {
        color: '#1E8E4A',
        fontSize: 12,
        fontWeight: '700',
    },

    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 26,
        marginBottom: 14,
        paddingHorizontal: 20,
    },

    seeAll: {
        color: '#1E8E4A',
        fontWeight: '600',
    },

    section: {
        backgroundColor: '#ffffff',
        paddingBottom: 30,
    },

    sectionTitle: {
        fontSize: 19,
        fontWeight: 'bold',
        color: '#111',
    },

    prayerGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },

    prayerBox: {
        width: '30%',
        backgroundColor: '#e8e8e8',
        padding: 15,
        borderRadius: 15,
        marginBottom: 15,
        alignItems: 'center',
    },

    activePrayer: {
        backgroundColor: '#1E8E4A',
    },

    prayerText: {
        fontSize: 14,
    },

    prayerTimeText: {
        fontWeight: 'bold',
        marginTop: 5,
    },

    liveCard: {
        backgroundColor: '#1E8E4A',
        margin: 20,
        padding: 20,
        borderRadius: 20,
    },

    liveTitle: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },

    liveSub: {
        color: '#e0f2e9',
        marginTop: 5,
    },

    quickRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },

    quickItem: {
        alignItems: 'center',
    },

    quickIcon: {
        fontSize: 24,
        marginBottom: 5,
    },

    prayerCard: {
        backgroundColor: '#f7f8f7',
        marginHorizontal: 20,
        marginBottom: 12,
        borderRadius: 18,
        padding: 14,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#eef1ee',
    },

    activePrayerCard: {
        backgroundColor: '#1E8E4A',
        borderColor: '#1E8E4A',
        shadowColor: '#1E8E4A',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        elevation: 4,
    },

    leftSection: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },

    dot: {
        width: 9,
        height: 9,
        borderRadius: 5,
        backgroundColor: '#1E8E4A',
        marginRight: 10,
    },

    timeSection: {
        alignItems: 'flex-end',
        marginRight: 14,
    },

    azanText: {
        color: '#888',
        fontSize: 12,
        marginBottom: 2,
    },

    allPrayerName: {
        fontSize: 17,
        fontWeight: '600',
        color: '#222',
    },

    allPrayerTime: {
        fontSize: 16,
        fontWeight: '700',
        color: '#111',
    },

    muteButton: {
        padding: 6,
    },
});