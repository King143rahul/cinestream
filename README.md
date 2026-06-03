# CINESTREAM 🎬
> A Premium, Responsive Cinematic Streaming Portal built with modern web technologies, TMDB integration, and dynamic multi-server streaming capabilities.

---

## 🌟 Key Features

*   **Premium Glassmorphic Design**: Sleek dark mode visual hierarchy styled with HSL custom palettes, smooth transitions, and premium Google typography (*Bebas Neue* & *Inter*).
*   **Multi-Server Video Players**: Play movies and TV show episodes directly within the web application using four fallback servers to guarantee uptime:
    *   **Server 1**: `vidsrc.to` (Standard Embed API)
    *   **Server 2**: `vidsrcme.ru` (Official Live VidSrc Mirror)
    *   **Server 3**: `vidsrc.cc` (Aggregator Mirror)
    *   **Server 4**: `vidlink.pro` (Advanced Aggregator with custom player features)
*   **Smart Episode Selectors**:
    *   **TMDB integration**: Dynamically loads season details, showing actual episode titles (e.g. `Ep 1: Winter Is Coming`) and summaries, and hot-reloads the video player on selection change.
    *   **TVMaze integration**: Groups pre-fetched episodes list by season in memory and displays interactive selection cards.
- **Search Catalog Explorer**: Dedicated search page integrating live search queries via unofficial IMDb search and live TMDB genre tagging.
- **Watchlist Manager**: Synchronizes user selection to local storage with reactive indicators and row populating.
- **Responsive Mobile Navigation**: Adaptive bottom navigation shell styled for touch interfaces on mobile devices.

---

## 🛠️ Architecture and Stack

-   **Frontend Core**: Semantic HTML5, CSS3 Custom Properties (Design Tokens), Bootstrap 5.3.2.
-   **Scripting Engine**: Vanilla JavaScript (ES6 Modules/Asynchronous APIs).
-   **API Integration**:
    -   **TMDB (The Movie Database)**: Details, media, video trailers, credits, search recommendations, and season/episode indexing.
    -   **IMDb Finder**: Find details by resolving standard `tt` prefix IDs.
    -   **TVMaze**: Fallback TV show listings and episode guides.

---

## ⚙️ Setup and Installation

### 1. Prerequisites
You only need a modern web browser to run CINESTREAM since it is a pure client-side application.

### 2. File Directory
Ensure the workspace directory contains the following layout:
```text
webtech/
├── index.html        # Main landing page & homepage dashboard
├── search.html       # Advanced catalog explorer & search engine
├── app.js            # Unified script logic, API client & event mapping
├── styles.css        # Premium custom CSS system (glassmorphism & animation)
└── README.md         # Documentation & setup guide
```

### 3. Running Locally
Simply open the `index.html` file in any modern browser, or spin up a local development server for the best experience (e.g., using VS Code Live Server, Python's http server, or Node's `http-server`):

```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx http-server -p 8000
```
Then navigate to `http://localhost:8000` in your browser.

---

## 📖 Instructions for Use

### 🔍 Searching Content
1. Click the **Search (magnifying glass)** icon in the top navigation bar to go to the Catalog Explorer.
2. Type any movie, TV show, or actor name in the search bar.
3. Use the **Genre Pills** (e.g. Action, Sci-Fi, Drama) to filter the recommendations immediately.
4. Toggle between "All Content", "Movies Only", and "TV Shows Only" to refine your results.

### 📺 Streaming Media
1. Click on any Movie or TV Show card to open the **Details Modal**.
2. **For Movies**: Click the red **PLAY NOW** button. The movie player will load and automatically launch in **Fullscreen Mode**. Press `Esc` at any time to exit fullscreen.
3. **For TV Shows**: 
   - Choose your desired **Season** and **Episode** from the selector dropdown lists.
   - The selected episode summary/description will display below the dropdowns.
   - Click the red **PLAY NOW** button to begin streaming that specific episode in fullscreen.
   - *Tip*: If the player is already active, changing the Season or Episode dropdowns will **automatically reload** the stream to play the new episode instantly!

### 🔄 Troubleshooting Playback ("Media Unavailable")
If a video displays a "This media is unavailable at the moment" message:
1. Locate the **SELECT STREAMING SERVER** dropdown above the action buttons in the Details Modal.
2. Change the server option (e.g., switch from *Server 1* to *Server 2* or *Server 4*).
3. The video player iframe will **hot-reload** with the new provider's stream instantly. Try switching servers until you find one with active stream files.
4. If you experience persistent ads, we recommend using an ad-blocking browser extension (like *uBlock Origin*) to keep playback clean.

---

## 🔒 Security & Performance
- **Ad & Redirect Blocking**: Playback is routed with secure cross-origin flags to isolate external aggregators.
- **Lazy Loading**: Posters and backdrop assets are loaded asynchronously (`loading="lazy"`) to optimize paint times and save network bandwidth.
