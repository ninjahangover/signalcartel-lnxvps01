/**
 * JSON Sanitizer Utility
 * 
 * Fixes common JSON serialization issues including Unicode problems
 */

export interface SanitizeOptions {
  maxSize?: number; // Maximum JSON string size in characters
  truncateArrays?: number; // Maximum array length
  truncateStrings?: number; // Maximum string length
  removeNonPrintable?: boolean; // Remove non-printable Unicode characters
}

const DEFAULT_OPTIONS: Required<SanitizeOptions> = {
  maxSize: 100000, // 100KB limit
  truncateArrays: 1000,
  truncateStrings: 10000,
  removeNonPrintable: true
};

/**
 * Sanitizes data before JSON.stringify to prevent serialization errors
 */
export function sanitizeForJSON(data: any, options: SanitizeOptions = {}): any {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  function sanitizeValue(value: any, depth = 0): any {
    // Prevent infinite recursion
    if (depth > 50) {
      return '[MAX_DEPTH_EXCEEDED]';
    }

    if (value === null || value === undefined) {
      return value;
    }

    if (typeof value === 'string') {
      let sanitized = value;
      
      // Remove non-printable Unicode characters including malformed surrogates
      if (opts.removeNonPrintable) {
        sanitized = sanitized.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
        // Fix lone surrogates that cause JSON parsing errors
        sanitized = sanitized.replace(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g, '');
      }
      
      // Truncate long strings
      if (sanitized.length > opts.truncateStrings) {
        sanitized = sanitized.substring(0, opts.truncateStrings) + '...[TRUNCATED]';
      }
      
      return sanitized;
    }

    if (typeof value === 'number') {
      // Handle NaN and Infinity
      if (!isFinite(value)) {
        return value.toString();
      }
      return value;
    }

    if (typeof value === 'boolean') {
      return value;
    }

    if (Array.isArray(value)) {
      const sanitizedArray = value
        .slice(0, opts.truncateArrays)
        .map(item => sanitizeValue(item, depth + 1));
      
      if (value.length > opts.truncateArrays) {
        sanitizedArray.push(`[${value.length - opts.truncateArrays} items truncated]`);
      }
      
      return sanitizedArray;
    }

    if (typeof value === 'object') {
      const sanitized: any = {};
      let count = 0;
      const maxProps = 100; // Limit object properties
      
      for (const [key, val] of Object.entries(value)) {
        if (count >= maxProps) {
          sanitized['[TRUNCATED]'] = `${Object.keys(value).length - maxProps} more properties`;
          break;
        }
        
        const sanitizedKey = typeof key === 'string' ? sanitizeValue(key, depth + 1) : key;
        sanitized[sanitizedKey] = sanitizeValue(val, depth + 1);
        count++;
      }
      
      return sanitized;
    }

    // Handle functions, symbols, etc.
    if (typeof value === 'function') {
      return '[Function]';
    }
    
    if (typeof value === 'symbol') {
      return value.toString();
    }

    return value;
  }

  return sanitizeValue(data);
}

/**
 * Safe JSON.stringify with automatic sanitization
 */
export function safeJSONStringify(data: any, options: SanitizeOptions = {}): string {
  try {
    const sanitized = sanitizeForJSON(data, options);
    const result = JSON.stringify(sanitized);
    
    // Check size limit
    if (options.maxSize && result.length > options.maxSize) {
      console.warn(`JSON output truncated: ${result.length} > ${options.maxSize} characters`);
      return JSON.stringify({
        error: 'JSON_TOO_LARGE',
        originalSize: result.length,
        maxSize: options.maxSize,
        truncatedData: JSON.parse(result.substring(0, options.maxSize - 100))
      });
    }
    
    return result;
  } catch (error) {
    console.error('JSON stringify error:', error);
    return JSON.stringify({
      error: 'JSON_STRINGIFY_ERROR',
      message: error instanceof Error ? error.message : 'Unknown error',
      type: typeof data,
      preview: data ? String(data).substring(0, 100) : 'null'
    });
  }
}

/**
 * Safe JSON.parse with error handling
 */
export function safeJSONParse<T = any>(jsonString: string): { success: true; data: T } | { success: false; error: string } {
  try {
    const data = JSON.parse(jsonString);
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown parsing error'
    };
  }
}

/**
 * Detect if string contains problematic Unicode characters
 */
export function hasProblematicUnicode(str: string): boolean {
  // Check for lone surrogates
  return /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/.test(str);
}