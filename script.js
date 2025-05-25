const accessToken = "BQD4yRQuaNek3EdfQvN7OEhHMeym0LLX_pPKrSkGYG2CHQXGrO2mbohnijcorDpUw8sOWkpDj-YErjbB60UwszAgSOXQBnR6zSyvxGqNxEDn_BR19C165n6Je5di0F7xtiTFuwA2ZV59Tgp_EEdOqbDW9Q3wRDlGt-MT486geIqYwxiAAijJTT76p3LQyFPiRbppKgI75dAt5tw1gzBTmC2bHdJBFZI";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("artist-form");
  const input = document.getElementById("artist-input");
  const resultsSection = document.querySelector(".results-section");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const artistName = input.value.trim();
    if (!artistName) return;

    resultsSection.innerHTML = "<p>Cargando...</p>";

    try {
      // 1. Obtener tus top tracks personales (máximo 50)
      const response = await fetch("https://api.spotify.com/v1/me/top/tracks?limit=50&time_range=short_term", {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });
      if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);

      const data = await response.json();
      const tracks = data.items;

      // 2. Filtrar solo las canciones del artista buscado
      const filteredTracks = tracks.filter(track => 
        track.artists.some(artist => artist.name.toLowerCase() === artistName.toLowerCase())
      );

      if (filteredTracks.length === 0) {
        resultsSection.innerHTML = `<p>No se encontraron canciones tuyas del artista "${artistName}".</p>`;
        return;
      }

      // 3. Tomar top 5 (o menos si no hay 5)
      const top5 = filteredTracks.slice(0, 5);

      // 4. Mostrar resultados
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