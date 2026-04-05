const { OpenAI } = require('openai');
require('dotenv').config();

const apiKey = process.env.OPENAI_API_KEY;
const isOpenRouter = apiKey && apiKey.startsWith('sk-or-');
const openai = apiKey
  ? new OpenAI({
      apiKey,
      baseURL: isOpenRouter ? 'https://openrouter.ai/api/v1' : undefined,
    })
  : null;

if (!apiKey) {
  console.warn('[AI-Service] Warning: OPENAI_API_KEY is not defined. AI features will use heuristic fallbacks.');
} else {
  console.log(`[AI-Service] Initialized with ${isOpenRouter ? 'OpenRouter' : 'OpenAI'} configuration.`);
}

const categoryAliases = {
  food: 'Food',
  snacks: 'Food',
  snack: 'Food',
  bhel: 'Food',
  pani: 'Food',
  dosa: 'Food',
  chai: 'Food',
  coffee: 'Food',
  lunch: 'Food',
  dinner: 'Food',
  breakfast: 'Food',
  grocery: 'Food',
  groceries: 'Food',
  travel: 'Travel',
  cab: 'Travel',
  taxi: 'Travel',
  uber: 'Travel',
  ola: 'Travel',
  bus: 'Travel',
  train: 'Travel',
  fuel: 'Travel',
  petrol: 'Travel',
  diesel: 'Travel',
  college: 'College',
  tuition: 'College',
  exam: 'College',
  books: 'College',
  fees: 'College',
  freelance: 'Freelancing',
  freelancing: 'Freelancing',
  client: 'Freelancing',
  salary: 'Freelancing',
  stipend: 'Freelancing',
  investment: 'Investment',
  invest: 'Investment',
  savings: 'Investment',
  saving: 'Investment',
  sip: 'Investment',
  mutual: 'Investment',
  stock: 'Investment',
  personal: 'Personal',
  shopping: 'Personal',
  recharge: 'Personal',
  bill: 'Personal',
  medicine: 'Personal',
};

const accountAliases = {
  upi: 'UPI',
  bank: 'Bank',
  cash: 'Cash',
};

const supportedIntents = ['transaction', 'summary', 'recent_transactions', 'insights', 'balances', 'help', 'chat'];

const buildOpenAIModel = () => (isOpenRouter ? 'openai/gpt-4o-mini' : 'gpt-4o-mini');

const cleanJsonString = (content = '') =>
  content.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();

const incomePatterns = [
  /received/,
  /salary/,
  /earned/,
  /income/,
  /got/,
  /credited/,
  /\bgave\b/,
  /\bdeposit(?:ed)?\b/,
  /\badded?\b/,
  /\bplus\b/,
  /\btop\s?up\b/,
  /\brecharge(?:d)?\b/,
  /\brefund(?:ed)?\b/,
  /\bborrowed\b/,
];

const expensePatterns = [
  /spent/,
  /paid/,
  /bought/,
  /purchase/,
  /debited/,
  /bill/,
  /fee/,
  /rent/,
  /sent/,
];

const transferPatterns = [
  /\bto\s+bank\b/,
  /\bto\s+upi\b/,
  /\bto\s+cash\b/,
  /\bfrom\s+bank\b/,
  /\bfrom\s+upi\b/,
  /\bfrom\s+cash\b/,
  /\btransfer(?:red)?\b/,
  /\bmove(?:d)?\b/,
  /\bshift(?:ed)?\b/,
];

const sumAmountsFromMessage = (message) => {
  const matches = message.match(/\d+(?:\.\d{1,2})?/g) || [];
  return matches.reduce((sum, value) => sum + Number(value), 0);
};

const inferTypeFromMessage = (message) => {
  const normalized = message.toLowerCase();
  const hasIncome = incomePatterns.some((pattern) => pattern.test(normalized));
  const hasExpense = expensePatterns.some((pattern) => pattern.test(normalized));

  if (hasIncome && !hasExpense) {
    return 'income';
  }

  if (hasExpense && !hasIncome) {
    return 'expense';
  }

  if (/\bto\s+(bank|upi|cash)\b/.test(normalized) && /\b(add|added|plus|put|deposit|deposited)\b/.test(normalized)) {
    return 'income';
  }

  return 'expense';
};

