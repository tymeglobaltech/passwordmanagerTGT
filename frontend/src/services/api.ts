import axios, { AxiosInstance, AxiosError } from 'axios';
import {
  LoginDto,
  AuthResponse,
  User,
  CreatePasswordDto,
  PasswordListItem,
  RetrievePasswordResponse,
  PaginatedResponse,
  CreateUserDto,
  UpdateUserDto,
  AdminStats,
  AccessLog,
  PasswordGeneratorOptions,
  PasswordGenerationResult
} from '@passwordpal/shared';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor to handle errors
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Authentication
  async login(credentials: LoginDto): Promise<AuthResponse> {
    const response = await this.client.post<{ data: AuthResponse }>('/auth/login', credentials);
    return response.data.data;
  }

  async googleLogin(idToken: string): Promise<AuthResponse> {
    const response = await this.client.post<{ data: AuthResponse }>('/auth/google', { idToken });
    return response.data.data;
  }

  async getCurrentUser(): Promise<User> {
    const response = await this.client.get<{ data: User }>('/auth/me');
    return response.data.data;
  }

  async logout(): Promise<void> {
    await this.client.post('/auth/logout');
  }

  async setPassword(token: string, password: string): Promise<void> {
    await this.client.post('/auth/set-password', { token, password });
  }

  // Password Management
  async generatePassword(options: PasswordGeneratorOptions): Promise<PasswordGenerationResult> {
    const response = await this.client.post<{ data: PasswordGenerationResult }>(
      '/passwords/generate',
      options
    );
    return response.data.data;
  }

  async savePassword(data: CreatePasswordDto): Promise<PasswordListItem> {
    const response = await this.client.post<{ data: PasswordListItem }>('/passwords', data);
    return response.data.data;
  }

  async retrievePassword(guid: string): Promise<RetrievePasswordResponse> {
    const response = await this.client.get<{ data: RetrievePasswordResponse }>(
      `/passwords/${guid}`
    );
    return response.data.data;
  }

  async listPasswords(page = 1, limit = 20): Promise<PaginatedResponse<PasswordListItem>> {
    const response = await this.client.get<{ data: PaginatedResponse<PasswordListItem> }>(
      '/passwords',
      { params: { page, limit } }
    );
    return response.data.data;
  }

  async deletePassword(guid: string): Promise<void> {
    await this.client.delete(`/passwords/${guid}`);
  }

  async bulkSavePasswords(entries: { title: string; password: string }[]): Promise<{ results: { index: number; title: string; success: boolean; shareable_link?: string; error?: string }[] }> {
    const response = await this.client.post<{ data: { results: any[] } }>('/passwords/bulk', { entries });
    return response.data.data;
  }

  // Admin - User Management
  async getUsers(page = 1, limit = 50): Promise<PaginatedResponse<User>> {
    const response = await this.client.get<{ data: PaginatedResponse<User> }>(
      '/admin/users',
      { params: { page, limit } }
    );
    return response.data.data;
  }

  async createUser(data: CreateUserDto): Promise<User> {
    const response = await this.client.post<{ data: User }>('/admin/users', data);
    return response.data.data;
  }

  async updateUser(id: string, data: UpdateUserDto): Promise<User> {
    const response = await this.client.put<{ data: User }>(`/admin/users/${id}`, data);
    return response.data.data;
  }

  async deleteUser(id: string): Promise<void> {
    await this.client.delete(`/admin/users/${id}`);
  }

  // Admin - Logs and Stats
  async getAccessLogs(params?: {
    page?: number;
    limit?: number;
    passwordId?: string;
    userId?: string;
  }): Promise<PaginatedResponse<AccessLog>> {
    const response = await this.client.get<{ data: PaginatedResponse<AccessLog> }>(
      '/admin/logs',
      { params }
    );
    return response.data.data;
  }

  async getStatistics(): Promise<AdminStats> {
    const response = await this.client.get<{ data: AdminStats }>('/admin/stats');
    return response.data.data;
  }
}

export const api = new ApiService();
