document.addEventListener('DOMContentLoaded', () => {
  const accessToken = localStorage.getItem('access_token');
  if (!accessToken) {
    window.location.href = 'index.html';
    return;
  }

  const timeRangeSelect = document.getElementById('time-range');
  const topTracksList = document.getElementById('top-tracks');
  const topArtistsList = document.getElementById('top-artists');
  const topAlbumsList = document.getElementById('top-albums');
  const exportButton = document.getElementById('export-button');

  let topTracks = [];

  const fetchTopItems = async (type, timeRange) => {
    const response = await fetch(`https://api.spotify.com/v1/me/top/${type}?limit=50&time_range=${timeRange}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });
    if (!response.ok) {
      throw new Error(`Error fetching top ${type}: ${response.statusText}`);
    }
    const data = await response.json();
    return data.items;
  };

  const renderList = (items, container, type) => {
    container.innerHTML = '';
    items.forEach((item, index) => {
      const listItem = document.createElement('li');
      const img = document.createElement('img');
      const info = document.createElement('div');

      if (type === 'tracks') {
        img.src = item.album.images[0]?.url || '';
        info.innerHTML = `<strong>${index + 1}. ${item.name}</strong><br>${item.artists.map(artist => artist.name).join(', ')}`;
      } else if (type === 'artists') {
        img.src = item.images[0]?.url || '';
        info.innerHTML = `<strong>${index + 1}. ${item.name}</strong>`;
      } else if (type === 'albums') {
        img.src = item.images[0]?.url || '';
        info.innerHTML = `<strong>${index + 1}. ${item.name}</strong><br>${item.artists.map(artist => artist.name).join(', ')}`;
      }

      listItem.appendChild(img);
      listItem.appendChild(info);
      container.appendChild(listItem);
    });
  };

  const loadTopItems = async () => {
    const timeRange = timeRangeSelect.value;
    try {
      topTracks = await fetchTopItems('tracks', timeRange);
      const topArtists = await fetchTopItems('artists', timeRange);

      // Extract unique albums from top tracks
      const albumsMap = new Map();
      topTracks.forEach(track => {
        const album = track.album;
        if (!albumsMap.has(album.id)) {
          albumsMap.set(album.id, album);
        }
      });
      const topAlbums = Array.from(albumsMap.values()).slice(0, 50);

      renderList(topTracks, topTracksList, 'tracks');
      renderList(topArtists, topArtistsList, 'artists');
      renderList(topAlbums, topAlbumsList, 'albums');
    } catch (error) {
      console.error(error);
    }
  };

  timeRangeSelect.addEventListener('change', loadTopItems);

  exportButton.addEventListener('click', async () => {
    const userResponse = await fetch('https://api.spotify.com/v1/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });
    const userData = await userResponse.json();
    const userId = userData.id;

    const playlistResponse = await fetch(`https://api.spotify.com/v1/users/${userId}/playlists`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'Top 50 Canciones',
        public: true
      })
    });
    const playlistData = await playlistResponse.json();
    const playlistId = playlistData.id;

    const trackUris = topTracks.map(track => track.uri);

    for (let i = 0; i < trackUris.length; i += 100) {
      const urisChunk = trackUris.slice(i, i + 100);
      await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          uris: urisChunk
        })
      });
    }

    alert('¡Playlist creada exitosamente en tu cuenta de Spotify!');
  });

  loadTopItems();
});
