import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";


const firebaseConfig = {
  apiKey: "AIzaSyABY4_PpsBFULAKGh012QRUhaWBqBVhfJo",
  authDomain: "upeo-ai.firebaseapp.com",
  databaseURL: "https://upeo-ai-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "upeo-ai",
  storageBucket: "upeo-ai.firebasestorage.app",
  messagingSenderId: "875835334083",
  appId: "1:875835334083:web:84c75a3dc79da673303176",
  measurementId: "G-CCKMQ2VMHL",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "index.html";
  }
});

document.getElementById("chatLogoutBtn")?.addEventListener("click", async () => {
  try {
    await signOut(auth);
  } catch (e) {
    console.error(e);
  }
  window.location.href = "index.html";
});
