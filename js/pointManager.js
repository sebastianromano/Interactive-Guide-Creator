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

        // Area selection properties
        this.isSelectingArea = false;
        this.selectionStart = null;
        this.selectionElement = null;

        this.setupEventListeners();
    }

    setupEventListeners() {
        // Listen for image load event
        this.imageContainer.addEventListener('imageLoaded', () => {
            this.imageLoaded = true;
            this.clear();
        });

        // Mouse down for starting area selection or point drag
        this.imageContainer.addEventListener('mousedown', (e) => {
            if (!this.imageLoaded || e.target.id === 'uploadPrompt') return;

            if (e.target.classList.contains('point') || e.target.classList.contains('point-number')) {
                // Handle point dragging
                e.preventDefault();
                e.stopPropagation();
                this.startDrag(e.target.closest('.point-container'), e);
            } else if (e.shiftKey) {
                // Start area selection when shift is held
                e.preventDefault();
                this.startAreaSelection(e);
            }
        });

        // Mouse move for area selection or point drag
        document.addEventListener('mousemove', (e) => {
            if (this.isDragging) {
                this.handleDrag(e);
            } else if (this.isSelectingArea) {
                this.updateAreaSelection(e);
            }
        });

        // Mouse up for completing area selection or point drag
        document.addEventListener('mouseup', (e) => {
            if (this.isSelectingArea) {
                this.completeAreaSelection(e);
            } else if (this.isDragging) {
                this.stopDrag();
            }
        });

        // Click for adding single points (when not dragging or selecting)
        this.imageContainer.addEventListener('click', (e) => {
            if (!this.isDragging &&
                !this.isSelectingArea &&
                e.target.id !== 'uploadPrompt' &&
                !e.target.classList.contains('point') &&
                !e.target.classList.contains('point-number') &&
                !e.shiftKey) {
                this.handleImageClick(e);
            }
        });

        // Cancel area selection when mouse leaves container
        this.imageContainer.addEventListener('mouseleave', () => {
            if (this.isSelectingArea) {
                this.isSelectingArea = false;
                this.selectionElement?.remove();
                this.selectionElement = null;
                this.selectionStart = null;
            }
        });
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

    startAreaSelection(e) {
        const rect = this.imageContainer.getBoundingClientRect();
        this.isSelectingArea = true;
        this.selectionStart = {
            x: ((e.clientX - rect.left) / this.imageContainer.offsetWidth) * 100,
            y: ((e.clientY - rect.top) / this.imageContainer.offsetHeight) * 100
        };

        // Create selection rectangle
        this.selectionElement = document.createElement('div');
        this.selectionElement.className = 'area-selection';
        this.selectionElement.style.position = 'absolute';
        this.selectionElement.style.border = '2px dashed red';
        this.selectionElement.style.backgroundColor = 'rgba(255, 0, 0, 0.1)';
        this.selectionElement.style.pointerEvents = 'none';
        this.imageContainer.appendChild(this.selectionElement);
    }

    updateAreaSelection(e) {
        if (!this.isSelectingArea || !this.selectionElement) return;

        const rect = this.imageContainer.getBoundingClientRect();
        const currentX = ((e.clientX - rect.left) / this.imageContainer.offsetWidth) * 100;
        const currentY = ((e.clientY - rect.top) / this.imageContainer.offsetHeight) * 100;

        // Calculate dimensions
        const left = Math.min(this.selectionStart.x, currentX);
        const top = Math.min(this.selectionStart.y, currentY);
        const width = Math.abs(currentX - this.selectionStart.x);
        const height = Math.abs(currentY - this.selectionStart.y);

        // Update selection element
        this.selectionElement.style.left = left + '%';
        this.selectionElement.style.top = top + '%';
        this.selectionElement.style.width = width + '%';
        this.selectionElement.style.height = height + '%';
    }

    completeAreaSelection(e) {
        if (!this.isSelectingArea || !this.selectionElement) return;

        const rect = this.imageContainer.getBoundingClientRect();
        const endX = ((e.clientX - rect.left) / this.imageContainer.offsetWidth) * 100;
        const endY = ((e.clientY - rect.top) / this.imageContainer.offsetHeight) * 100;

        // Only create area if it has a minimum size
        const width = Math.abs(endX - this.selectionStart.x);
        const height = Math.abs(endY - this.selectionStart.y);

        if (width < 1 || height < 1) {
            // If area is too small, remove the selection element
            this.selectionElement.remove();
        } else {
            // Create area point with start and end coordinates
            const areaPoint = {
                type: 'area',
                x: (this.selectionStart.x + endX) / 2, // Center point
                y: (this.selectionStart.y + endY) / 2,
                area: {
                    left: Math.min(this.selectionStart.x, endX),
                    top: Math.min(this.selectionStart.y, endY),
                    width: width,
                    height: height
                },
                element: this.selectionElement,
                description: ''
            };

            this.points.push(areaPoint);
            this.updatePointList();
        }

        // Reset selection state
        this.isSelectingArea = false;
        this.selectionStart = null;
    }

    createPointMarker(x, y) {
        const pointContainer = document.createElement('div');
        pointContainer.className = 'point-container';
        pointContainer.style.position = 'absolute';
        pointContainer.style.left = x + '%';
        pointContainer.style.top = y + '%';
        pointContainer.style.transform = 'translate(-50%, -50%)';
        pointContainer.style.cursor = 'move';

        const point = document.createElement('div');
        point.className = 'point';

        const number = document.createElement('div');
        number.className = 'point-number';
        number.textContent = (this.points.length + 1).toString();

        pointContainer.appendChild(point);
        pointContainer.appendChild(number);

        pointContainer.addEventListener('mousedown', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.startDrag(pointContainer, e);
        });

        this.imageContainer.appendChild(pointContainer);

        return {
            type: 'point',
            x,
            y,
            element: pointContainer,
            description: ''
        };
    }

    updatePointList() {
        this.pointList.innerHTML = '';
        this.points.forEach((point, index) => {
            const item = document.createElement('div');
            item.className = 'point-item';
            item.dataset.type = point.type;  // Add type as data attribute for styling

            const header = document.createElement('div');
            header.className = 'point-header';
            header.textContent = point.type === 'area' ? `Area ${index + 1}` : `Point ${index + 1}`;

            const textarea = document.createElement('textarea');
            textarea.value = point.description;
            textarea.placeholder = `Description for ${point.type} ${index + 1}`;
            textarea.rows = 3;
            textarea.addEventListener('input', (e) => {
                point.description = e.target.value;
            });

            item.appendChild(header);
            item.appendChild(textarea);
            this.pointList.appendChild(item);
        });
    }

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
