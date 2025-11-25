// ------------------------------------------------------------------
// Imports / setup
// ------------------------------------------------------------------
import { firebaseApp } from "../firebaseInit.js";
gsap.registerPlugin(ScrollTrigger);

const db = firebase.firestore(firebaseApp);
console.log("Firestore initialized:", db);

// ------------------------------------------------------------------
// Case study reveal animations
// ------------------------------------------------------------------
gsap.utils.toArray(".caseStudy").forEach((elem) => {
  gsap.fromTo(
    elem,
    { opacity: 0, scale: 0, transformOrigin: "bottom" },
    {
      opacity: 1,
      scale: 1,
      ease: "power1.out",
      scrollTrigger: {
        trigger: elem,
        start: "top 90%",
        end: "bottom 60%",
        toggleActions: "play reverse play reverse",
        markers: false,
      },
    }
  );
});

// ------------------------------------------------------------------
// Custom cursor (guarded)
// ------------------------------------------------------------------
(function () {
  const cursor = document.querySelector(".cursor");
  if (!cursor) return; // ← prevents null errors

  // Cursor follows mouse
  const editCursor = (e) => {
    const { clientX: x, clientY: y } = e;
    cursor.style.left = x + "px";
    cursor.style.top = y + "px";
  };
  window.addEventListener("mousemove", editCursor);

  // Expand on hover targets
  document.addEventListener("mouseover", (e) => {
    if (e.target.closest(".hover-this")) cursor.classList.add("expand");
  });
  document.addEventListener("mouseout", (e) => {
    if (!e.relatedTarget || !e.relatedTarget.closest(".hover-this")) {
      cursor.classList.remove("expand");
    }
  });

  // Optional nav link micro-parallax (safe if no <span>)
  const links = document.querySelectorAll("nav > .hover-this");
  const animateit = function (e) {
    const span = this.querySelector("span");
    if (!span) return;
    const rect = this.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const xMove = (e.clientX - centerX) * 0.2;
    const yMove = (e.clientY - centerY) * 0.2;
    span.style.transform = `translate(${xMove}px, ${yMove}px)`;
    if (e.type === "mouseleave") span.style.transform = "";
  };
  links.forEach((link) => {
    link.addEventListener("mousemove", animateit);
    link.addEventListener("mouseleave", animateit);
  });
})();

// ------------------------------------------------------------------
// Back button (guarded)
// ------------------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  const backButton = document.getElementById("back-button");
  if (backButton) {
    backButton.addEventListener("click", (e) => {
      e.preventDefault();
      window.history.back();
    });
  }
});

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
function sendFeedback(question, response, formGroup) {
  db.collection("feedback")
    .add({
      question,
      response,
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
    })
    .then(() => {
      console.log(`✅ Feedback Submitted: "${question}" -> "${response}"`);
      const indicator = formGroup?.querySelector(".whenSubmitted");
      if (indicator) {
        indicator.classList.add("submitted");
        setTimeout(() => indicator.classList.remove("submitted"), 1500);
      }
    })
    .catch((error) => {
      console.error("❌ Error submitting feedback:", error);
    });
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

// ------------------------------------------------------------------
// Header style change after first viewport
// ------------------------------------------------------------------
(function () {
  const header = document.querySelector(".globalHeader");
  if (!header) return;
  const onScroll = () => {
    header.classList.toggle("scrolled", window.scrollY > window.innerHeight);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
})();

// ------------------------------------------------------------------
// Accordion (leave others open; a11y + resize-safe)
// ------------------------------------------------------------------
(function () {
  const items = document.querySelectorAll(".rolesAccordion .accordion-item");
  if (!items.length) return;

  items.forEach((item) => {
    const header = item.querySelector(".accordion-header");
    const content = item.querySelector(".accordion-content");
    if (!header || !content) return;

    header.setAttribute("role", "button");
    header.setAttribute("tabindex", "0");
    header.setAttribute("aria-expanded", "false");
    content.style.maxHeight = "0px";

    const closeItem = (it) => {
      it.classList.remove("open");
      const h = it.querySelector(".accordion-header");
      const c = it.querySelector(".accordion-content");
      h?.setAttribute("aria-expanded", "false");
      if (c) c.style.maxHeight = "0px";
    };
    const openItem = (it) => {
      it.classList.add("open");
      const h = it.querySelector(".accordion-header");
      const c = it.querySelector(".accordion-content");
      h?.setAttribute("aria-expanded", "true");
      if (c) c.style.maxHeight = c.scrollHeight + "px";
    };
    const toggle = () => (item.classList.contains("open") ? closeItem(item) : openItem(item));

    header.addEventListener("click", toggle);
    header.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggle();
      }
    });
  });

  window.addEventListener("resize", () => {
    document
      .querySelectorAll(".rolesAccordion .accordion-item.open .accordion-content")
      .forEach((c) => (c.style.maxHeight = c.scrollHeight + "px"));
  });
})();

// ──────────────────────────────────────────────────────────────
// ScrollTrigger pin for TOC — keep it 80px from top while pinned
// ──────────────────────────────────────────────────────────────
const mm = gsap.matchMedia();

mm.add("(min-width: 1025px)", () => {
  const containers = gsap.utils.toArray(".caseLayout");
  if (!containers.length) return;

  const desiredOffset = 80; // << fixed gap from top

  const pins = [];

  containers.forEach((container, i) => {
    const toc = container.querySelector(".toc");
    if (!toc) return;

    // lock width so pinning doesn't reflow the grid
    const lockWidth = () => (toc.style.width = getComputedStyle(toc).width);
    const unlockWidth = () => (toc.style.width = "");
    lockWidth();

    // Start when the TOC's top reaches the desiredOffset line
    const computeStart = () => `top+=${Math.max(0, toc.offsetTop - desiredOffset)} top`;

    const onResize = () => {
      unlockWidth();
      lockWidth();
      ScrollTrigger.refresh();
    };
    window.addEventListener("resize", onResize);

    const pin = ScrollTrigger.create({
      id: `tocPin-${i}`,
      trigger: container,
      start: computeStart,          // begin when TOC gets ~80px from top
      end: "bottom bottom",         // unpin at end of the two-column section
      pin: toc,
      pinSpacing: true,
      invalidateOnRefresh: true,
      anticipatePin: 1,
      // keep a constant 80px visual offset only while pinned
      onEnter:      () => gsap.set(toc, { y: desiredOffset }),
      onEnterBack:  () => gsap.set(toc, { y: desiredOffset }),
      onLeave:      () => gsap.set(toc, { y: 0 }),
      onLeaveBack:  () => gsap.set(toc, { y: 0 }),
    });

    pins.push({ pin, onResize });
  });

  // cleanup on unmatch
  return () => {
    pins.forEach(({ pin, onResize }) => {
      pin.kill();
      window.removeEventListener("resize", onResize);
    });
  };
});
