from django.urls import path
from . import views
from django.contrib.auth.views import LogoutView
from .views import CustomLoginView

urlpatterns = [
    path('', views.home, name='home'),
    path('login/', CustomLoginView.as_view(template_name='blog/login.html'), name='login'),
    path('logout/', views.custom_logout, name='logout'),
    path('register/', views.register, name='register'),
    path('dashboard/', views.dashboard, name='dashboard'),
    path('settings/', views.settings_view, name='settings'),
    path('album/create/', views.album_create, name='album_create'),
    path('album/<int:pk>/', views.album_detail, name='album_detail'),
    path('album/<int:album_id>/upload/', views.upload_photos, name='upload_photos'),
    path('album/<int:album_id>/delete/', views.delete_album, name='delete_album'),
    path('photo/<int:photo_id>/delete/', views.delete_photo, name='delete_photo'),
    path('photo/<int:photo_id>/update/', views.update_photo, name='update_photo'),
    path('toggle-dark-mode/', views.toggle_dark_mode, name='toggle_dark_mode'),
    path('blog/<str:username>/', views.blog_view_compact, name='blog_view'),
    path('photos/<int:photo_id>/update-caption/', views.update_photo_caption, name='update_photo_caption'),
    path('api/photo/<int:photo_id>/metadata/', views.get_photo_metadata, name='get_photo_metadata'),
    
    # Post URLs
    path('posts/', views.post_list, name='post_list'),
    path('post/create/', views.post_create, name='post_create'),
    path('post/<slug:slug>/edit/', views.post_edit, name='post_edit'),
    path('post/<slug:slug>/delete/', views.post_delete, name='post_delete'),
    
    # Public URLs
    path('blog/<str:username>/posts/', views.blog_posts, name='blog_posts'),
    path('blog/<str:username>/post/<slug:slug>/', views.post_detail, name='post_detail'),
    path('blog/<str:username>/album/<int:pk>/', views.public_album_detail, name='public_album_detail'),
    
    # Explore all blogs
    path('blogs/', views.all_blogs, name='all_blogs'),
    
    # Reactions (likes and comments)
    path('photo/<int:photo_id>/like/', views.toggle_like_photo, name='toggle_like_photo'),
    path('post/<int:post_id>/like/', views.toggle_like_post, name='toggle_like_post'),
    path('photo/<int:photo_id>/comment/', views.add_comment_photo, name='add_comment_photo'),
    path('post/<int:post_id>/comment/', views.add_comment_post, name='add_comment_post'),
    path('comment/<int:comment_id>/delete/', views.delete_comment, name='delete_comment'),
    path('photo/<int:photo_id>/comments/', views.get_photo_comments, name='get_photo_comments'),
]
