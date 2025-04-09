from django.shortcuts import redirect

class MobileRedirectMiddleware:
    """
    Middleware che rileva i dispositivi mobili e li reindirizza alle viste mobile
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
        
    def __call__(self, request):
        # Verifica se la richiesta proviene da un dispositivo mobile
        if self.is_mobile(request):
            # Verifica se l'utente sta già accedendo a una vista mobile
            if not request.path.startswith('/m/'):
                # Reindirizza alle viste mobile appropriate
                if request.path == '/':
                    return redirect('mobile_home')
                elif request.path.startswith('/blog/'):
                    # Estrai username dall'URL
                    parts = request.path.split('/')
                    if len(parts) >= 3 and parts[1] == 'blog' and parts[2]:
                        username = parts[2]
                        return redirect('mobile_blog_view', username=username)
                elif request.path == '/blogs/':
                    return redirect('mobile_explore')
                elif request.path == '/dashboard/':
                    return redirect('mobile_dashboard')
                elif request.path == '/settings/':
                    return redirect('mobile_settings')
                elif request.path.startswith('/album/'):
                    # Estrai l'ID dell'album dall'URL
                    parts = request.path.split('/')
                    if len(parts) >= 3 and parts[1] == 'album':
                        if parts[2] == 'create':
                            return redirect('mobile_album_create')
                        elif parts[2].isdigit():
                            album_id = int(parts[2])
                            return redirect('mobile_album_detail', pk=album_id)
                elif request.path == '/posts/':
                    return redirect('mobile_post_list')
                elif request.path.startswith('/post/'):
                    parts = request.path.split('/')
                    if len(parts) >= 3 and parts[1] == 'post':
                        if parts[2] == 'create':
                            return redirect('mobile_post_create')
                        elif len(parts) >= 5 and parts[3] == 'edit':
                            # URL formato /post/slug/edit/
                            slug = parts[2]
                            return redirect('mobile_post_edit', slug=slug)
        
        # Procedi normalmente per le richieste non mobile o già mobile
        response = self.get_response(request)
        return response
    
    def is_mobile(self, request):
        """
        Determina se la richiesta proviene da un dispositivo mobile
        basandosi sull'User-Agent
        """
        user_agent = request.META.get('HTTP_USER_AGENT', '').lower()
        mobile_agents = ['android', 'iphone', 'ipad', 'ipod', 'blackberry', 'windows phone']
        return any(agent in user_agent for agent in mobile_agents)
