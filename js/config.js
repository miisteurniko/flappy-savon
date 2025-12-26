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
    width: 66,
    height: 38,
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

  // Themes (unlocked by score) - Brand colors: cream, beige, warm tones
  themes: [
    { id: 'savonnerie', from: 0, bg1: '#f5f0e8', bg2: '#ebe4d8', grid: 'rgba(0,0,0,0)', fog: 0, leaves: 6, bubbleMul: 1 },
    { id: 'atelier', from: 10, bg1: '#ebe4d8', bg2: '#ddd5c5', grid: 'rgba(0,0,0,0)', fog: 0, leaves: 4, bubbleMul: 1.2 },
    { id: 'hammam', from: 25, bg1: '#e8e0d5', bg2: '#d5ccc0', grid: 'rgba(0,0,0,0)', fog: 1, leaves: 8, bubbleMul: 1.4 }
  ],

  // Skins
  skins: [
    { id: 'ortie', name: "Poudre d'Ortie", c1: '#cfe8c8', c2: '#84c17a' },
    { id: 'monoi', name: 'Monoï', c1: '#fff0d5', c2: '#ffd19a' },
    { id: 'citron', name: 'Citron Gingembre', c1: '#ffd6a3', c2: '#ffab40' },
    { id: 'lait', name: "Lait d'ânesse", c1: '#f9fbff', c2: '#e2e8f0' },
    { id: 'safran', name: 'Safran', c1: '#ffe7a8', c2: '#f6b340' },
    { id: 'cedre', name: 'Cèdre du Liban', c1: '#c7b299', c2: '#8e6e53' },
    { id: 'noir', name: 'Savon noir', c1: '#222629', c2: '#0b0f12' }
  ],

  // Badges
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
