export const handler = async (event, context) => {
  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
      },
      body: '',
    };
  }

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // Get API key from environment variable and trim whitespace
    const apiKey = process.env.OPENAI_API_KEY?.trim();
    
    if (!apiKey) {
      // Never log the actual key or any sensitive info
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          error: 'Service configuration error',
          message: 'API service is not properly configured. Please set OPENAI_API_KEY in Netlify environment variables.'
        }),
      };
    }

    // Validate API key format (should start with sk-)
    if (!apiKey.startsWith('sk-')) {
      return {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          error: 'Invalid API key format',
          message: 'API key format is incorrect. Please check your OPENAI_API_KEY in Netlify environment variables.'
        }),
      };
    }

    // Parse request body
    let requestBody;
    try {
      requestBody = JSON.parse(event.body);
    } catch (parseError) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Invalid JSON in request body' }),
      };
    }

    const { messages, model = 'gpt-3.5-turbo', max_tokens = 150, temperature = 0.7 } = requestBody;

    if (!messages || !Array.isArray(messages)) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: 'Messages array is required' }),
      };
    }

    // Make request to OpenAI API using native fetch
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        max_tokens: max_tokens,
        temperature: temperature
      })
    });

    const data = await response.json();

    if (!response.ok) {
      // Log error without exposing API key or sensitive data
      const errorMessage = data?.error?.message || 'API request failed';
      // Sanitize error message to remove any potential key exposure
      const sanitizedError = errorMessage.replace(/sk-[a-zA-Z0-9]+/g, '[REDACTED]');
      
      return {
        statusCode: response.status,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          error: 'API request failed',
          message: sanitizedError
        }),
      };
    }

    // Return successful response
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    };
  } catch (error) {
    // Log error without exposing sensitive information
    const errorMessage = error.message || 'Unknown error';
    // Sanitize error message to remove any potential key exposure
    const sanitizedError = errorMessage.replace(/sk-[a-zA-Z0-9]+/g, '[REDACTED]');
    
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: sanitizedError
      }),
    };
  }
};

