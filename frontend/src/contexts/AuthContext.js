import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrgId, setSelectedOrgIdState] = useState(() => {
    return localStorage.getItem('selected_organization_id') || 'all';
  });

  const refreshOrganizations = async () => {
    try {
      const res = await api.get('/organizations');
      setOrganizations(res.data);
      return res.data;
    } catch (e) {
      console.error('Failed to load organizations', e);
      return [];
    }
  };

  const selectOrganization = (orgId) => {
    setSelectedOrgIdState(orgId);
    if (orgId) {
      localStorage.setItem('selected_organization_id', orgId);
    } else {
      localStorage.removeItem('selected_organization_id');
    }
    window.dispatchEvent(new CustomEvent('organization_changed', { detail: orgId }));
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (token && savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      // Verify token is still valid
      api.get('/auth/me')
        .then(response => {
          const freshUser = response.data;
          setUser(freshUser);
          localStorage.setItem('user', JSON.stringify(freshUser));
          if (freshUser.is_super_admin) {
            refreshOrganizations();
          } else {
            selectOrganization(freshUser.organization_id || 'default_sushimaster');
          }
        })
        .catch(() => {
          logout();
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    const { access_token, user } = response.data;
    localStorage.setItem('token', access_token);
    localStorage.setItem('user', JSON.stringify(user));
    setUser(user);
    if (user.is_super_admin) {
      refreshOrganizations();
    } else {
      selectOrganization(user.organization_id || 'default_sushimaster');
    }
    return user;
  };

  const register = async (email, password, full_name, invitation_code = null) => {
    const response = await api.post('/auth/register', { email, password, full_name, invitation_code });
    const { access_token, user } = response.data;
    localStorage.setItem('token', access_token);
    localStorage.setItem('user', JSON.stringify(user));
    setUser(user);
    if (user.is_super_admin) {
      refreshOrganizations();
    } else {
      selectOrganization(user.organization_id || 'default_sushimaster');
    }
    return user;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('selected_organization_id');
    setUser(null);
  };

  const isSuperAdmin = () => user?.is_super_admin || false;
  const isAdmin = () => user?.role === 'admin' || isSuperAdmin();

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      register,
      logout,
      isSuperAdmin,
      isAdmin,
      organizations,
      selectedOrgId,
      selectOrganization,
      refreshOrganizations
    }}>
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
