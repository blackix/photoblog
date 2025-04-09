/**
 * Script specifico per aggiungere pulsanti VR alla visualizzazione pubblica dell'album
 */

document.addEventListener('DOMContentLoaded', function() {
    console.log('VR Public Album script loaded');
    
    // Funzione per aggiungere pulsanti VR a tutti i photo-frame
    function addVRButtonsToPublicAlbum() {
        // Trova tutti i photo-frame nella pagina
        const photoFrames = document.querySelectorAll('.photo-frame');
        console.log('Photo frames found:', photoFrames.length);
        
        photoFrames.forEach((frame, index) => {
            const thumbnail = frame.querySelector('.photo-thumbnail');
            if (thumbnail && !frame.querySelector('.vr-view-button')) {
                console.log(`Adding VR button to photo ${index}`);
                
                // Crea il pulsante VR
                const vrButton = document.createElement('button');
                vrButton.className = 'vr-view-button';
                vrButton.innerHTML = '<i class="fas fa-vr-cardboard"></i>';
                vrButton.title = 'Visualizza in modalità VR';
                
                // Aggiungi event listener
                vrButton.addEventListener('click', function(e) {
                    e.stopPropagation();
                    console.log('VR button clicked for:', thumbnail.src);
                    
                    // Usa vrPhotoViewer se disponibile, altrimenti crea una visualizzazione immersiva semplice
                    if (window.vrPhotoViewer) {
                        window.vrPhotoViewer.openPhotoInVR(thumbnail.src);
                    } else {
                        // Fallback: crea una visualizzazione immersiva semplice
                        showSimpleImmersiveView(thumbnail.src);
                    }
                });
                
                // Aggiungi il pulsante al frame
                frame.appendChild(vrButton);
            }
        });
        
        // Aggiungi anche alle slide dello slideshow
        const slideshowSlides = document.querySelectorAll('.slideshow-slide');
        slideshowSlides.forEach(slide => {
            const img = slide.querySelector('img');
            if (img && !slide.querySelector('.vr-view-button')) {
                // Crea il pulsante VR
                const vrButton = document.createElement('button');
                vrButton.className = 'vr-view-button';
                vrButton.innerHTML = '<i class="fas fa-vr-cardboard"></i>';
                vrButton.title = 'Visualizza in modalità VR';
                
                // Aggiungi event listener
                vrButton.addEventListener('click', function(e) {
                    e.stopPropagation();
                    if (window.vrPhotoViewer) {
                        window.vrPhotoViewer.openPhotoInVR(img.src);
                    } else {
                        showSimpleImmersiveView(img.src);
                    }
                });
                
                // Aggiungi il pulsante alla slide
                slide.appendChild(vrButton);
            }
        });
    }
    
    // Funzione per mostrare una visualizzazione immersiva semplice (fallback)
    function showSimpleImmersiveView(imageUrl) {
        console.log('Showing simple immersive view for:', imageUrl);
        
        // Crea il container se non esiste
        let immersiveView = document.getElementById('simple-immersive-view');
        if (!immersiveView) {
            immersiveView = document.createElement('div');
            immersiveView.id = 'simple-immersive-view';
            immersiveView.style.position = 'fixed';
            immersiveView.style.top = '0';
            immersiveView.style.left = '0';
            immersiveView.style.width = '100%';
            immersiveView.style.height = '100%';
            immersiveView.style.backgroundColor = '#000';
            immersiveView.style.zIndex = '10000';
            immersiveView.style.display = 'flex';
            immersiveView.style.alignItems = 'center';
            immersiveView.style.justifyContent = 'center';
            
            // Crea l'immagine
            const img = document.createElement('img');
            img.style.maxWidth = '90%';
            img.style.maxHeight = '90%';
            img.style.objectFit = 'contain';
            
            // Crea il pulsante di chiusura
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
                immersiveView.style.display = 'none';
            };
            
            immersiveView.appendChild(img);
            immersiveView.appendChild(closeButton);
            document.body.appendChild(immersiveView);
        }
        
        // Aggiorna l'immagine e mostra la vista immersiva
        const img = immersiveView.querySelector('img');
        img.src = imageUrl;
        immersiveView.style.display = 'flex';
    }
    
    // Esegui subito e poi ogni secondo per assicurarsi che i pulsanti vengano aggiunti
    // anche dopo il caricamento dinamico delle foto
    addVRButtonsToPublicAlbum();
    setInterval(addVRButtonsToPublicAlbum, 1000);
    
    // Aggiungi pulsanti VR quando lo slideshow viene aperto
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.attributeName === 'style') {
                const slideshow = document.getElementById('photoDetailModal');
                if (slideshow && slideshow.style.display !== 'none') {
                    setTimeout(addVRButtonsToPublicAlbum, 200);
                }
            }
        });
    });
    
    const slideshow = document.getElementById('photoDetailModal');
    if (slideshow) {
        observer.observe(slideshow, { attributes: true });
    }
});
