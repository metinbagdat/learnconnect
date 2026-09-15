/**
 * User gamification data: XP, level, streak, badges.
 */
import { getUserFromRequest } from '../lib/session-auth.js';
import { getSql, hasDb } from '../lib/db.js';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  const user = getUserFromRequest(req);
  if (!user || !user.id) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  try {
    if (!hasDb()) {
      return res.status(200).json({
        level: 1,
        currentXp: 0,
        totalXp: 0,
        nextLevelXp: 500,
        streak: 0,
        badgeCount: 0,
        badges: [],
      });
    }
    const sql = getSql();
    const levelRows = await sql`SELECT level, current_xp as "currentXp", total_xp as "totalXp", next_level_xp as "nextLevelXp", streak FROM user_levels WHERE user_id = ${user.id} LIMIT 1`;
    const levelData = levelRows?.[0] || {
      level: 1,
      currentXp: 0,
      totalXp: 0,
      nextLevelXp: 500,
      streak: 0,
    };
    let badgeCount = 0;
    try {
      const badgeRows = await sql`SELECT COUNT(*) as count FROM user_achievements WHERE user_id = ${user.id}`;
      badgeCount = Number(badgeRows?.[0]?.count ?? 0);
    } catch (e) {
      // table may not exist
    }
    return res.status(200).json({
      ...levelData,
      badgeCount,
      badges: [],
    });
  } catch (err) {
    console.error('[user/gamification]', err);
    return res.status(500).json({ message: 'Failed to fetch gamification data' });
  }
}
