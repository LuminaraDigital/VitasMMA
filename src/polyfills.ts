import { Buffer } from 'buffer';

console.log('VitasMMA: polyfills.ts module loading...');

if (typeof window !== 'undefined') {
  // @ts-ignore
  window.Buffer = window.Buffer || Buffer;
  // @ts-ignore
  window.process = window.process || { env: {} };
  // @ts-ignore
  window.global = window;
}

export {};
