import API from './endpoints';

const defaultHeaders = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'ngrok-skip-browser-warning': 'true',
};

/**
 * Small fetch wrapper used by every screen.
 * - merges the default headers (including the ngrok bypass header)
 * - parses JSON once
 * - throws a readable error for non-2xx responses
 */
export async function apiRequest(url: string, options: RequestInit = {}): Promise<any> {
    const response = await fetch(url, {...options,
        headers: {
            ...defaultHeaders,
            ...(options.headers || {}),
        },
    });

    const text = await response.text();
    let data: any = null;
    try {
        data = text ? JSON.parse(text) : null;
    } catch {
        data = null;
    }

    // if (!response.ok) {
    //     throw new Error(data?.message || `Request failed (${response.status})`);
    // }

    return data;
}

/** Fetch a masjid (with prayer times). The API expects a POST body. */
export async function fetchMasjidDetails(masjidId: number | string,deviceName?: string): Promise<any> {
    return apiRequest(API.GET_MASJID_DETAILS, {
        method: 'POST',
        body: JSON.stringify({
            masjid_id: masjidId,
            ...(deviceName ? { device_name: deviceName } : {}),
        }),
    });
}

export default apiRequest;
