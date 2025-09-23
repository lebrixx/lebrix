// Production-safe logging utility
const isDevelopment = import.meta.env.DEV;

export const logger = {
  log: (message: string, ...args: any[]) => {
    if (isDevelopment) {
      console.log(message, ...args);
    }
  },
  
  warn: (message: string, ...args: any[]) => {
    if (isDevelopment) {
      console.warn(message, ...args);
    }
  },
  
  error: (message: string, ...args: any[]) => {
    // Always log errors, even in production
    console.error(message, ...args);
  }
};