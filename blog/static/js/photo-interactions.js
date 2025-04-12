/**
 * Photo Interactions - Gestione di like, commenti e visualizzazioni
 */
$(document).ready(function() {
    // Variabili globali
    let currentPhotoId = 0;
    
    // Verifica se l'utente è autenticato
    let isAuthenticated = $('#auth-status').attr('data-is-authenticated') === 'true';
    console.log('User authentication status:', isAuthenticated);
    
    // Elementi DOM
    const $likeIcon = $('#likeIcon');
    const $likeCount = $('#likeCount');
    const $viewCount = $('#viewCount');
    const $commentCount = $('#commentCount');
    const $commentsContainer = $('#comments-container');
    const $commentText = $('#comment-text');
    const $submitComment = $('#submit-comment');
    
    // Gestione click sull'icona like
    $(document).on('click', '#likeIcon', function() {
        toggleLike(currentPhotoId);
    });
    
    // Gestione invio commenti
    $submitComment.on('click', function() {
        const commentText = $commentText.val().trim();
        if (commentText && currentPhotoId > 0) {
            submitComment(currentPhotoId, commentText);
            return false; // Previene la sottomissione del form
        }
    });
    
    // Funzione per caricare le statistiche della foto
    window.loadPhotoStats = function(photoId) {
        currentPhotoId = photoId;
        
        // Chiamata AJAX per ottenere le statistiche
        $.ajax({
            url: `/api/photos/${photoId}/`,
            method: 'GET',
            success: function(data) {
                console.log('Photo stats loaded:', data);
                
                // Aggiorna le statistiche
                $viewCount.text(data.view_count || 0);
                $likeCount.text(data.likes_count || 0);
                $commentCount.text(data.comments_count || 0);
                
                // Aggiorna lo stato del pulsante like
                if (data.has_liked) {
                    $likeIcon.addClass('text-danger');
                } else {
                    $likeIcon.removeClass('text-danger');
                }
            },
            error: function(xhr, status, error) {
                console.error('Error loading photo stats:', error);
            }
        });
    };
    
    // Funzione per caricare i commenti
    window.loadComments = function(photoId) {
        currentPhotoId = photoId;
        $commentsContainer.html('<p style="text-align: center; color: #aaa;">Caricamento commenti...</p>');
        
        // Chiamata AJAX per ottenere i commenti
        $.ajax({
            url: `/photo/${photoId}/comments/`,
            method: 'GET',
            success: function(data) {
                console.log('Comments loaded:', data);
                
                if (data.comments && data.comments.length > 0) {
                    let commentsHtml = '';
                    data.comments.forEach(function(comment) {
                        commentsHtml += `
                            <div class="comment" style="margin-bottom: 8px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 8px;">
                                <div style="display: flex; justify-content: space-between; margin-bottom: 3px;">
                                    <strong style="color: #ddd; font-size: 0.9em;">${comment.user}</strong>
                                    <span style="color: #999; font-size: 0.8em;">${comment.created_at}</span>
                                </div>
                                <p style="margin: 0; color: #eee; font-size: 0.9em;">${comment.content}</p>
                            </div>
                        `;
                    });
                    $commentsContainer.html(commentsHtml);
                    
                    // Aggiorna il conteggio dei commenti
                    $commentCount.text(data.comments.length);
                } else {
                    $commentsContainer.html('<p style="text-align: center; color: #aaa; font-size: 0.9em;">Nessun commento ancora.</p>');
                    $commentCount.text('0');
                }
            },
            error: function(xhr, status, error) {
                console.error('Error loading comments:', error);
                $commentsContainer.html('<p style="text-align: center; color: #aaa; font-size: 0.9em;">Errore nel caricamento dei commenti.</p>');
            }
        });
    };
    
    // Funzione per aggiungere/rimuovere like
    function toggleLike(photoId) {
        console.log('Toggling like for photo ID:', photoId);
        
        $.ajax({
            url: `/photo/${photoId}/like/`,
            method: 'POST',
            headers: {
                'X-CSRFToken': $('meta[name="csrf-token"]').attr('content')
            },
            success: function(response) {
                console.log('Like response:', response);
                
                // Aggiorna il conteggio dei like
                $likeCount.text(response.likes_count);
                
                // Aggiorna lo stato del pulsante like
                if (response.liked) {
                    $likeIcon.addClass('text-danger');
                } else {
                    $likeIcon.removeClass('text-danger');
                }
            },
            error: function(xhr, status, error) {
                console.error('Error toggling like:', error);
                
                // Se l'errore è dovuto all'autenticazione (status 401 o 403)
                if (xhr.status === 401 || xhr.status === 403) {
                    alert('Devi accedere per mettere like alle foto');
                } else {
                    alert('Si è verificato un errore. Riprova più tardi.');
                }
            }
        });
    }
    
    // Funzione per inviare un commento
    function submitComment(photoId, commentText) {
        $submitComment.prop('disabled', true).text('Invio in corso...');
        
        $.ajax({
            url: `/photo/${photoId}/comment/`,
            method: 'POST',
            data: {
                'comment': commentText,
                'csrfmiddlewaretoken': $('meta[name="csrf-token"]').attr('content')
            },
            success: function(response) {
                console.log('Comment response:', response);
                
                // Pulisce il campo di input
                $commentText.val('');
                
                // Ricarica i commenti per mostrare il nuovo commento
                loadComments(photoId);
                
                // Aggiorna il conteggio dei commenti
                $commentCount.text(response.comments_count);
                
                // Riabilita il pulsante di invio
                $submitComment.prop('disabled', false).text('Invia commento');
            },
            error: function(xhr, status, error) {
                console.error('Error submitting comment:', error);
                alert('Si è verificato un errore nell\'invio del commento. Riprova più tardi.');
                
                // Riabilita il pulsante di invio
                $submitComment.prop('disabled', false).text('Invia commento');
            }
        });
    }
});
