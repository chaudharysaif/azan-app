export interface PrayerTime {
    id: number;
    prayer_name: string;
    adhan_time: string;
    prayer_time: string;
    is_live: string;
    status: string;
}

export interface Masjid {
    id: number;
    name: string;
    city: string;
    map_location: string;
    status: string;
    image: string | null;
    address_line_one: string;
    address_line_two: string;
    masjid_prayer_times: PrayerTime[];
}