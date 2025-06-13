// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', function () {
    // Update HTML lang attribute based on current locale
    updateHtmlLang();
    
    // Initialize UI with translated text
    document.getElementById('options-title').textContent = chrome.i18n.getMessage('optionsTitle');
    document.getElementById('content-control-title').textContent = chrome.i18n.getMessage('contentControlTitle');
    document.getElementById('data-source-label').textContent = chrome.i18n.getMessage('dataSourceLabel');
    document.getElementById('data-source-description').textContent = chrome.i18n.getMessage('dataSourceDescription');
    document.getElementById('save-button').textContent = chrome.i18n.getMessage('saveButton');
    
    // Initialize data management section
    document.getElementById('data-management-title').textContent = chrome.i18n.getMessage('dataManagementTitle');
    document.getElementById('refresh-token-label').textContent = chrome.i18n.getMessage('refreshJinrishiciTokenLabel');
    document.getElementById('refresh-token-description').textContent = chrome.i18n.getMessage('refreshJinrishiciTokenDescription');
    document.getElementById('reset-visit-count-label').textContent = chrome.i18n.getMessage('resetVisitCountLabel');
    document.getElementById('reset-visit-count-description').textContent = chrome.i18n.getMessage('resetVisitCountDescription');
    // Set option values with translated text
    document.querySelectorAll('fluent-option').forEach(option => {
        if (option.value === 'jrsc') {
            option.textContent = chrome.i18n.getMessage('JrscName');
        } else if (option.value === 'hitokoto') {
            option.textContent = chrome.i18n.getMessage('HitokotoName');
        } else if (option.value === 'local') {
            option.textContent = chrome.i18n.getMessage('localDataSetName');
        } else if (option.value === 'random') {
            option.textContent = chrome.i18n.getMessage('randomName');
        }
    });

    // Load saved settings
    chrome.storage.sync.get(['dataSource'], function (result) {
        if (result.dataSource) {
            document.getElementById('data-source-selector').value = result.dataSource;
        } else {
            // Default to random if no setting found
            document.getElementById('data-source-selector').value = 'random';
        }
    });

    // Save settings when save button is clicked
    document.getElementById('save-button').addEventListener('click', function () {
        const dataSource = document.getElementById('data-source-selector').value;
        // Save to chrome.storage.sync
        chrome.storage.sync.set({
            'dataSource': dataSource
        }, function () {
            // Show success message using Fluent UI toast notification
            showToast(chrome.i18n.getMessage('saveSuccessMessage'));
        });
    });

    // Function to show toast notification
    function showToast(message) {
        const toastContainer = document.getElementById('toast-container');
        
        // Create toast element
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        
        // Add to container
        toastContainer.appendChild(toast);
        
        // Force a reflow before adding the visible class
        void toast.offsetWidth;
        
        // Show the toast
        toast.classList.add('visible');
        
        // Remove after 3 seconds
        setTimeout(() => {
            toast.classList.remove('visible');
            setTimeout(() => {
                toastContainer.removeChild(toast);
            }, 300); // Wait for fade-out animation
        }, 3000);
    }

    // Function to update HTML lang attribute based on current locale
    function updateHtmlLang() {
        // Get current locale from Chrome or default to en-US
        const locale = chrome.i18n.getUILanguage();
        let lang = 'en';
        
        // Map Chrome locale format to HTML lang attribute format
        if (locale.startsWith('zh')) {
            lang = 'zh';
        } else if (locale.startsWith('en')) {
            lang = 'en';
        }
        
        // Set the HTML lang attribute
        document.documentElement.setAttribute('lang', lang);
    }
    
    // Handle refresh Jinrishici token button click
    document.getElementById('refresh-token-button').addEventListener('click', function () {
        // Remove the existing token
        chrome.storage.sync.remove('jrscToken', function() {
            // Make a request to get a new token
            fetch("https://v2.jinrishici.com/one.json?client=browser-sdk/1.2")
                .then(response => response.json())
                .then(result => {
                    if (result.status === "success" && result.token) {
                        // Save the new token
                        chrome.storage.sync.set({ jrscToken: result.token }, function() {
                            // Show success message
                            showToast(chrome.i18n.getMessage('refreshSuccessMessage'));
                        });
                    }
                })
                .catch(error => {
                    console.error('Failed to refresh Jinrishici token:', error);
                });
        });
    });
    
    // Handle reset visit count button click
    document.getElementById('reset-visit-count-button').addEventListener('click', function () {
        // Reset the open count to zero
        chrome.storage.sync.set({ 'openNum': 0 }, function() {
            // Show success message
            showToast(chrome.i18n.getMessage('resetSuccessMessage'));
        });
    });
});
