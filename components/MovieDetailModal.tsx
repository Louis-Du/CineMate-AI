import React from 'react';
import { Movie } from '../types';

interface Props {
  movie: Movie | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectRelated?: (movie: Movie) => void;
}

const MovieDetailModal: React.FC<Props> = ({ movie, isOpen, onClose, onSelectRelated }) => {
  if (!isOpen || !movie) return null;

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.src = "https://placehold.co/800x400/1e293b/e2e8f0?text=No+Image";
  };

  const handlePosterError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.src = "https://placehold.co/200x300/1e293b/e2e8f0?text=No+Poster";
  };

  // Fallback: If no trailerUrl is provided by AI, generate a search link
  const fallbackTrailerUrl = `https://www.youtube.com/results?search_query=Trailer+${encodeURIComponent(movie.title + " " + movie.year)}`;
  const finalTrailerLink = movie.trailerUrl || fallbackTrailerUrl;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative w-full max-w-2xl transform overflow-hidden rounded-xl bg-cinema-800 border border-cinema-700 text-left shadow-2xl shadow-black transition-all animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
        
        {/* Scrollable Container */}
        <div className="overflow-y-auto scrollbar-hide custom-scrollbar">
            {/* Header Image Background */}
            <div className="h-48 w-full overflow-hidden relative shrink-0">
                <img 
                    src={movie.posterUrl || `https://placehold.co/800x400/1e293b/e2e8f0?text=${encodeURIComponent(movie.title)}`}
                    alt="Background" 
                    onError={handleImageError}
                    className="w-full h-full object-cover opacity-40 blur-sm"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-cinema-800 to-transparent" />
                
                <button 
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 rounded-full bg-black/50 p-2 text-white hover:bg-cinema-accent hover:text-black transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                </button>
            </div>

            <div className="relative -mt-20 px-6 pb-6">
                <div className="flex flex-col sm:flex-row gap-6">
                    {/* Poster */}
                    <div className="shrink-0 mx-auto sm:mx-0">
                        <img 
                            src={movie.posterUrl || "https://placehold.co/200x300/1e293b/e2e8f0?text=No+Poster"}
                            alt={movie.title}
                            onError={handlePosterError}
                            className="h-64 w-44 rounded-lg shadow-lg border-2 border-cinema-700 object-cover bg-cinema-900"
                        />
                    </div>

                    {/* Info */}
                    <div className="flex-1 text-center sm:text-left pt-2 sm:pt-14">
                        <h2 className="text-3xl font-bold text-white mb-1">{movie.title}</h2>
                        <div className="flex items-center justify-center sm:justify-start gap-3 text-sm text-gray-400 mb-4">
                            <span>{movie.year}</span>
                            <span>•</span>
                            <span>{movie.director}</span>
                            {movie.rating && (
                                <>
                                    <span>•</span>
                                    <span className="text-cinema-accent font-bold">★ {movie.rating}</span>
                                </>
                            )}
                        </div>

                        <div className="flex flex-wrap justify-center sm:justify-start gap-2 mb-6">
                            {movie.genres.map((g, i) => (
                                <span key={i} className="px-2 py-1 rounded bg-cinema-900 border border-cinema-700 text-xs text-gray-300">
                                    {g}
                                </span>
                            ))}
                        </div>

                        <p className="text-gray-300 leading-relaxed mb-6">
                            {movie.description || "No description available."}
                        </p>

                        {movie.cast && (
                            <div className="mb-4">
                                <h4 className="text-xs font-bold text-cinema-accent uppercase mb-2 tracking-wider">Reparto Principal</h4>
                                <p className="text-sm text-gray-400">{movie.cast.join(", ")}</p>
                            </div>
                        )}

                        {movie.streaming && movie.streaming.length > 0 && (
                            <div className="mb-4">
                                <h4 className="text-xs font-bold text-cinema-accent uppercase mb-2 tracking-wider">Disponible en</h4>
                                <div className="flex flex-wrap justify-center sm:justify-start gap-2">
                                    {movie.streaming.map((platform, i) => (
                                        <span key={i} className="px-2 py-1 rounded-md bg-cinema-700/50 text-xs text-white border border-white/10">
                                            {platform}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        {/* Trailer Section - External Link Only */}
                        <div className="mt-6">
                            <h4 className="text-xs font-bold text-cinema-accent uppercase mb-2 tracking-wider">Trailer Oficial</h4>
                            
                            <div className="mt-2 p-4 rounded-lg bg-cinema-900/50 border border-cinema-700 text-center">
                                <a 
                                    href={finalTrailerLink} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-6 py-3 rounded bg-[#ff0000] hover:bg-[#cc0000] text-white font-bold text-sm transition-colors shadow-lg w-full sm:w-auto justify-center"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg>
                                    Ver Trailer en YouTube
                                </a>
                            </div>
                        </div>

                        {/* Related Movies Section */}
                        {movie.relatedMovies && movie.relatedMovies.length > 0 && (
                            <div className="mt-8 border-t border-cinema-700/50 pt-6">
                                <h4 className="text-xs font-bold text-cinema-accent uppercase mb-4 tracking-wider">También te podría gustar</h4>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                    {movie.relatedMovies.map((related, idx) => (
                                        <div 
                                            key={idx} 
                                            onClick={() => onSelectRelated && onSelectRelated(related)}
                                            className="group cursor-pointer bg-cinema-900 rounded-lg p-2 border border-cinema-700 hover:border-cinema-accent transition-all hover:scale-105"
                                        >
                                            <div className="aspect-[3/4] w-full overflow-hidden rounded mb-2 relative">
                                                <img 
                                                    src={related.posterUrl || "https://placehold.co/200x300/1e293b/e2e8f0?text=No+Poster"} 
                                                    alt={related.title}
                                                    onError={handlePosterError}
                                                    className="w-full h-full object-cover group-hover:opacity-80 transition-opacity"
                                                />
                                            </div>
                                            <h5 className="text-xs font-bold text-gray-200 truncate">{related.title}</h5>
                                            <p className="text-[10px] text-gray-500">{related.year}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex gap-3 justify-center sm:justify-start mt-6 pt-4 border-t border-cinema-700/50">
                            <button onClick={onClose} className="px-4 py-2 rounded bg-cinema-accent text-black font-bold text-sm hover:bg-cinema-accentHover transition-colors shadow-lg shadow-amber-500/10">
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default MovieDetailModal;