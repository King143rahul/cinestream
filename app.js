/**
 * CINESTREAM - Main JavaScript Application File
 * Dynamic TMDB API Integration using Bearer Token Authentication
 */

// TMDB API Configuration
const TMDB_TOKEN = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIxODAyMWNjMGQwNTZkOGJhZWRlNzgzYWRkOGExMDU3YiIsIm5iZiI6MTc3MTY4ODMzMi45MTkwMDAxLCJzdWIiOiI2OTk5ZDE4Y2FlNGQxMDA4MzA4MGU2NDUiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.MQZ3afVs3onXQzR09seH0QSKB4hoUnGSK6sjFjZc9Aw';
const TMDB_BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p';
const TMDB_API_KEY = '18021cc0d056d8baede783add8a1057b';
const IMDB_PHOTO_BASE_URL = 'https://imdb.iamidiotareyoutoo.com/photo';

function getImdbPhotoUrl(imdbId, width = 342, height = 513) {
  return imdbId ? `${IMDB_PHOTO_BASE_URL}/${encodeURIComponent(imdbId)}?w=${width}&h=${height}` : '';
}

function updateSeriesStats(isTv, seasonCount, episodeCount) {
  const stats = document.getElementById('modalSeriesStats');
  if (!stats) return;

  if (!isTv) {
    stats.textContent = '';
    stats.classList.add('d-none');
    return;
  }

  const seasons = Number.isFinite(seasonCount) ? `${seasonCount} Season${seasonCount === 1 ? '' : 's'}` : 'Seasons unavailable';
  const episodes = Number.isFinite(episodeCount) ? `${episodeCount} Episode${episodeCount === 1 ? '' : 's'}` : 'Episodes unavailable';
  stats.textContent = `${seasons} • ${episodes}`;
  stats.classList.remove('d-none');
}

function getOfficialTrailerUrl(details) {
  const videos = details.videos && details.videos.results ? details.videos.results : [];
  const trailer = videos.find(video => video.site === 'YouTube' && video.type === 'Trailer' && video.official)
    || videos.find(video => video.site === 'YouTube' && video.type === 'Trailer')
    || videos.find(video => video.site === 'YouTube');

  return trailer ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(trailer.key)}` : '';
}

function renderModalMedia({ title, trailerUrl = '', imageSrc = '', fallbackImageSrc = '' }) {
  const videoContainer = document.querySelector('.video-container');
  const playBtn = document.getElementById('modalPlayBtn');
  if (!videoContainer) return;

  videoContainer.innerHTML = `
    <img id="modalVideoPlayer" src="${imageSrc}" alt="${title}" ${fallbackImageSrc ? `onerror="this.onerror=null; this.src='${fallbackImageSrc}'"` : ''} style="width: 100%; height: 100%; object-fit: cover;">
  `;

  if (!playBtn) return;

  if (!trailerUrl) {
    playBtn.classList.add('d-none');
    playBtn.classList.remove('d-flex');
    playBtn.onclick = null;
    return;
  }

  playBtn.classList.remove('d-none');
  playBtn.classList.add('d-flex');
  playBtn.onclick = () => {
    videoContainer.innerHTML = `
      <iframe id="modalVideoPlayer" src="${trailerUrl}?autoplay=1" title="${title} official trailer" referrerpolicy="strict-origin-when-cross-origin" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>
    `;
  };
}

// Custom functions for dynamic player & episode selectors
function getPlayerUrl() {
  const tmdbId = (!isNaN(currentModalItem.id) && currentModalItem.id) ? currentModalItem.id : null;
  const imdbId = currentModalItem.imdbId;
  
  const serverSelect = document.getElementById('modalServerSelect');
  const server = serverSelect ? serverSelect.value : 'vidsrc_to';
  
  const seasonSelect = document.getElementById('modalSeasonSelect');
  const episodeSelect = document.getElementById('modalEpisodeSelect');
  const season = seasonSelect ? seasonSelect.value : 1;
  const episode = episodeSelect ? episodeSelect.value : 1;
  
  if (currentModalItem.isTv) {
    if (server === 'vidlink') {
      if (tmdbId) {
        return `https://vidlink.pro/tv/${tmdbId}/${season}/${episode}`;
      } else {
        // Fallback if TMDB ID is missing
        return imdbId ? `https://vidsrcme.ru/embed/tv/${imdbId}/${season}/${episode}` : '';
      }
    }
    
    const id = tmdbId || imdbId;
    if (!id) return '';
    
    if (server === 'vidsrc_to') {
      return `https://vidsrc.to/embed/tv/${id}/${season}/${episode}`;
    } else if (server === 'vidsrc_me') {
      return `https://vidsrcme.ru/embed/tv/${id}/${season}/${episode}`;
    } else if (server === 'vidsrc_cc') {
      return `https://vidsrc.cc/v2/embed/tv/${id}/${season}/${episode}`;
    }
  } else {
    if (server === 'vidlink') {
      if (tmdbId) {
        return `https://vidlink.pro/movie/${tmdbId}`;
      } else {
        // Fallback if TMDB ID is missing
        return imdbId ? `https://vidsrcme.ru/embed/movie/${imdbId}` : '';
      }
    }
    
    const id = tmdbId || imdbId;
    if (!id) return '';
    
    if (server === 'vidsrc_to') {
      return `https://vidsrc.to/embed/movie/${id}`;
    } else if (server === 'vidsrc_me') {
      return `https://vidsrcme.ru/embed/movie/${id}`;
    } else if (server === 'vidsrc_cc') {
      return `https://vidsrc.cc/v2/embed/movie/${id}`;
    }
  }
  return '';
}

