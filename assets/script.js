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

// Initialize and handle storage
chrome.storage.sync.get(['jrscToken', 'openNum'], function (result) {
    // Update HTML lang attribute and page title
    updateHtmlLang();

    jrscToken = result.jrscToken;
    let currentOpenNum = result.openNum || 0;

    // Update open count
    chrome.storage.sync.set({
        'openNum': currentOpenNum + 1
    });
});

const output = (quoteText, titleText, authorText, vendorName, vendorUrl) => {
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

    // Get open count from sync storage
    chrome.storage.sync.get(['openNum'], function (result) {
        document.querySelector('.openNum').innerText = result.openNum || 0;
    });
}

// 无网/无法获取 local
const local = (isOffline) => {
    let localQuotes = [
        {
            text: '无论最终结果将人类文明导向何处，我们，选择希望。',
            author: '电影《流浪地球》'
        },
        {
            text: '没有人的文明，毫无意义。',
            author: '电影《流浪地球》'
        },
        {
            text: '今人不见古时月，今月曾经照古人。',
            author: '李白《把酒问月》'
        },
        {
            text: '无穷的远方，无数的人们，都和我有关。',
            author: '鲁迅《且介亭杂文末集·这也是生活》'
        }
    ];
    let randomSeed = Math.floor(Math.random() * localQuotes.length);
    if (isOffline) {
        output(localQuotes[randomSeed]['text'], '无法获取在线内容，请检查网络连接状态与控制台报错', '—— ' + localQuotes[randomSeed]['author'], 'localDataSetName', 'local');
    } else {
        output(localQuotes[randomSeed]['text'], '', '—— ' + localQuotes[randomSeed]['author'], 'localDataSetName', 'local');
    }
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
        output(result.data.content, '', '—— ' + result.data.origin.author + '《' + result.data.origin.title + '》', 'JrscName', 'https://www.jinrishici.com/')
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
                ? output(data.hitokoto, '', '—— ' + data.from_who + ' [' + data.from + ']', 'HitokotoName', 'https://hitokoto.cn/')
                : output(data.hitokoto, '', '—— ' + data.from, 'HitokotoName', 'https://hitokoto.cn/');

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
});
