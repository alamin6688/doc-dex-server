// Vercel Serverless Function bridge for Express app
// Imports the compiled app from /dist and forwards requests to it.
let app;

try {
  const appModule = require("../dist/app");
  app = appModule && appModule.default ? appModule.default : appModule;
} catch (err) {
  console.error("Failed to load app module:", err);
  // Return a meaningful error if the app fails to load
  app = (req, res) => {
    res.status(500).json({
      error: "Server failed to initialize",
      message: err.message,
    });
  };
}

module.exports = (req, res) => {
  return app(req, res);
};
