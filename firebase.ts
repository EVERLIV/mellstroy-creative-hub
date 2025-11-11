// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBYAqPfz_Ww1zmx_74zsBkabJlQJh3ycAA",
  authDomain: "gen-lang-client-0442590863.firebaseapp.com",
  projectId: "gen-lang-client-0442590863",
  storageBucket: "gen-lang-client-0442590863.appspot.com",
  messagingSenderId: "28457852557",
  appId: "1:28457852557:web:e3a94417966757a1ef4cc4",
  measurementId: "G-YB7ZCZLV0Z"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

/**
 * Uploads a file to Firebase Storage.
 * @param file The file to upload.
 * @param path The path in storage where the file should be saved.
 * @returns A promise that resolves with the public download URL of the file.
 */
export const uploadFile = async (file: File, path: string): Promise<string> => {
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
};


export { db, auth, storage };