function setupPlayNowButton() {
  const watchBtn = document.getElementById('modalWatchBtn');
  if (!watchBtn) return;
  
  // Set up server selector onchange listener
  const serverSelect = document.getElementById('modalServerSelect');
  if (serverSelect) {
    serverSelect.onchange = () => {
      const playerIframe = document.getElementById('modalVideoPlayer');
      if (playerIframe && playerIframe.tagName === 'IFRAME') {
        const newUrl = getPlayerUrl();
        if (newUrl) {
          playerIframe.src = newUrl;
        } else {
          alert("This server is not available for this media.");
        }
      }
    };
  }

  // Set up season/episode select onchange listeners to hot-reload iframe if playing
  const seasonSelect = document.getElementById('modalSeasonSelect');
  const episodeSelect = document.getElementById('modalEpisodeSelect');
  
  const onEpisodeChange = () => {
    const playerIframe = document.getElementById('modalVideoPlayer');
    if (playerIframe && playerIframe.tagName === 'IFRAME') {
      const newUrl = getPlayerUrl();
      if (newUrl) {
        playerIframe.src = newUrl;
      }
    }
  };
  
  if (seasonSelect) {
    seasonSelect.removeEventListener('change', onEpisodeChange);
    seasonSelect.addEventListener('change', onEpisodeChange);
  }
  if (episodeSelect) {
    episodeSelect.removeEventListener('change', onEpisodeChange);
    episodeSelect.addEventListener('change', onEpisodeChange);
  }

  watchBtn.onclick = () => {
    const videoContainer = document.querySelector('.video-container');
    if (!videoContainer) return;
    
    const embedUrl = getPlayerUrl();
    if (embedUrl) {
      videoContainer.innerHTML = `
        <iframe id="modalVideoPlayer" src="${embedUrl}" referrerpolicy="strict-origin-when-cross-origin" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen" allowfullscreen></iframe>
      `;
      
      // Request fullscreen automatically on the newly inserted iframe
      const playerIframe = document.getElementById('modalVideoPlayer');
      if (playerIframe) {
        playerIframe.requestFullscreen().catch(err => {
          console.log("Auto-fullscreen blocked or failed:", err);
        });
      }
    } else {
      alert("Playback is not available for this item.");
    }
  };
}

function setupTvSelectorsTMDB(details) {
  const seasonSelect = document.getElementById('modalSeasonSelect');
  const episodeSelect = document.getElementById('modalEpisodeSelect');
  const episodeTitleDisplay = document.getElementById('episodeTitleDisplay');
  if (!seasonSelect || !episodeSelect) return;

  seasonSelect.innerHTML = '';
  episodeSelect.innerHTML = '';
  if (episodeTitleDisplay) {
    episodeTitleDisplay.classList.add('d-none');
    episodeTitleDisplay.textContent = '';
  }

  const validSeasons = details.seasons ? details.seasons.filter(s => s.season_number > 0) : [];
  if (validSeasons.length === 0) {
    const opt = document.createElement('option');
    opt.value = 1;
    opt.textContent = 'Season 1';
    seasonSelect.appendChild(opt);
  } else {
    validSeasons.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s.season_number;
      opt.textContent = s.name || `Season ${s.season_number}`;
      seasonSelect.appendChild(opt);
    });
  }

  const updateEpisodes = async () => {
    const selectedSeasonNum = parseInt(seasonSelect.value);
    episodeSelect.innerHTML = '<option value="">Loading episodes...</option>';
    
    try {
      const seasonDetails = await tmdbFetch(`/tv/${details.id}/season/${selectedSeasonNum}`);
      episodeSelect.innerHTML = '';
      
      if (seasonDetails.episodes && seasonDetails.episodes.length > 0) {
        seasonDetails.episodes.forEach(ep => {
          const opt = document.createElement('option');
          opt.value = ep.episode_number;
          opt.textContent = `Ep ${ep.episode_number}: ${ep.name || 'Episode ' + ep.episode_number}`;
          opt.dataset.overview = ep.overview || '';
          episodeSelect.appendChild(opt);
        });
        
        showEpisodeOverview();
      } else {
        generateFallbackEpisodes();
      }
    } catch (err) {
      console.error("Failed to fetch season episodes:", err);
      generateFallbackEpisodes();
    }
  };

  const generateFallbackEpisodes = () => {
    episodeSelect.innerHTML = '';
    const selectedSeasonNum = parseInt(seasonSelect.value);
    const seasonInfo = validSeasons.find(s => s.season_number === selectedSeasonNum);
    const count = seasonInfo ? seasonInfo.episode_count : 24;
    for (let i = 1; i <= count; i++) {
      const opt = document.createElement('option');
      opt.value = i;
      opt.textContent = `Episode ${i}`;
      episodeSelect.appendChild(opt);
    }
    if (episodeTitleDisplay) {
      episodeTitleDisplay.classList.add('d-none');
    }
  };

  const showEpisodeOverview = () => {
    if (!episodeTitleDisplay) return;
    const selectedOption = episodeSelect.options[episodeSelect.selectedIndex];
    const overview = selectedOption ? selectedOption.dataset.overview : '';
    if (overview) {
      episodeTitleDisplay.textContent = overview;
      episodeTitleDisplay.classList.remove('d-none');
    } else {
      episodeTitleDisplay.classList.add('d-none');
      episodeTitleDisplay.textContent = '';
    }
  };

  seasonSelect.onchange = updateEpisodes;
  episodeSelect.onchange = showEpisodeOverview;

  updateEpisodes();
}

function setupTvSelectorsTVMaze(episodes) {
  const seasonSelect = document.getElementById('modalSeasonSelect');
  const episodeSelect = document.getElementById('modalEpisodeSelect');
  const episodeTitleDisplay = document.getElementById('episodeTitleDisplay');
  if (!seasonSelect || !episodeSelect) return;

  seasonSelect.innerHTML = '';
  episodeSelect.innerHTML = '';
  if (episodeTitleDisplay) {
    episodeTitleDisplay.classList.add('d-none');
    episodeTitleDisplay.textContent = '';
  }

  const seasonsMap = {};
  episodes.forEach(ep => {
    if (ep.season && ep.number) {
      if (!seasonsMap[ep.season]) {
        seasonsMap[ep.season] = [];
      }
      seasonsMap[ep.season].push(ep);
    }
  });

  const seasonsList = Object.keys(seasonsMap).sort((a, b) => parseInt(a) - parseInt(b));
  if (seasonsList.length === 0) {
    const opt = document.createElement('option');
    opt.value = 1;
    opt.textContent = 'Season 1';
    seasonSelect.appendChild(opt);
  } else {
    seasonsList.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s;
      opt.textContent = `Season ${s}`;
      seasonSelect.appendChild(opt);
    });
  }

  const updateEpisodes = () => {
    const selectedSeasonNum = seasonSelect.value;
    episodeSelect.innerHTML = '';
    
    const eps = seasonsMap[selectedSeasonNum] || [];
    eps.forEach(ep => {
      const opt = document.createElement('option');
      opt.value = ep.number;
      opt.textContent = `Ep ${ep.number}: ${ep.name || 'Episode ' + ep.number}`;
      
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = ep.summary || '';
      opt.dataset.overview = tempDiv.textContent || tempDiv.innerText || '';
      
      episodeSelect.appendChild(opt);
    });

    showEpisodeOverview();
  };

  const showEpisodeOverview = () => {
    if (!episodeTitleDisplay) return;
    const selectedOption = episodeSelect.options[episodeSelect.selectedIndex];
    const overview = selectedOption ? selectedOption.dataset.overview : '';
    if (overview) {
      episodeTitleDisplay.textContent = overview;
      episodeTitleDisplay.classList.remove('d-none');
    } else {
      episodeTitleDisplay.classList.add('d-none');
      episodeTitleDisplay.textContent = '';
    }
  };

  seasonSelect.onchange = updateEpisodes;
  episodeSelect.onchange = showEpisodeOverview;

  updateEpisodes();
}

