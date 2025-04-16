import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { AuthState, LoginCredentials, SignupCredentials } from '../types/auth.types';
import { apiService } from '../services/api';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  signup: (credentials: SignupCredentials) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('token'),
  refreshToken: localStorage.getItem('refreshToken'),
  isAuthenticated: !!localStorage.getItem('token'),
  loading: false,
  error: null,
};

type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: { user: any; token: string; refreshToken: string } }
  | { type: 'AUTH_FAILURE'; payload: string }
  | { type: 'LOGOUT' };

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'AUTH_START':
      return { ...state, loading: true, error: null };
    case 'AUTH_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        refreshToken: action.payload.refreshToken,
        isAuthenticated: true,
        loading: false,
        error: null,
      };
    case 'AUTH_FAILURE':
      return {
        ...state,
        user: null,
        token: null,
        refreshToken: null,
        isAuthenticated: false,
        loading: false,
        error: action.payload,
      };
    case 'LOGOUT':
      return {
        ...initialState,
        token: null,
        refreshToken: null,
        isAuthenticated: false,
      };
    default:
      return state;
  }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const login = useCallback(async (credentials: LoginCredentials) => {
    try {
      dispatch({ type: 'AUTH_START' });
      const { data } = await apiService.login(credentials.email, credentials.password);
      
      // Store tokens in localStorage
      localStorage.setItem('token', data.token);
      localStorage.setItem('refreshToken', data.refreshToken);
      
      // Bug 2: Not properly handling multiple sessions
      // We should store session IDs and manage them properly
      // Current implementation allows session hijacking across multiple devices
      // as we're not tracking or limiting active sessions
      const activeSession = {
        token: data.token,
        refreshToken: data.refreshToken,
        deviceId: Math.random().toString(36).substring(7), // This is not secure!
        lastActive: new Date().toISOString()
      };
      localStorage.setItem('currentSession', JSON.stringify(activeSession));
      
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: {
          user: data.user,
          token: data.token,
          refreshToken: data.refreshToken,
        },
      });
    } catch (error: any) {
      dispatch({ type: 'AUTH_FAILURE', payload: error.message });
      throw error;
    }
  }, []);

  const signup = useCallback(async (credentials: SignupCredentials) => {
    try {
      dispatch({ type: 'AUTH_START' });
      const { data } = await apiService.signup(
        credentials.name,
        credentials.email,
        credentials.password
      );
      
      // Store tokens and session info
      localStorage.setItem('token', data.token);
      localStorage.setItem('refreshToken', data.refreshToken);
      
      const activeSession = {
        token: data.token,
        refreshToken: data.refreshToken,
        deviceId: Math.random().toString(36).substring(7),
        lastActive: new Date().toISOString()
      };
      localStorage.setItem('currentSession', JSON.stringify(activeSession));
      
      dispatch({
        type: 'AUTH_SUCCESS',
        payload: {
          user: data.user,
          token: data.token,
          refreshToken: data.refreshToken,
        },
      });
    } catch (error: any) {
      dispatch({ type: 'AUTH_FAILURE', payload: error.message });
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      // Bug 2: Improper session invalidation
      // This only removes the tokens from the current browser
      // but doesn't properly invalidate the session on the server
      // or other active sessions. The tokens are still valid and can be used!
      await apiService.logout();
      
      // We're only clearing local storage, but the tokens are still valid on other devices
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('currentSession');
      
      dispatch({ type: 'LOGOUT' });
    } catch (error) {
      // Even if logout fails, we still clear local state
      // This creates a state where tokens might still be valid on the server
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('currentSession');
      dispatch({ type: 'LOGOUT' });
    }
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 