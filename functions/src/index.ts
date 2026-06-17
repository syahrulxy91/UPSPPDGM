import * as admin from "firebase-admin";

// Initialize the Firebase Admin SDK once for the entire backend application,
// which facilitates bypass of firestore security rules when updating documents server-to-server.
if (admin.apps.length === 0) {
  admin.initializeApp();
}

// 1. Two-way synchronization on form status transitions
export { syncBorangToInstitusiTrigger } from "./borangSync";

// 2. Server-side audit logging
export { logBorangCreated, logBorangStatusUpdated } from "./auditLogs";

// 3. Automated reminder calculations (Scheduled & HTTP-trigger fallback)
export { runDailyReminderAnalyzer, triggerReminderAnalyzerManual } from "./reminders";

// 4. Institution real Firebase Auth administrative flows
export {
  bindInstitutionGoogleEmail,
  resetInstitutionGoogleEmail,
  bindOrValidateInstitutionAccess,
  resetInstitutionBinding,
  updateInstitutionActiveStatus,
  deleteInstitutionCompletely,
  getPublicInstitutionsList,
  lookupBoundInstitutionForGoogleUser
} from "./institutionAuth";

// 5. Automated Institusi -> Public Synchronization
export {
  onInstitusiCreated,
  onInstitusiUpdated,
  onInstitusiDeleted
} from "./institusiSync";

