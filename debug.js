/**
 * Universal Debug Context Injector
 * Auto-detects source file/function/component for any DOM element
 * Include this script early in your HTML (before other scripts)
 */

(function() {
  // Store rendering context globally
  window.__debugContext = {
    currentFile: null,
    currentFunction: null,
    stack: []
  };

  // Auto-detect file from script src
  function detectCurrentFile() {
    if (document.currentScript) {
      return document.currentScript.src.split('/').pop();
    }
    return null;
  }

  // Intercept fetch/XMLHttpRequest to capture server response headers
  const originalFetch = window.fetch;
  window.fetch = function(...args) {
    return originalFetch.apply(this, args).then(response => {
      const sourceFile = response.headers.get('X-Source-File');
      const sourceFunction = response.headers.get('X-Source-Function');
      if (sourceFile) window.__debugContext.currentFile = sourceFile;
      if (sourceFunction) window.__debugContext.currentFunction = sourceFunction;
      return response;
    });
  };

  // Observe all DOM mutations and auto-add data attributes
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) { // Element node
            injectContextAttributes(node);
          }
        });
      }
    });
  });

  function injectContextAttributes(element) {
    // Only add if not already present
    if (!element.dataset.debugInjected) {
      if (window.__debugContext.currentFile) {
        element.dataset.sourceFile = window.__debugContext.currentFile;
      }
      if (window.__debugContext.currentFunction) {
        element.dataset.sourceFunction = window.__debugContext.currentFunction;
      }
      element.dataset.debugInjected = 'true';
    }
  }

  // Start observing when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    });
  } else {
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // Expose API for manual context setting
  window.setDebugContext = function(file, func) {
    window.__debugContext.currentFile = file;
    window.__debugContext.currentFunction = func;
  };

  console.log('Debug context injector loaded');
})();
