import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyA5yXdwtKlmRV_p_4wY6oXZYCRq1ISmUyw",
  authDomain: "apsmono-projects.firebaseapp.com",
  projectId: "apsmono-projects",
  storageBucket: "apsmono-projects.firebasestorage.app",
  messagingSenderId: "435886458760",
  appId: "1:435886458760:web:166261e07ba53b76945c3d",
  measurementId: "G-T73Z5B78FN",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export { auth, provider };

export async function signInWithGoogle(): Promise<string> {
  const result = await signInWithPopup(auth, provider);
  return result.user.getIdToken();
}

export async function doSignOut(): Promise<void> {
  await signOut(auth);
}

export function onAuthChanged(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

export async function getIdToken(): Promise<string | null> {
  const user = auth.currentUser;
  return user ? user.getIdToken(true) : null;
}

export function currentUser(): User | null {
  return auth.currentUser;
}
