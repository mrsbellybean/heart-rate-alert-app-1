import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js';
import { getDatabase, ref, set, onValue } from 'https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js';
import { getMessaging, getToken, onMessage } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-messaging.js";

// Configure Firebase
const firebaseConfig = {
    apiKey: "AIzaSyDuKTsTuvBQ1owbIHMIXio2KKLQ5XDXkZM",
    authDomain: "mock-hr-app.firebaseapp.com",
    databaseURL: "https://mock-hr-app-default-rtdb.europe-west1.firebasedatabase.app/",
    projectId: "mock-hr-app",
    storageBucket: "mock-hr-app.appspot.com",
    messagingSenderId: "425620510129",
    appId: "1:425620510129:web:88208a90c2b619494c9990"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const messaging = getMessaging(app);

// Define API endpoint and access token reference
const url = 'https://api.fitbit.com/1/user/-/activities/heart/date/today/1d/1min.json';
var accessToken = ref(database, 'users/bella/access_token');
var contactNo = ref(database, 'users/bella/contact_no');
var heartRateRef = ref(database, 'users/bella/heart_rate');

// Assistance Call Button Fix
const assistanceCall = document.getElementById("assistance");

// Fetch the contact number from Firebase
onValue(contactNo, (snapshot) => {
    if (snapshot.exists()) {
        const contactNumber = snapshot.val();
        assistanceCall.addEventListener('click', (event) => {
            event.preventDefault();
            window.location.href = `tel:${contactNumber}`;
        });
    } else {
        console.error('Contact number not found in Firebase');
    }
});

// Function to write heart rate data to Firebase
function writeHeartRateDataToFirebase(heartRateData) {
    set(heartRateRef, heartRateData)
        .then(() => {
            console.log('Heart rate data has been written to Firebase:', heartRateData);
        })
        .catch(error => {
            console.error('Error writing to Firebase: ', error);
        });
}

// Function to display heart rate data from Firebase
function displayHeartRate() {
    onValue(heartRateRef, (snapshot) => {
        const heartrate = document.getElementById("heartrate");
        if (snapshot.exists()) {
            const heartRateData = snapshot.val();
            console.log('Heart Rate Data:', heartRateData);
            heartrate.innerHTML = `${heartRateData} BPM`;
        } else {
            heartrate.innerHTML = "Heart Rate: No data available";
        }
    });
}

// Function to fetch heart rate data from Fitbit API
async function fetchData(token) {
    try {
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const responseData = await response.json();
        console.log('Fitbit API Response:', responseData);

        let idhr = responseData['activities-heart-intraday'].dataset;
        const slicedArray = idhr.slice(Math.max(idhr.length - 5, 0));
        let result = slicedArray.map(a => a.value);
        let getAverage = (array) =>
            array.reduce((sum, value) => sum + value, 0) / array.length;
        var heartRateData = Math.round(getAverage(result));
        console.log('Calculated Heart Rate Data:', heartRateData);
        writeHeartRateDataToFirebase(heartRateData);
    } catch (error) {
        console.error('Fetch error: ', error);
    }
}

// Request notification permission and get the FCM token
function requestPermissionAndToken() {
    Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
            console.log('Notification permission granted.');
            getToken(messaging, { vapidKey: 'YOUR_PUBLIC_VAPID_KEY' }).then((currentToken) => {
                if (currentToken) {
                    console.log('FCM Token:', currentToken);
                    // Save the FCM token to Firebase
                    set(ref(database, 'users/bella/fcm_token'), currentToken);
                } else {
                    console.log('No registration token available. Request permission to generate one.');
                }
            }).catch((err) => {
                console.error('An error occurred while retrieving token. ', err);
            });
        } else {
            console.log('Unable to get permission to notify.');
        }
    });
}

// Handle incoming messages from FCM
onMessage(messaging, (payload) => {
    console.log('Message received. ', payload);
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: payload.notification.icon,
    };
    new Notification(notificationTitle, notificationOptions);
});

// Initialize the application
async function initialize() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register("/sw.js")
            .then(function(swRegistration) {
                console.log('Service Worker registered with scope:', swRegistration.scope);
            })
            .catch(function(error) {
                console.error('Service Worker registration failed:', error);
            });
    } else {
        console.log('Service Workers are not supported in this browser.');
    }

    onValue(accessToken, (snapshot) => {
        if (snapshot.exists()) {
            const token = snapshot.val();
            fetchData(token);
        } else {
            console.error('Access token not found in Firebase');
        }
    });

    requestPermissionAndToken();
    displayHeartRate();

    onValue(heartRateRef, (snapshot) => {
        const heartRate = snapshot.val();
        console.log('Updated Heart Rate Data from Firebase:', heartRate);
        const heartrateElement = document.getElementById("heartrate");
        heartrateElement.innerHTML = `${heartRate} BPM`;
        checkHeartRateAndNotify(heartRate);
    });
}

// Initialize app
initialize().catch(error => console.error('Initialization error:', error));

function checkHeartRateAndNotify(heartRate) {
    if (heartRate >= 100 || heartRate <= 60) {
        triggerNotification(heartRate);
    }
}

function triggerNotification(heartRate) {
    console.log("Triggering notification for heart rate:", heartRate);

    let notificationBody = "Heart rate alert";
    if (heartRate >= 100) {
        notificationBody = "Warning: High heart rate detected!";
    } else if (heartRate <= 60) {
        notificationBody = "Warning: Low heart rate detected!";
    } else {
        console.log("Heart rate is normal");
        return;
    }

    const options = {
        body: notificationBody,
        icon: "/heart.png",
        vibrate: [200, 100, 200],
        tag: "heart-rate-alert",
        badge: "/badge-icon.png",
        actions: [{ action: "view", title: "View Details", icon: "/icon-view.png" }]
    };

    navigator.serviceWorker.ready.then(function(serviceWorker) {
        serviceWorker.showNotification("Heart Rate Alert", options);
    }).catch(error => {
        console.error('Service Worker not ready:', error);
    });
}