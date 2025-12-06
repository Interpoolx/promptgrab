<?php
/**
 * Universal Debug Middleware for PHP
 * Add this to the top of your index.php or bootstrap file
 */

class DebugContext {
  private static $currentFile = null;
  private static $currentFunction = null;

  public static function init() {
    // Set headers for browser to read
    header('X-Source-File: ' . self::getCurrentFile());
    header('X-Source-Function: ' . self::getCurrentFunction());
    
    // Inject debug.js script
    ob_start();
    echo '<script src="/debug.js"></script>';
    echo '<script>';
    echo 'window.setDebugContext("' . self::getCurrentFile() . '", "' . self::getCurrentFunction() . '");';
    echo '</script>';
    
    register_shutdown_function(function() {
      ob_end_flush();
    });
  }

  public static function setContext($file, $function = null) {
    self::$currentFile = $file;
    self::$currentFunction = $function;
    
    header('X-Source-File: ' . $file);
    if ($function) {
      header('X-Source-Function: ' . $function);
    }
  }

  private static function getCurrentFile() {
    return basename($_SERVER['PHP_SELF']);
  }

  private static function getCurrentFunction() {
    $trace = debug_backtrace();
    foreach ($trace as $frame) {
      if (isset($frame['function']) && $frame['function'] !== '__construct') {
        return $frame['function'];
      }
    }
    return 'unknown';
  }

  public static function wrap($content, $file, $function = null) {
    if ($function) {
      return '<div data-source-file="' . htmlspecialchars($file) . '" data-source-function="' . htmlspecialchars($function) . '">' . $content . '</div>';
    }
    return '<div data-source-file="' . htmlspecialchars($file) . '">' . $content . '</div>';
  }
}

// Initialize on every request
DebugContext::init();
?>
