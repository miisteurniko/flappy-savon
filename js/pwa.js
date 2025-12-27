// ========================================
// Flappy Savon - PWA Logic
// ========================================

const PWA = {
    deferredPrompt: null,

    init() {
        const installBtn = document.getElementById('installBtn');
        const iosInstallModal = document.getElementById('iosInstallModal');
        const iosCloseBtn = document.getElementById('iosClose');

        if (!installBtn) return;

        // 1. Detect if iOS (requires specific instructions)
        const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent) && !window.MSStream;
        // Check if potentially installable (not already standalone)
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;

        if (isStandalone) {
            // Already installed, hide button
            installBtn.style.display = 'none';
            return;
        }

        // 2. Android / Desktop (beforeinstallprompt)
        window.addEventListener('beforeinstallprompt', (e) => {
            // Prevent Chrome 67 and earlier from automatically showing the prompt
            e.preventDefault();
            // Stash the event so it can be triggered later.
            this.deferredPrompt = e;
            // Update UI to notify the user they can add to home screen
            installBtn.style.display = 'flex';
        });

        // 3. Handle Install Click
        installBtn.addEventListener('click', () => {
            // Close menu drawer first
            const drawer = document.getElementById('menuDrawer');
            const overlay = document.getElementById('menuOverlay');
            if (drawer) drawer.classList.remove('open');
            if (overlay) overlay.classList.remove('open');

            if (isIOS) {
                // Show iOS instructions
                if (iosInstallModal) {
                    iosInstallModal.classList.add('open');
                    iosInstallModal.setAttribute('aria-hidden', 'false');
                }
            } else if (this.deferredPrompt) {
                // Show the prompt
                this.deferredPrompt.prompt();
                // Wait for the user to respond to the prompt
                this.deferredPrompt.userChoice.then((choiceResult) => {
                    if (choiceResult.outcome === 'accepted') {
                        console.log('User accepted the A2HS prompt');
                    } else {
                        console.log('User dismissed the A2HS prompt');
                    }
                    this.deferredPrompt = null;
                });
            } else {
                // Fallback for when PWA criteria aren't met but button is forced
                alert("Pour installer : appuyez sur 'Partager' puis 'Sur l'écran d'accueil' (ou menu du navigateur).");
            }
        });

        // Close iOS modal
        if (iosCloseBtn && iosInstallModal) {
            iosCloseBtn.addEventListener('click', () => {
                iosInstallModal.classList.remove('open');
                iosInstallModal.setAttribute('aria-hidden', 'true');
            });
        }

        // Force show button on iOS (as it doesn't fire beforeinstallprompt)
        if (isIOS) {
            installBtn.style.display = 'flex';
        }
    }
};

// Auto-init
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => PWA.init());
} else {
    PWA.init();
}
