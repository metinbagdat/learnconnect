# LearnConnect / eğitim.today - Scope Definition

## ✅ CRITICAL FEATURES (Must Work Now)
- Student dashboard (basic view)
- User authentication (login/register)
- Course enrollment
- Basic study plan generation
- AI adaptive plan (core functionality)
- Health check endpoints
- Basic course catalog

## ⚠️ NON-CRITICAL / EXPERIMENTAL (Can Be Disabled)
- Advanced analytics dashboards
- Smart-suggestions advanced features
- Experimental curriculum designer
- Advanced AI endpoints (behind `ENABLE_ADVANCED_AI` flag)
- Course control advanced features
- Lesson trail service advanced features
- AI daily plan service
- Entrance exam service advanced features
- Enrollment service advanced features

## 📋 ACCEPTANCE CRITERIA
- ✅ Clean `tsc --noEmit` on core code (target: < 50 errors in core modules)
- ✅ No red errors in browser console on `egitim.today`
- ✅ Health and AI endpoints green from PowerShell tests
- ✅ Basic flows usable end-to-end (auth → dashboard → enrollment → study plan)

## 🔧 EXPERIMENTAL MODULES (Currently Disabled via Feature Flag)
- `server/smart-suggestions/*` (most endpoints behind `ENABLE_ADVANCED_AI`)
- `server/course-control/*` (advanced features)
- `server/lesson-trail-service.ts` (advanced features)
- `server/ai-daily-plan-service.ts`
- `server/entrance-exam-service.ts` (advanced features)
- `server/enrollment-service.ts` (advanced features)
