import axios from "axios";

export const base_url = "https://timeerp.duckdns.org";
// const base_url = "http://127.0.0.1:8000";

// export const base_url = "https://insulin-prefer-thee-matt.trycloudflare.com";


const api = axios.create({
  baseURL: base_url,
  // withCredentials: true,
});

// ✅ Add the JWT token to every request if it exists
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `JWT ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
