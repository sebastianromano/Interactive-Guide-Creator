export class ImageHandler {
    constructor(imageContainer, uploadPrompt, fileInput) {
        this.imageContainer = imageContainer;
        this.uploadPrompt = uploadPrompt;
        this.fileInput = fileInput;
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.uploadPrompt.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent click from bubbling to imageContainer
            this.fileInput.click();
        });

        this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        this.setupDragAndDrop();
    }

    setupDragAndDrop() {
        this.imageContainer.addEventListener('dragover', (e) => {
            e.preventDefault();
            this.uploadPrompt.style.borderColor = '#4CAF50';
        });

        this.imageContainer.addEventListener('dragleave', () => {
            this.uploadPrompt.style.borderColor = '#ccc';
        });

        this.imageContainer.addEventListener('drop', (e) => {
            e.preventDefault();
            this.uploadPrompt.style.borderColor = '#ccc';
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('image/')) {
                this.handleFile(file);
            }
        });
    }

    handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            this.handleFile(file);
        }
    }

    handleFile(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            this.uploadPrompt.style.display = 'none';
            const img = new Image();
            img.src = e.target.result;
            img.id = 'uploadedImage';

            // When image is loaded, dispatch the imageLoaded event
            img.onload = () => {
                this.imageContainer.appendChild(img);
                const imageLoadedEvent = new Event('imageLoaded');
                this.imageContainer.dispatchEvent(imageLoadedEvent);
            };
        };
        reader.readAsDataURL(file);
    }
}
