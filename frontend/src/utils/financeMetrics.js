const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const buildTrendData = (transactions = []) => {
  const buckets = new Map();
  const today = new Date();

  // Initialize buckets for the last 7 days
  for (let index = 6; index >= 0; index -= 1) {
    const date = new Date(today);
    date.setDate(today.getDate() - index);
    const key = date.toISOString().slice(0, 10);
    buckets.set(key, {
      name: DAY_LABELS[date.getDay()],
      spend: 0,
      income: 0,
    });
  }

  transactions.forEach((transaction) => {
    // Robust date parsing
    let rawDate;
    if (transaction.createdAt?.seconds) {
      rawDate = new Date(transaction.createdAt.seconds * 1000);
    } else if (transaction.createdAt) {
      rawDate = new Date(transaction.createdAt);
    } else {
      rawDate = new Date();
    }

    // Safety check for invalid dates
    if (isNaN(rawDate.getTime())) {
      console.warn('Skipping transaction with invalid date:', transaction);
      return;
    }

    const key = rawDate.toISOString().slice(0, 10);

    // Only include in trend data if it's within the 7-day bucket
    if (!buckets.has(key)) {
      return;
    }

    const bucket = buckets.get(key);
    const amount = Number(transaction.amount) || 0;

    if (transaction.type === 'income') {
      bucket.income += amount;
    } else {
      bucket.spend += amount;
    }
  });

  return Array.from(buckets.values());
};

export const getTopCategory = (categories = {}) =>
  Object.entries(categories).sort(([, a], [, b]) => Number(b) - Number(a))[0] || ['Personal', 0];
