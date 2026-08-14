/// <reference types="vite/client" />

// CSS module declarations — allows import of .css files without TS errors
declare module '*.css';
declare module '*.module.css' {
  const classes: Record<string, string>;
  export default classes;
}

// Image declarations
declare module '*.png';
declare module '*.jpg';
declare module '*.jpeg';
declare module '*.svg';
declare module '*.webp';
declare module 'react-markdown';
