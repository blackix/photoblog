/**
 * JavaScript per implementare il layout masonry utilizzando la libreria Masonry.js
 */

// Carica le librerie necessarie
document.addEventListener('DOMContentLoaded', function() {
    // Carica Masonry.js se non è già presente
    if (!window.Masonry) {
        var masonryScript = document.createElement('script');
        masonryScript.src = 'https://unpkg.com/masonry-layout@4.2.2/dist/masonry.pkgd.min.js';
        document.head.appendChild(masonryScript);
        
        masonryScript.onload = function() {
            // Carica imagesLoaded dopo che Masonry è stato caricato
            var imagesLoadedScript = document.createElement('script');
            imagesLoadedScript.src = 'https://unpkg.com/imagesloaded@5/imagesloaded.pkgd.min.js';
            document.head.appendChild(imagesLoadedScript);
            
            imagesLoadedScript.onload = function() {
                // Inizializza il layout masonry dopo che entrambe le librerie sono state caricate
                initMasonry();
            };
        };
    } else {
        // Se Masonry è già caricato, inizializza direttamente
        initMasonry();
    }
    
    // Gestione del problema di scrolling con il modale
    fixModalScrollingIssue();
});

// Funzione per inizializzare il layout masonry
function initMasonry() {
    var grids = document.querySelectorAll('.masonry-grid');
    
    grids.forEach(function(grid) {
        // Inizializza Masonry con opzioni base
        var masonry = new Masonry(grid, {
            itemSelector: '.masonry-item',
            gutter: 20,
            fitWidth: true,
            stamp: '.album-header'
        });
        
        // Usa imagesLoaded per ricalcolare il layout dopo il caricamento delle immagini
        imagesLoaded(grid).on('progress', function() {
            masonry.layout();
        });
    });
    
    // Assicurati che il layout venga aggiornato quando la finestra viene ridimensionata
    window.addEventListener('resize', function() {
        grids.forEach(function(grid) {
            var msnry = Masonry.data(grid);
            if (msnry) msnry.layout();
        });
    });
}

// Funzione per risolvere il problema di scrolling con il modale
function fixModalScrollingIssue() {
    // Trova il modale e i suoi controlli
    var modal = document.getElementById('photoModal');
    if (!modal) return;
    
    var closeButtons = modal.querySelectorAll('.close-modal, .nav-prev, .nav-next');
    var originalStyles = {};
    
    // Funzione per ripristinare lo scrolling dopo la chiusura del modale
    function restoreScrolling() {
        document.body.style.overflow = originalStyles.overflow || '';
        document.body.style.position = originalStyles.position || '';
        document.body.style.width = originalStyles.width || '';
        document.body.style.height = originalStyles.height || '';
        document.body.style.top = originalStyles.top || '';
        
        // Forza un reflow per assicurarsi che lo scrolling funzioni
        document.body.scrollTop = document.body.scrollTop;
    }
    
    // Aggiungi listener per il click sui pulsanti di chiusura
    closeButtons.forEach(function(button) {
        button.addEventListener('click', function() {
            restoreScrolling();
        });
    });
    
    // Aggiungi listener per il click sullo sfondo del modale
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            restoreScrolling();
        }
    });
    
    // Salva gli stili originali prima di aprire il modale
    document.addEventListener('click', function(e) {
        if (e.target.closest('.photo-thumbnail')) {
            originalStyles = {
                overflow: document.body.style.overflow,
                position: document.body.style.position,
                width: document.body.style.width,
                height: document.body.style.height,
                top: document.body.style.top
            };
        }
    });
}
