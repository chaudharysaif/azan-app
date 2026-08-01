const BASE_URL = "https://slogan-mud-curing.ngrok-free.dev/api";

const defaultHeaders = {
    "Content-Type": "application/json",
    "Accept": "application/json",
    "ngrok-skip-browser-warning": "true",
};

export async function apiRequest(
    endpoint: string,
    options: RequestInit = {}
) {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers: {
            ...defaultHeaders,
            ...(options.headers || {}),
        },
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || "Something went wrong");
    }

    return data;
}

export default BASE_URL;