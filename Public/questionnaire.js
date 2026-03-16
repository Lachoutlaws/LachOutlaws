// ------------------------------------------------------------------
// Imports / setup
// ------------------------------------------------------------------
import { firebaseApp, db } from "../firebaseInit.js";
import {
  collection,
  addDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// ------------------------------------------------------------------
// Extended mode toggle (keeps original text, guarded)
// ------------------------------------------------------------------
function updateText(isExtended) {
  document.querySelectorAll(".textSection").forEach((section) => {
    const extendedText = section.getAttribute("data-extended") || "";
    const targetText = isExtended ? extendedText : section.dataset.originalText || "";
    gsap.to(section, {
      duration: 0.8,
      text: targetText,
      ease: "power2.out",
      onStart: () => (section.innerHTML = ""),
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".textSection").forEach((section) => {
    section.dataset.originalText = section.innerHTML.trim();
  });
  updateText(false); // start in regular mode
});

let isExtended = false;
// If you add a button later, you can re-enable this:
// document.getElementById("toggleSwitchButton")?.addEventListener("click", function () {
//   isExtended = !isExtended;
//   this.classList.toggle("active", isExtended);
//   updateText(isExtended);
// });

// ------------------------------------------------------------------
// Firestore feedback helpers
// ------------------------------------------------------------------
async function sendFeedback(question, response, formGroup) {
  try {
    await addDoc(collection(db, "feedback"), {
      question,
      response,
      timestamp: serverTimestamp(),
    });

    console.log(`✅ Feedback Submitted: "${question}" -> "${response}"`);
    const indicator = formGroup?.querySelector(".whenSubmitted");
    if (indicator) {
      indicator.classList.add("submitted");
      setTimeout(() => indicator.classList.remove("submitted"), 1500);
    }
  } catch (error) {
    console.error("❌ Error submitting feedback:", error);
  }
}

// Radio tiles (safe if none on the page)
document.querySelectorAll(".formGroup input[type='radio']").forEach((input) => {
  input.addEventListener("change", function () {
    const formGroup = this.closest(".formGroup");
    const question = formGroup?.querySelector("label")?.innerText || "Question";
    const response = this.value;
    sendFeedback(question, response, formGroup || document.body);
  });
});

// Textarea submit — robust delegated handler (works across pages)
document.addEventListener("click", (e) => {
  const btn = e.target.closest("#submitFeedback, .submitFeedback");
  if (!btn) return;

  const formGroup = btn.closest(".formGroup");
  const textarea =
    formGroup?.querySelector("#improvement, textarea[name='improvement'], textarea") ||
    document.getElementById("improvement");

  const question =
    formGroup?.querySelector("label")?.innerText?.trim() || "Your Thoughts (optional)";
  const response = (textarea?.value || "").trim();

  if (!response) {
    console.log("⚠️ No feedback entered.");
    return;
  }

  sendFeedback(question, response, formGroup || document.body);
  if (textarea) textarea.value = "";
});

// ------------------------------------------------------------------
// Autoplay/pause video when visible (guarded)
// ------------------------------------------------------------------
(function () {
  const video = document.getElementById("dataDemoVideo");
  if (!video || !("IntersectionObserver" in window)) return;

  const observer = new IntersectionObserver(
    ([entry]) => (entry.isIntersecting ? video.play() : video.pause()),
    { threshold: 0.5 }
  );
  observer.observe(video);
})();
