from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from django.utils.text import slugify
from django.urls import reverse
import os

# Create your models here.

class BlogSettings(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    blog_name = models.CharField(max_length=200, default='My Photo Blog')
    tagline = models.CharField(max_length=500, blank=True)
    site_icon = models.ImageField(upload_to='site_icons/', blank=True, help_text='Icona del profilo utente')
    symbol_icon = models.ImageField(upload_to='symbol_icons/', blank=True, help_text='Icona simbolo personalizzata')
    is_published = models.BooleanField(default=False)
    dark_mode = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class Album(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title

class Photo(models.Model):
    album = models.ForeignKey(Album, on_delete=models.CASCADE, related_name='photos')
    image = models.ImageField(upload_to='photos/')
    caption = models.CharField(max_length=200, blank=True)
    description = models.TextField(blank=True)
    upload_date = models.DateTimeField(auto_now_add=True)
    metadata = models.JSONField(default=dict, blank=True)
    view_count = models.PositiveIntegerField(default=0, help_text='Numero di visualizzazioni della foto')

    def delete(self, *args, **kwargs):
        # Delete the image file when deleting the Photo object
        if self.image:
            if os.path.isfile(self.image.path):
                os.remove(self.image.path)
        super().delete(*args, **kwargs)

    class Meta:
        ordering = ['-upload_date']

    def __str__(self):
        return f"Photo in {self.album.title} - {self.upload_date}"

class Post(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    title = models.CharField(max_length=200)
    slug = models.SlugField(max_length=200, unique=True)
    content = models.TextField()
    featured_image = models.ImageField(upload_to='blog_images/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    published = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['-created_at']
        
    def __str__(self):
        return self.title
    
    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)
        super().save(*args, **kwargs)
    
    def get_absolute_url(self):
        return reverse('post_detail', kwargs={'slug': self.slug})

class Comment(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    post = models.ForeignKey(Post, on_delete=models.CASCADE, null=True, blank=True, related_name='comments')
    photo = models.ForeignKey(Photo, on_delete=models.CASCADE, null=True, blank=True, related_name='comments')
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        
    def __str__(self):
        if self.post:
            return f"Commento di {self.user.username} su {self.post.title}"
        else:
            return f"Commento di {self.user.username} su una foto"

class Like(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    post = models.ForeignKey(Post, on_delete=models.CASCADE, null=True, blank=True, related_name='likes')
    photo = models.ForeignKey(Photo, on_delete=models.CASCADE, null=True, blank=True, related_name='likes')
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = [['user', 'post'], ['user', 'photo']]
        ordering = ['-created_at']
        
    def __str__(self):
        if self.post:
            return f"Like di {self.user.username} su {self.post.title}"
        else:
            return f"Like di {self.user.username} su una foto"
