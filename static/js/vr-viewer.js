/**
 * VR Photo Viewer for Photoblog
 * Enables immersive viewing of photos in VR/AR headsets using WebXR
 */

class VRPhotoViewer {
    constructor() {
        this.currentPhoto = null;
        this.vrButton = null;
        this.vrContainer = null;
        this.xrSession = null;
        this.xrReferenceSpace = null;
        this.gl = null;
        this.initialized = false;
        
        // Array per memorizzare tutte le foto disponibili nella pagina
        this.photoUrls = [];
        this.currentPhotoIndex = -1;
    }

    /**
     * Initialize the VR viewer
     */
    async init() {
        if (this.initialized) return;
        
        // Create VR container
        this.vrContainer = document.createElement('div');
        this.vrContainer.id = 'vr-photo-container';
        this.vrContainer.className = 'vr-photo-container';
        this.vrContainer.style.display = 'none';
        document.body.appendChild(this.vrContainer);

        // Create canvas for WebXR
        const canvas = document.createElement('canvas');
        canvas.id = 'vr-canvas';
        canvas.className = 'vr-canvas';
        this.vrContainer.appendChild(canvas);

        // Create exit button
        const exitButton = document.createElement('button');
        exitButton.className = 'vr-exit-button';
        exitButton.innerHTML = '<i class="fas fa-times"></i>';
        exitButton.addEventListener('click', () => this.exitVRMode());
        this.vrContainer.appendChild(exitButton);

        // Check if WebXR is supported
        if (navigator.xr) {
            try {
                // Check if immersive-vr mode is supported
                const isSupported = await navigator.xr.isSessionSupported('immersive-vr');
                if (isSupported) {
                    this.initialized = true;
                    this.setupWebGL(canvas);
                    console.log('WebXR VR mode is supported');
                    return true;
                }
            } catch (err) {
                console.error('Error checking WebXR support:', err);
            }
        }

        // If we get here, WebXR is not supported
        console.log('WebXR VR mode is not supported on this device/browser');
        return false;
    }

    /**
     * Setup WebGL for rendering
     */
    setupWebGL(canvas) {
        try {
            this.gl = canvas.getContext('webgl', { xrCompatible: true }) || 
                     canvas.getContext('experimental-webgl', { xrCompatible: true });
            
            if (!this.gl) {
                console.error('WebGL not supported');
                return false;
            }

            // Set clear color to black
            this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
            this.gl.clear(this.gl.COLOR_BUFFER_BIT);
            
            return true;
        } catch (e) {
            console.error('Error initializing WebGL:', e);
            return false;
        }
    }

