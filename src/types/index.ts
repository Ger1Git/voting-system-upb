export interface NavItem {
  id: number;
  label: string;
  link: string;
}

export interface Category {
  value: string;
  label: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterCredentials {
  username: string;
  password: string;
  email: string;
}

export interface AuthResponse {
  token: string;
  message?: string;
}
