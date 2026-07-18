// Firebase client for Scheme Sathi AI.
import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  browserLocalPersistence,
  setPersistence,
  type Auth,
} from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getDatabase, type Database } from "firebase/database";

export const firebaseConfig = {
  apiKey: "AIzaSyDXYaZl9mKDjiu01ugAQ85UZqfuy7k3QCE",
  authDomain: "scheme-sathi-ai.firebaseapp.com",
  databaseURL:
    "https://scheme-sathi-ai-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "scheme-sathi-ai",
  storageBucket: "scheme-sathi-ai.firebasestorage.app",
  messagingSenderId: "418977626042",
  appId: "1:418977626042:web:55f55d4db1ceb4572c8f83",
  measurementId: "G-CY592V18TJ",
};

let _app: FirebaseApp | undefined;
let _auth: Auth | undefined;
let _db: Firestore | undefined;
let _rtdb: Database | undefined;
let _persistenceSet = false;

function getFirebaseApp() {
  if (_app) return _app;
  _app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  return _app;
}

export function getFirebaseAuth(): Auth {
  if (_auth) return _auth;
  _auth = getAuth(getFirebaseApp());
  if (typeof window !== "undefined" && !_persistenceSet) {
    _persistenceSet = true;
    setPersistence(_auth, browserLocalPersistence).catch(() => {});
  }
  return _auth;
}

export function getDb(): Firestore {
  if (_db) return _db;
  _db = getFirestore(getFirebaseApp());
  return _db;
}

export function getRtDb(): Database {
  if (_rtdb) return _rtdb;
  _rtdb = getDatabase(getFirebaseApp());
  return _rtdb;
}

export const googleProvider = new GoogleAuthProvider();
