'use client';

import { useState } from 'react';

export default function Home() {
  const [content, setContent] = useState('');
  const [ttl, setTtl] = useState<string>('');
  const [maxViews, setMaxViews] = useState<string>('');
  const [result, setResult] = useState<{ id: string; url: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResult(null);
    setError(null);
    setLoading(true);

    try {
      const payload: any = { content };
      if (ttl) payload.ttl_seconds = parseInt(ttl, 10);
      if (maxViews) payload.max_views = parseInt(maxViews, 10);

      const res = await fetch('/api/pastes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create paste');
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="bg-blue-600 px-6 py-4">
          <h1 className="text-xl font-bold text-white">Pastebin Lite</h1>
          <p className="text-blue-100 text-sm">Share text securely</p>
        </div>

        <div className="p-6">
          {!result ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Content
                </label>
                <textarea
                  required
                  className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  placeholder="Paste your text here..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    TTL (Seconds)
                  </label>
                  <input
                    type="number"
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    placeholder="Optional"
                    value={ttl}
                    onChange={(e) => setTtl(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Views
                  </label>
                  <input
                    type="number"
                    min="1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    placeholder="Optional"
                    value={maxViews}
                    onChange={(e) => setMaxViews(e.target.value)}
                  />
                </div>
              </div>

              {error && (
                <div className="text-red-600 text-sm bg-red-50 p-2 rounded">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Paste'}
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="bg-green-50 p-4 rounded border border-green-200">
                <p className="text-green-800 font-medium">Paste created successfully!</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Share URL
                </label>
                <div className="flex gap-2">
                  <input
                    readOnly
                    value={result.url}
                    className="flex-1 px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-600 text-sm"
                  />
                  <button
                    onClick={() => navigator.clipboard.writeText(result.url)}
                    className="px-3 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 text-sm"
                  >
                    Copy
                  </button>
                </div>
              </div>

              <div className="flex gap-2">
                 <a
                    href={result.url}
                    target="_blank"
                    className="flex-1 block text-center bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 text-sm"
                 >
                    View Paste
                 </a>
                 <button
                    onClick={() => { setResult(null); setContent(''); setTtl(''); setMaxViews(''); }}
                    className="flex-1 block text-center bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-50 text-sm"
                 >
                    Create Another
                 </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
