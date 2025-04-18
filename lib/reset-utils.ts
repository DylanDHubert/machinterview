// Global state for reset function
let globalResetCallback: (() => void) | null = null;

// This should be imported and used by the Header component
export function handleGlobalReset() {
  if (globalResetCallback) {
    globalResetCallback();
  }
}

// This should be called from the main component to register the reset callback
export function registerResetCallback(callback: () => void) {
  globalResetCallback = callback;
  return () => {
    globalResetCallback = null;
  };
} 