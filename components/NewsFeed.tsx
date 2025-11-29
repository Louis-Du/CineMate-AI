import React from 'react';
import { NewsItem } from '../types';

interface Props {
  news: NewsItem[];
}

const NewsFeed: React.FC<Props> = ({ news }) => {
  if (!news || news.length === 0) return null;

  return (
    <div className="w-full mt-4">
        <div className="flex items-center gap-2 mb-2 text-cinema-accent border-b border-cinema-700 pb-2">
            <span className="text-xl">📰</span>
            <h3 className="font-bold text-lg uppercase tracking-wider">Noticias Cinematográficas</h3>
            <span className="text-xs text-gray-500 ml-auto">(Actualizado: Hoy)</span>
        </div>
        
        {/* Scrollable Container for News */}
        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
            {news.map((item, index) => (
                <a 
                    key={index} 
                    href={item.url || "#"} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block glass-panel p-4 rounded-lg hover:border-cinema-accent transition-all group relative overflow-hidden"
                >
                    <div className="absolute inset-0 bg-cinema-accent/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    <div className="relative z-10">
                        <div className="flex justify-between items-start gap-3">
                            <h4 className="font-bold text-white text-lg mb-1 group-hover:text-cinema-accent transition-colors">
                                {item.headline}
                                <span className="inline-block ml-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-[-10px] group-hover:translate-x-0">
                                    ↗
                                </span>
                            </h4>
                        </div>
                        <div className="pl-4 border-l-2 border-cinema-700 group-hover:border-cinema-accent transition-colors mt-2">
                            <p className="text-gray-300 italic text-sm leading-relaxed">{item.summary}</p>
                        </div>
                        <div className="mt-3 flex justify-end">
                            <span className="text-xs text-gray-500 font-mono">{item.date}</span>
                        </div>
                    </div>
                </a>
            ))}
        </div>
    </div>
  );
};

export default NewsFeed;