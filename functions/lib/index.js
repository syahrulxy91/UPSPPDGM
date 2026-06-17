"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.onInstitusiDeleted = exports.onInstitusiUpdated = exports.onInstitusiCreated = exports.lookupBoundInstitutionForGoogleUser = exports.getPublicInstitutionsList = exports.deleteInstitutionCompletely = exports.updateInstitutionActiveStatus = exports.resetInstitutionBinding = exports.bindOrValidateInstitutionAccess = exports.resetInstitutionGoogleEmail = exports.bindInstitutionGoogleEmail = exports.triggerReminderAnalyzerManual = exports.runDailyReminderAnalyzer = exports.logBorangStatusUpdated = exports.logBorangCreated = exports.syncBorangToInstitusiTrigger = void 0;
const app_1 = require("firebase-admin/app");
// Initialize the Firebase Admin SDK once for the entire backend application,
// which facilitates bypass of firestore security rules when updating documents server-to-server.
(0, app_1.initializeApp)();
// 1. Two-way synchronization on form status transitions
var borangSync_1 = require("./borangSync");
Object.defineProperty(exports, "syncBorangToInstitusiTrigger", { enumerable: true, get: function () { return borangSync_1.syncBorangToInstitusiTrigger; } });
// 2. Server-side audit logging
var auditLogs_1 = require("./auditLogs");
Object.defineProperty(exports, "logBorangCreated", { enumerable: true, get: function () { return auditLogs_1.logBorangCreated; } });
Object.defineProperty(exports, "logBorangStatusUpdated", { enumerable: true, get: function () { return auditLogs_1.logBorangStatusUpdated; } });
// 3. Automated reminder calculations (Scheduled & HTTP-trigger fallback)
var reminders_1 = require("./reminders");
Object.defineProperty(exports, "runDailyReminderAnalyzer", { enumerable: true, get: function () { return reminders_1.runDailyReminderAnalyzer; } });
Object.defineProperty(exports, "triggerReminderAnalyzerManual", { enumerable: true, get: function () { return reminders_1.triggerReminderAnalyzerManual; } });
// 4. Institution real Firebase Auth administrative flows
var institutionAuth_1 = require("./institutionAuth");
Object.defineProperty(exports, "bindInstitutionGoogleEmail", { enumerable: true, get: function () { return institutionAuth_1.bindInstitutionGoogleEmail; } });
Object.defineProperty(exports, "resetInstitutionGoogleEmail", { enumerable: true, get: function () { return institutionAuth_1.resetInstitutionGoogleEmail; } });
Object.defineProperty(exports, "bindOrValidateInstitutionAccess", { enumerable: true, get: function () { return institutionAuth_1.bindOrValidateInstitutionAccess; } });
Object.defineProperty(exports, "resetInstitutionBinding", { enumerable: true, get: function () { return institutionAuth_1.resetInstitutionBinding; } });
Object.defineProperty(exports, "updateInstitutionActiveStatus", { enumerable: true, get: function () { return institutionAuth_1.updateInstitutionActiveStatus; } });
Object.defineProperty(exports, "deleteInstitutionCompletely", { enumerable: true, get: function () { return institutionAuth_1.deleteInstitutionCompletely; } });
Object.defineProperty(exports, "getPublicInstitutionsList", { enumerable: true, get: function () { return institutionAuth_1.getPublicInstitutionsList; } });
Object.defineProperty(exports, "lookupBoundInstitutionForGoogleUser", { enumerable: true, get: function () { return institutionAuth_1.lookupBoundInstitutionForGoogleUser; } });
// 5. Automated Institusi -> Public Synchronization
var institusiSync_1 = require("./institusiSync");
Object.defineProperty(exports, "onInstitusiCreated", { enumerable: true, get: function () { return institusiSync_1.onInstitusiCreated; } });
Object.defineProperty(exports, "onInstitusiUpdated", { enumerable: true, get: function () { return institusiSync_1.onInstitusiUpdated; } });
Object.defineProperty(exports, "onInstitusiDeleted", { enumerable: true, get: function () { return institusiSync_1.onInstitusiDeleted; } });
//# sourceMappingURL=index.js.map