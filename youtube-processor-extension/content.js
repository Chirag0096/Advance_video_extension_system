let timestamps = [];
let annotations = [];
let isAudioCustomized = false;
let isVisualAdjusted = false;
let audioContext = null;
let source = null;
let gainNode = null;
let compressor = null;

function addTimestamp() {
  const video = document.querySelector('video');
  const progressBar = document.querySelector('.ytp-progress-bar');
  if (video && progressBar) {
    const currentTime = video.currentTime;
    const marker = document.createElement('div');
    marker.className = 'yt-timestamp-marker';
    marker.textContent = formatTime(currentTime);
    marker.style.left = `${(currentTime / video.duration) * 100}%`;
    marker.addEventListener('click', () => video.currentTime = currentTime);
    progressBar.appendChild(marker);
    timestamps.push({time: currentTime, element: marker});
    return "Timestamp added";
  }
  return "Video or progress bar not found";
}

function customizeAudio() {
  isAudioCustomized = !isAudioCustomized;
  const video = document.querySelector('video');
  if (video) {
    if (isAudioCustomized) {
      setupAudioEnhancement(video);
      return "Audio enhanced for clarity";
    } else {
      removeAudioEnhancement(video);
      return "Audio reset";
    }
  }
  return "Video not found";
}

function setupAudioEnhancement(video) {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    source = audioContext.createMediaElementSource(video);
    
    // Create a gain node for overall volume boost
    gainNode = audioContext.createGain();
    gainNode.gain.setValueAtTime(1.2, audioContext.currentTime); // Boost volume by 20%
    
    // Create a high-shelf filter to boost frequencies above 7000Hz
    highShelfFilter = audioContext.createBiquadFilter();
    highShelfFilter.type = 'highshelf';
    highShelfFilter.frequency.setValueAtTime(7000, audioContext.currentTime);
    highShelfFilter.gain.setValueAtTime(10, audioContext.currentTime); // Boost by 10 dB
    
    // Create a peaking filter to emphasize speech frequencies (2000-4000 Hz)
    const speechFilter = audioContext.createBiquadFilter();
    speechFilter.type = 'peaking';
    speechFilter.frequency.setValueAtTime(3000, audioContext.currentTime);
    speechFilter.Q.setValueAtTime(1, audioContext.currentTime);
    speechFilter.gain.setValueAtTime(5, audioContext.currentTime); // Boost by 5 dB
    
    // Create a compressor node for dynamic range compression
    compressor = audioContext.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-50, audioContext.currentTime);
    compressor.knee.setValueAtTime(40, audioContext.currentTime);
    compressor.ratio.setValueAtTime(12, audioContext.currentTime);
    compressor.attack.setValueAtTime(0, audioContext.currentTime);
    compressor.release.setValueAtTime(0.25, audioContext.currentTime);
    
    // Connect the nodes
    source.connect(gainNode);
    gainNode.connect(highShelfFilter);
    highShelfFilter.connect(speechFilter);
    speechFilter.connect(compressor);
    compressor.connect(audioContext.destination);
  }
}

function removeAudioEnhancement(video) {
  if (audioContext) {
    source.disconnect();
    gainNode.disconnect();
    highShelfFilter.disconnect();
    compressor.disconnect();
    source.connect(audioContext.destination);
  }
}

function addAnnotation() {
  const video = document.querySelector('video');
  const container = document.querySelector('.html5-video-container');
  if (video && container) {
    const annotation = document.createElement('div');
    annotation.className = 'yt-annotation';
    annotation.textContent = prompt("Enter annotation text:");
    annotation.style.top = `${Math.random() * 80}%`;
    annotation.style.left = `${Math.random() * 80}%`;
    container.appendChild(annotation);
    annotations.push({time: video.currentTime, element: annotation});
    return "Annotation added";
  }
  return "Video container not found";
}

function adjustVisuals() {
  isVisualAdjusted = !isVisualAdjusted;
  const video = document.querySelector('video');
  if (video) {
    if (isVisualAdjusted) {
      // Apply deuteranomaly (red-green color blindness) filter
      video.style.filter = 'hue-rotate(-20deg) saturate(140%) brightness(95%)';
      return "Visual adjusted for color blindness";
    } else {
      video.style.filter = '';
      return "Visual reset";
    }
  }
  return "Video not found";
}

function formatTime(seconds) {
  const date = new Date(seconds * 1000);
  return date.toISOString().substr(11, 8);
}

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    let status;
    switch(request.action) {
      case 'timestampButton':
        status = addTimestamp();
        break;
      case 'audioCustomizeButton':
        status = customizeAudio();
        break;
      case 'annotationButton':
        status = addAnnotation();
        break;
      case 'visualAdjustButton':
        status = adjustVisuals();
        break;
      default:
        status = "Unknown action";
    }
    sendResponse({status: status});
  }
);

// Clean up function to remove all added elements when navigating away
window.addEventListener('beforeunload', () => {
  timestamps.forEach(ts => ts.element.remove());
  annotations.forEach(ann => ann.element.remove());
  const video = document.querySelector('video');
  if (video) {
    video.style.filter = '';
    removeAudioEnhancement(video);
  }
  if (audioContext) {
    audioContext.close();
    audioContext = null;
  }
});

// CSS styles for the added elements
const style = document.createElement('style');
style.textContent = `
  .yt-timestamp-marker {
    position: absolute;
    top: -20px;
    transform: translateX(-50%);
    background-color: #ff0000;
    color: white;
    padding: 2px 4px;
    border-radius: 2px;
    font-size: 12px;
    cursor: pointer;
  }
  .yt-annotation {
    position: absolute;
    background-color: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 5px;
    border-radius: 3px;
    font-size: 14px;
  }
`;
document.head.appendChild(style);