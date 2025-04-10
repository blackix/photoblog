from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.models import User
from django.http import JsonResponse
from .models import BlogSettings, Album, Photo, Post, Comment, Like
from .views import get_settings
import json

def is_mobile(request):
    """
    Determina se la richiesta proviene da un dispositivo mobile
    basandosi sull'User-Agent
    """
    user_agent = request.META.get('HTTP_USER_AGENT', '').lower()
    mobile_agents = ['android', 'iphone', 'ipad', 'ipod', 'blackberry', 'windows phone']
    return any(agent in user_agent for agent in mobile_agents)

def mobile_home(request):
    """
    Vista per la home page mobile
    """
    # Se l'utente è autenticato, reindirizza al suo blog
    if request.user.is_authenticated:
        return redirect('mobile_blog_view', username=request.user.username)
    
    # Altrimenti mostra la landing page
    return render(request, 'blog/mobile_base.html')

def mobile_blog_view(request, username):
    """
    Vista mobile per visualizzare il blog di un utente
    """
    user = get_object_or_404(User, username=username)
    settings = get_settings(user)
    
    # Ottieni tutti gli album dell'utente (assumiamo che siano tutti pubblici)
    albums = Album.objects.filter(user=user).order_by('-created_at')
    
    # Prepara i dati delle foto per il template
    photos_data = []
    for album in albums:
        photos = Photo.objects.filter(album=album).order_by('-upload_date')
        for photo in photos:
            photos_data.append({
                'id': photo.id,
                'image_url': photo.image.url,
                'thumbnail_url': photo.image.url, # Utilizziamo l'immagine originale come thumbnail
                'caption': photo.caption,
                'upload_date': photo.upload_date,  # Rinominato da date_taken a upload_date
                'album_title': album.title,
                'likes_count': Like.objects.filter(photo=photo).count(),
                'comments_count': Comment.objects.filter(photo=photo).count()
            })
    
    context = {
        'blog_owner': user,
        'settings': settings,
        'photos_data': photos_data,
    }
    
    return render(request, 'blog/mobile_blog_view.html', context)

def mobile_explore(request):
    """
    Vista mobile per esplorare i blog disponibili
    """
    # Ottieni tutti gli utenti con blog pubblici
    users_with_blogs = User.objects.filter(blogsettings__isnull=False).order_by('-date_joined')
    
    blogs = []
    for user in users_with_blogs:
        settings = get_settings(user)
        if settings:
            blogs.append({
                'username': user.username,
                'tagline': settings.tagline,
                'site_icon': settings.site_icon.url if settings.site_icon else None,
            })
    
    # Importa la funzione get_random_photos da views.py
    from .views import get_random_photos
    
    # Ottieni foto casuali da blog pubblici
    random_photos = get_random_photos(limit=10)
    
    context = {
        'blogs': blogs,
        'random_photos': random_photos
    }
    
    return render(request, 'blog/mobile_explore.html', context)

def api_blogs(request):
    """
    API endpoint per ottenere la lista dei blog
    """
    # Ottieni tutti gli utenti con blog pubblici
    users_with_blogs = User.objects.filter(blogsettings__isnull=False).order_by('-date_joined')
    
    blogs = []
    for user in users_with_blogs:
        settings = get_settings(user)
        if settings:
            blogs.append({
                'username': user.username,
                'tagline': settings.tagline,
                'site_icon': settings.site_icon.url if settings.site_icon else None,
            })
    
    return JsonResponse({'blogs': blogs})

def api_photo_detail(request, photo_id):
    """
    API endpoint per ottenere i dettagli di una foto
    """
    photo = get_object_or_404(Photo, id=photo_id)
    
    # Assumiamo che tutti gli album siano pubblici per la versione mobile
    
    data = {
        'id': photo.id,
        'image_url': photo.image.url,
        'caption': photo.caption,
        'upload_date': photo.upload_date.strftime('%d/%m/%Y') if photo.upload_date else None,
        'album_title': photo.album.title,
        'likes_count': Like.objects.filter(photo=photo).count(),
        'comments_count': Comment.objects.filter(photo=photo).count()
    }
    
    return JsonResponse(data)

def api_photo_comments(request, photo_id):
    """
    API endpoint per ottenere i commenti di una foto
    """
    photo = get_object_or_404(Photo, id=photo_id)
    
    # Assumiamo che tutti gli album siano pubblici per la versione mobile
    
    comments = Comment.objects.filter(photo=photo).order_by('created_at')
    comments_data = []
    
    for comment in comments:
        comments_data.append({
            'id': comment.id,
            'author': comment.user.username,
            'text': comment.content,  # Corretto da text a content
            'date': comment.created_at.strftime('%d/%m/%Y %H:%M')
        })
    
    return JsonResponse({'comments': comments_data})

