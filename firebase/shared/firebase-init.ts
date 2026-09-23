// Canonical Firebase client SDK bootstrap for the workspace. Copy into each frontend
// project (it can't be imported across submodule boundaries) and adjust imports to the
// project's bundler. Requires `firebase` ^10 as a dependency.
//
// The web config is PUBLIC (it already ships in dashboard/shared/firebase-config.js).
// App Check + security rules — not config secrecy — are what protect the backend.

import { initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getStorage, type FirebaseStorage } from "firebase/storage";
import { getAnalytics, isSupported as analyticsSupported } from "firebase/analytics";
import {
  initializeAppCheck,
  ReCaptchaV3Provider,
  type AppCheck,
} from "firebase/app-check";

export const firebaseConfig = {
  apiKey: "AIzaSyA5yXdwtKlmRV_p_4wY6oXZYCRq1ISmUyw",
  authDomain: "apsmono-projects.firebaseapp.com",
  projectId: "apsmono-projects",
  storageBucket: "apsmono-projects.firebasestorage.app",
  messagingSenderId: "435886458760",
  appId: "1:435886458760:web:166261e07ba53b76945c3d",
  measurementId: "G-T73Z5B78FN",
};

// Replace with the reCAPTCHA v3 site key from Firebase Console > App Check.
const RECAPTCHA_V3_SITE_KEY = "REPLACE_WITH_RECAPTCHA_V3_SITE_KEY";

export interface FirebaseClient {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
  storage: FirebaseStorage;
  appCheck?: AppCheck;
}

export function initFirebase(opts: { enableAppCheck?: boolean } = {}): FirebaseClient {
  const app = initializeApp(firebaseConfig);

  let appCheck: AppCheck | undefined;
  if (opts.enableAppCheck && RECAPTCHA_V3_SITE_KEY !== "REPLACE_WITH_RECAPTCHA_V3_SITE_KEY") {
    appCheck = initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(RECAPTCHA_V3_SITE_KEY),
      isTokenAutoRefreshEnabled: true,
    });
  }

  // Analytics is browser-only and unsupported in some contexts (SSR, some webviews).
  analyticsSupported().then((ok) => {
    if (ok) getAnalytics(app);
  });

  return {
    app,
    auth: getAuth(app),
    db: getFirestore(app),
    storage: getStorage(app),
    appCheck,
  };
}
