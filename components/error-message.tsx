import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type ErrorMessageProps = {
    message?: string;
};

const ErrorMessage = ({ message }: ErrorMessageProps) => {

    if (!message) {
        return null;
    }

    return (
        <View style={styles.container}>
            <Text style={styles.errorText}>
                {message}
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginTop: 5,
    },

    errorText: {
        color: '#D32F2F',
        fontSize: 12,
    },
});

export default ErrorMessage;