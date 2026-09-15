import { getSupabase } from "@/lib/supabaseClient";

export type StudyTrackEventType =
  | "app_opened"
  | "task_completed"
  | "study_log_created"
  | "report_shared";

export async function trackStudyEvent(
  eventType: StudyTrackEventType,
  eventData: Record<string, unknown> = {},
): Promise<void> {
  try {
    const sb = getSupabase();
    const {
      data: { user },
    } = await sb.auth.getUser();
    if (!user) return;
    await sb.from("analytics_events").insert({
      user_id: user.id,
      event_type: eventType,
      event_data: eventData,
    });
  } catch (e) {
    console.warn("analytics track failed", e);
  }
}
