// firestore.js (v9 modular)
import { firebaseApp } from "../firebaseInit.js"; // must export an initialized app
import { getFirestore, collection, getDocs } from "firebase/firestore";

const db = getFirestore(firebaseApp);
console.log("Firestore initialized:", db);

(async () => {
  try {
    const snap = await getDocs(collection(db, "test"));
    console.log("Success (docs count):", snap.size);
    snap.forEach(doc => console.log("doc:", doc.id, doc.data()));
  } catch (err) {
    console.error("Firestore error:", err);
  }
})();
