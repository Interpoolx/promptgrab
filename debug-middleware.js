/**
 * Universal Debug Middleware for Express.js / Node.js
 * Usage:
 *   const debugMiddleware = require('./debug-middleware');
 *   app.use(debugMiddleware);
 */

function debugMiddleware(req, res, next) {
  // Store current route/handler info
  const sourceFile = req.path.split('/').pop() || 'index';
  const sourceFunction = req.route?.stack[0]?.name || 'handler';

  // Set headers for browser to read
  res.setHeader('X-Source-File', sourceFile);
  res.setHeader('X-Source-Function', sourceFunction);

  // Store in res locals so templates can access it
  res.locals.sourceFile = sourceFile;
  res.locals.sourceFunction = sourceFunction;
  res.locals.debugContext = {
    file: sourceFile,
    function: sourceFunction
  };

  // Override render to inject debug script
  const originalRender = res.render.bind(res);
  res.render = function(view, options, callback) {
    const injectedOptions = Object.assign({}, options, {
      debugScript: `
        <script src="/debug.js"></script>
        <script>
          window.setDebugContext("${sourceFile}", "${sourceFunction}");
        </script>
      `
    });
    return originalRender(view, injectedOptions, callback);
  };

  next();
}

module.exports = debugMiddleware;
