const BASE_URL = "https://slogan-mud-curing.ngrok-free.dev/api";
// const BASE_URL = "https://slogan-mud-curing.ngrok-free.dev/api";

export const API = {
    BASE_URL,

    // User
    GET_MASJIDS: `${BASE_URL}/user/masjid`,
    LOGIN: `${BASE_URL}/user/login`,
    GET_DUA: `${BASE_URL}/basic/dua`,
    GET_MASJID_DETAILS: (id: number | string) => `${BASE_URL}/user/masjid/details/${id}`,
    GET_LIVE_STATUS: (id: number | string) => `${BASE_URL}/user/live/status/${id}`,
    GET_LIVE_TOKEN: (id: number | string) => `${BASE_URL}/user/live/token/${id}`,

    // Vendor
    MASJID_LOGIN: `${BASE_URL}/masjid/login`,
    UPDATE_NAMAZ_TIME: (id: number | string) => `${BASE_URL}/vendor/masjid/${id}/prayer-times`,
    PRAYER_TIMES: `${BASE_URL}/masjid/prayer-times`,
    MASJID_ANNOUNCEMENTS: `${BASE_URL}/masjid/announcements`,
};

export default API;