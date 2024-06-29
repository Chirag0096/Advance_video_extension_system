document.addEventListener('DOMContentLoaded', function() {
  const buttons = [
    'timestampButton',
    'audioCustomizeButton',
    'annotationButton',
    'visualAdjustButton'
  ];

  buttons.forEach(buttonId => {
    document.getElementById(buttonId).addEventListener('click', function() {
      chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {action: buttonId}, function(response) {
          document.getElementById('status').textContent = response.status;
        });
      });
    });
  });
});