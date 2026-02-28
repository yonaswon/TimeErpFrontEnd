import axios from "axios";

export const base_url = "https://timeerp.duckdns.org";
// export const base_url = "https://instructional-suppliers-upload-constraint.trycloudflare.com";

// export const base_url = "https://carter-stuck-creations-asked.trycloudflare.com";

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
