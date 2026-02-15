import { handleOptions, methodNotAllowed, sendJson } from '../_lib/http.js';
import { requireFirebaseUser } from '../_lib/require-user.js';
import { getAppUserByFirebaseUid } from '../_lib/app-user.js';
import { getSql } from '../_lib/neon.js';

export default async function handler(req, res) {
  if (handleOptions(req, res)) return;
  const methodError = methodNotAllowed(req, res, ['GET']);
  if (methodError) return methodError;

  const firebaseUser = await requireFirebaseUser(req, res);
  if (!firebaseUser) return;

  try {
    const appUser = await getAppUserByFirebaseUid(firebaseUser.uid);
    if (!appUser) {
      return sendJson(res, 404, {
        success: false,
        message: 'User is authenticated but not synchronized',
        nextAction: 'POST /api/auth/sync-user',
      });
    }

    const sql = getSql();
    const rows = await sql`
      SELECT
        uc.id,
        uc.course_id AS "courseId",
        uc.progress,
        uc.completed,
        uc.enrolled_at AS "enrolledAt",
        c.title AS "courseTitle",
        c.category AS "courseCategory"
      FROM user_courses uc
      LEFT JOIN courses c ON c.id = uc.course_id
      WHERE uc.user_id = ${appUser.id}
      ORDER BY uc.enrolled_at DESC
      LIMIT 100
    `;

    return sendJson(res, 200, {
      success: true,
      enrollments: rows,
    });
  } catch (error) {
    console.error('me/enrollments error:', error);
    return sendJson(res, 500, {
      success: false,
      message: 'Failed to load enrollments',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
