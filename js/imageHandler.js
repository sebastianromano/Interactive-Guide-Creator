import { elements } from './domElements.js';
import { fileUtils } from './utils.js';

export class ImageHandler {
    constructor(imageContainer, uploadPrompt, fileInput) {
        this.imageContainer = imageContainer;
        this.uploadPrompt = uploadPrompt;
        this.fileInput = fileInput;
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Prevent click propagation to imageContainer
        this.uploadPrompt.addEventListener('click', (e) => {
            e.stopPropagation();
            this.fileInput.click();
        });

        // File input change handler
        this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));

        // Setup drag and drop
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

    async handleFile(file) {
        try {
            // Use fileUtils to read the file
            const dataUrl = await fileUtils.readFile(file);

            // Hide upload prompt
            this.uploadPrompt.style.display = 'none';

            // Create and setup image
            const img = new Image();
            img.src = dataUrl;
            img.id = 'uploadedImage';

            // When image is loaded, dispatch the imageLoaded event
            img.onload = () => {
                this.imageContainer.appendChild(img);
                const imageLoadedEvent = new Event('imageLoaded');
                this.imageContainer.dispatchEvent(imageLoadedEvent);
            };
        } catch (error) {
            console.error('Error handling file:', error);
        }
    }
}
