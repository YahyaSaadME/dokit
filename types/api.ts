export interface UserData {
  id: string;
  name: string;
  email: string;
  isVerified: boolean;
  profilePicture?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: UserData;
}

export interface ProfileResponse {
  success: boolean;
  message?: string;
  user: UserData;
}

export interface GeneralResponse {
  success: boolean;
  message: string;
}
