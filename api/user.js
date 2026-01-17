// api/user.js - ES MODULE FORMAT
// Simplest possible version - no dependencies
export default function handler(req, res) {
  res.status(200).json({
    ok: true,
    user: "Test User"
  });
}
