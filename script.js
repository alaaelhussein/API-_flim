const apiKey = '554ea070';

// Carrousel d'images de films
const moviePosters = [
  'https://m.media-amazon.com/images/M/MV5BMDFkYTc0MGEtZmNhMC00ZDIzLWFmNTEtODM1ZmRlYWMwMWFmXkEyXkFqcGdeQXVyMTMxODk2OTU@._V1_SX300.jpg', // The Shawshank Redemption
  'https://m.media-amazon.com/images/M/MV5BM2MyNjYxNmUtYTAwNi00MTYxLWJmNWYtYzZlODY3ZTk3OTFlXkEyXkFqcGdeQXVyNzkwMjQ5NzM@._V1_SX300.jpg', // The Godfather
  'https://m.media-amazon.com/images/M/MV5BMTMxNTMwODM0NF5BMl5BanBnXkFtZTcwODAyMTk2Mw@@._V1_SX300.jpg', // The Dark Knight
  'https://m.media-amazon.com/images/M/MV5BMWU4N2FjNzYtNTVkNC00NzQ0LTg0MjAtYTJlMjFhNGUxZDFmXkEyXkFqcGdeQXVyNjc1NTYyMjg@._V1_SX300.jpg', // Pulp Fiction
  'https://m.media-amazon.com/images/M/MV5BNGNhMDIzZTUtNTBlZi00MTRlLWFjM2ItYzViMjE3YzI5MjljXkEyXkFqcGdeQXVyNzkwMjQ5NzM@._V1_SX300.jpg', // Forrest Gump
  'https://m.media-amazon.com/images/M/MV5BNzQzOTk3OTAtNDQ0Zi00ZTVkLWI0MTEtMDllZjNkYzNjNTc4L2ltYWdlXkEyXkFqcGdeQXVyNjU0OTQ0OTY@._V1_SX300.jpg', // The Matrix
  'https://m.media-amazon.com/images/M/MV5BMjAxMzY3NjcxNF5BMl5BanBnXkFtZTcwNTI5OTM0Mw@@._V1_SX300.jpg', // Inception
  'https://m.media-amazon.com/images/M/MV5BNzA5ZDNlZWMtM2NhNS00NDJjLTk4NDItYTRmY2EwMWZlMTY3XkEyXkFqcGdeQXVyNzkwMjQ5NzM@._V1_SX300.jpg' // The Lord of the Rings
];

let currentPosterIndex = 0;

function updateCarousel() {
  const carouselImage = document.getElementById('carouselImage');
  carouselImage.style.opacity = '0';
  
  setTimeout(() => {
    carouselImage.src = moviePosters[currentPosterIndex];
    carouselImage.style.opacity = '1';
    currentPosterIndex = (currentPosterIndex + 1) % moviePosters.length;
  }, 250);
}

// Initialiser le carrousel au chargement
updateCarousel();
// Changer l'image toutes les 2 secondes
setInterval(updateCarousel, 2000);

