/**
 * Firebase Web SDK 초기화 (Vite: VITE_* 환경 변수)
 * @see https://firebase.google.com/docs/web/setup
 */
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";

const cfg = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? "",
};

const canInit = Boolean(cfg.apiKey && cfg.projectId);

if (!canInit && import.meta.env.DEV) {
  console.warn(
    "[firebase/config] VITE_FIREBASE_* 값이 비어 있습니다. .env를 확인하세요.",
  );
}

/** 단일 앱 인스턴스 (없을 때만 생성) */
export const firebaseApp: FirebaseApp | null = canInit
  ? getApps().length > 0
    ? getApps()[0]!
    : initializeApp(cfg)
  : null;

/** Firestore 인스턴스 (앱 미초기화 시 null) */
export const firestoreDb: Firestore | null = firebaseApp
  ? getFirestore(firebaseApp)
  : null;

/** Storage 인스턴스 (앱 미초기화 시 null) */
export const firebaseStorage: FirebaseStorage | null = firebaseApp
  ? getStorage(firebaseApp)
  : null;

export { cfg as firebaseConfig };
export function isFirebaseConfigured(): boolean {
  return canInit;
}
