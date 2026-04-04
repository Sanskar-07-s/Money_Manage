const DEFAULT_BALANCES = {
  total: 0,
  categories: {
    Food: 0,
    Travel: 0,
    College: 0,
    Freelancing: 0,
    Investment: 0,
    Personal: 0,
  },
  accounts: {
    UPI: 0,
    Bank: 0,
    Cash: 0,
  },
  lastUpdated: Date.now()
};

const cloneDefaultBalances = () => JSON.parse(JSON.stringify(DEFAULT_BALANCES));

const normalizeBalances = (balances = {}) => {
  const normalized = cloneDefaultBalances();

  normalized.total = Number(balances.total) || 0;
  normalized.categories = {
    ...normalized.categories,
    ...(balances.categories || {}),
  };
  normalized.accounts = {
    ...normalized.accounts,
    ...(balances.accounts || {}),
  };
  normalized.lastUpdated = balances.lastUpdated || Date.now();

  return normalized;
};

const applyTransactionToBalances = (balances, transaction = {}) => {
  const nextBalances = normalizeBalances(balances);
  const amount = Number(transaction.amount) || 0;
  const isIncome = transaction.type === 'income';
  const category = transaction.category || 'Personal';
  const account = transaction.account || 'Cash';

  console.log(`[Backend-Balance] Processing ${transaction.type}: ₹${amount}`);

  if (isIncome) {
    nextBalances.total += amount;
    if (category) nextBalances.categories[category] = (Number(nextBalances.categories[category]) || 0) + amount;
    if (account) nextBalances.accounts[account] = (Number(nextBalances.accounts[account]) || 0) + amount;
  } else {
    nextBalances.total -= amount;
    if (category) nextBalances.categories[category] = (Number(nextBalances.categories[category]) || 0) - amount;
    if (account) nextBalances.accounts[account] = (Number(nextBalances.accounts[account]) || 0) - amount;
  }

  // Ensure lastUpdated is updated to current server time
  nextBalances.lastUpdated = Date.now();

  // Final validation
  nextBalances.total = Number(nextBalances.total) || 0;
  Object.keys(nextBalances.categories).forEach(k => nextBalances.categories[k] = Number(nextBalances.categories[k]) || 0);
  Object.keys(nextBalances.accounts).forEach(k => nextBalances.accounts[k] = Number(nextBalances.accounts[k]) || 0);

  return nextBalances;
};

module.exports = {
  DEFAULT_BALANCES,
  cloneDefaultBalances,
  normalizeBalances,
  applyTransactionToBalances,
};
