import { useMutation } from "@tanstack/react-query";
import Cookies from "js-cookie";
import { LoginCredentials, RegisterCredentials, AuthResponse } from "../types";
import { apiClient } from "../utils/axiosConfig";

const login = async ({ username, password }: LoginCredentials): Promise<string> => {
  const response = await apiClient.post<AuthResponse>(
    "/loginservice/login",
    { Email: username, Password: password }
  );
  return response.data.token;
};

const register = async ({ username, password, email }: RegisterCredentials): Promise<{ success: boolean; userId: number; message: string }> => {
  const token = Cookies.get("token");
  if (!token) {
    throw new Error("Authentication required. Only administrators can create accounts.");
  }

  const response = await apiClient.post<{ success: boolean; userId: number; message: string }>(
    "/loginservice/register",
    { FullName: username, Email: email, Password: password }
  );
  return response.data;
};

const useLoginMutation = () => {
  return useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      Cookies.set("token", data, { expires: 1 });
    },
  });
};

const useRegisterMutation = () => {
  return useMutation({
    mutationFn: register,
  });
};

export { useLoginMutation, useRegisterMutation };
