/**
 * AI Learning Memory Layer
 * Completely parallel to the core transaction system.
 */

export const getAILearningMemory = () => {
  const raw = localStorage.getItem('aiLearningMemory');
  return raw ? JSON.parse(raw) : [];
};

export const saveAILearningMemory = (memory) => {
  localStorage.setItem('aiLearningMemory', JSON.stringify(memory));
};

export const recordLearningEvent = (keyword, suggested, corrected, confidence) => {
  const memory = getAILearningMemory();
  const entry = {
    keyword,
    suggestedCategory: suggested,
    userCorrectedCategory: corrected,
    confidence,
    timestamp: new Date().toISOString()
  };
  
  // Keep only the last 50 learning events
  const updated = [entry, ...memory].slice(0, 50);
  saveAILearningMemory(updated);
  return updated;
};

export const getSuggestionAccuracy = () => {
  const memory = getAILearningMemory();
  if (memory.length === 0) return 100;
  
  const matches = memory.filter(m => m.suggestedCategory === m.userCorrectedCategory).length;
  return Math.round((matches / memory.length) * 100);
};

export const cleanupMemory = () => {
    const memory = getAILearningMemory();
    if (memory.length === 0) return;

    const uniqueMap = new Map();
    memory.forEach(entry => {
        const key = `${entry.keyword.toLowerCase()}-${entry.userCorrectedCategory}`;
        if (!uniqueMap.has(key)) {
            uniqueMap.set(key, entry);
        } else {
            // Keep the most recent one
            const existing = uniqueMap.get(key);
            if (new Date(entry.timestamp) > new Date(existing.timestamp)) {
                uniqueMap.set(key, entry);
            }
        }
    });

    const cleaned = Array.from(uniqueMap.values())
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 100); // Increased capacity after cleanup
    
    saveAILearningMemory(cleaned);
    return cleaned;
};

export const getMemoryInsights = () => {
    const memory = getAILearningMemory();
    if (memory.length < 3) return "AI is still observing your patterns. Continue recording transactions to build a spending model.";
    
    // Periodically run cleanup when insights are requested
    if (memory.length > 30) cleanupMemory();

    const accuracy = getSuggestionAccuracy();
    if (accuracy > 80) return `AI mapping is highly accurate (${accuracy}%). Your categorization pattern is consistent.`;
    if (accuracy < 50) return `AI accuracy is low (${accuracy}%). Your custom categorization varies significantly from standard models.`;
    
    return `AI learning node is active. Current mapping accuracy: ${accuracy}%.`;
};
