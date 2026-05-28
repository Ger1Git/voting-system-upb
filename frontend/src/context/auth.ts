import { useMutation } from "@tanstack/react-query";
import Cookies from "js-cookie";
import { LoginCredentials, RegisterCredentials, AuthResponse } from "../types";
import { apiClient } from "../utils/axiosConfig";
import { API_PATHS, AUTH_COOKIE_KEY } from "../utils/constants";

const login = async ({ username, password }: LoginCredentials): Promise<string> => {
  const response = await apiClient.post<AuthResponse>(
    API_PATHS.login,
    { email: username, password }
  );
  return response.data.token;
};

const register = async ({ username, email, password, studentId, faculty, cnp, phone }: RegisterCredentials): Promise<{ success: boolean; userId: number; message: string }> => {
  const response = await apiClient.post<{ success: boolean; userId: number; message: string }>(
    API_PATHS.register,
    { fullName: username, email, password, studentId, faculty, cnp, phone }
  );
  return response.data;
};

const useLoginMutation = () => {
  return useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      Cookies.set(AUTH_COOKIE_KEY, data, { expires: 1 });
    },
  });
};

const useRegisterMutation = () => {
  return useMutation({
    mutationFn: register,
  });
};

export { useLoginMutation, useRegisterMutation };