function setupTvSelectorsGeneric() {
  const seasonSelect = document.getElementById('modalSeasonSelect');
  const episodeSelect = document.getElementById('modalEpisodeSelect');
  const episodeTitleDisplay = document.getElementById('episodeTitleDisplay');
  if (!seasonSelect || !episodeSelect) return;

  seasonSelect.innerHTML = '';
  episodeSelect.innerHTML = '';
  if (episodeTitleDisplay) {
    episodeTitleDisplay.classList.add('d-none');
    episodeTitleDisplay.textContent = '';
  }

  for (let i = 1; i <= 8; i++) {
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = `Season ${i}`;
    seasonSelect.appendChild(opt);
  }

  const updateEpisodes = () => {
    episodeSelect.innerHTML = '';
    for (let i = 1; i <= 24; i++) {
      const opt = document.createElement('option');
      opt.value = i;
      opt.textContent = `Episode ${i}`;
      episodeSelect.appendChild(opt);
    }
  };

  seasonSelect.onchange = updateEpisodes;
  updateEpisodes();
}

// Standard dynamic fetch wrapper using robust API Key URL Parameter
async function tmdbFetch(endpoint) {
  const separator = endpoint.includes('?') ? '&' : '?';
  const url = `${TMDB_BASE_URL}${endpoint}${separator}api_key=${TMDB_API_KEY}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      accept: 'application/json'
    }
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}

// Active State
let watchlist = JSON.parse(localStorage.getItem('cinestream_watchlist')) || [];
let activeCategory = 'all'; // all, movie, tv
let searchQuery = '';
let currentModalItem = {
  id: '',
  imdbId: '',
  isTv: false,
  title: ''
};

// DOM Elements
document.addEventListener('DOMContentLoaded', () => {
  initWatchlistUI();
  if (document.getElementById('dynamicRowsContainer')) {
    fetchTrendingCatalog();
    initInfiniteScroll();
  }
  setupEventListeners();
});

// Setup dynamic listeners
function setupEventListeners() {
  // Genre/Category tabs filter (only on homepage)
  if (document.getElementById('dynamicRowsContainer')) {
    const tabs = document.querySelectorAll('.category-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        activeCategory = tab.dataset.category;
        fetchTrendingCatalog();
      });
    });
  }

  // Auth Modal Switching Logic (Sign In vs Register)
  const toggleSignInBtn = document.getElementById('toggleSignInBtn');
  const toggleSignUpBtn = document.getElementById('toggleSignUpBtn');
  const authModalTitle = document.getElementById('authModalTitle');
  const usernameGroup = document.getElementById('usernameGroup');
  const confirmPasswordGroup = document.getElementById('confirmPasswordGroup');
  const authSubmitBtn = document.getElementById('authSubmitBtn');
  const authFooterText = document.getElementById('authFooterText');
  const switchToSignUpLink = document.getElementById('switchToSignUpLink');
  
  let isRegisterMode = false;

  function switchToRegister() {
    isRegisterMode = true;
    if (authModalTitle) authModalTitle.textContent = "REGISTER";
    
    // Toggle active tabs
    if (toggleSignInBtn && toggleSignUpBtn) {
      toggleSignInBtn.classList.remove('border-bottom', 'border-danger', 'border-2', 'text-white');
      toggleSignInBtn.classList.add('text-white-50');
      toggleSignUpBtn.classList.add('border-bottom', 'border-danger', 'border-2', 'text-white');
      toggleSignUpBtn.classList.remove('text-white-50');
    }
    
    // Show fields
    if (usernameGroup) usernameGroup.classList.remove('d-none');
    const userField = document.getElementById('authUsername');
    if (userField) userField.required = true;
    
    if (confirmPasswordGroup) confirmPasswordGroup.classList.remove('d-none');
    const confirmField = document.getElementById('authConfirmPassword');
    if (confirmField) confirmField.required = true;
    
    // Update button & footer
    if (authSubmitBtn) authSubmitBtn.textContent = "Register";
    if (authFooterText) {
      authFooterText.innerHTML = `
        <span class="text-white-50 small">Already have an account? </span>
        <a href="#" class="text-danger text-decoration-none small fw-bold" id="switchToSignInLink">Sign In now</a>
      `;
      const signInLink = document.getElementById('switchToSignInLink');
      if (signInLink) {
        signInLink.onclick = (e) => {
          e.preventDefault();
          switchToLogin();
        };
      }
    }
  }

  function switchToLogin() {
    isRegisterMode = false;
    if (authModalTitle) authModalTitle.textContent = "SIGN IN";
    
    // Toggle active tabs
    if (toggleSignInBtn && toggleSignUpBtn) {
      toggleSignUpBtn.classList.remove('border-bottom', 'border-danger', 'border-2', 'text-white');
      toggleSignUpBtn.classList.add('text-white-50');
      toggleSignInBtn.classList.add('border-bottom', 'border-danger', 'border-2', 'text-white');
      toggleSignInBtn.classList.remove('text-white-50');
    }
    
    // Hide fields
    if (usernameGroup) usernameGroup.classList.add('d-none');
    const userField = document.getElementById('authUsername');
    if (userField) userField.required = false;
    
    if (confirmPasswordGroup) confirmPasswordGroup.classList.add('d-none');
    const confirmField = document.getElementById('authConfirmPassword');
    if (confirmField) confirmField.required = false;
    
    // Update button & footer
    if (authSubmitBtn) authSubmitBtn.textContent = "Sign In";
    if (authFooterText) {
      authFooterText.innerHTML = `
        <span class="text-white-50 small">New to Cinestream? </span>
        <a href="#" class="text-danger text-decoration-none small fw-bold" id="switchToSignUpLink">Register now</a>
      `;
      const signUpLink = document.getElementById('switchToSignUpLink');
      if (signUpLink) {
        signUpLink.onclick = (e) => {
          e.preventDefault();
          switchToRegister();
        };
      }
    }
  }

  if (toggleSignInBtn && toggleSignUpBtn) {
    toggleSignInBtn.onclick = (e) => {
      e.preventDefault();
      switchToLogin();
    };
    toggleSignUpBtn.onclick = (e) => {
      e.preventDefault();
      switchToRegister();
    };
  }
  
  if (switchToSignUpLink) {
    switchToSignUpLink.onclick = (e) => {
      e.preventDefault();
      switchToRegister();
    };
  }

  // Auth Form submission handler
  const authForm = document.getElementById('authForm');
  if (authForm) {
    authForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const email = document.getElementById('authEmail').value;
      const usernameInput = document.getElementById('authUsername').value;
      const password = document.getElementById('authPassword').value;
      const confirmPassword = document.getElementById('authConfirmPassword').value;
      
      if (isRegisterMode) {
        // Validation
        if (password !== confirmPassword) {
          alert("Passwords do not match! Please check and try again.");
          return;
        }
        
        const displayName = usernameInput.trim() || email.split('@')[0];
        const formattedName = displayName.charAt(0).toUpperCase() + displayName.slice(1);
        
        updateLoggedInUser(formattedName);
        alert(`Account created successfully! Welcome to CINESTREAM, ${formattedName}!`);
      } else {
        const username = email.split('@')[0];
        const displayName = username.charAt(0).toUpperCase() + username.slice(1);
        
        updateLoggedInUser(displayName);
        alert(`Welcome back to CINESTREAM, ${displayName}! Enjoy streaming your favorite stories.`);
      }
      
      // Hide Modal
      const modalEl = document.getElementById('loginModal');
      const modal = bootstrap.Modal.getInstance(modalEl);
      if (modal) modal.hide();
    });
  }

  function updateLoggedInUser(displayName) {
    const profileTrigger = document.getElementById('profileTrigger');
    if (profileTrigger) {
      profileTrigger.innerHTML = `
        <div class="rounded-circle bg-danger d-flex align-items-center justify-content-center fw-bold text-white shadow-sm border border-2 border-white border-opacity-20" style="width: 32px; height: 32px; font-size: 0.8rem;" title="Logged in as ${displayName}">
          ${displayName.slice(0, 2).toUpperCase()}
        </div>
      `;
      profileTrigger.removeAttribute('data-bs-toggle');
      profileTrigger.removeAttribute('data-bs-target');
      profileTrigger.onclick = () => {
        if (confirm(`Welcome back, ${displayName}! Would you like to Sign Out?`)) {
          location.reload();
        }
      };
    }
  }

  // Modal clean closing state
  const detailModal = document.getElementById('movieDetailModal');
  if (detailModal) {
    detailModal.addEventListener('hidden.bs.modal', () => {
      const videoFrame = document.getElementById('modalVideoPlayer');
      if (videoFrame) {
        if (videoFrame.tagName === 'VIDEO') {
          videoFrame.pause();
        } else {
          videoFrame.src = '';
        }
      }
    });
  }
}

// Watchlist synchronization
function initWatchlistUI() {
  updateWatchlistBadge();
}

function updateWatchlistBadge() {
  const badges = document.querySelectorAll('.watchlist-count');
  badges.forEach(badge => {
    badge.textContent = watchlist.length;
    if (watchlist.length === 0) {
      badge.classList.add('d-none');
    } else {
      badge.classList.remove('d-none');
    }
  });
}

function toggleWatchlist(movieId, isTv = false) {
  const itemKey = movieId && (movieId.toString().startsWith('tvmaze:') || movieId.toString().startsWith('imdb:')) 
    ? movieId 
    : `${isTv ? 'tv' : 'movie'}:${movieId}`;
  const index = watchlist.indexOf(itemKey);
  if (index > -1) {
    watchlist.splice(index, 1);
  } else {
    watchlist.push(itemKey);
  }
  localStorage.setItem('cinestream_watchlist', JSON.stringify(watchlist));
  updateWatchlistBadge();
  renderWatchlistGrid();

  // Update watchlist button inside modal if visible
  const detailsBtn = document.getElementById('modalWatchlistBtn');
  if (detailsBtn) {
    const isSaved = watchlist.includes(itemKey);
    detailsBtn.innerHTML = isSaved 
      ? `<span class="material-symbols-outlined align-middle me-1">check</span> Added to List`
      : `<span class="material-symbols-outlined align-middle me-1">add</span> My List`;
  }
}

// Netflix-style Infinite Scrolling Categories configuration
const HOME_ROWS = [
  { title: "TOP TRENDING WEEKLY", endpoint: "/trending/all/week" },
  { title: "ACTION & ADVENTURE", endpoint: "/discover/movie?with_genres=28", type: "movie" },
  { title: "SCI-FI & FANTASY SENSATIONS", endpoint: "/discover/movie?with_genres=878", type: "movie" },
  { title: "COMEDY BLOCKBUSTERS", endpoint: "/discover/movie?with_genres=35", type: "movie" },
  { title: "POPULAR TELEVISION SHOWS", endpoint: "/discover/tv?sort_by=popularity.desc", type: "tv" },
  { title: "THRILLING SUSPENSE", endpoint: "/discover/movie?with_genres=53", type: "movie" },
  { title: "DRAMA COLLECTIVE", endpoint: "/discover/movie?with_genres=18", type: "movie" }
];

let currentLoadedRowIndex = 0;
let loadingNextRow = false;

// Infinite scrolling row loader
async function loadNextHomeRow() {
  if (currentLoadedRowIndex >= HOME_ROWS.length) return;
  if (loadingNextRow) return;
  
  loadingNextRow = true;
  const row = HOME_ROWS[currentLoadedRowIndex];
  
  // Skip rows that don't match the active filter category
  if (activeCategory === 'movie' && row.type === 'tv') {
    currentLoadedRowIndex++;
    loadingNextRow = false;
    loadNextHomeRow();
    return;
  }
  if (activeCategory === 'series' && row.type === 'movie') {
    currentLoadedRowIndex++;
    loadingNextRow = false;
    loadNextHomeRow();
    return;
  }

  try {
    let endpoint = row.endpoint;
    if (endpoint === '/trending/all/week') {
      if (activeCategory === 'movie') endpoint = '/trending/movie/week';
      else if (activeCategory === 'series') endpoint = '/trending/tv/week';
    }

    const data = await tmdbFetch(endpoint);
    if (data.results && data.results.length > 0) {
      appendHomeRowUI(row.title, data.results);
      currentLoadedRowIndex++;
    }
  } catch (err) {
    console.error("Error fetching homepage category details:", err);
  } finally {
    loadingNextRow = false;
  }
}

function appendHomeRowUI(title, items) {
  const container = document.getElementById('dynamicRowsContainer');
  if (!container) return;

  const validItems = items.filter(item => item.poster_path);
  if (validItems.length === 0) return;

  const section = document.createElement('section');
  section.className = 'mb-5';
  
  const header = document.createElement('div');
  header.className = 'd-flex justify-content-between align-items-center mb-3';
  header.innerHTML = `<h4 class="font-bebas text-white mb-0 tracking-wider">${title}</h4>`;
  
  const rowContainer = document.createElement('div');
  rowContainer.className = 'media-row-container hide-scrollbar';
  
  rowContainer.innerHTML = validItems.map(item => {
    const titleText = item.title || item.name || "Untitled Story";
    const rating = item.vote_average ? item.vote_average.toFixed(1) : "N/A";
    const isTv = item.first_air_date ? true : false;
    
    return `
      <div class="movie-card" onclick="openMovieDetails('${item.id}', ${isTv})">
        <img src="${IMAGE_BASE_URL}/w342${item.poster_path}" alt="${titleText}" loading="lazy">
        <div class="movie-card-overlay">
          <h5 class="fw-bold mb-1 text-white text-truncate" style="font-size: 0.95rem;">${titleText}</h5>
          <div class="d-flex align-items-center justify-content-between">
            <span class="badge bg-danger p-1" style="font-size: 0.65rem;">${rating} ★</span>
            <span class="text-white-50" style="font-size: 0.65rem;">${isTv ? 'Series' : 'Movie'}</span>
          </div>
        </div>
      </div>
    `;
  }).join('');

  section.appendChild(header);
  section.appendChild(rowContainer);
  container.appendChild(section);
}

// Reset infinite scroll grid
function resetHomeRows() {
  const container = document.getElementById('dynamicRowsContainer');
  if (container) container.innerHTML = '';
  currentLoadedRowIndex = 0;
  loadingNextRow = false;
  
  // Load first two rows immediately
  loadNextHomeRow().then(() => loadNextHomeRow());
}

// Bind scroll observer
function initInfiniteScroll() {
  window.addEventListener('scroll', () => {
    if ((window.innerHeight + window.scrollY) >= document.documentElement.scrollHeight - 300) {
      loadNextHomeRow();
    }
  });
}

// Fetch trending movies and TV series from TMDB using helper
async function fetchTrendingCatalog() {
  resetHomeRows();
  try {
    const data = await tmdbFetch('/trending/all/week');
    if (data.results && data.results.length > 0) {
      updateHeroShowcase(data.results[0]);
    }
  } catch (err) {
    console.error("Error loading hero banner showcase:", err);
  }
  renderWatchlistGrid();
}

// Render watchlist grid from TMDB, TVMaze & IMDb
async function renderWatchlistGrid() {
  const watchlistContainer = document.getElementById('watchlistContainer');
  const watchlistSection = document.getElementById('watchlistSection');
  if (!watchlistContainer) return;

  if (watchlist.length === 0) {
    watchlistSection.classList.add('d-none');
    return;
  }

  watchlistSection.classList.remove('d-none');
  watchlistContainer.innerHTML = ''; 

  for (const itemKey of watchlist) {
    const parts = itemKey.split(':');
    if (parts[0] === 'imdb') {
      const isTv = parts[1] === 'tv';
      const imdbId = parts[2];
      try {
        const response = await fetch(`https://imdb.iamidiotareyoutoo.com/search?q=${imdbId}`);
        if (!response.ok) throw new Error("IMDb watchlist fetch failed");
        const result = await response.json();
        const detailsArray = result.description || [];
        const item = detailsArray[0];
        
        if (item) {
          const title = item["#TITLE"] || "Untitled";
          const rank = item["#RANK"] || null;
          const rating = rank ? (10 - (rank / 10000)).toFixed(1) : "8.2";
          const fallbackPosterUrl = item["#IMG_POSTER"] || '';
          const posterUrl = getImdbPhotoUrl(imdbId);

          watchlistContainer.innerHTML += `
            <div class="movie-card" onclick="openMovieDetails('imdb:${isTv ? 'tv' : 'movie'}:${imdbId}', ${isTv})">
              ${posterUrl ? `<img src="${posterUrl}" alt="${title}" ${fallbackPosterUrl ? `onerror="this.onerror=null; this.src='${fallbackPosterUrl}'"` : ''}>` : `<div class="d-flex align-items-center justify-content-center text-muted bg-dark" style="height: 100%; aspect-ratio: 2/3;"><span class="material-symbols-outlined">movie</span></div>`}
              <div class="movie-card-overlay">
                <h5 class="fw-bold mb-1 text-white text-truncate" style="font-size: 0.95rem;">${title}</h5>
                <div class="d-flex align-items-center justify-content-between">
                  <span class="badge bg-danger p-1" style="font-size: 0.65rem;">${rating} ★</span>
                  <button class="btn btn-sm btn-dark py-0 px-1 border-0" onclick="event.stopPropagation(); toggleWatchlist('imdb:${isTv ? 'tv' : 'movie'}:${imdbId}', ${isTv})">
                    <span class="material-symbols-outlined fs-6 align-middle text-danger">delete</span>
                  </button>
                </div>
              </div>
            </div>
          `;
        }
      } catch (err) {
        console.error("Error loading IMDb watchlist item:", err);
      }
    } else if (parts[0] === 'tvmaze') {
      const id = parts[1];
      try {
        const response = await fetch(`https://api.tvmaze.com/shows/${id}`);
        if (!response.ok) throw new Error("TVMaze watchlist fetch failed");
        const item = await response.json();
        
        if (item) {
          const title = item.name;
          const rating = item.rating && item.rating.average ? item.rating.average.toFixed(1) : "N/A";
          const posterUrl = item.image ? (item.image.medium || item.image.original) : '';

          watchlistContainer.innerHTML += `
            <div class="movie-card" onclick="openMovieDetails('tvmaze:${item.id}', true)">
              ${posterUrl ? `<img src="${posterUrl}" alt="${title}">` : `<div class="d-flex align-items-center justify-content-center text-muted bg-dark" style="height: 100%; aspect-ratio: 2/3;"><span class="material-symbols-outlined">tv</span></div>`}
              <div class="movie-card-overlay">
                <h5 class="fw-bold mb-1 text-white text-truncate" style="font-size: 0.95rem;">${title}</h5>
                <div class="d-flex align-items-center justify-content-between">
                  <span class="badge bg-danger p-1" style="font-size: 0.65rem;">${rating} ★</span>
                  <button class="btn btn-sm btn-dark py-0 px-1 border-0" onclick="event.stopPropagation(); toggleWatchlist('tvmaze:${item.id}', true)">
                    <span class="material-symbols-outlined fs-6 align-middle text-danger">delete</span>
                  </button>
                </div>
              </div>
            </div>
          `;
        }
      } catch (err) {
        console.error("Error loading TVMaze watchlist item:", err);
      }
    } else {
      const [type, id] = parts;
      try {
        const item = await tmdbFetch(`/${type}/${id}`);
        
        if (item && item.poster_path) {
          const title = item.title || item.name;
          const rating = item.vote_average ? item.vote_average.toFixed(1) : "N/A";
          const isTv = type === 'tv';

          watchlistContainer.innerHTML += `
            <div class="movie-card" onclick="openMovieDetails('${item.id}', ${isTv})">
              <img src="${IMAGE_BASE_URL}/w342${item.poster_path}" alt="${title}">
              <div class="movie-card-overlay">
                <h5 class="fw-bold mb-1 text-white text-truncate" style="font-size: 0.95rem;">${title}</h5>
                <div class="d-flex align-items-center justify-content-between">
                  <span class="badge bg-danger p-1" style="font-size: 0.65rem;">${rating} ★</span>
                  <button class="btn btn-sm btn-dark py-0 px-1 border-0" onclick="event.stopPropagation(); toggleWatchlist('${item.id}', ${isTv})">
                    <span class="material-symbols-outlined fs-6 align-middle text-danger">delete</span>
                  </button>
                </div>
              </div>
            </div>
          `;
        }
      } catch (err) {
        console.error("Error loading watchlist item detail from TMDB:", err);
      }
    }
  }
}

