import axios, {
  type AxiosRequestConfig,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from "axios";

// Extend the config type to include _retry
interface ExtendedAxiosRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

const baseURL = "https://debo-ethiopia-api.onrender.com";

const axiosInstance: AxiosInstance = axios.create({
  baseURL: `${baseURL}/api`,
  withCredentials: true, // Important for sending cookies
});

export interface FetchResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// Token management - only access token in localStorage
const TokenService = {
  getAccessToken: (): string | null => {
    return localStorage.getItem("access_token");
  },

  setAccessToken: (access: string): void => {
    localStorage.setItem("access_token", access);
  },

  clearAccessToken: (): void => {
    localStorage.removeItem("access_token");
  },
};

// Request interceptor - add access token to headers
axiosInstance.interceptors.request.use(
  (config: ExtendedAxiosRequestConfig) => {
    const token = TokenService.getAccessToken();
    if (token) {
      config.headers.Authorization = `JWT ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor - handle token refresh
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as ExtendedAxiosRequestConfig;

    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Refresh token - cookie is sent automatically
        const response = await axiosInstance.post(
          "/auth/jwt/refresh",
          {}, // Empty body, refresh token is in cookie
          { withCredentials: true },
        );

        // Store new access token from response
        if (response.data.access) {
          TokenService.setAccessToken(response.data.access);
        }

        // Update Authorization header
        originalRequest.headers.Authorization = `JWT ${response.data.access}`;

        // Retry the original request
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        // Refresh failed - clear access token only
        TokenService.clearAccessToken();
        globalThis.location.href = "/login"; // Redirect to login page
        throw refreshError;
      }
    }

    // Handle 403 Forbidden
    if (error.response?.status === 403) {
      console.error("Access forbidden:", error.response.data);
      // Maybe redirect to unauthorized page
    }

    // Handle 429 Too Many Requests
    if (error.response?.status === 429) {
      console.warn("Rate limited. Retrying...");
      // Implement retry logic with exponential backoff
    }

    throw error;
  },
);

class APIClient<T> {
  private readonly endpoint: string;

  public constructor(endpoint: string) {
    this.endpoint = endpoint;
  }

  public getAll = async (config?: AxiosRequestConfig) => {
    const response = await axiosInstance.get<FetchResponse<T>>(
      this.endpoint,
      config,
    );
    return response.data;
  };

  public get = async (id: number | string) => {
    const response = await axiosInstance.get<T>(`${this.endpoint}/${id}`);
    return response.data;
  };

  public post = async (data: T, config?: AxiosRequestConfig) => {
    const response = await axiosInstance.post<T>(this.endpoint, data, config);
    return response.data;
  };

  public put = async (
    id: number | string,
    data: T,
    config?: AxiosRequestConfig,
  ) => {
    const response = await axiosInstance.put<T>(
      `${this.endpoint}/${id}`,
      data,
      config,
    );
    return response.data;
  };

  public patch = async (
    id: number | string,
    data: Partial<T>,
    config?: AxiosRequestConfig,
  ) => {
    const response = await axiosInstance.patch<T>(
      `${this.endpoint}/${id}`,
      data,
      config,
    );
    return response.data;
  };

  public delete = async (id: number | string) => {
    const response = await axiosInstance.delete<T>(`${this.endpoint}/${id}`);
    return response.data;
  };
}

interface LoginRequest {
  email: string;
  password: string;
}

// Auth API - refresh is handled by interceptor, so no need for refresh method here
export const authService = {
  login: async ({ email, password }: LoginRequest) => {
    const response = await axiosInstance.post("/auth/jwt/create", {
      email,
      password,
    });

    // Only store access token from response
    // Refresh token is automatically set as HTTP-only cookie by the server
    if (response.data.access) {
      TokenService.setAccessToken(response.data.access);
    }

    return response.data;
  },

  logout: async () => {
    try {
      // Optional: Call logout endpoint to clear cookie on server
      // NB: I haven't implemented this endpoint on the backend yet(my bad).
      await axiosInstance.post("/auth/logout", {}, { withCredentials: true });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Always clear access token from localStorage
      TokenService.clearAccessToken();
      globalThis.location.href = "/login";
    }
  },

  isAuthenticated: (): boolean => {
    return !!TokenService.getAccessToken();
  },
};

export default function createTokenBasedAPIClient<T>(endpoint: string) {
  return new APIClient<T>(endpoint);
}
