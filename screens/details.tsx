import React, { useEffect, useState } from 'react';
import { FlatList, ImageBackground, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import API from './api/endpoints';

export default function Details({ route }: any) {

    type Masjid = {
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

    type PrayerTime = {
        id: number;
        prayer_name: string;
        adhan_time: string;
        prayer_time: string;
        is_live: string;
        status: string;
    };

    const formatTime = (time: string) => {
        const [hours, minutes] = time.split(':');

        const date = new Date();
        date.setHours(Number(hours));
        date.setMinutes(Number(minutes));

        return date.toLocaleTimeString([], {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
        });
    };

    const getCurrentPrayer = (prayers: PrayerTime[]) => {
        const current = new Date().toTimeString().slice(0, 8);
        for (const prayer of prayers) {
            if (prayer.prayer_time > current) {
                return prayer.id;
            }
        }
        return prayers[0]?.id;
    };

    const [mutedPrayers, setMutedPrayers] = useState<number[]>([]);

    const toggleMute = (id: number) => {
        setMutedPrayers(prev =>
            prev.includes(id)
                ? prev.filter(item => item !== id)
                : [...prev, id]
        );
    };

    const navigation = useNavigation<any>();
    const masjidId = route?.params?.masjidId;
    const [masjid, setMasjid] = useState<Masjid | null>(null);

    const fetchMasjidDetails = async () => {
        if (!masjidId) return;

        try {
            const response = await fetch(
                API.GET_MASJID_DETAILS(masjidId),
            );
            const data = await response.json();
            console.log("Masjid With Namaz Times:", data);
            setMasjid(data.data);
        } catch (error) {
            console.log("Details API Error:", error);
        }
    };

    useEffect(() => {
        fetchMasjidDetails();
    }, [masjidId]);


    return (
        <View style={styles.container}>

            <ImageBackground
                source={{
                    uri: `https://slogan-mud-curing.ngrok-free.dev/storage/${masjid?.image}`
                }}
                style={styles.hero}
                imageStyle={{ borderBottomLeftRadius: 30, borderBottomRightRadius: 30 }}
            >

                <View style={styles.overlay} />

                <View style={styles.heroContent}>

                    <Text style={styles.masjidName}>
                        {masjid?.name}
                    </Text>

                    <Text style={styles.location}>
                        📍 {masjid?.address_line_one}, {masjid?.city}
                    </Text>
                </View>
            </ImageBackground>

            <View style={styles.actionRow}>
                <TouchableOpacity style={[styles.actionBtn, styles.followBtn]}>
                    <Text style={styles.followText}>🔔 Following</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionBtn}>
                    <Text style={styles.actionText}>🔊 Live Azan</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionBtn}>
                    <Text style={styles.actionText}>📤 Share</Text>
                </TouchableOpacity>
            </View>

            <Text style={styles.sectionTitle}>
                Prayer Timings · Today
            </Text>

            <FlatList
                data={masjid?.masjid_prayer_times || []}
                keyExtractor={item => item.id.toString()}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 40 }}
                renderItem={({ item }) => {

                    const activePrayer =
                        item.id ===
                        getCurrentPrayer(
                            masjid?.masjid_prayer_times || []
                        );

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
                                        styles.dot,
                                        activePrayer && {
                                            backgroundColor: '#fff',
                                        },
                                    ]}
                                />

                                <Text
                                    style={[
                                        styles.prayerName,
                                        activePrayer && {
                                            color: '#fff',
                                        },
                                    ]}
                                >
                                    {item.prayer_name
                                        .charAt(0)
                                        .toUpperCase() +
                                        item.prayer_name.slice(1)}
                                </Text>
                            </View>

                            <View style={styles.timeSection}>
                                <Text
                                    style={[
                                        styles.azanText,
                                        activePrayer && {
                                            color: '#fff',
                                        },
                                    ]}
                                >
                                    Azan — {formatTime(item.adhan_time)}
                                </Text>

                                <Text
                                    style={[
                                        styles.prayerTime,
                                        activePrayer && {
                                            color: '#fff',
                                        },
                                    ]}
                                >
                                    {formatTime(item.prayer_time)}
                                </Text>
                            </View>

                            <TouchableOpacity
                                onPress={() =>
                                    toggleMute(item.id)
                                }
                            >
                                <Text style={{ fontSize: 22 }}>
                                    {mutedPrayers.includes(item.id)
                                        ? '🔇'
                                        : '🔊'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    );
                }}
            />

        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F4F6F5',
    },

    hero: {
        height: 250,
        justifyContent: 'flex-end',
    },

    overlay: {
        ...StyleSheet.absoluteFill,
        backgroundColor: 'rgba(30,142,74,0.75)',
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },

    heroContent: {
        padding: 20,
    },

    masjidIcon: {
        fontSize: 50,
        marginBottom: 10,
    },

    masjidName: {
        color: '#fff',
        fontSize: 28,
        fontWeight: '700',
    },

    location: {
        color: '#fff',
        marginTop: 5,
        fontSize: 14,
    },

    actionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 15,
        marginTop: 10,
    },

    actionBtn: {
        flex: 1,
        backgroundColor: '#fff',
        paddingVertical: 15,
        borderRadius: 18,
        alignItems: 'center',
        marginHorizontal: 5,
        elevation: 2,
    },

    followBtn: {
        backgroundColor: '#1E8E4A',
    },

    followText: {
        color: '#fff',
        fontWeight: '600',
    },

    actionText: {
        color: '#1E8E4A',
        fontWeight: '600',
    },

    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginHorizontal: 20,
        marginTop: 25,
        marginBottom: 15,
    },

    prayerCard: {
        backgroundColor: '#fff',
        marginHorizontal: 18,
        marginBottom: 10,
        borderRadius: 18,
        padding: 10,
        flexDirection: 'row',
        alignItems: 'center',
        elevation: 1,
    },

    activePrayerCard: {
        backgroundColor: '#1E8E4A',
    },

    leftSection: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },

    dot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#50C878',
        marginRight: 10,
    },

    prayerName: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },

    timeSection: {
        alignItems: 'flex-end',
        marginRight: 15,
    },

    azanText: {
        color: '#777',
        fontSize: 13,
    },

    prayerTime: {
        fontSize: 17,
        fontWeight: '700',
        color: '#111',
    },
});