/**
 * quiz.js – Shared interactive quiz engine
 * Expects a global `QUESTIONS` array defined before this script is loaded.
 * Each question object: { text, options: [A,B,C,D], answer: 0-based index, explanation }
 */
(function () {
  'use strict';

  const LETTERS = ['A', 'B', 'C', 'D'];
  let submitted = false;

  // ── Build DOM ──────────────────────────────────────────────────────────────
  function buildQuiz() {
    const container = document.getElementById('quiz-container');
    if (!container) return;

    QUESTIONS.forEach(function (q, idx) {
      const card = document.createElement('div');
      card.className = 'question-card';
      card.id = 'q-' + idx;

      // Header
      const header = document.createElement('div');
      header.className = 'question-header';
      header.innerHTML =
        '<div class="q-number">' + (idx + 1) + '</div>' +
        '<div class="q-text">' + q.text + '</div>';
      card.appendChild(header);

      // Options
      const ul = document.createElement('ul');
      ul.className = 'options-list';
      q.options.forEach(function (opt, oi) {
        const li = document.createElement('li');
        li.className = 'option-item';
        const label = document.createElement('label');
        label.className = 'option-label';
        label.htmlFor = 'q' + idx + '_o' + oi;
        label.innerHTML =
          '<input type="radio" name="q' + idx + '" id="q' + idx + '_o' + oi + '" value="' + oi + '" />' +
          '<span><strong>' + LETTERS[oi] + ')</strong> ' + opt + '</span>';
        li.appendChild(label);
        ul.appendChild(li);
      });
      card.appendChild(ul);

      // Explanation
      const exp = document.createElement('div');
      exp.className = 'explanation';
      exp.id = 'exp-' + idx;
      exp.innerHTML = '<strong>Explanation:</strong> ' + q.explanation;
      card.appendChild(exp);

      container.appendChild(card);
    });

    updateProgress();
    // Listen for answer changes to update progress
    container.addEventListener('change', updateProgress);
  }

  // ── Progress Bar ───────────────────────────────────────────────────────────
  function updateProgress() {
    const answered = QUESTIONS.filter(function (q, idx) {
      return document.querySelector('input[name="q' + idx + '"]:checked');
    }).length;
    const pct = (answered / QUESTIONS.length) * 100;
    const fill = document.getElementById('progress-fill');
    const label = document.getElementById('progress-label');
    if (fill) fill.style.width = pct + '%';
    if (label) label.textContent = answered + ' / ' + QUESTIONS.length + ' answered';
  }

  // ── Check Answers ──────────────────────────────────────────────────────────
  function checkAnswers() {
    if (submitted) return;

    // Check all answered
    let unanswered = [];
    QUESTIONS.forEach(function (q, idx) {
      if (!document.querySelector('input[name="q' + idx + '"]:checked')) {
        unanswered.push(idx + 1);
      }
    });

    if (unanswered.length > 0) {
      const missing = unanswered.length;
      const plural = missing === 1 ? 'question' : 'questions';
      if (!confirm('You have ' + missing + ' unanswered ' + plural + ' (Q' + unanswered.join(', Q') + '). Submit anyway?')) {
        return;
      }
    }

    submitted = true;
    let score = 0;

    QUESTIONS.forEach(function (q, idx) {
      const selected = document.querySelector('input[name="q' + idx + '"]:checked');
      const card = document.getElementById('q-' + idx);
      const expEl = document.getElementById('exp-' + idx);

      // Disable all radios
      const radios = document.querySelectorAll('input[name="q' + idx + '"]');
      radios.forEach(function (r) { r.disabled = true; });

      // Mark options
      const labels = card.querySelectorAll('.option-label');
      labels[q.answer].classList.add('opt-correct');

      const chosen = selected ? parseInt(selected.value, 10) : -1;
      if (chosen === q.answer) {
        score++;
        card.classList.add('correct');
      } else {
        card.classList.add('wrong');
        if (chosen >= 0) labels[chosen].classList.add('opt-wrong');
      }

      // Show explanation
      expEl.classList.add('visible');
    });

    // Re-typeset MathJax in explanations
    if (window.MathJax && MathJax.typesetPromise) {
      MathJax.typesetPromise();
    }

    // Score panel
    showScore(score);

    // Scroll to top of quiz
    const quizWrap = document.querySelector('.quiz-wrap');
    if (quizWrap) quizWrap.scrollIntoView({ behavior: 'smooth' });

    // Switch buttons
    const submitBtn = document.getElementById('btn-submit');
    const resetBtn  = document.getElementById('btn-reset');
    if (submitBtn) submitBtn.style.display = 'none';
    if (resetBtn)  resetBtn.style.display  = 'inline-flex';
  }

  // ── Score Panel ────────────────────────────────────────────────────────────
  function showScore(score) {
    const total = QUESTIONS.length;
    const pct   = Math.round((score / total) * 100);
    const panel = document.getElementById('score-panel');
    if (!panel) return;

    document.getElementById('score-num').textContent  = score + ' / ' + total;
    document.getElementById('score-pct').textContent  = pct + '%';
    const fill = document.getElementById('score-bar');
    if (fill) {
      fill.style.width = '0%';
      setTimeout(function () { fill.style.width = pct + '%'; }, 100);
    }

    const grade = document.getElementById('score-grade');
    if (grade) {
      if (pct >= 70) {
        grade.textContent = '&#x1F389; Pass – Great work!';
        grade.innerHTML   = '&#x1F389; Pass &ndash; Great work!';
        grade.className   = 'score-grade pass';
      } else {
        grade.textContent = 'Keep studying – aim for 70%+';
        grade.className   = 'score-grade fail';
      }
    }

    panel.classList.add('visible');
    updateProgress();
  }

  // ── Reset ──────────────────────────────────────────────────────────────────
  function resetQuiz() {
    submitted = false;
    QUESTIONS.forEach(function (q, idx) {
      const card  = document.getElementById('q-' + idx);
      const expEl = document.getElementById('exp-' + idx);
      card.classList.remove('correct', 'wrong');
      expEl.classList.remove('visible');

      const radios = document.querySelectorAll('input[name="q' + idx + '"]');
      radios.forEach(function (r) { r.disabled = false; r.checked = false; });

      const labels = card.querySelectorAll('.option-label');
      labels.forEach(function (l) { l.classList.remove('opt-correct', 'opt-wrong', 'opt-selected'); });
    });

    const panel = document.getElementById('score-panel');
    if (panel) panel.classList.remove('visible');

    const submitBtn = document.getElementById('btn-submit');
    const resetBtn  = document.getElementById('btn-reset');
    if (submitBtn) submitBtn.style.display = 'inline-flex';
    if (resetBtn)  resetBtn.style.display  = 'none';

    updateProgress();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ── Expose globals ─────────────────────────────────────────────────────────
  window.QuizEngine = { build: buildQuiz, check: checkAnswers, reset: resetQuiz };

  // Auto-build on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', buildQuiz);
  } else {
    buildQuiz();
  }
})();
