const BASE_URL = "https://slogan-mud-curing.ngrok-free.dev/api";

export const API = {
    BASE_URL,

    // User
    GET_MASJIDS: `${BASE_URL}/user/masjid`,
    LOGIN: `${BASE_URL}/user/login`,
    GET_MASJID_DETAILS: (id: number | string) => `${BASE_URL}/user/masjid/details/${id}`,
    GET_DUA: `${BASE_URL}/basic/dua`,

    // Vendor
    UPDATE_NAMAZ_TIME: (id: number | string) => `${BASE_URL}/vendor/masjid/${id}/prayer-times`,
    PRAYER_TIMES: `${BASE_URL}/masjid/prayer-times`,
    MASJID_LOGIN: `${BASE_URL}/masjid/login`
};

export default API;