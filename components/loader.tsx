import React from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    View,
} from 'react-native';

interface LoaderProps {
    size?: 'small' | 'large';
    color?: string;
    backgroundColor?: string;
}

export default function Loader({
    size = 'large',
    color = '#199b4d',
    backgroundColor = '#FFFFFF',
}: LoaderProps) {
    return (
        <View style={[styles.container,{
                    backgroundColor,
                },
            ]}
        >
            <ActivityIndicator size={size} color={color}/>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});