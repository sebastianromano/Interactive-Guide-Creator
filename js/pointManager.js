import { elements } from './domElements.js';

export class PointManager {
    constructor(imageContainer, pointList) {
        this.imageContainer = imageContainer;
        this.pointList = pointList;
        this.points = [];
        this.imageLoaded = false;
        this.draggedPoint = null;
        this.isDragging = false;
        this.isPresenting = false;

        this.setupEventListeners();
    }

    setupEventListeners() {
        // Listen for image load event
        this.imageContainer.addEventListener('imageLoaded', () => {
            this.imageLoaded = true;
            this.clear();
        });

        // Click handling for adding new points
        this.imageContainer.addEventListener('click', (e) => {
            if (!this.isDragging &&
                e.target.id !== 'uploadPrompt' &&
                !e.target.classList.contains('point') &&
                !e.target.classList.contains('point-number')) {
                this.handleImageClick(e);
            }
        });

        // Drag event listeners
        document.addEventListener('mousemove', (e) => this.handleDrag(e));
        document.addEventListener('mouseup', () => this.stopDrag());
        this.imageContainer.addEventListener('mouseleave', () => this.stopDrag());
    }

    handleImageClick(e) {
        const uploadedImage = elements.getUploadedImage();
        if (!uploadedImage || !this.imageLoaded || uploadedImage.style.display === 'none') {
            return;
        }

        const rect = this.imageContainer.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / this.imageContainer.offsetWidth) * 100;
        const y = ((e.clientY - rect.top) / this.imageContainer.offsetHeight) * 100;

        const point = this.createPointMarker(x, y);
        this.points.push(point);
        this.updatePointList();
    }

    createPointMarker(x, y) {
        const pointContainer = document.createElement('div');
        pointContainer.className = 'point-container';
        pointContainer.style.position = 'absolute';
        pointContainer.style.left = x + '%';
        pointContainer.style.top = y + '%';
        pointContainer.style.transform = 'translate(-50%, -50%)';
        pointContainer.style.cursor = 'move';

        // Create point circle
        const point = document.createElement('div');
        point.className = 'point';

        // Create number label
        const number = document.createElement('div');
        number.className = 'point-number';
        number.textContent = (this.points.length + 1).toString();

        // Add point and number to container
        pointContainer.appendChild(point);
        pointContainer.appendChild(number);

        // Add drag start handling
        pointContainer.addEventListener('mousedown', (e) => {
            e.preventDefault(); // Prevent text selection during drag
            e.stopPropagation(); // Prevent creating new point
            this.startDrag(pointContainer, e);
        });

        this.imageContainer.appendChild(pointContainer);

        return {
            x,
            y,
            element: pointContainer,
            description: ''
        };
    }

    startDrag(pointElement, e) {
        this.isDragging = true;
        this.draggedPoint = this.points.find(p => p.element === pointElement);

        // Store the initial mouse offset relative to the point
        const rect = pointElement.getBoundingClientRect();
        this.dragOffset = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };

        pointElement.style.zIndex = '1000';
        pointElement.style.opacity = '0.8';
    }

    handleDrag(e) {
        if (!this.draggedPoint || !this.isDragging) return;

        e.preventDefault();

        const rect = this.imageContainer.getBoundingClientRect();
        let x = ((e.clientX - rect.left) / this.imageContainer.offsetWidth) * 100;
        let y = ((e.clientY - rect.top) / this.imageContainer.offsetHeight) * 100;

        // Clamp values between 0 and 100
        x = Math.max(0, Math.min(100, x));
        y = Math.max(0, Math.min(100, y));

        // Update point position
        this.draggedPoint.x = x;
        this.draggedPoint.y = y;
        this.draggedPoint.element.style.left = x + '%';
        this.draggedPoint.element.style.top = y + '%';
    }

    stopDrag() {
        if (this.draggedPoint) {
            this.draggedPoint.element.style.zIndex = '';
            this.draggedPoint.element.style.opacity = '';
            this.draggedPoint = null;

            // Set a small timeout before allowing new points to be created
            // This prevents accidental point creation when releasing a drag
            setTimeout(() => {
                this.isDragging = false;
            }, 50);
        }
    }

    updatePointList() {
        this.pointList.innerHTML = '';
        this.points.forEach((point, index) => {
            const item = document.createElement('div');
            item.className = 'point-item';

            const header = document.createElement('div');
            header.className = 'point-header';
            header.textContent = `Point ${index + 1}`;

            const textarea = document.createElement('textarea');
            textarea.value = point.description;
            textarea.placeholder = `Description for point ${index + 1}`;
            textarea.rows = 3;
            textarea.addEventListener('input', (e) => {
                point.description = e.target.value;
            });

            item.appendChild(header);
            item.appendChild(textarea);
            this.pointList.appendChild(item);
        });
    }

    // Toggle point visibility
    setPointsVisibility(visible) {
        this.isPresenting = !visible;
        this.points.forEach(point => {
            point.element.style.display = visible ? 'block' : 'none';
        });
    }

    getPoints() {
        return this.points;
    }

    clear() {
        this.points.forEach(point => point.element.remove());
        this.points = [];
        this.updatePointList();
    }
}
