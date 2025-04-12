/**
 * Script per gestire la transizione delle foto nella griglia della barra laterale
 */
document.addEventListener('DOMContentLoaded', function() {
    // Array per memorizzare tutte le foto disponibili
    let allPhotos = [];
    
    // Funzione per caricare le foto casuali tramite AJAX
    function loadRandomPhotos() {
        console.log('Inizializzazione caricamento foto casuali');
        
        // Controlla se ci sono foto salvate in sessionStorage
        const savedPhotos = sessionStorage.getItem('sidebarGridPhotos');
        const savedCurrentPhotos = sessionStorage.getItem('sidebarCurrentPhotos');
        
        if (savedPhotos) {
            // Usa le foto salvate
            try {
                allPhotos = JSON.parse(savedPhotos);
                console.log('Ripristinate foto salvate dalla sessionStorage:', allPhotos.length, 'foto trovate');
                
                if (savedCurrentPhotos) {
                    // Ripristina le foto correnti senza aggiornare la griglia
                    try {
                        const currentPhotos = JSON.parse(savedCurrentPhotos);
                        console.log('Ripristinate foto correnti dalla sessionStorage:', currentPhotos.length, 'foto');
                        displaySavedPhotos(currentPhotos);
                        // Avvia il timer per la transizione
                        startPhotoTransition();
                        return;
                    } catch (e) {
                        console.error('Errore nel parsing delle foto correnti:', e);
                    }
                }
                
                // Inizializza la griglia con le prime 4 foto
                updatePhotoGrid();
                // Avvia il timer per la transizione
                startPhotoTransition();
            } catch (e) {
                console.error('Errore nel parsing delle foto salvate:', e);
                // Se c'è un errore, carica nuove foto
                fetchNewPhotos();
            }
        } else {
            console.log('Nessuna foto salvata in sessionStorage, caricamento dal server...');
            fetchNewPhotos();
        }
    }
    
    // Funzione per caricare nuove foto dal server
    function fetchNewPhotos() {
        console.log('Chiamata API per foto casuali...');
        // URL completo per debug
        const apiUrl = window.location.origin + '/api/random-photos/?limit=20';
        console.log('URL API:', apiUrl);
        
        fetch(apiUrl)
            .then(response => {
                console.log('Risposta API ricevuta, status:', response.status);
                if (!response.ok) {
                    throw new Error('Risposta API non valida: ' + response.status);
                }
                return response.json();
            })
            .then(data => {
                console.log('Dati API ricevuti:', data);
                if (data.photos && Array.isArray(data.photos)) {
                    allPhotos = data.photos;
                    console.log('Foto caricate con successo:', allPhotos.length, 'foto');
                    // Salva le foto in sessionStorage
                    sessionStorage.setItem('sidebarGridPhotos', JSON.stringify(allPhotos));
                    // Inizializza la griglia con le prime 4 foto
                    updatePhotoGrid();
                    // Avvia il timer per la transizione
                    startPhotoTransition();
                } else {
                    console.error('Formato dati API non valido:', data);
                }
            })
            .catch(error => {
                console.error('Errore nel caricamento delle foto casuali:', error);
                // In caso di errore, mostra un messaggio nella console
                document.querySelectorAll('.sidebar-photo-item').forEach(item => {
                    console.log('Impostazione placeholder per errore API');
                });
            });
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
        console.log('Aggiornamento griglia foto...');
        const gridItems = document.querySelectorAll('.sidebar-photo-item');
        console.log('Elementi griglia trovati:', gridItems.length);
        
        // Se non ci sono abbastanza foto, mostra un messaggio di debug
        if (!allPhotos || allPhotos.length < 4) {
            console.warn('Non ci sono abbastanza foto disponibili:', allPhotos ? allPhotos.length : 0);
            // Continua comunque con le foto disponibili
            if (!allPhotos || allPhotos.length === 0) {
                console.error('Nessuna foto disponibile per la griglia');
                return;
            }
        }
        
        console.log('Foto disponibili:', allPhotos.length);
        
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
        
        console.log('Foto selezionate per la griglia:', randomPhotos.length);
        
        // Salva le foto correnti in sessionStorage
        try {
            sessionStorage.setItem('sidebarCurrentPhotos', JSON.stringify(randomPhotos));
            console.log('Foto correnti salvate in sessionStorage');
        } catch (e) {
            console.error('Errore nel salvataggio delle foto correnti:', e);
        }
        
        // Aggiorna le immagini nella griglia
        gridItems.forEach((item, index) => {
            if (index < randomPhotos.length) {
                try {
                    const photo = randomPhotos[index];
                    console.log(`Aggiornamento elemento ${index+1}:`, photo.id, photo.image_url);
                    
                    const img = item.querySelector('img');
                    const overlay = item.querySelector('.photo-overlay');
                    
                    if (!img) {
                        console.error(`Elemento img non trovato per l'item ${index+1}`);
                        return;
                    }
                    
                    // Aggiungi gestione errori per il caricamento dell'immagine
                    img.onerror = function() {
                        console.error(`Errore caricamento immagine ${index+1}:`, photo.image_url);
                        this.src = '/static/img/placeholder.jpg';
                        this.alt = 'Immagine non disponibile';
                    };
                    
                    // Aggiungi classe per l'animazione di fade out
                    img.classList.add('fade-out');
                    
                    // Dopo un ritardo più lungo per un crossfade lento, aggiorna l'immagine e fai il fade in
                    setTimeout(() => {
                        img.src = photo.image_url;
                        img.alt = photo.caption || 'Foto';
                        item.dataset.photoId = photo.id;
                        item.dataset.photoUrl = `/blog/${photo.username}/`;
                        item.dataset.albumId = photo.album_id;
                        item.dataset.username = photo.username;
                        
                        if (overlay) {
                            overlay.innerHTML = `
                                <span>${photo.album_title || 'Album'}</span>
                                <span>${photo.username || 'Utente'}</span>
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
                } catch (e) {
                    console.error(`Errore nell'aggiornamento dell'elemento ${index+1}:`, e);
                }
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
