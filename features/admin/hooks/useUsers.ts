import { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { UserProfile, UserRole } from '../../../types';

export const useUsers = () => {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchUsers = async () => {
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(100);

                if (error) throw error;

                // Map to UserProfile type if needed, assume Supabase matches mostly
                setUsers(data as any[] || []);
            } catch (e: any) {
                console.error('Error fetching users:', e);
                setError(e.message);
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, []);

    return { users, loading, error };
};
