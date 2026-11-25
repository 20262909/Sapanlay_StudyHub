/* ==========================================================================
   Study Hub — Master Interactive Engine (script.js)
   Handles:
   1. Dynamic Lesson Completion & localStorage Persistence
   2. Dynamic Study Streak Counter & Subject/Overall Progress Bars
   3. Split-Action Sidebar Accordion (Navigate to Unit Top vs Toggle Chevron)
   4. Pure Multiple-Choice Inline Quiz Evaluation (Red/Green Highlights, Score)
   5. Reset Quiz & Lesson Completed Toggle
   6. Dynamic "Take a Quiz" Header Button Targeting Active Lesson
   7. Smooth Scrolling & Active Lesson Tracking
   8. Dismissible Reminder Pop-up Modal with "Don't show this again"
   ========================================================================== */

document.addEventListener("DOMContentLoaded", () => {
  const SUBJECT_TOTALS = {
    PROGIT: 12,
    INTRCS: 8,
    HUMCOM: 14,
    CMPTRB: 10
  };
  const TOTAL_LESSONS = Object.values(SUBJECT_TOTALS).reduce((a, b) => a + b, 0);

  // Load persisted state from localStorage
  let completedLessons = JSON.parse(localStorage.getItem("ub_completed_lessons") || "[]");
  let streakCount = parseInt(localStorage.getItem("ub_study_streak") || "0", 10);
  let lastStudyDate = localStorage.getItem("ub_last_study_date") || "";

  function saveState() {
    localStorage.setItem("ub_completed_lessons", JSON.stringify(completedLessons));
    localStorage.setItem("ub_study_streak", String(streakCount));
    localStorage.setItem("ub_last_study_date", lastStudyDate);
  }

  function recordStudyActivity() {
    const today = new Date().toISOString().slice(0, 10);
    if (lastStudyDate !== today) {
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      if (lastStudyDate === yesterday) {
        streakCount += 1;
      } else {
        streakCount = Math.max(1, streakCount + 1);
      }
      lastStudyDate = today;
    } else if (streakCount === 0) {
      streakCount = 1;
    }
    saveState();
  }

  // Render dynamic progress bars (Global header + Home subject cards) & streak
  function updateProgressUI() {
    const completedCount = completedLessons.length;
    const overallPct = Math.round((completedCount / TOTAL_LESSONS) * 100);

    const streakEl = document.getElementById("streak-count");
    const progressFill = document.getElementById("progress-fill");
    const progressText = document.getElementById("progress-text");
    const personalMsg = document.getElementById("personal-message");

    if (streakEl) {
      streakEl.textContent = `${streakCount}-day study streak`;
    }
    if (progressFill) {
      progressFill.style.width = `${overallPct}%`;
    }
    if (progressText) {
      progressText.textContent = `Course Progress: ${overallPct}% (${completedCount}/${TOTAL_LESSONS})`;
    }
    if (personalMsg) {
      if (completedCount === 0) {
        personalMsg.textContent = "Welcome to Study Hub! Complete a lesson and check 'Lesson Completed' to start your streak.";
      } else {
        personalMsg.textContent = `Great momentum! You have completed ${completedCount} of ${TOTAL_LESSONS} lessons (${overallPct}% overall).`;
      }
    }

    // Home dashboard summary stats
    const homeCompletedEl = document.getElementById("home-completed-count");
    const homeStreakEl = document.getElementById("home-streak-count");
    const homeOverallPctEl = document.getElementById("home-overall-pct");
    if (homeCompletedEl) homeCompletedEl.textContent = `${completedCount} / ${TOTAL_LESSONS} Lessons Completed`;
    if (homeStreakEl) homeStreakEl.textContent = `${streakCount} Day${streakCount === 1 ? "" : "s"} Active Streak`;
    if (homeOverallPctEl) homeOverallPctEl.textContent = `${overallPct}% Overall Mastery`;

    // Subject cards on index.html
    Object.keys(SUBJECT_TOTALS).forEach((subj) => {
      const total = SUBJECT_TOTALS[subj];
      const done = completedLessons.filter((id) => id.startsWith(subj + "-")).length;
      const pct = Math.round((done / total) * 100);

      const bar = document.getElementById(`prog-bar-${subj}`);
      const label = document.getElementById(`prog-text-${subj}`);
      if (bar) bar.style.width = `${pct}%`;
      if (label) label.textContent = `${pct}% (${done}/${total} lessons)`;
    });

    // Update sidebar circles & "Lesson Completed" buttons on unit pages
    document.querySelectorAll("[data-lesson-circle]").forEach((circle) => {
      const lessonId = circle.dataset.lessonCircle;
      const parentLink = circle.closest(".unit-link");
      if (completedLessons.includes(lessonId)) {
        circle.classList.add("completed");
        circle.textContent = "✓";
        if (parentLink) parentLink.classList.add("completed");
      } else {
        circle.classList.remove("completed");
        circle.textContent = "";
        if (parentLink) parentLink.classList.remove("completed");
      }
    });

    document.querySelectorAll(".btn-complete-lesson").forEach((btn) => {
      const lessonId = btn.dataset.lessonId;
      if (completedLessons.includes(lessonId)) {
        btn.classList.add("completed");
        btn.textContent = "✓ Lesson Completed";
      } else {
        btn.classList.remove("completed");
        btn.textContent = "Mark Lesson Completed";
      }
    });
  }

  updateProgressUI();

  // ========================================================================
  // SPLIT-ACTION SIDEBAR ACCORDION (CHEVRON TOGGLE WITHOUT NAVIGATION/CLIPPING)
  // ========================================================================
  document.querySelectorAll(".unit-toggle-btn").forEach((toggleBtn) => {
    toggleBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const unitGroup = toggleBtn.closest(".unit-group");
      if (!unitGroup) return;
      const isOpen = unitGroup.classList.toggle("is-open");
      toggleBtn.setAttribute("aria-expanded", String(isOpen));
      const panel = unitGroup.querySelector(".unit-list");
      if (panel) {
        panel.style.maxHeight = "none";
        panel.style.overflow = "visible";
      }
    });
  });

  // Ensure open unit groups have full unrestricted height on initial render
  document.querySelectorAll(".unit-group.is-open .unit-list").forEach((panel) => {
    panel.style.maxHeight = "none";
    panel.style.overflow = "visible";
  });

  // ========================================================================
  // DISMISSIBLE REMINDER MODAL ("Don't show this again")
  // ========================================================================
  const reminderModal = document.getElementById("study-reminder-modal");
  const closeReminderBtn = document.getElementById("close-reminder-btn");
  const dontShowCheckbox = document.getElementById("dont-show-reminder");

  if (reminderModal && localStorage.getItem("ub_hide_reminder_modal") !== "true") {
    if (!sessionStorage.getItem("ub_reminder_shown_session")) {
      setTimeout(() => {
        reminderModal.classList.add("open");
        sessionStorage.setItem("ub_reminder_shown_session", "true");
      }, 900);
    }
  }

  if (closeReminderBtn && reminderModal) {
    closeReminderBtn.addEventListener("click", () => {
      if (dontShowCheckbox && dontShowCheckbox.checked) {
        localStorage.setItem("ub_hide_reminder_modal", "true");
      }
      reminderModal.classList.remove("open");
    });
  }

  // ========================================================================
  // DYNAMIC "TAKE A QUIZ" HEADER BUTTON & ACTIVE LESSON HIGHLIGHTING
  // ========================================================================
  const headerTakeQuizBtn = document.getElementById("header-take-quiz-btn");
  const lessonSections = Array.from(document.querySelectorAll(".lesson-block[data-lesson-code]"));
  let activeQuizTargetId = lessonSections.length > 0 ? lessonSections[0].dataset.quizTarget : null;

  function setActiveLesson(lessonSection) {
    if (!lessonSection) return;
    const code = lessonSection.dataset.lessonCode;
    const quizTarget = lessonSection.dataset.quizTarget;
    const lessonId = lessonSection.id;

    activeQuizTargetId = quizTarget;
    if (headerTakeQuizBtn && quizTarget) {
      headerTakeQuizBtn.href = `#${quizTarget}`;
      headerTakeQuizBtn.textContent = `Take Quiz ${code} →`;
    }

    document.querySelectorAll(".sidebar-nav .unit-link").forEach((link) => {
      const href = link.getAttribute("href") || "";
      if (href.endsWith(`#${lessonId}`)) {
        link.classList.add("current-lesson");
      } else {
        link.classList.remove("current-lesson");
      }
    });
  }

  if (lessonSections.length > 0) {
    setActiveLesson(lessonSections[0]);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveLesson(entry.target);
          }
        });
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: 0.05 }
    );

    lessonSections.forEach((sec) => observer.observe(sec));
  }

  if (headerTakeQuizBtn) {
    headerTakeQuizBtn.addEventListener("click", (e) => {
      if (activeQuizTargetId) {
        const targetEl = document.getElementById(activeQuizTargetId);
        if (targetEl) {
          e.preventDefault();
          targetEl.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
    });
  }

  // Same-page smooth scroll for sidebar lesson links
  document.querySelectorAll(".sidebar-nav a.unit-link").forEach((link) => {
    link.addEventListener("click", (e) => {
      const href = link.getAttribute("href") || "";
      const hashIdx = href.indexOf("#");
      if (hashIdx !== -1) {
        const pagePart = href.slice(0, hashIdx);
        const hashPart = href.slice(hashIdx + 1);
        const currentPage = window.location.pathname.split("/").pop() || "index.html";
        if (pagePart === "" || pagePart === currentPage) {
          const target = document.getElementById(hashPart);
          if (target) {
            e.preventDefault();
            target.scrollIntoView({ behavior: "smooth", block: "start" });
            history.replaceState(null, "", `#${hashPart}`);
          }
        }
      }
    });
  });

  // ========================================================================
  // INLINE MULTIPLE-CHOICE QUIZ INTERACTION: CHECK ANSWER, RESET QUIZ, COMPLETE
  // ========================================================================
  document.querySelectorAll(".inline-quiz-form").forEach((form) => {
    const feedbackBanner = form.querySelector(".quiz-feedback-banner");
    const checkBtn = form.querySelector(".btn-check");
    const resetBtn = form.querySelector(".btn-reset");

    if (checkBtn) {
      checkBtn.addEventListener("click", () => {
        let score = 0;
        let total = 0;

        form.querySelectorAll(".quiz-question[data-type='mcq']").forEach((qEl) => {
          total += 1;
          const correctVal = qEl.dataset.answer;

          // Clear previous highlights
          qEl.querySelectorAll("label").forEach((lbl) => {
            lbl.classList.remove("option-correct", "option-wrong");
          });

          const checkedInput = qEl.querySelector("input[type='radio']:checked");
          if (checkedInput) {
            const chosenLabel = checkedInput.closest("label");
            if (checkedInput.value === correctVal) {
              score += 1;
              if (chosenLabel) chosenLabel.classList.add("option-correct");
            } else {
              if (chosenLabel) chosenLabel.classList.add("option-wrong");
              const rightInput = qEl.querySelector(`input[type='radio'][value='${correctVal}']`);
              if (rightInput && rightInput.closest("label")) {
                rightInput.closest("label").classList.add("option-correct");
              }
            }
          }
        });

        if (feedbackBanner) {
          feedbackBanner.classList.add("show");
          if (score === total) {
            feedbackBanner.classList.remove("partial");
            feedbackBanner.classList.add("success");
            feedbackBanner.textContent = `Great job! You scored ${score}/${total} (100%). Click "Mark Lesson Completed" to record your progress and boost your streak!`;
          } else {
            feedbackBanner.classList.remove("success");
            feedbackBanner.classList.add("partial");
            feedbackBanner.textContent = `You scored ${score}/${total}. Wrong selected answers are highlighted in red and correct answers in green.`;
          }
        }
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        form.reset();
        form.querySelectorAll("label").forEach((lbl) => {
          lbl.classList.remove("option-correct", "option-wrong");
        });
        if (feedbackBanner) {
          feedbackBanner.classList.remove("show", "success", "partial");
          feedbackBanner.textContent = "";
        }
      });
    }
  });

  // Lesson Completed Toggle Buttons
  document.querySelectorAll(".btn-complete-lesson").forEach((btn) => {
    btn.addEventListener("click", () => {
      const lessonId = btn.dataset.lessonId;
      if (!lessonId) return;

      if (completedLessons.includes(lessonId)) {
        completedLessons = completedLessons.filter((id) => id !== lessonId);
      } else {
        completedLessons.push(lessonId);
        recordStudyActivity();
      }
      saveState();
      updateProgressUI();
    });
  });
});
