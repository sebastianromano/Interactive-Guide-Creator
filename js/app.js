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
        toggleButton.addEventListener('click', () => {
            if (!this.isPresenting) {
                toggleButton.classList.remove('start');
                toggleButton.classList.add('stop');
                toggleButton.setAttribute('aria-label', 'Stop Presentation');
                toggleButton.querySelector('svg use').setAttribute('href', '#icon-stop');
                this.startPresentation();
            } else {
                toggleButton.classList.remove('stop');
                toggleButton.classList.add('start');
                toggleButton.setAttribute('aria-label', 'Start Presentation');
                toggleButton.querySelector('svg use').setAttribute('href', '#icon-play');
                this.stopPresentation();
            }
        });
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

        this.toggleButton.classList.remove('start');
        this.toggleButton.classList.add('stop');
        this.toggleButton.setAttribute('aria-label', 'Stop Presentation');
        this.toggleButton.querySelector('svg use').setAttribute('href', '#icon-stop');

        if (this.videoRecorder.isRecording) {
            const img = document.getElementById('uploadedImage');
            this.videoRecorder.drawFrame(img, this.pointManager.getPoints(), 0);
        }
    }

    stopPresentation() {
        this.presentationMode.stop();
        this.isPresenting = false;

        this.toggleButton.classList.remove('stop');
        this.toggleButton.classList.add('start');
        this.toggleButton.setAttribute('aria-label', 'Start Presentation');
        this.toggleButton.querySelector('svg use').setAttribute('href', '#icon-play');
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new App();
});
