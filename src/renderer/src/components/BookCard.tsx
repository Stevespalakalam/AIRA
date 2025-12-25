import React from 'react';
import { Book } from '../types';
import { BookOpenIcon, TrashIcon } from './Icons';

interface BookCardProps {
  book: Book;
  onSelect: (id: number) => void;
  onDelete: (id: number) => void;
}

const BookCard = ({ book, onSelect, onDelete }: BookCardProps) => {
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent onSelect from firing
    if (window.confirm(`Are you sure you want to delete "${book.title}"?`)) {
      onDelete(book.id);
    }
  };
  
  const timeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return "Just now";
  }

  return (
    <div 
      className="bg-white rounded-xl p-4 flex flex-col justify-between group cursor-pointer border border-slate-200 hover:border-indigo-400 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
      onClick={() => onSelect(book.id)}
    >
      <div>
        <div className="flex justify-center items-center bg-slate-100 rounded-lg h-40 mb-4 border border-slate-200">
            <BookOpenIcon className="w-16 h-16 text-slate-400 group-hover:text-indigo-500 transition-colors" />
        </div>
        <h3 className="font-serif font-bold text-slate-800 truncate text-lg">{book.title}</h3>
        <p className="text-sm text-slate-500">
            {book.totalPages} pages
        </p>
      </div>
      <div className="mt-4 flex justify-between items-center">
        <p className="text-xs text-slate-400">
            Last read: {timeAgo(book.updatedAt)}
        </p>
        <button
            onClick={handleDelete}
            className="p-2 rounded-full text-slate-400 hover:bg-red-100 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
            aria-label="Delete book"
        >
            <TrashIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default BookCard;
