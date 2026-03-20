import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
import { getAnalytics, isSupported } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-analytics.js';
import { initializeAppCheck, ReCaptchaV3Provider } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app-check.js';

const firebaseConfig = {
  apiKey: "AIzaSyAPT-41_hCuMqUTETpLe-gnzU7o1Q_yZms",
  authDomain: "lachoutlaws-portfolio.firebaseapp.com",
  projectId: "lachoutlaws-portfolio",
  storageBucket: "lachoutlaws-portfolio.appspot.com",
  messagingSenderId: "428200473829",
  appId: "1:428200473829:web:0b6e9bdd019ee66957d00c",
  measurementId: "G-VP7WDWZ4L4",
};

const firebaseApp = initializeApp(firebaseConfig);

// App Check — paste your reCAPTCHA v3 site key here
initializeAppCheck(firebaseApp, {
  provider: new ReCaptchaV3Provider('6Lc7ApEsAAAAANAAWBOEnsV78VlG_4IZJggbH5I_'),
  isTokenAutoRefreshEnabled: true
});

const db = getFirestore(firebaseApp);

isSupported().then(supported => {
  if (supported) getAnalytics(firebaseApp);
}).catch(() => { /* ignore */ });

export { firebaseApp, db };