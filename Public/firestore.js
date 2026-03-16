// firestore.js
import { db } from './firebaseInit.js';
import { collection, getDocs } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';

console.log('Firestore initialized:', db);

(async () => {
  try {
    const snap = await getDocs(collection(db, 'test'));
    console.log('Success (docs count):', snap.size);
    snap.forEach(doc => console.log('doc:', doc.id, doc.data()));
  } catch (err) {
    console.error('Firestore error:', err);
  }
})();
