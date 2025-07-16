import { User } from '@/types/user';

export class AuthService {
  private static instance: AuthService;
  
  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token');
  }

  getUser(): User | null {
    if (typeof window === 'undefined') return null;
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  setAuth(token: string, user: User): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  }

  clearAuth(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  isAdmin(): boolean {
    const user = this.getUser();
    return user?.role === 'admin' || user?.role === 'superadmin';
  }

  isSuperAdmin(): boolean {
    const user = this.getUser();
    return user?.role === 'superadmin';
  }
}

export const authService = AuthService.getInstance();
