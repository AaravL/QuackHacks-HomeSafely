import React, { createContext, useState, useCallback } from 'react';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [messages, setMessages] = useState({});
  const [onlineUsers, setOnlineUsers] = useState(new Set());

  const login = useCallback((userData, token) => {
    setUser({ ...userData, token });
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', token);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setPosts([]);
    setMessages({});
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  }, []);

  const updateLocation = useCallback((location) => {
    setCurrentLocation(location);
  }, []);

  const addMessage = useCallback((chatId, message) => {
    setMessages((prev) => ({
      ...prev,
      [chatId]: [...(prev[chatId] || []), message],
    }));
  }, []);

  const setUserOnline = useCallback((userId, isOnline) => {
    setOnlineUsers((prev) => {
      const newSet = new Set(prev);
      if (isOnline) {
        newSet.add(userId);
      } else {
        newSet.delete(userId);
      }
      return newSet;
    });
  }, []);

  const value = {
    user,
    setUser,
    posts,
    setPosts,
    currentLocation,
    updateLocation,
    messages,
    addMessage,
    login,
    logout,
    onlineUsers,
    setUserOnline,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