$(function () {

  // Cache des éléments DOM utilisés 
  const $formulaire = $('#searchForm');       
  const $titre = $('#movieTitle');
  const $annee = $('#movieYear');
  const $typeSelect = $('#movieType');
  const $sectionResultats = $('#resultSection');

  // Mémoire locale pour éviter de recharger inutilement les mêmes détails
  let cacheDetails = [];
  // Liste des derniers résultats (au format Search renvoyé par OMDB)
  let derniersItemsRecherche = [];

  // Image locale utilisée quand l'affiche n'est pas disponible
  const cheminImageIndisponible = 'images/imageIndisponible.svg';

  $formulaire.on('submit', function (e) {
    e.preventDefault();
    console.log('Formulaire soumis — démarrage de la recherche');
    // Récupération + nettoyage des champs de recherche
    const title = String($titre.val() || '').trim();
    const year = String($annee.val() || '').trim();
    const type = String($typeSelect.val() || 'all');

    console.log('Champs reçus :', { title: title, year: year, type: type });

    // Validation 
    if (!title) {
      console.log('Titre absent  affichage  message d’erreur utilisateur');
      $sectionResultats.html('<p class="message">Veuillez entrer un titre de film.</p>');
      return; 
    }

    // Indicateur visuel pendant la requête
    $sectionResultats.html('<div class="spinner" aria-hidden="true"></div><p class="message">Recherche en cours...</p>');
    console.log('Affichage du spinner — préparation de la requête OMDB');

    // Construction des paramètres pour la recherche OMDB (paramètre 's' = search)
    const parametres = new URLSearchParams({ apikey: apiKey, s: title });
    // Validation stricte de l'année : n'accepte que 4 chiffres (ex: 1999)
    if (year) {
      if (/^\d{4}$/.test(year)) {
        parametres.set('y', year);
        console.log('Année valide ajoutée aux paramètres :', year);
      } else {
        // Année invalide : on l'ignore volontairement (log pour debug)
        console.log('Année ignorée :', year);
      }
    }
    if (type && type !== 'all') parametres.set('type', type); 

    console.log('Paramètres construits pour OMDB search :', parametres.toString());

    // Requête JSON (jQuery.getJSON) vers l'API OMDB
    // On utilise la réponse 'Search' pour afficher une grille, puis on
    // récupère les détails individuels (par imdbID) pour enrichir l'affichage.
    const searchUrl = 'https://www.omdbapi.com/?' + parametres.toString();
    console.log('Envoi de la requête OMDB (search) ->', searchUrl);

    $.getJSON(searchUrl)
      .done(function (searchData) {
        console.log('Réponse OMDB (search) reçue :', searchData);

        // OMDB peut renvoyer Response: 'False' si rien n'a été trouvé
        if (searchData.Response !== 'True' || !Array.isArray(searchData.Search)) {
          $sectionResultats.html('<p class="message">Aucun résultat trouvé. Essayez d’élargir vos critères.</p>');
          return;
        }

        // Sauvegarde des items au format Search pour consultation ultérieure
        derniersItemsRecherche = searchData.Search;
        const limit = Math.min(5, searchData.Search.length); // limiter le nombre de titres demandés
        console.log('Items trouvés :', searchData.Search.length, ' — on récupèrera les détails pour', limit, 'items.');

        // Pour chaque item retourné, on demande les détails 
        const promessesDetails = $.map(searchData.Search.slice(0, limit), function (item, idx) {
          const paramDetail = new URLSearchParams({ apikey: apiKey, i: item.imdbID, plot: 'short' });
          const urlDetail = 'https://www.omdbapi.com/?' + paramDetail.toString();
          console.log('Lancement requête détail pour', item.imdbID, '->', urlDetail);

          return $.getJSON(urlDetail).then(function (d) { 
            console.log('Détail reçu pour', item.imdbID, d && d.Response === 'True' ? 'OK' : 'Réponse invalide', d);
            return d; 
          }).catch(function (err) { 
            console.warn('Échec récupération détail pour', item.imdbID, err);
            return null; 
          });
        });

        // Une fois que tous les appels de détails sont résolus, on rend la grille
        Promise.all(promessesDetails).then(function (resultats) {
          console.log('Toutes les promesses de détails sont résolues.');
          cacheDetails = resultats; // mise en cache locale
          console.log('Mise en cache details — éléments en cache :', cacheDetails.length);
          rendreGrilleResultats(cacheDetails, searchData.Search.slice(0, limit));
          console.log('Rendu de la grille de résultats terminé.');
        });
      })
      .fail(function (jqxhr, textStatus, err) {
        // En cas d'erreur réseau ou serveur, logger et afficher un message
        console.error('Erreur fetch (search) :', textStatus, err);
        $sectionResultats.html('<p class="message">Erreur lors de la requête : ' + (err || textStatus) + '</p>');
      });
  });

  $sectionResultats.on('click', '.result-card', function () {
    const indice = $(this).data('indice');
    console.log('Clic sur carte — indice :', indice);
    if (typeof indice !== 'undefined') afficherDetail(parseInt(indice, 10));
  });

  $sectionResultats.on('click', '.back-button', function () {
    rendreGrilleResultats(cacheDetails, derniersItemsRecherche);
  });


  // Rend une grille de cartes de résultat
  function rendreGrilleResultats(detailsArr, itemsArr) {
    console.log('rendreGrilleResultats — démarrage', { detailsCount: detailsArr.length, itemsCount: itemsArr.length });
    const cartes = $.map(detailsArr, function (d, idx) {

      const base = d && d.Response === 'True' ? d : (itemsArr[idx] || {});
      const poster = base && base.Poster && base.Poster !== 'N/A' ? base.Poster : cheminImageIndisponible;
      const titreTexte = base.Title || 'Titre inconnu';
      const anneeTexte = base.Year || '';
      const typeTexte = base.Type ? base.Type : (itemsArr[idx] && itemsArr[idx].Type ? itemsArr[idx].Type : '—');
      const note = (d && d.imdbRating && d.imdbRating !== 'N/A') ? d.imdbRating : '—';

      return `
        <article class="result-card" data-indice="${idx}" tabindex="0">
          <div class="poster">
            <img src="${poster}" alt="Affiche de ${titreTexte}" onerror="this.onerror=null; this.src='${cheminImageIndisponible}'" />
            <div class="rating-badge">IMDb ${note}</div>
          </div>
          <div class="details">
            <h3 class="movie-title">${titreTexte} <span class="movie-year">${anneeTexte}</span></h3>
            <div class="meta-line">Type: <strong>${typeTexte}</strong></div>
          </div>
        </article>
      `;
    }).join('\n');

    $sectionResultats.html('<div class="results-grid">' + cartes + '</div>');
    console.log('Grille injectée dans le DOM');
  }

  // Affiche la vue détaillée d'un élément (si déjà en cache) ou la récupère
  function afficherDetail(indice) {
    console.log('afficherDetail — demande pour indice', indice);
    const detail = cacheDetails[indice];
    let complet = detail;

    if (!complet || complet.Response !== 'True') {
      console.log('Détail absent en cache ou invalide — tentative de récupération via Search fallback');
      const element = derniersItemsRecherche[indice];
      if (!element) { $sectionResultats.html('<p class="message">Détails indisponibles pour cet élément.</p>'); return; }
      const paramDetail = new URLSearchParams({ apikey: apiKey, i: element.imdbID, plot: 'full' });
      const url = 'https://www.omdbapi.com/?' + paramDetail.toString();
      console.log('Récupération détail (full) via URL ->', url);
      $.getJSON(url)
        .done(function (data) {
          console.log('Détail complet reçu :', data && data.Title ? data.Title : '(sans titre)');
          complet = data;
          rendreDetail(complet); 
        })
        .fail(function (err) {
          console.error('Échec récupération détail complet :', err);
          $sectionResultats.html('<p class="message">Détails indisponibles pour cet élément.</p>');
        });
    } else {
      console.log('Détail trouvé en cache — rendu direct');
      rendreDetail(complet);
    }
  }

  // Rend la vue détaillée complète d'un objet OMDB (complet)
  // Accepte un objet OMDB tel que renvoyé par l'API (Response: 'True')
  function rendreDetail(complet) {
    if (!complet || complet.Response !== 'True') {
      console.log('rendreDetail — données invalides ou manquantes', complet);
      $sectionResultats.html('<p class="message">Détails indisponibles pour cet élément.</p>');
      return;
    }

    console.log('Rendu détail pour :', complet.Title || '(sans titre)');

    const poster = complet.Poster && complet.Poster !== 'N/A' ? complet.Poster : cheminImageIndisponible;

    const html = `
      <div class="detail-view">
        <button class="back-button">← Retour aux résultats</button>
        <div class="result-card full">
          <div class="poster">
            <img src="${poster}" alt="Affiche de ${complet.Title}" onerror="this.onerror=null; this.src='${cheminImageIndisponible}'" />
            <div class="rating-badge">IMDb ${complet.imdbRating || '—'}</div>
          </div>
          <div class="details">
            <h2>${complet.Title} <span class="movie-year">${complet.Year}</span></h2>
            <p class="plot">${complet.Plot}</p>
            <div class="divider"></div>
            <div class="meta-grid">
              <div class="col">
                <div class="meta-item"><div class="meta-label">Durée</div><div class="meta-value">${complet.Runtime || 'N/A'}</div></div>
                <div class="meta-item"><div class="meta-label">Réalisateur</div><div class="meta-value">${complet.Director || 'N/A'}</div></div>
              </div>
              <div class="col">
                <div class="meta-item"><div class="meta-label">Acteurs</div><div class="meta-value">${complet.Actors || 'N/A'}</div></div>
                <div class="meta-item"><div class="meta-label">Genre</div><div class="meta-value">${complet.Genre || 'N/A'}</div></div>
                <div class="meta-item"><div class="meta-label">Langue</div><div class="meta-value">${complet.Language || 'N/A'}</div></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    $sectionResultats.html(html);
  }

});