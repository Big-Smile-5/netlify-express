let { initializeApp } = require("firebase/app")
let { getFirestore } = require("firebase/firestore")

var config = {
    apiKey: "AIzaSyBQKpvXqKcycxrfNRBRsTY6D8aW71LYbPs",
    authDomain: "dice-game-a6f80.firebaseapp.com",
    projectId: "dice-game-a6f80",
    storageBucket: "dice-game-a6f80.appspot.com",
    messagingSenderId: "819853388583",
    appId: "1:819853388583:web:ae61381cc379d419f19702",
    measurementId: "G-CH7LM41QHB"
}

const app = initializeApp(config)
const db = getFirestore(app)

module.exports = db