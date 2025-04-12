/**
 * Blog View Compact - JavaScript per la visualizzazione compatta del blog
 */
$(document).ready(function() {
    // Variabili globali
    let currentPhotoId = 0;
    let currentPhotoIndex = -1;
    const isAuthenticated = $('[data-is-authenticated]').data('is-authenticated') === 'true';
    const photosData = JSON.parse(document.getElementById('photos-data-json').textContent);
    
    // Elementi DOM
    const $modal = $('#photoModal');
    const $modalImage = $('#modalImage');
    const $modalCaption = $('#modalCaption');
    const $modalDescription = $('#modalDescription');
    const $modalCamera = $('#modalCamera');
    const $modalSettings = $('#modalSettings');
    const $modalDate = $('#modalDate');
    const $navPrev = $('.nav-prev');
    const $navNext = $('.nav-next');
    const $closeModal = $('.close-modal');
    const $photoThumbnails = $('.photo-thumbnail');
    const $vrButtons = $('.vr-view-button');
    
    // Inizializzazione
    $photoThumbnails.on('click', function() {
        const photoId = $(this).data('photo-id');
        openPhotoModal(photoId);
    });
    
    $closeModal.on('click', function() {
        closeModal();
    });
    
    $vrButtons.on('click', function(e) {
        e.stopPropagation();
        const photoUrl = $(this).data('photo-url');
        openFullscreenView(photoUrl);
    });
    
    // Navigazione
    $navPrev.on('click', function() {
        if (currentPhotoIndex > 0) {
            openPhotoModal(photosData[currentPhotoIndex - 1].id);
        }
        return false;
    });
    
    $navNext.on('click', function() {
        if (currentPhotoIndex < photosData.length - 1) {
            openPhotoModal(photosData[currentPhotoIndex + 1].id);
        }
        return false;
    });
    
    // Navigazione con tastiera
    $(document).keydown(function(e) {
        if ($modal.is(':visible')) {
            if (e.key === 'ArrowLeft') {
                $navPrev.click();
            } else if (e.key === 'ArrowRight') {
                $navNext.click();
            } else if (e.key === 'Escape') {
                closeModal();
            }
        }
    });
    
    // Chiusura del modal cliccando sullo sfondo
    $modal.on('click', function(e) {
        if (e.target === this) {
            closeModal();
        }
    });
    
    // Funzione per aprire il modal della foto
    function openPhotoModal(photoId) {
        console.log('Opening modal for photo ID:', photoId);
        currentPhotoId = photoId;
        
        const photo = photosData.find(p => p.id === photoId);
        if (!photo) {
            console.error('Photo not found:', photoId);
            return;
        }
        
        // Trova l'indice per la navigazione
        currentPhotoIndex = photosData.findIndex(p => p.id === photoId);
        console.log('Photo index:', currentPhotoIndex);
        
        // Aggiorna il contenuto del modal
        $modalImage.attr('src', photo.image_url);
        $modalCaption.text(photo.caption || 'Senza titolo');
        $modalDescription.text(photo.description || '');
        
        // Aggiorna i metadati
        $modalCamera.text(photo.camera_model ? `Camera: ${photo.camera_model}` : '');
        
        const settings = [];
        if (photo.focal_length) settings.push(photo.focal_length);
        if (photo.f_number) settings.push(`f/${photo.f_number}`);
        if (photo.exposure) settings.push(`${photo.exposure}s`);
        if (photo.iso) settings.push(`ISO ${photo.iso}`);
        $modalSettings.text(settings.length ? settings.join(' | ') : '');
        
        $modalDate.text(photo.date_taken ? `Scattata: ${photo.date_taken}` : '');
        
        // Carica commenti e statistiche usando le funzioni del file photo-interactions.js
        if (window.loadComments) {
            window.loadComments(photoId);
        }
        
        if (window.loadPhotoStats) {
            window.loadPhotoStats(photoId);
        }
        
        // Mostra/nascondi i pulsanti di navigazione
        $navPrev.toggle(currentPhotoIndex > 0);
        $navNext.toggle(currentPhotoIndex < photosData.length - 1);
        
        // Mostra il modal
        $modal.css({
            'display': 'block',
            'position': 'fixed',
            'top': '0',
            'left': '0',
            'width': '100%',
            'height': '100%',
            'z-index': '9999'
        });
    }
    
    // Funzione per chiudere il modal
    function closeModal() {
        $modal.css('display', 'none');
    }
    
    // Funzione per aprire la vista a schermo intero
    function openFullscreenView(photoUrl) {
        let fullscreenView = document.getElementById('fullscreenView');
        
        if (!fullscreenView) {
            fullscreenView = document.createElement('div');
            fullscreenView.id = 'fullscreenView';
            fullscreenView.style.position = 'fixed';
            fullscreenView.style.top = '0';
            fullscreenView.style.left = '0';
            fullscreenView.style.width = '100%';
            fullscreenView.style.height = '100%';
            fullscreenView.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
            fullscreenView.style.display = 'none';
            fullscreenView.style.zIndex = '10000';
            fullscreenView.style.alignItems = 'center';
            fullscreenView.style.justifyContent = 'center';
            
            const img = document.createElement('img');
            img.style.maxWidth = '90%';
            img.style.maxHeight = '90%';
            img.style.objectFit = 'contain';
            
            const closeButton = document.createElement('button');
            closeButton.style.position = 'absolute';
            closeButton.style.top = '20px';
            closeButton.style.right = '20px';
            closeButton.style.width = '50px';
            closeButton.style.height = '50px';
            closeButton.style.borderRadius = '50%';
            closeButton.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
            closeButton.style.color = 'white';
            closeButton.style.border = 'none';
            closeButton.style.fontSize = '24px';
            closeButton.innerHTML = '<i class="fas fa-times"></i>';
            closeButton.onclick = function() {
                fullscreenView.style.display = 'none';
            };
            
            fullscreenView.appendChild(img);
            fullscreenView.appendChild(closeButton);
            document.body.appendChild(fullscreenView);
        }
        
        // Aggiorna l'immagine e mostra la vista a schermo intero
        const img = fullscreenView.querySelector('img');
        img.src = photoUrl;
        fullscreenView.style.display = 'flex';
    }
    
    // Inizializzazione del selettore di colore
    $('.color-option').click(function() {
        const selectedColor = $(this).data('color');
        document.documentElement.style.setProperty('--photo-grid-bg', selectedColor);
        
        // Salva la preferenza in localStorage
        localStorage.setItem('photoGridBgColor', selectedColor);
        
        // Aggiorna lo stato attivo
        $('.color-option').removeClass('active');
        $(this).addClass('active');
    });
    
    // Carica la preferenza di colore salvata se esiste
    const savedColor = localStorage.getItem('photoGridBgColor');
    if (savedColor) {
        document.documentElement.style.setProperty('--photo-grid-bg', savedColor);
        $(`.color-option[data-color="${savedColor}"]`).addClass('active');
    } else {
        // Default: bianco
        $('.color-option[data-color="#ffffff"]').addClass('active');
    }
});
