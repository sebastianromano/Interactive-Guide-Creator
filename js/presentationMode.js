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

        // Reset zoom and transform
        const img = elements.getUploadedImage();
        if (img) {
            img.style.transform = 'scale(1)';
            img.style.transformOrigin = 'center';
        }

        // Show points when stopping presentation
        this.pointManager.setPointsVisibility(true);

        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
    }

    animateToNextPoint() {
        if (!this.isPlaying) return;

        const points = this.pointManager.getPoints();
        const point = points[this.currentPointIndex];
        const img = elements.getUploadedImage();

        // Show description using typewriter effect
        this.description.style.opacity = '1';
        animationUtils.typeWriter(
            point.description,
            this.description,
            presentationSettings.typeWriterSpeed
        );

        // Different zoom behavior based on point type
        if (point.type === 'area') {
            // Calculate zoom scale based on area dimensions
            const containerAspect = img.offsetWidth / img.offsetHeight;
            const selectionAspect = point.area.width / point.area.height;

            // Calculate scale needed to fit the selected area
            // Add a small padding factor (0.9) to ensure the area doesn't touch the edges
            const scaleX = (100 / point.area.width) * 0.9;
            const scaleY = (100 / point.area.height) * 0.9;
            const scale = Math.min(scaleX, scaleY);

            // Center of the selected area
            const centerX = point.area.left + (point.area.width / 2);
            const centerY = point.area.top + (point.area.height / 2);

            // Animate zoom with easing
            this.animateZoom(img, {
                scale,
                centerX,
                centerY,
                isArea: true
            });
        } else {
            // Original point zoom behavior
            this.animateZoom(img, {
                scale: presentationSettings.zoomScale,
                centerX: point.x,
                centerY: point.y,
                isArea: false
            });
        }

        // Schedule zoom out
        setTimeout(() => {
            if (!this.isPlaying) return;

            // Animate zoom out
            this.animateZoomOut(img, () => {
                if (!this.isPlaying) return;

                this.currentPointIndex = (this.currentPointIndex + 1) % points.length;

                if (this.currentPointIndex === 0) {
                    // Add delay before restarting from first point
                    setTimeout(() => {
                        if (this.isPlaying) this.animateToNextPoint();
                    }, presentationSettings.transitionDelay);
                } else {
                    this.animateToNextPoint();
                }
            });
        }, presentationSettings.pointDisplayTime);
    }

    animateZoom(img, { scale, centerX, centerY, isArea }) {
        const startScale = parseFloat(img.style.transform?.match(/scale\((.*?)\)/)?.[1] || 1);
        const startTime = performance.now();
        const duration = presentationSettings.zoomDuration;

        // Get the current transform origin or default to center
        const currentOrigin = img.style.transformOrigin || 'center';
        const [startX, startY] = currentOrigin.split(' ').map(val =>
            parseFloat(val.replace('%', '')) || 50
        );

        const animate = (currentTime) => {
            if (!this.isPlaying) return;

            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Cubic easing function
            const eased = this.easeInOutCubic(progress);

            // Interpolate scale and position
            const currentScale = startScale + (scale - startScale) * eased;
            const currentX = startX + (centerX - startX) * eased;
            const currentY = startY + (centerY - startY) * eased;

            // Apply transform
            img.style.transformOrigin = `${currentX}% ${currentY}%`;
            img.style.transform = `scale(${currentScale})`;

            // Add subtle motion blur during animation
            img.style.filter = progress < 1 ? 'blur(0.5px)' : 'none';

            if (progress < 1) {
                this.animationFrame = requestAnimationFrame(animate);
            } else {
                // Clear blur at the end of animation
                img.style.filter = 'none';
            }
        };

        this.animationFrame = requestAnimationFrame(animate);
    }

    animateZoomOut(img, callback) {
        const startScale = parseFloat(img.style.transform?.match(/scale\((.*?)\)/)?.[1] || 1);
        const startTime = performance.now();
        const duration = presentationSettings.zoomDuration;

        const animate = (currentTime) => {
            if (!this.isPlaying) return;

            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = this.easeInOutCubic(progress);

            // Interpolate back to scale(1)
            const currentScale = startScale + (1 - startScale) * eased;

            // Apply transform
            img.style.transform = `scale(${currentScale})`;

            // Add subtle motion blur during animation
            img.style.filter = progress < 1 ? 'blur(0.5px)' : 'none';

            if (progress < 1) {
                this.animationFrame = requestAnimationFrame(animate);
            } else {
                // Clear blur and reset transform at the end
                img.style.filter = 'none';
                img.style.transformOrigin = 'center';
                if (callback) callback();
            }
        };

        this.animationFrame = requestAnimationFrame(animate);
    }

    easeInOutCubic(x) {
        return x < 0.5 ?
            4 * x * x * x :
            1 - Math.pow(-2 * x + 2, 3) / 2;
    }
}
