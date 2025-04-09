/**
 * Integration between slideshow and VR viewer
 * Ensures VR buttons are added to slideshow slides
 */

document.addEventListener('DOMContentLoaded', function() {
    // Function to add VR buttons to slideshow slides
    function addVRButtonsToSlideshow() {
        if (!window.vrPhotoViewer) return;
        
        // Find all slideshow slides
        const slideshowSlides = document.querySelectorAll('.slideshow-slide');
        slideshowSlides.forEach(slide => {
            const img = slide.querySelector('img');
            if (img && !slide.querySelector('.vr-view-button')) {
                // Position the button in the slide
                slide.style.position = 'relative';
                window.vrPhotoViewer.addVRButtonToPhoto(slide, img.src);
            }
        });
    }
    
    // Add VR buttons to slideshow when it's opened
    const slideshowLayouts = document.querySelectorAll('.slideshow-layout, .fullscreen-slideshow');
    slideshowLayouts.forEach(layout => {
        // Use MutationObserver to detect when slideshow becomes visible
        const observer = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                if (mutation.attributeName === 'style' || mutation.attributeName === 'class') {
                    const isVisible = layout.style.display !== 'none' && !layout.classList.contains('d-none');
                    if (isVisible) {
                        setTimeout(addVRButtonsToSlideshow, 200);
                    }
                }
            });
        });
        
        observer.observe(layout, { attributes: true });
    });
    
    // Add VR buttons to active slide when navigating slideshow
    const prevButtons = document.querySelectorAll('.btn-slideshow-prev, .slideshow-prev');
    const nextButtons = document.querySelectorAll('.btn-slideshow-next, .slideshow-next');
    
    [...prevButtons, ...nextButtons].forEach(button => {
        button.addEventListener('click', () => {
            setTimeout(addVRButtonsToSlideshow, 200);
        });
    });
    
    // Initial check for slideshow
    setTimeout(addVRButtonsToSlideshow, 500);
});
