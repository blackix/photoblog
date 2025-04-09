/**
 * Script per la versione mobile del Photoblog
 * Gestisce le interazioni specifiche per l'interfaccia mobile
 */

document.addEventListener('DOMContentLoaded', function() {
    // Gestione del menu sidebar
    initializeMobileSidebar();
    
    // Gestione del tema scuro/chiaro
    initializeDarkMode();
    
    // Caricamento della lista dei blog nella landing page
    loadExploreBlogList();
    
    /**
     * Inizializza la sidebar mobile
     */
    function initializeMobileSidebar() {
        const sidebarToggleBtn = document.getElementById('sidebarToggleBtn');
        const closeSidebarBtn = document.getElementById('closeSidebarBtn');
        const mobileSidebar = document.getElementById('mobileSidebar');
        
        console.log('Initializing mobile sidebar');
        console.log('Toggle button:', sidebarToggleBtn);
        console.log('Close button:', closeSidebarBtn);
        console.log('Sidebar element:', mobileSidebar);
        
        if (sidebarToggleBtn && mobileSidebar) {
            sidebarToggleBtn.addEventListener('click', function(e) {
                console.log('Toggle button clicked');
                e.stopPropagation(); // Previene la propagazione dell'evento
                mobileSidebar.classList.add('show');
                document.body.style.overflow = 'hidden'; // Blocca lo scroll
            });
        }
        
        if (closeSidebarBtn && mobileSidebar) {
            closeSidebarBtn.addEventListener('click', function(e) {
                console.log('Close button clicked');
                e.stopPropagation(); // Previene la propagazione dell'evento
                mobileSidebar.classList.remove('show');
                document.body.style.overflow = ''; // Ripristina lo scroll
            });
        }
        
        // Chiudi la sidebar quando si tocca al di fuori
        document.addEventListener('click', function(e) {
            if (mobileSidebar && mobileSidebar.classList.contains('show')) {
                // Verifica se il click è avvenuto al di fuori della sidebar e non sul pulsante di toggle
                if (!mobileSidebar.contains(e.target) && e.target !== sidebarToggleBtn) {
                    mobileSidebar.classList.remove('show');
                    document.body.style.overflow = '';
                }
            }
        });
    }
    
    /**
     * Inizializza la gestione del tema scuro/chiaro
     */
    function initializeDarkMode() {
        const darkModeToggleBtn = document.getElementById('darkModeToggleBtn');
        
        if (darkModeToggleBtn) {
            darkModeToggleBtn.addEventListener('click', function() {
                const body = document.body;
                const currentTheme = body.getAttribute('data-theme');
                const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
                
                // Aggiorna l'attributo del tema
                body.setAttribute('data-theme', newTheme);
                
                // Aggiorna l'icona
                const icon = darkModeToggleBtn.querySelector('i');
                if (icon) {
                    if (newTheme === 'dark') {
                        icon.classList.remove('fa-moon');
                        icon.classList.add('fa-sun');
                    } else {
                        icon.classList.remove('fa-sun');
                        icon.classList.add('fa-moon');
                    }
                }
                
                // Salva la preferenza dell'utente
                if (isUserAuthenticated()) {
                    // Se l'utente è autenticato, salva la preferenza nel database
                    saveUserDarkModePreference(newTheme === 'dark');
                } else {
                    // Altrimenti salva in localStorage
                    localStorage.setItem('theme', newTheme);
                }
            });
        }
        
        // Applica il tema salvato in localStorage per utenti non autenticati
        if (!isUserAuthenticated()) {
            const savedTheme = localStorage.getItem('theme');
            if (savedTheme) {
                document.body.setAttribute('data-theme', savedTheme);
                updateDarkModeIcon(savedTheme === 'dark');
            }
        }
    }
    
    /**
     * Aggiorna l'icona del pulsante tema in base allo stato corrente
     */
    function updateDarkModeIcon(isDark) {
        const darkModeToggleBtn = document.getElementById('darkModeToggleBtn');
        if (darkModeToggleBtn) {
            const icon = darkModeToggleBtn.querySelector('i');
            if (icon) {
                if (isDark) {
                    icon.classList.remove('fa-moon');
                    icon.classList.add('fa-sun');
                } else {
                    icon.classList.remove('fa-sun');
                    icon.classList.add('fa-moon');
                }
            }
        }
    }
    
    /**
     * Verifica se l'utente è autenticato
     */
    function isUserAuthenticated() {
        return document.body.classList.contains('authenticated');
    }
    
    /**
     * Salva la preferenza del tema dell'utente nel database
     */
    function saveUserDarkModePreference(isDark) {
        fetch('/api/user/preferences/dark-mode/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
            },
            body: JSON.stringify({ dark_mode: isDark })
        })
        .catch(error => {
            console.error('Errore nel salvataggio della preferenza del tema:', error);
        });
    }
    
    /**
     * Carica la lista dei blog nella landing page
     */
    function loadExploreBlogList() {
        const exploreBlogList = document.getElementById('exploreBlogList');
        if (!exploreBlogList) return;
        
        // Mostra un loader mentre si caricano i blog
        exploreBlogList.innerHTML = '<div class="mobile-loading">Caricamento...</div>';
        
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
                // Svuota il container
                exploreBlogList.innerHTML = '';
                
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
                    exploreBlogList.appendChild(blogItem);
                });
            })
            .catch(error => {
                console.error('Errore nel caricamento dei blog:', error);
                exploreBlogList.innerHTML = '<div class="mobile-error">Errore nel caricamento dei blog</div>';
            });
    }
});