def mobile_dashboard(request):
    """
    Vista mobile per la dashboard
    """
    if not request.user.is_authenticated:
        return redirect('mobile_home')
    
    # Ottieni le impostazioni del blog
    settings = get_settings(request.user)
    
    # Ottieni gli album dell'utente
    albums = Album.objects.filter(user=request.user)
    
    # Ottieni i post dell'utente
    posts = Post.objects.filter(user=request.user)
    
    # Verifica se mostrare il messaggio di benvenuto
    show_welcome = not albums.exists() and not posts.exists()
    
    context = {
        'settings': settings,
        'albums': albums,
        'posts': posts,
        'show_welcome': show_welcome
    }
    
    return render(request, 'blog/mobile_dashboard.html', context)

def mobile_settings(request):
    """
    Vista mobile per le impostazioni
    """
    if not request.user.is_authenticated:
        return redirect('mobile_home')
    
    from .views import settings_view
    from .forms import BlogSettingsForm
    
    # Ottieni le impostazioni del blog
    settings, created = BlogSettings.objects.get_or_create(user=request.user)
    
    if request.method == 'POST':
        form = BlogSettingsForm(request.POST, request.FILES, instance=settings)
        if form.is_valid():
            form.save()
            return redirect('mobile_dashboard')
    else:
        form = BlogSettingsForm(instance=settings)
    
    context = {
        'form': form,
        'settings': settings
    }
    
    return render(request, 'blog/mobile_settings.html', context)

def mobile_album_detail(request, pk):
    """
    Vista mobile per i dettagli di un album
    """
    if not request.user.is_authenticated:
        return redirect('mobile_home')
    
    album = get_object_or_404(Album, pk=pk, user=request.user)
    
    # Forza un refresh dal database per assicurarsi di avere le foto più recenti
    photos = Photo.objects.filter(album=album).order_by('-upload_date').select_related('album')
    
    # Log per debug
    print(f"Mobile album detail view for album {pk} - Found {photos.count()} photos")
    for photo in photos:
        print(f"Photo ID: {photo.id}, Image URL: {photo.image.url}")
    
    context = {
        'album': album,
        'photos': photos
    }
    
    return render(request, 'blog/mobile_album_detail.html', context)

def mobile_upload_photos(request, album_id):
    """
    Vista mobile per il caricamento delle foto
    """
    if not request.user.is_authenticated:
        return redirect('mobile_home')
    
    album = get_object_or_404(Album, id=album_id, user=request.user)
    
    # Log per debug
    print(f"Mobile upload photos request received for album {album_id}")
    print(f"Files in request: {len(request.FILES.getlist('photos'))}")
    
    if not request.FILES.getlist('photos'):
        print("No files found in request")
        return redirect('mobile_album_detail', pk=album_id)
    
    uploaded_count = 0
    errors = []
    
    for uploaded_file in request.FILES.getlist('photos'):
        try:
            print(f"Processing file: {uploaded_file.name}, size: {uploaded_file.size}")
            
            # Verifica che il file sia un'immagine valida
            try:
                from PIL import Image as PILImage
                image = PILImage.open(uploaded_file)
                image.verify()  # Verifica che l'immagine sia valida
                image = PILImage.open(uploaded_file)  # Riapri dopo verify
            except Exception as e:
                print(f"Invalid image file: {str(e)}")
                errors.append(f"File {uploaded_file.name} non è un'immagine valida: {str(e)}")
                continue
            
            # Create photo with minimal metadata
            photo = Photo.objects.create(
                album=album,
                image=uploaded_file,
                metadata={}
            )
            
            uploaded_count += 1
            print(f"Successfully uploaded photo: {photo.id} to album {album_id}")
            
        except Exception as e:
            error_message = f'Error processing {uploaded_file.name}: {str(e)}'
            print(error_message)
            errors.append(error_message)
            continue
    
    # Reindirizza alla pagina dell'album dopo il caricamento
    return redirect('mobile_album_detail', pk=album_id)

def mobile_delete_album(request, album_id):
    """
    Vista mobile per l'eliminazione di un album
    """
    if not request.user.is_authenticated:
        return redirect('mobile_home')
    
    album = get_object_or_404(Album, id=album_id, user=request.user)
    
    # Log per debug
    print(f"Mobile delete album request received for album {album_id}")
    
    # Elimina l'album e tutte le sue foto
    album.delete()
    
    # Reindirizza alla dashboard mobile
    return redirect('mobile_dashboard')

def mobile_delete_photo(request, photo_id):
    """
    Vista mobile per l'eliminazione di una foto
    """
    if not request.user.is_authenticated:
        return redirect('mobile_home')
    
    photo = get_object_or_404(Photo, id=photo_id)
    
    # Verifica che l'utente sia il proprietario della foto
    if photo.album.user != request.user:
        return redirect('mobile_home')
    
    album_id = photo.album.id
    
    # Elimina la foto
    photo.delete()
    
    # Reindirizza all'album
    return redirect('mobile_album_detail', pk=album_id)

