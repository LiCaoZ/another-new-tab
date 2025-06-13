// Update HTML lang attribute and page title based on current locale
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

    // Set the page title to the localized extension name
    document.title = chrome.i18n.getMessage('extensionName');
}

let jrscToken;
let openNum;
let currentQuoteData = null; // Store the current quote data for copying

chrome.storage.sync.get(['jrscToken', 'openNum'], function (result) {
    // Update HTML lang attribute and page title
    updateHtmlLang();

    jrscToken = result.jrscToken;
    let currentOpenNum = result.openNum || 0;
    // 将 openNum 赋值给全局变量
    openNum = currentOpenNum + 1;

    // Update open count
    chrome.storage.sync.set({
        'openNum': openNum
    });
});

const output = (quoteText, titleText, authorText, vendorName, vendorUrl, jsonData = null) => {
    // Get localized strings by chrome.i18n
    document.querySelector('.data-provider-description').innerText = chrome.i18n.getMessage('dataProviderDescription');
    document.querySelector('.open-num-description').innerHTML = chrome.i18n.getMessage('openNumDescription');
    vendorName = chrome.i18n.getMessage(vendorName) || vendorName;
    document.querySelector('.quote-text').innerText = quoteText;
    document.querySelector('.title-text').innerText = titleText;
    document.querySelector('.author-text').innerText = authorText;
    if (vendorUrl != "local") {
        document.querySelector('.vendor-text').innerHTML = "<a href='" + vendorUrl + "' target='_blank'>" + vendorName + "</a>";
    } else {
        document.querySelector('.vendor-text').innerText = vendorName;
    }
    if (openNum === 1) {
        document.querySelector('.open-num-description').innerText = chrome.i18n.getMessage('firstViewMessage');
    } else {
        chrome.storage.sync.get(['openNum'], function (result) {
            document.querySelector('.openNum').innerText = result.openNum || 0;
        });
    }
    
    // Store the JSON data for copy functionality
    currentQuoteData = jsonData;
    
    // Update copy button text
    const copyBtn = document.getElementById('copyJsonBtn');
    if (copyBtn) {
        copyBtn.innerText = chrome.i18n.getMessage('copyJsonBtnText');
    }
}

// 无网/无法获取 local
const local = (isOffline) => {
    // 从 JSON 文件加载本地引用数据
    fetch('assets/local-quotes.json')
        .then(response => response.json())
        .then(localQuotes => {
            let randomSeed = Math.floor(Math.random() * localQuotes.length);
            const selectedQuote = localQuotes[randomSeed];
            if (isOffline) {
                output(selectedQuote['text'], '无法获取在线内容，请检查网络连接状态与控制台报错', '—— ' + selectedQuote['author'], 'localDataSetName', 'local', selectedQuote);
            } else {
                output(selectedQuote['text'], '', '—— ' + selectedQuote['author'], 'localDataSetName', 'local', selectedQuote);
            }
        })
        .catch(error => {
            console.error('无法加载本地引用数据:', error);
            // 如果无法加载 JSON 文件，使用内置的备用数据
            const fallbackQuotes = [
                {
                    text: '无论最终结果将人类文明导向何处，我们，选择希望。',
                    author: '电影《流浪地球》'
                }
            ];
            let quote = fallbackQuotes[0];
            if (isOffline) {
                output(quote.text, '无法获取在线内容，请检查网络连接状态与控制台报错', '—— ' + quote.author, 'localDataSetName', 'local', quote);
            } else {
                output(quote.text, '', '—— ' + quote.author, 'localDataSetName', 'local', quote);
            }
        });
}

