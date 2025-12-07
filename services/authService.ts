
import { User } from '../types';

// ==================================================================================
// 🔐 ADMIN CREDENTIALS
// ==================================================================================

export const verifyAdminCredentials = (username: string, password: string): User | null => {
    if (username === 'admin' && password === 'forever2025') {
        return {
            isLoggedIn: true,
            name: 'System Administrator',
            email: 'admin@forever.app',
            isPremium: true,
            isAdmin: true
        };
    }
    return null;
};
