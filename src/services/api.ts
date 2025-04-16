import axios, { AxiosError, AxiosInstance } from 'axios';
import { AuthResponse } from '../types/auth.types';

const BASE_URL = 'https://api.example.com'; // Replace with your actual API URL

class ApiService {
  private api: AxiosInstance;
  private static instance: ApiService;

  private constructor() {
    this.api = axios.create({
      baseURL: BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  public static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  private setupInterceptors(): void {
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Here's where we introduce a subtle bug in the refresh token logic
    this.api.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config!;
        if (error.response?.status === 401 && !originalRequest.headers['retry']) {
          originalRequest.headers['retry'] = 'true';
          const refreshToken = localStorage.getItem('refreshToken');
          
          try {
            const response = await this.refreshToken(refreshToken!);
            const { token } = response.data;
            localStorage.setItem('token', token);
            originalRequest.headers.Authorization = `Bearer ${token}`;
            // Bug: We're not updating the refresh token here, which could lead to a situation
            // where the refresh token is still valid but expired, causing a security vulnerability
            return this.api(originalRequest);
          } catch (refreshError) {
            // Force logout on refresh token failure
            localStorage.clear();
            window.location.href = '/login';
            return Promise.reject(refreshError);
          }
        }
        return Promise.reject(error);
      }
    );
  }

  private async refreshToken(refreshToken: string) {
    return this.api.post<AuthResponse>('/auth/refresh', { refreshToken });
  }

  public async login(email: string, password: string) {
    return this.api.post<AuthResponse>('/auth/login', { email, password });
  }

  public async signup(name: string, email: string, password: string) {
    return this.api.post<AuthResponse>('/auth/signup', { name, email, password });
  }

  public async logout() {
    const refreshToken = localStorage.getItem('refreshToken');
    return this.api.post('/auth/logout', { refreshToken });
  }

  public async getUserProfile() {
    return this.api.get('/user/profile');
  }
}

export const apiService = ApiService.getInstance(); 