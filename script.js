const accessToken = "BQD4yRQuaNek3EdfQvN7OEhHMeym0LLX_pPKrSkGYG2CHQXGrO2mbohnijcorDpUw8sOWkpDj-YErjbB60UwszAgSOXQBnR6zSyvxGqNxEDn_BR19C165n6Je5di0F7xtiTFuwA2ZV59Tgp_EEdOqbDW9Q3wRDlGt-MT486geIqYwxiAAijJTT76p3LQyFPiRbppKgI75dAt5tw1gzBTmC2bHdJBFZI";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("artist-form");
  const input = document.getElementById("artist-input");
  const timeRangeSelect = document.getElementById("time-range");
  const resultsSection = document.querySelector(".results-section");

  form.addEventListener("submit", async (e) => {
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
        resultsSection.innerHTML = `<p>No se encontraron canciones tuyas del artista "${artistName}".</p>`;
        return;
      }

      const top5 = filteredTracks.slice(0, 5);

      resultsSection.innerHTML = `
        <h2>Tu Top 5 canciones de ${artistName} (${timeRange.replace('_', ' ')})</h2>
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
