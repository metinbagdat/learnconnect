# LearnConnect - AI-Powered Educational Platform

## Overview
LearnConnect is an AI-powered educational platform designed to provide personalized learning experiences. It offers intelligent study planning, automated enrollment-to-task pipeline automation, AI-generated curriculum, adaptive learning adjustments, and real-time progress tracking. The platform aims to deliver personalized learning paths with cumulative due dates based on lesson durations. Admins can generate structured courses using Claude AI, with adaptation for user levels (beginner/intermediate/advanced). Key capabilities include a smart AI curriculum generator, an automated enrollment pipeline, a student dashboard with smart widgets, an intelligent suggestions engine, and an adaptive learning system.

## Project Status: Phase 1 Complete ✅

**Database Design & Core Architecture:** COMPLETE
- All core tables implemented (Users, Courses, Enrollments)
- Curriculum & Planning tables fully functional (Curriculums, StudyPlans, Modules, Lessons, Assignments)
- Progress Tracking tables operational (UserProgress, Notifications, AISuggestions)

**AI-Powered Pipeline Architecture:** COMPLETE (7/7 Steps)
1. ✅ Enrollment → Create user enrollment record
2. ✅ Curriculum Generation → AI generates or fetches curriculum via Claude 3.5 Sonnet
3. ✅ Study Plan → Creates 30-day personalized study plan with pace-based timeline
4. ✅ Assignment Creation → Generates 15-25 assignments with cumulative due dates
5. ✅ Progress Tracking → Real-time monitoring with completion status and scoring
6. ✅ Notifications → Automated alerts for upcoming/overdue/milestone events
7. ✅ Adaptive Adjustments → Dynamic study plan changes based on performance

Full pipeline accessible via: `POST /api/pipeline/enroll-and-generate`

## User Preferences
I want to prioritize iterative development. Please ask before making major architectural changes or introducing new dependencies. I prefer clear and concise explanations for any complex logic.

## System Architecture

### UI/UX Decisions
The frontend is built with React 18, TypeScript, Shadcn UI, and uses Wouter for routing, ensuring a responsive and modern user interface. The dashboard integrates four smart widgets: ProgressWidget, AISuggestions, StudyTimeline, and PerformanceAnalytics, providing a comprehensive learning overview.

### Technical Implementations
- **AI Curriculum Generator:** Utilizes Claude 3.5 Sonnet to analyze course descriptions and learning objectives, generating modules, lessons, and estimating durations with progressive difficulty. It supports user-level adaptation (admin-specified or auto-adapted by learning pace).
- **Automated Enrollment Pipeline:** A 5-step orchestration process that handles user registration, curriculum generation (or fetching), personalized study plan creation, assignment generation with cumulative due dates, and sending welcome notifications.
- **Intelligent Suggestions Engine:** Analyzes user learning data (completion rates, scores) to generate five types of prioritized, AI-powered suggestions: Learning Path, Resource, Pace, Peer Learning, and Review, each with reasoning.
- **Adaptive Learning System:** Dynamically adjusts study plans and assignment due dates based on real-time performance data, detecting learning patterns (improving/declining/stable) and updating the user's learning pace.
- **Real-time Progress Tracking:** Monitors user progress metrics (scores, time spent) and identifies intervention scenarios like low scores or users getting stuck, triggering alerts or additional resources.
- **Automated Assignment Generation:** Uses Claude AI to generate tailored assignments, including descriptions, instructions, resources, rubrics, and time estimates, adapted to learning styles and difficulty levels.
- **Analytics Dashboard:** Provides platform-wide metrics, tracking pipeline performance, suggestion effectiveness, and user engagement for administrators.

### Core Technologies
- **Frontend:** React 18, TypeScript, Shadcn UI, TanStack Query, Wouter.
- **Backend:** Express.js with TypeScript.
- **Database:** PostgreSQL with Drizzle ORM for type-safe queries.
- **AI/ML:** Claude 3.5 Sonnet (via Anthropic SDK).
- **Validation:** Zod schemas for type safety.
- **Authentication:** Passport.js with session-based authentication and role-based access control.

### System Design Choices
- **Bilingual Support:** Curriculums and module titles support both English and Turkish.
- **Cumulative Due Dates:** Assignment due dates are calculated cumulatively based on lesson durations to prevent task clustering.
- **Role-Based Access Control:** Differentiates between student, instructor, and admin roles for secure access to specific functionalities.
- **Comprehensive Error Handling:** Implemented across all layers with user-friendly notifications.
- **Type Safety:** Enforced throughout the application using TypeScript and Zod validation.

## External Dependencies
- **PostgreSQL:** Primary database for storing all application data.
- **Anthropic SDK:** Used to interact with Claude 3.5 Sonnet for AI functionalities such as curriculum generation, intelligent suggestions, and adaptive learning adjustments.
- **Passport.js:** Authentication middleware for user login and session management.
- **Drizzle ORM:** Object-Relational Mapper for interacting with the PostgreSQL database.