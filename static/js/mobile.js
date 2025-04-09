/**
 * Mobile optimization script for Photoblog
 * Gestisce le interazioni specifiche per dispositivi mobili
 */

document.addEventListener('DOMContentLoaded', function() {
    // Rileva se siamo su un dispositivo mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
        console.log('Mobile device detected, applying mobile optimizations');
        document.body.classList.add('mobile-device');
        
        // Ottimizza il comportamento del sidebar su mobile
        optimizeSidebar();
        
        // Ottimizza la visualizzazione delle foto
        optimizePhotoViewer();
        
        // Aggiungi supporto per i gesti touch
        addTouchGestures();
        
        // Ottimizza i form per dispositivi mobili
        optimizeForms();
        
        // Gestisci correttamente l'orientamento del dispositivo
        handleOrientation();
    }
    
    /**
     * Trasforma la sidebar in un menu a schermo intero su dispositivi mobili
     * con opzioni di login/registrazione e navigazione ad altri blog
     */
    function optimizeSidebar() {
        const sidebar = document.getElementById('sidebar');
        const mainContent = document.querySelector('.main-content');
        const sidebarToggle = document.getElementById('sidebarToggleBtn');
        
        if (!sidebar) return;
        
        // Aggiungi la classe mobile-device al body
        document.body.classList.add('mobile-device');
        
        // Assicurati che la sidebar sia nascosta all'avvio su mobile
        sidebar.classList.remove('show');
        
        // Trasforma la sidebar in un menu a schermo intero
        transformSidebarToFullscreen(sidebar);
        
        // Aggiungi il pulsante di chiusura al menu
        addCloseButton(sidebar);
        
        // Aggiungi sezione login/registrazione se l'utente non è autenticato
        if (!document.body.classList.contains('authenticated')) {
            addAuthSection(sidebar);
        }
        
        // Aggiungi sezione per esplorare altri blog
        addExploreBlogsSection(sidebar);
        
        // Gestisci l'apertura/chiusura del menu
        if (sidebarToggle) {
            // Rimuovi eventuali listener precedenti
            const newToggle = sidebarToggle.cloneNode(true);
            sidebarToggle.parentNode.replaceChild(newToggle, sidebarToggle);
            
            // Aggiungi il nuovo listener
            newToggle.addEventListener('click', function() {
                sidebar.classList.toggle('show');
            });
        }
    }
    
    /**
     * Trasforma la sidebar in un menu a schermo intero
     */
    function transformSidebarToFullscreen(sidebar) {
        // Crea un contenitore per il menu a schermo intero
        const mobileMenu = document.createElement('div');
        mobileMenu.className = 'mobile-fullscreen-menu';
        
        // Sposta tutti i contenuti della sidebar nel nuovo contenitore
        const sidebarContents = Array.from(sidebar.children);
        sidebarContents.forEach(element => {
            // Nascondi alcuni elementi che non vogliamo mostrare nella versione mobile
            if (element.classList.contains('sidebar-full') || 
                element.classList.contains('sidebar-collapsed')) {
                element.style.display = 'none';
            }
            mobileMenu.appendChild(element);
        });
        
        // Aggiungi il nuovo contenitore alla sidebar
        sidebar.appendChild(mobileMenu);
    }
    
    /**
     * Aggiungi un pulsante di chiusura al menu mobile
     */
    function addCloseButton(sidebar) {
        const header = document.createElement('div');
        header.className = 'mobile-menu-header';
        
        const title = document.createElement('h2');
        title.textContent = 'Menu';
        
        const closeButton = document.createElement('button');
        closeButton.className = 'mobile-menu-close';
        closeButton.innerHTML = '<i class="fas fa-times"></i>';
        closeButton.addEventListener('click', function() {
            sidebar.classList.remove('show');
        });
        
        header.appendChild(title);
        header.appendChild(closeButton);
        
        // Inserisci l'header all'inizio del menu
        sidebar.querySelector('.mobile-fullscreen-menu').prepend(header);
    }
    
    /**
     * Aggiungi sezione login/registrazione al menu mobile
     */
    function addAuthSection(sidebar) {
        const authSection = document.createElement('div');
        authSection.className = 'mobile-auth-section';
        
        const authTitle = document.createElement('h3');
        authTitle.textContent = 'Accedi o registrati';
        
        const authButtons = document.createElement('div');
        authButtons.className = 'mobile-auth-buttons';
        
        const loginButton = document.createElement('a');
        loginButton.href = '/accounts/login/';
        loginButton.className = 'btn btn-primary';
        loginButton.textContent = 'Accedi';
        
        const registerButton = document.createElement('a');
        registerButton.href = '/accounts/signup/';
        registerButton.className = 'btn btn-outline-primary';
        registerButton.textContent = 'Registrati';
        
        authButtons.appendChild(loginButton);
        authButtons.appendChild(registerButton);
        
        authSection.appendChild(authTitle);
        authSection.appendChild(authButtons);
        
        // Inserisci la sezione auth dopo l'header
        const mobileMenu = sidebar.querySelector('.mobile-fullscreen-menu');
        mobileMenu.insertBefore(authSection, mobileMenu.children[1]);
    }
    
    /**
     * Aggiungi sezione per esplorare altri blog al menu mobile
     */
    function addExploreBlogsSection(sidebar) {
        // Crea la sezione per esplorare altri blog
        const exploreSection = document.createElement('div');
        exploreSection.className = 'mobile-explore-section';
        
        const exploreTitle = document.createElement('h3');
        exploreTitle.textContent = 'Esplora altri blog';
        
        const blogList = document.createElement('div');
        blogList.className = 'mobile-blog-list';
        
        // Carica la lista dei blog disponibili
        fetch('/api/blogs/')
            .then(response => {
                if (!response.ok) {
                    // Se l'API non esiste, usa dati di esempio
                    return Promise.resolve({
                        blogs: [
                            { username: 'blackix', site_icon: null },
                            { username: 'photolover', site_icon: null },
                            { username: 'travelblog', site_icon: null }
                        ]
                    });
                }
                return response.json();
            })
            .then(data => {
                // Se non ci sono dati, usa dati di esempio
                const blogs = data.blogs || [
                    { username: 'blackix', site_icon: null },
                    { username: 'photolover', site_icon: null },
                    { username: 'travelblog', site_icon: null }
                ];
                
                // Crea gli elementi per ogni blog
                blogs.forEach(blog => {
                    const blogItem = document.createElement('a');
                    blogItem.href = `/blog/${blog.username}/`;
                    blogItem.className = 'mobile-blog-item';
                    
                    const avatar = document.createElement('img');
                    avatar.className = 'mobile-blog-avatar';
                    avatar.src = blog.site_icon || '/static/default-avatar.png';
                    avatar.alt = blog.username;
                    
                    const name = document.createElement('div');
                    name.className = 'mobile-blog-name';
                    name.textContent = blog.username;
                    
                    blogItem.appendChild(avatar);
                    blogItem.appendChild(name);
                    blogList.appendChild(blogItem);
                });
            })
            .catch(error => {
                console.error('Errore nel caricamento dei blog:', error);
                
                // In caso di errore, mostra comunque alcuni blog di esempio
                const exampleBlogs = [
                    { username: 'blackix', site_icon: null },
                    { username: 'photolover', site_icon: null },
                    { username: 'travelblog', site_icon: null }
                ];
                
                exampleBlogs.forEach(blog => {
                    const blogItem = document.createElement('a');
                    blogItem.href = `/blog/${blog.username}/`;
                    blogItem.className = 'mobile-blog-item';
                    
                    const avatar = document.createElement('img');
                    avatar.className = 'mobile-blog-avatar';
                    avatar.src = '/static/default-avatar.png';
                    avatar.alt = blog.username;
                    
                    const name = document.createElement('div');
                    name.className = 'mobile-blog-name';
                    name.textContent = blog.username;
                    
                    blogItem.appendChild(avatar);
                    blogItem.appendChild(name);
                    blogList.appendChild(blogItem);
                });
            });
        
        exploreSection.appendChild(exploreTitle);
        exploreSection.appendChild(blogList);
        
        // Inserisci la sezione dopo la sezione auth o dopo l'header
        const mobileMenu = sidebar.querySelector('.mobile-fullscreen-menu');
        const authSection = mobileMenu.querySelector('.mobile-auth-section');
        
        if (authSection) {
            mobileMenu.insertBefore(exploreSection, authSection.nextSibling);
        } else {
            mobileMenu.insertBefore(exploreSection, mobileMenu.children[1]);
        }
    }
    
    /**
     * Ottimizza la visualizzazione delle foto su dispositivi mobili
     */
    function optimizePhotoViewer() {
        // Ottimizza la visualizzazione modale delle foto
        const photoModal = document.getElementById('photoModal');
        if (photoModal) {
            // Aggiungi supporto per lo swipe tra le foto
            let startX, startY;
            let distX, distY;
            const threshold = 100; // Distanza minima per considerare uno swipe
            
            photoModal.addEventListener('touchstart', function(e) {
                startX = e.touches[0].clientX;
                startY = e.touches[0].clientY;
            }, false);
            
            photoModal.addEventListener('touchmove', function(e) {
                if (!startX || !startY) return;
                
                distX = e.touches[0].clientX - startX;
                distY = e.touches[0].clientY - startY;
                
                // Se lo swipe è più orizzontale che verticale, previeni lo scroll
                if (Math.abs(distX) > Math.abs(distY)) {
                    e.preventDefault();
                }
            }, false);
            
            photoModal.addEventListener('touchend', function(e) {
                if (!startX || !startY) return;
                
                // Calcola la distanza dello swipe
                distX = e.changedTouches[0].clientX - startX;
                distY = e.changedTouches[0].clientY - startY;
                
                // Se lo swipe è più orizzontale che verticale e supera la soglia
                if (Math.abs(distX) > Math.abs(distY) && Math.abs(distX) > threshold) {
                    // Swipe a sinistra (foto successiva)
                    if (distX < 0) {
                        const nextBtn = document.querySelector('.slideshow-next');
                        if (nextBtn) nextBtn.click();
                    }
                    // Swipe a destra (foto precedente)
                    else {
                        const prevBtn = document.querySelector('.slideshow-prev');
                        if (prevBtn) prevBtn.click();
                    }
                }
                
                // Reset
                startX = null;
                startY = null;
            }, false);
        }
        
        // Ottimizza la visualizzazione immersiva delle foto
        const immersiveView = document.getElementById('immersive-view');
        if (immersiveView) {
            // Aggiungi supporto per lo swipe tra le foto in modalità immersiva
            let startX, startY;
            let distX, distY;
            const threshold = 100; // Distanza minima per considerare uno swipe
            
            immersiveView.addEventListener('touchstart', function(e) {
                startX = e.touches[0].clientX;
                startY = e.touches[0].clientY;
            }, false);
            
            immersiveView.addEventListener('touchmove', function(e) {
                if (!startX || !startY) return;
                
                distX = e.touches[0].clientX - startX;
                distY = e.touches[0].clientY - startY;
                
                // Se lo swipe è più orizzontale che verticale, previeni lo scroll
                if (Math.abs(distX) > Math.abs(distY)) {
                    e.preventDefault();
                }
            }, false);
            
            immersiveView.addEventListener('touchend', function(e) {
                if (!startX || !startY) return;
                
                // Calcola la distanza dello swipe
                distX = e.changedTouches[0].clientX - startX;
                distY = e.changedTouches[0].clientY - startY;
                
                // Se lo swipe è più orizzontale che verticale e supera la soglia
                if (Math.abs(distX) > Math.abs(distY) && Math.abs(distX) > threshold) {
                    // Swipe a sinistra (foto successiva)
                    if (distX < 0) {
                        if (window.vrPhotoViewer) {
                            window.vrPhotoViewer.navigateToNextPhoto();
                        }
                    }
                    // Swipe a destra (foto precedente)
                    else {
                        if (window.vrPhotoViewer) {
                            window.vrPhotoViewer.navigateToPrevPhoto();
                        }
                    }
                }
                
                // Reset
                startX = null;
                startY = null;
            }, false);
        }
    }
    
    /**
     * Aggiungi supporto per i gesti touch
     */
    function addTouchGestures() {
        // Double tap per aprire/chiudere la foto in modalità immersiva
        const photoThumbnails = document.querySelectorAll('.photo-thumbnail');
        photoThumbnails.forEach(thumbnail => {
            let lastTap = 0;
            thumbnail.addEventListener('touchend', function(e) {
                const currentTime = new Date().getTime();
                const tapLength = currentTime - lastTap;
                
                if (tapLength < 500 && tapLength > 0) {
                    // Double tap rilevato
                    const vrButton = thumbnail.querySelector('.vr-view-button');
                    if (vrButton) {
                        e.preventDefault();
                        vrButton.click();
                    }
                }
                
                lastTap = currentTime;
            });
        });
    }
    
    /**
     * Ottimizza i form per dispositivi mobili
     */
    function optimizeForms() {
        // Aumenta la dimensione degli input per facilitare l'interazione
        const inputs = document.querySelectorAll('input, textarea, select, button');
        inputs.forEach(input => {
            if (getComputedStyle(input).height < '44px') {
                input.style.minHeight = '44px';
            }
            
            if (input.tagName.toLowerCase() === 'input' || input.tagName.toLowerCase() === 'textarea') {
                input.addEventListener('focus', function() {
                    // Scorri fino all'input quando viene selezionato
                    setTimeout(() => {
                        input.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }, 300);
                });
            }
        });
    }
    
    /**
     * Gestisci correttamente l'orientamento del dispositivo
     */
    function handleOrientation() {
        // Aggiorna il layout quando l'orientamento cambia
        window.addEventListener('orientationchange', function() {
            // Piccolo ritardo per permettere al browser di completare il cambio di orientamento
            setTimeout(function() {
                // Forza il ridimensionamento della griglia di foto
                const photoGrids = document.querySelectorAll('.photo-grid');
                photoGrids.forEach(grid => {
                    grid.style.display = 'none';
                    setTimeout(() => {
                        grid.style.display = 'grid';
                    }, 50);
                });
                
                // Aggiusta la visualizzazione modale
                const photoModal = document.getElementById('photoModal');
                if (photoModal && photoModal.style.display !== 'none') {
                    const photoFrame = photoModal.querySelector('.photo-frame');
                    const photoInfo = photoModal.querySelector('.photo-info');
                    
                    if (window.innerWidth > window.innerHeight) {
                        // Orientamento orizzontale
                        photoModal.querySelector('.photo-modal-content').style.flexDirection = 'row';
                        if (photoFrame) photoFrame.style.width = '70%';
                        if (photoInfo) photoInfo.style.width = '30%';
                    } else {
                        // Orientamento verticale
                        photoModal.querySelector('.photo-modal-content').style.flexDirection = 'column';
                        if (photoFrame) photoFrame.style.width = '100%';
                        if (photoInfo) photoInfo.style.width = '100%';
                    }
                }
            }, 300);
        });
    }
});
