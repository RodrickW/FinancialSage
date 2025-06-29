import type { Request, Response } from 'express';

/**
 * Proxy endpoint to serve Plaid SDK when CDN is blocked
 */
export async function servePlaidSDK(req: Request, res: Response) {
  try {
    console.log('Serving Plaid SDK via proxy...');
    
    const response = await fetch('https://cdn.plaid.com/link/v2/stable/link-initialize.js');
    
    if (!response.ok) {
      throw new Error(`Failed to fetch Plaid SDK: ${response.status}`);
    }
    
    const script = await response.text();
    
    res.setHeader('Content-Type', 'application/javascript');
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.send(script);
    
  } catch (error) {
    console.error('Error proxying Plaid SDK:', error);
    res.status(500).json({ 
      error: 'Failed to load Plaid SDK',
      message: 'Bank connection service temporarily unavailable'
    });
  }
}