
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// TODO: Replace the following with your app's Firebase project configuration
// You can find this in the Firebase Console -> Project Settings -> General -> "Your apps"
const firebaseConfig = {
    apiKey: "AIzaSyBAq8fBdj90AwAUwVmhgPRoJSTgfVYQ4Ws",
    authDomain: "unify-86a30.firebaseapp.com",
    projectId: "unify-86a30",
    storageBucket: "unify-86a30.firebasestorage.app",
    messagingSenderId: "33552757444",
    appId: "1:33552757444:web:1ddb5867a28945a8bf4f91"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;
