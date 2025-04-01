from django.shortcuts import render, redirect, get_object_or_404
from .models import BlogSettings

def get_settings(user=None):
    """
    Helper function to get blog settings.
    If no user is provided, returns None.
    """
    if not user:
        return None
    try:
        return BlogSettings.objects.get(user=user)
    except BlogSettings.DoesNotExist:
        return None

import datetime
import os
import json
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.http import JsonResponse
from django.contrib.auth.models import User
from .models import BlogSettings, Album, Photo, Post, Comment, Like
from .forms import BlogSettingsForm, AlbumForm, PhotoForm, UserRegistrationForm
from django.views.decorators.http import require_POST
import json
from django.contrib.auth import login, authenticate, logout
from django.contrib.auth.views import LoginView
from django.urls import reverse
from PIL import Image
from PIL.ExifTags import TAGS, GPSTAGS
import os
from django.http import Http404

def register(request):
    if request.method == 'POST':
        form = UserRegistrationForm(request.POST)
        if form.is_valid():
            form.save()
            messages.success(request, 'Registrazione completata! Ora puoi effettuare il login.')
            return redirect('login')
    else:
        form = UserRegistrationForm()
    return render(request, 'blog/register.html', {'form': form})

@login_required
def dashboard(request):
    try:
        settings = BlogSettings.objects.get(user=request.user)
    except BlogSettings.DoesNotExist:
        settings = BlogSettings.objects.create(user=request.user)
    
    albums = Album.objects.filter(user=request.user)
    return render(request, 'blog/dashboard.html', {
        'settings': settings, 
        'albums': albums,
        'show_welcome': not albums.exists()
    })

@login_required
def settings_view(request):
    settings, created = BlogSettings.objects.get_or_create(user=request.user)
    if request.method == 'POST':
        form = BlogSettingsForm(request.POST, request.FILES, instance=settings)
        if form.is_valid():
            settings = form.save()
            messages.success(request, 'Impostazioni aggiornate con successo!')
            if settings.is_published:
                messages.info(request, f'Il tuo blog è ora pubblico all\'indirizzo: /blog/{request.user.username}')
            return redirect('dashboard')
    else:
        form = BlogSettingsForm(instance=settings)
    return render(request, 'blog/settings.html', {'form': form})

@login_required
def album_create(request):
    if request.method == 'POST':
        form = AlbumForm(request.POST)
        if form.is_valid():
            album = form.save(commit=False)
            album.user = request.user
            album.save()
            messages.success(request, 'Album creato con successo!')
            return redirect('album_detail', pk=album.pk)
    else:
        form = AlbumForm()
    return render(request, 'blog/album_form.html', {'form': form})

@login_required
def album_detail(request, pk):
    album = get_object_or_404(Album, pk=pk, user=request.user)
    photos = album.photos.all()
    return render(request, 'blog/album_detail.html', {'album': album, 'photos': photos})

@login_required
@require_POST
def upload_photos(request, album_id):
    album = get_object_or_404(Album, id=album_id, user=request.user)
    if request.FILES.getlist('photos'):
        for uploaded_file in request.FILES.getlist('photos'):
            try:
                image = Image.open(uploaded_file)
                metadata = {}
                
                # Get basic image info
                metadata['format'] = image.format
                metadata['mode'] = image.mode
                metadata['size'] = image.size
                
                # Extract EXIF data
                if hasattr(image, '_getexif'):
                    exif = image._getexif()
                    if exif:
                        for tag_id, value in exif.items():
                            tag = TAGS.get(tag_id, tag_id)
                            
                            # Converti tipi non serializzabili in tipi serializzabili
                            if isinstance(value, bytes):
                                try:
                                    value = value.decode()
                                except UnicodeDecodeError:
                                    value = str(value)
                            # Gestisci il tipo IFDRational e altri tipi non serializzabili
                            elif not isinstance(value, (str, int, float, bool, list, dict, type(None))):
                                value = str(value)
                                
                            metadata[tag] = value
                        
                        # Extract camera specific info
                        camera_info = {}
                        if 'Make' in metadata:
                            camera_info['Marca'] = metadata['Make']
                        if 'Model' in metadata:
                            camera_info['Modello'] = metadata['Model']
                        if 'FNumber' in metadata:
                            camera_info['Apertura'] = f"f/{str(metadata['FNumber'])}"
                        if 'FocalLength' in metadata:
                            camera_info['Lunghezza Focale'] = f"{str(metadata['FocalLength'])}mm"
                        if 'ExposureTime' in metadata:
                            try:
                                exposure_time = float(str(metadata['ExposureTime']))
                                camera_info['Tempo Esposizione'] = f"1/{int(1/exposure_time)}s" if exposure_time > 0 else f"{exposure_time}s"
                            except (ValueError, TypeError, ZeroDivisionError):
                                camera_info['Tempo Esposizione'] = f"{str(metadata['ExposureTime'])}s"
                        if 'ISOSpeedRatings' in metadata:
                            camera_info['ISO'] = metadata['ISOSpeedRatings']
                        
                        metadata['CameraInfo'] = camera_info
                
                # Extract GPS info if available
                if 'GPSInfo' in metadata:
                    gps_info = {}
                    for key in metadata['GPSInfo'].keys():
                        decode = GPSTAGS.get(key, key)
                        gps_value = metadata['GPSInfo'][key]
                        
                        # Converti tipi non serializzabili in tipi serializzabili
                        if not isinstance(gps_value, (str, int, float, bool, list, dict, type(None))):
                            gps_value = str(gps_value)
                            
                        gps_info[decode] = gps_value
                    metadata['GPSInfo'] = gps_info
                
                # Create photo with metadata
                photo = Photo.objects.create(
                    album=album,
                    image=uploaded_file,
                    metadata=metadata
                )
            except Exception as e:
                print(f'Error processing {uploaded_file.name}: {str(e)}')
                continue
        return JsonResponse({'status': 'success'})
    return JsonResponse({'status': 'error'}, status=400)

