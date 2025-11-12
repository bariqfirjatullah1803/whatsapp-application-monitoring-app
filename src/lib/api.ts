import axios, { type AxiosInstance } from 'axios';
import type {
  AuthResponse,
  LoginCredentials,
  RegisterCredentials,
  MessageHistory,
  Chat,
  Statistics,
} from './types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: `${API_URL}/api`,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add token to requests
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Handle 401 errors
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Authentication
  async register(credentials: RegisterCredentials): Promise<AuthResponse> {
    const { data } = await this.client.post<AuthResponse>('/auth/register', credentials);
    return data;
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const { data } = await this.client.post<AuthResponse>('/auth/login', credentials);
    return data;
  }

  // Messages
  async getMessageHistory(chatId: string, limit = 50, before?: string): Promise<MessageHistory> {
    const params = new URLSearchParams({ limit: limit.toString() });
    if (before) params.append('before', before);
    
    const { data } = await this.client.get<MessageHistory>(`/messages/${chatId}?${params}`);
    return data;
  }

  async getChats(limit = 100): Promise<{ chats: Chat[]; count: number }> {
    const { data } = await this.client.get(`/messages?limit=${limit}`);
    return data;
  }

  // Statistics
  async getStatistics(): Promise<Statistics> {
    const { data } = await this.client.get<Statistics>('/stats');
    return data;
  }

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string; mongodb: string }> {
    const { data } = await this.client.get('/health');
    return data;
  }
}

export const api = new ApiClient();

