import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyBAq8fBdj90AwAUwVmhgPRoJSTgfVYQ4Ws",
    authDomain: "unify-86a30.firebaseapp.com",
    projectId: "unify-86a30",
    storageBucket: "unify-86a30.firebasestorage.app",
    messagingSenderId: "33552757444",
    appId: "1:33552757444:web:1ddb5867a28945a8bf4f91"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function test() {
    try {
        console.log("Testing write to families/test_doc...");
        await setDoc(doc(db, "families", "test_doc"), { test: true });
        console.log("Write successful.");
    } catch (e) {
        console.error("Write error:", e.message);
    }
    process.exit(0);
}
test();
