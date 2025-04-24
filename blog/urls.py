from django.urls import path
from . import views
from django.contrib.auth.views import LogoutView
from .views import CustomLoginView
from . import mobile_views

urlpatterns = [
    # URL standard che verranno gestiti con rilevamento mobile nelle viste
    path('', views.home, name='home'),
    path('blog/<str:username>/', views.blog_view_compact, name='blog_view'),
    
    # URL specifici per la versione mobile (accesso diretto)
    path('m/', mobile_views.mobile_home, name='mobile_home'),
    path('m/blog/<str:username>/', mobile_views.mobile_blog_view, name='mobile_blog_view'),
    path('m/explore/', mobile_views.mobile_explore, name='mobile_explore'),
    path('m/dashboard/', mobile_views.mobile_dashboard, name='mobile_dashboard'),
    path('m/settings/', mobile_views.mobile_settings, name='mobile_settings'),
    path('m/album/<int:pk>/', mobile_views.mobile_album_detail, name='mobile_album_detail'),
    path('m/album/create/', mobile_views.mobile_album_create, name='mobile_album_create'),
    path('m/album/<int:album_id>/upload/', mobile_views.mobile_upload_photos, name='mobile_upload_photos'),
    path('m/album/<int:album_id>/delete/', mobile_views.mobile_delete_album, name='mobile_delete_album'),
    path('m/album/<int:album_id>/rename/', mobile_views.mobile_rename_album, name='mobile_rename_album'),
    path('m/photo/<int:photo_id>/delete/', mobile_views.mobile_delete_photo, name='mobile_delete_photo'),
    path('m/posts/', mobile_views.mobile_post_list, name='mobile_post_list'),
    path('m/post/create/', mobile_views.mobile_post_create, name='mobile_post_create'),
    path('m/post/<slug:slug>/edit/', mobile_views.mobile_post_edit, name='mobile_post_edit'),
    path('m/blog/<str:username>/post/<slug:slug>/', mobile_views.mobile_post_detail, name='mobile_post_detail'),
    
    # API endpoints per la versione mobile
    path('api/blogs/', mobile_views.api_blogs, name='api_blogs'),
    path('api/photos/<int:photo_id>/', mobile_views.api_photo_detail, name='api_photo_detail'),
    path('api/random-photos/', views.api_random_photos, name='api_random_photos'),
    path('api/photos/<int:photo_id>/comments/', mobile_views.api_photo_comments, name='api_photo_comments'),
    
    # URL standard
    path('login/', CustomLoginView.as_view(template_name='blog/login.html'), name='login'),
    path('logout/', views.custom_logout, name='logout'),
    path('register/', views.register, name='register'),
    path('dashboard/', views.dashboard, name='dashboard'),
    path('settings/', views.settings_view, name='settings'),
    path('album/create/', views.album_create, name='album_create'),
    path('album/<int:pk>/', views.album_detail, name='album_detail'),
    path('album/<int:album_id>/upload/', views.upload_photos, name='upload_photos'),
    path('album/<int:album_id>/delete/', views.delete_album, name='delete_album'),
    path('album/<int:album_id>/rename/', views.rename_album, name='rename_album'),
    path('photo/<int:photo_id>/delete/', views.delete_photo, name='delete_photo'),
    path('photo/<int:photo_id>/update/', views.update_photo, name='update_photo'),
    # Rimosso URL duplicato per toggle_like
    path('toggle-dark-mode/', views.toggle_dark_mode, name='toggle_dark_mode'),
    path('photos/<int:photo_id>/update-caption/', views.update_photo_caption, name='update_photo_caption'),
    path('api/photo/<int:photo_id>/metadata/', views.get_photo_metadata, name='get_photo_metadata'),
    path('api/photo/<int:photo_id>/view/', views.photo_view_api, name='photo_view_api'),
    
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
    
    # Test carousel
    path('test-carousel/', views.test_carousel, name='test_carousel'),
    
    # Reactions (likes and comments)
    path('photo/<int:photo_id>/like/', views.toggle_like_photo, name='toggle_like_photo'),
    path('post/<int:post_id>/like/', views.toggle_like_post, name='toggle_like_post'),
    path('photo/<int:photo_id>/comment/', views.add_comment_photo, name='add_comment_photo'),
    path('post/<int:post_id>/comment/', views.add_comment_post, name='add_comment_post'),
    path('comment/<int:comment_id>/delete/', views.delete_comment, name='delete_comment'),
    path('photo/<int:photo_id>/comments/', views.get_photo_comments, name='get_photo_comments'),
    path('api/post/content/', views.get_post_content, name='get_post_content'),
]
