# End-to-End Data Generation and Testing Guide for Development

This guide outlines exactly how student data is stored, how you can generate fresh datasets for testing, and how to verify the application is working end-to-end (from student interaction to teacher analytics).

---

## 1. Where Student Data is Stored
The application uses a **hybrid data architecture** to guarantee it never crashes during a demo:
1.  **Local Mock Files (Primary for Dev/Testing):** Data is stored in TypeScript files under `c:\argonyx2\apps\student-fe\src\data\`. If the internet drops or Firebase is unconfigured, the app reads directly from here.
    *   `mockStudentTelemetry.ts`: Contains the Student Profiles, Misconception Logs, and Remedial Pods.
    *   `mockDiagnosticData.ts`: Contains the questions and AI scaffolding hints for the tests.
2.  **Firebase Firestore (Live Production):** When connected, `dataService.ts` reads from and writes to Firebase collections (`student_telemetry`, `misconceptions`, `study_plans`).

---

## 2. Generating Pre-Defined Test Data Sets

To thoroughly test the application, you need contrasting student profiles. Instead of writing them manually, use the following prompt with an LLM (like Gemini or ChatGPT) to generate the exact JSON structures required by the app.

### Step 1: Prompt for Generating Student Telemetry Data
*Copy and paste this into an LLM:*
> "Generate a JSON array of 3 mock student profiles matching this TypeScript interface: 
> `interface StudentTelemetryProfile { id: string; name: string; avatar: string; cohort: string; tier: string; discipline: string; masteryScore: number; activeMisconceptions: string[]; resolvedMisconceptionsCount: number; averageVelocitySec: number; hintRelianceIndex: number; learningStyle: string; primaryStumblingBlock: string; recentTrajectory: string; recommendedPeerMatch: string; attendancePct: number; }`
> Make Student 1 a high performer. Make Student 2 an ADHD profile (very fast velocity, high hint reliance, careless errors). Make Student 3 an At-Risk profile (low mastery, plateauing, deep misconceptions). Return ONLY valid JSON."

### Step 2: Injecting the Data
Once you have the JSON array, open `c:\argonyx2\apps\student-fe\src\data\mockStudentTelemetry.ts` and paste the data into the `MOCK_STUDENT_PROFILES` array.

---

## 3. End-to-End Testing Workflow

Once your test data is injected, follow these exact steps to verify the full loop of the application is working.

### Phase A: The Student Loop
1.  **Open the App**: Navigate to `http://localhost:5173/`.
2.  **Act as a Student**: Ensure the top right dropdown says `STUDENT`.
3.  **Take a Diagnostic**: Navigate to the **AI Diagnostic** (`/#diagnostic`). Complete a test.
4.  **Check Adaptive UI**: Navigate to the **Dashboard** (`/#student`). Verify that the Study Plan (`/#plan`) has updated based on the diagnostic results.
5.  **Test Accessibility**: Click the **OpenDyslexic** font toggle in the navbar. Ensure the entire application font changes.

### Phase B: The Teacher Loop
1.  **Switch Roles**: Click your profile picture in the top right and click **"Switch to Faculty Portal"**. The URL will automatically change to `/#teacher`.
2.  **Verify Cohort Analytics**: Ensure the "Overview" page shows the aggregated data of the 3 students you generated. 
3.  **Verify Triage Alerts**: Click on **Live Triage** (`/#teacher-triage`). Verify that "Student 3" (the At-Risk profile you generated) is highlighted in red, alerting the teacher to intervene.
4.  **Verify Interventions**: Click on **Interventions** (`/#teacher-interventions`). Verify that the platform has automatically grouped students with similar `activeMisconceptions` into "Remedial Pods".

---

## 4. Pushing Local Data to Live Firebase (Optional Seeding)
If you want to move your pre-defined local testing data to your live Firebase database so it persists across different computers, you can trigger the automated seeding function.

In your application code, you can temporarily call this function (e.g., attached to a hidden button click):
```typescript
import { dataService } from "../services/dataService";

// Calling this will read all your local mock data and write it directly to Firestore!
await dataService.seedAllCollections();
```
Once seeded, `dataService.ts` will fetch from the live database instead of the local files.
