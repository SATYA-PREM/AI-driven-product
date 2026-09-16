import { useState, useRef, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { formatISTTime } from '../../utils/dateUtils';

export default function ChatAssistant() {
  const { isDark } = useOutletContext();
  
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  
  
  const chatContainerRef = useRef(null);

  const cardBg = isDark ? 'bg-[#0a0a0a]/80 border-white/10 backdrop-blur-3xl' : 'bg-white/90 border-gray-200 shadow-xl backdrop-blur-3xl';
  const textMain = isDark ? 'text-white' : 'text-gray-900';
  const textMuted = isDark ? 'text-gray-400' : 'text-gray-500';

  const suggestedQuestions = [
    "What are the top user problems?",
    "What features are users requesting?",
    "What is the overall sentiment?",
    "How is development progressing?"
  ];

  
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSendMessage = (textOrEvent) => {
    if (textOrEvent?.preventDefault) textOrEvent.preventDefault();
    const textToSend = typeof textOrEvent === 'string' ? textOrEvent : inputValue;
    
    if (!textToSend.trim() || loading) return;

    const newUserMsg = { id: Date.now(), sender: 'user', text: textToSend, time: formatISTTime(new Date()) };
    setMessages((prev) => [...prev, newUserMsg]);
    setInputValue('');
    setLoading(true);

    setTimeout(() => {
      const mockAiResponse = {
        id: Date.now() + 1,
        sender: 'ai',
        text: `Based on the latest data analysis regarding "${textToSend}", we have identified a significant trend. The issue is currently categorized as high priority.`,
        time: formatISTTime(new Date())
      };
      setMessages((prev) => [...prev, mockAiResponse]);
      setLoading(false);
    }, 1500);
  };

  return (
    
    <div className="h-[calc(100vh-8rem)] flex flex-col animate-fade-in-up">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-6 shrink-0">
        <div>
          <h1 className={`text-2xl font-black tracking-tight ${textMain}`}>AI Product Assistant</h1>
          <p className={`text-sm mt-1 font-medium ${textMuted}`}>Query your processed intelligence directly.</p>
        </div>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border font-mono text-[10px] font-bold tracking-widest uppercase ${isDark ? 'bg-[#00FFA3]/10 border-[#00FFA3]/20 text-[#00FFA3]' : 'bg-blue-50 border-blue-200 text-blue-700'}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"></span>
          Model Connected
        </div>
      </div>

      <div className={`flex-1 rounded-[2rem] border flex flex-col overflow-hidden relative ${cardBg}`}>
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 blur-[120px] opacity-10 pointer-events-none ${isDark ? 'bg-[#00FFA3]' : 'bg-blue-500'}`}></div>

        <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide relative z-10">
          
          {messages.length === 0 && (
            <div className="flex items-start gap-4 max-w-3xl animate-fade-in-up">
              <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center border ${isDark ? 'bg-black border-[#00FFA3] text-[#00FFA3]' : 'bg-blue-50 border-blue-500 text-blue-600'}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </div>
              <div className="space-y-1">
                <div className={`font-mono text-[10px] tracking-widest uppercase font-bold ${textMuted}`}>AI Assistant • Just now</div>
                <div className={`p-4 rounded-2xl rounded-tl-sm border text-sm leading-relaxed ${isDark ? 'bg-white/5 border-white/10 text-gray-200' : 'bg-gray-50 border-gray-100 text-gray-800'}`}>
                  Hello! I'm your Product Intelligence AI. Ask me anything about your datasets, user feedback, or development progress.
                </div>
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className={`flex items-start gap-4 max-w-3xl ${msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center border ${
                msg.sender === 'user' 
                  ? (isDark ? 'bg-white/10 border-white/20 text-white font-black text-xs' : 'bg-gray-900 border-black text-white font-black text-xs') 
                  : (isDark ? 'bg-black border-[#00FFA3] text-[#00FFA3]' : 'bg-blue-50 border-blue-500 text-blue-600')
              }`}>
                {msg.sender === 'user' ? 'YD' : <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
              </div>
              
              <div className={`space-y-1 flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`font-mono text-[10px] tracking-widest uppercase font-bold ${textMuted}`}>
                  {msg.sender === 'user' ? 'You' : 'AI Assistant'} • {msg.time}
                </div>
                <div className={`p-4 text-sm leading-relaxed ${
                  msg.sender === 'user'
                    ? `rounded-2xl rounded-tr-sm ${isDark ? 'bg-[#00FFA3] text-black' : 'bg-blue-600 text-white'}`
                    : `rounded-2xl rounded-tl-sm border ${isDark ? 'bg-white/5 border-white/10 text-gray-200' : 'bg-gray-50 border-gray-100 text-gray-800'}`
                }`}>
                  {msg.text}
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-start gap-4 max-w-3xl animate-fade-in-up">
              <div className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center border ${isDark ? 'bg-black border-[#00FFA3] text-[#00FFA3]' : 'bg-blue-50 border-blue-500 text-blue-600'}`}>
                <div className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin"></div>
              </div>
              <div className={`p-4 rounded-2xl rounded-tl-sm border text-sm font-mono flex items-center gap-3 ${isDark ? 'bg-white/5 border-white/10 text-[#00FFA3]' : 'bg-gray-50 border-gray-100 text-blue-600'}`}>
                AI is analyzing your request...
                <span className="flex gap-1"><span className="animate-bounce">.</span><span className="animate-bounce" style={{animationDelay: '100ms'}}>.</span><span className="animate-bounce" style={{animationDelay: '200ms'}}>.</span></span>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className={`p-4 border-t relative z-10 shrink-0 ${isDark ? 'border-white/10 bg-black/40' : 'border-gray-200 bg-white/40'}`}>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-3">
            {suggestedQuestions.map((q, idx) => (
              <button 
                key={idx} 
                onClick={() => handleSendMessage(q)}
                disabled={loading}
                className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-medium border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${isDark ? 'bg-white/5 border-white/10 text-gray-300 hover:bg-white/10 hover:text-white' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
              >
                {q}
              </button>
            ))}
          </div>

          <form onSubmit={handleSendMessage} className="relative flex items-center">
            <input 
              type="text" 
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={loading}
              placeholder="Ask about your product data..." 
              className={`w-full pl-5 pr-14 py-4 rounded-2xl border text-sm focus:outline-none transition-all placeholder:font-mono disabled:opacity-50 ${isDark ? 'bg-black/50 border-white/20 focus:border-[#00FFA3]/50 text-white placeholder:text-gray-600' : 'bg-white border-gray-300 focus:border-blue-500 text-black placeholder:text-gray-400'}`}
            />
            <button 
              type="submit"
              disabled={!inputValue.trim() || loading}
              className={`absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl flex items-center justify-center transition-transform hover:scale-110 disabled:opacity-50 disabled:hover:scale-100 ${isDark ? 'bg-[#00FFA3] text-black shadow-[0_0_15px_rgba(0,255,163,0.4)]' : 'bg-blue-600 text-white shadow-md'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}