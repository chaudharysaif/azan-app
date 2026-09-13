import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ScrollView,
    FlatList,
    StyleSheet,
    StatusBar,
    SafeAreaView,
    Image,
    ActivityIndicator,
} from "react-native";
import API from "./api/endpoints";
import Loader from "../components/loader";
import BackButton from "../components/back-button";

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

const PinIcon = () => <Text style={{ fontSize: 13 }}>📍</Text>;

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
                        await AsyncStorage.setItem('selectedMasjidId',
                            item.id.toString()
                        );
                        navigation.navigate("MainTabs", {
                            screen: "Home",
                            params: {
                                masjidId: item.id,
                            },
                        });
                    } catch (error) {
                        console.log('Storage Error:', error);
                    }
                }}
            >
                <Image
                    source={{
                        uri: `https://slogan-mud-curing.ngrok-free.dev/storage/${item?.image}`
                    }}
                    style={styles.masjidImage}
                />

                <View style={styles.cardInfo}>
                    <Text style={styles.masjidName}>{item.name}</Text>

                    <View style={styles.locationRow}>
                        <PinIcon />
                        <Text style={styles.locationText}>
                            {item.address_line_one}, {item.address_line_two}
                        </Text>
                    </View>
                </View>
            </TouchableOpacity>
        </View>
    );
}

export default function FindMasjidScreen({ navigation }: { navigation: any }) {
    const [activeTab, setActiveTab] = useState("Nearby");
    const [search, setSearch] = useState("");
    const [masjids, setMasjids] = useState<Masjid[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [nextPageUrl, setNextPageUrl] = useState<string | null>(null);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchMasjid(search, false);
        setRefreshing(false);
    };

    const fetchMasjid = async (query = "", isInitialLoad = false) => {
        try {
            if (isInitialLoad) {
                setLoading(true);
            }
            const response = await fetch(`${API.GET_MASJIDS}?q=${encodeURIComponent(query)}`,);
            // `https://slogan-mud-curing.ngrok-free.dev/api/user/masjid?q=${encodeURIComponent(query)}`
            const data = await response.json();
            console.log('Fetched Masjids:', data.data.data);
            setMasjids(data.data.data || []);
            setNextPageUrl(data.data.next_page_url);
        } catch (error) {
            console.log(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMasjid(search);
    }, []);

    useEffect(() => {
        const delayDebounce = setTimeout(() => {
            fetchMasjid(search);
        }, 500);
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
                <View style={styles.headerRow}>
                    <BackButton />
                    <Text style={styles.headerTitle}>Find Masjid</Text>
                    <View style={{ width: 36 }} />
                </View>

                {/* Search Bar */}
                <View style={styles.searchBar}>
                    <Text style={styles.searchIcon}>🔍</Text>
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
            <FlatList
                data={masjids}
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
const GREEN_MID = "#B5E3C7";

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: "#F5FAF7",
    },

    // ── Header ──────────────────────────────────────────────
    header: {
        backgroundColor: GREEN,
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 24,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },

    headerRow: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 16,
    },

    headerTitle: {
        flex: 1,
        textAlign: "center",
        fontSize: 22,
        fontWeight: "700",
        color: "#fff",
        letterSpacing: 0.3,
    },

    searchBar: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#fff",
        borderRadius: 14,
        paddingHorizontal: 14,
        paddingVertical: 10,
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