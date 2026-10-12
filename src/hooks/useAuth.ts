'use client';
import { useSelector, useDispatch } from 'react-redux';
import { login, signup, logout, getCurrentUser, clearError } from '@/store/slices/authSlice';
import { useCallback } from 'react';
import type { RootState, AppDispatch } from '@/store/store';

const useAuth = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user, status, error, isInitialized } = useSelector((state: RootState) => state.auth);

  return {
    user, isAuthenticated: !!user,
    isLoading: status === 'loading', error, isInitialized,
    login: useCallback((c: { email: string; password: string }) => dispatch(login(c)), [dispatch]),
    signup: useCallback((d: { name: string; email: string; password: string }) => dispatch(signup(d)), [dispatch]),
    logout: useCallback(() => dispatch(logout()), [dispatch]),
    checkAuth: useCallback(() => dispatch(getCurrentUser()), [dispatch]),
    clearError: useCallback(() => dispatch(clearError()), [dispatch]),
  };
};

export default useAuth;
