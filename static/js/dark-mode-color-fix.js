/**
 * Script per risolvere il problema del selettore dei colori in dark mode
 */
document.addEventListener('DOMContentLoaded', function() {
    // Funzione per applicare il colore direttamente alla griglia
    function applyGridColor(color) {
        // Seleziona tutte le griglie masonry
        const grids = document.querySelectorAll('.masonry-grid');
        
        // Applica il colore direttamente a ogni griglia
        grids.forEach(function(grid) {
            grid.style.backgroundColor = color;
        });
        
        // Salva anche nella variabile CSS per compatibilità
        document.documentElement.style.setProperty('--photo-grid-bg', color);
        
        console.log('Colore applicato direttamente:', color);
    }
    
    // Sovrascrive il comportamento del click sul selettore dei colori
    const colorOptions = document.querySelectorAll('.color-option');
    colorOptions.forEach(function(option) {
        option.addEventListener('click', function(e) {
            // Previene la propagazione dell'evento per evitare conflitti
            e.stopPropagation();
            
            // Ottiene il colore dal data attribute
            const selectedColor = this.getAttribute('data-color');
            
            // Applica il colore direttamente
            applyGridColor(selectedColor);
            
            // Aggiorna lo stato attivo visivamente
            colorOptions.forEach(function(opt) {
                opt.classList.remove('active');
            });
            this.classList.add('active');
            
            // Salva la preferenza in localStorage
            localStorage.setItem('photoGridBgColor', selectedColor);
            
            console.log('Colore selezionato (nuovo handler):', selectedColor);
        }, true); // Usa la fase di capturing per assicurarsi che questo handler venga eseguito prima
    });
    
    // Carica e applica il colore salvato all'avvio
    const savedColor = localStorage.getItem('photoGridBgColor');
    if (savedColor) {
        // Applica il colore salvato
        applyGridColor(savedColor);
        
        // Trova e attiva il pulsante corrispondente
        const colorBtn = document.querySelector(`.color-option[data-color="${savedColor}"]`);
        if (colorBtn) {
            colorOptions.forEach(function(opt) {
                opt.classList.remove('active');
            });
            colorBtn.classList.add('active');
        }
    } else {
        // Default in base al tema corrente
        const isDarkMode = document.body.getAttribute('data-theme') === 'dark';
        const defaultColor = isDarkMode ? '#1e1e1e' : '#ffffff';
        
        // Applica il colore predefinito
        applyGridColor(defaultColor);
        
        // Attiva il pulsante corrispondente
        const defaultBtn = document.querySelector(`.color-option[data-color="${defaultColor}"]`);
        if (defaultBtn) {
            colorOptions.forEach(function(opt) {
                opt.classList.remove('active');
            });
            defaultBtn.classList.add('active');
        }
    }
    
    // Riapplica il colore quando cambia il tema
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.attributeName === 'data-theme') {
                // Riapplica il colore salvato o il default
                const savedColor = localStorage.getItem('photoGridBgColor');
                if (savedColor) {
                    applyGridColor(savedColor);
                } else {
                    const isDarkMode = document.body.getAttribute('data-theme') === 'dark';
                    const defaultColor = isDarkMode ? '#1e1e1e' : '#ffffff';
                    applyGridColor(defaultColor);
                }
            }
        });
    });
    
    // Osserva i cambiamenti all'attributo data-theme del body
    observer.observe(document.body, { attributes: true });
});
