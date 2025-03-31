from django import forms
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth.models import User
from .models import BlogSettings, Album, Photo

class UserRegistrationForm(UserCreationForm):
    email = forms.EmailField(required=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password1', 'password2']

    def save(self, commit=True):
        user = super().save(commit=commit)
        if commit:
            BlogSettings.objects.create(user=user)
        return user

class BlogSettingsForm(forms.ModelForm):
    class Meta:
        model = BlogSettings
        fields = ['blog_name', 'tagline', 'site_icon', 'is_published']
        widgets = {
            'blog_name': forms.TextInput(attrs={'class': 'form-control'}),
            'tagline': forms.TextInput(attrs={'class': 'form-control'}),
            'site_icon': forms.FileInput(attrs={'class': 'form-control-file'}),
            'is_published': forms.CheckboxInput(attrs={'class': 'form-check-input'}),
        }
        labels = {
            'is_published': 'Pubblica il blog',
        }
        help_texts = {
            'is_published': 'Quando attivo, il tuo blog sarà visibile pubblicamente all\'indirizzo /blog/il-tuo-username',
        }

class AlbumForm(forms.ModelForm):
    class Meta:
        model = Album
        fields = ['title', 'description']
        widgets = {
            'title': forms.TextInput(attrs={'class': 'form-control'}),
            'description': forms.Textarea(attrs={'class': 'form-control', 'rows': 3}),
        }

class PhotoForm(forms.ModelForm):
    class Meta:
        model = Photo
        fields = ['image', 'caption']
        widgets = {
            'caption': forms.TextInput(attrs={'class': 'form-control'}),
            'image': forms.FileInput(attrs={'class': 'form-control-file'}),
        }
