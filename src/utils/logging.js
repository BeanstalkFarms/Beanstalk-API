class Log {
  // Embellish with timestamp and calling method name
  static info(...messages) {
    const now = new Date();
    const timestamp = now.toISOString();

    // Capture the stack trace to determine the calling method
    const stack = new Error().stack;
    const stackLines = stack.split('\n');
    const callerLine = stackLines[2] || '';
    const callerMatch = callerLine.match(/at (.+) \(.*:(\d+):/);
    const callerMethod = callerMatch ? `${callerMatch[1]}:${callerMatch[2]}` : 'unknown method';

    console.log(`${timestamp} [${callerMethod}]`, ...messages);
  }
}

module.exports = Log;