def mobile_album_create(request):
    """
    Vista mobile per la creazione di un album
    """
    if not request.user.is_authenticated:
        return redirect('mobile_home')
    
    if request.method == 'POST':
        title = request.POST.get('title')
        description = request.POST.get('description')
        
        if title:
            album = Album.objects.create(
                user=request.user,
                title=title,
                description=description
            )
            return redirect('mobile_album_detail', pk=album.id)
    
    return render(request, 'blog/mobile_album_create.html')

def mobile_post_list(request):
    """
    Vista mobile per la lista dei post
    """
    if not request.user.is_authenticated:
        return redirect('mobile_home')
    
    posts = Post.objects.filter(user=request.user).order_by('-created_at')
    
    context = {
        'posts': posts
    }
    
    return render(request, 'blog/mobile_post_list.html', context)

def mobile_post_create(request):
    """
    Vista mobile per la creazione di un post
    """
    if not request.user.is_authenticated:
        return redirect('mobile_home')
    
    from django.utils.text import slugify
    import random
    import string
    
    if request.method == 'POST':
        title = request.POST.get('title')
        content = request.POST.get('content')
        published = request.POST.get('published') == 'on'
        
        if title and content:
            # Crea uno slug unico
            base_slug = slugify(title)
            slug = base_slug
            
            # Se lo slug esiste già, aggiungi un suffisso casuale
            if Post.objects.filter(slug=slug).exists():
                random_string = ''.join(random.choices(string.ascii_lowercase + string.digits, k=6))
                slug = f"{base_slug}-{random_string}"
            
            post = Post.objects.create(
                user=request.user,
                title=title,
                slug=slug,
                content=content,
                published=published
            )
            return redirect('mobile_post_detail', username=request.user.username, slug=post.slug)
    
    return render(request, 'blog/mobile_post_form.html')

def mobile_post_edit(request, slug):
    """
    Vista mobile per la modifica di un post
    """
    if not request.user.is_authenticated:
        return redirect('mobile_home')
    
    post = get_object_or_404(Post, slug=slug, user=request.user)
    
    if request.method == 'POST':
        title = request.POST.get('title')
        content = request.POST.get('content')
        published = request.POST.get('published') == 'on'
        
        if title and content:
            post.title = title
            post.content = content
            post.published = published
            post.save()
            return redirect('mobile_post_detail', username=request.user.username, slug=post.slug)
    
    form = {'instance': post, 'title': {'value': post.title}, 'content': {'value': post.content}, 'published': {'value': post.published}}
    
    return render(request, 'blog/mobile_post_form.html', {'form': form})

def mobile_post_detail(request, username, slug):
    """
    Vista mobile per la visualizzazione di un post
    """
    user = get_object_or_404(User, username=username)
    post = get_object_or_404(Post, slug=slug, user=user)
    
    # Se il post non è pubblicato, solo l'autore può vederlo
    if not post.published and request.user != post.user:
        raise Http404("Post non trovato")
    
    context = {
        'post': post
    }
    
    return render(request, 'blog/mobile_post_detail.html', context)

def mobile_redirect(request, *args, **kwargs):
    """
    Funzione per reindirizzare le richieste mobile alle viste mobile
    """
    if is_mobile(request):
        view_name = kwargs.get('view_name')
        
        if view_name == 'home':
            return mobile_home(request)
        elif view_name == 'blog_view':
            # Estrai username direttamente dagli kwargs della richiesta originale
            username = request.resolver_match.kwargs.get('username')
            return mobile_blog_view(request, username)
        elif view_name == 'all_blogs':
            return mobile_explore(request)
        elif view_name == 'dashboard':
            return mobile_dashboard(request)
        elif view_name == 'settings':
            return mobile_settings(request)
        elif view_name == 'album_detail':
            pk = request.resolver_match.kwargs.get('pk')
            return mobile_album_detail(request, pk)
        elif view_name == 'album_create':
            return mobile_album_create(request)
    
    # Se non è mobile o non c'è una vista mobile corrispondente,
    # usa la vista normale
    from .views import blog_view, home, all_blogs, dashboard, settings_view, album_detail, album_create
    
    view_name = kwargs.get('view_name')
    
    if view_name == 'home':
        return home(request)
    elif view_name == 'blog_view':
        username = kwargs.get('username')
        return blog_view(request, username)
    elif view_name == 'explore':
        return all_blogs(request)
    elif view_name == 'dashboard':
        return dashboard(request)
    elif view_name == 'settings':
        return settings_view(request)
    elif view_name == 'album_detail':
        pk = kwargs.get('pk')
        return album_detail(request, pk)
    elif view_name == 'album_create':
        return album_create(request)
    
    # Fallback
    return redirect('home')
