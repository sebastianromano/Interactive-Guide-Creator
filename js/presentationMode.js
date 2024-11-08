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
        this.animateToNextPoint();
    }

    stop() {
        this.isPlaying = false;
        this.description.style.opacity = '0';

        // Reset zoom
        const img = document.getElementById('uploadedImage');
        if (img) {
            img.style.transform = 'scale(1)';
            img.style.transformOrigin = 'center';
        }

        cancelAnimationFrame(this.animationFrame);
    }

    animateToNextPoint() {
        if (!this.isPlaying) return;

        const points = this.pointManager.getPoints();
        const point = points[this.currentPointIndex];
        const img = document.getElementById('uploadedImage');

        // Show description
        this.description.style.opacity = '1';
        this.typeWriter(point.description, this.description);

        // Animate zoom
        img.style.transform = 'scale(2)';
        img.style.transformOrigin = `${point.x}% ${point.y}%`;
        img.style.transition = 'transform 1s ease-in-out';

        setTimeout(() => {
            if (!this.isPlaying) return;

            img.style.transform = 'scale(1)';

            setTimeout(() => {
                if (!this.isPlaying) return;

                this.currentPointIndex = (this.currentPointIndex + 1) % points.length;
                if (this.currentPointIndex === 0) {
                    setTimeout(() => {
                        if (this.isPlaying) this.animateToNextPoint();
                    }, 1000);
                } else {
                    this.animateToNextPoint();
                }
            }, 3000);
        }, 4000);
    }

    typeWriter(text, element) {
        let i = 0;
        element.textContent = '';

        const type = () => {
            if (i < text.length && this.isPlaying) {
                element.textContent += text.charAt(i);
                i++;
                setTimeout(type, 50);
            }
        };

        type();
    }
}
