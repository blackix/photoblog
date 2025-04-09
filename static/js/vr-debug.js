/**
 * Script di debug per la funzionalità VR
 */
console.log('VR Debug script loaded');

// Funzione di debug che viene eseguita dopo il caricamento della pagina
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM fully loaded - Starting VR debug');
    
    // Verifica se vrPhotoViewer è disponibile
    console.log('vrPhotoViewer available:', !!window.vrPhotoViewer);
    
    // Verifica se siamo nella pagina pubblica dell'album
    const photoGrid = document.querySelector('.photo-grid');
    const dropzone = document.querySelector('.dropzone');
    const deleteAlbum = document.querySelector('.delete-album');
    
    console.log('Elements found:');
    console.log('- .photo-grid:', !!photoGrid);
    console.log('- .dropzone:', !!dropzone);
    console.log('- .delete-album:', !!deleteAlbum);
    
    const isPublicAlbumPage = photoGrid && !dropzone && !deleteAlbum;
    console.log('Is public album page:', isPublicAlbumPage);
    
    // Conta i photo-frame nella pagina
    const photoFrames = document.querySelectorAll('.photo-frame');
    console.log('Photo frames found:', photoFrames.length);
    
    // Verifica ogni photo-frame
    photoFrames.forEach((frame, index) => {
        const thumbnail = frame.querySelector('.photo-thumbnail');
        console.log(`Photo frame ${index}:`, {
            'has thumbnail': !!thumbnail,
            'thumbnail src': thumbnail ? thumbnail.src : 'N/A',
            'position': frame.style.position
        });
    });
    
    // Forza l'aggiunta dei pulsanti VR
    setTimeout(function() {
        console.log('Forcing VR buttons addition');
        
        // Aggiungi pulsanti VR a tutti i photo-frame
        photoFrames.forEach(frame => {
            const thumbnail = frame.querySelector('.photo-thumbnail');
            if (thumbnail) {
                // Assicurati che il frame abbia position: relative
                if (!frame.style.position) {
                    frame.style.position = 'relative';
                }
                
                // Crea manualmente il pulsante VR
                if (!frame.querySelector('.vr-view-button')) {
                    const vrButton = document.createElement('button');
                    vrButton.className = 'vr-view-button';
                    vrButton.innerHTML = '<i class="fas fa-vr-cardboard"></i>';
                    vrButton.title = 'Visualizza in modalità VR';
                    
                    // Aggiungi event listener
                    vrButton.addEventListener('click', (e) => {
                        e.stopPropagation();
                        console.log('VR button clicked for:', thumbnail.src);
                        if (window.vrPhotoViewer) {
                            window.vrPhotoViewer.openPhotoInVR(thumbnail.src);
                        } else {
                            console.error('vrPhotoViewer not available');
                        }
                    });
                    
                    // Aggiungi il pulsante al frame
                    frame.appendChild(vrButton);
                    console.log('VR button added to frame', index);
                }
            }
        });
    }, 1000);
});
