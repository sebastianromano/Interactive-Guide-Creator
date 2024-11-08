export const elements = {
    // Main containers
    imageContainer: document.getElementById('imageContainer'),
    uploadPrompt: document.getElementById('uploadPrompt'),
    pointList: document.getElementById('pointList'),
    description: document.getElementById('description'),
    rightPanel: document.querySelector('.right-panel'),

    // Controls
    fileInput: document.getElementById('fileInput'),
    playButton: document.getElementById('playButton'),
    recordButton: document.getElementById('recordButton'),

    // Video settings elements
    videoResolution: () => document.getElementById('videoResolution'),
    videoQuality: () => document.getElementById('videoQuality'),
    videoFps: () => document.getElementById('videoFps'),
    customResolution: () => document.getElementById('customResolution'),
    customWidth: () => document.getElementById('customWidth'),
    customHeight: () => document.getElementById('customHeight'),

    // Dynamic elements
    getUploadedImage: () => document.getElementById('uploadedImage')
};
