const roomOutput = document.getElementById("room-output");
const scoreboard = document.getElementById("scoreboard");
const spotifyStatus = document.getElementById("spotify-status");
const roomSummary = document.getElementById("room-summary");
const matchHistory = document.getElementById("match-history");
const createRoomForm = document.getElementById("create-room-form");
const joinRoomForm = document.getElementById("join-room-form");
const scoreForm = document.getElementById("score-form");
const refreshStatusButton = document.getElementById("refresh-status");
const scoreRoomIdInput = document.getElementById("score-room-id");
const scorePlayerNameInput = document.getElementById("score-player-name");

const appState = {
  activeRoom: null,
  activePlayerId: null,
  recentMatches: [],
};

function renderJson(target, value) {
  target.textContent = JSON.stringify(value, null, 2);
}

function normalizeRoom(room) {
  if (!room) {
    return null;
  }

  return {
    id: room.id,
    hostPlayerId: room.hostPlayerId ?? room.host_player_id ?? null,
    hostName: room.hostName ?? room.host_name ?? "Unknown host",
    roomName: room.roomName ?? room.room_name ?? "Untitled room",
    musicMode: room.musicMode ?? room.music_mode ?? "host-control",
    spotifyConnected: room.spotifyConnected ?? room.spotify_connected ?? false,
    status: room.status ?? "lobby",
    createdAt: room.createdAt ?? room.created_at ?? null,
  };
}

function formatMusicMode(mode) {
  if (!mode) {
    return "Unknown";
  }

  return mode
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatTimestamp(value) {
  if (!value) {
    return "Just now";
  }

  const timestamp = new Date(value);

  if (Number.isNaN(timestamp.getTime())) {
    return "Just now";
  }

  return timestamp.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function renderScores(scores) {
  if (!Array.isArray(scores) || scores.length === 0) {
    scoreboard.innerHTML = "<p class=\"empty-state\">No scores yet. Create a room and play a round to seed the board.</p>";
    return;
  }

  scoreboard.innerHTML = scores
    .map((score, index) => `
      <div class="score-row">
        <span class="score-rank">#${index + 1}</span>
        <span class="score-name">${score.playerName}</span>
        <span class="score-value">${score.score}</span>
      </div>
    `)
    .join("");
}

function renderRoomSummary(room) {
  if (!room) {
    roomSummary.innerHTML = "<p class=\"empty-state\">Create or join a room to see the active lobby state.</p>";
    return;
  }

  roomSummary.innerHTML = `
    <div class="summary-card">
      <p class="summary-kicker">Active room</p>
      <h4>${room.roomName}</h4>
      <div class="summary-grid">
        <div class="summary-item">
          <span class="summary-label">Room id</span>
          <span class="summary-value">${room.id}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">Host</span>
          <span class="summary-value">${room.hostName}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">Mode</span>
          <span class="summary-value">${formatMusicMode(room.musicMode)}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">Status</span>
          <span class="summary-value">${room.status}</span>
        </div>
      </div>
      <p class="summary-meta">Spotify ${room.spotifyConnected ? "connected" : "not connected"} • ${formatTimestamp(room.createdAt)}</p>
    </div>
  `;
}

function renderMatchHistory(matches) {
  if (!Array.isArray(matches) || matches.length === 0) {
    matchHistory.innerHTML = "<p class=\"empty-state\">Recent match activity will appear here after you save a result.</p>";
    return;
  }

  matchHistory.innerHTML = matches
    .map((match) => `
      <div class="history-row">
        <div>
          <p class="history-title">${match.playerName} posted ${match.score}</p>
          <p class="history-meta">${match.roomId ?? "Prototype room"} • ${formatTimestamp(match.createdAt)}</p>
        </div>
        <span class="history-badge">Logged</span>
      </div>
    `)
    .join("");
}

function renderSpotifyStatus(payload) {
  spotifyStatus.innerHTML = `
    <p class="spotify-line">Connection: ${payload.connected ? "connected" : "not connected"}</p>
    <p class="spotify-line">Mode: ${payload.mode}</p>
    <p class="spotify-line">Track: ${payload.currentTrack ?? "No active track snapshot"}</p>
  `;
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
    },
    ...options,
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error || "Request failed");
  }

  return payload;
}

async function loadScores() {
  try {
    const payload = await requestJson("/api/snake/highscores");
    renderScores(payload.scores);
    appState.recentMatches = payload.recentMatches ?? [];
    renderMatchHistory(appState.recentMatches);
  } catch (error) {
    scoreboard.innerHTML = `<p class="empty-state">Unable to load scores: ${error.message}</p>`;
    matchHistory.innerHTML = `<p class="empty-state">Unable to load activity: ${error.message}</p>`;
  }
}

async function loadSpotifyStatus() {
  try {
    const roomId = appState.activeRoom?.id;
    const query = roomId ? `?roomId=${encodeURIComponent(roomId)}` : "";
    const payload = await requestJson(`/api/snake/spotify-status${query}`);
    renderSpotifyStatus(payload);
  } catch (error) {
    spotifyStatus.innerHTML = `<p class="empty-state">Unable to load Spotify status: ${error.message}</p>`;
  }
}

function syncRoomFields(room) {
  if (!room) {
    return;
  }

  document.getElementById("room-id").value = room.id;
  scoreRoomIdInput.value = room.id;
  scorePlayerNameInput.value = room.hostName;
}

function setActiveRoom(room, membership = null) {
  appState.activeRoom = normalizeRoom(room);
  appState.activePlayerId = membership?.player_id ?? appState.activeRoom?.hostPlayerId ?? null;
  renderRoomSummary(appState.activeRoom);
  syncRoomFields(appState.activeRoom);
}

createRoomForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const payload = {
    hostName: document.getElementById("host-name").value.trim(),
    roomName: document.getElementById("room-name").value.trim(),
    musicMode: document.getElementById("music-mode").value,
  };

  try {
    const result = await requestJson("/api/snake/room", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    renderJson(roomOutput, result);
    setActiveRoom(result.room, result.membership ?? null);
    loadScores();
    loadSpotifyStatus();
  } catch (error) {
    renderJson(roomOutput, { error: error.message });
  }
});

joinRoomForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const params = new URLSearchParams({
    roomId: document.getElementById("room-id").value.trim(),
    playerName: document.getElementById("player-name").value.trim(),
  });

  try {
    const result = await requestJson(`/api/snake/room?${params.toString()}`);
    renderJson(roomOutput, result);
    setActiveRoom(result.room, result.membership ?? null);
    loadSpotifyStatus();
  } catch (error) {
    renderJson(roomOutput, { error: error.message });
  }
});

scoreForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (!appState.activePlayerId) {
    renderJson(roomOutput, {
      error: "Create or join a room first so the UI has a player id for score submission.",
    });
    return;
  }

  renderJson(roomOutput, {
    error: "Score submission now expects a real matchId from the realtime game service. The leaderboard read path is live, but match-finalization write flow is still the next backend step.",
  });
});

refreshStatusButton.addEventListener("click", loadSpotifyStatus);

renderRoomSummary(appState.activeRoom);
renderMatchHistory(appState.recentMatches);
loadScores();
loadSpotifyStatus();
