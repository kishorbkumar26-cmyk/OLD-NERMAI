import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { initializeAuth, getAuth, getReactNativePersistence } from '@firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyC5vOGWLIC_dieEagnTcPLP533_xCmlsQA",
  authDomain: "nermai-academy-backend.firebaseapp.com",
  projectId: "nermai-academy-backend",
  storageBucket: "nermai-academy-backend.appspot.com",
  // NOTE: These are intentionally omitted to avoid crashes from invalid placeholder values.
  // Firebase Firestore works correctly without messagingSenderId/appId.
};

let app;
let auth;

if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage)
  });
} else {
  app = getApps()[0];
  auth = getAuth(app);
}

export { app, auth };
export const db = getFirestore(app);
