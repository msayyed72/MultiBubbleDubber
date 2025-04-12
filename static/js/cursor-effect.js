/**
 * Animated custom cursor effect
 */

document.addEventListener('DOMContentLoaded', () => {
    const cursorDot = document.querySelector('.cursor-dot');
    const cursorOutline = document.querySelector('.cursor-dot-outline');
    
    if (!cursorDot || !cursorOutline) return;
    
    // Add initial fade-in
    setTimeout(() => {
        cursorDot.style.opacity = 1;
        cursorOutline.style.opacity = 1;
    }, 500);
    
    // Track mouse position and update cursor elements
    const updateCursorPosition = (e) => {
        const posX = e.clientX;
        const posY = e.clientY;
        
        // Update dot position immediately
        cursorDot.style.transform = `translate(${posX}px, ${posY}px)`;
        
        // Add slight delay to outline for trail effect
        setTimeout(() => {
            cursorOutline.style.transform = `translate(${posX}px, ${posY}px)`;
        }, 50);
    };
    
    // Add mousemove event listener
    window.addEventListener('mousemove', updateCursorPosition);
    
    // Add interaction effects
    const addCursorInteraction = () => {
        // Collect all interactive elements
        const interactiveElements = document.querySelectorAll('a, button, input, select, .upload-area, .feature-card, .step-item, .testimonial-card');
        
        interactiveElements.forEach(el => {
            // Hover effect - enlarge outline
            el.addEventListener('mouseenter', () => {
                cursorOutline.style.width = '50px';
                cursorOutline.style.height = '50px';
                cursorOutline.style.backgroundColor = 'rgba(67, 97, 238, 0.1)';
                cursorDot.style.backgroundColor = 'var(--primary-color)';
            });
            
            // Mouse leave - return to normal
            el.addEventListener('mouseleave', () => {
                cursorOutline.style.width = '30px';
                cursorOutline.style.height = '30px';
                cursorOutline.style.backgroundColor = 'rgba(67, 97, 238, 0.2)';
                cursorDot.style.backgroundColor = 'var(--primary-color)';
            });
            
            // Click effect
            el.addEventListener('mousedown', () => {
                cursorDot.style.transform = `translate(${posX}px, ${posY}px) scale(0.5)`;
                cursorOutline.style.transform = `translate(${posX}px, ${posY}px) scale(0.8)`;
                cursorOutline.style.backgroundColor = 'rgba(67, 97, 238, 0.3)';
            });
            
            el.addEventListener('mouseup', () => {
                cursorDot.style.transform = `translate(${posX}px, ${posY}px) scale(1)`;
                cursorOutline.style.transform = `translate(${posX}px, ${posY}px) scale(1)`;
                cursorOutline.style.backgroundColor = 'rgba(67, 97, 238, 0.2)';
            });
        });
    };
    
    // Hide cursor on mobile devices
    const checkDevice = () => {
        if (window.innerWidth <= 768) {
            cursorDot.style.opacity = 0;
            cursorOutline.style.opacity = 0;
        } else {
            cursorDot.style.opacity = 1;
            cursorOutline.style.opacity = 1;
        }
    };
    
    window.addEventListener('resize', checkDevice);
    checkDevice();
    
    // Initialize interaction
    addCursorInteraction();
});