// Update Hero banners dynamically
function updateHeroShowcase(item) {
  const heroImage = document.getElementById('heroBgImage');
  const heroTagline = document.getElementById('heroTagline');
  const heroTitle = document.getElementById('heroTitle');
  const heroMeta = document.getElementById('heroMeta');
  const heroPlayBtn = document.getElementById('heroPlayBtn');
  const heroListBtn = document.getElementById('heroListBtn');

  if (!item) return;

  const title = item.title || item.name || "Now Trending";
  const rating = item.vote_average ? item.vote_average.toFixed(1) : "N/A";
  const backdropPath = item.backdrop_path ? `${IMAGE_BASE_URL}/original${item.backdrop_path}` : '';
  const isTv = item.first_air_date ? true : false;

  if (heroImage && backdropPath) heroImage.src = backdropPath;
  if (heroTagline) heroTagline.textContent = isTv ? "SERIES PREMIERE" : "POPULAR BLOCKBUSTER";
  if (heroTitle) heroTitle.textContent = title;
  
  if (heroMeta) {
    heroMeta.innerHTML = `
      <span class="genre-badge">${item.original_language ? item.original_language.toUpperCase() : 'EN'}</span>
      <span class="genre-badge">${isTv ? 'SERIES' : 'MOVIE'}</span>
      <span class="genre-badge text-warning">${rating} ★</span>
    `;
  }

  // Setup dynamic play triggers
  if (heroPlayBtn) {
    heroPlayBtn.onclick = () => openMovieDetails(item.id, isTv);
  }

  if (heroListBtn) {
    const itemKey = item.id && item.id.toString().startsWith('tvmaze:') 
      ? item.id 
      : `${isTv ? 'tv' : 'movie'}:${item.id}`;
    const isSaved = watchlist.includes(itemKey);
    heroListBtn.innerHTML = isSaved 
      ? `<span class="material-symbols-outlined">check</span>`
      : `<span class="material-symbols-outlined">add</span>`;
    
    heroListBtn.onclick = (e) => {
      e.stopPropagation();
      toggleWatchlist(item.id, isTv);
      updateHeroShowcase(item); 
    };
  }
}

