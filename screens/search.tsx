import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, StatusBar, SafeAreaView, Image } from "react-native";
import API, { IMAGE_BASE_URL } from "./api/endpoints";
import { apiRequest } from "./api/api";
import Loader from "../components/loader";
import Header from '../components/header';
import { MapPin, Search } from "lucide-react-native";
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';

type Masjid = {
    id: number;
    name: string;
    city: string;
    map_location: string;
    status: string;
    image: string | null;
    address_line_one: string;
    address_line_two: string;
    following: boolean;
};

type MasjidCardProps = {
    item: Masjid;
};

function MasjidCard({ item }: MasjidCardProps) {
    const navigation = useNavigation<any>();

    return (
        <View style={styles.card}>
            <TouchableOpacity
                onPress={async () => {
                    try {
                        await AsyncStorage.setItem('selectedMasjidId', item.id.toString());
                        navigation.navigate("MainTabs", {
                            screen: "Home",
                            params: {
                                masjidId: item.id,
                            },
                        });
                    } catch {
                        // navigation still works if persistence fails
                    }
                }}
            >
                <Image source={{ uri: `${IMAGE_BASE_URL}${item?.image}` }} style={styles.masjidImage} />
                <View style={styles.cardInfo}>
                    <Text style={styles.masjidName}>
                        <FontAwesome5 name="mosque" size={15} color="#199b4d" /> {item.name ? item.name.charAt(0).toUpperCase() + item.name.slice(1) : ''}
                    </Text>
                    <View style={styles.locationRow}>
                        <MapPin size={16} color="#199b4d" />
                        <Text style={styles.locationText}>
                            {item.address_line_one}, {item.address_line_two}
                        </Text>
                    </View>
                </View>
            </TouchableOpacity>
        </View>
    );
}

export default function FindMasjidScreen() {
    const [search, setSearch] = useState("");
    const [masjids, setMasjids] = useState<Masjid[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchMasjid(search);
        setRefreshing(false);
    };

    const fetchMasjid = async (query = "") => {
        try {
            const data = await apiRequest(
                `${API.GET_MASJIDS}?q=${encodeURIComponent(query)}`,
            );
            setMasjids(data?.data?.data || []);
        } catch {
            // keep the previously loaded list when a search fails
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const delayDebounce = setTimeout(() => {
            fetchMasjid(search);
        }, search ? 500 : 0);
        return () => clearTimeout(delayDebounce);
    }, [search]);

    if (loading) {
        return <Loader size="large" color="#199b4d" />
    }

    return (
        <SafeAreaView style={styles.safe}>
            <StatusBar barStyle="light-content" backgroundColor="#199b4d" />

            {/* Header */}
            <View style={styles.header}>
                <Header title="Search Masjid" />

                {/* Search Bar */}
                <View style={styles.searchBar}>
                    <Text style={styles.searchIcon}><Search color="#199b4d" /></Text>
                    <TextInput
                        value={search}
                        onChangeText={setSearch}
                        placeholder="Search masjid name or area..."
                        placeholderTextColor="#9CA3AF"
                        style={styles.searchInput}
                        returnKeyType="search"
                    />
                </View>
            </View>

            {/* Cards */}
            <FlatList data={masjids}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => <MasjidCard item={item} />}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                refreshing={refreshing}
                onRefresh={onRefresh}
            />
        </SafeAreaView>
    );
}

const GREEN = "#199b4d";
const GREEN_LIGHT = "#D6F0E0";

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: "#F5FAF7",
    },

    // ── Header ──────────────────────────────────────────────
    header: {
        backgroundColor: GREEN,
        padding: 20,
        paddingLeft: 20,
        borderBottomLeftRadius: 25,
        borderBottomRightRadius: 25,
    },

    searchBar: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fff",
        borderRadius: 14,
        paddingHorizontal: 14,
        paddingVertical: 8,
        marginTop: 10,
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 2 },
        elevation: 3,
    },
    searchIcon: {
        fontSize: 16,
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 14,
        color: "#1F2937",
        padding: 0,
    },

    // ── Tabs ────────────────────────────────────────────────
    tabsWrapper: {
        backgroundColor: "#fff",
        shadowColor: "#000",
        shadowOpacity: 0.04,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
        elevation: 2,
    },
    tabsContainer: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 8,
        flexDirection: "row",
    },
    tab: {
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1.5,
        borderColor: "#E5E7EB",
        backgroundColor: "#fff",
        marginRight: 8,
    },
    tabActive: {
        backgroundColor: GREEN,
        borderColor: GREEN,
    },
    tabText: {
        fontSize: 13,
        fontWeight: "600",
        color: "#6B7280",
    },
    tabTextActive: {
        color: "#fff",
    },

    // ── List ────────────────────────────────────────────────
    listContent: {
        padding: 16,
        gap: 16,
    },

    // ── Card ────────────────────────────────────────────────
    card: {
        backgroundColor: "#fff",
        borderRadius: 18,
        overflow: "hidden",
        marginBottom: 16,
        shadowColor: "#000",
        shadowOpacity: 0.07,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 3 },
        elevation: 3,
    },
    cardImageArea: {
        backgroundColor: GREEN_LIGHT,
        height: 130,
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
    },
    photoBadge: {
        position: "absolute",
        top: 12,
        right: 12,
        backgroundColor: "rgba(255,255,255,0.88)",
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 20,
    },
    photoBadgeText: {
        fontSize: 11,
        fontWeight: "600",
        color: "#374151",
    },
    cardInfo: {
        padding: 14,
    },
    cardInfoTop: {
        flexDirection: "row",
        alignItems: "flex-start",
        marginBottom: 10,
    },
    masjidName: {
        fontSize: 16,
        fontWeight: "700",
        color: "#111827",
        marginBottom: 4,
    },
    locationRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 3,
    },
    locationText: {
        fontSize: 12,
        color: "#6B7280",
        marginLeft: 3,
    },
    cardFooter: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
    },
    badgesRow: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },

    // Status badge
    statusBadge: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 20,
        gap: 5,
    },
    statusLive: {
        backgroundColor: "#FEE2E2",
    },
    statusOpen: {
        backgroundColor: GREEN_LIGHT,
    },
    statusText: {
        fontSize: 12,
        fontWeight: "700",
    },
    statusTextLive: {
        color: "#DC2626",
    },
    statusTextOpen: {
        color: GREEN,
    },
    liveDot: {
        width: 7,
        height: 7,
        borderRadius: 4,
        backgroundColor: "#DC2626",
    },

    // Rating badge
    ratingBadge: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFFBEB",
        borderWidth: 1,
        borderColor: "#FDE68A",
        paddingHorizontal: 9,
        paddingVertical: 5,
        borderRadius: 20,
        gap: 4,
    },
    ratingText: {
        fontSize: 12,
        fontWeight: "700",
        color: "#92400E",
    },

    // Follow button
    followBtn: {
        backgroundColor: GREEN,
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 20,
    },
    followingBtn: {
        backgroundColor: "#fff",
        borderWidth: 1.5,
        borderColor: GREEN,
    },
    followBtnText: {
        fontSize: 13,
        fontWeight: "700",
        color: "#fff",
    },
    followingBtnText: {
        color: GREEN,
    },
    masjidImage: {
        width: "100%",
        height: 180,
    },
});