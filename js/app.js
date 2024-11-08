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
        this.playButton = document.getElementById('playButton');
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
        this.playButton.addEventListener('click', () => {
            if (!this.isPresenting) {
                this.playButton.classList.remove('start');
                this.playButton.classList.add('stop');
                this.playButton.setAttribute('aria-label', 'Stop Presentation');
                this.playButton.querySelector('svg use').setAttribute('href', '#icon-stop');
                this.startPresentation();
            } else {
                this.playButton.classList.remove('stop');
                this.playButton.classList.add('start');
                this.playButton.setAttribute('aria-label', 'Start Presentation');
                this.playButton.querySelector('svg use').setAttribute('href', '#icon-play');
                this.stopPresentation();
            }
        });
    }

    startPresentation() {
        this.presentationMode.start();
        this.isPresenting = true;

        if (this.videoRecorder.isRecording) {
            const img = document.getElementById('uploadedImage');
            this.videoRecorder.drawFrame(img, this.pointManager.getPoints(), 0);
        }
    }

    stopPresentation() {
        this.presentationMode.stop();
        this.isPresenting = false;
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new App();
});
