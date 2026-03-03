# Firestore Rules, Indexes & TYT Path Seed

Quick guide for deploying Firestore configuration and seeding the TYT learning path.

---

## 1. Deploy Firestore Rules

1. **Open Firebase Console:**
   - https://console.firebase.google.com/project/learnconnect-7c499/firestore/rules

2. **Copy rules:**
   - Open `firestore.rules` in your editor
   - Select all (Ctrl+A) → Copy (Ctrl+C)

3. **Publish:**
   - Click **Edit rules**
   - Paste (Ctrl+V) → **Publish**

---

## 2. Deploy Firestore Indexes

1. **Open Firebase Console:**
   - https://console.firebase.google.com/project/learnconnect-7c499/firestore/indexes

2. **Option A – Firebase CLI (recommended):**
   ```powershell
   firebase deploy --only firestore:indexes
   ```

3. **Option B – Manual:**
   - Click **Add Index**
   - Create each index from `firestore.indexes.json`:
     - `notes`: userId (ASC) + updatedAt (DESC)
     - `studyStats`: userId (ASC) + date (ASC)
     - `userPathProgress`: userId (ASC) + pathId (ASC)
     - `userPathProgress`: userId (ASC) + updatedAt (DESC)
     - `communityPosts`: createdAt (DESC)
     - `certificates`: userId (ASC) + issuedAt (DESC)
     - `certificates`: verificationCode (ASC)
     - `certificates`: userId (ASC) + pathId (ASC)

   Indexes may take a few minutes to build.

---

## 3. Run TYT Path Seed

**Prerequisites:**
- Service account key at `./service-account-key.json` or `./scripts/service-account-key.json`
- Or set `FIREBASE_SERVICE_ACCOUNT_KEY` to the key file path

**Install firebase-admin (one-time, if not already installed):**
```powershell
npm install firebase-admin --save-dev
```

**Run seed** (from project root; key at `./service-account-key.json` or `./scripts/service-account-key.json`):
```powershell
npx ts-node scripts/seed-tyt-learning-path.ts
```

**Expected output:**
```
✅ TYT Matematik 30 Gün path seeded successfully!
   - Document ID: tyt-matematik-30-gun
   - Steps: 8
```

---

## 4. Test Path Completion & Certificate

1. Log in to the app.
2. Go to **Öğrenme Yolları** (`/paths`).
3. Start **TYT Matematik 30 Gün**.
4. Complete all 8 steps (click **Tamamla** on each).
5. After the last step, a certificate should be issued.
6. Go to **Sertifikalarım** (`/certificates`) and confirm the new certificate.
7. Open the verification link and check that it verifies correctly.

---

## 5. Phase 4 – Instructor Course Model

See `PHASE4_INSTRUCTOR_COURSE_PLAN.md` for:
- `courses`, `lessons`, `courseEnrollments` data model
- Instructor UI and Firestore rules
- Certificate issuance flow
- Estimated implementation timeline
