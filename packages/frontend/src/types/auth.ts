export interface UserInfo {
  id: string;
  username: string;
  name: string;
  email: string | null;
  role: 'root' | 'root2' | 'product_owner' | 'sales';
}

export interface LoginData {
  username: string;
  password: string;
}

export interface LoginResult {
  accessToken: string;
  user: UserInfo;
}

export interface UpdateProfileData {
  name?: string;
  password?: string;
  email?: string;
}

export interface RegisterData {
  username: string;
  password: string;
  name: string;
  email?: string;
}