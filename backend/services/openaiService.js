const { OpenAI } = require('openai');
require('dotenv').config();

const isOpenRouter = process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.startsWith('sk-or-');
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: isOpenRouter ? 'https://openrouter.ai/api/v1' : undefined,
});

const parseTransactionInput = async (message) => {
  try {
    const prompt = `You are a financial parsing assistant. The user wants to log a transaction. 
User message: "${message}"

Extract the transaction details into STRICT JSON format with EXACTLY the following keys:
- "type": MUST be either "expense" or "income"
- "amount": MUST be a number 
- "category": String (Suggest one of: Food, Travel, College, Freelancing, Investment, Personal)
- "account": String (Suggest one of: UPI, Bank, Cash)
- "note": Short description

Respond ONLY with valid JSON, no markdown formatting.`;

    const response = await openai.chat.completions.create({
      model: isOpenRouter ? 'openai/gpt-4o-mini' : 'gpt-4o-mini',
      messages: [{ role: 'system', content: prompt }],
      temperature: 0,
    }); // we assume GPT-4o-mini is available, or fallback to gpt-3.5-turbo

    const rawContent = response.choices[0].message.content.trim();
    // remove markdown JSON block if present
    const cleanJson = rawContent.replace(/^```json/g, '').replace(/```$/g, '').trim();
    
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error("OpenAI Parsing Error:", error);
    throw new Error('Failed to parse input.');
  }
};

const generateResponse = async (parsedData, updatedBalances) => {
  try {
    const prompt = `You are a strict, helpful personal financial assistant.
A new transaction was just added: ${JSON.stringify(parsedData)}
Current total balance: ${updatedBalances.total}
Current category balances: ${JSON.stringify(updatedBalances.categories)}

Respond EXACTLY in this 3-line format:
✅ Line 1: Confirmation of the spent/earned amount and category (use emojis).
💰 Line 2: The updated total balance.
⚠️ Line 3: A short warning or tip based directly on the category spending.

Example Output:
✅ ₹30 spent on Food 🍛
💰 Balance: ₹2470
⚠️ Reduce food spending this week`;

    const response = await openai.chat.completions.create({
      model: isOpenRouter ? 'openai/gpt-4o-mini' : 'gpt-4o-mini',
      messages: [{ role: 'system', content: prompt }],
      temperature: 0.5,
      max_tokens: 150
    });

    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error("OpenAI Reply Error:", error);
    throw new Error('Failed to generate response.');
  }
};

const generateInsights = async (balances, transactions) => {
    try {
        const prompt = `You are a financial advisor. Here is the user's current status:
Balances: ${JSON.stringify(balances)}
Recent Transactions (up to 10): ${JSON.stringify(transactions.slice(0, 10))}

Provide a brief, impactful paragraph summarizing their financial health and one key piece of advice.`;

        const response = await openai.chat.completions.create({
          model: isOpenRouter ? 'openai/gpt-4o-mini' : 'gpt-4o-mini',
          messages: [{ role: 'system', content: prompt }],
          temperature: 0.7,
        });
    
        return response.choices[0].message.content.trim();
    } catch (error) {
        console.error("OpenAI Insight Error:", error);
        return "Could not load insights at this time.";
    }
}

module.exports = {
  parseTransactionInput,
  generateResponse,
  generateInsights
};