const inferAccountFromMessage = (message) => {
  const normalized = message.toLowerCase();

  if (/\b(savings|saving|fd|deposit)\b/.test(normalized)) {
    return 'Bank';
  }

  if (/\b(bank account|to bank|in bank|bank)\b/.test(normalized)) {
    return 'Bank';
  }

  if (/\b(upi|gpay|phonepe|paytm)\b/.test(normalized)) {
    return 'UPI';
  }

  if (/\b(cash|wallet|pocket)\b/.test(normalized)) {
    return 'Cash';
  }

  return 'Cash';
};

const inferCategoryFromMessage = (message, type) => {
  const normalized = message.toLowerCase();
  const explicitCategory =
    Object.entries(categoryAliases).find(([alias]) => normalized.includes(alias))?.[1] || null;

  if (explicitCategory) {
    return explicitCategory;
  }

  if (type === 'income') {
    if (/\b(salary|paycheck|wage)\b/.test(normalized)) {
      return 'Freelancing';
    }

    if (/\b(refund|return)\b/.test(normalized)) {
      return 'Personal';
    }

    if (/\b(dad|mom|mother|father|family|friend)\b/.test(normalized)) {
      return 'Personal';
    }
  }

  return 'Personal';
};

const inferNoteFromMessage = (message = '', category = 'Personal') => {
  const normalized = message.toLowerCase().trim();
  const onMatch = normalized.match(/\b(?:on|for|towards)\s+([a-z][a-z\s]{1,40})/i);

  if (onMatch?.[1]) {
    return onMatch[1].replace(/\b(?:today|yesterday|tomorrow)\b/gi, '').trim();
  }

  const cleaned = normalized
    .replace(/\b(?:spent|paid|bought|received|earned|income|credited|debited|add|added|deposit|deposited|show|check|balance|for|to|from|rs|inr|rupees?|rupee)\b/gi, ' ')
    .replace(/\d+(?:\.\d{1,2})?/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (cleaned) {
    return cleaned.slice(0, 120);
  }

  return `${category} entry`;
};

const inferFocus = (message = '') => {
  const normalized = message.toLowerCase();
  const matchedCategory = Object.entries(categoryAliases).find(([alias]) => normalized.includes(alias))?.[1] || null;
  const matchedAccount = Object.entries(accountAliases).find(([alias]) => normalized.includes(alias))?.[1] || inferAccountFromMessage(message);

  if (/balance|how much|left|remaining|available/.test(normalized)) {
    if (matchedCategory) {
      return { type: 'category', value: matchedCategory };
    }

    if (matchedAccount && /\b(bank|upi|cash|wallet|account|savings)\b/.test(normalized)) {
      return { type: 'account', value: matchedAccount };
    }

    return { type: 'total', value: 'total' };
  }

  return null;
};

const normalizeTransaction = (transaction, message) => {
  const inferredType = inferTypeFromMessage(message);
  const inferredAmount = sumAmountsFromMessage(message);
  const amount = Number(transaction?.amount) || inferredAmount || 0;
  const type = transaction?.type === 'income' || transaction?.type === 'expense'
    ? transaction.type
    : inferredType;
  const finalType = inferredType !== type && inferredAmount > 0 ? inferredType : type;

  return {
    type: finalType,
    amount,
    category: transaction?.category || inferCategoryFromMessage(message, finalType),
    account: transaction?.account || inferAccountFromMessage(message),
    note: transaction?.note || inferNoteFromMessage(message, transaction?.category || inferCategoryFromMessage(message, finalType)),
  };
};

const heuristicTransactionParser = (message) => {
  const normalized = message.toLowerCase();
  const account =
    Object.entries(accountAliases).find(([alias]) => normalized.includes(alias))?.[1] || inferAccountFromMessage(message);

  return normalizeTransaction(
    {
      type: inferTypeFromMessage(message),
      amount: sumAmountsFromMessage(message),
      category: inferCategoryFromMessage(message, inferTypeFromMessage(message)),
      account,
      note: message.trim().slice(0, 120) || 'Manual entry',
    },
    message
  );
};

const looksLikeTransaction = (message = '') => {
  const normalized = message.toLowerCase();
  return /\d/.test(normalized) && (
    /(spent|paid|bought|received|earned|income|credit|debited|rs|inr|cash|upi|bank)/.test(normalized) ||
    incomePatterns.some((pattern) => pattern.test(normalized)) ||
    expensePatterns.some((pattern) => pattern.test(normalized)) ||
    transferPatterns.some((pattern) => pattern.test(normalized))
  );
};

const heuristicIntentParser = (message = '') => {
  const normalized = message.toLowerCase();

  if (looksLikeTransaction(normalized)) {
    return { intent: 'transaction', transaction: heuristicTransactionParser(message) };
  }

  if (/recent|history|last|latest transaction/.test(normalized)) {
    return { intent: 'recent_transactions' };
  }

  if (/insight|advice|suggest|analy/.test(normalized)) {
    return { intent: 'insights' };
  }

  if (/balance|wallet|account|cash|upi|bank/.test(normalized)) {
    return { intent: 'balances', focus: inferFocus(message) };
  }

  if (/summary|overview|report/.test(normalized)) {
    return { intent: 'summary' };
  }

  if (/help|what can you do|permission|access/.test(normalized)) {
    return { intent: 'help' };
  }

  return { intent: 'chat' };
};

const parseTransactionInput = async (message) => {
  if (!message || !message.trim()) {
    throw new Error('Message is required.');
  }

  if (!openai) {
    const fallbackIntent = heuristicIntentParser(message);
    if (fallbackIntent.intent === 'transaction') {
      return fallbackIntent;
    }

    return fallbackIntent;
  }

  try {
    const response = await openai.chat.completions.create({
      model: buildOpenAIModel(),
      temperature: 0,
      messages: [
        {
          role: 'system',
          content:
            'Classify the user request for a finance web app. Return JSON only. Allowed intents are: transaction, summary, recent_transactions, insights, balances, help, chat. If intent is transaction, also include type, amount, category, account, note. If intent is balances and the user asks about a specific category or account, include focusType ("category" or "account") and focusValue. Valid categories: Food, Travel, College, Freelancing, Investment, Personal. Valid accounts: UPI, Bank, Cash.',
        },
        {
          role: 'user',
          content: message,
        },
      ],
      response_format: isOpenRouter ? undefined : { type: 'json_object' },
    });

    const rawContent = response.choices?.[0]?.message?.content || '';
    const parsed = JSON.parse(cleanJsonString(rawContent));

    if (parsed.intent === 'transaction') {
      return {
        intent: 'transaction',
        transaction: normalizeTransaction({
          type: parsed.type === 'income' ? 'income' : 'expense',
          amount: Number(parsed.amount) || 0,
          category: parsed.category || '',
          account: parsed.account || '',
          note: parsed.note || '',
        }, message),
      };
    }

    const intent = supportedIntents.includes(parsed.intent) ? parsed.intent : 'chat';
    const focus = intent === 'balances'
      ? {
          type: parsed.focusType === 'category' || parsed.focusType === 'account' || parsed.focusType === 'total'
            ? parsed.focusType
            : inferFocus(message)?.type,
          value: parsed.focusValue || inferFocus(message)?.value,
        }
      : undefined;

    return {
      intent,
      ...(focus?.type ? { focus } : {}),
    };
  } catch (error) {
    console.error('OpenAI Parsing Error:', error);

    return heuristicIntentParser(message);
  }
};

const generateResponse = async (parsedData, updatedBalances) => {
  const fallback = [
    `${parsedData.type === 'income' ? 'Added' : 'Logged'} Rs ${parsedData.amount} ${parsedData.type} in ${parsedData.category}.`,
    `Balance: Rs ${updatedBalances.total}`,
    parsedData.type === 'expense'
      ? `Tip: Watch your ${parsedData.category.toLowerCase()} spending this week.`
      : 'Tip: Keep allocating part of new income to savings.',
  ].join('\n');

  if (!openai) {
    return fallback;
  }

  try {
    const response = await openai.chat.completions.create({
      model: buildOpenAIModel(),
      temperature: 0.4,
      max_tokens: 150,
      messages: [
        {
          role: 'system',
          content:
            'You are a helpful finance assistant. Respond in exactly 3 short lines. Line 1 confirms the transaction. Line 2 shows the latest balance. Line 3 gives one practical tip. Use plain ASCII text like "Rs 200".',
        },
        {
          role: 'user',
          content: `Transaction: ${JSON.stringify(parsedData)}\nBalances: ${JSON.stringify(updatedBalances)}`,
        },
      ],
    });

    return response.choices?.[0]?.message?.content?.trim() || fallback;
  } catch (error) {
    console.error('OpenAI Reply Error:', error);
    return fallback;
  }
};

const generateInsights = async (balances, transactions) => {
  const fallback = `Current balance is Rs ${Number(balances?.total) || 0}. You have ${transactions.length} tracked transactions. Biggest recent focus looks like ${Object.entries(balances?.categories || {}).sort((a, b) => Number(b[1]) - Number(a[1]))[0]?.[0] || 'Personal'}, so review that category first.`;

  if (!openai) {
    return fallback;
  }

  try {
    const response = await openai.chat.completions.create({
      model: buildOpenAIModel(),
      temperature: 0.6,
      messages: [
        {
          role: 'system',
          content: 'Summarize the user financial situation in one short paragraph and include one practical next step.',
        },
        {
          role: 'user',
          content: `Balances: ${JSON.stringify(balances)}\nRecent transactions: ${JSON.stringify(transactions.slice(0, 10))}`,
        },
      ],
    });

    return response.choices?.[0]?.message?.content?.trim() || fallback;
  } catch (error) {
    console.error('OpenAI Insight Error:', error);
    return fallback;
  }
};

const buildBalanceReply = (balances, focus) => {
  const normalizedBalances = balances || {};

  if (focus?.type === 'category' && focus.value) {
    const value = Number(normalizedBalances?.categories?.[focus.value]) || 0;
    return `Balance for ${focus.value}: Rs ${value}.`;
  }

  if (focus?.type === 'account' && focus.value) {
    const value = Number(normalizedBalances?.accounts?.[focus.value]) || 0;
    return `${focus.value} account balance: Rs ${value}.`;
  }

  return `Total balance: Rs ${Number(normalizedBalances?.total) || 0}. Accounts: ${Object.entries(normalizedBalances?.accounts || {}).map(([name, value]) => `${name} Rs ${value}`).join(', ') || 'No account data yet.'}`;
};

const generateContextReply = async ({ message, intent, balances, transactions, cloudEnabled, focus }) => {
  const recentTransactions = transactions.slice(0, 5);

  const fallbackReplies = {
    summary: `Summary: current balance is Rs ${Number(balances?.total) || 0}. You have ${transactions.length} saved transactions. Highest expense category is ${Object.entries(balances?.categories || {}).sort((a, b) => Number(b[1]) - Number(a[1]))[0]?.[0] || 'Personal'}.`,
    recent_transactions: recentTransactions.length
      ? `Recent transactions:\n${recentTransactions.map((tx) => `- ${tx.type} Rs ${tx.amount} in ${tx.category} via ${tx.account}`).join('\n')}`
      : 'No recent transactions were found yet.',
    balances: buildBalanceReply(balances, focus),
    insights: `Insight: your current balance is Rs ${Number(balances?.total) || 0}. Focus on the category with the highest spend and keep cloud sync ${cloudEnabled ? 'enabled' : 'disabled'} for better history analysis.`,
    help: 'I can add income and expenses, read your balance, show recent transactions, give spending insights, and answer finance questions using your website data.',
    chat: 'I can help with transactions, balances, summaries, recent history, and finance guidance.',
  };

  if (!openai) {
    return fallbackReplies[intent] || fallbackReplies.chat;
  }

  try {
    const response = await openai.chat.completions.create({
      model: buildOpenAIModel(),
      temperature: 0.4,
      messages: [
        {
          role: 'system',
          content:
            'You are an advanced finance assistant embedded in a website. You are allowed to read the user balance summary, recent transaction history, and synced cloud status that the backend provides. Be concise, helpful, and action-oriented. If cloudEnabled is false, say cloud sync is unavailable.',
        },
        {
          role: 'user',
          content: JSON.stringify({
            intent,
            message,
            cloudEnabled,
            focus,
            balances,
            recentTransactions,
            transactionCount: transactions.length,
          }),
        },
      ],
    });

    return response.choices?.[0]?.message?.content?.trim() || fallbackReplies[intent] || fallbackReplies.chat;
  } catch (error) {
    console.error('OpenAI Context Reply Error:', error);
    return fallbackReplies[intent] || fallbackReplies.chat;
  }
};

module.exports = {
  parseTransactionInput,
  generateResponse,
  generateInsights,
  generateContextReply,
};
