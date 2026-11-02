import { getMessaging, getToken } from '@react-native-firebase/messaging';

export const getDeviceId = async (): Promise<string | null> => {
    try {
        const token = await getToken(getMessaging());
        return token || null;
    } catch {
        return null;
    }
};