    /**
     * Add VR button to a photo element
     */
    addVRButtonToPhoto(photoElement, photoUrl) {
        // Check if button already exists
        if (photoElement.querySelector('.vr-view-button')) {
            return;
        }

        // Create VR button
        const vrButton = document.createElement('button');
        vrButton.className = 'vr-view-button';
        vrButton.innerHTML = '<i class="fas fa-vr-cardboard"></i>';
        vrButton.title = 'Visualizza in modalità VR';
        
        // Add click event
        vrButton.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent triggering other click events
            this.openPhotoInVR(photoUrl);
        });

        // Add button to photo element
        photoElement.appendChild(vrButton);
    }

    /**
     * Open a photo in VR mode
     */
    async openPhotoInVR(photoUrl) {
        if (!this.initialized) {
            await this.init();
            // Anche se l'inizializzazione fallisce, continuiamo con la modalità immersiva
        }

        this.currentPhoto = photoUrl;
        
        // Rileva se siamo in un visore Meta Quest
        const isMetaQuest = this.detectMetaQuest();
        
        // Se siamo in un Meta Quest, utilizziamo direttamente la modalità immersiva ottimizzata
        if (isMetaQuest) {
            console.log('Meta Quest rilevato, utilizzo modalità immersiva ottimizzata');
            this.showImmersiveMode(photoUrl, true);
            return;
        }
        
        // Show VR container
        this.vrContainer.style.display = 'block';
        
        // Load the photo as a texture
        this.loadPhotoTexture(photoUrl);
        
        // Prova a utilizzare WebXR se disponibile
        let webXRSuccess = false;
        if (navigator.xr) {
            try {
                // Verifica se la modalità immersiva VR è supportata
                const isSupported = await navigator.xr.isSessionSupported('immersive-vr');
                if (isSupported) {
                    try {
                        // Request a session
                        this.xrSession = await navigator.xr.requestSession('immersive-vr', {
                            requiredFeatures: ['local']
                        });
                        
                        // Set up session
                        await this.setupXRSession();
                        
                        // Start rendering loop
                        this.xrSession.requestAnimationFrame(this.drawVRScene.bind(this));
                        webXRSuccess = true;
                    } catch (sessionErr) {
                        console.error('Error starting VR session:', sessionErr);
                    }
                }
            } catch (err) {
                console.error('Error checking WebXR support:', err);
            }
        }
        
        // Se WebXR non ha funzionato, utilizziamo la modalità immersiva
        if (!webXRSuccess) {
            // Fallback to non-VR immersive mode
            this.showImmersiveMode(photoUrl);
        }
    }
    
    /**
     * Rileva se siamo in un visore Meta Quest
     */
    detectMetaQuest() {
        const userAgent = navigator.userAgent.toLowerCase();
        return userAgent.includes('oculus') || 
               userAgent.includes('quest') || 
               userAgent.includes('meta') || 
               (window.screen && window.screen.width >= 1832 && window.screen.height >= 1920) || // Risoluzione tipica dei visori Quest
               (typeof window.orientation !== 'undefined') || // Dispositivo mobile
               (navigator.maxTouchPoints && navigator.maxTouchPoints > 2); // Supporto multi-touch
    }
    
    /**
     * Setup XR session
     */
    async setupXRSession() {
        if (!this.xrSession) return;
        
        // Get the XR reference space
        this.xrReferenceSpace = await this.xrSession.requestReferenceSpace('local');
        
        // Configure WebGL for XR
        const glLayer = new XRWebGLLayer(this.xrSession, this.gl);
        this.xrSession.updateRenderState({
            baseLayer: glLayer
        });
        
        // Handle session end
        this.xrSession.addEventListener('end', () => {
            this.exitVRMode();
        });
    }
    
    /**
     * Draw scene in VR
     */
    drawVRScene(time, frame) {
        if (!this.xrSession || !frame) return;
        
        // Get session and pose
        const session = frame.session;
        const pose = frame.getViewerPose(this.xrReferenceSpace);
        
        if (pose) {
            // Get the WebGL layer
            const glLayer = session.renderState.baseLayer;
            
            // Bind the WebGL framebuffer
            this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, glLayer.framebuffer);
            
            // Clear the framebuffer
            this.gl.clearColor(0, 0, 0, 1.0);
            this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
            
            // For each view (left eye, right eye)
            for (const view of pose.views) {
                const viewport = glLayer.getViewport(view);
                this.gl.viewport(viewport.x, viewport.y, viewport.width, viewport.height);
                
                // Draw the photo texture (simplified)
                // In a real implementation, you'd use proper shaders and geometry
                // to create a curved screen effect in 3D space
            }
        }
        
        // Continue the render loop
        session.requestAnimationFrame(this.drawVRScene.bind(this));
    }
    
    /**
     * Load photo as a texture
     */
    loadPhotoTexture(photoUrl) {
        const image = new Image();
        image.crossOrigin = "anonymous";
        image.onload = () => {
            // Create texture
            const texture = this.gl.createTexture();
            this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
            
            // Set texture parameters
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
            
            // Upload the image into the texture
            this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, image);
        };
        image.src = photoUrl;
    }
    
    /**
     * Raccoglie tutte le foto disponibili nella pagina
     */
    collectPhotoUrls() {
        this.photoUrls = [];
        // Seleziona tutti i pulsanti VR nella pagina
        const vrButtons = document.querySelectorAll('.vr-view-button');
        
        // Estrai gli URL delle foto dai pulsanti
        vrButtons.forEach(button => {
            const photoUrl = button.getAttribute('data-photo-url');
            if (photoUrl) {
                this.photoUrls.push(photoUrl);
            }
        });
        
        console.log(`Raccolte ${this.photoUrls.length} foto per la navigazione`);
    }
    
    /**
     * Trova l'indice della foto corrente nell'array delle foto
     */
    findPhotoIndex(photoUrl) {
        return this.photoUrls.indexOf(photoUrl);
    }
    
    /**
     * Naviga alla foto precedente
     */
    navigateToPrevPhoto() {
        if (this.photoUrls.length === 0 || this.currentPhotoIndex === -1) return;
        
        let newIndex = this.currentPhotoIndex - 1;
        if (newIndex < 0) {
            newIndex = this.photoUrls.length - 1; // Torna all'ultima foto
        }
        
        this.showImmersiveMode(this.photoUrls[newIndex], this.detectMetaQuest());
    }
    
    /**
     * Naviga alla foto successiva
     */
    navigateToNextPhoto() {
        if (this.photoUrls.length === 0 || this.currentPhotoIndex === -1) return;
        
        let newIndex = this.currentPhotoIndex + 1;
        if (newIndex >= this.photoUrls.length) {
            newIndex = 0; // Torna alla prima foto
        }
        
        this.showImmersiveMode(this.photoUrls[newIndex], this.detectMetaQuest());
    }
    
    /**
     * Fallback to non-VR immersive mode
     * @param {string} photoUrl - URL dell'immagine da visualizzare
     * @param {boolean} isVRHeadset - Indica se siamo in un visore VR
     */
    showImmersiveMode(photoUrl, isVRHeadset = false) {
        // Prima di tutto, assicuriamoci che qualsiasi visualizzazione precedente sia completamente chiusa
        this.exitVRMode();
        
        // Se non abbiamo ancora raccolto le foto, fallo ora
        if (this.photoUrls.length === 0) {
            this.collectPhotoUrls();
        }
        
        // Trova l'indice della foto corrente
        this.currentPhotoIndex = this.findPhotoIndex(photoUrl);
        
        // Create immersive view container if it doesn't exist
        if (!document.getElementById('immersive-view')) {
            const container = document.createElement('div');
            container.id = 'immersive-view';
            container.className = 'immersive-view';
            
            const imgElement = document.createElement('img');
            imgElement.id = 'immersive-img';
            imgElement.className = 'immersive-img';
            
            const closeButton = document.createElement('button');
            closeButton.className = 'immersive-close-btn';
            closeButton.innerHTML = '<i class="fas fa-times"></i>';
            closeButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.exitVRMode();
            });
            
            // Aggiungi pulsanti di navigazione
            const prevButton = document.createElement('button');
            prevButton.className = 'immersive-nav-btn immersive-prev-btn';
            prevButton.innerHTML = '<i class="fas fa-chevron-left"></i>';
            prevButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.navigateToPrevPhoto();
            });
            
            const nextButton = document.createElement('button');
            nextButton.className = 'immersive-nav-btn immersive-next-btn';
            nextButton.innerHTML = '<i class="fas fa-chevron-right"></i>';
            nextButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.navigateToNextPhoto();
            });
            
            container.appendChild(imgElement);
            container.appendChild(closeButton);
            container.appendChild(prevButton);
            container.appendChild(nextButton);
            document.body.appendChild(container);
            
            // Aggiungi l'event listener per il tasto ESC
            this._escKeyHandler = (e) => {
                if (e.key === 'Escape') {
                    this.exitVRMode();
                } else if (e.key === 'ArrowLeft') {
                    this.navigateToPrevPhoto();
                } else if (e.key === 'ArrowRight') {
                    this.navigateToNextPhoto();
                }
            };
        }
        
        // Set the image source and show the container
        const imgElement = document.getElementById('immersive-img');
        imgElement.src = photoUrl;
        
        const immersiveView = document.getElementById('immersive-view');
        immersiveView.style.display = 'flex';
        document.body.classList.add('immersive-mode-active');
        
        // Aggiungi l'event listener per il tasto ESC
        document.addEventListener('keydown', this._escKeyHandler);
        
        // Se siamo in un visore VR, aggiungiamo una classe speciale
        if (isVRHeadset) {
            document.body.classList.add('vr-headset-mode');
            immersiveView.classList.add('vr-optimized');
            
            // Aggiungi gestione del movimento della testa (giroscopio)
            this.setupGyroscopeControls(immersiveView, imgElement);
        } else {
            document.body.classList.remove('vr-headset-mode');
            immersiveView.classList.remove('vr-optimized');
        }
    }
    
    /**
     * Configura i controlli del giroscopio per il movimento della testa nei visori
     */
    setupGyroscopeControls(container, imgElement) {
        // Verifica se il dispositivo supporta l'API DeviceOrientation
        if (window.DeviceOrientationEvent) {
            // Posizione iniziale dell'immagine
            let initialX = 0;
            let initialY = 0;
            
            // Funzione per gestire il movimento del giroscopio
            const handleOrientation = (event) => {
                // Ottieni i valori di orientamento del dispositivo
                const beta = event.beta;  // Inclinazione frontale (-180 to 180)
                const gamma = event.gamma; // Inclinazione laterale (-90 to 90)
                
                if (beta !== null && gamma !== null) {
                    // Calcola lo spostamento dell'immagine in base al movimento della testa
                    // Limitiamo lo spostamento per evitare che l'immagine si sposti troppo
                    const moveX = initialX + (gamma / 90) * 20; // Spostamento orizzontale
                    const moveY = initialY + (beta / 180) * 20;  // Spostamento verticale
                    
                    // Applica la trasformazione all'immagine senza inclinazione
                    imgElement.style.transform = `translate(${moveX}px, ${moveY}px) scale(1.2)`;
                }
            };
            
            // Salva il riferimento all'handler per poterlo rimuovere in seguito
            this._orientationHandler = handleOrientation;
            
            // Aggiungi l'event listener per l'orientamento del dispositivo
            window.addEventListener('deviceorientation', handleOrientation, true);
        }
    }
    
    /**
     * Exit VR mode
     */
    exitVRMode() {
        // Chiudi la sessione WebXR se attiva
        if (this.xrSession) {
            this.xrSession.end();
            this.xrSession = null;
        }
        
        // Nascondi il container VR
        if (this.vrContainer) {
            this.vrContainer.style.display = 'none';
        }
        
        // Nascondi la modalità immersiva se attiva
        const immersiveView = document.getElementById('immersive-view');
        if (immersiveView) {
            immersiveView.style.display = 'none';
        }
        
        // Rimuovi le classi dal body
        document.body.classList.remove('immersive-mode-active');
        document.body.classList.remove('vr-headset-mode');
        
        // Rimuovi gli event listener del giroscopio
        if (this._orientationHandler) {
            window.removeEventListener('deviceorientation', this._orientationHandler, true);
            this._orientationHandler = null;
        }
        
        // Rimuovi l'event listener per il tasto ESC
        if (this._escKeyHandler) {
            document.removeEventListener('keydown', this._escKeyHandler);
        }
        
        // Resetta lo stato corrente
        this.currentPhoto = null;
    }
}

