import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { getStorageMode, getLocalBalances, getLocalTransactions, replaceLocalBalances, replaceLocalTransactions } from '../utils/storage';
import { syncCloudData } from '../services/api';

export const useAutoSync = () => {
    const { user } = useAuth();
    const syncing = useRef(false);

    const performSync = async () => {
        if (!user || syncing.current) return;
        const mode = getStorageMode();
        if (mode !== 'hybrid') return;

        syncing.current = true;
        console.log('[AutoSync] Initiating reconciliation...');
        
        try {
            const localBalances = getLocalBalances();
            const localTransactions = getLocalTransactions();

            const result = await syncCloudData(localBalances, localTransactions);
            
            if (result.source === 'cloud_win') {
                console.log('[AutoSync] Cloud data is newer. Updating local storage.');
                replaceLocalBalances(result.balances);
                if (result.transactions) {
                    replaceLocalTransactions(result.transactions);
                }
                // Notify UI
                window.dispatchEvent(new CustomEvent('money-manage:finance-update', { 
                    detail: { source: 'sync', updatedBalances: result.balances } 
                }));
            } else {
                console.log('[AutoSync] Local state synced to cloud.');
            }
        } catch (err) {
            console.warn('[AutoSync] Sync failed - likely offline.', err);
        } finally {
            syncing.current = false;
        }
    };

    useEffect(() => {
        // Sync on mount if user logged in
        if (user) performSync();

        // Auto sync when coming back online
        const handleOnline = () => {
            console.log('[AutoSync] Browser back online. Triggering sync.');
            performSync();
        };

        window.addEventListener('online', handleOnline);
        return () => window.removeEventListener('online', handleOnline);
    }, [user]);

    return { performSync };
};
