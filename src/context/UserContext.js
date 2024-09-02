import React, { createContext, useEffect, useState } from "react";
import { axiosClient } from "../api/axios";
export const UserContext = createContext({
    user: {},
    setUser: () => {},
    logged: false,
    setLogged: () => {},
    loginLoading: true,
    setLoginLoading: () =>{},
});
export const UserProvider = ({ children }) => {
    const [user, setUser] = useState({});
    const [logged, setLogged] = useState(false);
    const [loginLoading, setLoginLoading] = useState(true);
    
  useEffect(() => {
    const checkAuthentication = async () => {
        try {
            await axiosClient.get('/sanctum/csrf-cookie');
            const response = await axiosClient.get('/api/check-auth');
            if (response.data.authenticated) {
                setUser(response.data.user);
                setLogged(true);
            } else {
                setLogged(false);
            }
        } catch (error) {
            console.error('Error checking authentication:', error.response?.data || error.message);
            setLogged(false);
        } finally {
            setLoginLoading(false);
        }
      };
      checkAuthentication();
  }, [logged]);
    return (
      <UserContext.Provider value={{ user, setUser, logged, setLogged, loginLoading, setLoginLoading }}>
        {children}
      </UserContext.Provider>
    );
  };