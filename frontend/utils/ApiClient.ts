import axios from "axios";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:6900";

const authEndpoints = [
  "/auth/login",
  "/auth/verify",
  "/auth/refresh",
  "/auth/logout",
  "/auth/google/url",
];

const ApiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(ApiClient(prom.originalRequest));
    }
  });
  failedQueue = [];
};

ApiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    const isAuthEndpoint = authEndpoints.some((endpoint) =>
      originalRequest.url.includes(endpoint)
    );

    if (
      error.response?.status === 401 &&
      !isAuthEndpoint &&
      !originalRequest._retry
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject, originalRequest });
        }).catch((err) => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await ApiClient.post("/auth/refresh");

        processQueue(null);
        return ApiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export default ApiClient;
