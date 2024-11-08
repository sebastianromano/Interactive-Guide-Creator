export class PointManager {
    constructor(imageContainer, pointList) {
        this.imageContainer = imageContainer;
        this.pointList = pointList;
        this.points = [];
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.imageContainer.addEventListener('click', (e) => this.handleImageClick(e));
    }

    handleImageClick(e) {
        const rect = this.imageContainer.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / this.imageContainer.offsetWidth) * 100;
        const y = ((e.clientY - rect.top) / this.imageContainer.offsetHeight) * 100;

        const point = this.createPointMarker(x, y);
        this.points.push(point);
        this.updatePointList();
    }

    createPointMarker(x, y) {
        const point = document.createElement('div');
        point.className = 'point';
        point.style.left = x + '%';
        point.style.top = y + '%';
        this.imageContainer.appendChild(point);

        return {
            x,
            y,
            element: point,
            description: ''
        };
    }

    updatePointList() {
        this.pointList.innerHTML = '';
        this.points.forEach((point, index) => {
            const item = document.createElement('div');
            item.className = 'point-item';

            const textarea = document.createElement('textarea');
            textarea.value = point.description;
            textarea.placeholder = `Description for point ${index + 1}`;
            textarea.rows = 3;
            textarea.addEventListener('input', (e) => {
                point.description = e.target.value;
            });

            item.appendChild(textarea);
            this.pointList.appendChild(item);
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
