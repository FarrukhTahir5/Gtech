const rateLimit = {};

function rateLimiter({ windowMs = 15 * 60 * 1000, max = 100 } = {}) {
  return (req, res, next) => {
    const ip = req.ip || req.socket?.remoteAddress;
    const now = Date.now();

    if (!rateLimit[ip]) {
      rateLimit[ip] = { count: 1, startTime: now };
    } else if (now - rateLimit[ip].startTime > windowMs) {
      rateLimit[ip] = { count: 1, startTime: now };
    } else {
      rateLimit[ip].count++;
    }

    if (rateLimit[ip].count > max) {
      return res.status(429).json({
        success: false,
        error: "Too many requests. Please try again later.",
      });
    }

    // Clean old entries every 100 requests
    if (Object.keys(rateLimit).length > 1000) {
      for (const key in rateLimit) {
        if (now - rateLimit[key].startTime > windowMs) delete rateLimit[key];
      }
    }

    next();
  };
}

// Preset limiters
exports.general = rateLimiter({ windowMs: 60 * 1000, max: 100 }); // 100/min
exports.login = rateLimiter({ windowMs: 15 * 60 * 1000, max: 5 }); // 5 per 15min
exports.register = rateLimiter({ windowMs: 60 * 60 * 1000, max: 10 }); // 10 per hour
