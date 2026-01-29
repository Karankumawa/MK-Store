const API_URL = 'http://localhost:5000/api/auth';

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyDM8ljwNFw9NaIgNvF4By40hWR9vi7hyis",
    authDomain: "m-k-store-b0fc9.firebaseapp.com",
    projectId: "m-k-store-b0fc9",
    storageBucket: "m-k-store-b0fc9.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase
try {
    firebase.initializeApp(firebaseConfig);
    console.log('Firebase initialized');
} catch (error) {
    console.error('Firebase initialization error:', error);
}

// Google Login Function
function googleLogin() {
    const provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithPopup(provider)
        .then((result) => {
            const user = result.user;
            console.log("Google Login User:", user);

            // Store basic user info
            const userData = {
                name: user.displayName,
                email: user.email,
                photo: user.photoURL,
                uid: user.uid,
                role: 'user' // Default to user
            };

            // You might want to send this token to your backend to verify and create a session
            user.getIdToken().then((idToken) => {
                // Determine API endpoint - optionally send to backend for verification
                // For now, client-side only demo logic:
                localStorage.setItem('token', idToken);
                localStorage.setItem('user', JSON.stringify(userData));

                alert(`Welcome, ${user.displayName}!`);
                window.location.href = 'index.html';
            });

        }).catch((error) => {
            console.error("Google Login Error:", error);
            alert("Google Login Failed: " + error.message);
        });
}

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    // ... existing event listeners preserved implicitly if not overlapping
    // Re-verify existing logic if needed, but we are just appending/prepending mostly.

    // Existing Login Handling
    const form = document.getElementById('loginForm'); // Note: ID in HTML says 'loginForm', but JS was 'login-form'. Let's fix that mismatch if it exists or use correct ID.
    // Looking at login.html line 47: <form id="loginForm">.
    // The previous JS had: const loginForm = document.getElementById('login-form');
    // This looks like a bug in the original code, but I will fix it here to match HTML 'loginForm'.

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            try {
                const res = await fetch(`${API_URL}/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                const data = await res.json();

                if (res.ok) {
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('user', JSON.stringify(data.user));
                    alert('Login Successful');
                    if (data.user.role === 'admin') window.location.href = 'admin.html';
                    else window.location.href = 'index.html';
                } else {
                    alert(data.msg);
                }
            } catch (err) {
                console.error(err);
                alert('Login failed');
            }
        });
    }

    const registerForm = document.getElementById('register-form');
    // Register Handling (If we add a register form)
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('reg-username').value;
            const email = document.getElementById('reg-email').value;
            const password = document.getElementById('reg-password').value;

            try {
                const res = await fetch(`${API_URL}/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, email, password })
                });
                const data = await res.json();

                if (res.ok) {
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('user', JSON.stringify(data.user));
                    alert('Registration Successful');
                    window.location.href = 'index.html';
                } else {
                    alert(data.msg);
                }
            } catch (err) {
                console.error(err);
                alert('Registration failed');
            }
        });
    }
});

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}
