import axios, { AxiosError } from "axios";

// ◼︎ Base URL presa dalle env di Vite
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "https://api.medialab.com",
  timeout: 8000, // 8 s
});

/*───────────────
  Request interceptor
───────────────*/
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("jwt");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/*───────────────
  Response interceptor
───────────────*/
api.interceptors.response.use(
  (res) => res,
  (error: AxiosError<{ message?: string }>) => {
    // Notifica globale (toast) o log
    const msg = error.response?.data?.message || error.message;
    console.error("API error:", msg);

    // Esempio: se 401 → redirect al login
    if (error.response?.status === 401) {
      sessionStorage.removeItem("jwt");
      window.location.href = "/";
    }

    return Promise.reject(error);
  }
);

export default api;
