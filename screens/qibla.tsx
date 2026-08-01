import React, { useEffect, useRef, useState } from "react";
import {
    Animated,
    Easing,
    PermissionsAndroid,
    Platform,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import CompassHeading from "react-native-compass-heading";
import Geolocation from "react-native-geolocation-service";

// ─── constants ────────────────────────────────────────────────────────────────

const GREEN       = "#1C8846";
const GREEN_DARK  = "#166438";
const GREEN_LIGHT = "#E8F5EE";
const WHITE       = "#FFFFFF";
const TEXT_DARK   = "#0F4023";
const TEXT_MUTED  = "#5A9A72";

const COMPASS_SIZE       = 334;                           // bigger compass
const COMPASS_R          = COMPASS_SIZE / 2;
const CENTER_SIZE        = 100;
const RING_INSET         = 17;          // gap between outer border and tick ring
const NEEDLE_REACH       = COMPASS_R - RING_INSET - 20;   // tip distance from centre
const NEEDLE_TAIL        = COMPASS_R - RING_INSET - 28;   // tail distance from centre
const CARDINAL_INSET     = 38;

// ─── helpers ─────────────────────────────────────────────────────────────────

const norm = (a: number) => ((a % 360) + 360) % 360;
const shortestDelta = (from: number, to: number) => {
    const d = norm(to - from);
    return d > 180 ? d - 360 : d;
};
const toRad = (d: number) => (d * Math.PI) / 180;

/**
 * Great-circle bearing from (lat,lng) → Kaaba.
 * Returns a FIXED number that does NOT change with device heading.
 */
const calcQibla = (lat: number, lng: number): number => {
    const kLat = toRad(21.4225);
    const dLon = toRad(39.8262 - lng);
    const lat1 = toRad(lat);
    const y = Math.sin(dLon) * Math.cos(kLat);
    const x = Math.cos(lat1) * Math.sin(kLat) - Math.sin(lat1) * Math.cos(kLat) * Math.cos(dLon);
    return norm((Math.atan2(y, x) * 180) / Math.PI);
};

const calcDistance = (lat: number, lng: number): number => {
    const R = 6371;
    const dLat = toRad(21.4225 - lat);
    const dLon = toRad(39.8262 - lng);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat)) * Math.cos(toRad(21.4225)) * Math.sin(dLon / 2) ** 2;
    return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

// Unwrapped accumulator — prevents 0/360 seam jumps in Animated.Value
class AngleAcc {
    private val = 0;
    private init = false;
    feed(target: number): number {
        if (!this.init) { this.val = target; this.init = true; return target; }
        this.val += shortestDelta(norm(this.val), norm(target));
        return this.val;
    }
}

// ─── component ───────────────────────────────────────────────────────────────

