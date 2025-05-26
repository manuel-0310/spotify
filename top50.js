// top50.js

const accessToken = localStorage.getItem('access_token');
if (!accessToken) {
  window.location.href = 'index.html';
}

document.getElementById('logout-btn').addEventListener('click', () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('code_verifier');
  location.href = 'index.html';
});

const form = document.getElementById('top-form');
const topTypeSelect = document.getElementById('top-type');
const timeRangeSelect = document.getElementById('time-range');
const resultsSection = document.getElementById('results');
const exportSection = document.getElementById('export-section');
const exportButton = document.getElementById('export-button');

let topTracks = [];

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const type = topTypeSelect.value;
  const timeRange = timeRangeSelect.value;
  resultsSection.innerHTML = '<p>Cargando...</p>';
  exportSection.style.display = 'none';

  try {
    if (type === 'albums') {
      const tracks = await fetchTopItems('tracks', timeRange);
      const albumMap = new Map();
      tracks.forEach(t => {
        if (!albumMap.has(t.album.id)) albumMap.set(t.album.id, t.album);
      });
      const albums = Array.from(albumMap.values()).slice(0, 50);
      renderItems(albums, 'album');
    } else {
      const items = await fetchTopItems(type, timeRange);
      renderItems(items, type);
      if (type === 'tracks') {
        topTracks = items;
        exportSection.style.display = 'block';
      }
    }
  } catch (err) {
    resultsSection.innerHTML = `<p>Error: ${err.message}</p>`;
  }
});

async function fetchTopItems(type, timeRange) {
  const res = await fetch(`https://api.spotify.com/v1/me/top/${type}?limit=50&time_range=${timeRange}`, {
    headers: { Authorization: `Bearer ${accessToken}` }
  });
  if (!res.ok) throw new Error(`No se pudo obtener tu top ${type}`);
  const data = await res.json();
  return data.items;
}

function renderItems(items, type) {
  resultsSection.innerHTML = '';
  const list = document.createElement('ul');
  list.className = 'track-list';

  items.forEach((item, i) => {
    const li = document.createElement('li');
    li.className = 'track-item';

    const img = document.createElement('img');
    const info = document.createElement('div');
    let name = '', sub = '';

    if (type === 'tracks') {
      img.src = item.album.images[0]?.url || '';
      name = item.name;
      sub = item.artists.map(a => a.name).join(', ');
    } else if (type === 'artists') {
      img.src = item.images[0]?.url || '';
      name = item.name;
      sub = '';
    } else if (type === 'album') {
      img.src = item.images[0]?.url || '';
      name = item.name;
      sub = item.artists.map(a => a.name).join(', ');
    }

    info.innerHTML = `<p><strong>${i + 1}. ${name}</strong></p><p>${sub}</p>`;
    li.appendChild(img);
    li.appendChild(info);
    list.appendChild(li);
  });

  resultsSection.appendChild(list);
}

exportButton.addEventListener('click', async () => {
  try {
    const userRes = await fetch('https://api.spotify.com/v1/me', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    const user = await userRes.json();

    const createRes = await fetch(`https://api.spotify.com/v1/users/${user.id}/playlists`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name: 'Top 50 Canciones', public: true })
    });

    const playlist = await createRes.json();
    const uris = topTracks.map(t => t.uri);

    for (let i = 0; i < uris.length; i += 100) {
      const chunk = uris.slice(i, i + 100);
      await fetch(`https://api.spotify.com/v1/playlists/${playlist.id}/tracks`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ uris: chunk })
      });
    }

    alert('Playlist creada exitosamente en tu Spotify!');
  } catch (err) {
    alert('Error al exportar la playlist: ' + err.message);
  }
});
