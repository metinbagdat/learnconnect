// api/health.js - ES MODULE FORMAT
// Simplest possible version - no dependencies
export default function handler(req, res) {
  res.status(200).json({ status: "ok" });
}
