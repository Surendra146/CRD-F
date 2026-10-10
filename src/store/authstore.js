import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { authApi } from '../services/auth';
import api from '../config/apiConfig';
import { normalizeRole } from '../utils/rbac';

const normalizeAuthUser = (user) =>
  user
    ? {
        ...user,
        role: normalizeRole(user.role),
        allowedModules: Array.isArray(user.allowedModules) ? user.allowedModules : (user.allowed_modules || []),
      }
    : null;

const getErrorMessage = (error, fallback) => {
  const status = error?.response?.status;
  if (status === 429) {
    const retryAfter = error?.response?.headers?.['retry-after'];
    return retryAfter
      ? `Too many login attempts. Please wait ${retryAfter} second(s) and try again.`
      : 'Too many login attempts. Please wait a few minutes and try again.';
  }

  return (
    error?.response?.data?.message ||
    error?.response?.data?.detail ||
    error?.data?.message ||
    error?.data?.detail ||
    error?.message ||
    fallback
  );
};

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (email, password) => {
        set({ isLoading: true });

        try {
          const response = await authApi.login(email, password);

          const token = response.token;
          const refreshToken = response.refreshToken;
          const user = response.user || response.data;

          if (!token || !user) {
            set({ isLoading: false });
            return {
              success: false,
              message: response.message || 'Invalid login response',
            };
          }

          set({
            user: normalizeAuthUser(user),
            token,
            refreshToken,
            isAuthenticated: true,
            isLoading: false,
          });

          api.defaults.headers.common.Authorization = `Bearer ${token}`;

          return {
            success: true,
            message: response.message || 'Login successful',
          };
        } catch (error) {
          set({ isLoading: false });

          return {
            success: false,
            message: getErrorMessage(error, 'Login failed'),
          };
        }
      },

      register: async (data) => {
        set({ isLoading: true });

        try {
          const response = await authApi.register(data);

          if (response.otpRequired) {
            set({ isLoading: false });

            return {
              success: true,
              otpRequired: true,
              registrationId: response.registrationId || '',
              devOtp: response.devOtp || '',
              message: response.message || 'OTP sent successfully',
            };
          }

          const token = response.token;
          const refreshToken = response.refreshToken;
          const user = response.user || response.data;

          if (!token || !user) {
            set({ isLoading: false });

            return {
              success: false,
              message: response.message || 'Invalid registration response',
            };
          }

          set({
            user: normalizeAuthUser(user),
            token,
            refreshToken,
            isAuthenticated: true,
            isLoading: false,
          });

          api.defaults.headers.common.Authorization = `Bearer ${token}`;

          return {
            success: true,
            otpRequired: false,
            message: response.message || 'Registration successful',
          };
        } catch (error) {
          set({ isLoading: false });

          return {
            success: false,
            message: getErrorMessage(error, 'Registration failed'),
          };
        }
      },

      verifyPhoneOtp: async (otp) => {
        set({ isLoading: true });

        try {
          const response = await authApi.verifyPhoneOtp(otp);

          set({
            user: normalizeAuthUser(response.user),
            isLoading: false,
          });

          return {
            success: true,
            message: response.message || 'OTP verified successfully',
          };
        } catch (error) {
          set({ isLoading: false });

          return {
            success: false,
            message: getErrorMessage(error, 'OTP verification failed'),
          };
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
        });

        delete api.defaults.headers.common.Authorization;
      },

      refreshUser: async () => {
        try {
          const response = await authApi.getMe();

          set({
            user: normalizeAuthUser(response.user),
          });
        } catch {
          get().logout();
        }
      },

      initAuth: () => {
        const token = get().token;

        if (token) {
          api.defaults.headers.common.Authorization = `Bearer ${token}`;
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        refreshToken: state.refreshToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
