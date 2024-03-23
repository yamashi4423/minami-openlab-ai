// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: String(process.env.NEXT_PUBLIC_FIREBASE_API_KEY),
  authDomain: "minami-chat-system.firebaseapp.com",
  projectId: "minami-chat-system",
  storageBucket: "minami-chat-system.appspot.com",
  messagingSenderId: "785895635809",
  appId: "1:785895635809:web:5a4464f0d098cf808c6320",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
export default db;
