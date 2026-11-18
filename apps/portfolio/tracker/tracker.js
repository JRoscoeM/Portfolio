(function () {
  "use strict";

  const DEMO_STORAGE_KEY = "daily-log-guest-v1";
  const COLOR_OPTIONS = ["#b7ed55", "#ff806d", "#f3c969", "#78bde8", "#ca8ff0"];
  // Anchors "every N days" windows for habits that have no start date (older guest data).
  const INTERVAL_ANCHOR_DATE = "2026-01-05";
  const SCHEDULE_HINTS = {
    weekly: "Weeks run Monday to Sunday. It stays on Today until you've done it that week.",
    interval: "It stays on Today until you hit the goal for the current stretch of days.",
  };

  const WEEKDAYS = [
    { value: 0, short: "S", label: "Sunday" },
    { value: 1, short: "M", label: "Monday" },
    { value: 2, short: "T", label: "Tuesday" },
    { value: 3, short: "W", label: "Wednesday" },
    { value: 4, short: "T", label: "Thursday" },
    { value: 5, short: "F", label: "Friday" },
    { value: 6, short: "S", label: "Saturday" },
  ];

  const elements = {
    bootScreen: document.getElementById("boot-screen"),
    accessScreen: document.getElementById("access-screen"),
    app: document.getElementById("app"),
    loginError: document.getElementById("login-error"),
    modeLabel: document.getElementById("mode-label"),
    guestBadge: document.getElementById("guest-badge"),
    guestBanner: document.getElementById("guest-banner"),
    exitModeLabel: document.getElementById("exit-mode-label"),
    habitDialog: document.getElementById("habit-dialog"),
    habitForm: document.getElementById("habit-form"),
    routineDialog: document.getElementById("routine-dialog"),
    routineForm: document.getElementById("routine-form"),
    exerciseDialog: document.getElementById("exercise-dialog"),
    exerciseCreateDialog: document.getElementById("exercise-create-dialog"),
    exerciseCreateForm: document.getElementById("exercise-create-form"),
    restTimer: document.getElementById("rest-timer"),
  };

  let state = null;
  let mode = null;
  let activeView = "today";
  let habitFilter = "active";
  let activeWorkout = null;
  let exerciseCreateTarget = "workout";
  let workoutClock = null;
  let restClock = null;
  let restRemaining = 0;
  let selectedScheduleMode = "daily";
  let selectedHabitDays = new Set([0, 1, 2, 3, 4, 5, 6]);
  let selectedWeeklyTarget = 1;
  let routineTickOrder = [];
  let selectedHabitColor = COLOR_OPTIONS[0];

  function refreshIcons() {
    if (window.lucide) {
      window.lucide.createIcons({ attrs: { "stroke-width": 1.8 } });
    }
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function makeId(prefix) {
    const value = window.crypto && window.crypto.randomUUID
      ? window.crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    return `${prefix}-${value}`;
  }

  function localDateKey(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  function dateFromKey(value) {
    const [year, month, day] = String(value).slice(0, 10).split("-").map(Number);
    return new Date(year, month - 1, day, 12, 0, 0);
  }

  function shiftDate(date, amount) {
    const shifted = new Date(date);
    shifted.setDate(shifted.getDate() + amount);
    return shifted;
  }

  function daysAgo(amount) {
    return localDateKey(shiftDate(new Date(), -amount));
  }

  function isoAgo(amount, hour = 18) {
    const date = shiftDate(new Date(), -amount);
    date.setHours(hour, 0, 0, 0);
    return date.toISOString();
  }

  function formatDuration(totalSeconds) {
    const seconds = Math.max(0, Number(totalSeconds) || 0);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainder = Math.floor(seconds % 60);
    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
    }
    return `${minutes}:${String(remainder).padStart(2, "0")}`;
  }

  function formatNumber(value, maximumFractionDigits = 0) {
    return new Intl.NumberFormat("en-US", { maximumFractionDigits }).format(Number(value) || 0);
  }

  function buildDemoData() {
    const exercises = [
      { id: "demo-bench", name: "Barbell Bench Press", category: "Chest", equipment: "Barbell", trackingType: "weight_reps", defaultRestSeconds: 120 },
      { id: "demo-row", name: "Chest-Supported Row", category: "Back", equipment: "Dumbbell", trackingType: "weight_reps", defaultRestSeconds: 90 },
      { id: "demo-ohp", name: "Overhead Press", category: "Shoulders", equipment: "Barbell", trackingType: "weight_reps", defaultRestSeconds: 120 },
      { id: "demo-pulldown", name: "Lat Pulldown", category: "Back", equipment: "Cable", trackingType: "weight_reps", defaultRestSeconds: 90 },
      { id: "demo-squat", name: "Back Squat", category: "Legs", equipment: "Barbell", trackingType: "weight_reps", defaultRestSeconds: 180 },
      { id: "demo-rdl", name: "Romanian Deadlift", category: "Legs", equipment: "Barbell", trackingType: "weight_reps", defaultRestSeconds: 150 },
      { id: "demo-lunge", name: "Walking Lunge", category: "Legs", equipment: "Dumbbell", trackingType: "weight_reps", defaultRestSeconds: 90 },
      { id: "demo-curl", name: "Dumbbell Curl", category: "Arms", equipment: "Dumbbell", trackingType: "weight_reps", defaultRestSeconds: 60 },
      { id: "demo-run", name: "Treadmill Run", category: "Conditioning", equipment: "Machine", trackingType: "distance", defaultRestSeconds: 60 },
    ];

    const habits = [
      {
        id: "demo-habit-water",
        name: "Drink water",
        description: "Eight glasses across the day",
        trackingType: "count",
        targetValue: 8,
        unit: "glasses",
        frequencyType: "daily",
        daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
        color: COLOR_OPTIONS[3],
        archivedAt: null,
        entries: [
          { entryDate: daysAgo(0), value: 5, status: "partial" },
          { entryDate: daysAgo(1), value: 8, status: "completed" },
          { entryDate: daysAgo(2), value: 8, status: "completed" },
          { entryDate: daysAgo(3), value: 8, status: "completed" },
          { entryDate: daysAgo(4), value: 6, status: "partial" },
          { entryDate: daysAgo(5), value: 8, status: "completed" },
        ],
      },
      {
        id: "demo-habit-read",
        name: "Read",
        description: "Uninterrupted pages before bed",
        trackingType: "duration",
        targetValue: 20,
        unit: "min",
        frequencyType: "daily",
        daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
        color: COLOR_OPTIONS[2],
        archivedAt: null,
        entries: [
          { entryDate: daysAgo(0), value: 20, status: "completed" },
          { entryDate: daysAgo(1), value: 25, status: "completed" },
          { entryDate: daysAgo(2), value: 20, status: "completed" },
          { entryDate: daysAgo(4), value: 30, status: "completed" },
          { entryDate: daysAgo(5), value: 20, status: "completed" },
          { entryDate: daysAgo(6), value: 20, status: "completed" },
        ],
      },
      {
        id: "demo-habit-mobility",
        name: "Mobility",
        description: "Ten-minute hip and shoulder reset",
        trackingType: "boolean",
        targetValue: 1,
        unit: "session",
        frequencyType: "specific_days",
        daysOfWeek: [1, 3, 5],
        color: COLOR_OPTIONS[4],
        archivedAt: null,
        entries: [
          { entryDate: daysAgo(2), value: 1, status: "completed" },
          { entryDate: daysAgo(4), value: 1, status: "completed" },
          { entryDate: daysAgo(6), value: 1, status: "completed" },
        ],
      },
      {
        id: "demo-habit-plan",
        name: "Plan tomorrow",
        description: "Write the next day's top three",
        trackingType: "boolean",
        targetValue: 1,
        unit: "check-in",
        frequencyType: "daily",
        daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
        color: COLOR_OPTIONS[0],
        archivedAt: null,
        entries: [
          { entryDate: daysAgo(1), value: 1, status: "completed" },
          { entryDate: daysAgo(2), value: 1, status: "completed" },
          { entryDate: daysAgo(3), value: 1, status: "completed" },
          { entryDate: daysAgo(4), value: 1, status: "completed" },
          { entryDate: daysAgo(5), value: 1, status: "completed" },
        ],
      },
    ];

    const routines = [
      {
        id: "demo-routine-upper",
        name: "Upper A",
        notes: "Press and pull",
        exercises: [
          { exerciseId: "demo-bench", name: "Barbell Bench Press", trackingType: "weight_reps", position: 1, targetSets: 3, targetReps: 8, restSeconds: 120 },
          { exerciseId: "demo-row", name: "Chest-Supported Row", trackingType: "weight_reps", position: 2, targetSets: 3, targetReps: 10, restSeconds: 90 },
          { exerciseId: "demo-ohp", name: "Overhead Press", trackingType: "weight_reps", position: 3, targetSets: 3, targetReps: 8, restSeconds: 120 },
          { exerciseId: "demo-pulldown", name: "Lat Pulldown", trackingType: "weight_reps", position: 4, targetSets: 3, targetReps: 10, restSeconds: 90 },
        ],
      },
      {
        id: "demo-routine-lower",
        name: "Lower A",
        notes: "Squat emphasis",
        exercises: [
          { exerciseId: "demo-squat", name: "Back Squat", trackingType: "weight_reps", position: 1, targetSets: 4, targetReps: 6, restSeconds: 180 },
          { exerciseId: "demo-rdl", name: "Romanian Deadlift", trackingType: "weight_reps", position: 2, targetSets: 3, targetReps: 8, restSeconds: 150 },
          { exerciseId: "demo-lunge", name: "Walking Lunge", trackingType: "weight_reps", position: 3, targetSets: 3, targetReps: 10, restSeconds: 90 },
        ],
      },
      {
        id: "demo-routine-upper-b",
        name: "Upper B",
        notes: "Shoulders and arms",
        exercises: [
          { exerciseId: "demo-ohp", name: "Overhead Press", trackingType: "weight_reps", position: 1, targetSets: 4, targetReps: 6, restSeconds: 150 },
          { exerciseId: "demo-pulldown", name: "Lat Pulldown", trackingType: "weight_reps", position: 2, targetSets: 3, targetReps: 10, restSeconds: 90 },
          { exerciseId: "demo-curl", name: "Dumbbell Curl", trackingType: "weight_reps", position: 3, targetSets: 3, targetReps: 12, restSeconds: 60 },
        ],
      },
    ];

    const workouts = [
      {
        id: "demo-workout-1",
        routineId: "demo-routine-lower",
        name: "Lower A",
        startedAt: isoAgo(2, 17),
        completedAt: isoAgo(2, 18),
        durationSeconds: 3260,
        notes: "Felt steady. Add five pounds to squats next time.",
        exercises: [
          {
            exerciseId: "demo-squat",
            name: "Back Squat",
            position: 1,
            sets: [
              { position: 1, weight: 185, weightUnit: "lb", reps: 6, rpe: 7, completed: true },
              { position: 2, weight: 185, weightUnit: "lb", reps: 6, rpe: 7.5, completed: true },
              { position: 3, weight: 185, weightUnit: "lb", reps: 6, rpe: 8, completed: true },
              { position: 4, weight: 185, weightUnit: "lb", reps: 6, rpe: 8.5, completed: true },
            ],
          },
          {
            exerciseId: "demo-rdl",
            name: "Romanian Deadlift",
            position: 2,
            sets: [
              { position: 1, weight: 155, weightUnit: "lb", reps: 8, rpe: 7, completed: true },
              { position: 2, weight: 155, weightUnit: "lb", reps: 8, rpe: 7.5, completed: true },
              { position: 3, weight: 155, weightUnit: "lb", reps: 8, rpe: 8, completed: true },
            ],
          },
        ],
      },
      {
        id: "demo-workout-2",
        routineId: "demo-routine-upper",
        name: "Upper A",
        startedAt: isoAgo(5, 17),
        completedAt: isoAgo(5, 18),
        durationSeconds: 2890,
        notes: "Clean reps throughout.",
        exercises: [
          {
            exerciseId: "demo-bench",
            name: "Barbell Bench Press",
            position: 1,
            sets: [
              { position: 1, weight: 145, weightUnit: "lb", reps: 8, rpe: 7, completed: true },
              { position: 2, weight: 145, weightUnit: "lb", reps: 8, rpe: 8, completed: true },
              { position: 3, weight: 145, weightUnit: "lb", reps: 7, rpe: 9, completed: true },
            ],
          },
          {
            exerciseId: "demo-row",
            name: "Chest-Supported Row",
            position: 2,
            sets: [
              { position: 1, weight: 55, weightUnit: "lb", reps: 10, rpe: 7, completed: true },
              { position: 2, weight: 55, weightUnit: "lb", reps: 10, rpe: 8, completed: true },
              { position: 3, weight: 55, weightUnit: "lb", reps: 10, rpe: 8, completed: true },
            ],
          },
        ],
      },
      {
        id: "demo-workout-3",
        routineId: "demo-routine-upper-b",
        name: "Upper B",
        startedAt: isoAgo(9, 17),
        completedAt: isoAgo(9, 18),
        durationSeconds: 2650,
        exercises: [
          {
            exerciseId: "demo-ohp",
            name: "Overhead Press",
            position: 1,
            sets: [
              { position: 1, weight: 95, weightUnit: "lb", reps: 6, rpe: 7, completed: true },
              { position: 2, weight: 95, weightUnit: "lb", reps: 6, rpe: 8, completed: true },
              { position: 3, weight: 95, weightUnit: "lb", reps: 6, rpe: 8.5, completed: true },
            ],
          },
        ],
      },
    ];

    return {
      profile: {
        displayName: "Guest",
        timezone: "America/Denver",
        weightUnit: "lb",
        distanceUnit: "mi",
      },
      habits,
      routines,
      exercises,
      workouts,
    };
  }

  // Routine exercises carry a rep range; older data (and the guest demo) only has a single `targetReps`.
  function normalizeRepRange(exercise) {
    if (exercise.trackingType === "duration" || exercise.trackingType === "distance") {
      return { targetRepsMin: null, targetRepsMax: null, targetReps: null };
    }
    const min = Number(exercise.targetRepsMin ?? exercise.targetReps ?? 8);
    const max = Math.max(min, Number(exercise.targetRepsMax ?? exercise.targetReps ?? min));
    return { targetRepsMin: min, targetRepsMax: max, targetReps: min };
  }

  function formatRepRange(min, max) {
    return min === max ? `${min}` : `${min}–${max}`;
  }

  function normalizeState(data) {
    const normalized = data || {};
    normalized.profile = normalized.profile || {
      displayName: "Owner",
      timezone: "America/Denver",
      weightUnit: "lb",
      distanceUnit: "mi",
    };
    normalized.habits = (normalized.habits || []).map((habit) => ({
      ...habit,
      targetValue: Number(habit.targetValue ?? 1),
      daysOfWeek: (habit.daysOfWeek || [0, 1, 2, 3, 4, 5, 6]).map(Number),
      entries: (habit.entries || []).map((entry) => ({ ...entry, value: Number(entry.value || 0) })),
    }));
    normalized.routines = (normalized.routines || []).map((routine) => ({
      ...routine,
      exercises: (routine.exercises || []).map((exercise, index) => ({
        ...exercise,
        exerciseId: exercise.exerciseId || exercise.id,
        position: Number(exercise.position || index + 1),
        targetSets: Number(exercise.targetSets || 3),
        ...normalizeRepRange(exercise),
        restSeconds: Number(exercise.restSeconds || 90),
      })),
    }));
    normalized.exercises = normalized.exercises || [];
    normalized.workouts = (normalized.workouts || []).map((workout) => ({
      ...workout,
      exercises: workout.exercises || [],
      durationSeconds: Number(workout.durationSeconds || 0),
      totalVolume: Number(workout.totalVolume || calculateWorkoutVolume(workout)),
    }));
    return normalized;
  }

  function loadGuestState() {
    try {
      const saved = window.localStorage.getItem(DEMO_STORAGE_KEY);
      return normalizeState(saved ? JSON.parse(saved) : buildDemoData());
    } catch (error) {
      console.warn("Could not load guest data", error);
      return normalizeState(buildDemoData());
    }
  }

  function persistGuestState() {
    if (mode !== "guest") {
      return;
    }
    window.localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(state));
  }

  async function apiFetch(url, options = {}) {
    const response = await fetch(url, {
      credentials: "same-origin",
      ...options,
      headers: {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...(options.headers || {}),
      },
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(data.error || "The request could not be completed.");
      error.status = response.status;
      error.data = data;
      throw error;
    }
    return data;
  }

  async function loadOwnerState() {
    const data = await apiFetch("/api/tracker/bootstrap");
    state = normalizeState(data);
    mode = "owner";
    showApp();
  }

  async function initialize() {
    setupStaticControls();
    refreshIcons();
    try {
      await loadOwnerState();
    } catch (error) {
      if (![401, 404, 503].includes(error.status)) {
        console.warn("Tracker bootstrap failed", error);
      }
      showAccess();
      await showSignInOptions(error.status);
    }
  }

  const AUTH_ERROR_MESSAGES = {
    cancelled: "Sign-in was cancelled.",
    expired: "That sign-in attempt expired. Try again.",
    failed: "Sign-in could not be completed. Try again.",
  };

  // Reads and clears the ?auth_error= code the OAuth callback leaves on a failed sign-in.
  function takeAuthError() {
    const url = new URL(window.location.href);
    const code = url.searchParams.get("auth_error");
    if (!code) {
      return "";
    }
    url.searchParams.delete("auth_error");
    window.history.replaceState(null, "", url);
    return AUTH_ERROR_MESSAGES[code] || AUTH_ERROR_MESSAGES.failed;
  }

  async function showSignInOptions(bootstrapStatus) {
    const notConfigured = "Sign-in is not configured on this deployment.";
    let message = takeAuthError();
    let providers = [];
    if (bootstrapStatus === 503) {
      message = notConfigured;
    } else {
      try {
        providers = (await apiFetch("/api/tracker/auth")).providers || [];
        if (!providers.length) {
          message = notConfigured;
        }
      } catch (error) {
        message = message || "Sign-in is unavailable right now.";
      }
    }
    document.querySelectorAll("[data-auth-provider]").forEach((link) => {
      link.classList.toggle("is-hidden", !providers.includes(link.dataset.authProvider));
    });
    elements.loginError.textContent = message;
  }

  function showAccess() {
    stopWorkoutClock();
    stopRestTimer();
    elements.bootScreen.classList.add("is-hidden");
    elements.app.classList.add("is-hidden");
    elements.accessScreen.classList.remove("is-hidden");
    refreshIcons();
  }

  function showApp() {
    elements.bootScreen.classList.add("is-hidden");
    elements.accessScreen.classList.add("is-hidden");
    elements.app.classList.remove("is-hidden");
    const isGuest = mode === "guest";
    elements.modeLabel.textContent = isGuest ? "Guest workspace" : "Your workspace";
    elements.guestBadge.classList.toggle("is-hidden", !isGuest);
    elements.guestBanner.classList.toggle("is-hidden", !isGuest);
    elements.exitModeLabel.textContent = isGuest ? "Exit demo" : "Sign out";
    renderAll();
    switchView(activeView);
  }

  function setupStaticControls() {
    document.getElementById("guest-login").addEventListener("click", () => {
      mode = "guest";
      state = loadGuestState();
      showApp();
    });

    document.getElementById("exit-mode").addEventListener("click", exitCurrentMode);
    document.getElementById("reset-demo").addEventListener("click", resetDemo);
    elements.habitForm.addEventListener("submit", saveHabit);
    elements.routineForm.addEventListener("submit", saveRoutine);
    elements.exerciseCreateForm.addEventListener("submit", saveNewExercise);
    document.getElementById("exercise-create-tracking").addEventListener("change", syncExerciseCreateRepsField);
    document.getElementById("routine-exercise-picker").addEventListener("change", handleRoutinePickerChange);
    document.getElementById("routine-exercise-search").addEventListener("input", filterRoutinePicker);
    document.getElementById("routine-exercise-search").addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
      }
    });
    document.getElementById("archive-habit").addEventListener("click", archiveCurrentHabit);
    document.getElementById("habit-tracking-type").addEventListener("change", syncHabitTargetField);
    document.getElementById("exercise-search").addEventListener("input", renderExerciseLibrary);

    document.querySelectorAll("[data-close-dialog]").forEach((button) => {
      button.addEventListener("click", () => document.getElementById(button.dataset.closeDialog).close());
    });

    document.querySelectorAll("[data-schedule-mode]").forEach((button) => {
      button.addEventListener("click", () => setScheduleMode(button.dataset.scheduleMode));
    });

    document.addEventListener("click", handleDelegatedClick);
    document.addEventListener("input", handleWorkoutInput);
    window.addEventListener("beforeunload", persistGuestState);

    buildWeekdayPicker();
    buildColorPicker();
  }

  async function exitCurrentMode() {
    if (mode === "owner") {
      try {
        await apiFetch("/api/tracker/auth", { method: "DELETE" });
      } catch (error) {
        console.warn("Owner sign-out failed", error);
      }
    }
    activeWorkout = null;
    mode = null;
    state = null;
    showAccess();
    await showSignInOptions();
  }

  function resetDemo() {
    window.localStorage.removeItem(DEMO_STORAGE_KEY);
    state = normalizeState(buildDemoData());
    activeWorkout = null;
    renderAll();
    toast("Guest workspace reset.");
  }

  function switchView(viewName) {
    activeView = viewName;
    document.querySelectorAll(".view").forEach((view) => {
      view.classList.toggle("is-active", view.id === `view-${viewName}`);
    });
    document.querySelectorAll(".nav-item[data-view]").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.view === viewName);
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
    refreshIcons();
  }

  function handleDelegatedClick(event) {
    const nav = event.target.closest("[data-view]");
    if (nav) {
      switchView(nav.dataset.view);
      return;
    }

    const action = event.target.closest("[data-action]");
    if (action) {
      handleAction(action.dataset.action, action.dataset);
      return;
    }

    const filter = event.target.closest("[data-habit-filter]");
    if (filter) {
      habitFilter = filter.dataset.habitFilter;
      document.querySelectorAll("[data-habit-filter]").forEach((button) => {
        button.classList.toggle("is-active", button === filter);
      });
      renderHabitCatalog();
      return;
    }

    const weekday = event.target.closest("[data-weekday]");
    if (weekday) {
      const value = Number(weekday.dataset.weekday);
      if (selectedHabitDays.has(value)) {
        selectedHabitDays.delete(value);
      } else {
        selectedHabitDays.add(value);
      }
      renderWeekdayPicker();
      return;
    }

    const swatch = event.target.closest("[data-habit-color]");
    if (swatch) {
      selectedHabitColor = swatch.dataset.habitColor;
      renderColorPicker();
    }
  }

  function handleAction(action, data) {
    switch (action) {
      case "new-habit":
        openHabitDialog();
        break;
      case "edit-habit":
        openHabitDialog(data.id);
        break;
      case "toggle-habit":
        toggleHabit(data.id);
        break;
      case "habit-increment":
        changeHabitValue(data.id, 1);
        break;
      case "habit-decrement":
        changeHabitValue(data.id, -1);
        break;
      case "start-workout":
        startWorkout(nextRoutine()?.id || null);
        break;
      case "empty-workout":
        startWorkout(null);
        break;
      case "start-routine":
        startWorkout(data.id);
        break;
      case "new-routine":
        openRoutineDialog();
        break;
      case "edit-routine":
        openRoutineDialog(data.id);
        break;
      case "add-exercise":
        openExerciseDialog();
        break;
      case "new-exercise":
        openExerciseCreateDialog(data.target);
        break;
      case "choose-exercise":
        addExerciseToWorkout(data.id);
        break;
      case "add-set":
        addWorkoutSet(data.exerciseIndex);
        break;
      case "remove-set":
        removeWorkoutSet(data.exerciseIndex, data.setIndex);
        break;
      case "remove-exercise":
        removeWorkoutExercise(data.exerciseIndex);
        break;
      case "complete-set":
        toggleWorkoutSet(data.exerciseIndex, data.setIndex);
        break;
      case "cancel-workout":
        cancelWorkout();
        break;
      case "finish-workout":
        finishWorkout();
        break;
      default:
        break;
    }
  }

  function renderAll() {
    renderToday();
    renderHabitCatalog();
    renderTrainingHome();
    renderHistory();
    if (activeWorkout) {
      renderActiveWorkout();
    }
    refreshIcons();
  }

  function habitEntry(habit, dateKey = localDateKey()) {
    return (habit.entries || []).find((entry) => String(entry.entryDate).slice(0, 10) === dateKey) || null;
  }

  function isHabitComplete(habit, entry) {
    if (!entry || entry.status === "skipped") {
      return false;
    }
    return entry.status === "completed" || entry.status === "complete" || Number(entry.value) >= Number(habit.targetValue || 1);
  }

  // Flexible habits ("once a week", "3 times every 10 days") have a goal per window of days instead of fixed days.
  function habitGoal(habit) {
    if (habit.frequencyType === "weekly") {
      return { count: Number(habit.targetDaysPerWeek || 1), days: 7, unit: "week" };
    }
    if (habit.frequencyType === "interval") {
      return { count: Number(habit.intervalCount || 1), days: Number(habit.intervalDays || 1), unit: "cycle" };
    }
    return null;
  }

  function dayNumber(date) {
    return Math.round(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000);
  }

  // First day of the goal window holding `date`: the Monday for weekly goals, otherwise
  // back-to-back windows of `goal.days` days counted from the habit's start date.
  function habitWindowStart(habit, goal, date) {
    if (habit.frequencyType === "weekly") {
      return shiftDate(date, -((date.getDay() + 6) % 7));
    }
    const offset = dayNumber(date) - dayNumber(dateFromKey(habit.startDate || INTERVAL_ANCHOR_DATE));
    return shiftDate(date, -(((offset % goal.days) + goal.days) % goal.days));
  }

  function completionsBetween(habit, start, endExclusive) {
    let count = 0;
    for (let cursor = new Date(start); dayNumber(cursor) < dayNumber(endExclusive); cursor = shiftDate(cursor, 1)) {
      if (isHabitComplete(habit, habitEntry(habit, localDateKey(cursor)))) {
        count += 1;
      }
    }
    return count;
  }

  function isGoalWindowMet(habit, goal, start) {
    return completionsBetween(habit, start, shiftDate(start, goal.days)) >= goal.count;
  }

  function isHabitDue(habit, date = new Date()) {
    if (habit.archivedAt) {
      return false;
    }
    const goal = habitGoal(habit);
    if (goal) {
      // Due until the window's goal is met; a day it was done on still counts as due so it shows as complete.
      if (isHabitComplete(habit, habitEntry(habit, localDateKey(date)))) {
        return true;
      }
      return completionsBetween(habit, habitWindowStart(habit, goal, date), date) < goal.count;
    }
    if (habit.frequencyType === "specific_days" || habit.frequencyType === "weekdays") {
      return (habit.daysOfWeek || []).map(Number).includes(date.getDay());
    }
    return true;
  }

  function habitScheduleLabel(habit) {
    const goal = habitGoal(habit);
    if (goal && habit.frequencyType === "weekly") {
      return goal.count === 1 ? "Once a week" : `${goal.count} times a week`;
    }
    if (goal) {
      const times = goal.count === 1 ? "Once" : `${goal.count} times`;
      return goal.days === 1 ? `${times} a day` : `${times} every ${goal.days} days`;
    }
    if (habit.frequencyType === "specific_days" || habit.frequencyType === "weekdays") {
      const days = (habit.daysOfWeek || []).map((day) => WEEKDAYS.find((item) => item.value === Number(day))?.label.slice(0, 3)).filter(Boolean);
      return days.length ? days.join(", ") : "No days selected";
    }
    return "Every day";
  }

  function streakLabel(habit) {
    return `${calculateStreak(habit)} ${habitGoal(habit)?.unit || "day"} streak`;
  }

  // Short status line for a habit on Today: goal progress for flexible habits, otherwise the streak.
  function habitStatusLabel(habit) {
    const goal = habitGoal(habit);
    if (!goal) {
      return streakLabel(habit);
    }
    const start = habitWindowStart(habit, goal, new Date());
    const done = completionsBetween(habit, start, shiftDate(start, goal.days));
    return `${Math.min(done, goal.count)}/${goal.count} this ${goal.unit} · ${streakLabel(habit)}`;
  }

  function calculateStreak(habit) {
    const goal = habitGoal(habit);
    if (goal) {
      // Counts back whole windows; the current window only adds once it is met and never breaks the streak.
      let streak = 0;
      let start = habitWindowStart(habit, goal, new Date());
      for (let scanned = 0; scanned < 104; scanned += 1) {
        if (isGoalWindowMet(habit, goal, start)) {
          streak += 1;
        } else if (scanned > 0) {
          break;
        }
        start = shiftDate(start, -goal.days);
      }
      return streak;
    }
    let streak = 0;
    let cursor = new Date();
    for (let scanned = 0; scanned < 365; scanned += 1) {
      if (!isHabitDue(habit, cursor)) {
        cursor = shiftDate(cursor, -1);
        continue;
      }
      const entry = habitEntry(habit, localDateKey(cursor));
      if (isHabitComplete(habit, entry)) {
        streak += 1;
      } else if (localDateKey(cursor) !== localDateKey()) {
        break;
      }
      cursor = shiftDate(cursor, -1);
    }
    return streak;
  }

  function completionRateLabel(habit) {
    const goal = habitGoal(habit);
    return goal ? `4-${goal.unit} rate` : "7-day rate";
  }

  function completionRate(habit, days = 7) {
    const goal = habitGoal(habit);
    if (goal) {
      // Share of the last four windows that met the goal; the current window counts only once it is met.
      let start = habitWindowStart(habit, goal, new Date());
      let counted = 0;
      let met = 0;
      if (isGoalWindowMet(habit, goal, start)) {
        counted = 1;
        met = 1;
      }
      while (counted < 4) {
        start = shiftDate(start, -goal.days);
        counted += 1;
        met += isGoalWindowMet(habit, goal, start) ? 1 : 0;
      }
      return Math.round((met / counted) * 100);
    }
    let due = 0;
    let complete = 0;
    for (let offset = 0; offset < days; offset += 1) {
      const date = shiftDate(new Date(), -offset);
      if (!isHabitDue(habit, date)) {
        continue;
      }
      due += 1;
      if (isHabitComplete(habit, habitEntry(habit, localDateKey(date)))) {
        complete += 1;
      }
    }
    return due ? Math.round((complete / due) * 100) : 0;
  }

  function renderToday() {
    const today = new Date();
    document.getElementById("today-date").textContent = new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    }).format(today);

    const dueHabits = state.habits.filter((habit) => isHabitDue(habit, today));
    const completed = dueHabits.filter((habit) => isHabitComplete(habit, habitEntry(habit))).length;
    const weekStart = shiftDate(today, -6);
    const recentWorkouts = state.workouts.filter((workout) => new Date(workout.startedAt || workout.completedAt) >= weekStart);
    const recentVolume = recentWorkouts.reduce((total, workout) => total + calculateWorkoutVolume(workout), 0);

    document.getElementById("summary-strip").innerHTML = [
      summaryMetric("circle-check-big", `${completed}/${dueHabits.length}`, "Habits complete", ""),
      summaryMetric("dumbbell", String(recentWorkouts.length), "Workouts / 7 days", "coral"),
      summaryMetric("trending-up", `${formatNumber(recentVolume)} lb`, "7-day volume", "gold"),
    ].join("");

    renderTodayHabits(dueHabits);
    renderNextSession();
    renderWeekActivity();
  }

  function summaryMetric(icon, value, label, colorClass) {
    return `
      <div class="summary-metric">
        <span class="metric-icon ${colorClass}"><i data-lucide="${icon}" aria-hidden="true"></i></span>
        <div>
          <p class="metric-value">${escapeHtml(value)}</p>
          <p class="metric-label">${escapeHtml(label)}</p>
        </div>
      </div>`;
  }

  function renderTodayHabits(habits) {
    const container = document.getElementById("today-habits");
    if (!habits.length) {
      container.innerHTML = `<div class="empty-state"><p>No habits scheduled today.</p><button class="text-button" type="button" data-action="new-habit">Add a habit</button></div>`;
      return;
    }
    container.innerHTML = habits.map((habit) => {
      const entry = habitEntry(habit);
      const value = Number(entry?.value || 0);
      const complete = isHabitComplete(habit, entry);
      const target = Number(habit.targetValue || 1);
      const unit = habit.trackingType === "duration" ? (habit.unit || "min") : (habit.unit || "");
      const progress = habit.trackingType === "boolean"
        ? `<span class="habit-meta">${escapeHtml(habitStatusLabel(habit))}</span>`
        : `<div class="habit-progress">
            <button class="stepper-button" type="button" data-action="habit-decrement" data-id="${escapeHtml(habit.id)}" aria-label="Decrease ${escapeHtml(habit.name)}"><i data-lucide="minus" aria-hidden="true"></i></button>
            <span class="progress-value">${formatNumber(value, 1)} / ${formatNumber(target, 1)} ${escapeHtml(unit)}</span>
            <button class="stepper-button" type="button" data-action="habit-increment" data-id="${escapeHtml(habit.id)}" aria-label="Increase ${escapeHtml(habit.name)}"><i data-lucide="plus" aria-hidden="true"></i></button>
          </div>`;
      return `
        <article class="habit-row ${complete ? "is-complete" : ""}" style="--habit-color:${escapeHtml(habit.color || COLOR_OPTIONS[0])}">
          <button class="habit-check" type="button" data-action="toggle-habit" data-id="${escapeHtml(habit.id)}" aria-label="${complete ? "Undo" : "Complete"} ${escapeHtml(habit.name)}">
            <i data-lucide="check" aria-hidden="true"></i>
          </button>
          <div class="habit-main">
            <p class="habit-name">${escapeHtml(habit.name)}</p>
            ${habit.trackingType === "boolean" ? progress : `<span class="habit-meta">${escapeHtml(habitGoal(habit) ? habitStatusLabel(habit) : habit.description || streakLabel(habit))}</span>`}
          </div>
          ${habit.trackingType === "boolean" ? "" : progress}
        </article>`;
    }).join("");
  }

  function nextRoutine() {
    if (!state.routines.length) {
      return null;
    }
    const latestRoutineId = [...state.workouts]
      .sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt))[0]?.routineId;
    const latestIndex = state.routines.findIndex((routine) => routine.id === latestRoutineId);
    return state.routines[(latestIndex + 1 + state.routines.length) % state.routines.length];
  }

  function renderNextSession() {
    const container = document.getElementById("next-session-content");
    const routine = nextRoutine();
    if (!routine) {
      container.innerHTML = `<div class="empty-state"><p>No routines yet.</p><button class="text-button" type="button" data-action="new-routine">Create routine</button></div>`;
      return;
    }
    const exerciseNames = routine.exercises.slice(0, 3).map((exercise) => exercise.name).join(" · ");
    container.innerHTML = `
      <div class="next-session-card">
        <h3>${escapeHtml(routine.name)}</h3>
        <p>${escapeHtml(exerciseNames)}${routine.exercises.length > 3 ? ` +${routine.exercises.length - 3}` : ""}</p>
        <button class="button button-secondary" type="button" data-action="start-routine" data-id="${escapeHtml(routine.id)}">
          <i data-lucide="play" aria-hidden="true"></i>
          Begin session
        </button>
      </div>`;
  }

  function renderWeekActivity() {
    const container = document.getElementById("week-activity");
    const days = [];
    for (let offset = 6; offset >= 0; offset -= 1) {
      const date = shiftDate(new Date(), -offset);
      const due = state.habits.filter((habit) => isHabitDue(habit, date));
      const done = due.filter((habit) => isHabitComplete(habit, habitEntry(habit, localDateKey(date)))).length;
      days.push({ date, ratio: due.length ? done / due.length : 0 });
    }
    container.innerHTML = days.map(({ date, ratio }) => `
      <div class="week-day" title="${Math.round(ratio * 100)}% complete">
        <div class="week-bar"><span class="week-bar-fill" style="height:${Math.max(3, ratio * 100)}%"></span></div>
        <span>${new Intl.DateTimeFormat("en-US", { weekday: "narrow" }).format(date)}</span>
      </div>`).join("");
  }

  function renderHabitCatalog() {
    const container = document.getElementById("habit-catalog");
    if (!container || !state) {
      return;
    }
    const showArchived = habitFilter === "archived";
    const habits = state.habits.filter((habit) => Boolean(habit.archivedAt) === showArchived);
    document.getElementById("habit-count").textContent = `${habits.length} ${habits.length === 1 ? "habit" : "habits"}`;
    if (!habits.length) {
      container.innerHTML = `<div class="empty-state"><p>${showArchived ? "No archived habits." : "Start with one habit you want to see every day."}</p>${showArchived ? "" : '<button class="text-button" type="button" data-action="new-habit">Create a habit</button>'}</div>`;
      return;
    }
    container.innerHTML = habits.map((habit) => {
      const weekCells = [];
      for (let offset = 6; offset >= 0; offset -= 1) {
        const date = shiftDate(new Date(), -offset);
        weekCells.push(`<span class="mini-day ${isHabitComplete(habit, habitEntry(habit, localDateKey(date))) ? "is-done" : ""}" title="${localDateKey(date)}"></span>`);
      }
      return `
        <article class="habit-card" style="--habit-color:${escapeHtml(habit.color || COLOR_OPTIONS[0])}">
          <div class="habit-card-header">
            <div>
              <h3>${escapeHtml(habit.name)}</h3>
              <p>${escapeHtml(habitScheduleLabel(habit))}</p>
            </div>
            <button class="icon-button" type="button" data-action="edit-habit" data-id="${escapeHtml(habit.id)}" aria-label="Edit ${escapeHtml(habit.name)}" title="Edit habit">
              <i data-lucide="pencil" aria-hidden="true"></i>
            </button>
          </div>
          <div class="habit-card-stats">
            <div><strong>${calculateStreak(habit)}</strong><span>${habitGoal(habit) ? `${habitGoal(habit).unit} streak` : "current streak"}</span></div>
            <div><strong>${completionRate(habit)}%</strong><span>${completionRateLabel(habit)}</span></div>
            <div class="mini-week" aria-label="Last seven days">${weekCells.join("")}</div>
          </div>
        </article>`;
    }).join("");
    refreshIcons();
  }

  function buildWeekdayPicker() {
    document.getElementById("weekday-picker").innerHTML = WEEKDAYS.map((day) => `
      <button class="weekday-button" type="button" data-weekday="${day.value}" aria-label="${day.label}" title="${day.label}">${day.short}</button>`).join("");
  }

  function renderWeekdayPicker() {
    document.querySelectorAll("[data-weekday]").forEach((button) => {
      const selected = selectedHabitDays.has(Number(button.dataset.weekday));
      button.classList.toggle("is-active", selected);
      button.setAttribute("aria-pressed", String(selected));
    });
  }

  function buildColorPicker() {
    document.getElementById("color-picker").innerHTML = COLOR_OPTIONS.map((color, index) => `
      <button class="color-swatch" style="--swatch:${color}" type="button" data-habit-color="${color}" aria-label="Color ${index + 1}"></button>`).join("");
  }

  function renderColorPicker() {
    document.querySelectorAll("[data-habit-color]").forEach((button) => {
      const selected = button.dataset.habitColor === selectedHabitColor;
      button.classList.toggle("is-active", selected);
      button.setAttribute("aria-pressed", String(selected));
    });
  }

  function setScheduleMode(scheduleMode) {
    selectedScheduleMode = scheduleMode;
    document.querySelectorAll("[data-schedule-mode]").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.scheduleMode === scheduleMode);
    });
    document.getElementById("weekday-picker").classList.toggle("is-hidden", scheduleMode !== "specific_days");
    document.getElementById("interval-fields").classList.toggle("is-hidden", scheduleMode !== "interval");
    const hint = document.getElementById("schedule-hint");
    hint.textContent = SCHEDULE_HINTS[scheduleMode] || "";
    hint.classList.toggle("is-hidden", !hint.textContent);
  }

  function syncHabitTargetField() {
    const type = document.getElementById("habit-tracking-type").value;
    const field = document.getElementById("habit-target-field");
    field.classList.toggle("is-hidden", type === "boolean");
    document.getElementById("habit-target").required = type !== "boolean";
    if (type === "duration" && !document.getElementById("habit-unit").value) {
      document.getElementById("habit-unit").value = "min";
    }
  }

  function openHabitDialog(habitId = null) {
    elements.habitForm.reset();
    document.getElementById("habit-form-error").textContent = "";
    const habit = habitId ? state.habits.find((item) => item.id === habitId) : null;
    document.getElementById("habit-dialog-title").textContent = habit ? "Edit habit" : "New habit";
    document.getElementById("habit-id").value = habit?.id || "";
    document.getElementById("habit-name").value = habit?.name || "";
    document.getElementById("habit-description").value = habit?.description || "";
    document.getElementById("habit-tracking-type").value = habit?.trackingType || "boolean";
    document.getElementById("habit-target").value = habit?.targetValue || 1;
    document.getElementById("habit-unit").value = habit?.unit || "";
    selectedHabitColor = habit?.color || COLOR_OPTIONS[0];
    selectedScheduleMode = habit?.frequencyType === "weekdays" ? "specific_days"
      : ["specific_days", "weekly", "interval"].includes(habit?.frequencyType) ? habit.frequencyType : "daily";
    selectedWeeklyTarget = Number(habit?.targetDaysPerWeek || 1);
    document.getElementById("habit-interval-count").value = habit?.intervalCount || 3;
    document.getElementById("habit-interval-days").value = habit?.intervalDays || 7;
    selectedHabitDays = new Set((habit?.daysOfWeek || [0, 1, 2, 3, 4, 5, 6]).map(Number));
    document.getElementById("archive-habit").classList.toggle("is-hidden", !habit || Boolean(habit.archivedAt));
    syncHabitTargetField();
    setScheduleMode(selectedScheduleMode);
    renderWeekdayPicker();
    renderColorPicker();
    elements.habitDialog.showModal();
    document.getElementById("habit-name").focus();
  }

  function habitScheduleError(payload) {
    if (payload.frequencyType === "specific_days" && payload.daysOfWeek.length === 0) {
      return "Choose at least one day.";
    }
    if (payload.frequencyType === "interval") {
      const { intervalCount: count, intervalDays: days } = payload;
      if (!Number.isInteger(count) || !Number.isInteger(days) || count < 1 || days < 1 || days > 90) {
        return "Use whole numbers, with at most 90 days.";
      }
      if (count > days) {
        return "Times can't be more than the number of days.";
      }
    }
    return "";
  }

  async function saveHabit(event) {
    event.preventDefault();
    const id = document.getElementById("habit-id").value;
    const trackingType = document.getElementById("habit-tracking-type").value;
    const payload = {
      name: document.getElementById("habit-name").value.trim(),
      description: document.getElementById("habit-description").value.trim(),
      trackingType,
      targetValue: trackingType === "boolean" ? 1 : Number(document.getElementById("habit-target").value),
      unit: trackingType === "boolean" ? "check-in" : document.getElementById("habit-unit").value.trim(),
      frequencyType: selectedScheduleMode,
      daysOfWeek: selectedScheduleMode === "specific_days" ? [...selectedHabitDays].sort() : [0, 1, 2, 3, 4, 5, 6],
      targetDaysPerWeek: selectedScheduleMode === "weekly" ? selectedWeeklyTarget : null,
      intervalCount: selectedScheduleMode === "interval" ? Number(document.getElementById("habit-interval-count").value) : null,
      intervalDays: selectedScheduleMode === "interval" ? Number(document.getElementById("habit-interval-days").value) : null,
      color: selectedHabitColor,
    };
    const scheduleError = habitScheduleError(payload);
    if (!payload.name || scheduleError) {
      document.getElementById("habit-form-error").textContent = payload.name ? scheduleError : "Give this habit a name.";
      return;
    }

    const submit = elements.habitForm.querySelector("button[type='submit']");
    submit.disabled = true;
    try {
      if (mode === "guest") {
        if (id) {
          const habit = state.habits.find((item) => item.id === id);
          Object.assign(habit, payload);
        } else {
          state.habits.push({ id: makeId("habit"), ...payload, startDate: localDateKey(), archivedAt: null, entries: [] });
        }
        persistGuestState();
      } else {
        await apiFetch(`/api/tracker/habits${id ? `?id=${encodeURIComponent(id)}` : ""}`, {
          method: id ? "PATCH" : "POST",
          body: JSON.stringify(payload),
        });
        await reloadOwnerData();
      }
      elements.habitDialog.close();
      renderAll();
      toast(id ? "Habit updated." : "Habit created.");
    } catch (error) {
      document.getElementById("habit-form-error").textContent = error.message;
    } finally {
      submit.disabled = false;
    }
  }

  async function archiveCurrentHabit() {
    const id = document.getElementById("habit-id").value;
    if (!id) {
      return;
    }
    try {
      if (mode === "guest") {
        state.habits.find((habit) => habit.id === id).archivedAt = new Date().toISOString();
        persistGuestState();
      } else {
        await apiFetch(`/api/tracker/habits?id=${encodeURIComponent(id)}`, { method: "DELETE" });
        await reloadOwnerData();
      }
      elements.habitDialog.close();
      renderAll();
      toast("Habit archived.");
    } catch (error) {
      document.getElementById("habit-form-error").textContent = error.message;
    }
  }

  async function toggleHabit(habitId) {
    const habit = state.habits.find((item) => item.id === habitId);
    if (!habit) {
      return;
    }
    const entry = habitEntry(habit);
    const complete = isHabitComplete(habit, entry);
    const value = complete ? 0 : Number(habit.targetValue || 1);
    await setHabitEntry(habit, value, complete ? "partial" : "complete");
  }

  async function changeHabitValue(habitId, direction) {
    const habit = state.habits.find((item) => item.id === habitId);
    if (!habit) {
      return;
    }
    const entry = habitEntry(habit);
    const step = habit.trackingType === "duration" ? 5 : 1;
    const value = Math.max(0, Number(entry?.value || 0) + (direction * step));
    const status = value >= Number(habit.targetValue || 1) ? "complete" : "partial";
    await setHabitEntry(habit, value, status);
  }

  async function setHabitEntry(habit, value, status) {
    const key = localDateKey();
    const existing = habitEntry(habit, key);
    if (existing) {
      existing.value = value;
      existing.status = status;
    } else {
      habit.entries.push({ entryDate: key, value, status, note: "" });
    }
    renderToday();
    renderHabitCatalog();
    renderHistory();
    refreshIcons();
    try {
      if (mode === "guest") {
        persistGuestState();
      } else if (value === 0) {
        await apiFetch(`/api/tracker/habit-entries?habitId=${encodeURIComponent(habit.id)}&entryDate=${key}`, { method: "DELETE" });
        await reloadOwnerData();
      } else {
        await apiFetch("/api/tracker/habit-entries", {
          method: "PUT",
          body: JSON.stringify({ habitId: habit.id, entryDate: key, value, status, note: existing?.note || "" }),
        });
        await reloadOwnerData();
      }
      renderAll();
    } catch (error) {
      toast(error.message, true);
      if (mode === "owner") {
        await reloadOwnerData().catch(() => {});
        renderAll();
      }
    }
  }

  function renderTrainingHome() {
    const home = document.getElementById("training-home");
    const active = document.getElementById("active-workout");
    home.classList.toggle("is-hidden", Boolean(activeWorkout));
    active.classList.toggle("is-hidden", !activeWorkout);
    if (activeWorkout) {
      return;
    }

    const routineList = document.getElementById("routine-list");
    if (!state.routines.length) {
      routineList.innerHTML = `<div class="empty-state"><p>Create a routine or begin an empty workout.</p><button class="text-button" type="button" data-action="new-routine">Create routine</button></div>`;
    } else {
      routineList.innerHTML = state.routines.map((routine, index) => `
        <article class="routine-card">
          <div class="routine-card-header">
            <span class="routine-number">${String(index + 1).padStart(2, "0")}</span>
            <button class="icon-button" type="button" data-action="edit-routine" data-id="${escapeHtml(routine.id)}" aria-label="Edit ${escapeHtml(routine.name)}" title="Edit routine">
              <i data-lucide="pencil" aria-hidden="true"></i>
            </button>
          </div>
          <h3>${escapeHtml(routine.name)}</h3>
          <p>${routine.exercises.length} exercises · ${escapeHtml(routine.exercises.slice(0, 2).map((exercise) => exercise.name).join(" · "))}</p>
          <button class="routine-start" type="button" data-action="start-routine" data-id="${escapeHtml(routine.id)}">Start routine</button>
        </article>`).join("");
    }

    const cutoff = shiftDate(new Date(), -30);
    const recent = state.workouts.filter((workout) => new Date(workout.startedAt || workout.completedAt) >= cutoff);
    const volume = recent.reduce((sum, workout) => sum + calculateWorkoutVolume(workout), 0);
    const totalSets = recent.reduce((sum, workout) => sum + workoutSetCount(workout), 0);
    const duration = recent.reduce((sum, workout) => sum + Number(workout.durationSeconds || 0), 0);
    document.getElementById("training-metrics").innerHTML = [
      trainingStat(recent.length, "Workouts"),
      trainingStat(`${formatNumber(volume)} lb`, "Volume"),
      trainingStat(totalSets, "Working sets"),
      trainingStat(`${Math.round(duration / 3600)} hr`, "Training time"),
    ].join("");
  }

  function trainingStat(value, label) {
    return `<div class="training-stat"><strong>${escapeHtml(value)}</strong><span>${escapeHtml(label)}</span></div>`;
  }

  const MIXED_REST = "mixed";

  // Opens the routine form empty, or filled from an existing routine when `routineId` is given.
  function openRoutineDialog(routineId = null) {
    const routine = routineId ? state.routines.find((item) => item.id === routineId) : null;
    elements.routineForm.reset();
    document.getElementById("routine-form-error").textContent = "";
    document.getElementById("routine-exercise-search").value = "";
    document.getElementById("routine-id").value = routine?.id || "";
    document.getElementById("routine-dialog-title").textContent = routine ? "Edit routine" : "New routine";
    document.getElementById("routine-submit").textContent = routine ? "Save routine" : "Create routine";
    document.getElementById("routine-name").value = routine?.name || "";

    const ranges = new Map();
    const rests = new Set();
    for (const item of routine?.exercises || []) {
      ranges.set(item.exerciseId, { sets: item.targetSets, min: item.targetRepsMin, max: item.targetRepsMax, rest: item.restSeconds });
      rests.add(Number(item.restSeconds || 90));
    }
    const first = routine?.exercises?.[0];
    if (first) {
      document.getElementById("routine-sets").value = first.targetSets || 3;
      const firstWithReps = routine.exercises.find((item) => item.targetRepsMin);
      if (firstWithReps) {
        document.getElementById("routine-reps-min").value = firstWithReps.targetRepsMin;
        document.getElementById("routine-reps-max").value = firstWithReps.targetRepsMax;
      }
    }
    setRoutineRestOptions(rests);
    renderRoutinePicker(ranges);
    filterRoutinePicker();
    elements.routineDialog.showModal();
    document.getElementById("routine-name").focus();
  }

  // When a routine's exercises rest for different lengths, offer to keep each one's own rest.
  function setRoutineRestOptions(rests) {
    const select = document.getElementById("routine-rest");
    select.querySelector(`option[value="${MIXED_REST}"]`)?.remove();
    if (rests.size > 1) {
      select.insertAdjacentHTML("afterbegin", `<option value="${MIXED_REST}">Per exercise</option>`);
      select.value = MIXED_REST;
      return;
    }
    const rest = String([...rests][0] || 90);
    if (![...select.options].some((option) => option.value === rest)) {
      select.insertAdjacentHTML("beforeend", `<option value="${rest}">${formatDuration(Number(rest))}</option>`);
    }
    select.value = rest;
  }

  function usesReps(exercise) {
    return exercise.trackingType !== "duration" && exercise.trackingType !== "distance";
  }

  function defaultRoutineRepRange() {
    return {
      sets: Number(document.getElementById("routine-sets").value) || 3,
      min: Number(document.getElementById("routine-reps-min").value) || 8,
      max: Number(document.getElementById("routine-reps-max").value) || 12,
    };
  }

  // Ticked exercise ids with their rep ranges, read from the picker, so a re-render can keep them.
  function readRoutinePicker() {
    const ranges = new Map();
    elements.routineForm.querySelectorAll("input[name='exercise']:checked").forEach((input) => {
      const row = input.closest(".exercise-choice-row");
      ranges.set(input.value, {
        sets: Number(row.querySelector("[data-sets]")?.value),
        min: Number(row.querySelector("[data-rep-min]")?.value),
        max: Number(row.querySelector("[data-rep-max]")?.value),
        rest: row.dataset.rest ? Number(row.dataset.rest) : null,
      });
    });
    return ranges;
  }

  // Ticked exercises sit at the top in the order they were ticked (which is also the routine's order),
  // followed by the rest of the library.
  function routinePickerOrder(tickedIds) {
    const ticked = tickedIds.map((id) => state.exercises.find((exercise) => exercise.id === id)).filter(Boolean);
    const tickedSet = new Set(tickedIds);
    return [...ticked, ...state.exercises.filter((exercise) => !tickedSet.has(exercise.id))];
  }

  function markRoutinePickerGroups() {
    const rows = [...document.querySelectorAll("#routine-exercise-picker .exercise-choice-row")];
    const tickedRows = rows.filter((row) => row.querySelector("input[name='exercise']").checked);
    rows.forEach((row) => {
      row.classList.toggle("is-selected", tickedRows.includes(row));
      row.classList.toggle("is-last-selected", row === tickedRows[tickedRows.length - 1] && tickedRows.length < rows.length);
    });
  }

  function renderRoutinePicker(ranges = new Map()) {
    const fallback = defaultRoutineRepRange();
    routineTickOrder = [...ranges.keys()];
    document.getElementById("routine-exercise-picker").innerHTML = state.exercises.length
      ? routinePickerOrder(routineTickOrder).map((exercise) => {
          const checked = ranges.has(exercise.id);
          const range = { ...fallback, ...(checked ? ranges.get(exercise.id) : {}) };
          const name = escapeHtml(exercise.name);
          const repInputs = usesReps(exercise)
            ? `<span aria-hidden="true">×</span>
                <input data-rep-min type="number" min="1" max="100" value="${range.min || fallback.min}" aria-label="${name} minimum reps" />
                <span aria-hidden="true">–</span>
                <input data-rep-max type="number" min="1" max="100" value="${range.max || fallback.max}" aria-label="${name} maximum reps" />`
            : "<span>sets</span>";
          const targetInputs = `<div class="rep-range-inputs${checked ? "" : " is-hidden"}" aria-label="Targets for ${name}">
                <input data-sets type="number" min="1" max="30" value="${range.sets || fallback.sets}" aria-label="${name} sets" />
                ${repInputs}
              </div>`;
          return `
          <div class="exercise-choice-row" data-exercise-id="${escapeHtml(exercise.id)}"${checked && range.rest ? ` data-rest="${Number(range.rest)}"` : ""}>
            <label class="exercise-choice">
              <input type="checkbox" name="exercise" value="${escapeHtml(exercise.id)}"${checked ? " checked" : ""} />
              <span class="exercise-choice-text"><strong>${escapeHtml(exercise.name)}</strong><span>${escapeHtml(exerciseMeta(exercise))}</span></span>
            </label>
            ${targetInputs}
          </div>`;
        }).join("")
      : `<div class="empty-state"><p>Your library is empty. Add an exercise below.</p></div>`;
    markRoutinePickerGroups();
  }

  // Moves rows into place without re-rendering, so typed rep ranges are kept.
  function arrangeRoutinePicker() {
    const container = document.getElementById("routine-exercise-picker");
    const rows = new Map([...container.querySelectorAll(".exercise-choice-row")].map((row) => [row.dataset.exerciseId, row]));
    routinePickerOrder(routineTickOrder).forEach((exercise) => {
      const row = rows.get(exercise.id);
      if (row) {
        container.appendChild(row);
      }
    });
    markRoutinePickerGroups();
  }

  // Ticking moves an exercise to the end of the selected group and shows its rep range, starting from the default.
  function handleRoutinePickerChange(event) {
    const checkbox = event.target.closest("input[name='exercise']");
    if (!checkbox) {
      return;
    }
    routineTickOrder = routineTickOrder.filter((id) => id !== checkbox.value);
    if (checkbox.checked) {
      routineTickOrder.push(checkbox.value);
    }
    const row = checkbox.closest(".exercise-choice-row");
    const targets = row.querySelector(".rep-range-inputs");
    if (checkbox.checked) {
      const fallback = defaultRoutineRepRange();
      targets.querySelector("[data-sets]").value = fallback.sets;
      if (targets.querySelector("[data-rep-min]")) {
        targets.querySelector("[data-rep-min]").value = fallback.min;
        targets.querySelector("[data-rep-max]").value = fallback.max;
      }
    } else {
      delete row.dataset.rest;
    }
    targets.classList.toggle("is-hidden", !checkbox.checked);
    arrangeRoutinePicker();
  }

  function repRangeError(min, max) {
    if (!Number.isInteger(min) || !Number.isInteger(max) || min < 1 || max > 100) {
      return "Reps must be whole numbers from 1 to 100.";
    }
    return min > max ? "The rep range's low end can't be above its high end." : "";
  }

  function exerciseMeta(exercise) {
    const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1);
    return [exercise.category || "Other", exercise.equipment || exercise.muscleGroup || ""]
      .filter(Boolean)
      .map((part) => capitalize(String(part)))
      .join(" · ");
  }

  async function saveRoutine(event) {
    event.preventDefault();
    const ranges = readRoutinePicker();
    const payload = {
      name: document.getElementById("routine-name").value.trim(),
      exercises: [...ranges].map(([exerciseId, range], index) => {
        const exercise = state.exercises.find((candidate) => candidate.id === exerciseId) || {};
        const reps = usesReps(exercise);
        const restChoice = document.getElementById("routine-rest").value;
        return {
          exerciseId,
          position: index + 1,
          targetSets: range.sets,
          targetRepsMin: reps ? range.min : null,
          targetRepsMax: reps ? range.max : null,
          restSeconds: restChoice === MIXED_REST ? range.rest || 90 : Number(restChoice),
        };
      }),
    };
    const errorField = document.getElementById("routine-form-error");
    if (!payload.name || !payload.exercises.length) {
      errorField.textContent = payload.name ? "Choose at least one exercise." : "Give the routine a name.";
      return;
    }
    for (const item of payload.exercises) {
      const setsError = Number.isInteger(item.targetSets) && item.targetSets >= 1 && item.targetSets <= 30
        ? ""
        : "Sets must be a whole number from 1 to 30.";
      const error = setsError || (item.targetRepsMin === null ? "" : repRangeError(item.targetRepsMin, item.targetRepsMax));
      if (error) {
        const name = state.exercises.find((candidate) => candidate.id === item.exerciseId)?.name || "An exercise";
        errorField.textContent = `${name}: ${error}`;
        return;
      }
    }
    const submit = elements.routineForm.querySelector("button[type='submit']");
    submit.disabled = true;
    try {
      const routineId = document.getElementById("routine-id").value;
      const duplicateName = state.routines.find((routine) => routine.id !== routineId && routine.name.toLowerCase() === payload.name.toLowerCase());
      if (duplicateName) {
        throw new Error(`You already have a routine called ${duplicateName.name}.`);
      }
      if (mode === "guest") {
        const exercises = payload.exercises.map((item) => {
          const exercise = state.exercises.find((candidate) => candidate.id === item.exerciseId);
          return { ...item, name: exercise.name, trackingType: exercise.trackingType, targetReps: item.targetRepsMin };
        });
        const existing = state.routines.find((routine) => routine.id === routineId);
        if (existing) {
          Object.assign(existing, { name: payload.name, exercises });
        } else {
          state.routines.push({ id: makeId("routine"), name: payload.name, notes: "", exercises });
        }
        persistGuestState();
      } else {
        await apiFetch(`/api/tracker/routines${routineId ? `?id=${encodeURIComponent(routineId)}` : ""}`, {
          method: routineId ? "PATCH" : "POST",
          body: JSON.stringify(payload),
        });
        await reloadOwnerData();
      }
      elements.routineDialog.close();
      renderAll();
      toast(routineId ? "Routine updated." : "Routine created.");
    } catch (error) {
      document.getElementById("routine-form-error").textContent = error.message;
    } finally {
      submit.disabled = false;
    }
  }

  function startWorkout(routineId) {
    const routine = state.routines.find((item) => item.id === routineId) || null;
    activeWorkout = {
      id: makeId("active"),
      routineId: routine?.id || null,
      name: routine?.name || "Open workout",
      startedAt: new Date().toISOString(),
      notes: "",
      exercises: (routine?.exercises || []).map((template, index) => buildActiveExercise(template.exerciseId, {
        name: template.name,
        trackingType: template.trackingType,
        position: index + 1,
        targetSets: template.targetSets,
        targetRepsMin: template.targetRepsMin,
        targetRepsMax: template.targetRepsMax,
        restSeconds: template.restSeconds,
      })),
    };
    switchView("train");
    renderTrainingHome();
    renderActiveWorkout();
    startWorkoutClock();
    persistActiveGuestWorkout();
  }

  function buildActiveExercise(exerciseId, options = {}) {
    const libraryExercise = state.exercises.find((exercise) => exercise.id === exerciseId) || {};
    const trackingType = options.trackingType || libraryExercise.trackingType || "weight_reps";
    const previous = lastExercisePerformance(exerciseId);
    const setCount = Number(options.targetSets || 3);
    const repsMin = options.targetRepsMin ?? options.targetReps ?? null;
    const repsMax = options.targetRepsMax ?? repsMin;
    const targetText = repsMin ? `Target: ${setCount} × ${formatRepRange(repsMin, repsMax)} reps` : "";
    return {
      exerciseId,
      name: options.name || libraryExercise.name || "Exercise",
      trackingType,
      position: Number(options.position || 1),
      restSeconds: Number(options.restSeconds || libraryExercise.defaultRestSeconds || 90),
      notes: "",
      previousText: previous.text,
      targetText,
      sets: Array.from({ length: setCount }, (_, index) => ({
        position: index + 1,
        setType: "working",
        weight: trackingType === "weight_reps" ? previous.sets[index]?.weight ?? null : null,
        weightUnit: state.profile.weightUnit || "lb",
        reps: trackingType === "weight_reps" || trackingType === "reps" ? previous.sets[index]?.reps ?? Number(repsMin || 8) : null,
        durationSeconds: null,
        distance: null,
        distanceUnit: state.profile.distanceUnit || "mi",
        rpe: null,
        completed: false,
      })),
    };
  }

  function lastExercisePerformance(exerciseId) {
    const workouts = [...state.workouts].sort((a, b) => new Date(b.startedAt) - new Date(a.startedAt));
    for (const workout of workouts) {
      const exercise = (workout.exercises || []).find((item) => item.exerciseId === exerciseId);
      if (exercise) {
        const sets = (exercise.sets || []).filter((set) => set.completed !== false);
        const text = sets.length
          ? sets.slice(0, 3).map((set) => set.weight ? `${formatNumber(set.weight, 1)} × ${set.reps || 0}` : `${set.reps || 0} reps`).join(" · ")
          : "No completed sets";
        return { sets, text: `Previous: ${text}` };
      }
    }
    return { sets: [], text: "No previous performance" };
  }

  function renderActiveWorkout() {
    if (!activeWorkout) {
      return;
    }
    const container = document.getElementById("active-workout");
    container.classList.remove("is-hidden");
    container.innerHTML = `
      <header class="workout-header">
        <div class="workout-header-main">
          <p class="section-kicker">Active workout · <span class="workout-timer">0:00</span></p>
          <h1>${escapeHtml(activeWorkout.name)}</h1>
        </div>
        <div class="workout-header-actions">
          <button class="button button-secondary" type="button" data-action="cancel-workout"><i data-lucide="x" aria-hidden="true"></i><span>Cancel</span></button>
          <button class="button button-primary" type="button" data-action="finish-workout"><i data-lucide="check" aria-hidden="true"></i>Finish</button>
        </div>
      </header>
      <div class="workout-exercises">
        ${activeWorkout.exercises.length ? activeWorkout.exercises.map(renderWorkoutExercise).join("") : '<div class="empty-state"><p>Add your first exercise to this workout.</p></div>'}
      </div>
      <div class="workout-bottom-actions">
        <button class="button button-secondary" type="button" data-action="add-exercise"><i data-lucide="plus" aria-hidden="true"></i>Add exercise</button>
      </div>`;
    updateWorkoutClock();
    refreshIcons();
  }

  function renderWorkoutExercise(exercise, exerciseIndex) {
    const distanceBased = exercise.trackingType === "distance";
    const durationBased = exercise.trackingType === "duration";
    const headerColumns = distanceBased
      ? `<th>Distance (${escapeHtml(state.profile.distanceUnit || "mi")})</th><th>Minutes</th><th>RPE</th>`
      : durationBased
        ? `<th>Minutes</th><th>RPE</th><th></th>`
        : `<th>Weight (${escapeHtml(state.profile.weightUnit || "lb")})</th><th>Reps</th><th>RPE</th>`;
    return `
      <article class="workout-exercise">
        <div class="exercise-heading">
          <div><h2>${escapeHtml(exercise.name)}</h2><p>${escapeHtml([exercise.targetText, exercise.previousText].filter(Boolean).join(" · "))}</p></div>
          <button class="icon-button" type="button" data-action="remove-exercise" data-exercise-index="${exerciseIndex}" aria-label="Remove ${escapeHtml(exercise.name)}" title="Remove exercise"><i data-lucide="trash-2" aria-hidden="true"></i></button>
        </div>
        <table class="set-table">
          <thead><tr><th>Set</th>${headerColumns}<th>Done</th></tr></thead>
          <tbody>${exercise.sets.map((set, setIndex) => renderWorkoutSet(exercise, set, exerciseIndex, setIndex)).join("")}</tbody>
        </table>
        <div class="exercise-footer"><button class="add-set-button" type="button" data-action="add-set" data-exercise-index="${exerciseIndex}">Add set</button></div>
      </article>`;
  }

  function renderWorkoutSet(exercise, set, exerciseIndex, setIndex) {
    const indexAttrs = `data-exercise-index="${exerciseIndex}" data-set-index="${setIndex}"`;
    let fields;
    if (exercise.trackingType === "distance") {
      fields = `
        <td><input class="set-input" type="number" min="0" step="0.01" value="${set.distance ?? ""}" data-workout-field="distance" ${indexAttrs} aria-label="Distance for set ${setIndex + 1}" /></td>
        <td><input class="set-input" type="number" min="0" step="1" value="${set.durationSeconds ? Math.round(set.durationSeconds / 60) : ""}" data-workout-field="durationMinutes" ${indexAttrs} aria-label="Minutes for set ${setIndex + 1}" /></td>
        <td><input class="set-input" type="number" min="1" max="10" step="0.5" value="${set.rpe ?? ""}" data-workout-field="rpe" ${indexAttrs} aria-label="RPE for set ${setIndex + 1}" /></td>`;
    } else if (exercise.trackingType === "duration") {
      fields = `
        <td><input class="set-input" type="number" min="0" step="1" value="${set.durationSeconds ? Math.round(set.durationSeconds / 60) : ""}" data-workout-field="durationMinutes" ${indexAttrs} aria-label="Minutes for set ${setIndex + 1}" /></td>
        <td><input class="set-input" type="number" min="1" max="10" step="0.5" value="${set.rpe ?? ""}" data-workout-field="rpe" ${indexAttrs} aria-label="RPE for set ${setIndex + 1}" /></td><td></td>`;
    } else {
      fields = `
        <td><input class="set-input" type="number" min="0" step="2.5" value="${set.weight ?? ""}" data-workout-field="weight" ${indexAttrs} aria-label="Weight for set ${setIndex + 1}" /></td>
        <td><input class="set-input" type="number" min="0" step="1" value="${set.reps ?? ""}" data-workout-field="reps" ${indexAttrs} aria-label="Reps for set ${setIndex + 1}" /></td>
        <td><input class="set-input" type="number" min="1" max="10" step="0.5" value="${set.rpe ?? ""}" data-workout-field="rpe" ${indexAttrs} aria-label="RPE for set ${setIndex + 1}" /></td>`;
    }
    return `
      <tr class="${set.completed ? "is-complete" : ""}">
        <td class="set-number">${setIndex + 1}</td>
        ${fields}
        <td class="set-actions-cell">
          <button class="set-check ${set.completed ? "is-complete" : ""}" type="button" data-action="complete-set" ${indexAttrs} aria-label="Complete set ${setIndex + 1}"><i data-lucide="check" aria-hidden="true"></i></button>
          <button class="remove-set" type="button" data-action="remove-set" ${indexAttrs} aria-label="Remove set ${setIndex + 1}"><i data-lucide="x" aria-hidden="true"></i></button>
        </td>
      </tr>`;
  }

  function handleWorkoutInput(event) {
    const input = event.target.closest("[data-workout-field]");
    if (!input || !activeWorkout) {
      return;
    }
    const exercise = activeWorkout.exercises[Number(input.dataset.exerciseIndex)];
    const set = exercise?.sets[Number(input.dataset.setIndex)];
    if (!set) {
      return;
    }
    const value = input.value === "" ? null : Number(input.value);
    if (input.dataset.workoutField === "durationMinutes") {
      set.durationSeconds = value === null ? null : value * 60;
    } else {
      set[input.dataset.workoutField] = value;
    }
    persistActiveGuestWorkout();
  }

  function openExerciseDialog() {
    document.getElementById("exercise-search").value = "";
    renderExerciseLibrary();
    elements.exerciseDialog.showModal();
    document.getElementById("exercise-search").focus();
  }

  // Exercise names compare case- and spacing-insensitively, so "Chest press" and "chest  Press" are one exercise.
  function exerciseNameKey(name) {
    return String(name || "").trim().replace(/\s+/g, " ").toLowerCase();
  }

  function findExerciseByName(name) {
    const key = exerciseNameKey(name);
    return state.exercises.find((exercise) => exerciseNameKey(exercise.name) === key) || null;
  }

  function exerciseMatches(exercise, query) {
    const words = exerciseNameKey(query).split(" ").filter(Boolean);
    const haystack = `${exercise.name} ${exercise.category || ""} ${exercise.equipment || ""} ${exercise.muscleGroup || ""}`.toLowerCase();
    return words.every((word) => haystack.includes(word));
  }

  function noMatchMarkup(query, target) {
    const existing = findExerciseByName(query);
    const create = query && !existing
      ? `<button class="text-button" type="button" data-action="new-exercise" data-target="${target}">Create “${escapeHtml(query.trim())}”</button>`
      : "";
    return `<p>No exercises match that search.</p>${create}`;
  }

  function renderExerciseLibrary() {
    if (!state) {
      return;
    }
    const rawQuery = document.getElementById("exercise-search").value.trim();
    const exercises = state.exercises.filter((exercise) => exerciseMatches(exercise, rawQuery));
    const inWorkout = new Set((activeWorkout?.exercises || []).map((exercise) => exercise.exerciseId));
    document.getElementById("exercise-library").innerHTML = exercises.length
      ? exercises.map((exercise) => {
          const added = inWorkout.has(exercise.id);
          return `
          <button class="exercise-option" type="button" data-action="choose-exercise" data-id="${escapeHtml(exercise.id)}"${added ? " disabled" : ""}>
            <span class="exercise-option-text"><strong>${escapeHtml(exercise.name)}</strong><span>${escapeHtml(exerciseMeta(exercise))}</span></span>
            ${added ? '<span class="exercise-option-status">In workout</span>' : ""}
          </button>`;
        }).join("")
      : `<div class="empty-state">${noMatchMarkup(rawQuery, "workout")}</div>`;
  }

  // Hides picker rows that don't match, so ticks and rep ranges on hidden rows are kept.
  function filterRoutinePicker() {
    const query = document.getElementById("routine-exercise-search").value.trim();
    let visible = 0;
    document.querySelectorAll("#routine-exercise-picker .exercise-choice-row").forEach((row) => {
      const exercise = state.exercises.find((item) => item.id === row.querySelector("input[name='exercise']").value);
      const show = !exercise || exerciseMatches(exercise, query);
      row.classList.toggle("is-hidden", !show);
      visible += show ? 1 : 0;
    });
    const empty = document.getElementById("routine-exercise-empty");
    const noMatches = Boolean(query) && visible === 0;
    empty.innerHTML = noMatches ? noMatchMarkup(query, "routine") : "";
    empty.classList.toggle("is-hidden", !noMatches);
    document.getElementById("routine-exercise-picker").classList.toggle("is-hidden", noMatches);
  }

  // Opens the new-exercise form on top of whichever picker asked for it ("workout" or "routine").
  function openExerciseCreateDialog(target) {
    exerciseCreateTarget = target === "routine" ? "routine" : "workout";
    elements.exerciseCreateForm.reset();
    document.getElementById("exercise-create-error").textContent = "";
    const search = document.getElementById(exerciseCreateTarget === "workout" ? "exercise-search" : "routine-exercise-search").value.trim();
    document.getElementById("exercise-create-name").value = search;
    if (exerciseCreateTarget === "routine") {
      const fallback = defaultRoutineRepRange();
      document.getElementById("exercise-create-reps-min").value = fallback.min;
      document.getElementById("exercise-create-reps-max").value = fallback.max;
    }
    syncExerciseCreateRepsField();
    elements.exerciseCreateDialog.showModal();
    document.getElementById("exercise-create-name").focus();
  }

  // The rep range applies to the routine being built, so it only shows there, and only for rep-based exercises.
  function syncExerciseCreateRepsField() {
    const tracking = document.getElementById("exercise-create-tracking").value;
    const show = exerciseCreateTarget === "routine" && usesReps({ trackingType: tracking });
    document.getElementById("exercise-create-reps-field").classList.toggle("is-hidden", !show);
  }

  async function saveNewExercise(event) {
    event.preventDefault();
    const errorField = document.getElementById("exercise-create-error");
    const payload = {
      name: document.getElementById("exercise-create-name").value.trim().replace(/\s+/g, " "),
      category: document.getElementById("exercise-create-category").value,
      muscleGroup: document.getElementById("exercise-create-muscle").value.trim() || null,
      trackingType: document.getElementById("exercise-create-tracking").value,
    };
    if (!payload.name) {
      errorField.textContent = "Give the exercise a name.";
      return;
    }
    const duplicate = findExerciseByName(payload.name);
    if (duplicate) {
      errorField.textContent = `${duplicate.name} is already in your library. Search for it instead.`;
      return;
    }
    const repRange = {
      min: Number(document.getElementById("exercise-create-reps-min").value),
      max: Number(document.getElementById("exercise-create-reps-max").value),
    };
    const wantsRange = exerciseCreateTarget === "routine" && usesReps(payload);
    const rangeError = wantsRange ? repRangeError(repRange.min, repRange.max) : "";
    if (rangeError) {
      errorField.textContent = rangeError;
      return;
    }

    const submit = elements.exerciseCreateForm.querySelector("button[type='submit']");
    submit.disabled = true;
    try {
      let exercise;
      if (mode === "guest") {
        exercise = { id: makeId("exercise"), ...payload, defaultRestSeconds: 90 };
      } else {
        const data = await apiFetch("/api/tracker/exercises", { method: "POST", body: JSON.stringify(payload) });
        exercise = data.exercise;
      }
      state.exercises.push(exercise);
      state.exercises.sort((a, b) => `${a.category} ${a.name}`.localeCompare(`${b.category} ${b.name}`));
      persistGuestState();
      elements.exerciseCreateDialog.close();

      if (exerciseCreateTarget === "routine") {
        const ranges = readRoutinePicker();
        ranges.set(exercise.id, wantsRange ? repRange : defaultRoutineRepRange());
        document.getElementById("routine-exercise-search").value = "";
        renderRoutinePicker(ranges);
        filterRoutinePicker();
        document.getElementById("routine-form-error").textContent = "";
      } else {
        addExerciseToWorkout(exercise.id);
      }
      toast(`${exercise.name} added to your library.`);
    } catch (error) {
      errorField.textContent = error.message;
    } finally {
      submit.disabled = false;
    }
  }

  function addExerciseToWorkout(exerciseId) {
    if (!activeWorkout) {
      return;
    }
    const existing = activeWorkout.exercises.find((exercise) => exercise.exerciseId === exerciseId);
    if (existing) {
      toast(`${existing.name} is already in this workout. Add a set to it instead.`, true);
      return;
    }
    activeWorkout.exercises.push(buildActiveExercise(exerciseId, { position: activeWorkout.exercises.length + 1 }));
    elements.exerciseDialog.close();
    renderActiveWorkout();
    persistActiveGuestWorkout();
  }

  function addWorkoutSet(exerciseIndex) {
    const exercise = activeWorkout?.exercises[Number(exerciseIndex)];
    if (!exercise) {
      return;
    }
    const previous = exercise.sets[exercise.sets.length - 1] || {};
    exercise.sets.push({
      ...previous,
      position: exercise.sets.length + 1,
      completed: false,
      rpe: null,
    });
    renderActiveWorkout();
    persistActiveGuestWorkout();
  }

  function removeWorkoutSet(exerciseIndex, setIndex) {
    const exercise = activeWorkout?.exercises[Number(exerciseIndex)];
    if (!exercise || exercise.sets.length <= 1) {
      toast("Each exercise needs at least one set.", true);
      return;
    }
    exercise.sets.splice(Number(setIndex), 1);
    exercise.sets.forEach((set, index) => { set.position = index + 1; });
    renderActiveWorkout();
    persistActiveGuestWorkout();
  }

  function removeWorkoutExercise(exerciseIndex) {
    if (!activeWorkout) {
      return;
    }
    activeWorkout.exercises.splice(Number(exerciseIndex), 1);
    activeWorkout.exercises.forEach((exercise, index) => { exercise.position = index + 1; });
    renderActiveWorkout();
    persistActiveGuestWorkout();
  }

  function toggleWorkoutSet(exerciseIndex, setIndex) {
    const exercise = activeWorkout?.exercises[Number(exerciseIndex)];
    const set = exercise?.sets[Number(setIndex)];
    if (!set) {
      return;
    }
    set.completed = !set.completed;
    if (set.completed) {
      set.completedAt = new Date().toISOString();
      startRestTimer(exercise.restSeconds);
    } else {
      set.completedAt = null;
    }
    renderActiveWorkout();
    persistActiveGuestWorkout();
  }

  function startWorkoutClock() {
    stopWorkoutClock();
    workoutClock = window.setInterval(updateWorkoutClock, 1000);
    updateWorkoutClock();
  }

  function stopWorkoutClock() {
    if (workoutClock) {
      window.clearInterval(workoutClock);
      workoutClock = null;
    }
  }

  function updateWorkoutClock() {
    const display = document.querySelector(".workout-timer");
    if (display && activeWorkout) {
      display.textContent = formatDuration((Date.now() - new Date(activeWorkout.startedAt).getTime()) / 1000);
    }
  }

  function startRestTimer(seconds) {
    stopRestTimer();
    restRemaining = Number(seconds || 90);
    elements.restTimer.classList.remove("is-hidden");
    renderRestTimer();
    restClock = window.setInterval(() => {
      restRemaining -= 1;
      renderRestTimer();
      if (restRemaining <= 0) {
        stopRestTimer();
        toast("Rest complete. Next set.");
      }
    }, 1000);
  }

  function renderRestTimer() {
    elements.restTimer.innerHTML = `
      <div><span class="section-kicker">Rest</span><span class="rest-time">${formatDuration(restRemaining)}</span></div>
      <button id="extend-rest" type="button" aria-label="Add 30 seconds" title="Add 30 seconds">+30</button>
      <button id="close-rest" type="button" aria-label="Dismiss rest timer" title="Dismiss"><i data-lucide="x" aria-hidden="true"></i></button>`;
    document.getElementById("extend-rest").onclick = () => { restRemaining += 30; renderRestTimer(); };
    document.getElementById("close-rest").onclick = stopRestTimer;
    refreshIcons();
  }

  function stopRestTimer() {
    if (restClock) {
      window.clearInterval(restClock);
      restClock = null;
    }
    if (elements.restTimer) {
      elements.restTimer.classList.add("is-hidden");
    }
  }

  function cancelWorkout() {
    if (!activeWorkout) {
      return;
    }
    if (!window.confirm("Discard this workout?")) {
      return;
    }
    activeWorkout = null;
    stopWorkoutClock();
    stopRestTimer();
    renderTrainingHome();
    toast("Workout discarded.");
  }

  async function finishWorkout() {
    if (!activeWorkout) {
      return;
    }
    const completedSets = activeWorkout.exercises.flatMap((exercise) => exercise.sets).filter((set) => set.completed);
    if (!completedSets.length) {
      toast("Complete at least one set before finishing.", true);
      return;
    }
    const endedAt = new Date().toISOString();
    const payload = {
      routineId: activeWorkout.routineId,
      name: activeWorkout.name,
      startedAt: activeWorkout.startedAt,
      endedAt,
      notes: activeWorkout.notes,
      exercises: activeWorkout.exercises.map((exercise, exerciseIndex) => ({
        exerciseId: exercise.exerciseId,
        name: exercise.name,
        position: exerciseIndex + 1,
        notes: exercise.notes,
        sets: exercise.sets.filter((set) => set.completed).map((set, setIndex) => ({
          ...set,
          position: setIndex + 1,
        })),
      })).filter((exercise) => exercise.sets.length),
    };
    const button = document.querySelector("[data-action='finish-workout']");
    if (button) {
      button.disabled = true;
    }
    try {
      if (mode === "guest") {
        state.workouts.unshift({
          id: makeId("workout"),
          ...payload,
          completedAt: endedAt,
          durationSeconds: Math.round((new Date(endedAt) - new Date(payload.startedAt)) / 1000),
        });
        persistGuestState();
      } else {
        await apiFetch("/api/tracker/workouts", { method: "POST", body: JSON.stringify(payload) });
        await reloadOwnerData();
      }
      activeWorkout = null;
      stopWorkoutClock();
      stopRestTimer();
      renderAll();
      switchView("history");
      toast("Workout saved.");
    } catch (error) {
      toast(error.message, true);
      if (button) {
        button.disabled = false;
      }
    }
  }

  function persistActiveGuestWorkout() {
    // Completed workouts persist. In-progress sessions intentionally remain ephemeral in this MVP.
  }

  function calculateWorkoutVolume(workout) {
    if (Number(workout?.totalVolume) > 0) {
      return Number(workout.totalVolume);
    }
    return (workout?.exercises || []).reduce((workoutTotal, exercise) => {
      return workoutTotal + (exercise.sets || []).reduce((setTotal, set) => {
        if (set.completed === false) {
          return setTotal;
        }
        return setTotal + ((Number(set.weight) || 0) * (Number(set.reps) || 0));
      }, 0);
    }, 0);
  }

  function workoutSetCount(workout) {
    if (Number(workout?.setCount) > 0) {
      return Number(workout.setCount);
    }
    return (workout?.exercises || []).reduce((total, exercise) => total + (exercise.sets || []).filter((set) => set.completed !== false).length, 0);
  }

  function renderHistory() {
    const workouts = [...state.workouts].sort((a, b) => new Date(b.startedAt || b.completedAt) - new Date(a.startedAt || a.completedAt));
    const totalVolume = workouts.reduce((sum, workout) => sum + calculateWorkoutVolume(workout), 0);
    const bestStreak = state.habits.filter((habit) => !habitGoal(habit)).reduce((best, habit) => Math.max(best, calculateStreak(habit)), 0);
    document.getElementById("history-highlights").innerHTML = [
      summaryMetric("dumbbell", String(workouts.length), "Recent workouts", "coral"),
      summaryMetric("weight", `${formatNumber(totalVolume)} lb`, "Recent volume", "gold"),
      summaryMetric("flame", `${bestStreak} days`, "Best active streak", ""),
    ].join("");

    const history = document.getElementById("workout-history");
    history.innerHTML = workouts.length
      ? workouts.map((workout) => {
          const date = new Date(workout.startedAt || workout.completedAt);
          const exerciseCount = Number(workout.exerciseCount || workout.exercises?.length || 0);
          const sets = workoutSetCount(workout);
          return `
            <article class="history-row">
              <time class="history-date" datetime="${escapeHtml(workout.startedAt || workout.completedAt)}"><strong>${date.getDate()}</strong>${new Intl.DateTimeFormat("en-US", { month: "short" }).format(date)}</time>
              <div class="history-main"><h3>${escapeHtml(workout.name || "Workout")}</h3><p>${exerciseCount} exercises · ${sets} sets · ${formatDuration(workout.durationSeconds)}</p></div>
              <div class="history-volume"><strong>${formatNumber(calculateWorkoutVolume(workout))} lb</strong>volume</div>
            </article>`;
        }).join("")
      : `<div class="empty-state"><p>No workouts logged yet.</p><button class="text-button" type="button" data-action="empty-workout">Start one</button></div>`;

    const activeHabits = state.habits.filter((habit) => !habit.archivedAt);
    document.getElementById("habit-history").innerHTML = activeHabits.length
      ? activeHabits.map((habit) => {
          const cells = [];
          for (let offset = 27; offset >= 0; offset -= 1) {
            const date = shiftDate(new Date(), -offset);
            const due = isHabitDue(habit, date);
            const done = isHabitComplete(habit, habitEntry(habit, localDateKey(date)));
            cells.push(`<span class="heat-cell ${done ? "is-done" : ""}" style="${due ? "" : "opacity:.3"}" title="${localDateKey(date)}${due ? (done ? ": complete" : ": incomplete") : ": not scheduled"}"></span>`);
          }
          return `<div class="consistency-row" style="--habit-color:${escapeHtml(habit.color || COLOR_OPTIONS[0])}"><p>${escapeHtml(habit.name)}</p><div class="heat-grid">${cells.join("")}</div></div>`;
        }).join("")
      : `<div class="empty-state"><p>No active habits.</p></div>`;
  }

  async function reloadOwnerData() {
    if (mode !== "owner") {
      return;
    }
    const data = await apiFetch("/api/tracker/bootstrap");
    state = normalizeState(data);
  }

  function toast(message, isError = false) {
    const toastElement = document.createElement("div");
    toastElement.className = `toast${isError ? " is-error" : ""}`;
    toastElement.textContent = message;
    document.getElementById("toast-region").appendChild(toastElement);
    window.setTimeout(() => toastElement.remove(), 3600);
  }

  initialize();
})();
