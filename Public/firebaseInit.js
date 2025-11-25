// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAPT-41_hCuMqUTETpLe-gnzU7o1Q_yZms",
  authDomain: "lachoutlaws-portfolio.firebaseapp.com",
  projectId: "lachoutlaws-portfolio",
  storageBucket: "lachoutlaws-portfolio.appspot.com",
  messagingSenderId: "428200473829",
  appId: "1:428200473829:web:0b6e9bdd019ee66957d00c",
  measurementId: "G-VP7WDWZ4L4",
};

// Initialize Firebase
const firebaseApp = firebase.initializeApp(firebaseConfig);

// Optionally initialize analytics
firebase.analytics();

// Export the initialized Firebase app
export { firebaseApp };
