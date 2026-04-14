// === FIREBASE CONFIGURATION === 
import { 
    initializeApp 
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";

import { 
    getAuth, 
    onAuthStateChanged, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    GoogleAuthProvider, 
    signInWithPopup 
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";

import {
    getFirestore,
    collection,
    getDocs,
    doc
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";

import {
    getStorage,
    ref,
    getDownloadURL
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-storage.js";


// === YOUR FIREBASE CONFIG ===
const firebaseConfig = {
    apiKey: "AIzaSyABY4_PpsBFULAKGh012QRUhaWBqBVhfJo",
    authDomain: "smart-beauty-platform.firebaseapp.com",
    databaseURL: "https://smart-beauty-platform-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "smart-beauty-platform",
    storageBucket: "smart-beauty-platform.firebasestorage.app",
    messagingSenderId: "875835334083",
    appId: "1:875835334083:web:84c75a3dc79da673303176",
    measurementId: "G-CCKMQ2VMHL"
};


// === INITIALIZE FIREBASE ===
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const provider = new GoogleAuthProvider();

console.log("🔥 Firebase initialized successfully.");


// === STRIPE ===
var stripe = null;
var elements = null; 
const STRIPE_PUBLISHABLE_KEY = 'pk_test_51... (REPLACE WITH YOUR KEY)'; 

if (window.Stripe) {
    if (STRIPE_PUBLISHABLE_KEY.includes('REPLACE WITH YOUR KEY')) {
        console.error("Stripe key is a placeholder. Payments will fail.");
    }
    stripe = Stripe(STRIPE_PUBLISHABLE_KEY); 
} else {
    console.warn("Stripe SDK not loaded. Payment functionality disabled.");
}

// === BACKEND CONFIGURATION ===
const BACKEND_URL = 'https://your-backend.onrender.com';


// === STATE ===
let cart = JSON.parse(localStorage.getItem('sbCart')) || [];
let currentUser = null;
let products = [];
let services = [];
let mapsInitialized = false; 
// ... all the other elements ...

// === DOM ELEMENTS (Using null checks to prevent crashes) ===

// General Layout & Authentication
const appContainer = document.getElementById('appContainer'); 
const unauthenticatedLanding = document.getElementById('unauthenticatedLanding');
const loginModal = document.getElementById('loginModal');
const modalTitle = document.getElementById('modalTitle');
const authBtn = document.getElementById('authBtn');
const authStatus = document.getElementById('authStatus');
const authForm = document.getElementById('authForm');
const googleBtn = document.getElementById('googleBtn');
const switchMode = document.getElementById('switchMode');
const closeLogin = document.getElementById('closeLogin');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');

// Header Controls
const headerAuthBtn = document.getElementById('headerAuthBtn');
const mainHeader = document.getElementById('mainHeader');
const adminBtn = document.getElementById('adminBtn');
const userBtn = document.getElementById('userBtn');
const logoutBtn = document.getElementById('logoutBtn');

// Landing Page CTAs
const openLoginBtn = document.getElementById('openLoginBtn');
const openRegisterBtn = document.getElementById('openRegisterBtn');



// === AUTHENTICATION FLOW ===

/**
 * Function to open the login modal and set the mode (Login/Register)
 */
function openAuthModal(isRegister = false) {
    if (loginModal) {
        loginModal.classList.add("open");
    }

    const modalSubtitle = document.getElementById("modalSubtitle");
    const togglePrefix = document.getElementById("togglePrefix");

    if (isRegister) {
        if (modalTitle) modalTitle.textContent = "Create account";
        if (modalSubtitle) modalSubtitle.textContent = "Email and password.";
        if (authBtn) authBtn.textContent = "Sign up";
        if (togglePrefix) togglePrefix.textContent = "Have account?";
        if (switchMode) switchMode.textContent = "Log in";
    } else {
        if (modalTitle) modalTitle.textContent = "Welcome back";
        if (modalSubtitle) modalSubtitle.textContent = "Sign in to open the checker.";
        if (authBtn) authBtn.textContent = "Log in";
        if (togglePrefix) togglePrefix.textContent = "New?";
        if (switchMode) switchMode.textContent = "Sign up";
    }
    if (authStatus) authStatus.textContent = "";

    const live = document.getElementById("upeo-live-landing");
    if (live) {
        live.textContent = isRegister ? "Sign up form open." : "Log in form open.";
    }
    emailInput?.focus();
}

// MODULAR FIX: Use the imported onAuthStateChanged function
if (auth && onAuthStateChanged) { 
    onAuthStateChanged(auth, (user) => {
        currentUser = user;

        const currentPage = window.location.pathname.split('/').pop().toLowerCase();
        const isLandingPage = (currentPage === '' || currentPage === 'index.html');
        const requiresData = (currentPage === 'chat.html' || currentPage === 'chat.html');

        if (user) {
            if (isLandingPage) {
                window.location.href = "chat.html";
                return;
            }

            if (unauthenticatedLanding) unauthenticatedLanding.classList.add("hidden");
            if (mainHeader) mainHeader.classList.remove("hidden");

            if (headerAuthBtn) headerAuthBtn.classList.add("hidden");
            if (userBtn) {
                userBtn.textContent = user.email ? user.email.split("@")[0] : "User";
                userBtn.classList.remove("hidden");
            }
            if (logoutBtn) logoutBtn.classList.remove("hidden");
            if (cartBtn) cartBtn.classList.remove("hidden");

        } else {
            // --- LOGGED OUT: HANDLE ACCESS & UI ---
            
            if (isLandingPage || !requiresData) {
                if (unauthenticatedLanding) unauthenticatedLanding.classList.remove('hidden');
                if (mainHeader) mainHeader.classList.add('hidden'); 
            }

            if (headerAuthBtn) headerAuthBtn.classList.remove('hidden'); 
            if (userBtn) userBtn.classList.add('hidden');
            if (logoutBtn) logoutBtn.classList.add('hidden');
            if (adminBtn) adminBtn.classList.add('hidden');
            if (cartBtn) cartBtn.classList.add('hidden');
        }
    });
}

// === EVENT LISTENERS ===

// Landing Page CTAs
if (openLoginBtn) openLoginBtn.addEventListener('click', () => openAuthModal(false));
if (openRegisterBtn) openRegisterBtn.addEventListener('click', () => openAuthModal(true));
if (headerAuthBtn) headerAuthBtn.addEventListener('click', () => openAuthModal(false));


// AUTH FORM & CONTROLS (FIXED LOGIN/REGISTER LOGIC)
if (authForm && createUserWithEmailAndPassword && signInWithEmailAndPassword) {
    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = emailInput.value;
        const password = passwordInput.value;
        const isRegister = modalTitle && modalTitle.textContent === "Create account"; 
        
        if (authStatus) authStatus.textContent = '…';

        try {
            if (!auth) throw new Error("Firebase Auth service is not initialized.");

            isRegister
                ? await createUserWithEmailAndPassword(auth, email, password)
                : await signInWithEmailAndPassword(auth, email, password);
                
            if (authStatus) authStatus.textContent = 'Signed in.';
            emailInput.value = '';
            passwordInput.value = '';

        } catch (err) {
            console.error("Authentication Error:", err);
            let errorMessage = "An unknown error occurred.";

            if (err.code) {
                switch(err.code) {
                    case 'auth/user-not-found':
                    case 'auth/wrong-password':
                        errorMessage = 'Invalid email or password.';
                        break;
                    case 'auth/email-already-in-use':
                        errorMessage = 'This email is already registered.';
                        break;
                    case 'auth/invalid-email':
                        errorMessage = 'Invalid email format.';
                        break;
                    case 'auth/weak-password':
                        errorMessage = 'Password should be at least 6 characters.';
                        break;
                    default:
                        errorMessage = err.message || `Authentication failed: ${err.code}`;
                }
            } else if (err.message) {
                 errorMessage = err.message;
            }
            
            if (authStatus) authStatus.textContent = errorMessage;
        }
    });
}

if (googleBtn && signInWithPopup && provider) {
    googleBtn.addEventListener('click', () => {
        signInWithPopup(auth, provider).catch(err => {
            if (authStatus) authStatus.textContent = err.message;
        });
    });
}

if (switchMode) {
    switchMode.addEventListener("click", (e) => {
        e.preventDefault();
        const registering = modalTitle && modalTitle.textContent === "Welcome back";
        openAuthModal(registering);
    });
}

function closeAuthModal() {
    if (loginModal) loginModal.classList.remove("open");
    const live = document.getElementById("upeo-live-landing");
    if (live) live.textContent = "";
}

if (closeLogin) {
    closeLogin.addEventListener("click", () => {
        closeAuthModal();
    });
}

window.addEventListener("click", (event) => {
    if (loginModal && event.target === loginModal) {
        closeAuthModal();
    }
});

// LOGOUT BUTTON
if (logoutBtn && signOut) { 
    logoutBtn.addEventListener('click', async () => {
        if (auth) {
            try {
                await signOut(auth); 
            } catch (error) {
                console.error("Logout failed:", error);
            }
        }
    });
}
