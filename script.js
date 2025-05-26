const clientId = 'd03b826ade884822b71d25a3b592a836';  // Tu Client ID
const redirectUri = 'https://manuel-0310.github.io/top5songs/callback.html';
  // Tu redirect URI

// Funciones PKCE
function generateCodeVerifier() {
  const array = new Uint8Array(56);
  window.crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function generateCodeChallenge(codeVerifier) {
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const digest = await window.crypto.subtle.digest('SHA-256', data);
  return btoa(String.fromCharCode(...new Uint8Array(digest))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// Iniciar login
document.getElementById('login-btn').addEventListener('click', async () => {
  const codeVerifier = generateCodeVerifier();
  localStorage.setItem('code_verifier', codeVerifier);
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  const scope = 'user-top-read playlist-modify-public playlist-modify-private';
  const authUrl = `https://accounts.spotify.com/authorize?response_type=code&client_id=${clientId}&scope=${encodeURIComponent(scope)}&redirect_uri=${encodeURIComponent(redirectUri)}&code_challenge_method=S256&code_challenge=${codeChallenge}`;

  window.location = authUrl;
});

// Aquí no hacemos más porque la autorización continúa en callback.html

document.addEventListener("DOMContentLoaded", () => {
  const accessToken = localStorage.getItem('access_token');
  const loginSection = document.querySelector('.login-section');
  const searchSection = document.querySelector('.search-section');
  const resultsSection = document.querySelector('.results-section');
  const form = document.getElementById('artist-form');
  const input = document.getElementById('artist-input');
  const timeRangeSelect = document.getElementById('time-range');

  if (!accessToken) {
    // Si no hay token, mostrar login
    loginSection.style.display = 'block';
    searchSection.style.display = 'none';
    document.getElementById('logout-btn').style.display = 'none';
    return;
  }

  // Mostrar buscador y ocultar login
  loginSection.style.display = 'none';
  searchSection.style.display = 'block';
  document.getElementById('logout-btn').style.display = 'block';

  document.getElementById('logout-btn').addEventListener('click', () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('code_verifier');
  location.reload(); // Recarga la página para volver al login
});


  setTimeout(() => {
  input.focus();
}, 300);  // pequeño delay para asegurar que ya se renderizó

setTimeout(() => {
  timeRangeSelect.blur();
}, 500); // ayuda a "resetear" el select para que el primer tap funcione


  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const artistName = input.value.trim();
    const timeRange = timeRangeSelect.value;
    if (!artistName) return;

    resultsSection.innerHTML = "<p>Cargando...</p>";

    try {
      const response = await fetch(`https://api.spotify.com/v1/me/top/tracks?limit=50&time_range=${timeRange}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });
      if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);

      const data = await response.json();
      const tracks = data.items;

      const filteredTracks = tracks.filter(track => 
        track.artists.some(artist => artist.name.toLowerCase() === artistName.toLowerCase())
      );

      if (filteredTracks.length === 0) {
        resultsSection.innerHTML = `<p>Parece que no has escuchado lo suficiente a  "${artistName}".</p>`;
        return;
      }

      const top5 = filteredTracks.slice(0, 5);

      resultsSection.innerHTML = `
        <h2>Tu Top 5 canciones de ${artistName}</h2>
        <ul class="track-list">
          ${top5.map(track => {
            const artistNames = track.artists.map(artist => artist.name).join(', ');
            return `
              <li class="track-item">
                <a href="${track.external_urls.spotify}" target="_blank" rel="noopener noreferrer">
                  <img src="${track.album.images[0].url}" alt="Portada de ${track.name}" width="150" />
                </a>
                <p><strong>${track.name}</strong></p>
                <p>${artistNames}</p>
              </li>
            `;
          }).join('')}
        </ul>
      `;

    } catch (error) {
      resultsSection.innerHTML = `<p>Error: ${error.message}</p>`;
    }
  });
});
