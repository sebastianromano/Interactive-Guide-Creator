import { ImageHandler } from './imageHandler.js';
import { PointManager } from './pointManager.js';
import { PresentationMode } from './presentationMode.js';
import { VideoRecorder } from './videoRecorder.js';
import { elements } from './domElements.js';

class App {
    constructor() {
        this.initializeComponents();
        this.setupEventListeners();

        // Make these methods available globally for the video recorder
        window.startPresentation = () => this.startPresentation();
        window.stopPresentation = () => this.stopPresentation();
    }

    initializeComponents() {
        // Initialize components using centralized DOM elements
        this.imageHandler = new ImageHandler(
            elements.imageContainer,
            elements.uploadPrompt,
            elements.fileInput
        );
        this.pointManager = new PointManager(
            elements.imageContainer,
            elements.pointList
        );
        this.presentationMode = new PresentationMode(
            this.pointManager,
            elements.description
        );
        this.videoRecorder = new VideoRecorder(elements.rightPanel);

        // Make components globally accessible for the video recorder
        window.pointManager = this.pointManager;
        window.presentationMode = this.presentationMode;

        // Track presentation state
        this.isPresenting = false;
    }

    setupEventListeners() {
        // Make sure playButton exists before adding listener
        if (elements.playButton) {
            elements.playButton.addEventListener('click', () => this.togglePresentation());
        }
    }

    togglePresentation() {
        if (!this.isPresenting) {
            this.startPresentation();
            elements.playButton.classList.remove('start');
            elements.playButton.classList.add('stop');
            elements.playButton.setAttribute('aria-label', 'Stop Presentation');
            elements.playButton.querySelector('svg use').setAttribute('href', 'icons.svg#icon-stop');
        } else {
            this.stopPresentation();
            elements.playButton.classList.remove('stop');
            elements.playButton.classList.add('start');
            elements.playButton.setAttribute('aria-label', 'Start Presentation');
            elements.playButton.querySelector('svg use').setAttribute('href', 'icons.svg#icon-play');
        }
    }

    startPresentation() {
        this.presentationMode.start();
        this.isPresenting = true;

        if (this.videoRecorder.isRecording) {
            const img = elements.getUploadedImage();
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
