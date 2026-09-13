import React from 'react';
import {
    TouchableOpacity,
    StyleSheet,
    useWindowDimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft } from 'lucide-react-native';

export default function BackButton() {
    const navigation = useNavigation<any>();
    const { width } = useWindowDimensions();

    const btnSize = Math.min(Math.max(width * 0.9, 32), 40);
    const iconSize = Math.min(Math.max(width * 0.045, 16), 20);
    const radius = Math.round(btnSize * 0.27);

    const handleBack = () => {
        navigation.goBack();
    };

    return (
        <TouchableOpacity
            style={[
                styles.backBtn,
                {
                    width: btnSize,
                    height: btnSize,
                    borderRadius: radius,
                },
            ]}
            onPress={handleBack}
            activeOpacity={0.7}
        >
            <ArrowLeft
                size={iconSize}
                color="#199b4d"
                strokeWidth={2.5}
            />
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    backBtn: {
        backgroundColor: '#E8F5EE',
        alignItems: 'center',
        justifyContent: 'center',
    },
});