import axios, { AxiosError } from 'axios';
import { 
  User, 
  RegistrationData, 
  LoginData, 
  ActivationData
} from '@/types/user';

import { Department } from '@/types/department';

import { 
  LoginResponse,
  PaginatedResponse 
} from '@/types/api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

class ApiClient {
  private client;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor для додавання токену
    this.client.interceptors.request.use((config) => {
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Token ${token}`;
        }
      }
      return config;
    });

    // Response interceptor для обробки помилок
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          if (typeof window !== 'undefined') {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
          }
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async register(data: RegistrationData) {
    return this.client.post('/auth/register/', data);
  }

  async login(data: LoginData) {
    return this.client.post<LoginResponse>('/auth/login/', data);
  }

  async logout() {
    return this.client.post('/auth/logout/');
  }

  async activate(data: ActivationData) {
    return this.client.post<LoginResponse>('/auth/activate/', data);
  }

  async getProfile() {
    return this.client.get<User>('/auth/profile/');
  }

  async updateProfile(data: Partial<User>) {
    return this.client.patch<User>('/auth/profile/', data);
  }

  // Department endpoints
  async getDepartments() {
    const response = await this.client.get('/auth/departments/');
    // Повертаємо results якщо є пагінація, інакше дані як є
    return {
      data: response.data.results || response.data
    };
  }

  // User management endpoints
  async getUsers(params?: { department?: number; status?: string }) {
    return this.client.get<PaginatedResponse<User>>('/auth/users/', { params });
  }

  async getUser(id: number) {
    return this.client.get<User>(`/auth/users/${id}/`);
  }

  async approveUser(id: number) {
    return this.client.post(`/auth/users/${id}/approve/`);
  }

  async declineUser(id: number, reason?: string) {
    return this.client.post(`/auth/users/${id}/decline/`, { reason });
  }
}

export const apiClient = new ApiClient();