async function openMovieDetails(itemId, isTv = false) {
  try {
    // Check if the item is an IMDb item
    if (itemId && itemId.toString().startsWith('imdb:')) {
      const parts = itemId.split(':');
      const imdbId = parts[parts.length - 1];
      const actualIsTv = parts[1] === 'tv' || isTv;
      
      // Attempt to resolve IMDb ID to TMDB ID for a rich detailed view
      try {
        const findData = await tmdbFetch(`/find/${imdbId}?external_source=imdb_id`);
        if (actualIsTv && findData.tv_results && findData.tv_results.length > 0) {
          return openMovieDetails(findData.tv_results[0].id, true);
        } else if (!actualIsTv && findData.movie_results && findData.movie_results.length > 0) {
          return openMovieDetails(findData.movie_results[0].id, false);
        }
      } catch (err) {
        console.error("Failed to resolve IMDb ID to TMDB ID:", err);
      }
      
      const response = await fetch(`https://imdb.iamidiotareyoutoo.com/search?q=${imdbId}`);
      if (!response.ok) throw new Error("IMDb details fetch failed");
      const result = await response.json();
      const detailsArray = result.description || [];
      const details = detailsArray[0];

      if (!details) throw new Error("No details found for this IMDb ID");

      const title = details["#TITLE"] || "Untitled";
      const year = details["#YEAR"] || "N/A";
      const rank = details["#RANK"] || null;
      const rating = rank ? (10 - (rank / 10000)).toFixed(1) : "8.2";
      const actors = details["#ACTORS"] || "N/A";
      const fallbackImageSrc = details["#IMG_POSTER"] || '';
      const description = `Enjoy streaming this premium title on CINESTREAM. Starring ${actors}. Explore world-class cinematic stories, premium originals, and captivating documentations anywhere, anytime.`;

      // Set global modal state
      currentModalItem = {
        id: `imdb:${actualIsTv ? 'tv' : 'movie'}:${imdbId}`,
        imdbId: imdbId,
        isTv: actualIsTv,
        title: title
      };

      // Populate Modal Fields
      document.getElementById('modalMovieTitle').textContent = title;
      document.getElementById('modalAge').textContent = year;
      document.getElementById('modalType').textContent = (actualIsTv ? 'SERIES' : 'MOVIE');
      document.getElementById('modalRating').textContent = `${rating} ★`;
      document.getElementById('modalSynopsis').textContent = description;
      updateSeriesStats(actualIsTv);
      
      const genresContainer = document.getElementById('modalGenres');
      if (genresContainer) {
        genresContainer.textContent = 'Featured';
      }

      // Populate cast as pills
      const castContainer = document.getElementById('modalCast');
      if (castContainer) {
        if (actors && actors !== 'N/A') {
          const actorList = actors.split(', ').slice(0, 5);
          castContainer.innerHTML = actorList.map(actor => `<span class="cast-badge">${actor}</span>`).join('');
        } else {
          castContainer.innerHTML = `<span class="text-white-50 small">Cast details unavailable</span>`;
        }
      }

      renderModalMedia({
        title,
        imageSrc: getImdbPhotoUrl(imdbId, 1280, 720),
        fallbackImageSrc
      });

      // Watchlist Button Toggle
      const watchlistBtn = document.getElementById('modalWatchlistBtn');
      if (watchlistBtn) {
        const itemKey = `imdb:${actualIsTv ? 'tv' : 'movie'}:${imdbId}`;
        const isSaved = watchlist.includes(itemKey);
        watchlistBtn.innerHTML = isSaved 
          ? `<span class="material-symbols-outlined align-middle me-1">check</span> Added to List`
          : `<span class="material-symbols-outlined align-middle me-1">add</span> My List`;
        
        watchlistBtn.onclick = () => toggleWatchlist(itemId, actualIsTv);
      }

      // Setup Season/Episode selector container
      const selectorContainer = document.getElementById('modalTvSelectorContainer');
      if (actualIsTv) {
        if (selectorContainer) selectorContainer.classList.remove('d-none');
        setupTvSelectorsGeneric();
      } else {
        if (selectorContainer) selectorContainer.classList.add('d-none');
      }

      // Wire up PLAY NOW button
      setupPlayNowButton();

      // Hide similar recommendations for IMDb items
      const recsContainer = document.getElementById('modalRecsContainer');
      if (recsContainer) {
        recsContainer.innerHTML = `<span class="text-white-50 small">No similar titles currently recommended.</span>`;
      }

      // Launch Modal
      const modalElement = document.getElementById('movieDetailModal');
      const modal = new bootstrap.Modal(modalElement);
      modal.show();
      return;
    }

    // Check if the item is a TVMaze show
    if (itemId && itemId.toString().startsWith('tvmaze:')) {
      const showId = itemId.split(':')[1];
      const [response, episodesResponse] = await Promise.all([
        fetch(`https://api.tvmaze.com/shows/${showId}?embed=cast`),
        fetch(`https://api.tvmaze.com/shows/${showId}/episodes`)
      ]);
      if (!response.ok) throw new Error("TVMaze details fetch failed");
      const details = await response.json();
      const episodes = episodesResponse.ok ? await episodesResponse.json() : [];
      const seasonCount = new Set(episodes.map(episode => episode.season).filter(Boolean)).size;
      const imdbId = details.externals ? details.externals.imdb : null;

      // Set global modal state
      currentModalItem = {
        id: itemId,
        imdbId: imdbId,
        isTv: true,
        title: details.name
      };

      // Populate Modal Fields
      document.getElementById('modalMovieTitle').textContent = details.name;
      document.getElementById('modalAge').textContent = details.language ? details.language.toUpperCase() : 'EN';
      document.getElementById('modalType').textContent = 'SERIES';
      document.getElementById('modalRating').textContent = details.rating && details.rating.average ? `${details.rating.average.toFixed(1)} ★` : 'N/A';
      
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = details.summary || "No description currently available.";
      document.getElementById('modalSynopsis').textContent = tempDiv.textContent || tempDiv.innerText || "";
      updateSeriesStats(true, seasonCount, episodes.length);
      
      const genresContainer = document.getElementById('modalGenres');
      if (genresContainer) {
        genresContainer.textContent = details.genres && details.genres.length > 0 ? details.genres.join(' • ') : 'TV Series';
      }

      // Populate cast as pills
      const castContainer = document.getElementById('modalCast');
      if (castContainer) {
        const castList = (details._embedded && details._embedded.cast) ? details._embedded.cast.slice(0, 5) : [];
        if (castList.length > 0) {
          castContainer.innerHTML = castList.map(c => `<span class="cast-badge">${c.person.name}</span>`).join('');
        } else {
          castContainer.innerHTML = `<span class="text-white-50 small">Cast details unavailable</span>`;
        }
      }

      const fallbackImageSrc = details.image ? details.image.original : 'https://images.unsplash.com/photo-1574375927938-d5a98e8edd85?w=800';
      renderModalMedia({
        title: details.name,
        imageSrc: imdbId ? getImdbPhotoUrl(imdbId, 1280, 720) : fallbackImageSrc,
        fallbackImageSrc: imdbId ? fallbackImageSrc : ''
      });

      // Watchlist Button Toggle
      const watchlistBtn = document.getElementById('modalWatchlistBtn');
      if (watchlistBtn) {
        const itemKey = `tvmaze:${showId}`;
        const isSaved = watchlist.includes(itemKey);
        watchlistBtn.innerHTML = isSaved 
          ? `<span class="material-symbols-outlined align-middle me-1">check</span> Added to List`
          : `<span class="material-symbols-outlined align-middle me-1">add</span> My List`;
        
        watchlistBtn.onclick = () => toggleWatchlist(itemId, true);
      }

      // Setup Season/Episode selector container
      const selectorContainer = document.getElementById('modalTvSelectorContainer');
      if (selectorContainer) selectorContainer.classList.remove('d-none');
      setupTvSelectorsTVMaze(episodes);

      // Wire up PLAY NOW button
      setupPlayNowButton();

      // Hide similar recommendations for TVMaze items
      const recsContainer = document.getElementById('modalRecsContainer');
      if (recsContainer) {
        recsContainer.innerHTML = `<span class="text-white-50 small">No similar titles currently recommended.</span>`;
      }

      // Launch Modal
      const modalElement = document.getElementById('movieDetailModal');
      const modal = new bootstrap.Modal(modalElement);
      modal.show();
      return;
    }

    const type = isTv ? 'tv' : 'movie';
    const [details, recsData, creditsData] = await Promise.all([
      tmdbFetch(`/${type}/${itemId}?append_to_response=external_ids,videos`),
      tmdbFetch(`/${type}/${itemId}/recommendations`),
      tmdbFetch(`/${type}/${itemId}/credits`).catch(() => ({ cast: [] }))
    ]);

    const imdbId = details.imdb_id || (details.external_ids ? details.external_ids.imdb_id : null);
    
    // Set global modal state
    currentModalItem = {
      id: itemId,
      imdbId: imdbId,
      isTv: isTv,
      title: details.title || details.name
    };

    // Set descriptors
    document.getElementById('modalMovieTitle').textContent = details.title || details.name;
    document.getElementById('modalAge').textContent = details.original_language ? details.original_language.toUpperCase() : 'EN';
    document.getElementById('modalType').textContent = isTv ? 'SERIES' : 'MOVIE';
    document.getElementById('modalRating').textContent = details.vote_average ? `${details.vote_average.toFixed(1)} ★` : 'N/A';
    document.getElementById('modalSynopsis').textContent = details.overview || "No description currently available.";
    updateSeriesStats(isTv, details.number_of_seasons, details.number_of_episodes);
    
    const genresContainer = document.getElementById('modalGenres');
    if (genresContainer) {
      const genresList = details.genres ? details.genres.map(g => g.name).join(' • ') : '';
      genresContainer.textContent = genresList;
    }

    // Cast badges
    const castContainer = document.getElementById('modalCast');
    if (castContainer) {
      const castList = creditsData.cast ? creditsData.cast.slice(0, 5) : [];
      if (castList.length > 0) {
        castContainer.innerHTML = castList.map(c => `<span class="cast-badge">${c.name}</span>`).join('');
      } else {
        castContainer.innerHTML = `<span class="text-white-50 small">Cast details unavailable</span>`;
      }
    }

    // Photo API Container with Fallback
    const fallbackImageSrc = details.backdrop_path ? `${IMAGE_BASE_URL}/w780${details.backdrop_path}` : 'https://images.unsplash.com/photo-1574375927938-d5a98e8edd85?w=800';
    renderModalMedia({
      title: details.title || details.name,
      trailerUrl: getOfficialTrailerUrl(details),
      imageSrc: imdbId ? getImdbPhotoUrl(imdbId, 1280, 720) : fallbackImageSrc,
      fallbackImageSrc: imdbId ? fallbackImageSrc : ''
    });

    // Set watchlist button state
    const watchlistBtn = document.getElementById('modalWatchlistBtn');
    if (watchlistBtn) {
      const itemKey = `${isTv ? 'tv' : 'movie'}:${itemId}`;
      const isSaved = watchlist.includes(itemKey);
      watchlistBtn.innerHTML = isSaved 
        ? `<span class="material-symbols-outlined align-middle me-1">check</span> Added to List`
        : `<span class="material-symbols-outlined align-middle me-1">add</span> My List`;
      
      watchlistBtn.onclick = () => toggleWatchlist(itemId, isTv);
    }

    // Setup Season/Episode selector container
    const selectorContainer = document.getElementById('modalTvSelectorContainer');
    if (isTv) {
      if (selectorContainer) selectorContainer.classList.remove('d-none');
      setupTvSelectorsTMDB(details);
    } else {
      if (selectorContainer) selectorContainer.classList.add('d-none');
    }

    // Wire up PLAY NOW button
    setupPlayNowButton();

    injectRecommendationsIntoModal(recsData.results, isTv);

    // Launch Modal
    const modalElement = document.getElementById('movieDetailModal');
    const modal = new bootstrap.Modal(modalElement);
    modal.show();

  } catch (err) {
    console.error("Error loading movie detail parameters from TMDB:", err);
  }
}

