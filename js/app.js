import { ImageHandler } from './imageHandler.js';
import { PointManager } from './pointManager.js';
import { PresentationMode } from './presentationMode.js';
import { VideoRecorder } from './videoRecorder.js';

class App {
    constructor() {
        this.initializeComponents();
        this.setupEventListeners();
    }

    initializeComponents() {
        // Get DOM elements
        this.imageContainer = document.getElementById('imageContainer');
        this.uploadPrompt = document.getElementById('uploadPrompt');
        this.fileInput = document.getElementById('fileInput');
        this.pointList = document.getElementById('pointList');
        this.description = document.getElementById('description');
        this.toggleButton = document.getElementById('toggleButton');
        this.rightPanel = document.querySelector('.right-panel');

        // Initialize components
        this.imageHandler = new ImageHandler(this.imageContainer, this.uploadPrompt, this.fileInput);
        this.pointManager = new PointManager(this.imageContainer, this.pointList);
        this.presentationMode = new PresentationMode(this.pointManager, this.description);
        this.videoRecorder = new VideoRecorder(this.rightPanel);

        // Track presentation state
        this.isPresenting = false;
    }

    setupEventListeners() {
        // Presentation controls
        this.toggleButton.addEventListener('click', () => this.togglePresentation());
    }

    togglePresentation() {
        if (!this.isPresenting) {
            this.startPresentation();
        } else {
            this.stopPresentation();
        }
    }

    startPresentation() {
        this.presentationMode.start();
        this.isPresenting = true;

        // Update button appearance
        this.toggleButton.textContent = 'Stop';
        this.toggleButton.classList.remove('start');
        this.toggleButton.classList.add('stop');

        if (this.videoRecorder.isRecording) {
            const img = document.getElementById('uploadedImage');
            this.videoRecorder.drawFrame(img, this.pointManager.getPoints(), 0);
        }
    }

    stopPresentation() {
        this.presentationMode.stop();
        this.isPresenting = false;

        // Update button appearance
        this.toggleButton.textContent = 'Start';
        this.toggleButton.classList.remove('stop');
        this.toggleButton.classList.add('start');
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new App();
});