@login_required
@require_POST
def delete_photo(request, photo_id):
    photo = get_object_or_404(Photo, id=photo_id, album__user=request.user)
    album_id = photo.album.id
    photo.delete()
    return JsonResponse({'status': 'success'})

@login_required
@require_POST
def update_photo(request, photo_id):
    photo = get_object_or_404(Photo, id=photo_id, album__user=request.user)
    data = json.loads(request.body)
    if 'caption' in data:
        photo.caption = data['caption']
    if 'description' in data:
        photo.description = data['description']
    photo.save()
    return JsonResponse({'status': 'success'})

@login_required
@require_POST
def update_photo_caption(request, photo_id):
    photo = get_object_or_404(Photo, id=photo_id, album__user=request.user)
    photo.caption = request.POST.get('caption', '')
    photo.save()
    messages.success(request, 'Didascalia aggiornata')
    return redirect('album_detail', pk=photo.album.pk)

@login_required
@require_POST
def delete_album(request, album_id):
    album = get_object_or_404(Album, id=album_id, user=request.user)
    album.delete()
    return JsonResponse({'status': 'success'})

def blog_view(request, username):
    blog_owner = get_object_or_404(User, username=username)
    # Only show albums if blog is published
    blog_settings = get_settings(blog_owner)
    if not blog_settings or not blog_settings.is_published:
        raise Http404("Blog non trovato")
    
    albums = Album.objects.filter(user=blog_owner).prefetch_related('photos')
    photos_data = []
    for album in albums:
        for photo in album.photos.all():
            metadata = photo.metadata or {}
            camera_info = metadata.get('CameraInfo', {})
            photo_data = {
                'id': photo.id,
                'album_id': album.id,
                'image_url': photo.image.url,
                'thumbnail_url': photo.image.url,
                'caption': photo.caption,
                'description': photo.description,
                'date_taken': metadata.get('DateTimeOriginal', 'Non disponibile'),
                'camera_model': camera_info.get('Modello', 'Non disponibile'),
                'lens_model': camera_info.get('LensModel', 'Non disponibile'),
                'focal_length': camera_info.get('Lunghezza Focale', 'Non disponibile'),
                'f_number': camera_info.get('Apertura', 'Non disponibile'),
                'exposure': camera_info.get('Tempo Esposizione', 'Non disponibile'),
                'iso': camera_info.get('ISO', 'Non disponibile'),
                'has_liked': request.user.is_authenticated and Like.objects.filter(photo=photo, user=request.user).exists(),
                'likes_count': photo.likes.count(),
                'comments_count': photo.comments.count()
            }
            photos_data.append(photo_data)

    context = {
        'blog_owner': blog_owner,
        'albums': albums,
        'photos_data': photos_data,
        'settings': get_settings()
    }
    return render(request, 'blog/blog_view.html', context)

