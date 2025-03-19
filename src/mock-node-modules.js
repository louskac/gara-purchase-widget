// src/mock-node-modules.js

// Performance from perf_hooks
export const performance = { 
    now: () => Date.now() 
  };
  
  // Default exports needed by Node modules
  const crypto = {
    randomBytes: (size) => new Uint8Array(size),
    createHash: () => ({
      update: () => ({
        digest: () => 'mock-hash'
      })
    })
  };
  
  const os = {
    platform: () => 'browser',
    cpus: () => [{ model: 'Browser CPU' }]
  };
  
  const fs = {
    readFileSync: () => null
  };
  
  const stream = {
    Duplex: class Duplex {}
  };
  
  const net = {
    connect: () => null
  };
  
  const tls = {
    connect: () => null
  };
  
  const path = {
    join: (...args) => args.join('/'),
    resolve: (...args) => args.join('/')
  };
  
  // Export everything individually and as default
  export { crypto, os, fs, stream, net, tls, path };
  export default { crypto, os, fs, stream, net, tls, path, performance };