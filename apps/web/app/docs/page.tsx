'use client';

import { useEffect, useState } from 'react';
import { RedocStandalone } from 'redoc';

/**
 * Static API Documentation with Redoc
 * Beautiful, responsive three-panel documentation
 */
export default function DocsPage() {
  const [spec, setSpec] = useState<object | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/openapi.json')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load API spec');
        return res.json();
      })
      .then(setSpec)
      .catch((err) => setError(err.message));
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Error Loading Documentation</h1>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!spec) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading Documentation...</p>
        </div>
      </div>
    );
  }

  return (
    <RedocStandalone
      spec={spec}
      options={{
        theme: {
          colors: {
            primary: {
              main: '#3b82f6',
            },
          },
          typography: {
            fontSize: '15px',
            fontFamily: 'Inter, system-ui, sans-serif',
            headings: {
              fontFamily: 'Inter, system-ui, sans-serif',
              fontWeight: '600',
            },
            code: {
              fontSize: '13px',
              fontFamily: 'JetBrains Mono, Menlo, Monaco, monospace',
            },
          },
          sidebar: {
            backgroundColor: '#f8fafc',
            textColor: '#334155',
            activeTextColor: '#3b82f6',
          },
          rightPanel: {
            backgroundColor: '#1e293b',
          },
        },
        hideDownloadButton: false,
        hideHostname: false,
        expandResponses: '200,201',
        sortPropsAlphabetically: true,
        jsonSampleExpandLevel: 2,
        hideSingleRequestSampleTab: true,
        menuToggle: true,
        nativeScrollbars: true,
      }}
    />
  );
}
