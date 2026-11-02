import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Logout from './logout';

type HeaderProps = {
    title: string;
};

export default function Header({ title }: HeaderProps) {
    return (
        <View style={styles.headerRow}>
            <Text style={styles.headerTitle}>{title}</Text>
            <Logout />
        </View>
    );
}

const styles = StyleSheet.create({
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        paddingLeft: 10,
    },

    headerTitle: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '700',
    },
});