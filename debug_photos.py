#!/usr/bin/env python
import os
import django

# Configura l'ambiente Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'photoblog.settings')
django.setup()

from blog.models import Album, Photo
from django.contrib.auth.models import User

def debug_photos():
    """
    Script di debug per verificare le foto nel database e i loro percorsi
    """
    print("\n=== DEBUG PHOTOS SCRIPT ===\n")
    
    # Verifica tutti gli utenti
    users = User.objects.all()
    print(f"Utenti nel sistema: {users.count()}")
    
    for user in users:
        print(f"\nUtente: {user.username} (ID: {user.id})")
        
        # Verifica gli album dell'utente
        albums = Album.objects.filter(user=user)
        print(f"  Album: {albums.count()}")
        
        for album in albums:
            print(f"  - Album: {album.title} (ID: {album.id})")
            
            # Verifica le foto nell'album
            photos = Photo.objects.filter(album=album)
            print(f"    Foto: {photos.count()}")
            
            for photo in photos:
                # Verifica se il file esiste fisicamente
                file_exists = os.path.exists(photo.image.path) if photo.image else False
                file_size = os.path.getsize(photo.image.path) if file_exists else 0
                
                print(f"    - Foto ID: {photo.id}")
                print(f"      URL: {photo.image.url}")
                print(f"      Path: {photo.image.path}")
                print(f"      Esiste: {file_exists}")
                print(f"      Dimensione: {file_size} bytes")
                print(f"      Data caricamento: {photo.upload_date}")

if __name__ == "__main__":
    debug_photos()
