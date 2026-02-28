import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

interface User {
    id: number;
    username: string;
    role: 'OWNER' | 'SHOP_REP';
}

interface AuthContextType {
    user: User | null;
    login: (user: User) => void;
    logout: () => void;
    isAuthenticated: boolean;
    isOwner: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const navigate = useNavigate();

    const login = (userData: User) => {
        setUser(userData);
        // Optional: Save to sessionStorage if we wanted persistence across reloads but not restarts
        // sessionStorage.setItem('user', JSON.stringify(userData));
    };

    const logout = () => {
        setUser(null);
        // sessionStorage.removeItem('user');
        navigate('/login');
    };

    const isAuthenticated = !!user;
    const isOwner = user?.role === 'OWNER';

    return (
        <AuthContext.Provider value={{ user, login, logout, isAuthenticated, isOwner }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
