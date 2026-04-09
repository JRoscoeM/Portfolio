const roomOutput = document.getElementById("room-output");
const scoreboard = document.getElementById("scoreboard");
const spotifyStatus = document.getElementById("spotify-status");
const createRoomForm = document.getElementById("create-room-form");
const joinRoomForm = document.getElementById("join-room-form");
const refreshStatusButton = document.getElementById("refresh-status");

function renderJson(target, value) {
  target.textContent = JSON.stringify(value, null, 2);
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
  } catch (error) {
    scoreboard.innerHTML = `<p class="empty-state">Unable to load scores: ${error.message}</p>`;
  }
}

async function loadSpotifyStatus() {
  try {
    const payload = await requestJson("/api/snake/spotify-status");
    renderSpotifyStatus(payload);
  } catch (error) {
    spotifyStatus.innerHTML = `<p class="empty-state">Unable to load Spotify status: ${error.message}</p>`;
  }
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
    document.getElementById("room-id").value = result.room.id;
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
  } catch (error) {
    renderJson(roomOutput, { error: error.message });
  }
});

refreshStatusButton.addEventListener("click", loadSpotifyStatus);

loadScores();
loadSpotifyStatus();
