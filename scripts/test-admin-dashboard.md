# Admin Dashboard Test Checklist

## Pre-Test Setup

- [ ] Firestore rules deployed
- [ ] Admin user created in PostgreSQL
- [ ] Admin document added to Firestore `/admins` collection
- [ ] Environment variables configured
- [ ] Application running locally or deployed

## 1. Admin Login Test

### Test Cases

- [ ] **TC-001: Valid Admin Login**
  - Navigate to `/admin` or login page
  - Enter admin credentials
  - Verify successful login
  - Verify redirect to admin dashboard
  - Verify admin menu/options visible

- [ ] **TC-002: Invalid Credentials**
  - Try login with wrong password
  - Verify error message displayed
  - Verify no redirect occurs

- [ ] **TC-003: Non-Admin User Access**
  - Login with non-admin account
  - Try to access `/admin` routes
  - Verify access denied (403) or redirect

- [ ] **TC-004: Session Persistence**
  - Login as admin
  - Refresh page
  - Verify still logged in
  - Verify admin status maintained

## 2. CRUD Operations Test

### Curriculum Management

- [ ] **TC-101: Create Subject**
  - Navigate to curriculum management
  - Click "Add Subject" or similar
  - Fill in subject details (title, description, exam type)
  - Save
  - Verify subject appears in list
  - Verify subject saved to Firestore

- [ ] **TC-102: Read Subjects**
  - View curriculum list
  - Verify all subjects displayed
  - Verify correct exam type filtering (TYT/AYT)
  - Verify pagination works (if implemented)

- [ ] **TC-103: Update Subject**
  - Select existing subject
  - Edit title or description
  - Save changes
  - Verify changes reflected in UI
  - Verify changes saved to Firestore

- [ ] **TC-104: Delete Subject**
  - Select subject to delete
  - Confirm deletion
  - Verify subject removed from list
  - Verify subject removed from Firestore
  - Verify topics under subject also deleted (cascade)

- [ ] **TC-105: Create Topic**
  - Select a subject
  - Add new topic
  - Fill in topic details (title, hours, difficulty)
  - Save
  - Verify topic appears under subject
  - Verify topic saved to Firestore subcollection

- [ ] **TC-106: Update Topic**
  - Edit existing topic
  - Change estimated hours or difficulty
  - Save
  - Verify changes reflected

- [ ] **TC-107: Delete Topic**
  - Delete a topic
  - Verify removal from UI and Firestore

## 3. AI Features Test

### AYT Curriculum Generation

- [ ] **TC-201: Generate Full AYT Curriculum**
  - Navigate to AI Curriculum Generator
  - Click "Generate AYT Full Curriculum"
  - Wait for AI response (10-30 seconds)
  - Verify JSON response received
  - Verify subjects and topics in response
  - Verify response format matches expected structure

- [ ] **TC-202: Save AI Curriculum to Firestore**
  - After generating curriculum
  - Click "Apply to Firestore" or "Save"
  - Verify success message
  - Check Firestore console
  - Verify data saved to `curriculum/ayt/subjects`
  - Verify topics saved as subcollections

- [ ] **TC-203: Generate Learning Tree**
  - Enter topic title (e.g., "Limit ve Süreklilik")
  - Select subject (e.g., "AYT Matematik")
  - Click "Generate Learning Tree"
  - Verify response with subtopics
  - Verify prerequisites and outcomes present

- [ ] **TC-204: Save Learning Tree**
  - After generating learning tree
  - Save to Firestore
  - Verify saved to correct path: `curriculum/{examType}/subjects/{subjectId}/topics/{topicId}/learningTree`

- [ ] **TC-205: Generate Study Plan**
  - Enter topic title
  - Set total hours (e.g., 8)
  - Set student level (easy/medium/hard)
  - Click "Generate Study Plan"
  - Verify daily plan structure
  - Verify tasks with time allocations

- [ ] **TC-206: Save Study Plan**
  - Save study plan
  - Verify saved to `studyPlans/{userId}/plans`

- [ ] **TC-207: AI Error Handling**
  - Test with invalid input
  - Test with API failure (simulate)
  - Verify error messages displayed
  - Verify application doesn't crash

## 4. Analytics Test (if implemented)

- [ ] **TC-301: View Dashboard Analytics**
  - Navigate to analytics dashboard
  - Verify charts/graphs load
  - Verify data displayed correctly

- [ ] **TC-302: Filter Analytics Data**
  - Apply date range filter
  - Apply exam type filter
  - Verify filtered data displayed

- [ ] **TC-303: Export Analytics**
  - If export feature exists
  - Export data
  - Verify file downloaded
  - Verify file format correct

## 5. Firestore Security Test

- [ ] **TC-401: Non-Admin Write Access**
  - Login as non-admin user
  - Try to write to curriculum collection
  - Verify Firestore rules block write
  - Verify error message

- [ ] **TC-402: Public Read Access**
  - Logout or use incognito
  - Try to read curriculum data
  - Verify read allowed (if rules permit)
  - Verify write blocked

- [ ] **TC-403: Admin Write Access**
  - Login as admin
  - Write to curriculum
  - Verify write succeeds
  - Verify data in Firestore

## 6. Performance Test

- [ ] **TC-501: Page Load Time**
  - Measure admin dashboard load time
  - Should be < 3 seconds

- [ ] **TC-502: AI Generation Time**
  - Measure AI response time
  - Should be < 30 seconds

- [ ] **TC-503: Firestore Query Performance**
  - Load curriculum list
  - Verify queries complete quickly
  - Check for N+1 query issues

## 7. Error Handling Test

- [ ] **TC-601: Network Error Handling**
  - Simulate network failure
  - Verify error messages
  - Verify graceful degradation

- [ ] **TC-602: Invalid Data Handling**
  - Submit invalid form data
  - Verify validation errors
  - Verify no data saved

- [ ] **TC-603: Concurrent Access**
  - Multiple admins editing same data
  - Verify conflict handling
  - Verify data integrity

## Post-Test Verification

- [ ] All test cases passed
- [ ] No console errors
- [ ] No Firestore rule violations
- [ ] Data integrity maintained
- [ ] Performance acceptable

## Test Results Template

```
Test Date: ___________
Tester: ___________
Environment: [ ] Local [ ] Staging [ ] Production

Results Summary:
- Total Tests: ___
- Passed: ___
- Failed: ___
- Skipped: ___

Failed Tests:
1. TC-XXX: Description
   Error: ___________

Notes:
___________
```
