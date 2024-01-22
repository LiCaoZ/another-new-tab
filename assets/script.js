// 取配置项
const getlSItem = (key) => {
    return localStorage.getItem(key);
}

let contentOption = getlSItem('contentOption');
let jrscToken = getlSItem('jrscToken');

getlSItem('openNum') == null ? localStorage.setItem('openNum', 1) : localStorage.setItem('openNum', parseInt(getlSItem('openNum')) + 1);

// 无网/无法获取 fallback
const fallback = () => {
    let fallbackQuotes = [
        {
            text: '原神是检验原神的唯一标准。',
            author: '中国科学技术大学第十届信息安全大赛选手群'
        },
        {
            text: '「原神」是世界上坠吼的游戏。',
            author: '洛川泽'
        },
        {
            text: '不玩原神的话，你将会度过相对失败的一生。',
            author: '洛川泽'
        },
        {
            text: '加入原神大学，共创辉煌人生！',
            author: 'ShanMao'
        },
        {
            text: '鱼与熊掌不可兼得，除非加钱（x',
            author: '中国的小赵'
        },
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
            text: '我们未曾拥有繁星，我们只是星图的谱写者。',
            author: 'Eric Zhao'
        },
        {
            text: '不管几岁，快乐万岁！',
            author: 'Eric Zhao'
        },
        {
            text: '别赶路，去感受路。',
            author: '中国的小赵'
        },
        {
            text: '无穷的远方，无数的人们，都和我有关。',
            author: '鲁迅《且介亭杂文末集·这也是生活》'
        }
    ];
    let randomSeed = Math.floor(Math.random() * fallbackQuotes.length);
    document.querySelector('.quote-text').innerText = fallbackQuotes[randomSeed]['text'];
    document.querySelector('.title-text').innerText = '无法获取在线内容，请检查网络连接状态与控制台报错';
    document.querySelector('.author-text').innerText = '—— ' + fallbackQuotes[randomSeed]['author'];
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
                fallback();
                console.error('Request failed. Network error.');
            }, t.onreadystatechange = function (n) { if (4 === t.readyState) { var o = JSON.parse(t.responseText); "success" === o.status ? e(o) : console.error("今日诗词API加载失败，错误原因：" + o.errMessage) } }
        } t.load = function (n) { return e.localStorage && e.localStorage.getItem(o) ? function (e, n) { return r(e, "https://v2.jinrishici.com/one.json?client=browser-sdk/1.2&X-User-Token=" + encodeURIComponent(n)) }(n, e.localStorage.getItem(o)) : function (n) { return r(function (t) { e.localStorage.setItem(o, t.token), n(t) }, "https://v2.jinrishici.com/one.json?client=browser-sdk/1.2") }(n) }, e.jinrishici = t, i() ? c() : (n = function () { i() && c() }, "loading" != document.readyState ? n() : document.addEventListener ? document.addEventListener("DOMContentLoaded", n) : document.attachEvent("onreadystatechange", function () { "complete" == document.readyState && n() }))
    }(window);

    jinrishici.load(function (result) {
        document.querySelector('.quote-text').innerText = result.data.content;
        document.querySelector('.title-text').innerText = '';
        document.querySelector('.author-text').innerText = '—— ' + result.data.origin.author + '《' + result.data.origin.title + '》';
        console.log(result)
    });
}

// 一言逻辑
const hitokoto = () => {
    fetch("https://v1.hitokoto.cn/?encode=json&" + Math.random())
        .then((response) => response.json())
        .then((data) => {
            document.querySelector('.quote-text').innerText = data.hitokoto;
            document.querySelector('.title-text').innerText = '';
            document.querySelector('.author-text').innerText = '—— ' + data.from;
        })
        .catch(
            console.error('Request failed. Network error.'),
            fallback()
        );
}

if (contentOption == null) {
    localStorage.setItem('contentOption', 'jrsc');
    jrsc();
} else {
    if (contentOption == 'jrsc') {
        jrsc();
    } else if (contentOption == 'hitokoto') {
        hitokoto();
    } else {
        fallback();
    }
}
