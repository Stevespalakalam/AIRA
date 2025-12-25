import React, { useState, useEffect } from 'react';
import { Book } from '../types';
import { dbService } from '../services/dbService';
import BookCard from './BookCard';
import { UploadCloudIcon, SpinnerIcon, BookOpenIcon } from './Icons';

// This assumes pdfjsLib is loaded from a CDN and available globally.
declare const pdfjsLib: any;

interface LibraryViewProps {
  onSelectBook: (id: number) => void;
}

const LibraryView = ({ onSelectBook }: LibraryViewProps) => {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const fetchBooks = async () => {
    setLoading(true);
    const storedBooks = await dbService.getAllBooks();
    setBooks(storedBooks);
    setLoading(false);
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  const handleFileChange = async (file: File) => {
    if (!file) return;
    setUploading(true);

    try {
        const arrayBuffer = await file.arrayBuffer();
        
        const pdfJsBuffer = arrayBuffer.slice(0);
        const typedArray = new Uint8Array(pdfJsBuffer);
        const pdfDoc = await pdfjsLib.getDocument(typedArray).promise;

        const now = new Date();
        const newBook: Book = {
            id: now.getTime(),
            title: file.name.replace(/\.pdf$/i, ''),
            pdf: arrayBuffer,
            totalPages: pdfDoc.numPages,
            currentPage: 1,
            createdAt: now,
            updatedAt: now,
        };

        await dbService.addBook(newBook);
        fetchBooks();
    } catch (error) {
        console.error("Error processing PDF:", error);
        alert("Failed to process PDF. Please ensure it's a valid file.");
    } finally {
        setUploading(false);
    }
  };

  const handleDeleteBook = async (id: number) => {
    await dbService.deleteBook(id);
    fetchBooks();
  };

  return (
    <div className="h-full flex flex-col p-4 sm:p-6 lg:p-8">
      <header className="flex-shrink-0 mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
            <h1 className="text-4xl font-serif font-bold text-slate-800">My Library</h1>
            <p className="text-slate-500 mt-1">Select a book to start reading or upload a new one.</p>
        </div>
        <label htmlFor="pdf-upload" className={`mt-4 sm:mt-0 relative cursor-pointer text-white font-semibold py-2 px-5 rounded-lg transition-all duration-300 shadow-md flex items-center gap-2 ${uploading ? 'bg-slate-400' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
            {uploading ? <SpinnerIcon className="w-5 h-5 animate-spin" /> : <UploadCloudIcon className="w-5 h-5"/>}
            <span>{uploading ? 'Processing...' : 'Upload Book'}</span>
            <input id="pdf-upload" type="file" className="sr-only" accept=".pdf" onChange={(e) => e.target.files && handleFileChange(e.target.files[0])} disabled={uploading} />
        </label>
      </header>
      
      <div className="flex-grow overflow-y-auto pr-2">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <SpinnerIcon className="w-10 h-10 animate-spin text-slate-400" />
          </div>
        ) : books.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {books.map(book => (
              <BookCard key={book.id} book={book} onSelect={onSelectBook} onDelete={handleDeleteBook} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 border-2 border-dashed border-slate-300 rounded-xl bg-slate-100/50">
              <BookOpenIcon className="w-20 h-20 mb-4" />
              <h2 className="text-xl font-semibold font-serif text-slate-600">Your Library is Empty</h2>
              <p className="mt-1 max-w-xs">Click the "Upload Book" button to add your first PDF and start your AI-assisted reading journey.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LibraryView;