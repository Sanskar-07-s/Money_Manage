export const getStorageMode = () => {
    return localStorage.getItem('storageMode') || 'hybrid';
};

export const setStorageMode = (mode) => {
    localStorage.setItem('storageMode', mode);
};

export const getLocalCategories = () => {
    const defaultCategories = [
        { id: '1', name: 'Food', type: 'expense' },
        { id: '2', name: 'Travel', type: 'expense' },
        { id: '3', name: 'College', type: 'expense' },
        { id: '4', name: 'Freelancing', type: 'income' },
        { id: '5', name: 'Investment', type: 'income' },
        { id: '6', name: 'Personal', type: 'expense' }
    ];
    
    const raw = localStorage.getItem('user_categories');
    if (!raw) return defaultCategories;

    try {
        const customCategories = JSON.parse(raw);
        const combined = [...customCategories];
        defaultCategories.forEach(def => {
            if (!combined.some(c => c.name.toLowerCase() === def.name.toLowerCase())) {
                combined.push(def);
            }
        });
        return combined;
    } catch (e) {
        return defaultCategories;
    }
};

export const saveLocalCategory = (category) => {
    const categories = getLocalCategories();
    if (categories.some(c => c.name.toLowerCase() === category.name.toLowerCase())) return;
    
    const updated = [...categories, { 
        ...category, 
        id: category.id || `cat_${Date.now()}` 
    }];
    localStorage.setItem('user_categories', JSON.stringify(updated));
    window.dispatchEvent(new Event('finance-update'));
};

export const getLocalBalances = () => {
    const raw = localStorage.getItem('localBalances');
    const categories = getLocalCategories();
    const categoryBalances = {};
    categories.forEach(c => {
        categoryBalances[c.name] = 0;
    });

    const defaultBalances = {
        total: 0,
        categories: categoryBalances,
        accounts: { UPI: 0, Bank: 0, Cash: 0 },
        lastUpdated: Date.now()
    };
    if (raw) {
        try {
            const parsed = JSON.parse(raw);
            return { 
                ...defaultBalances, 
                ...parsed,
                categories: { ...categoryBalances, ...parsed.categories }
            };
        } catch (e) {
            return defaultBalances;
        }
    }
    return defaultBalances;
};

export const saveLocalBalances = (balances) => {
    const nextBalances = { ...balances, lastUpdated: Date.now() };
    localStorage.setItem('localBalances', JSON.stringify(nextBalances));
};

export const getLocalTransactions = () => {
    const raw = localStorage.getItem('localTransactions');
    if (raw) return JSON.parse(raw);
    return [];
};

/**
 * ABSOLUTE SOURCE OF TRUTH RECALCULATION
 * Every action (add/edit/delete) MUST call this to ensure zero balance drift.
 */
export const recalculateLocalBalances = (transactions = null) => {
    const txs = transactions || getLocalTransactions();
    const categoriesDefault = getLocalCategories();
    const balances = {
        total: 0,
        categories: {},
        accounts: {
            UPI: 0,
            Cash: 0,
            Bank: 0
        }
    };

    categoriesDefault.forEach(c => {
        balances.categories[c.name] = { spent: 0, got: 0, net: 0 };
    });

    txs.forEach(tx => {
        const amount = Number(tx.amount) || 0;
        const category = tx.category || 'Personal';
        const account = tx.account || 'Cash';

        if (!balances.categories[category]) {
            balances.categories[category] = { spent: 0, got: 0, net: 0 };
        }

        if (tx.type === 'income') {
            balances.total += amount;
            if (balances.accounts[account] !== undefined) {
                balances.accounts[account] += amount;
            }
            balances.categories[category].got += amount;
            balances.categories[category].net += amount;
        } else {
            balances.total -= amount;
            if (balances.accounts[account] !== undefined) {
                balances.accounts[account] -= amount;
            }
            balances.categories[category].spent += amount;
            balances.categories[category].net -= amount;
        }
    });

    localStorage.setItem('localBalances', JSON.stringify({ ...balances, lastUpdated: Date.now() }));
    window.dispatchEvent(new Event('finance-update'));
    return balances;
};

export const addLocalTransaction = (transaction) => {
    const transactions = getLocalTransactions();
    const newTx = {
        ...transaction,
        id: transaction.id || `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        version: 1,
        editHistory: [{ field: 'creation', oldValue: null, newValue: 'new', timestamp: Date.now() }],
        createdAt: transaction.createdAt || new Date().toISOString()
    };
    
    // Prevent duplicates
    if (transactions.some(t => t.id === newTx.id)) return;

    transactions.unshift(newTx);
    localStorage.setItem('localTransactions', JSON.stringify(transactions));
    recalculateLocalBalances(transactions);
};

export const updateLocalTransaction = (id, updatedFields) => {
    const transactions = getLocalTransactions();
    const index = transactions.findIndex(t => t.id === id);
    if (index !== -1) {
        const oldTx = transactions[index];
        const newHistory = [...(oldTx.editHistory || [])];
        
        Object.keys(updatedFields).forEach(key => {
            if (oldTx[key] !== updatedFields[key]) {
                newHistory.push({
                    field: key,
                    oldValue: oldTx[key],
                    newValue: updatedFields[key],
                    timestamp: Date.now()
                });
            }
        });

        transactions[index] = { 
            ...oldTx, 
            ...updatedFields, 
            version: (oldTx.version || 1) + 1,
            editHistory: newHistory,
            updatedAt: new Date().toISOString()
        };
        localStorage.setItem('localTransactions', JSON.stringify(transactions));
        recalculateLocalBalances(transactions);
    }
};

export const deleteLocalTransaction = (id) => {
    const transactions = getLocalTransactions();
    const filtered = transactions.filter(t => t.id !== id);
    localStorage.setItem('localTransactions', JSON.stringify(filtered));
    recalculateLocalBalances(filtered);
};

export const replaceLocalBalances = (balances) => {
    localStorage.setItem('localBalances', JSON.stringify({ ...balances, lastUpdated: Date.now() }));
};

export const replaceLocalTransactions = (transactions) => {
    localStorage.setItem('localTransactions', JSON.stringify(transactions));
};

export const getBudgetGoals = () => {
    const raw = localStorage.getItem('budgetGoals');
    if (raw) return JSON.parse(raw);
    return [];
};

export const saveBudgetGoals = (goals) => {
    localStorage.setItem('budgetGoals', JSON.stringify(goals));
    window.dispatchEvent(new Event('finance-update'));
};

export const getLatestReport = () => {
    const raw = localStorage.getItem('latestFinancialReport');
    if (raw) return JSON.parse(raw);
    return null;
};

export const saveReport = (report) => {
    localStorage.setItem('latestFinancialReport', JSON.stringify(report));
    window.dispatchEvent(new Event('finance-update'));
};

// --- SECURITY & PRIVACY LAYER ---

export const getPrivacyMode = () => {
    return localStorage.getItem('privacyMode') === 'true';
};

export const setPrivacyMode = (enabled) => {
    localStorage.setItem('privacyMode', enabled);
    window.dispatchEvent(new Event('finance-update'));
};

export const getSecurityLock = () => {
    return localStorage.getItem('securityLock') === 'true';
};

export const setSecurityLock = (enabled) => {
    localStorage.setItem('securityLock', enabled);
    window.dispatchEvent(new Event('finance-update'));
};
