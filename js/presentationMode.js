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

        // Reset zoom
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

        // Animate zoom
        img.style.transform = `scale(${presentationSettings.zoomScale})`;
        img.style.transformOrigin = `${point.x}% ${point.y}%`;
        img.style.transition = `transform ${presentationSettings.zoomDuration}ms ease-in-out`;

        // Schedule zoom out
        setTimeout(() => {
            if (!this.isPlaying) return;

            img.style.transform = 'scale(1)';

            // Schedule next point
            setTimeout(() => {
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
            }, presentationSettings.pointDisplayTime);
        }, presentationSettings.pointDisplayTime);
    }
}
