'use client';

import { useEffect, useState } from 'react';
import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';

/**
 * Interactive API Documentation with Swagger UI
 * Allows developers to explore and test API endpoints
 */
export default function ApiDocsPage() {
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
          <h1 className="text-2xl font-bold text-red-600 mb-2">Error Loading API Documentation</h1>
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
          <p className="text-gray-600">Loading API Documentation...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="swagger-wrapper">
      <style jsx global>{`
        .swagger-wrapper {
          min-height: 100vh;
        }
        .swagger-ui .topbar {
          display: none;
        }
        .swagger-ui .info {
          margin: 20px 0;
        }
        .swagger-ui .info .title {
          color: #1e293b;
        }
        .swagger-ui .scheme-container {
          background: #f1f5f9;
          padding: 15px;
        }
        .swagger-ui .opblock-tag {
          font-size: 1.1rem;
          font-weight: 600;
          color: #334155;
        }
        .swagger-ui .opblock-summary-method {
          font-size: 0.75rem;
          font-weight: 700;
          min-width: 70px;
        }
        .swagger-ui .btn.authorize {
          background-color: #3b82f6;
          color: white;
          border-color: #3b82f6;
        }
        .swagger-ui .btn.authorize svg {
          fill: white;
        }
      `}</style>
      <SwaggerUI
        spec={spec}
        docExpansion="list"
        defaultModelsExpandDepth={0}
        persistAuthorization={true}
        tryItOutEnabled={process.env.NODE_ENV !== 'production'}
        supportedSubmitMethods={
          process.env.NODE_ENV !== 'production'
            ? ['get', 'post', 'put', 'patch', 'delete']
            : ['get']
        }
      />
    </div>
  );
}
