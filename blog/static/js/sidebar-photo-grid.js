/**
 * Script per gestire la transizione delle foto nella griglia della barra laterale
 */
document.addEventListener('DOMContentLoaded', function() {
    // Array per memorizzare tutte le foto disponibili
    let allPhotos = [];
    
    // Funzione per caricare le foto casuali tramite AJAX
    function loadRandomPhotos() {
        // Controlla se ci sono foto salvate in sessionStorage
        const savedPhotos = sessionStorage.getItem('sidebarGridPhotos');
        const savedCurrentPhotos = sessionStorage.getItem('sidebarCurrentPhotos');
        
        if (savedPhotos) {
            // Usa le foto salvate
            allPhotos = JSON.parse(savedPhotos);
            console.log('Ripristinate foto salvate dalla sessionStorage');
            
            if (savedCurrentPhotos) {
                // Ripristina le foto correnti senza aggiornare la griglia
                const currentPhotos = JSON.parse(savedCurrentPhotos);
                displaySavedPhotos(currentPhotos);
                // Avvia il timer per la transizione
                startPhotoTransition();
                return;
            }
            
            // Inizializza la griglia con le prime 4 foto
            updatePhotoGrid();
            // Avvia il timer per la transizione
            startPhotoTransition();
        } else {
            // Carica nuove foto dal server
            fetch('/api/random-photos/?limit=20')
                .then(response => response.json())
                .then(data => {
                    allPhotos = data.photos;
                    // Salva le foto in sessionStorage
                    sessionStorage.setItem('sidebarGridPhotos', JSON.stringify(allPhotos));
                    // Inizializza la griglia con le prime 4 foto
                    updatePhotoGrid();
                    // Avvia il timer per la transizione
                    startPhotoTransition();
                })
                .catch(error => console.error('Errore nel caricamento delle foto casuali:', error));
        }
    }
    
    // Funzione per visualizzare le foto salvate senza animazione
    function displaySavedPhotos(photos) {
        const gridItems = document.querySelectorAll('.sidebar-photo-item');
        
        gridItems.forEach((item, index) => {
            if (index < photos.length) {
                const photo = photos[index];
                const img = item.querySelector('img');
                const overlay = item.querySelector('.photo-overlay');
                
                img.src = photo.image_url;
                img.alt = photo.caption || 'Foto';
                item.dataset.photoId = photo.id;
                item.dataset.photoUrl = photo.image_url;
                item.dataset.albumId = photo.album_id;
                item.dataset.username = photo.username;
                
                if (overlay) {
                    overlay.innerHTML = `
                        <span>${photo.album_title}</span>
                        <span>${photo.username}</span>
                    `;
                }
            }
        });
    }
    
    // Funzione per aggiornare la griglia di foto
    function updatePhotoGrid() {
        const gridItems = document.querySelectorAll('.sidebar-photo-item');
        
        // Se non ci sono abbastanza foto, non fare nulla
        if (allPhotos.length < 4) return;
        
        // Seleziona 4 foto casuali dall'array
        const randomPhotos = [];
        const usedIndexes = new Set();
        
        while (randomPhotos.length < 4 && usedIndexes.size < allPhotos.length) {
            const randomIndex = Math.floor(Math.random() * allPhotos.length);
            if (!usedIndexes.has(randomIndex)) {
                usedIndexes.add(randomIndex);
                randomPhotos.push(allPhotos[randomIndex]);
            }
        }
        
        // Salva le foto correnti in sessionStorage
        sessionStorage.setItem('sidebarCurrentPhotos', JSON.stringify(randomPhotos));
        
        // Aggiorna le immagini nella griglia
        gridItems.forEach((item, index) => {
            if (index < randomPhotos.length) {
                const photo = randomPhotos[index];
                const img = item.querySelector('img');
                const overlay = item.querySelector('.photo-overlay');
                
                // Aggiungi classe per l'animazione di fade out
                img.classList.add('fade-out');
                
                // Dopo un ritardo più lungo per un crossfade lento, aggiorna l'immagine e fai il fade in
                setTimeout(() => {
                    img.src = photo.image_url;
                    img.alt = photo.caption || 'Foto';
                    item.dataset.photoId = photo.id;
                    item.dataset.photoUrl = photo.image_url;
                    item.dataset.albumId = photo.album_id;
                    item.dataset.username = photo.username;
                    
                    if (overlay) {
                        overlay.innerHTML = `
                            <span>${photo.album_title}</span>
                            <span>${photo.username}</span>
                        `;
                    }
                    
                    // Rimuovi la classe fade-out e aggiungi fade-in
                    img.classList.remove('fade-out');
                    img.classList.add('fade-in');
                    
                    // Dopo l'animazione, rimuovi la classe fade-in
                    setTimeout(() => {
                        img.classList.remove('fade-in');
                    }, 1500); // Durata più lunga per il fade-in
                }, 1500); // Durata più lunga per il fade-out
            }
        });
    }
    
    // Variabile per memorizzare l'ID del timer
    let transitionTimer = null;
    
    // Funzione per avviare la transizione periodica delle foto
    function startPhotoTransition() {
        // Cambia le foto ogni 20 secondi
        transitionTimer = setInterval(updatePhotoGrid, 20000);
    }
    
    // Gestione del click sulle foto della griglia
    document.addEventListener('click', function(e) {
        const item = e.target.closest('.sidebar-photo-item');
        if (item) {
            const photoId = item.dataset.photoId;
            const username = item.dataset.username;
            
            if (photoId && username) {
                // Salva lo stato del timer in sessionStorage prima di navigare
                sessionStorage.setItem('lastPhotoGridUpdate', Date.now());
                
                // Salva l'ID della foto da aprire automaticamente
                sessionStorage.setItem('openPhotoId', photoId);
                
                // Reindirizza alla pagina del blog con visualizzazione compatta
                window.location.href = `/blog/${username}/`;
            }
        }
    });
    
    // Funzione per controllare se dobbiamo ripristinare il timer
    function initPhotoGrid() {
        const lastUpdate = sessionStorage.getItem('lastPhotoGridUpdate');
        
        if (lastUpdate) {
            const now = Date.now();
            const elapsed = now - parseInt(lastUpdate);
            const interval = 20000; // 20 secondi
            
            // Se è passato meno tempo dell'intervallo, calcola il tempo rimanente
            if (elapsed < interval) {
                const remaining = interval - elapsed;
                
                // Carica le foto immediatamente
                loadRandomPhotos();
                
                // Avvia un timer una tantum per la prossima transizione
                setTimeout(() => {
                    // Aggiorna le foto
                    updatePhotoGrid();
                    // Poi avvia il timer regolare
                    startPhotoTransition();
                }, remaining);
                
                console.log(`Ripristino timer: prossima transizione tra ${Math.round(remaining/1000)} secondi`);
                return;
            }
        }
        
        // Se non c'è stato un aggiornamento recente, inizia normalmente
        loadRandomPhotos();
    }
    
    // Inizializza la griglia di foto
    initPhotoGrid();
});
