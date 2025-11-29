import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, MessageRole, ResponseType, Movie, NewsItem } from './types';
import { sendMessageToGemini } from './services/geminiService';
import RecommendationTable from './components/RecommendationTable';
import NewsFeed from './components/NewsFeed';
import MovieDetailModal from './components/MovieDetailModal';

const App: React.FC = () => {
  // State
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: MessageRole.ASSISTANT,
      content: {
        type: ResponseType.TEXT,
        message: "¡Hola! Soy tu Asistente Cinematográfico. 🎬 Dime qué te gusta (géneros, directores, actores) o menciona una película, y te ayudaré a encontrar tu próxima obsesión.",
      }
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Effects
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Helper to recursively remove posterUrl from data to save tokens
  const cleanDataForHistory = (data: any): any => {
    if (!data) return data;
    
    // Create a shallow copy to avoid mutating state directly
    if (Array.isArray(data)) {
        return data.map(item => cleanDataForHistory(item));
    }
    
    if (typeof data === 'object') {
        const copy = { ...data };
        if ('posterUrl' in copy) {
            copy.posterUrl = ""; 
        }
        if ('relatedMovies' in copy && Array.isArray(copy.relatedMovies)) {
            copy.relatedMovies = copy.relatedMovies.map((rel: any) => cleanDataForHistory(rel));
        }
        return copy;
    }
    
    return data;
  };

  // Handlers
  const handleSendMessage = async (text: string = inputText) => {
    if (!text.trim() || isLoading) return;

    const userMsgId = Date.now().toString();
    const newUserMsg: ChatMessage = {
      id: userMsgId,
      role: MessageRole.USER,
      content: { type: ResponseType.TEXT, message: text }
    };

    setMessages(prev => [...prev, newUserMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      // Prepare history for API
      // CRITICAL: Sanitize history to remove heavy base64 strings (posterUrls)
      const history = messages.map(m => {
        const contentCopy = JSON.parse(JSON.stringify(m.content));
        if (contentCopy.data) {
            contentCopy.data = cleanDataForHistory(contentCopy.data);
        }
        return {
            role: m.role === MessageRole.USER ? 'user' : 'model',
            parts: [{ text: JSON.stringify(contentCopy) }]
        };
      });

      const response = await sendMessageToGemini(text, history);

      const aiMsgId = (Date.now() + 1).toString();
      setMessages(prev => [...prev, {
        id: aiMsgId,
        role: MessageRole.ASSISTANT,
        content: response
      }]);

    } catch (error) {
      console.error("Error handling message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDetails = async (movie: Movie) => {
    // If the movie object already has description, open immediately.
    if (movie.description && movie.relatedMovies) {
        setSelectedMovie(movie);
        setDetailsModalOpen(true);
        return;
    }

    // Otherwise, simulate asking AI for details silently
    setIsLoading(true);
    try {
        const query = `Realiza una búsqueda exhaustiva para encontrar los detalles de la película: ${movie.title} (${movie.year}).
        Necesito: cast, rating, descripción y OBLIGATORIAMENTE un enlace de YouTube al TRAILER oficial.
        
        TAMBIÉN: Incluye un array "relatedMovies" con 3 películas similares a esta (basado en género, director o estilo).

        INSTRUCCIÓN CLAVE PARA EL TRAILER:
        Debes encontrar un enlace con formato estándar: 'https://www.youtube.com/watch?v=VIDEO_ID'.
        Si no encuentras el canal oficial, usa el trailer de un canal confiable.
        El campo "trailerUrl" NO puede estar vacío.

        IMPORTANTE: Responde ÚNICAMENTE con un objeto JSON válido que siga el esquema 'details'.
        NO incluyas texto conversacional ni listas en markdown fuera del JSON.`;

        // Simplified history for details fetch
        const contextHistory = messages.map(m => {
             const contentCopy = JSON.parse(JSON.stringify(m.content));
             if (contentCopy.data) {
                contentCopy.data = cleanDataForHistory(contentCopy.data);
             }
             return {
                 role: m.role === MessageRole.USER ? 'user' : 'model',
                 parts: [{ text: JSON.stringify(contentCopy) }]
            };
        });
        
        const response = await sendMessageToGemini(query, contextHistory);
        
        if (response.type === ResponseType.DETAILS && response.data) {
             setSelectedMovie(response.data as Movie);
             setDetailsModalOpen(true);
        } else {
             console.warn("AI returned text instead of DETAILS JSON:", response.message);
             alert("No se pudieron cargar todos los detalles automáticos. Intenta abrir de nuevo.");
        }
    } catch (e) {
        console.error(e);
        alert("Error al obtener detalles.");
    } finally {
        setIsLoading(false);
    }
  };

  const handleQuickAction = (action: string) => {
    let prompt = "";
    switch(action) {
        case 'load_more': prompt = "Cargar más recomendaciones basadas en lo anterior."; break;
        case 'change_filters': prompt = "Quiero cambiar mis filtros."; break;
        case 'news': prompt = "Ir a la Sección de Noticias."; break;
        default: return;
    }
    handleSendMessage(prompt);
  };

  // Render Helpers
  const renderMessageContent = (msg: ChatMessage) => {
    const { type, message, data } = msg.content;
    const isUser = msg.role === MessageRole.USER;

    return (
      <div className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-6`}>
        <div className={`max-w-[90%] md:max-w-[80%] ${isUser ? 'bg-cinema-700 rounded-br-none' : 'bg-cinema-800/80 rounded-bl-none'} rounded-2xl p-4 shadow-md backdrop-blur-sm border border-white/5`}>
          
          {/* Text Content */}
          <div className="prose prose-invert prose-sm max-w-none">
             <p className="whitespace-pre-wrap">{message}</p>
          </div>

          {/* Dynamic Content based on Type */}
          {!isUser && type === ResponseType.RECOMMENDATIONS && data && (
             <div className="mt-4">
                <RecommendationTable 
                    movies={data as Movie[]} 
                    onOpenDetails={handleOpenDetails}
                />
                {/* Navigation Buttons for Recommendations */}
                <div className="flex flex-wrap gap-2 mt-4 justify-center sm:justify-start">
                    <button onClick={() => handleQuickAction('load_more')} className="px-3 py-1.5 rounded-full border border-cinema-700 bg-cinema-900 hover:bg-cinema-800 text-xs text-gray-300 transition-colors">
                        Cargar Más 5 Películas ➡️
                    </button>
                    <button onClick={() => handleQuickAction('change_filters')} className="px-3 py-1.5 rounded-full border border-cinema-700 bg-cinema-900 hover:bg-cinema-800 text-xs text-gray-300 transition-colors">
                        Cambiar Filtros 🔄
                    </button>
                    <button onClick={() => handleQuickAction('news')} className="px-3 py-1.5 rounded-full border border-cinema-700 bg-cinema-900 hover:bg-cinema-800 text-xs text-gray-300 transition-colors">
                        Ir a Noticias 📰
                    </button>
                </div>
             </div>
          )}

          {!isUser && type === ResponseType.NEWS && data && (
              <NewsFeed news={data as NewsItem[]} />
          )}

        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen flex-col bg-cinema-900 font-sans text-gray-100 selection:bg-cinema-accent selection:text-black">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-cinema-900/80 px-4 py-3 backdrop-blur-md">
        <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-cinema-accent text-lg font-bold text-black shadow-lg shadow-amber-500/20">
                CM
            </span>
            <h1 className="text-lg font-bold tracking-tight text-white">CineMate AI</h1>
        </div>
        
        <div className="flex items-center gap-4">
            <button 
                onClick={() => handleQuickAction('news')}
                disabled={isLoading}
                className="group flex items-center gap-2 rounded-full border border-cinema-700 bg-cinema-800 px-4 py-1.5 text-xs font-medium text-gray-300 transition-all hover:border-cinema-accent hover:text-cinema-accent active:scale-95 disabled:opacity-50"
            >
                <span>Noticias</span>
                <span className="grayscale group-hover:grayscale-0 transition-all">📰</span>
            </button>
            <div className="text-xs text-gray-500 hidden sm:block">Powered by Gemini</div>
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        <div className="mx-auto max-w-4xl">
          {messages.map((msg) => (
            <React.Fragment key={msg.id}>
                {renderMessageContent(msg)}
            </React.Fragment>
          ))}
          
          {isLoading && (
             <div className="flex w-full justify-start mb-6">
                <div className="bg-cinema-800/80 rounded-2xl rounded-bl-none p-4 flex items-center gap-3">
                    <div className="flex gap-1">
                        <div className="w-2 h-2 rounded-full bg-cinema-accent animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 rounded-full bg-cinema-accent animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 rounded-full bg-cinema-accent animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                    <span className="text-xs text-gray-400">Consultando base de datos...</span>
                </div>
             </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input Area */}
      <footer className="border-t border-white/10 bg-cinema-900 p-4">
        <div className="mx-auto max-w-4xl relative">
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
            className="relative flex items-center gap-2"
          >
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ej: 'Recomienda algo tipo Interstellar' o 'Acción de los 90s'"
              className="w-full rounded-xl border border-cinema-700 bg-cinema-800 py-3 pl-4 pr-12 text-sm text-white placeholder-gray-500 focus:border-cinema-accent focus:outline-none focus:ring-1 focus:ring-cinema-accent shadow-inner"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !inputText.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg bg-cinema-accent p-2 text-black transition-transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg>
            </button>
          </form>
          <div className="mt-2 text-center text-[10px] text-gray-600">
             CineMate AI puede cometer errores. Verifica la información.
          </div>
        </div>
      </footer>

      {/* Modals */}
      <MovieDetailModal 
        movie={selectedMovie} 
        isOpen={detailsModalOpen} 
        onClose={() => setDetailsModalOpen(false)}
        onSelectRelated={handleOpenDetails}
      />
    </div>
  );
};

export default App;