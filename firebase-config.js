// ============================================================
// DOLCE DONUTS POS - Firebase Firestore Configuration
// ============================================================
const firebaseConfig = {
    apiKey: "AIzaSyCrLSht6Xqr-PjBxgGQZaAcJPT95oxw_qE",
    authDomain: "dolcedonuts-55607.firebaseapp.com",
    projectId: "dolcedonuts-55607",
    storageBucket: "dolcedonuts-55607.firebasestorage.app",
    messagingSenderId: "961008378851",
    appId: "1:961008378851:web:4bc2765ecb80fcf15436d6",
    measurementId: "G-YZ4ZZS3LYR"
};

function setFbUI(color, label) {
    let dot = document.getElementById("fb-dot");
    let lbl = document.getElementById("fb-label");
    if (dot) dot.style.background = color;
    if (lbl) lbl.innerText = label;
}

try {
    firebase.initializeApp(firebaseConfig);
    window.db = firebase.firestore();

    // Enable offline persistence (works even when no net)
    window.db.enablePersistence({ synchronizeTabs: true })
        .then(() => {
            console.log("[DD-POS] Firestore offline persistence enabled");
        })
        .catch(err => {
            if (err.code === "failed-precondition") {
                console.warn("[DD-POS] Multiple tabs open - persistence in first tab only");
            } else if (err.code === "unimplemented") {
                console.warn("[DD-POS] Browser does not support persistence");
            }
        });

    window.FIREBASE_READY = true;

    // Test actual connectivity
    window.db.collection("dd_ping").doc("chk").set({ ts: Date.now() })
        .then(() => {
            window.FIREBASE_CONNECTED = true;
            console.log("[DD-POS] Firebase ONLINE - Cloud sync active");
            setFbUI("#22c55e", "Cloud Synced");
        })
        .catch(err => {
            window.FIREBASE_CONNECTED = false;
            console.warn("[DD-POS] Firebase offline mode:", err.code);
            // Still works via localStorage - not an error
            if (err.code === "unavailable" || err.message.includes("offline")) {
                setFbUI("#f59e0b", "Offline Mode");
            } else {
                setFbUI("#f59e0b", "Offline Mode");
            }
        });

} catch(e) {
    window.FIREBASE_READY = false;
    window.FIREBASE_CONNECTED = false;
    console.warn("[DD-POS] Firebase init failed:", e.message);
    setFbUI("#94a3b8", "Offline Only");
}