export default function Qibla() {
    const navigation = useNavigation();

    // qiblaDir = fixed geographic bearing (e.g. 292° from Mumbai). NEVER changes.
    const [qiblaDir,     setQiblaDir]     = useState<number | null>(null);
    const [distance,     setDistance]     = useState<number | null>(null);
    const [heading,      setHeading]      = useState(0);
    const [locationErr,  setLocationErr]  = useState<string | null>(null);
    const [isFacing,     setIsFacing]     = useState(false);
    const smoothedRef  = useRef(0);
    const roseAcc      = useRef(new AngleAcc());
    const needleAcc    = useRef(new AngleAcc());
    const roseAnim     = useRef(new Animated.Value(0)).current;
    const needleAnim   = useRef(new Animated.Value(0)).current;
    const pulseAnim    = useRef(new Animated.Value(1)).current;

    // ── pulse when facing ─────────────────────────────────────────────────────
    useEffect(() => {
        if (isFacing) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, { toValue: 1.06, duration: 700, useNativeDriver: true }),
                    Animated.timing(pulseAnim, { toValue: 1.00, duration: 700, useNativeDriver: true }),
                ])
            ).start();
        } else {
            pulseAnim.stopAnimation();
            pulseAnim.setValue(1);
        }
    }, [isFacing]);

    // ── location permission ───────────────────────────────────────────────────
    const requestPerm = async () => {
        if (Platform.OS === "android") {
            const r = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                {
                    title: "Location Permission",
                    message: "Needed to find Qibla direction.",
                    buttonPositive: "Allow",
                }
            );
            return r === PermissionsAndroid.RESULTS.GRANTED;
        }
        if (Platform.OS === "ios") {
            return (await Geolocation.requestAuthorization("whenInUse")) === "granted";
        }
        return true;
    };

    // ── fetch location once ───────────────────────────────────────────────────
    useEffect(() => {
        let alive = true;
        (async () => {
            const ok = await requestPerm();
            if (!ok) { alive && setLocationErr("Location permission denied"); return; }
            Geolocation.getCurrentPosition(
                ({ coords: { latitude, longitude } }) => {
                    if (!alive) return;
                    // These values are FIXED — they do not depend on compass heading
                    setQiblaDir(calcQibla(latitude, longitude));
                    setDistance(calcDistance(latitude, longitude));
                    setLocationErr(null);
                },
                (e) => { console.warn("Geo error", e); alive && setLocationErr("Unable to get location"); },
                { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
            );
        })();
        return () => { alive = false; };
    }, []);

    // ── compass ───────────────────────────────────────────────────────────────
    useEffect(() => {
        CompassHeading.start(2, ({ heading: raw }: { heading: number }) => {
            const alpha = 0.12;
            const smoothed = norm(smoothedRef.current + shortestDelta(smoothedRef.current, raw) * alpha);
            smoothedRef.current = smoothed;
            setHeading(smoothed);
        });
        return () => CompassHeading.stop();
    }, []);

    // ── rose animation (counter-rotates with device) ──────────────────────────
    useEffect(() => {
        const next = roseAcc.current.feed(-heading);
        Animated.timing(roseAnim, { toValue: next, duration: 120, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    }, [heading]);

    // ── needle animation (points at Qibla regardless of heading) ─────────────
    useEffect(() => {
        if (qiblaDir === null) return;
        // needle target = qiblaDir relative to the device's current heading
        const target = qiblaDir - heading;
        const next   = needleAcc.current.feed(target);
        Animated.timing(needleAnim, { toValue: next, duration: 120, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();

        // Update facing status
        const diff = Math.min(Math.abs(qiblaDir - heading), 360 - Math.abs(qiblaDir - heading));
        setIsFacing(diff <= 5);
    }, [heading, qiblaDir]);

    // ── interpolations ────────────────────────────────────────────────────────
    const roseSpin   = roseAnim.interpolate({ inputRange: [-7200, 7200], outputRange: ["-7200deg", "7200deg"], extrapolate: "extend" });
    const needleSpin = needleAnim.interpolate({ inputRange: [-7200, 7200], outputRange: ["-7200deg", "7200deg"], extrapolate: "extend" });
    // ── tick ring ─────────────────────────────────────────────────────────────
    // 72 ticks every 5°; every 30° is a long tick (cardinal/intercardinal)
    const ticks = Array.from({ length: 72 }, (_, i) => ({ angle: i * 5, long: i % 6 === 0 }));
    // ── render ────────────────────────────────────────────────────────────────
    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={WHITE} />

            {/* ── Header ─────────────────────────────────────────────────── */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <View style={styles.backCircle}>
                        <Text style={styles.backArrow}>‹</Text>
                    </View>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Qibla Direction</Text>
            </View>

            {/* ── Calibration banner ─────────────────────────────────────── */}
            <View style={styles.banner}>
                <Text style={styles.bannerIcon}>🧭</Text>
                <Text style={styles.bannerText}>
                    Calibrate your compass by moving the phone in a figure-8 pattern before use.
                </Text>
            </View>

            {/* ── Compass ────────────────────────────────────────────────── */}
            <View style={styles.compassWrapper}>
                {/* Outer decorative ring */}
                <View style={styles.compassOuter}>
                    {/* Inner white disc */}
                    <View style={styles.compassInner}>
                        {/* Rotating rose: ticks + cardinals */}
                        <Animated.View style={[styles.rose, { transform: [{ rotate: roseSpin }] }]}>
                            {ticks.map(({ angle, long }) => (
                                <View
                                    key={angle}
                                    style={[
                                        styles.tick,
                                        long ? styles.tickLong : styles.tickShort,
                                        {
                                            transform: [
                                                { rotate: `${angle}deg` },
                                                { translateY: -(COMPASS_R - RING_INSET - (long ? 0 : 6)) },
                                            ],
                                        },
                                    ]}
                                />
                            ))}
                            <Text style={[styles.cardinal, styles.cN]}>N</Text>
                            <Text style={[styles.cardinal, styles.cE]}>E</Text>
                            <Text style={[styles.cardinal, styles.cS]}>S</Text>
                            <Text style={[styles.cardinal, styles.cW]}>W</Text>
                        </Animated.View>

                        {/* Fixed top indicator (phone's forward direction) */}
                        <View style={styles.topIndicator} />

                        {/* Qibla needle */}
                        <Animated.View style={[styles.needleWrap, { transform: [{ rotate: needleSpin }] }]}>
                            <View style={[styles.needleArm, styles.needleArmTop]} />
                            <Text style={styles.kaabaIcon}>🕋</Text>
                            {/* <View style={[styles.needleArm, styles.needleArmBottom]} /> */}
                        </Animated.View>

                        <Animated.View style={[styles.centerCircle, { transform: [{ scale: pulseAnim }] }]}>
                            {/* Fixed Qibla bearing — never changes with rotation.
                                Show 360 when bearing rounds to 0 so it reads naturally. */}
                            <Text style={styles.degreeText}>
                                {qiblaDir === null
                                    ? "—"
                                    : `${Math.round(qiblaDir) === 0 ? 360 : Math.round(qiblaDir)}°`}
                            </Text>
                            <View style={styles.divider} />
                            <Text style={styles.distLabel}>Kaaba</Text>
                            <Text style={styles.distValue}>
                                {distance === null ? "—" : `${distance} km`}
                            </Text>
                        </Animated.View>

                        {/* Center pin */}
                        <View style={styles.pin} />
                    </View>
                </View>
            </View>

            {/* ── Info cards ─────────────────────────────────────────────── */}
            <View style={styles.cards}>
                <View style={styles.card}>
                    <Text style={styles.cardLabel}>Your Heading</Text>
                    <Text style={styles.cardValue}>{Math.round(heading)}°</Text>
                </View>
                <View style={[styles.card, styles.cardMiddle]}>
                    <Text style={[styles.cardLabel, { color: "rgba(255,255,255,0.75)" }]}>Qibla Bearing</Text>
                    <Text style={[styles.cardValue, { color: WHITE }]}>
                        {qiblaDir === null
                            ? "—"
                            : `${Math.round(qiblaDir) === 0 ? 360 : Math.round(qiblaDir)}°`}
                    </Text>
                </View>
                <View style={styles.card}>
                    <Text style={styles.cardLabel}>Distance</Text>
                    <Text style={styles.cardValue}>
                        {distance === null ? "—" : `${distance}`}
                        <Text style={styles.cardUnit}> km</Text>
                    </Text>
                </View>
            </View>

            {/* ── Status bar ─────────────────────────────────────────────── */}
            <View style={[styles.statusBar, isFacing && styles.statusBarFacing]}>
                <Text style={[styles.statusText, isFacing && styles.statusTextFacing]}>
                    {locationErr
                        ? `⚠️  ${locationErr}`
                        : isFacing
                        ? "✅  Facing Qibla — You are aligned!"
                        : "🔄  Rotate your phone to face the Qibla"}
                </Text>
            </View>
        </View>
    );
}

// ─── styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({

    container: {
        flex: 1,
        backgroundColor: WHITE,
        paddingTop: (StatusBar.currentHeight ?? 0) + 8,
    },

    // ── header
    header: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 20,
        height: 56,
        borderBottomWidth: 1,
        borderBottomColor: GREEN_LIGHT,
    },
    backBtn: { marginRight: 12 },
    backCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: GREEN_LIGHT,
        alignItems: "center",
        justifyContent: "center",
    },
    backArrow: { fontSize: 26, color: GREEN, lineHeight: 30, marginTop: -2 },
    headerTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: TEXT_DARK,
        letterSpacing: 0.4,
    },

    // ── calibration banner
    banner: {
        flexDirection: "row",
        alignItems: "flex-start",
        backgroundColor: GREEN_LIGHT,
        marginHorizontal: 20,
        marginTop: 14,
        borderRadius: 12,
        padding: 12,
        gap: 8,
    },
    bannerIcon: { fontSize: 16, marginTop: 1 },
    bannerText: { flex: 1, fontSize: 12.5, color: TEXT_DARK, lineHeight: 18 },

    // ── compass outer ring
    compassWrapper: { alignItems: "center", marginTop: 16 },
    compassOuter: {
        width: COMPASS_SIZE + 20,
        height: COMPASS_SIZE + 20,
        borderRadius: (COMPASS_SIZE + 20) / 2,
        backgroundColor: GREEN_LIGHT,
        alignItems: "center",
        justifyContent: "center",
        // subtle green shadow / glow
        shadowColor: GREEN,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.18,
        shadowRadius: 12,
        elevation: 8,
    },
    compassInner: {
        width: COMPASS_SIZE,
        height: COMPASS_SIZE,
        borderRadius: COMPASS_R,
        backgroundColor: WHITE,
        borderWidth: 2,
        borderColor: GREEN,
        alignItems: "center",
        justifyContent: "center",
    },

    // ── rotating rose
    rose: {
        position: "absolute",
        width: COMPASS_SIZE,
        height: COMPASS_SIZE,
        alignItems: "center",
        justifyContent: "center",
    },

    // ── ticks
    tick: { position: "absolute", backgroundColor: GREEN },
    tickLong:  { width: 2,   height: 17 },
    tickShort: { width: 1.5, height: 8  },

    // ── cardinal labels
    cardinal: {
        position: "absolute",
        fontSize: 18,
        fontWeight: "800",
        color: GREEN_DARK,
    },
    // CARDINAL_INSET = 38 → labels sit ~30px inside the tick ring, no overlap
    cN: { top: CARDINAL_INSET - 6 },
    cS: { bottom: CARDINAL_INSET - 6},
    cE: { right: CARDINAL_INSET - 3 },
    cW: { left: CARDINAL_INSET - 6 },

    // ── fixed top indicator (phone direction)
    topIndicator: {
        position: "absolute",
        top: 4,
        width: 0,
        height: 0,
        borderLeftWidth: 7,
        borderRightWidth: 7,
        borderTopWidth: 13,
        borderLeftColor: "transparent",
        borderRightColor: "transparent",
        borderTopColor: GREEN,
        zIndex: 10,
    },

    // ── needle
    needleWrap: {
        position: "absolute",
        width: COMPASS_SIZE,
        height: COMPASS_SIZE,
        alignItems: "center",
        justifyContent: "center",
    },
    needleArm: {
        position: "absolute",
        width: 2,
        backgroundColor: GREEN,
        borderRadius: 1,
    },
    needleArmTop: {
        height: NEEDLE_REACH - CENTER_SIZE / 2 - 20,
        top: COMPASS_R - NEEDLE_REACH + 20,
    },
    // needleArmBottom: {
    //     height: NEEDLE_TAIL - CENTER_SIZE / 2 - 4,
    //     top: COMPASS_R + CENTER_SIZE / 2 + 4,
    //     opacity: 0.35,
    // },
    kaabaIcon: {
        position: "absolute",
        top: COMPASS_R - NEEDLE_REACH + 2,
        fontSize: 27,
        textAlign: "center",
        width: 30,
        marginLeft: -5,
    },

    // ── center circle
    centerCircle: {
        position: "absolute",
        width: CENTER_SIZE,
        height: CENTER_SIZE,
        borderRadius: CENTER_SIZE / 2,
        backgroundColor: GREEN,
        alignItems: "center",
        justifyContent: "center",
        zIndex: 5,
        shadowColor: GREEN_DARK,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 6,
    },
    degreeText: {
        fontSize: 22,
        fontWeight: "700",
        color: WHITE,
        letterSpacing: -0.5,
    },
    divider: {
        width: 40,
        height: 1,
        backgroundColor: "rgba(255,255,255,0.35)",
        marginVertical: 4,
    },
    distLabel: {
        fontSize: 10,
        color: "rgba(255,255,255,0.75)",
        letterSpacing: 0.5,
        textTransform: "uppercase",
    },
    distValue: {
        fontSize: 12,
        fontWeight: "700",
        color: WHITE,
        marginTop: 1,
    },

    // ── center pin
    pin: {
        position: "absolute",
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: WHITE,
        zIndex: 20,
    },

    // ── info cards
    cards: {
        flexDirection: "row",
        marginHorizontal: 20,
        marginTop: 24,
        gap: 10,
    },
    card: {
        flex: 1,
        backgroundColor: WHITE,
        borderRadius: 14,
        paddingVertical: 14,
        alignItems: "center",
        borderWidth: 1.5,
        borderColor: GREEN_LIGHT,
    },
    cardMiddle: {
        backgroundColor: GREEN,
        borderColor: GREEN,
    },
    cardLabel: {
        fontSize: 10,
        color: TEXT_MUTED,
        letterSpacing: 0.5,
        textTransform: "uppercase",
        marginBottom: 4,
    },
    cardValue: {
        fontSize: 20,
        fontWeight: "700",
        color: TEXT_DARK,
    },
    cardUnit: {
        fontSize: 13,
        fontWeight: "400",
    },

    // cardMiddle overrides text color
    // (React Native doesn't support selector nesting, so we handle via direct style on Text if needed)
    // ── status bar
    statusBar: {
        marginHorizontal: 20,
        marginTop: 14,
        backgroundColor: GREEN_LIGHT,
        borderRadius: 14,
        paddingVertical: 14,
        paddingHorizontal: 18,
        alignItems: "center",
    },
    statusBarFacing: {
        backgroundColor: GREEN,
    },
    statusText: {
        fontSize: 14,
        fontWeight: "600",
        color: TEXT_DARK,
        textAlign: "center",
    },
    statusTextFacing: {
        color: WHITE,
    },
});