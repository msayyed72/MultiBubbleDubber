/**
 * Handle processing status updates and visualizations
 */

document.addEventListener('DOMContentLoaded', () => {
    // Animation durations
    const ANIMATION_DURATION = 2000; // 2 seconds for stage transitions
    
    // Map of progress thresholds to stage names
    const PROGRESS_STAGES = [
        { threshold: 0, stage: 'transcribing' },
        { threshold: 30, stage: 'translating' },
        { threshold: 50, stage: 'generating' },
        { threshold: 70, stage: 'merging' }
    ];
    
    // Stage elements
    const stages = {
        transcribing: document.getElementById('stage-transcribing'),
        translating: document.getElementById('stage-translating'),
        generating: document.getElementById('stage-generating'),
        merging: document.getElementById('stage-merging')
    };
    
    /**
     * Animate the progress bar
     * @param {number} currentProgress - Current progress percentage
     * @param {number} targetProgress - Target progress percentage
     */
    window.animateProgress = function(currentProgress, targetProgress) {
        const progressBar = document.getElementById('progress-bar');
        const duration = ANIMATION_DURATION * (targetProgress - currentProgress) / 100;
        
        // Use GSAP for smooth animation
        gsap.to(progressBar, {
            width: `${targetProgress}%`,
            duration: duration / 1000, // Convert to seconds for GSAP
            ease: 'power2.out',
            onUpdate: function() {
                const progress = Math.round(gsap.getProperty(progressBar, 'width') / progressBar.parentNode.offsetWidth * 100);
                progressBar.setAttribute('aria-valuenow', progress);
                
                // Update current stage based on progress
                updateCurrentStage(progress);
            }
        });
    };
    
    /**
     * Update the current processing stage based on progress
     * @param {number} progress - Current progress percentage
     */
    function updateCurrentStage(progress) {
        let currentStage = PROGRESS_STAGES[0].stage;
        
        // Find the current stage based on progress
        for (let i = PROGRESS_STAGES.length - 1; i >= 0; i--) {
            if (progress >= PROGRESS_STAGES[i].threshold) {
                currentStage = PROGRESS_STAGES[i].stage;
                break;
            }
        }
        
        // Update stage UI
        updateStageUI(currentStage, progress);
    }
    
    /**
     * Update the stage UI elements
     * @param {string} currentStage - Current stage name
     * @param {number} progress - Current progress percentage
     */
    function updateStageUI(currentStage, progress) {
        // The order of stages
        const stageOrder = ['transcribing', 'translating', 'generating', 'merging'];
        const currentIndex = stageOrder.indexOf(currentStage);
        
        stageOrder.forEach((stage, index) => {
            if (index < currentIndex) {
                // Previous stages are completed
                completeStage(stage);
            } else if (index === currentIndex) {
                // Current stage is active
                activateStage(stage);
            } else {
                // Future stages are inactive
                resetStage(stage);
            }
        });
    }
    
    /**
     * Mark a stage as completed
     * @param {string} stageName - Name of the stage to complete
     */
    function completeStage(stageName) {
        const stage = stages[stageName];
        if (!stage) return;
        
        // Add completed class
        stage.classList.add('completed');
        stage.classList.remove('active');
        
        // Update icon to check mark
        const statusElement = stage.querySelector('.stage-status');
        statusElement.innerHTML = '<i class="fas fa-check-circle fa-lg text-success"></i>';
    }
    
    /**
     * Mark a stage as active
     * @param {string} stageName - Name of the stage to activate
     */
    function activateStage(stageName) {
        const stage = stages[stageName];
        if (!stage) return;
        
        // Add active class
        stage.classList.add('active');
        stage.classList.remove('completed');
        
        // Show spinner
        const statusElement = stage.querySelector('.stage-status');
        statusElement.innerHTML = '<div class="spinner-border text-primary" role="status"></div>';
        
        // Add pulsing animation
        gsap.to(stage, {
            scale: 1.02,
            duration: 0.5,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut'
        });
    }
    
    /**
     * Reset a stage to its initial state
     * @param {string} stageName - Name of the stage to reset
     */
    function resetStage(stageName) {
        const stage = stages[stageName];
        if (!stage) return;
        
        // Remove all state classes
        stage.classList.remove('active', 'completed', 'failed');
        
        // Reset animation
        gsap.killTweensOf(stage);
        gsap.set(stage, { scale: 1 });
        
        // Show waiting spinner
        const statusElement = stage.querySelector('.stage-status');
        statusElement.innerHTML = '<div class="spinner-border text-light" role="status"></div>';
    }
    
    /**
     * Mark a stage as failed
     * @param {string} stageName - Name of the stage that failed
     */
    window.failStage = function(stageName) {
        const stage = stages[stageName];
        if (!stage) return;
        
        // Add failed class
        stage.classList.add('failed');
        stage.classList.remove('active', 'completed');
        
        // Update icon to error
        const statusElement = stage.querySelector('.stage-status');
        statusElement.innerHTML = '<i class="fas fa-times-circle fa-lg text-danger"></i>';
        
        // Stop any animations
        gsap.killTweensOf(stage);
        gsap.set(stage, { scale: 1 });
    };
    
    /**
     * Update status message with typing effect
     * @param {string} message - Status message to display
     */
    window.updateStatusMessage = function(message) {
        const statusElement = document.getElementById('processing-status-message');
        if (!statusElement) return;
        
        // Clear current text
        const currentText = statusElement.textContent;
        statusElement.textContent = '';
        
        // Type new text with GSAP
        let i = 0;
        gsap.to({}, {
            duration: 0.05 * message.length,
            onUpdate: function() {
                const progress = Math.min(1, this.progress() * 2); // Double speed for first half
                const targetIndex = Math.floor(message.length * progress);
                if (i < targetIndex) {
                    i = targetIndex;
                    statusElement.textContent = message.slice(0, i);
                }
            }
        });
    };
});
