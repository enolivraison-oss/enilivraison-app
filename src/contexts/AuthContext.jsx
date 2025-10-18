import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('eno_user');
    const savedUsers = localStorage.getItem('eno_users');
    
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    
    if (savedUsers) {
      setUsers(JSON.parse(savedUsers));
    } else {
      // Initialize with demo users if none exist
      const demoUsers = [
        { id: 'user-ceo', name: 'CEO Eno', email: 'ceo@eno.com', role: 'ceo', password: 'demo123', avatar: '' },
        { id: 'user-acc', name: 'Comptable', email: 'comptable@eno.com', role: 'accountant', password: 'demo123', avatar: '' },
        { id: 'user-sec', name: 'Secrétaire', email: 'secretaire@eno.com', role: 'secretary', password: 'demo123', avatar: '' },
        { id: 'user-part', name: 'Partenaire Test', email: 'partenaire@eno.com', role: 'partner', password: 'demo123', partnerId: 'PAT001', avatar: '' },
      ];
      setUsers(demoUsers);
      localStorage.setItem('eno_users', JSON.stringify(demoUsers));
    }
    
    setLoading(false);
  }, []);

  const login = (email, password) => {
    const foundUser = users.find(u => u.email === email && u.password === password);
    if (foundUser) {
      setUser(foundUser);
      localStorage.setItem('eno_user', JSON.stringify(foundUser));
      return foundUser;
    }
    return null;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('eno_user');
  };

  const updateUser = (userId, updates) => {
    let updatedUser = null;
    const updatedUsers = users.map(u => {
      if (u.id === userId) {
        updatedUser = { ...u, ...updates };
        return updatedUser;
      }
      return u;
    });
    setUsers(updatedUsers);
    localStorage.setItem('eno_users', JSON.stringify(updatedUsers));

    if (user && user.id === userId) {
      setUser(updatedUser);
      localStorage.setItem('eno_user', JSON.stringify(updatedUser));
    }
  };

  const addUser = (newUser) => {
    const userWithId = { ...newUser, id: `user-${Date.now()}` };
    const updatedUsers = [...users, userWithId];
    setUsers(updatedUsers);
    localStorage.setItem('eno_users', JSON.stringify(updatedUsers));
    return userWithId;
  };

  const value = {
    user,
    users,
    login,
    logout,
    updateUser,
    addUser,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};