#!/usr/bin/env node
/**
 * Mock Authentication Server for FDX Resource API Testing
 * Provides JWKS endpoint and basic OAuth-like functionality for development
 */

import http from 'http';

const PORT = process.env.PORT || 3000;

// Mock JWKS response
const jwks = {
  keys: [
    {
      kty: 'RSA',
      use: 'sig',
      kid: 'mock-key-1',
      n: 'mock-modulus-value',
      e: 'AQAB',
      alg: 'RS256'
    }
  ]
};

// Mock server responses
const routes = {
  '/.well-known/jwks.json': () => ({
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(jwks, null, 2)
  }),
  
  '/.well-known/openid_configuration': () => ({
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      issuer: 'https://mock-fdx-auth.example.com',
      authorization_endpoint: 'https://mock-fdx-auth.example.com/oauth/authorize',
      token_endpoint: 'https://mock-fdx-auth.example.com/oauth/token',
      jwks_uri: 'https://mock-fdx-auth.example.com/.well-known/jwks.json',
      response_types_supported: ['code'],
      subject_types_supported: ['public'],
      id_token_signing_alg_values_supported: ['RS256'],
      scopes_supported: [
        'openid',
        'accounts:read',
        'transactions:read',
        'contact:read',
        'payment_networks:read',
        'statements:read'
      ]
    }, null, 2)
  }),
  
  '/health': () => ({
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      status: 'ok',
      service: 'mock-auth-server',
      timestamp: new Date().toISOString()
    })
  }),
  
  '/oauth/token': () => ({
    status: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      access_token: 'mock-access-token',
      token_type: 'Bearer',
      expires_in: 3600,
      scope: 'accounts:read transactions:read'
    })
  })
};

// Create HTTP server
const server = http.createServer((req, res) => {
  const url = req.url;
  const method = req.method;
  
  // Sanitize and log request
  const sanitizedMethod = method?.replace(/[^\w-]/g, '') || 'UNKNOWN';
  const sanitizedUrl = url?.replace(/[^\w\-\/.?=&]/g, '') || '/unknown';
  console.log(`${new Date().toISOString()} - ${sanitizedMethod} ${sanitizedUrl}`);
  
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  // Route handling with validation
  const route = routes[url];
  if (route && typeof route === 'function') {
    const response = route();
    res.writeHead(response.status, response.headers);
    res.end(response.body);
  } else {
    // 404 for unknown routes
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      error: 'not_found',
      error_description: `Route ${url} not found`
    }));
  }
});

// Start server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Mock Auth Server running on port ${PORT}`);
  console.log(`Available endpoints:`);
  console.log(`  GET  /.well-known/jwks.json`);
  console.log(`  GET  /.well-known/openid_configuration`);
  console.log(`  GET  /health`);
  console.log(`  POST /oauth/token`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');  
    process.exit(0);
  });
});