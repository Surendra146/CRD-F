// frontend/src/store/authStore.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi } from '../services/auth';
import api from '../config/api';
import { normalizeRole } from '../utils/rbac';

const normalizeAuthUser = (user) =>
  user
    ? {
        ...user,
        role: normalizeRole(user.role),
        allowedModules: Array.isArray(user.allowedModules) ? user.allowedModules : [],
      }
    : null;

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      
      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const response = await authApi.login(email, password);
          const { token, user } = response.data;
          
          set({
            user: normalizeAuthUser(user),
            token,
            isAuthenticated: true,
            isLoading: false
          });
          
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          return { success: true };
        } catch (error) {
          set({ isLoading: false });
          return {
            success: false,
            message: error.response?.data?.message || 'Login failed'
          };
        }
      },
      
      register: async (data) => {
        set({ isLoading: true });
        try {
          const response = await authApi.register(data);
          const otpRequired = Boolean(response.data.otpRequired);

          if (otpRequired) {
            set({ isLoading: false });
            return {
              success: true,
              otpRequired: true,
              registrationId: response.data.registrationId || '',
              devOtp: response.data.devOtp || '',
              message: response.data.message || 'OTP sent successfully',
            };
          }

          const { token, user } = response.data;

          set({
            user: normalizeAuthUser(user),
            token,
            isAuthenticated: true,
            isLoading: false
          });

          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          return {
            success: true,
            otpRequired: false,
            message: response.data.message || 'Registration successful',
          };
        } catch (error) {
          set({ isLoading: false });
          return {
            success: false,
            message: error.response?.data?.message || 'Registration failed'
          };
        }
      },

      verifyPhoneOtp: async (otp) => {
        set({ isLoading: true });
        try {
          const response = await authApi.verifyPhoneOtp(otp);

          set({
            user: normalizeAuthUser(response.data.user),
            isLoading: false
          });

          return { success: true };
        } catch (error) {
          set({ isLoading: false });
          return {
            success: false,
            message: error.response?.data?.message || 'OTP verification failed'
          };
        }
      },
      
      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false
        });
        delete api.defaults.headers.common['Authorization'];
      },
      
      refreshUser: async () => {
        try {
          const response = await authApi.getMe();
          set({ user: normalizeAuthUser(response.data.user) });
        } catch {
          get().logout();
        }
      },
      
      initAuth: () => {
        const token = get().token;
        if (token) {
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);
