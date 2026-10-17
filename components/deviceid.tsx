import { getMessaging, getToken } from '@react-native-firebase/messaging';

export const getDeviceId = async (): Promise<string | null> => {
    try {
        const token = await getToken(getMessaging());
        console.log('FCM Device ID:', token);
        return token || null;
    } catch (error) {
        console.log('Error getting FCM Device ID:', error);
        return null;
    }
};