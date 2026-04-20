// Sentry integration — initializes only if SENTRY_DSN is set
let Sentry;

if (process.env.SENTRY_DSN) {
  Sentry = require("@sentry/node");
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || "development",
    tracesSampleRate: 0.1,
  });
} else {
  // No-op stubs when Sentry is not configured
  Sentry = {
    expressRequestHandler: () => (req, res, next) => next(),
    expressTracingHandler: () => (req, res, next) => next(),
    captureException: () => {},
    expressErrorHandler: () => (err, req, res, next) => next(err),
    Handlers: { requestHandler: () => (req, res, next) => next(), errorHandler: () => (err, req, res, next) => next(err) },
  };
}

module.exports = Sentry;
