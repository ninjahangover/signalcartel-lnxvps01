import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// Global nonce counter and request queue to prevent concurrent API calls
let lastNonce = 0;
let requestQueue: Promise<any> = Promise.resolve();

function getNextNonce(): number {
  const currentTime = Date.now() * 1000; // Convert to microseconds
  // Ensure nonce is always strictly increasing with a small increment
  lastNonce = Math.max(lastNonce + 1000, currentTime); // Add 1000 microseconds buffer
  return lastNonce;
}

// Queue API requests to prevent concurrent calls
async function queueApiRequest<T>(apiCall: () => Promise<T>): Promise<T> {
  const currentRequest = requestQueue.then(async () => {
    // Add a small delay between requests
    await new Promise(resolve => setTimeout(resolve, 100));
    return apiCall();
  });

  requestQueue = currentRequest.catch(() => {}); // Don't let failed requests break the queue
  return currentRequest;
}

interface KrakenRequestBody {
  endpoint: string;
  params?: Record<string, string | number>;
  apiKey?: string;
  apiSecret?: string;
}

interface RequestOptions {
  method: string;
  headers: Record<string, string>;
  body?: string;
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'POST, OPTIONS'
    }
  });
}

export async function POST(request: NextRequest) {
  console.log('🔍 Kraken Proxy: POST request received');
  
  try {
    let requestBody: KrakenRequestBody;
    
    try {
      const rawBody = await request.text();
      console.log('🔍 Kraken Proxy: Raw request body length:', rawBody.length);
      console.log('🔍 Kraken Proxy: Raw request body preview:', rawBody.substring(0, 200));
      
      if (!rawBody || rawBody.trim().length === 0) {
        console.error('🚨 Kraken Proxy: Empty request body received');
        return NextResponse.json(
          { error: 'Empty request body' },
          { status: 400 }
        );
      }
      
      requestBody = JSON.parse(rawBody);
      console.log('🔍 Kraken Proxy: Parsed request body:', {
        endpoint: requestBody.endpoint,
        hasParams: !!requestBody.params,
        hasApiKey: !!requestBody.apiKey,
        hasApiSecret: !!requestBody.apiSecret
      });
    } catch (parseError) {
      console.error('🚨 Kraken Proxy: JSON parsing failed:', parseError);
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const { endpoint, params, apiKey, apiSecret } = requestBody;

    if (!endpoint) {
      return NextResponse.json(
        { error: 'Endpoint is required' },
        { status: 400 }
      );
    }

    // For public endpoints (like market data), we don't need authentication
    const publicEndpoints = ['AssetPairs', 'Assets', 'Ticker', 'OHLC', 'Depth', 'Trades', 'Spread'];
    const isPublicEndpoint = publicEndpoints.includes(endpoint);

    let url: string;
    let requestOptions: RequestOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Signal Cartel Live/1.0'
      }
    };

    if (isPublicEndpoint) {
      // Public API call
      url = `https://api.kraken.com/0/public/${endpoint}`;
      const queryParams: Record<string, string> = {};
      if (params) {
        for (const [key, value] of Object.entries(params)) {
          queryParams[key] = String(value);
        }
      }
      requestOptions.body = new URLSearchParams(queryParams).toString();
    } else {
      // Private API call - requires authentication and MUST be queued to prevent nonce collisions
      if (!apiKey || !apiSecret) {
        return NextResponse.json(
          { error: 'API key and secret are required for private endpoints' },
          { status: 401 }
        );
      }

      // Queue private API calls to prevent concurrent nonce usage
      return queueApiRequest(async () => {
        try {
          const nonce = getNextNonce();
          console.log(`🌐 Kraken Proxy: Using nonce ${nonce} for ${endpoint}`);

          const postParams: Record<string, string> = { nonce: nonce.toString() };
          if (params) {
            for (const [key, value] of Object.entries(params)) {
              postParams[key] = String(value);
            }
          }
          const postData = new URLSearchParams(postParams).toString();
          const path = `/0/private/${endpoint}`;
          console.log(`🌐 Kraken Proxy: Post data: ${postData}`);

          // Create signature
          console.log(`🌐 Kraken Proxy: Creating signature for ${path}`);
          
          let signature: string;
          try {
            const hash = crypto.createHash('sha256').update(nonce + postData).digest();
            const hmac = crypto.createHmac('sha512', Buffer.from(apiSecret, 'base64'));
            hmac.update(path);
            hmac.update(hash);
            signature = hmac.digest('base64');
            console.log(`🌐 Kraken Proxy: Signature created successfully`);
          } catch (cryptoError) {
            console.error(`🚨 Kraken Proxy: Crypto error:`, cryptoError);
            throw new Error(`Signature generation failed: ${cryptoError instanceof Error ? cryptoError.message : 'Unknown crypto error'}`);
          }

        const url = `https://api.kraken.com${path}`;
        const requestOptions: RequestOptions = {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'Signal Cartel Live/1.0',
            'API-Key': apiKey,
            'API-Sign': signature
          },
          body: postData
        };

          console.log(`🌐 Kraken Proxy: Making queued request to ${url}`);
          const response = await fetch(url, {
            ...requestOptions,
            signal: AbortSignal.timeout(10000) // 10 second timeout
          });
          const data = await response.json();

          console.log(`🌐 Kraken Proxy: Response status ${response.status} from Kraken API`);
          console.log(`🌐 Kraken Proxy: Response data:`, data);

          if (!response.ok) {
            console.error(`🌐 Kraken Proxy: HTTP error ${response.status}`);
            throw new Error(`Kraken API HTTP error: ${response.status}`);
          }

          if (data.error && data.error.length > 0) {
            console.error(`🌐 Kraken Proxy: Kraken API errors:`, data.error);
            throw new Error(`Kraken API error: ${data.error.join(', ')}`);
          }

          return NextResponse.json(data, {
            headers: {
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Headers': 'Content-Type',
              'Access-Control-Allow-Methods': 'POST, OPTIONS'
            }
          });
        } catch (queueError) {
          console.error(`🚨 Kraken Proxy: Queued request error:`, queueError);
          throw queueError;
        }
      });
    }

    // Handle public API calls (no queue needed, no nonce issues)
    console.log(`🌐 Kraken Proxy: Making public API request to ${url}`);
    const response = await fetch(url, {
      ...requestOptions,
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });
    const data = await response.json();

    console.log(`🌐 Kraken Proxy: Public API response status ${response.status}`);

    if (!response.ok) {
      throw new Error(`Kraken API HTTP error: ${response.status}`);
    }

    if (data.error && data.error.length > 0) {
      throw new Error(`Kraken API error: ${data.error.join(', ')}`);
    }

    return NextResponse.json(data, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      }
    });

  } catch (error) {
    console.error('Kraken proxy error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        details: 'Failed to proxy request to Kraken API'
      },
      {
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  }
}
