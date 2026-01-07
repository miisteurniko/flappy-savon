// ========================================
// Flappy Savon - Configuration
// ========================================

const CONFIG = {
  // API Endpoints
  api: {
    base: 'https://n8n.miisteurniko.fr/webhook',
    get score() { return this.base + '/flappy-score'; },
    get leaderboard() { return this.base + '/flappy-leaderboard'; }
  },

  // Contest settings
  contest: {
    startDate: '2025-01-01T00:00:00+01:00',
    endDate: '2025-01-31T23:59:59+01:00',
    top3Goal: 3
  },

  // Canvas dimensions
  canvas: {
    width: 420,
    height: 700
  },

  // Physics (DO NOT MODIFY - difficulty locked)
  physics: {
    gravity: 0.45,
    flapForce: -8.5,
    scrollSpeed: 2.25
  },

  // Pipes (DO NOT MODIFY - difficulty locked)
  pipes: {
    gap: 150,
    width: 70,
    spacing: 220
  },

  // Ground
  ground: {
    height: 90
  },

  // Soap (player)
  soap: {
    width: 60,
    height: 35,
    startX: 100
  },

  // Scoring
  scoring: {
    pointsPerPipe: 10
  },

  // Security settings
  security: {
    maxScorePerSecond: 0.5,  // ~1 pipe every 2 seconds max
    minGameDuration: 2,       // Minimum seconds before valid score
    postCooldown: 3000,       // Ms between score posts
    hashSalt: 'SY2025FlappySavon'
  },

  // UI Timing
  ui: {
    toastDuration: 1700,
    rankDisplayDuration: 2600,
    leaderboardRefresh: 30000,
    reminderAfterGames: 2
  },

  // Themes (unlocked by score) - Brand colors progression
  themes: [
    { id: 'savonnerie', from: 0, bg1: '#d0e8f0', bg2: '#b0d8e8', fog: 0, leaves: 2, bubbleMul: 1 },      // Salle de bain (Bleu/Cyan)
    { id: 'atelier', from: 10, bg1: '#e8e4d8', bg2: '#d5cfc2', fog: 0, leaves: 2, bubbleMul: 1 },        // Beige
    { id: 'lavande', from: 20, bg1: '#e8e0f0', bg2: '#d0c5e5', fog: 0, leaves: 3, bubbleMul: 1.1 },      // Lavande
    { id: 'hammam', from: 30, bg1: '#d5e8e8', bg2: '#b8d5d5', fog: 1, leaves: 3, bubbleMul: 1.2 },       // Bleu hammam
    { id: 'sunset', from: 80, bg1: '#f0d5c5', bg2: '#e5b8a0', fog: 0, leaves: 4, bubbleMul: 1.3 },       // Coucher de soleil
    { id: 'nuit', from: 100, bg1: '#2a2a3a', bg2: '#1a1a28', fog: 1, leaves: 2, bubbleMul: 1.5 }         // Nuit étoilée
  ],

  // Skins
  skins: [
    // 0 Points (Defaults)
    { id: 'monoi', name: 'Monoï', c1: '#fff0d5', c2: '#ffd19a', unlockAt: 0, decor: { type: 'flower', count: 6, speed: 0.5 } },
    { id: 'citron', name: 'Citron Gingembre', c1: '#fff9c4', c2: '#fbc02d', unlockAt: 0, decor: { type: 'citron_mix', count: 6, speed: 0.6 } }, // More Yellow
    { id: 'safran', name: 'Safran', c1: '#ffccbc', c2: '#ff7043', unlockAt: 0, decor: { type: 'safran', count: 8, speed: 0.7 } },           // More Reddish/Orange

    // Unlockable Progression
    { id: 'cedre', name: 'Cèdre du Liban', c1: '#c7b299', c2: '#8e6e53', unlockAt: 5, decor: { type: 'cedar', count: 8, speed: 0.6 } },   // 5 pts
    { id: 'figue', name: 'Figue Santal', c1: '#e8dcb5', c2: '#d4c085', unlockAt: 10 },    // 10 pts
    { id: 'lait', name: "Lait d'ânesse", c1: '#f9fbff', c2: '#e2e8f0', unlockAt: 15 },    // 15 pts
    { id: 'ortie', name: "Poudre d'Ortie", c1: '#cfe8c8', c2: '#84c17a', unlockAt: 20 },  // 20 pts
    { id: 'miel', name: 'Miel Amande', c1: '#eec051', c2: '#d4a037', unlockAt: 50 },      // 50 pts
  ],

  // Badges (Score-based)
  badges: [
    { score: 10, name: 'Apprenti Mousse' },
    { score: 25, name: 'Maître Savonnier' },
    { score: 50, name: 'Légende de la Mousse' }
  ],

  // Images (optional)
  images: {
    obstacle: '',
    prizes: { 1: '', 2: '', 3: '' }
  }
};

// Freeze config to prevent modifications
Object.freeze(CONFIG);
Object.freeze(CONFIG.api);
Object.freeze(CONFIG.physics);
Object.freeze(CONFIG.pipes);
Object.freeze(CONFIG.security);

// Export for modules
if (typeof module !== 'undefined') {
  module.exports = CONFIG;
}
