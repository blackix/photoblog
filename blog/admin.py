from django.contrib import admin
from .models import BlogSettings, Album, Photo

# Register your models here.

@admin.register(BlogSettings)
class BlogSettingsAdmin(admin.ModelAdmin):
    list_display = ('user', 'blog_name', 'is_published')
    list_filter = ('is_published',)
    search_fields = ('user__username', 'blog_name')

@admin.register(Album)
class AlbumAdmin(admin.ModelAdmin):
    list_display = ('title', 'user', 'created_at')
    list_filter = ('created_at',)
    search_fields = ('title', 'user__username')

@admin.register(Photo)
class PhotoAdmin(admin.ModelAdmin):
    list_display = ('album', 'caption', 'upload_date')
    list_filter = ('upload_date', 'album')
    search_fields = ('caption', 'description', 'album__title')