// 抽象出今日诗词逻辑
const jrsc = () => {
    /**
    * 今日诗词V2 JS-SDK 1.2.2
    * 今日诗词API 是一个可以免费调用的诗词接口：https://www.jinrishici.com
    */
    !function (e) {
        var n, t = {}, o = "jinrishici-token"; function i() { return document.getElementById("jinrishici-sentence") || 0 != document.getElementsByClassName("jinrishici-sentence").length } function c() { t.load(function (e) { var n = document.getElementById("jinrishici-sentence"), t = document.getElementsByClassName("jinrishici-sentence"); if (n && (n.innerText = e.data.content), 0 !== t.length) for (var o = 0; o < t.length; o++)t[o].innerText = e.data.content }) } function r(e, n) {
            var t = new XMLHttpRequest; t.open("get", n), t.withCredentials = !0, t.send(), t.onerror = function () {
                local(isOffline = true);
                console.error('Request failed. Network error.');
            }, t.onreadystatechange = function (n) { if (4 === t.readyState) { var o = JSON.parse(t.responseText); "success" === o.status ? e(o) : console.error("今日诗词API加载失败，错误原因：" + o.errMessage) } }
        } t.load = function (n) {
            return chrome.storage.sync.get(['jrscToken'], function (result) {
                if (result.jrscToken) {
                    return r(n, "https://v2.jinrishici.com/one.json?client=browser-sdk/1.2&X-User-Token=" + encodeURIComponent(result.jrscToken));
                } else {
                    return r(function (t) {
                        chrome.storage.sync.set({ jrscToken: t.token });
                        n(t);
                    }, "https://v2.jinrishici.com/one.json?client=browser-sdk/1.2");
                }
            });
        }, e.jinrishici = t, i() ? c() : (n = function () { i() && c() }, "loading" != document.readyState ? n() : document.addEventListener ? document.addEventListener("DOMContentLoaded", n) : document.attachEvent("onreadystatechange", function () { "complete" == document.readyState && n() }))
    }(window);

    jinrishici.load(function (result) {
        output(result.data.content, '', '—— ' + result.data.origin.author + '《' + result.data.origin.title + '》', 'JrscName', 'https://www.jinrishici.com/', result)
        console.log(result)
    });
}

// 一言逻辑
const hitokoto = () => {
    var xhr = new XMLHttpRequest();
    xhr.open('get', 'https://v1.hitokoto.cn/?encode=json');
    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            const data = JSON.parse(xhr.responseText);

            data.from_who
                ? output(data.hitokoto, '', '—— ' + data.from_who + ' [' + data.from + ']', 'HitokotoName', 'https://hitokoto.cn/', data)
                : output(data.hitokoto, '', '—— ' + data.from, 'HitokotoName', 'https://hitokoto.cn/', data);

            console.log(data)
        }
    }
    xhr.send();
    xhr.onerror = function () {
        local(isOffline = true);
        console.error('Request failed. Network error.');
    }
}

// Get provider from settings or use random as default
chrome.storage.sync.get(['dataSource'], function (result) {
    // Define available providers
    const providers = ['jrsc', 'hitokoto', 'local', 'random'];
    let selectedSource = result.dataSource || 'random';

    // If random is selected, pick one randomly
    if (selectedSource === 'random') {
        const randomProviders = ['jrsc', 'hitokoto', 'local'];
        selectedSource = randomProviders[Math.floor(Math.random() * randomProviders.length)];
    }

    // Trigger the selected provider
    if (selectedSource === 'jrsc') {
        jrsc();
    } else if (selectedSource === 'hitokoto') {
        hitokoto();
    } else if (selectedSource === 'local') {
        // Wait for DOM ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function () {
                local();
            });
        } else {
            local();
        }
    }
});

// Ensure title is set when DOM is fully loaded
document.addEventListener('DOMContentLoaded', function () {
    updateHtmlLang();
    
    // Add event listener for copy JSON button
    const copyJsonBtn = document.getElementById('copyJsonBtn');
    if (copyJsonBtn) {
        copyJsonBtn.addEventListener('click', function() {
            if (currentQuoteData) {
                // Copy the JSON data to clipboard
                navigator.clipboard.writeText(JSON.stringify(currentQuoteData, null, 2))
                    .then(() => {
                        // Show success feedback
                        const originalText = copyJsonBtn.innerText;
                        copyJsonBtn.innerText = chrome.i18n.getMessage('copyJsonSuccess');
                        
                        // Reset button text after 2 seconds
                        setTimeout(() => {
                            copyJsonBtn.innerText = originalText;
                        }, 2000);
                    })
                    .catch(err => {
                        console.error('Failed to copy JSON: ', err);
                    });
            }
        });
    }
});
