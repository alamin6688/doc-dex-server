// Vercel Serverless Function bridge for Express app
// Imports the compiled app from /dist and forwards requests to it.
const appModule = require("../dist/app");
const app = appModule && appModule.default ? appModule.default : appModule;

module.exports = (req, res) => {
  return app(req, res);
};
