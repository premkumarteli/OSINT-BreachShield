import '@testing-library/jest-dom';

// Mock HTMLMediaElement methods in jsdom test environment
window.HTMLMediaElement.prototype.play = () => Promise.resolve();
window.HTMLMediaElement.prototype.pause = () => {};
window.HTMLMediaElement.prototype.load = () => {};
