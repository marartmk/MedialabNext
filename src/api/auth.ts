import api from './axiosClient';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  userId: string;
  level: string;
  isExternalUser: boolean;
  token: string; // JWT restituito dal backend
}

export async function login(payload: LoginRequest) {
  const { data } = await api.post<LoginResponse>('/auth/login', payload);

  // Salva token ecc. dove preferisci
  sessionStorage.setItem('jwt', data.token);
  sessionStorage.setItem('isAuthenticated', 'true');

  return data;
}
