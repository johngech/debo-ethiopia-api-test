import axios, { type AxiosRequestConfig } from "axios";

const axiosInstance = axios.create({
  baseURL: "https://debo-ethiopia-api.onrender.com/api",
});

export interface FetchResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

class APIClient<T> {
  private readonly endpoint: string;
  public constructor(endpoint: string) {
    this.endpoint = endpoint;
  }

  public getAll = async (config?: AxiosRequestConfig<T> | undefined) => {
    const response = await axiosInstance.get<FetchResponse<T>>(
      this.endpoint,
      config,
    );
    return response.data;
  };

  public get = async (id: number | string) => {
    const response = await axiosInstance.get<T>(this.endpoint + "/" + id);
    return response.data;
  };
}

export default function createAPIClient<T>(endpoint: string) {
  return new APIClient<T>(endpoint);
}
