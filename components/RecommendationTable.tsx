import React from 'react';
import { Movie } from '../types';

interface Props {
  movies: Movie[];
  onOpenDetails: (movie: Movie) => void;
}

const RecommendationTable: React.FC<Props> = ({ movies, onOpenDetails }) => {
  if (!movies || movies.length === 0) return null;

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.src = "https://placehold.co/200x300/1e293b/e2e8f0?text=No+Poster";
  };

  return (
    <div className="w-full overflow-hidden rounded-lg border border-cinema-700 bg-cinema-800/50 shadow-lg mt-4">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-300">
          <thead className="bg-cinema-900 text-xs uppercase text-cinema-accent font-bold">
            <tr>
              <th scope="col" className="px-4 py-3">Póster</th>
              <th scope="col" className="px-4 py-3">Título</th>
              <th scope="col" className="px-4 py-3 hidden sm:table-cell">Año</th>
              <th scope="col" className="px-4 py-3 hidden md:table-cell">Géneros</th>
              <th scope="col" className="px-4 py-3 text-right">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-cinema-700">
            {movies.map((movie, index) => (
              <tr key={`${movie.title}-${index}`} className="hover:bg-cinema-700/50 transition-colors">
                <td className="px-4 py-3 w-20">
                  <div className="h-24 w-16 overflow-hidden rounded bg-cinema-900 shadow-sm relative group border border-cinema-700/50">
                    <img 
                      src={movie.posterUrl || "https://placehold.co/200x300/1e293b/e2e8f0?text=No+Poster"}
                      alt={movie.title}
                      onError={handleImageError}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                </td>
                <td className="px-4 py-3 font-medium text-white align-middle">
                    <div className="text-base font-bold">{movie.title}</div>
                    <div className="text-xs text-gray-500 sm:hidden mt-1">{movie.year}</div>
                </td>
                <td className="px-4 py-3 hidden sm:table-cell align-middle text-gray-400">{movie.year}</td>
                <td className="px-4 py-3 hidden md:table-cell align-middle">
                  <div className="flex flex-wrap gap-1">
                    {movie.genres.map((g, i) => (
                      <span key={i} className="inline-flex items-center rounded-full bg-cinema-900 px-2 py-0.5 text-[10px] font-medium text-gray-300 border border-cinema-700">
                        {g}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3 text-right align-middle">
                  <button 
                    onClick={() => onOpenDetails(movie)}
                    className="inline-flex items-center justify-center rounded-md bg-cinema-accent px-3 py-1.5 text-xs font-bold text-black hover:bg-cinema-accentHover transition-all shadow-lg shadow-amber-500/20 active:scale-95 whitespace-nowrap"
                  >
                    Ver Detalles 🔗
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RecommendationTable;