def blog_view_compact(request, username):
    blog_owner = get_object_or_404(User, username=username)
    # Only show albums if blog is published
    blog_settings = get_settings(blog_owner)
    if not blog_settings or not blog_settings.is_published:
        raise Http404("Blog non trovato")
    
    albums = Album.objects.filter(user=blog_owner).prefetch_related('photos')
    photos_data = []
    for album in albums:
        for photo in album.photos.all():
            metadata = photo.metadata or {}
            camera_info = metadata.get('CameraInfo', {})
            photo_data = {
                'id': photo.id,
                'album_id': album.id,
                'album_title': album.title,  
                'image_url': photo.image.url,
                'thumbnail_url': photo.image.url,
                'caption': photo.caption,
                'description': photo.description,
                'date_taken': metadata.get('DateTimeOriginal', 'Non disponibile'),
                'camera_model': camera_info.get('Modello', 'Non disponibile'),
                'lens_model': camera_info.get('LensModel', 'Non disponibile'),
                'focal_length': camera_info.get('Lunghezza Focale', 'Non disponibile'),
                'f_number': camera_info.get('Apertura', 'Non disponibile'),
                'exposure': camera_info.get('Tempo Esposizione', 'Non disponibile'),
                'iso': camera_info.get('ISO', 'Non disponibile'),
                'has_liked': request.user.is_authenticated and Like.objects.filter(photo=photo, user=request.user).exists(),
                'likes_count': photo.likes.count(),
                'comments_count': photo.comments.count()
            }
            photos_data.append(photo_data)

    context = {
        'blog_owner': blog_owner,
        'albums': albums,
        'photos_data': photos_data,
        'settings': blog_settings
    }
    return render(request, 'blog/blog_view_compact.html', context)

def photo_detail_view(request, photo_id):
    photo = get_object_or_404(Photo, id=photo_id)
    context = {
        'photo': photo,
        'settings': get_settings()
    }
    return render(request, 'blog/photo_detail_page.html', context)

@login_required
@require_POST
def toggle_dark_mode(request):
    settings = get_object_or_404(BlogSettings, user=request.user)
    settings.dark_mode = not settings.dark_mode
    settings.save()
    return JsonResponse({'dark_mode': settings.dark_mode})

def home(request):
    if request.user.is_authenticated:
        if request.user.is_staff:
            return redirect('/admin/')
        return redirect('dashboard')
    
    # Get all published blogs
    published_blogs = BlogSettings.objects.filter(is_published=True)
    return render(request, 'blog/home.html', {'published_blogs': published_blogs})

def get_photo_metadata(request, photo_id):
    """
    API endpoint per recuperare i metadati di una foto.
    Accessibile sia dagli utenti autenticati che dagli utenti anonimi
    che visualizzano un blog pubblico.
    """
    photo = get_object_or_404(Photo, id=photo_id)
    
    # Verifica se l'utente ha il permesso di visualizzare i metadati
    if request.user.is_authenticated and request.user == photo.album.user:
        # L'utente è il proprietario della foto
        has_permission = True
    else:
        # Verifica se la foto appartiene a un blog pubblicato
        has_permission = BlogSettings.objects.filter(
            user=photo.album.user,
            is_published=True
        ).exists()
    
    if not has_permission:
        return JsonResponse({'error': 'Non autorizzato'}, status=403)
    
    return JsonResponse({
        'id': photo.id,
        'caption': photo.caption,
        'description': photo.description,
        'metadata': photo.metadata
    })

class CustomLoginView(LoginView):
    template_name = 'registration/login.html'
    
    def form_valid(self, form):
        response = super().form_valid(form)
        if self.request.user.is_staff:
            return redirect('/admin/')
        elif not hasattr(self.request.user, 'blogsettings'):
            return redirect('settings')
        return response

    def get_success_url(self):
        return reverse('dashboard')

@login_required
def post_create(request):
    if request.method == 'POST':
        title = request.POST.get('title')
        content = request.POST.get('content')
        published = 'publish' in request.POST
        
        if title and content:
            post = Post(
                user=request.user,
                title=title,
                content=content,
                published=published
            )
            post.save()
            messages.success(request, 'Post creato con successo!')
            return redirect('post_list')
    
    return render(request, 'blog/post_create.html')

@login_required
def post_edit(request, slug):
    post = get_object_or_404(Post, slug=slug, user=request.user)
    
    if request.method == 'POST':
        title = request.POST.get('title')
        content = request.POST.get('content')
        published = 'publish' in request.POST
        
        if title and content:
            post.title = title
            post.content = content
            post.published = published
            post.save()
            return redirect('post_detail', username=request.user.username, slug=post.slug)
    
    return render(request, 'blog/post_edit.html', {'post': post})

@login_required
def post_delete(request, slug):
    post = get_object_or_404(Post, slug=slug, user=request.user)
    
    if request.method == 'POST':
        # Se c'è un'immagine, la eliminiamo
        if post.featured_image:
            if os.path.isfile(post.featured_image.path):
                os.remove(post.featured_image.path)
        post.delete()
        return redirect('post_list')
    
    return render(request, 'blog/post_delete.html', {'post': post})

