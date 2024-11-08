import { elements } from './domElements.js';
import { presentationSettings } from './settings.js';
import { animationUtils } from './utils.js';

export class PresentationMode {
    constructor(pointManager, description) {
        this.pointManager = pointManager;
        this.description = description;
        this.isPlaying = false;
        this.currentPointIndex = 0;
        this.currentTransformOrigin = null;
    }

    start() {
        const points = this.pointManager.getPoints();
        if (points.length === 0) return;

        this.isPlaying = true;
        this.currentPointIndex = 0;
        this.pointManager.setPointsVisibility(false);
        this.processNextPoint();
    }

    stop() {
        this.isPlaying = false;
        this.description.style.opacity = '0';

        const img = elements.getUploadedImage();
        if (img) {
            img.style.transition = 'none';
            img.style.transform = 'scale(1)';
            img.style.transformOrigin = 'center';
            void img.offsetWidth;
        }

        this.pointManager.setPointsVisibility(true);
        this.currentTransformOrigin = null;
    }

    processNextPoint() {
        if (!this.isPlaying) return;

        const points = this.pointManager.getPoints();
        const point = points[this.currentPointIndex];
        const img = elements.getUploadedImage();
        if (!img) return;

        // Set up transition duration
        img.style.transition = `transform ${presentationSettings.zoomDuration}ms ease-in-out`;

        // Get and store transform origin for this point
        this.currentTransformOrigin = this.getTransformOrigin(point);

        // Phase 1: Zoom in
        this.zoomToPoint(point, img).then(() => {
            if (!this.isPlaying) return;

            // Show description
            this.description.style.opacity = '1';
            animationUtils.typeWriter(point.description, this.description, presentationSettings.typeWriterSpeed);

            // Phase 2: Hold at zoomed position
            setTimeout(() => {
                if (!this.isPlaying) return;

                // Phase 3: Zoom out (maintaining transform origin)
                this.zoomOut(img, point).then(() => {
                    if (!this.isPlaying) return;

                    // Hide description
                    this.description.style.opacity = '0';

                    // Move to next point
                    this.currentPointIndex = (this.currentPointIndex + 1) % points.length;

                    // If we're back at the start, add a delay
                    const delay = this.currentPointIndex === 0 ?
                        presentationSettings.transitionDelay :
                        presentationSettings.zoomDuration;

                    setTimeout(() => {
                        if (this.isPlaying) {
                            this.processNextPoint();
                        }
                    }, delay);
                });
            }, presentationSettings.pointDisplayTime);
        });
    }

    getTransformOrigin(point) {
        if (point.type === 'area') {
            // Calculate the center of the area
            const centerX = point.area.left + (point.area.width / 2);
            const centerY = point.area.top + (point.area.height / 2);
            return `${centerX}% ${centerY}%`;
        } else {
            return `${point.x}% ${point.y}%`;
        }
    }

    getZoomScale(point, img) {
        if (point.type === 'area') {
            // Calculate scales based on both dimensions
            const scaleX = 100 / point.area.width;
            const scaleY = 100 / point.area.height;

            // Use the smaller scale to ensure the longest dimension fits in view
            return Math.min(scaleX, scaleY);
        } else {
            return presentationSettings.zoomScale;
        }
    }

    zoomToPoint(point, img) {
        return new Promise((resolve) => {
            const handleTransitionEnd = (e) => {
                if (e.propertyName === 'transform') {
                    img.removeEventListener('transitionend', handleTransitionEnd);
                    resolve();
                }
            };

            img.addEventListener('transitionend', handleTransitionEnd);

            void img.offsetWidth;

            // Set transform origin first
            img.style.transformOrigin = this.currentTransformOrigin;

            // Calculate and apply the zoom scale
            const scale = this.getZoomScale(point, img);
            img.style.transform = `scale(${scale})`;
        });
    }

    zoomOut(img, point) {
        return new Promise((resolve) => {
            const handleTransitionEnd = (e) => {
                if (e.propertyName === 'transform') {
                    img.removeEventListener('transitionend', handleTransitionEnd);
                    resolve();
                }
            };

            img.addEventListener('transitionend', handleTransitionEnd);

            void img.offsetWidth;

            // Maintain the same transform origin while zooming out
            img.style.transformOrigin = this.currentTransformOrigin;
            img.style.transform = 'scale(1)';
        });
    }
}
