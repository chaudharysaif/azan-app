import React from 'react';

import {
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

type ApiErrorAlertProps = {
    visible: boolean;
    message: string;
    onClose: () => void;
};

const ApiErrorAlert = ({
    visible,
    message,
    onClose,
}: ApiErrorAlertProps) => {
    return (
        <Modal
            transparent
            visible={visible}
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.alertBox}>

                    <View style={styles.iconContainer}>
                        <Text style={styles.icon}>
                            !
                        </Text>
                    </View>

                    <Text style={styles.title}>
                        Error
                    </Text>

                    <Text style={styles.message}>
                        {message}
                    </Text>

                    <TouchableOpacity
                        style={styles.button}
                        activeOpacity={0.8}
                        onPress={onClose}
                    >
                        <Text style={styles.buttonText}>
                            OK
                        </Text>
                    </TouchableOpacity>

                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },

    alertBox: {
        width: '100%',
        maxWidth: 400,
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
        elevation: 10,
    },

    iconContainer: {
        width: 55,
        height: 55,
        borderRadius: 30,
        backgroundColor: '#FDECEC',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
    },

    icon: {
        fontSize: 30,
        fontWeight: 'bold',
        color: '#D32F2F',
    },

    title: {
        fontSize: 21,
        fontWeight: '700',
        color: '#222',
        marginBottom: 10,
    },

    message: {
        fontSize: 15,
        color: '#666',
        textAlign: 'center',
        lineHeight: 22,
    },

    button: {
        width: '100%',
        height: 50,
        backgroundColor: '#199b4d',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 24,
    },

    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
});

export default ApiErrorAlert;