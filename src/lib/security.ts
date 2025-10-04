/**
 * Security Utilities
 * 
 * Fornece funções de segurança para:
 * - Sanitização de inputs
 * - Validação de dados
 * - Prevenção de XSS
 * - Rate limiting no cliente
 */

/**
 * Sanitiza string removendo caracteres perigosos para XSS
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';
  
  return input
    .replace(/[<>]/g, '') // Remove < e >
    .replace(/javascript:/gi, '') // Remove javascript:
    .replace(/on\w+=/gi, '') // Remove event handlers
    .replace(/&lt;script&gt;/gi, '') // Remove <script> encoded
    .trim();
}

/**
 * Valida e sanitiza URLs
 */
export function sanitizeUrl(url: string): string {
  if (!url) return '';
  
  try {
    const parsed = new URL(url);
    
    // Apenas permite https e http
    if (!['https:', 'http:'].includes(parsed.protocol)) {
      return '';
    }
    
    return parsed.toString();
  } catch {
    return '';
  }
}

/**
 * Valida email
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Rate limiter no cliente para prevenir spam
 */
export class ClientRateLimiter {
  private requests: Map<string, number[]> = new Map();
  private readonly windowMs: number;
  private readonly maxRequests: number;

  constructor(windowMs: number = 60000, maxRequests: number = 10) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
  }

  isAllowed(key: string): boolean {
    const now = Date.now();
    const timestamps = this.requests.get(key) || [];
    
    // Remove timestamps antigos
    const validTimestamps = timestamps.filter(
      timestamp => now - timestamp < this.windowMs
    );
    
    // Verifica se atingiu o limite
    if (validTimestamps.length >= this.maxRequests) {
      return false;
    }
    
    // Adiciona novo timestamp
    validTimestamps.push(now);
    this.requests.set(key, validTimestamps);
    
    return true;
  }

  getRemainingRequests(key: string): number {
    const now = Date.now();
    const timestamps = this.requests.get(key) || [];
    const validTimestamps = timestamps.filter(
      timestamp => now - timestamp < this.windowMs
    );
    
    return Math.max(0, this.maxRequests - validTimestamps.length);
  }

  reset(key: string): void {
    this.requests.delete(key);
  }
}

/**
 * Valida tamanho de arquivo
 */
export function validateFileSize(file: File, maxSizeMB: number = 10): boolean {
  const maxSize = maxSizeMB * 1024 * 1024; // Converte MB para bytes
  return file.size <= maxSize;
}

/**
 * Valida tipo de arquivo
 */
export function validateFileType(file: File, allowedTypes: string[]): boolean {
  return allowedTypes.some(type => {
    if (type.endsWith('/*')) {
      return file.type.startsWith(type.replace('/*', ''));
    }
    return file.type === type;
  });
}

/**
 * Gera hash simples de string (para identificadores únicos)
 */
export function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Previne ataques de timing
 */
export function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  
  return result === 0;
}

/**
 * Escapa caracteres HTML
 */
export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  
  return text.replace(/[&<>"']/g, m => map[m]);
}

/**
 * Valida comprimento de string
 */
export function validateLength(
  str: string,
  min: number = 0,
  max: number = 10000
): boolean {
  return str.length >= min && str.length <= max;
}

/**
 * Remove tags HTML de string
 */
export function stripHtml(html: string): string {
  const tmp = document.createElement('DIV');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}
