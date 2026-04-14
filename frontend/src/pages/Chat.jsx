import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import Layout from '../components/Layout';
import { 
  Mic, 
  MicOff, 
  Sparkles, 
  Info, 
  PlusCircle, 
  HandCoins, 
  ArrowRight, 
  MessageSquare, 
  History as HistoryIcon,
  AlertCircle,
  Trash2,
  ShieldCheck
} from 'lucide-react';
import { processAI, fetchChatHistory, deleteChatHistory, addTransaction } from '../services/api';
import { 
  getLocalBalances, 
  addLocalTransaction, 
  getStorageMode,
  getLocalCategories,
  saveLocalCategory
} from '../utils/storage';
import { addCategory, fetchCategories } from '../services/api';
import { emitFinanceUpdate } from '../utils/financeEvents';
import ActionButton from '../components/ActionButton';
import GlassBox from '../components/GlassBox';
import { ChatScene } from '../components/3d/ChatScene';
import { useVoiceRecognition } from '../hooks/useVoiceRecognition';
import { cn } from '../utils/cn';
import ReactMarkdown from 'react-markdown';
import ManualAddModal from '../components/ManualAddModal';
import { Plus } from 'lucide-react';

export default function Chat() {
  const [messages, setMessages] = useState([
    { id: 'welcome', text: "Hi! I'm your AI financial companion. Speak or type a transaction, note, or command.", sender: 'ai' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [voicePreview, setVoicePreview] = useState('');
  const [voiceBanner, setVoiceBanner] = useState('');
  const [showHistory, setShowHistory] = useState(true);
  const [error, setError] = useState(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [pendingConflict, setPendingConflict] = useState(null);
  const messagesEndRef = useRef(null);

  const handleClearChat = async () => {
    setClearing(true);
    try {
       await deleteChatHistory();
       setMessages([{ id: 'welcome', text: "Hi! I'm your AI financial companion. Speak or type a transaction, note, or command.", sender: 'ai' }]);
       setShowClearConfirm(false);
       setVoiceBanner('AI chat cleared successfully ✅');
       setTimeout(() => setVoiceBanner(''), 3000);
       localStorage.removeItem("chat_history");
    } catch(err) {
       setError("Unable to clear chat. Try again later.");
    } finally {
       setClearing(false);
    }
  };


  useEffect(() => {
    loadHistory();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const loadHistory = async () => {
    try {
      const history = await fetchChatHistory();
      if (history && history.length > 0) {
        setMessages(history);
      }
    } catch (e) {
      console.error("Failed to load history", e);
    }
  };

  const resolveConflict = async (resolution, newCategoryName = null) => {
    if (!pendingConflict) return;
    const { action, messageId } = pendingConflict;
    
    try {
      let finalCategory = action.data.category;

      if (resolution === 'CREATE') {
        const catData = { 
            name: action.data.category, 
            type: action.data.type || 'expense' 
        };
        await addCategory(catData);
        saveLocalCategory(catData);
      } else if (resolution === 'SELECT') {
        finalCategory = newCategoryName;
      }

      const updatedAction = {
        ...action,
        data: { ...action.data, category: finalCategory }
      };

      setPendingConflict(null);
      await executeAction(updatedAction, messageId, true); // true = bypass second check
    } catch (err) {
      setError("Conflict resolution failed.");
    }
  };

  const executeAction = async (action, messageId, skipValidation = false) => {
    // 1. Prevent double execution if already in progress or done
    const targetMsg = messages.find(m => m.id === messageId);
    if (targetMsg?.executed && !skipValidation) return;

    // 2. Category Validation Layer
    if (!skipValidation) {
      const existingCategories = getLocalCategories();
      const exists = existingCategories.some(c => c.name.toLowerCase() === action.data.category.toLowerCase());
      
      if (!exists) {
        setPendingConflict({ action, messageId });
        return;
      }
    }

    try {
      const mode = getStorageMode();
      if (action.type === 'ADD_TRANSACTION') {
        const txData = { 
            ...action.data, 
            amount: Number(action.data.amount),
            source: 'ai', 
            createdAt: new Date().toISOString() 
        };
        
        if (mode === 'local' || mode === 'hybrid') {
          addLocalTransaction(txData);
        }
        await addTransaction(txData);
        
        const balances = getLocalBalances();
        const symbol = action.data.type?.toLowerCase() === 'income' ? '+' : '-';

        setMessages(prev => [
          ...prev.map(m => m.id === messageId ? { ...m, actions: [], executed: true } : m),
          {
            id: Date.now() + 5,
            sender: 'ai',
            text: `### ✅ Transaction Synchronized\n**Current Balance:** ₹${balances.total.toLocaleString()}\n**Impact:** ${symbol}₹${Number(action.data.amount).toLocaleString()}\n\nLedger entry: *${action.data.note}* in **${action.data.category}** using **${action.data.account}**`,
            executed: true
          }
        ]);

        setVoiceBanner('Sync successful ✅');
        if (!skipValidation) setTimeout(() => setVoiceBanner(''), 3000);
      }
    } catch (err) {
      console.error("Action execution failed", err);
      setError("Execution failed. Retrying sync node...");
    }
  };

  const submitMessage = useCallback(async (text) => {
    const messageText = text.trim();
    if (!messageText) return;

    setError(null);
    const userMsg = { id: Date.now(), text: messageText, sender: 'user' };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const localBalances = getLocalBalances();
      const response = await processAI(messageText, localBalances);

      const aiMsgId = Date.now() + 1;
      const aiMsg = {
        id: aiMsgId,
        text: response.message || "Proposal prepared.",
        sender: 'ai',
        actions: response.actions || [],
        confidence: response.confidence || 0,
        requiresApproval: response.requiresApproval
      };

      setMessages(prev => [...prev, aiMsg]);

      // Execution Layer: Autonomous Sync Mode
      if (response.actions && response.actions.length > 0) {
          response.actions.forEach(action => executeAction(action, aiMsgId));
      }

    } catch (err) {
      setError("Synchronicity lost. Check your connection.");
      setMessages(prev => [...prev, {
          id: Date.now() + 1,
          text: "I'm having trouble reaching the synchronization node. Please ensure the backend is running.",
          sender: 'ai'
      }]);
    } finally {
      setIsTyping(false);
    }
  }, []);

  const {
    supported: voiceSupported,
    isListening,
    interimTranscript,
    error: voiceError,
    mode: voiceMode,
    start,
    stop,
    toggle,
    setMode: setVoiceMode,
  } = useVoiceRecognition({
    onFinalTranscript: (spokenText) => {
      setVoicePreview(spokenText);
      setVoiceBanner(`Sending: ${spokenText}`);
      submitMessage(spokenText);
    },
  });

  useEffect(() => {
    if (interimTranscript) {
      setVoicePreview(interimTranscript);
      setVoiceBanner(`Listening: ${interimTranscript}`);
    }
  }, [interimTranscript]);

  const quickActions = [
    { label: "Spent 200 on Lunch", icon: HandCoins },
    { label: "Salary 50000", icon: PlusCircle },
    { label: "Total Balance", icon: Info },
  ];

  const handleSend = (e) => {
    if (e) e.preventDefault();
    submitMessage(input);
  };

  return (
    <Layout>
      <div className="flex flex-col h-full font-sans bg-transparent overflow-hidden relative">
        
        {/* 3D Visual Context */}
        <ChatScene
          messages={messages}
          isTyping={isTyping}
          isListening={isListening}
          transcriptPreview={voicePreview}
        />

        {/* Global Control Bar */}
        <div className="bg-white/60 backdrop-blur-xl p-4 z-40 sticky top-0 flex justify-between items-center shadow-lg mx-4 mt-4 rounded-3xl border border-white/50">
          <div className="flex items-center gap-4 pointer-events-auto">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand to-indigo-600 flex items-center justify-center text-white shadow-brand/20 relative">
               <Sparkles size={18} className="animate-pulse"/>
            </div>
            <div className="hidden sm:block">
              <h2 className="text-lg font-display font-black text-slate-800 tracking-tight">AI Assistant</h2>
              <div className="flex items-center gap-1.5">
                 <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                 <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Autonomous Sync Active</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 pointer-events-auto">
            <button
               onClick={() => setShowClearConfirm(true)}
               title="Clear AI Chat"
               className="p-2 rounded-xl text-red-500 bg-red-50 hover:bg-red-500 hover:text-white transition-all duration-300 shadow-sm"
            >
               <Trash2 size={18} />
            </button>
            <button
               onClick={() => setShowHistory(!showHistory)}
               className={cn("p-2 rounded-xl transition-all duration-300", showHistory ? "bg-brand text-white shadow-md shadow-brand/20" : "bg-white/80 text-slate-600 border border-slate-100")}
            >
                <HistoryIcon size={18} />
            </button>
            <button
               onClick={() => setIsManualModalOpen(true)}
               title="Manual Entry"
               className="p-2 rounded-xl text-brand bg-brand/5 hover:bg-brand hover:text-white transition-all duration-300 shadow-sm flex items-center gap-1.5"
            >
               <Plus size={18} />
               <span className="hidden lg:inline text-[9px] font-black uppercase tracking-widest">Manual</span>
            </button>
            <div className="h-6 w-px bg-slate-200 mx-1"></div>
            <button
              type="button"
              onClick={() => setVoiceMode(voiceMode === 'push-to-talk' ? 'always-listening' : 'push-to-talk')}
              className={cn(
                "rounded-full px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.15em] transition-all",
                voiceMode === 'always-listening' ? 'bg-amber-100 text-amber-600 shadow-sm' : 'bg-slate-100 text-slate-400'
              )}
            >
               {voiceMode === 'always-listening' ? 'Always-On' : 'PTT Mode'}
            </button>
            <button
              type="button"
              onMouseDown={voiceMode === 'push-to-talk' ? start : undefined}
              onMouseUp={voiceMode === 'push-to-talk' ? stop : undefined}
              onTouchStart={voiceMode === 'push-to-talk' ? start : undefined}
              onTouchEnd={voiceMode === 'push-to-talk' ? stop : undefined}
              onClick={voiceMode === 'always-listening' ? toggle : undefined}
              disabled={!voiceSupported}
              className={cn(
                "rounded-full w-12 h-12 flex items-center justify-center transition-all bg-white shadow-sm border border-slate-100",
                isListening && "scale-110 bg-emerald-500 text-white border-emerald-400 shadow-emerald-500/30"
              )}
            >
              {isListening ? <Mic size={20} className="animate-pulse" /> : <MicOff size={20} className="text-slate-400" />}
            </button>
          </div>
        </div>
        
        {/* Chat History Flow */}
        <div className="flex-1 flex flex-col pointer-events-none relative overflow-hidden px-4 md:px-12 py-6">
           <AnimatePresence>
             {showHistory && (
               <motion.div 
                 initial={{ opacity: 0, x: -50 }}
                 animate={{ opacity: 1, x: 0 }}
                 exit={{ opacity: 0, x: -50 }}
                 className="w-full max-w-2xl flex flex-col pointer-events-auto z-30 flex-1 overflow-hidden"
               >
                  <div className="flex-1 overflow-y-auto pr-2 space-y-8 scroller-hidden pb-10 pt-4">
                     {messages.map((msg, i) => (
                       <motion.div 
                         key={msg.id || i}
                         initial={{ opacity: 0, scale: 0.95, y: 10 }}
                         animate={{ opacity: 1, scale: 1, y: 0 }}
                         className={cn(
                            "flex w-full",
                            msg.sender === 'user' ? "justify-end" : "justify-start"
                         )}
                       >
                          <div className={cn(
                            "flex max-w-[90%] sm:max-w-[80%] gap-3",
                            msg.sender === 'user' ? "flex-row-reverse" : "flex-row"
                          )}>
                             {msg.sender === 'ai' && (
                               <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand to-indigo-600 flex items-center justify-center text-white shadow-lg shrink-0 mt-1 relative border border-white/20">
                                  <Sparkles size={14} />
                               </div>
                             )}

                             <div className="flex flex-col min-w-0">
                               <div className={cn(
                                  "relative p-4 md:px-5 md:py-4 rounded-3xl text-sm leading-relaxed shadow-sm w-fit",
                                  msg.sender === 'user' 
                                    ? "bg-brand text-white rounded-tr-sm font-medium border border-brand/20 shadow-brand/10" 
                                    : "bg-white text-slate-700 rounded-tl-sm border border-slate-100 shadow-slate-200/50"
                               )}>
                                  <div className="space-y-3 break-words whitespace-pre-wrap min-w-0">
                                    <ReactMarkdown 
                                      components={{
                                        p: ({node, ...props}) => <p className="leading-relaxed" {...props} />,
                                        strong: ({node, ...props}) => <strong className="font-black" {...props} />,
                                        h1: ({node, ...props}) => <h1 className="text-xl font-black mt-2 mb-1 block" {...props} />,
                                        h2: ({node, ...props}) => <h2 className="text-lg font-black mt-2 mb-1 block" {...props} />,
                                        h3: ({node, ...props}) => <h3 className="text-base font-black mt-2 mb-1 block" {...props} />,
                                        ul: ({node, ...props}) => <ul className="list-disc pl-4 space-y-1 block" {...props} />,
                                        ol: ({node, ...props}) => <ol className="list-decimal pl-4 space-y-1 block" {...props} />,
                                        li: ({node, ...props}) => <li {...props} />
                                      }}
                                    >
                                      {msg.text}
                                    </ReactMarkdown>
                                  </div>


                                  {msg.executed && (
                                     <div className="mt-3 flex items-center gap-2 text-emerald-500 text-[9px] font-black uppercase tracking-widest px-1">
                                        <ShieldCheck size={12} /> Transaction Absolute Verified
                                     </div>
                                  )}
                               </div>
                               <p className={cn(
                                 "text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mt-2 opacity-60 px-1",
                                 msg.sender === 'user' ? "text-right" : "text-left"
                               )}>
                                  {msg.sender === 'user' ? 'Local Authorization' : 'Brain Processing Node'}
                               </p>
                             </div>
                          </div>
                       </motion.div>
                     ))}
                     
                     {isTyping && (
                        <motion.div 
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex items-center gap-3 pl-2"
                        >
                           <div className="bg-white/80 backdrop-blur-md p-3 px-6 rounded-2xl flex gap-1.5 border border-white shadow-md">
                              <div className="w-1.5 h-1.5 bg-brand rounded-full animate-bounce"></div>
                              <div className="w-1.5 h-1.5 bg-brand rounded-full animate-bounce [animation-delay:0.2s]"></div>
                              <div className="w-1.5 h-1.5 bg-brand rounded-full animate-bounce [animation-delay:0.4s]"></div>
                           </div>
                        </motion.div>
                     )}
                     <div ref={messagesEndRef} className="h-2" />
                  </div>
               </motion.div>
             )}
           </AnimatePresence>
        </div>

        {/* Input Dock */}
        <div className="w-full mx-auto p-4 md:p-8 space-y-4 z-40 pointer-events-auto">
          <AnimatePresence>
            {(voiceBanner || error) && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="flex justify-center"
              >
                <div className={cn(
                  "p-2 px-6 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-3 shadow-xl backdrop-blur-md",
                  error ? "bg-red-500 text-white" : "bg-emerald-500 text-white"
                )}>
                   {error ? <AlertCircle size={14} /> : <div className="w-2 h-2 rounded-full bg-white animate-ping"></div>}
                   {error || voiceBanner}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          <div className="max-w-3xl mx-auto space-y-4">
             {!isTyping && (
                <div className="flex gap-2 overflow-x-auto scroller-hidden justify-center px-2">
                   {quickActions.map((action, idx) => (
                      <button
                        key={idx}
                        onClick={() => { setInput(action.label); submitMessage(action.label); }}
                        className="px-4 py-2 rounded-full bg-white/70 border border-white/50 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-brand hover:border-brand transition-all flex items-center gap-2 whitespace-nowrap shadow-sm"
                      >
                         <action.icon size={11} />
                         {action.label}
                      </button>
                   ))}
                </div>
             )}

             <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-brand to-indigo-500 rounded-[2.5rem] blur opacity-10 group-focus-within:opacity-30 transition-opacity duration-500"></div>
                <GlassBox className="p-1.5 px-3 rounded-[2.2rem] shadow-premium relative bg-white/90 border-white group flex items-center">
                   <form onSubmit={handleSend} className="flex-1 flex items-center">
                     <Sparkles size={20} className="ml-3 text-brand opacity-50 group-focus-within:opacity-100 transition-opacity"/>
                     <input
                       type="text"
                       value={input}
                       onChange={(e) => setInput(e.target.value)}
                       placeholder="Message AI Assistant..."
                       className="flex-1 bg-transparent border-none px-4 py-4 focus:outline-none focus:ring-0 text-slate-800 font-bold placeholder:text-slate-300 text-base"
                     />
                     <button 
                        type="submit"
                        disabled={isTyping || !input.trim()}
                        className="w-12 h-12 rounded-full bg-brand text-white flex items-center justify-center shadow-lg shadow-brand/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                     >
                        <ArrowRight size={20} />
                     </button>
                   </form>
                </GlassBox>
             </div>
          </div>
        </div>

        <AnimatePresence>
          {showClearConfirm && (
             <motion.div 
               initial={{opacity: 0}}
               animate={{opacity: 1}}
               exit={{opacity: 0}}
               className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 pointer-events-auto"
             >
                <div className="bg-white rounded-3xl p-6 md:p-8 max-w-sm w-full shadow-2xl text-center space-y-6">
                   <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto">
                      <Trash2 size={32} />
                   </div>
                   <div>
                      <h3 className="text-xl font-black text-slate-800 tracking-tight">Clear Chat History</h3>
                      <p className="text-sm text-slate-500 mt-2 font-medium">Are you sure you want to delete all AI chat messages? This action cannot be undone and will not affect your core transactions or balances.</p>
                   </div>
                   <div className="flex gap-3">
                      <button 
                        onClick={() => setShowClearConfirm(false)}
                        className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition-colors"
                      >
                         Cancel
                      </button>
                      <button 
                        onClick={handleClearChat}
                        disabled={clearing}
                        className="flex-1 py-3 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 transition-colors disabled:opacity-50 inline-flex justify-center items-center"
                      >
                         {clearing ? 'Clearing...' : 'Confirm'}
                      </button>
                   </div>
                </div>
             </motion.div>
          )}
        </AnimatePresence>

        <ManualAddModal 
          isOpen={isManualModalOpen} 
          onClose={() => setIsManualModalOpen(false)} 
          onSuccess={() => {
            setVoiceBanner('Transaction recorded manually ✅');
            setTimeout(() => setVoiceBanner(''), 3000);
            loadHistory();
          }}
        />

        <AnimatePresence>
          {pendingConflict && (
            <motion.div 
               initial={{opacity: 0}}
               animate={{opacity: 1}}
               exit={{opacity: 0}}
               className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[200] flex items-center justify-center p-4 pointer-events-auto"
            >
               <GlassBox className="p-8 max-w-sm w-full bg-white shadow-2xl space-y-6">
                  <div className="flex items-center gap-4 text-amber-500">
                     <AlertCircle size={32} />
                     <h3 className="text-xl font-black tracking-tight text-slate-800">Category Mismatch</h3>
                  </div>
                  <p className="text-sm font-medium text-slate-500 leading-relaxed">
                     The category <span className="text-brand font-black">"{pendingConflict.action.data.category}"</span> does not exist in your records. How would you like to proceed?
                  </p>
                  
                  <div className="space-y-3">
                     <button 
                       onClick={() => resolveConflict('CREATE')}
                       className="w-full py-4 rounded-2xl bg-brand text-white font-black uppercase tracking-widest text-[11px] shadow-lg shadow-brand/20 hover:scale-[1.02] transition-all"
                     >
                        Create & Continue
                     </button>
                     
                     <div className="relative">
                        <select 
                          onChange={(e) => resolveConflict('SELECT', e.target.value)}
                          className="w-full py-4 px-4 rounded-2xl bg-slate-50 border border-slate-100 text-slate-700 font-bold text-xs appearance-none focus:outline-none focus:ring-2 focus:ring-brand/20"
                          defaultValue=""
                        >
                           <option value="" disabled>Select Existing Category</option>
                           {getLocalCategories().map(cat => (
                             <option key={cat.id} value={cat.name}>{cat.name}</option>
                           ))}
                        </select>
                     </div>

                     <button 
                       onClick={() => setPendingConflict(null)}
                       className="w-full py-3 rounded-2xl text-slate-400 font-bold text-[10px] uppercase tracking-widest hover:text-slate-600 transition-colors"
                     >
                        Cancel Transaction
                     </button>
                  </div>
               </GlassBox>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
}
