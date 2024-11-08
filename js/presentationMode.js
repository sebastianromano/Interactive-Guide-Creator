import { elements } from './domElements.js';
import { presentationSettings } from './settings.js';
import { animationUtils } from './utils.js';

export class PresentationMode {
    constructor(pointManager, description) {
        this.pointManager = pointManager;
        this.description = description;
        this.isPlaying = false;
        this.currentPointIndex = 0;
        this.animationFrame = null;
        this.currentText = '';
        this.targetText = '';
        this.textProgress = 0;
        this.lastFrameTime = 0;
    }

    start() {
        const points = this.pointManager.getPoints();
        if (points.length === 0) return;

        this.isPlaying = true;
        this.currentPointIndex = 0;

        // Hide points when starting presentation
        this.pointManager.setPointsVisibility(false);
        this.animateToNextPoint();
    }

    stop() {
        this.isPlaying = false;
        this.description.style.opacity = '0';

        // Reset zoom
        const img = elements.getUploadedImage();
        if (img) {
            img.style.transform = 'scale(1)';
            img.style.transformOrigin = 'center';
            img.style.transition = 'none'; // Reset transition
        }

        // Show points when stopping presentation
        this.pointManager.setPointsVisibility(true);

        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }

        // Reset any ongoing animations
        this.currentText = '';
        this.targetText = '';
        this.textProgress = 0;
    }

    async smoothAnimation(drawFrame, duration) {
        const startTime = performance.now();
        const frameInterval = 1000 / 60; // 60fps

        return new Promise(async (resolve) => {
            const animate = async () => {
                if (!this.isPlaying) {
                    resolve();
                    return;
                }

                const currentTime = performance.now();
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);

                await drawFrame(progress);

                if (progress < 1) {
                    const frameTime = performance.now();
                    const timeToNextFrame = Math.max(0, frameInterval - (frameTime - this.lastFrameTime));
                    this.lastFrameTime = frameTime;
                    this.animationFrame = setTimeout(animate, timeToNextFrame);
                } else {
                    resolve();
                }
            };

            animate();
        });
    }

    easeInOutCubic(x) {
        return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
    }

    async animateToNextPoint() {
        if (!this.isPlaying) return;

        const points = this.pointManager.getPoints();
        const point = points[this.currentPointIndex];
        const img = elements.getUploadedImage();
        if (!img) return;

        // Initial pause with current transform state
        await this.smoothAnimation(async (progress) => {
            // Don't reset transform here
        }, 500);

        // Start typewriter effect
        this.targetText = point.description;
        this.currentText = '';
        this.textProgress = 0;

        // Show description container
        this.description.style.opacity = '1';

        // Animate zoom with typewriter
        await this.smoothAnimation(async (progress) => {
            const easedProgress = this.easeInOutCubic(progress);

            // Update typewriter text
            this.textProgress = Math.min(progress * 1.5, 1); // Slightly faster than zoom
            this.currentText = this.targetText.slice(0, Math.floor(this.textProgress * this.targetText.length));
            this.description.textContent = this.currentText;

            if (point.type === 'area') {
                // For areas: zoom to exactly fit the selected area
                const scaleX = 100 / point.area.width;
                const scaleY = 100 / point.area.height;
                const scale = Math.min(scaleX, scaleY);

                const currentScale = 1 + (scale - 1) * easedProgress;
                img.style.transform = `scale(${currentScale})`;
                img.style.transformOrigin = `${point.area.left}% ${point.area.top}%`;
            } else {
                // For points: center on the point with fixed zoom scale
                const currentScale = 1 + (presentationSettings.zoomScale - 1) * easedProgress;
                img.style.transform = `scale(${currentScale})`;
                img.style.transformOrigin = `${point.x}% ${point.y}%`;
            }

            img.style.transition = `transform ${presentationSettings.zoomDuration}ms ease-in-out`;

        }, presentationSettings.zoomDuration);

        // Hold at zoomed state
        await this.smoothAnimation(async (progress) => {
            // Keep current transform state
        }, presentationSettings.pointDisplayTime);

        // Zoom out to full view
        await this.smoothAnimation(async (progress) => {
            const easedProgress = this.easeInOutCubic(progress);

            // Fade out text
            this.description.style.opacity = (1 - easedProgress).toString();

            if (point.type === 'area') {
                const scaleX = 100 / point.area.width;
                const scaleY = 100 / point.area.height;
                const maxScale = Math.min(scaleX, scaleY);
                const currentScale = maxScale - (maxScale - 1) * easedProgress;
                img.style.transform = `scale(${currentScale})`;
            } else {
                const currentScale = presentationSettings.zoomScale - (presentationSettings.zoomScale - 1) * easedProgress;
                img.style.transform = `scale(${currentScale})`;
            }
        }, presentationSettings.zoomDuration);

        // Update current point index
        this.currentPointIndex = (this.currentPointIndex + 1) % points.length;

        if (this.currentPointIndex === 0) {
            // Add delay before restarting from first point
            await this.smoothAnimation(async (progress) => {
                // Hold at unzoomed state
            }, presentationSettings.transitionDelay);
        }

        // Continue to next point if still playing
        if (this.isPlaying) {
            this.animateToNextPoint();
        }
    }
}
