/**
 * Animated custom cursor effect - futuristic style
 */

document.addEventListener('DOMContentLoaded', () => {
    const cursorDot = document.querySelector('.cursor-dot');
    const cursorOutline = document.querySelector('.cursor-dot-outline');
    
    if (!cursorDot || !cursorOutline) return;
    
    // Variables to store cursor position
    let mouseX = 0;
    let mouseY = 0;
    
    // Add initial fade-in
    setTimeout(() => {
        cursorDot.style.opacity = 1;
        cursorOutline.style.opacity = 1;
    }, 500);
    
    // Track mouse position and update cursor elements
    const updateCursorPosition = (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        
        // Update dot position immediately
        cursorDot.style.transform = `translate(${mouseX}px, ${mouseY}px)`;
        
        // Add slight delay to outline for trail effect
        setTimeout(() => {
            cursorOutline.style.transform = `translate(${mouseX}px, ${mouseY}px)`;
        }, 50);
    };
    
    // Add mousemove event listener
    window.addEventListener('mousemove', updateCursorPosition);
    
    // Add interaction effects
    const addCursorInteraction = () => {
        // Collect all interactive elements
        const interactiveElements = document.querySelectorAll('a, button, input, select, .upload-area, .feature-card, .step-item, .testimonial-card');
        
        interactiveElements.forEach(el => {
            // Hover effect - enlarge outline and add glow
            el.addEventListener('mouseenter', () => {
                cursorOutline.style.width = '50px';
                cursorOutline.style.height = '50px';
                cursorOutline.style.backgroundColor = 'rgba(67, 97, 238, 0.1)';
                cursorOutline.style.boxShadow = '0 0 20px rgba(67, 97, 238, 0.5)';
                cursorDot.style.backgroundColor = 'var(--accent-color)';
                cursorDot.style.boxShadow = '0 0 15px rgba(247, 37, 133, 0.7)';
            });
            
            // Mouse leave - return to normal
            el.addEventListener('mouseleave', () => {
                cursorOutline.style.width = '30px';
                cursorOutline.style.height = '30px';
                cursorOutline.style.backgroundColor = 'rgba(67, 97, 238, 0.2)';
                cursorOutline.style.boxShadow = 'none';
                cursorDot.style.backgroundColor = 'var(--primary-color)';
                cursorDot.style.boxShadow = 'none';
            });
            
            // Click effect
            el.addEventListener('mousedown', () => {
                cursorDot.style.transform = `translate(${mouseX}px, ${mouseY}px) scale(0.5)`;
                cursorOutline.style.transform = `translate(${mouseX}px, ${mouseY}px) scale(0.8)`;
                cursorOutline.style.backgroundColor = 'rgba(67, 97, 238, 0.3)';
                
                // Add ripple effect on click
                createRippleEffect(mouseX, mouseY);
            });
            
            el.addEventListener('mouseup', () => {
                cursorDot.style.transform = `translate(${mouseX}px, ${mouseY}px) scale(1)`;
                cursorOutline.style.transform = `translate(${mouseX}px, ${mouseY}px) scale(1)`;
                cursorOutline.style.backgroundColor = 'rgba(67, 97, 238, 0.2)';
            });
        });
    };
    
    // Create ripple effect on click
    const createRippleEffect = (x, y) => {
        const ripple = document.createElement('div');
        ripple.className = 'cursor-ripple';
        ripple.style.left = `${x}px`;
        ripple.style.top = `${y}px`;
        document.body.appendChild(ripple);
        
        // Remove ripple after animation completes
        setTimeout(() => {
            ripple.remove();
        }, 1000);
    };
    
    // Add scan lines effect for futuristic look
    const addScanLinesEffect = () => {
        const scanLines = document.createElement('div');
        scanLines.className = 'scan-lines';
        document.body.appendChild(scanLines);
    };
    
    // Hide cursor on mobile devices
    const checkDevice = () => {
        if (window.innerWidth <= 768) {
            cursorDot.style.opacity = 0;
            cursorOutline.style.opacity = 0;
            
            // Remove any scan lines on mobile
            const scanLines = document.querySelector('.scan-lines');
            if (scanLines) scanLines.style.opacity = 0;
        } else {
            cursorDot.style.opacity = 1;
            cursorOutline.style.opacity = 1;
            
            // Show scan lines on desktop
            const scanLines = document.querySelector('.scan-lines');
            if (scanLines) scanLines.style.opacity = 0.03;
        }
    };
    
    window.addEventListener('resize', checkDevice);
    checkDevice();
    
    // Initialize interactions
    addCursorInteraction();
    addScanLinesEffect();
    
    // Add floating particles effect
    const addParticlesEffect = () => {
        const particlesContainer = document.createElement('div');
        particlesContainer.className = 'particles-container';
        document.body.appendChild(particlesContainer);
        
        // Create particles
        for (let i = 0; i < 30; i++) {
            const particle = document.createElement('div');
            particle.className = 'floating-particle';
            
            // Random size
            const size = Math.random() * 5 + 1;
            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            
            // Random position
            particle.style.left = `${Math.random() * 100}vw`;
            particle.style.top = `${Math.random() * 100}vh`;
            
            // Random animation duration
            const duration = Math.random() * 20 + 10;
            particle.style.animationDuration = `${duration}s`;
            
            // Random animation delay
            const delay = Math.random() * 10;
            particle.style.animationDelay = `${delay}s`;
            
            // Random opacity
            particle.style.opacity = Math.random() * 0.5 + 0.1;
            
            particlesContainer.appendChild(particle);
        }
    };
    
    addParticlesEffect();
});