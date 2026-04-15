'use client';

import { useState } from 'react';
import Papa from 'papaparse';

export default function Home() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleScrape = async () => {
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ targetUrl: url }),
      });

      const result = await response.json();

      if (result.success && result.data.length > 0) {
        setMessage(`Successfully scraped ${result.data.length} products! Downloading CSV...`);
        downloadCSV(result.data);
      } else {
        setMessage('No products found or check the URL.');
      }
    } catch (error) {
      setMessage('An error occurred during scraping.');
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = (data: any[]) => {
    // JSON ke CSV te convert kora PapaParse diye
    const csv = Papa.unparse(data);
    
    // File download er jonno Blob toiri kora
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', 'shopify_export.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <main className="min-h-screen p-10 bg-gray-50 flex flex-col items-center">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-2xl mt-20">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">WordPress to Shopify Scraper</h1>
        
        <div className="flex flex-col gap-4">
          <label className="text-sm font-medium text-gray-700">WooCommerce Shop Page URL:</label>
          <input
            type="text"
            placeholder="https://example.com/shop"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="border border-gray-300 p-3 rounded-md w-full text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          
          <button
            onClick={handleScrape}
            disabled={loading || !url}
            className={`p-3 rounded-md text-white font-bold transition-all ${
              loading || !url ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {loading ? 'Scraping Data...' : 'Scrape & Download CSV'}
          </button>
        </div>

        {message && (
          <div className="mt-6 p-4 bg-blue-50 text-blue-800 rounded-md border border-blue-200">
            {message}
          </div>
        )}
      </div>
    </main>
  );
}