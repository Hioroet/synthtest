(function () {
  "use strict";

  // ===== Footer year =====
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // ===== Nav scroll state =====
  var nav = document.getElementById("nav");
  function onScroll() {
    if (window.scrollY > 20) nav.classList.add("scrolled");
    else nav.classList.remove("scrolled");
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // ===== Reveal on scroll =====
  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  }

  // ===== Modal =====
  var modal = document.getElementById("modal");
  var form = document.getElementById("waitlist-form");
  var note = document.getElementById("form-note");
  var successPanel = document.getElementById("modal-success");
  var lastFocused = null;

  function openModal(trigger) {
    lastFocused = trigger || document.activeElement;
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    // reset any prior state
    if (form) form.reset();
    if (note) { note.textContent = ""; note.className = "modal__note"; }
    if (successPanel) successPanel.hidden = true;
    var email = document.getElementById("email");
    if (email) { email.classList.remove("invalid"); setTimeout(function () { email.focus(); }, 80); }
  }

  function closeModal() {
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    if (lastFocused && typeof lastFocused.focus === "function") lastFocused.focus();
  }

  // Open via any element with data-open-modal
  document.querySelectorAll("[data-open-modal]").forEach(function (btn) {
    btn.addEventListener("click", function () { openModal(btn); });
  });

  // Close via backdrop / close buttons / any [data-close-modal]
  document.querySelectorAll("[data-close-modal]").forEach(function (el) {
    el.addEventListener("click", closeModal);
  });

  // Esc to close
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && modal.classList.contains("open")) closeModal();
  });

  // ===== Form validation (fake-door capture) =====
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var emailEl = document.getElementById("email");
      var email = emailEl.value.trim();

      if (!note) return;
      note.className = "modal__note";

      if (!email) {
        emailEl.classList.add("invalid");
        note.textContent = "Please enter your email to join the waitlist.";
        note.classList.add("err");
        emailEl.focus();
        return;
      }
      if (!EMAIL_RE.test(email)) {
        emailEl.classList.add("invalid");
        note.textContent = "That doesn’t look like a valid email. Try again?";
        note.classList.add("err");
        emailEl.focus();
        return;
      }

      // Persist locally so early users don't lose their spot
      try {
        var list = JSON.parse(localStorage.getItem("synthtest_waitlist") || "[]");
        if (list.indexOf(email) === -1) list.push(email);
        localStorage.setItem("synthtest_waitlist", JSON.stringify(list));
      } catch (err) { /* ignore storage errors */ }

      // Simulate submission -> show success state
      emailEl.classList.remove("invalid");
      note.textContent = "";
      if (form) form.style.display = "none";
      if (successPanel) successPanel.hidden = false;
    });

    // Clear invalid state as the user types
    var emailEl = document.getElementById("email");
    if (emailEl) {
      emailEl.addEventListener("input", function () {
        emailEl.classList.remove("invalid");
        if (note) { note.textContent = ""; note.className = "modal__note"; }
      });
    }
  }
})();
