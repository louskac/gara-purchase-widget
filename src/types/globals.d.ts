// src/types/globals.d.ts
declare global {
    interface Window {
      gtag?: (...args: any[]) => void;
      fbq?: (...args: any[]) => void;
    }
    
    // Add these global variable declarations
    var gtag: (...args: any[]) => void;
    var fbq: (...args: any[]) => void;
  }
  
  // This export is needed to make the file a module
  export {};