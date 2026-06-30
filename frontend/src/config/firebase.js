import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
  apiKey: 'AIzaSyBQKL4J0l81qczwrwyZ0P1bAxAz6BEEANo',
  authDomain: 'civicmindai-e2929.firebaseapp.com',
  projectId: 'civicmindai-e2929',
  storageBucket: 'civicmindai-e2929.firebasestorage.app',
  messagingSenderId: '1012830493353',
  appId: '1:1012830493353:web:6e3e86a1709afd1fdca7b8',
  measurementId: 'G-5NJG7CPHH9',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const analytics = getAnalytics(app);
export default app;
