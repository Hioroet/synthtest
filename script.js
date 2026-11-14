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
    if (form) { form.reset(); form.style.display = ""; }
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
        note.textContent = "Please enter your work email to request beta access.";
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

  // ===== Legal / System Status modal =====
  var legalModal = document.getElementById("legal-modal");
  var legalTitle = document.getElementById("legal-title");
  var legalBody = document.getElementById("legal-body");

  var LEGAL = {
    privacy: {
      title: "Privacy Policy",
      html:
        '<p>SynthTest ("SynthTest", "we") respects your privacy. This policy explains what we collect and how we use it.</p>' +
        '<p><strong>Data we collect:</strong> email addresses submitted for private beta access, plus basic diagnostic data such as browser type, device, and pages visited.</p>' +
        '<p><strong>How we use it:</strong> to grant dashboard access, deliver your simulation reports, and send product updates. We never sell your personal data.</p>' +
        '<p><strong>Retention &amp; your rights:</strong> you may request access to, correction of, or deletion of your data at any time by emailing <a href="mailto:nahar@synthtest.tech">nahar@synthtest.tech</a>.</p>' +
        '<p><strong>Cookies:</strong> we use only essential cookies and privacy-friendly analytics to keep the service running.</p>'
    },
    terms: {
      title: "Terms of Service",
      html:
        '<p>By accessing SynthTest ("the Service") you agree to these terms.</p>' +
        '<p><strong>Service description:</strong> SynthTest provides AI-powered, multi-agent marketing simulations. Reports are directional estimates, not guarantees of performance.</p>' +
        '<p><strong>Acceptable use:</strong> you agree not to misuse the Service, attempt to reverse engineer it, or use it for unlawful purposes.</p>' +
        '<p><strong>Beta access:</strong> private beta features may change or be withdrawn during the beta program. Credits provided during beta have no cash value.</p>' +
        '<p><strong>Liability:</strong> the Service is provided "as is" without warranties. SynthTest is not liable for indirect or consequential damages.</p>' +
        '<p>Questions? Contact <a href="mailto:nahar@synthtest.tech">nahar@synthtest.tech</a>.</p>'
    },
    status: {
      title: "System Status: Operational",
      html:
        '<p><span class="status-dot" aria-hidden="true"></span> <strong class="status-text">All systems operational.</strong></p>' +
        '<p>Inference cluster, agent orchestration, and the dashboard API are reporting healthy. Latest check: just now.</p>' +
        '<ul class="legal__list">' +
        '<li><span class="status-dot" aria-hidden="true"></span> Inference Cluster — Operational</li>' +
        '<li><span class="status-dot" aria-hidden="true"></span> Agent Orchestration — Operational</li>' +
        '<li><span class="status-dot" aria-hidden="true"></span> Dashboard &amp; API — Operational</li>' +
        '</ul>'
    }
  };

  var legalLastFocused = null;

  function openLegal(key) {
    var item = LEGAL[key];
    if (!item || !legalModal) return;
    legalLastFocused = document.activeElement;
    legalTitle.textContent = item.title;
    legalBody.innerHTML = item.html;
    legalModal.classList.add("open");
    legalModal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeLegal() {
    if (!legalModal) return;
    legalModal.classList.remove("open");
    legalModal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    if (legalLastFocused && typeof legalLastFocused.focus === "function") legalLastFocused.focus();
  }

  document.querySelectorAll("[data-legal]").forEach(function (el) {
    el.addEventListener("click", function (e) {
      e.preventDefault();
      openLegal(el.getAttribute("data-legal"));
    });
  });

  document.querySelectorAll("[data-close-legal]").forEach(function (el) {
    el.addEventListener("click", closeLegal);
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && legalModal && legalModal.classList.contains("open")) closeLegal();
  });
})();
