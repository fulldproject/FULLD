import { useAuth } from "../features/auth/AuthContext";
import { UserRole } from "../types";

/**
 * Lightweight hook to check if the current user has the ADMIN role.
 * Safe to use while user is loading (returns false).
 * If no user is authenticated, returns false.
 */
export const useIsAdmin = (): boolean => {
    const { user } = useAuth();
    return user?.role === UserRole.ADMIN;
};