@login_required
def post_list(request):
    posts = Post.objects.filter(user=request.user).order_by('-created_at')
    return render(request, 'blog/post_list.html', {'posts': posts})

def post_detail(request, username, slug):
    user = get_object_or_404(User, username=username)
    post = get_object_or_404(Post, slug=slug, user=user)
    
    # Verifica se l'utente può vedere il post
    if not post.published and request.user != user:
        raise Http404("Post non trovato")
    
    return render(request, 'blog/post_detail.html', {'post': post})

def blog_posts(request, username):
    user = get_object_or_404(User, username=username)
    settings = get_object_or_404(BlogSettings, user=user)
    
    # Verifica se il blog è pubblicato
    if not settings.is_published and request.user != user:
        raise Http404("Blog non trovato")
    
    # Se l'utente è autenticato e sta visualizzando il proprio blog, mostra tutti i post
    # altrimenti mostra solo quelli pubblicati
    if request.user.is_authenticated and request.user == user:
        posts = Post.objects.filter(user=user).order_by('-created_at')
    else:
        posts = Post.objects.filter(user=user, published=True).order_by('-created_at')
    
    return render(request, 'blog/blog_posts.html', {
        'posts': posts,
        'settings': settings,
        'blog_user': user
    })

def public_album_detail(request, username, pk):
    """
    Vista per visualizzare i dettagli di un album pubblico.
    Accessibile a tutti gli utenti, anche non autenticati.
    """
    user = get_object_or_404(User, username=username)
    blog_settings = get_object_or_404(BlogSettings, user=user, is_published=True)
    album = get_object_or_404(Album, pk=pk, user=user)
    photos = album.photos.all()
    
    # Ottieni i like dell'utente corrente se autenticato
    liked_photos = []
    if request.user.is_authenticated:
        user_likes = Like.objects.filter(user=request.user, photo__in=photos).values_list('photo_id', flat=True)
        liked_photos = list(user_likes)
    
    # Prepara i dati per le foto, inclusi i like
    photos_data = []
    for photo in photos:
        has_liked = False
        if request.user.is_authenticated:
            has_liked = photo.likes.filter(user=request.user).exists()
        
        # Estrai i metadati della foto
        metadata = photo.metadata or {}
        
        photos_data.append({
            'id': photo.id,
            'caption': photo.caption or 'Senza titolo',
            'description': photo.description or '',
            'date_taken': metadata.get('date_taken', 'Non disponibile'),
            'camera_model': metadata.get('camera_model', 'Non disponibile'),
            'lens_model': metadata.get('lens_model', 'Non disponibile'),
            'focal_length': metadata.get('focal_length', 'Non disponibile'),
            'exposure': metadata.get('exposure', 'Non disponibile'),
            'f_number': metadata.get('f_number', 'Non disponibile'),
            'iso': metadata.get('iso', 'Non disponibile'),
            'likes_count': photo.likes.count(),
            'has_liked': has_liked,
            'image_url': photo.image.url,
        })
    
    return render(request, 'blog/public_album_detail.html', {
        'settings': blog_settings,
        'album': album,
        'photos': photos,
        'photos_data': photos_data, # Pass the list directly
        'blog_user': user,
        'blog_settings': blog_settings,
        'liked_photos': liked_photos
    })

def custom_logout(request):
    """
    Vista personalizzata per il logout che reindirizza alla home page
    e mostra un messaggio di conferma.
    """
    logout(request)
    messages.success(request, 'Logout effettuato con successo!')
    return redirect('home')

def all_blogs(request):
    """
    Vista per visualizzare tutti i blog pubblicati dagli utenti.
    Mostra una griglia con icona, titolo e tagline di ciascun blog.
    """
    # Ottieni tutti gli utenti che hanno un blog pubblicato
    published_blogs = BlogSettings.objects.filter(is_published=True).select_related('user')
    
    return render(request, 'blog/all_blogs.html', {
        'published_blogs': published_blogs
    })

@login_required
def toggle_like_photo(request, photo_id):
    """
    Vista per aggiungere o rimuovere un like a una foto.
    """
    photo = get_object_or_404(Photo, id=photo_id)
    like, created = Like.objects.get_or_create(
        user=request.user,
        photo=photo,
        defaults={'post': None}
    )
    
    # Se il like esisteva già, lo rimuoviamo
    if not created:
        like.delete()
        liked = False
    else:
        liked = True
    
    # Contiamo il numero totale di like
    like_count = Like.objects.filter(photo=photo).count()
    
    return JsonResponse({
        'liked': liked,
        'likeCount': like_count
    })

