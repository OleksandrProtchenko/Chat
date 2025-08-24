export interface RegisterForm {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  gender: "male" | "female";
}

export interface LoginForm {
  usernameOrEmail: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}