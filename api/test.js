// Simple test endpoint for Vercel
module.exports = (req, res) => {
  res.json({
    message: "Hello from Vercel!",
    method: req.method,
    url: req.url,
    timestamp: new Date().toISOString()
  });
};