@login_required
def toggle_like_post(request, post_id):
    """
    Vista per aggiungere o rimuovere un like a un post.
    """
    post = get_object_or_404(Post, id=post_id)
    like, created = Like.objects.get_or_create(
        user=request.user,
        post=post,
        defaults={'photo': None}
    )
    
    # Se il like esisteva già, lo rimuoviamo
    if not created:
        like.delete()
        liked = False
    else:
        liked = True
    
    # Contiamo il numero totale di like
    like_count = Like.objects.filter(post=post).count()
    
    return JsonResponse({
        'liked': liked,
        'likeCount': like_count
    })

@login_required
def add_comment_photo(request, photo_id):
    """
    Vista per aggiungere un commento a una foto.
    """
    photo = get_object_or_404(Photo, id=photo_id)
    
    if request.method == 'POST':
        content = request.POST.get('content')
        if content:
            comment = Comment.objects.create(
                user=request.user,
                photo=photo,
                content=content
            )
            
            # Se la richiesta è AJAX, restituiamo i dati del commento in JSON
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return JsonResponse({
                    'id': comment.id,
                    'content': comment.content,
                    'username': comment.user.username,
                    'created_at': comment.created_at.strftime('%d/%m/%Y %H:%M')
                })
            
            # Altrimenti, redirect alla pagina della foto
            album = photo.album
            if album.user == request.user:
                return redirect('album_detail', pk=album.id)
            else:
                return redirect('public_album_detail', username=album.user.username, pk=album.id)
    
    # Se non è una richiesta POST o non c'è contenuto, restituiamo un errore
    return JsonResponse({'error': 'Contenuto del commento mancante'}, status=400)

@login_required
def add_comment_post(request, post_id):
    """
    Vista per aggiungere un commento a un post.
    """
    post = get_object_or_404(Post, id=post_id)
    
    if request.method == 'POST':
        content = request.POST.get('content')
        if content:
            comment = Comment.objects.create(
                user=request.user,
                post=post,
                content=content
            )
            
            # Se la richiesta è AJAX, restituiamo i dati del commento in JSON
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return JsonResponse({
                    'id': comment.id,
                    'content': comment.content,
                    'username': comment.user.username,
                    'created_at': comment.created_at.strftime('%d/%m/%Y %H:%M')
                })
            
            # Altrimenti, redirect alla pagina del post
            if post.user == request.user:
                return redirect('post_detail', username=post.user.username, slug=post.slug)
            else:
                return redirect('post_detail', username=post.user.username, slug=post.slug)
    
    # Se non è una richiesta POST o non c'è contenuto, restituiamo un errore
    return JsonResponse({'error': 'Contenuto del commento mancante'}, status=400)

@login_required
def delete_comment(request, comment_id):
    """
    Vista per eliminare un commento.
    """
    comment = get_object_or_404(Comment, id=comment_id)
    
    # Verifica che l'utente sia il proprietario del commento
    if comment.user != request.user:
        return JsonResponse({'error': 'Non sei autorizzato a eliminare questo commento'}, status=403)
    
    comment.delete()
    
    return JsonResponse({'success': True})

def get_photo_comments(request, photo_id):
    """
    API endpoint per recuperare i commenti di una foto.
    Accessibile sia dagli utenti autenticati che dagli utenti anonimi.
    """
    photo = get_object_or_404(Photo, id=photo_id)
    comments = Comment.objects.filter(photo=photo).order_by('-created_at')
    
    comments_data = []
    for comment in comments:
        comments_data.append({
            'id': comment.id,
            'user': comment.user.username,
            'content': comment.content,
            'created_at': comment.created_at.strftime('%d/%m/%Y %H:%M'),
            'is_owner': request.user.is_authenticated and request.user == comment.user
        })
    
    return JsonResponse({
        'comments': comments_data
    })

def get_post_content(request):
    """
    API endpoint per recuperare il contenuto di un post.
    Utilizzato per caricare il contenuto nel modale mantenendo la formattazione.
    """
    post_id = request.GET.get('post_id')
    if not post_id:
        return JsonResponse({'error': 'Post ID non fornito'}, status=400)
    
    try:
        post = Post.objects.get(id=post_id)
        return JsonResponse({
            'content': post.content,
            'title': post.title,
            'created_at': post.created_at.strftime('%d/%m/%Y %H:%M')
        })
    except Post.DoesNotExist:
        return JsonResponse({'error': 'Post non trovato'}, status=404)
