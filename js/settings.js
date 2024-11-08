export const videoSettings = {
    width: 1920,
    height: 1080,
    fps: 60,
    quality: 'high',
    bitrate: 8000000,
    resolutionOptions: [
        { label: '1080p (1920x1080)', value: '1920x1080' },
        { label: '1440p (2560x1440)', value: '2560x1440' },
        { label: '4K (3840x2160)', value: '3840x2160' }
    ],
    qualityOptions: [
        { label: 'High (8 Mbps)', value: 'high', bitrate: 8000000 },
        { label: 'Medium (4 Mbps)', value: 'medium', bitrate: 4000000 },
        { label: 'Low (2 Mbps)', value: 'low', bitrate: 2000000 }
    ],
    fpsOptions: [
        { label: '60 FPS', value: 60 },
        { label: '30 FPS', value: 30 },
        { label: '24 FPS', value: 24 }
    ]
};

export const presentationSettings = {
    zoomScale: 2,
    zoomDuration: 1000, // ms
    pointDisplayTime: 4000, // ms
    transitionDelay: 3000, // ms
    typeWriterSpeed: 50 // ms
};
