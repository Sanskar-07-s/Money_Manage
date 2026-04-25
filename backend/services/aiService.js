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

const inferCategoryFromMessage = (message, type, customCategories = []) => {
  const normalized = message.toLowerCase();
  
  // Match custom categories first
  if (customCategories.length > 0) {
    const matchedCustom = customCategories.find(c => normalized.includes(c.name.toLowerCase()));
    if (matchedCustom) return matchedCustom.name;
  }

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

const normalizeTransaction = (transaction, message, customCategories = []) => {
  const inferredType = inferTypeFromMessage(message);
  const inferredAmount = sumAmountsFromMessage(message);
  const amount = Number(transaction?.amount) || inferredAmount || 0;
  const type = transaction?.type === 'income' || transaction?.type === 'expense'
    ? transaction.type
    : inferredType;
  const finalType = inferredType !== type && inferredAmount > 0 ? inferredType : type;

  const defaultCategory = inferCategoryFromMessage(message, finalType, customCategories);

  return {
    type: finalType,
    amount,
    category: transaction?.category || defaultCategory,
    account: transaction?.account || inferAccountFromMessage(message),
    note: transaction?.note || inferNoteFromMessage(message, transaction?.category || defaultCategory),
  };
};

const heuristicTransactionParser = (message, customCategories = []) => {
  const normalized = message.toLowerCase();
  const type = inferTypeFromMessage(message);
  const category = inferCategoryFromMessage(message, type, customCategories);
  const account =
    Object.entries(accountAliases).find(([alias]) => normalized.includes(alias))?.[1] || inferAccountFromMessage(message);

  return normalizeTransaction(
    {
      type,
      amount: sumAmountsFromMessage(message),
      category,
      account,
      note: message.trim().slice(0, 120) || 'Manual entry',
    },
    message,
    customCategories
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

const heuristicIntentParser = (message = '', customCategories = []) => {
  const normalized = message.toLowerCase();

  if (looksLikeTransaction(normalized)) {
    return { intent: 'transaction', transaction: heuristicTransactionParser(message, customCategories) };
  }
// ... (rest of the code remains the same but within this context)
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

const parseTransactionInput = async (message, customCategories = []) => {
  if (!message || !message.trim()) {
    throw new Error('Message is required.');
  }

  const categoryNames = customCategories.length > 0 
    ? customCategories.map(c => c.name).join(', ')
    : 'Food, Travel, College, Freelancing, Investment, Personal';

  if (!openai) {
    const fallbackIntent = heuristicIntentParser(message, customCategories);
    return {
      intent: "FINANCIAL_ACTION",
      message: "Processing request via heuristic engine...",
      actions: fallbackIntent.intent === 'transaction' ? [{
        type: "ADD_TRANSACTION",
        data: fallbackIntent.transaction
      }] : [],
      confidence: 60,
      requiresApproval: true
    };
  }

  try {
    const response = await openai.chat.completions.create({
      model: buildOpenAIModel(),
      temperature: 0,
      messages: [
        {
          role: 'system',
          content:
            `You are a Financial Planning Assistant. Analyze user requests and plan actions. 
            Return JSON only in this format: 
            {
              "intent": "FINANCIAL_ACTION",
              "message": "Assistant message to user explaining the plan.",
              "actions": [
                {
                  "action": "ADD_TRANSACTION",
                  "type": "expense",
                  "data": { "amount": 50, "category": "Food", "account": "UPI", "note": "bhel" },
                  "confidence": 0.95
                }
              ],
              "confidence": 0.95,
              "requiresApproval": true
            }
            Supported Actions:
            - ADD_TRANSACTION: { "amount": number, "type": "income"|"expense", "category": string, "account": "UPI"|"Bank"|"Cash", "note": string }
            - EDIT_TRANSACTION: { "id": string, "updates": { "amount"?: number, "category"?: string, ... } }
            - DELETE_TRANSACTION: { "id": string }

            Available categories: ${categoryNames}. Accounts: UPI, Bank, Cash.
            
            Multi-action Support:
            If the user gives multiple commands (e.g., "Add salary 50000 and spend 2000 on food"), split them into multiple objects in the "actions" array.
            
            Rules:
            1. ALWAYS set "requiresApproval" to true for any transaction modification.
            2. For ADD_TRANSACTION, if category is unknown, suggest the best match from available categories or suggest a new one in the "message".
            3. "confidence" should be between 0.0 and 1.0.
            4. If the user mentions "salary", "income", "received", "credited", it's an "income" type.
            5. If the user mentions "spent", "paid", "bought", "bill", it's an "expense" type.
            
            Example:
            User: "Add salary 50000 and spend 2000 food"
            Response: {
              "intent": "FINANCIAL_ACTION",
              "message": "I've prepared two actions: recording your salary and your food expense.",
              "actions": [
                { "action": "ADD_TRANSACTION", "type": "income", "data": { "amount": 50000, "category": "Freelancing", "note": "Salary", "account": "Bank" } },
                { "action": "ADD_TRANSACTION", "type": "expense", "data": { "amount": 2000, "category": "Food", "note": "Food", "account": "Cash" } }
              ],
              "confidence": 0.98,
              "requiresApproval": true
            }`
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

    return {
      intent: parsed.intent || "FINANCIAL_ACTION",
      message: parsed.message || "I've prepared a financial plan for you.",
      actions: parsed.actions || [],
      confidence: parsed.confidence || 0.7,
      requiresApproval: true // Strictly enforce approval layer
    };
  } catch (error) {
    console.error('OpenAI Parsing Error:', error);
    return {
      intent: "CHAT",
      message: "I encountered an error planning your request. How else can I help?",
      actions: [],
      confidence: 0,
      requiresApproval: false
    };
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
            'You are the MoneyManage AI Financial Manager. You help users manage wealth, detect patterns, and optimize spending. Be professional, data-driven, and proactive. You propose actions that users can approve. Always reference the current balances and history provided.'
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

const suggestCategory = async (note, customCategories = []) => {
  if (!note || !note.trim()) return { category: 'Personal', confidence: 0.1 };

  const categoryNames = customCategories.length > 0 
    ? customCategories.map(c => c.name).join(', ')
    : 'Food, Travel, College, Freelancing, Investment, Personal';

  if (!openai) {
    // Heuristic suggestion
    const type = inferTypeFromMessage(note);
    const category = inferCategoryFromMessage(note, type, customCategories);
    return { category, confidence: 0.6 };
  }

  try {
    const response = await openai.chat.completions.create({
      model: buildOpenAIModel(),
      temperature: 0,
      messages: [
        {
          role: 'system',
          content: `Suggest the most likely category for this transaction note. Return JSON with "category" and "confidence" (0-1). Available categories: ${categoryNames}.`,
        },
        {
          role: 'user',
          content: note,
        },
      ],
      response_format: isOpenRouter ? undefined : { type: 'json_object' },
    });

    const parsed = JSON.parse(cleanJsonString(response.choices?.[0]?.message?.content || '{}'));
    return {
      category: parsed.category || 'Personal',
      confidence: (Number(parsed.confidence) || 0.5) * 100
    };
  } catch (error) {
    return { category: 'Personal', confidence: 30 };
  }
};

const generatePersonalityReport = async (transactions = []) => {
  if (!openai || transactions.length < 5) {
    return {
      personalityType: "Balanced",
      insights: "Not enough data for behavioral modeling.",
      recommendations: ["Log more transactions to unlock AI personality analysis."]
    };
  }

  try {
    const summary = transactions.slice(0, 50).map(t => ({ amount: t.amount, type: t.type, cat: t.category, note: t.note }));
    const response = await openai.chat.completions.create({
      model: buildOpenAIModel(),
      messages: [
        {
          role: 'system',
          content: 'Analyze these transactions and personify the user (Saver, Balanced, Spender, Risky Spender). Return JSON with "personalityType", "insights" (1 paragraph), and "recommendations" (list of 3).'
        },
        { role: 'user', content: JSON.stringify(summary) }
      ],
      response_format: isOpenRouter ? undefined : { type: 'json_object' }
    });
    return JSON.parse(cleanJsonString(response.choices?.[0]?.message?.content || '{}'));
  } catch (err) {
    return { personalityType: "Stable", insights: "Analyzing history...", recommendations: [] };
  }
};

const suggestBudgets = async (transactions = []) => {
  if (!openai || transactions.length < 5) return [];
  try {
    const summary = transactions.slice(0, 100).map(t => ({ amount: t.amount, type: t.type, cat: t.category }));
    const response = await openai.chat.completions.create({
      model: buildOpenAIModel(),
      messages: [
        {
          role: 'system',
          content: 'Suggest monthly budget limits for each category based on history. Return JSON array of objects: { category, limit }.'
        },
        { role: 'user', content: JSON.stringify(summary) }
      ]
    });
    return JSON.parse(cleanJsonString(response.choices?.[0]?.message?.content || '[]'));
  } catch (err) {
    return [];
  }
};

module.exports = {
  parseTransactionInput,
  generateResponse,
  generateInsights,
  generateContextReply,
  suggestCategory,
  generatePersonalityReport,
  suggestBudgets
};
