import axios from 'axios';
import { auth } from '../utils/firebase';

const API_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? '' : 'http://localhost:5005');

const getHeaders = async () => {
    if (!auth?.currentUser) {
        throw new Error('User is not authenticated.');
    }
    const token = await auth.currentUser.getIdToken();
    return {
        headers: {
            Authorization: `Bearer ${token}`
        }
    };
};

export const processAI = async (message, localBalances) => {
    const config = await getHeaders();
    const payload = {
        message,
        localBalances
    };
    const res = await axios.post(`${API_URL}/api/ai/process`, payload, config);
    return res.data;
};

export const addTransaction = async (transaction) => {
    const config = await getHeaders();
    const res = await axios.post(`${API_URL}/api/transaction/add`, transaction, config);
    return res.data;
};

export const fetchTransactions = async () => {
    try {
        const config = await getHeaders();
        const res = await axios.get(`${API_URL}/api/transaction/all`, config);
        return res.data.transactions;
    } catch {
        return [];
    }
};

export const fetchInsights = async () => {
    try {
        const config = await getHeaders();
        const res = await axios.get(`${API_URL}/api/ai/insights`, config);
        return res.data.insight;
    } catch {
        return 'Not available.';
    }
};

export const fetchSummary = async () => {
    try {
        const config = await getHeaders();
        const res = await axios.get(`${API_URL}/api/transaction/summary`, config);
        return res.data.balances;
    } catch {
        return null;
    }
};

export const fetchCloudStatus = async () => {
    try {
        const config = await getHeaders();
        const res = await axios.get(`${API_URL}/api/transaction/status`, config);
        return res.data;
    } catch {
        return {
            cloudAvailable: false,
            transactionCount: 0,
        };
    }
};

export const syncCloudData = async (balances, transactions) => {
    const config = await getHeaders();
    const res = await axios.post(`${API_URL}/api/transaction/sync`, {
        balances,
        transactions,
    }, config);
    return res.data;
};

export const fetchChatHistory = async () => {
    try {
        const config = await getHeaders();
        const res = await axios.get(`${API_URL}/api/ai/history`, config);
        return res.data.messages;
    } catch {
        return [];
    }
};

export const deleteChatHistory = async () => {
    const config = await getHeaders();
    const res = await axios.delete(`${API_URL}/api/user/delete-chat`, config);
    return res.data;
};

export const fetchProfile = async () => {
    try {
        const config = await getHeaders();
        const res = await axios.get(`${API_URL}/api/user/profile`, config);
        return res.data;
    } catch (error) {
        console.error('Fetch profile failed', error);
        return null;
    }
};

export const updateProfile = async (profileData) => {
    const config = await getHeaders();
    const res = await axios.put(`${API_URL}/api/user/profile/update`, profileData, config);
    return res.data;
};

export const deleteUserAllData = async () => {
    const config = await getHeaders();
    const res = await axios.delete(`${API_URL}/api/user/delete-all`, config);
    return res.data;
};
