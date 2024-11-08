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
        this.startButton = document.getElementById('startButton');
        this.stopButton = document.getElementById('stopButton');
        this.rightPanel = document.querySelector('.right-panel');

        // Initialize components
        this.imageHandler = new ImageHandler(this.imageContainer, this.uploadPrompt, this.fileInput);
        this.pointManager = new PointManager(this.imageContainer, this.pointList);
        this.presentationMode = new PresentationMode(this.pointManager, this.description);
        this.videoRecorder = new VideoRecorder(this.rightPanel);

        // Set initial button states
        this.startButton.disabled = false;
        this.stopButton.disabled = true;
    }

    setupEventListeners() {
        // Presentation controls
        this.startButton.addEventListener('click', () => this.startPresentation());
        this.stopButton.addEventListener('click', () => this.stopPresentation());
    }

    startPresentation() {
        this.presentationMode.start();
        this.startButton.disabled = true;
        this.stopButton.disabled = false;

        if (this.videoRecorder.isRecording) {
            const img = document.getElementById('uploadedImage');
            // Note: Points will not be visible in the recording during presentation
            this.videoRecorder.drawFrame(img, this.pointManager.getPoints(), 0);
        }
    }

    stopPresentation() {
        this.presentationMode.stop();
        this.startButton.disabled = false;
        this.stopButton.disabled = true;
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new App();
});