// Immersive Recommendations engine
function injectRecommendationsIntoModal(items, isTv) {
  const modalBody = document.querySelector('#movieDetailModal .modal-body');
  let recsContainer = document.getElementById('modalRecsContainer');
  
  if (!recsContainer) {
    const divider = document.createElement('hr');
    divider.className = 'border-white border-opacity-10 my-4';
    
    const header = document.createElement('h4');
    header.className = 'font-bebas text-white mb-3 tracking-wider';
    header.textContent = 'YOU MIGHT ALSO LIKE';
    
    recsContainer = document.createElement('div');
    recsContainer.id = 'modalRecsContainer';
    recsContainer.className = 'media-row-container hide-scrollbar';
    
    modalBody.appendChild(divider);
    modalBody.appendChild(header);
    modalBody.appendChild(recsContainer);
  }

  if (!items || items.length === 0) {
    recsContainer.innerHTML = `<span class="text-white-50 small">No similar titles currently recommended.</span>`;
    return;
  }

  const validRecs = items.slice(0, 8).filter(item => item.poster_path);

  recsContainer.innerHTML = validRecs.map(item => `
    <div class="movie-card" style="min-width: 130px; width: 130px; aspect-ratio: 2/3;" onclick="bootstrap.Modal.getInstance(document.getElementById('movieDetailModal')).hide(); setTimeout(() => openMovieDetails('${item.id}', ${isTv}), 400)">
      <img src="${IMAGE_BASE_URL}/w185${item.poster_path}" alt="${item.title || item.name}">
      <div class="movie-card-overlay p-2">
        <span class="badge bg-danger p-1" style="font-size: 0.6rem;">${item.vote_average ? item.vote_average.toFixed(1) : 'N/A'} ★</span>
      </div>
    </div>
  `).join('');
}

// Dynamic Grid Error State helper
function showGridErrorState() {
  const container = document.getElementById('dynamicRowsContainer');
  if (container) {
    container.innerHTML = `
      <div class="col-12 text-center py-5 text-muted glass-panel py-5 rounded-4">
        <span class="material-symbols-outlined fs-1 mb-2 text-danger">wifi_off</span>
        <h5 class="text-white">API Integration Offline</h5>
        <p class="mb-0 text-white-50 px-3">Could not load themed recommendations. Please double check configurations.</p>
      </div>
    `;
  }
}
