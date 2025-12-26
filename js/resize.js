// ========================================
// Flappy Savon - Canvas Resize Handler
// ========================================

const CanvasResize = {
    _canvas: null,
    _baseWidth: 420,
    _baseHeight: 700,
    _scale: 1,

    // Initialize resize handler
    init(canvas) {
        this._canvas = canvas;

        // Initial resize
        this.resize();

        // Listen for resize and orientation change
        window.addEventListener('resize', () => this.resize());
        window.addEventListener('orientationchange', () => {
            setTimeout(() => this.resize(), 100);
        });

        // Handle visual viewport changes (for iOS keyboard, etc.)
        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', () => this.resize());
        }
    },

    // Resize canvas to fill screen while maintaining aspect ratio
    resize() {
        const vw = window.innerWidth;
        const vh = window.innerHeight;

        // Calculate scale to fit screen
        const scaleX = vw / this._baseWidth;
        const scaleY = vh / this._baseHeight;
        this._scale = Math.min(scaleX, scaleY);

        // Set canvas display size (CSS)
        const displayWidth = Math.floor(this._baseWidth * this._scale);
        const displayHeight = Math.floor(this._baseHeight * this._scale);

        this._canvas.style.width = displayWidth + 'px';
        this._canvas.style.height = displayHeight + 'px';

        // Keep internal resolution for crisp rendering
        // (The canvas element's width/height attributes stay the same)

        // Update CONFIG if needed for game logic
        // Note: We don't change CONFIG.canvas as game logic uses fixed coordinates
    },

    // Get current scale factor for input handling
    getScale() {
        return this._scale;
    },

    // Convert screen coordinates to canvas coordinates
    screenToCanvas(screenX, screenY) {
        const rect = this._canvas.getBoundingClientRect();
        return {
            x: (screenX - rect.left) / this._scale,
            y: (screenY - rect.top) / this._scale
        };
    }
};