// Initialize VR viewer when document is ready
document.addEventListener('DOMContentLoaded', () => {
    window.vrPhotoViewer = new VRPhotoViewer();
    
    // Try to initialize VR viewer
    window.vrPhotoViewer.init().then(supported => {
        if (supported) {
            console.log('VR Photo Viewer initialized');
        } else {
            console.log('VR Photo Viewer not available on this device/browser');
        }
    });
});

/**
 * Add VR buttons to all photos in the document
 */
function addVRButtonsToPhotos() {
    if (!window.vrPhotoViewer) return;
    
    // Verifica se siamo nella pagina pubblica dell'album
    const isPublicAlbumPage = document.querySelector('.photo-grid') && 
                             !document.querySelector('.dropzone') && 
                             !document.querySelector('.delete-album');
    
    // Se non siamo nella pagina pubblica, non aggiungere i pulsanti VR
    if (!isPublicAlbumPage && !document.querySelector('#photoDetailModal')) {
        return;
    }
    
    // Aggiungi pulsanti VR solo alle foto nella visualizzazione pubblica dell'album
    if (isPublicAlbumPage) {
        // Trova tutte le miniature delle foto nella visualizzazione pubblica
        const photoFrames = document.querySelectorAll('.photo-frame');
        photoFrames.forEach(photoFrame => {
            const thumbnail = photoFrame.querySelector('.photo-thumbnail');
            if (thumbnail && !photoFrame.querySelector('.vr-view-button')) {
                window.vrPhotoViewer.addVRButtonToPhoto(photoFrame, thumbnail.src);
            }
        });
    }
    
    // Aggiungi pulsanti VR alle slide dello slideshow (solo nella visualizzazione pubblica)
    const slideshowSlides = document.querySelectorAll('#photoDetailModal .slideshow-slide');
    slideshowSlides.forEach(slide => {
        const img = slide.querySelector('img');
        if (img && !slide.querySelector('.vr-view-button')) {
            window.vrPhotoViewer.addVRButtonToPhoto(slide, img.src);
        }
    });
}

// Add VR buttons when document is ready and after AJAX loads
document.addEventListener('DOMContentLoaded', () => {
    // Add initial VR buttons
    setTimeout(addVRButtonsToPhotos, 500);
    
    // Add observer to detect when new photos are added
    const observer = new MutationObserver((mutations) => {
        mutations.forEach(mutation => {
            if (mutation.addedNodes.length) {
                setTimeout(addVRButtonsToPhotos, 200);
            }
        });
    });
    
    // Start observing the document
    observer.observe(document.body, { childList: true, subtree: true });
});
