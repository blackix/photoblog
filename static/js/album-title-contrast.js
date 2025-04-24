/**
 * Script per gestire automaticamente il contrasto tra il titolo dell'album e lo sfondo
 */

document.addEventListener('DOMContentLoaded', function() {
    // Funzione per rilevare se un colore è scuro o chiaro
    function isColorDark(color) {
        // Converti il colore in RGB
        let r, g, b;
        
        if (color.startsWith('rgb')) {
            // Formato rgb(r, g, b) o rgba(r, g, b, a)
            const rgbValues = color.match(/\d+/g);
            r = parseInt(rgbValues[0]);
            g = parseInt(rgbValues[1]);
            b = parseInt(rgbValues[2]);
        } else if (color.startsWith('#')) {
            // Formato esadecimale #rrggbb
            const hex = color.substring(1);
            r = parseInt(hex.substr(0, 2), 16);
            g = parseInt(hex.substr(2, 2), 16);
            b = parseInt(hex.substr(4, 2), 16);
        } else {
            // Colore non riconosciuto, assumiamo chiaro
            return false;
        }
        
        // Calcola la luminosità (formula standard per la percezione umana)
        // https://www.w3.org/TR/WCAG20-TECHS/G17.html
        const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
        
        // Se la luminosità è inferiore a 0.5, il colore è considerato scuro
        return luminance < 0.5;
    }
    
    // Funzione per impostare le classi in base al colore di sfondo
    function setBackgroundClasses() {
        document.querySelectorAll('.photo-grid').forEach(function(grid) {
            // Ottieni il colore di sfondo computato
            const backgroundColor = window.getComputedStyle(grid).backgroundColor;
            
            // Trova l'header dell'album all'interno della griglia
            const albumHeader = grid.querySelector('.album-header');
            if (albumHeader) {
                // Rimuovi le classi esistenti
                albumHeader.classList.remove('dark-background', 'light-background');
                
                // Aggiungi la classe appropriata in base al colore di sfondo
                if (isColorDark(backgroundColor)) {
                    albumHeader.classList.add('dark-background');
                } else {
                    albumHeader.classList.add('light-background');
                }
            }
        });
    }
    
    // Imposta le classi iniziali
    setBackgroundClasses();
    
    // Osserva i cambiamenti di tema
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.attributeName === 'data-theme') {
                setBackgroundClasses();
            }
        });
    });
    
    // Osserva il documento per i cambiamenti dell'attributo data-theme
    observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-theme']
    });
    
    // Aggiungi un listener per quando viene cambiato il colore di sfondo della griglia
    document.addEventListener('colorChanged', function() {
        setBackgroundClasses();
    });
});
