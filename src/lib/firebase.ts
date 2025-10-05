// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAjPx4ELoTPuZoxDOPYlsWaHB-wionu2y4",
  authDomain: "deaddropper.firebaseapp.com",
  projectId: "deaddropper",
  storageBucket: "deaddropper.firebasestorage.app",
  messagingSenderId: "874520219276",
  appId: "1:874520219276:web:689343fb63fbd41e8cb5a9",
  measurementId: "G-G5C4RV1C4N"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Analytics (only in browser environment)
let analytics: any = null;
if (typeof window !== 'undefined') {
  analytics = getAnalytics(app);
}

export { app, analytics };
