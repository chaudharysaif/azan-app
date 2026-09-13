import { Dimensions } from 'react-native';

const { width: SW, height: SH } = Dimensions.get('window');

/** wp(5) = 5% of screen width — use for fonts, horizontal spacing, sizes */
export const wp = (percent: number) => (SW * percent) / 100;

/** hp(5) = 5% of screen height — use for vertical spacing, heights */
export const hp = (percent: number) => (SH * percent) / 100;