export const getStorageMode = () => {
    return localStorage.getItem('storageMode') || 'hybrid';
};

export const setStorageMode = (mode) => {
    localStorage.setItem('storageMode', mode);
};

export const getLocalBalances = () => {
    const raw = localStorage.getItem('localBalances');
    const defaultBalances = {
        total: 0,
        categories: { Food: 0, Travel: 0, College: 0, Freelancing: 0, Investment: 0, Personal: 0 },
        accounts: { UPI: 0, Bank: 0, Cash: 0 },
        lastUpdated: Date.now()
    };
    if (raw) {
        try {
            return { ...defaultBalances, ...JSON.parse(raw) };
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

export const updateLocalBalance = (transaction) => {
    const balances = getLocalBalances();
    const amount = Number(transaction.amount) || 0;
    const isIncome = transaction.type === 'income';
    
    console.log(`[BalanceUpdate] Processing ${transaction.type}: ₹${amount}`);
    console.log(`[BalanceUpdate] Pre-update:`, balances);

    if (isIncome) {
        balances.total += amount;
        if (transaction.category) balances.categories[transaction.category] = (balances.categories[transaction.category] || 0) + amount;
        if (transaction.account) balances.accounts[transaction.account] = (balances.accounts[transaction.account] || 0) + amount;
    } else {
        balances.total -= amount;
        if (transaction.category) balances.categories[transaction.category] = (balances.categories[transaction.category] || 0) - amount;
        if (transaction.account) balances.accounts[transaction.account] = (balances.accounts[transaction.account] || 0) - amount;
    }

    // Validation: Ensure no NaN crept in
    balances.total = Number(balances.total) || 0;
    Object.keys(balances.categories).forEach(k => balances.categories[k] = Number(balances.categories[k]) || 0);
    Object.keys(balances.accounts).forEach(k => balances.accounts[k] = Number(balances.accounts[k]) || 0);

    console.log(`[BalanceUpdate] Post-update:`, balances);
    saveLocalBalances(balances);
    return balances;
};

export const getLocalTransactions = () => {
    const raw = localStorage.getItem('localTransactions');
    if (raw) return JSON.parse(raw);
    return [];
};

export const addLocalTransaction = (tx) => {
    const txs = getLocalTransactions();
    // Prevent duplicate entries if ID exists (security check)
    if (tx.id && txs.some(existing => existing.id === tx.id)) {
        console.warn(`[Storage] Duplicate transaction ID detected: ${tx.id}`);
        return;
    }
    txs.unshift({ ...tx, createdAt: tx.createdAt || new Date().toISOString() });
    localStorage.setItem('localTransactions', JSON.stringify(txs));
    updateLocalBalance(tx);
};

export const replaceLocalBalances = (balances) => {
    localStorage.setItem('localBalances', JSON.stringify({ ...balances, lastUpdated: Date.now() }));
};

export const replaceLocalTransactions = (transactions) => {
    localStorage.setItem('localTransactions', JSON.stringify(transactions));
};
