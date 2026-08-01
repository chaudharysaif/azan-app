import React, { useRef, useState } from "react";
import {
    Image,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";

export default function Verifyotp() {
    const navigation = useNavigation<any>();

    const [otp, setOtp] = useState(["", "", "", ""]);

    const inputRefs = useRef<any>([]);

    const handleChange = (text: string, index: number) => {
        if (!/^[0-9]?$/.test(text)) return;

        const newOtp = [...otp];
        newOtp[index] = text;
        setOtp(newOtp);

        if (text && index < 3) {
            inputRefs.current[index + 1].focus();
        }
    };

    const handleBackspace = (text: string, index: number) => {
        if (text === "" && index > 0) {
            inputRefs.current[index - 1].focus();
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.heading}>Verify OTP</Text>

            <Text style={styles.text}>
                Enter the OTP sent to your mobile number
            </Text>

            <View style={styles.centerContent}>
                <View style={styles.imageContainer}>
                    <Image
                        source={require("../assets/images/icon.png")}
                        style={styles.logo}
                        resizeMode="contain"
                    />
                </View>
                <View style={styles.inputContainer}>
                    <Text style={styles.label}>OTP</Text>

                    <View style={styles.otpContainer}>
                        {otp.map((digit, index) => (
                            <TextInput
                                key={index}
                                ref={(ref) => {
                                    inputRefs.current[index] = ref;
                                }}
                                style={styles.otpInput}
                                keyboardType="number-pad"
                                maxLength={1}
                                value={digit}
                                onChangeText={(text) => handleChange(text, index)}
                                onKeyPress={({ nativeEvent }) => {
                                    if (nativeEvent.key === "Backspace") {
                                        handleBackspace(digit, index);
                                    }
                                }}
                            />
                        ))}
                    </View>

                    <TouchableOpacity
                        style={styles.otpButton}
                        onPress={() =>
                            navigation.replace("MainTabs")
                        }
                    >
                        <Text style={styles.otpButtonText}>Verify OTP</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>

    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: "#ffffff",
    },

    centerContent: {
        flex: 1,
        justifyContent: "flex-start",
        paddingTop: 60,
    },

    heading: {
        fontSize: 30,
        fontWeight: "bold",
        color: "#1c8846",
    },

    text: {
        fontSize: 16,
        color: "#1c8846",
        marginTop: 5,
    },

    imageContainer: {
        marginTop: 30,
        alignItems: "center",
    },

    logo: {
        width: 200,
        height: 200,
    },

    inputContainer: {
        marginTop: 30,
    },

    label: {
        fontSize: 18,
        color: "#1c8846",
        marginBottom: 10,
        textAlign: "center",
    },

    otpContainer: {
        flexDirection: "row",
        justifyContent: "space-evenly",
        marginBottom: 20,
    },

    otpInput: {
        width: 60,
        height: 60,
        borderWidth: 1,
        borderColor: "#1c8846",
        borderRadius: 10,
        textAlign: "center",
        fontSize: 24,
        fontWeight: "bold",
        color: "#1c8846",
    },

    otpButton: {
        backgroundColor: "#1c8846",
        padding: 14,
        borderRadius: 10,
        alignItems: "center",
    },

    otpButtonText: {
        color: "#ffffff",
        fontSize: 16,
        fontWeight: "bold",
    },
});