import type { FirebaseApp } from "firebase/app";
import {
  firebaseApp,
  firestoreDb,
  firebaseConfig,
  firebaseStorage,
  isFirebaseConfigured,
} from "@/firebase/config";

export {
  firebaseApp,
  firestoreDb,
  firebaseConfig,
  firebaseStorage,
  isFirebaseConfigured,
};

export const COLLECTIONS = {
  failureCases: "failure_cases",
  reliabilityStandards: "reliability_standards",
  inspectionItems: "inspection_items",
  fileUploads: "file_uploads",
} as const;

export function getFirebaseApp(): FirebaseApp | null {
  return firebaseApp;
}

export function getDb() {
  return firestoreDb;
}

export function getFirebaseStorage() {
  return firebaseStorage;
}
