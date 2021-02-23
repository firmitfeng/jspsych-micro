var _default = {
    bgColor: 'rgb(200,200,200)',
    elemID: 'exp',
    elemStyle: {
        width: '800px',
        height: '600px',
        border: '1px solid #000',
    },
    debug: true,
};


let debuger = {
    init: function () {
        this.debugDiv = this.createDebugDiv();
    },

    createDebugDiv: function () {
        let deDiv = document.createElement('div');
        deDiv.id = 'debug';
        // deDiv.classList.add('debug');
        document.body.appendChild(deDiv);
        return deDiv;
    },

    dispInfo: function (info, ts = performance.now()) {
        this.debugDiv.innerText = `${ts}: ${info}\n` + this.debugDiv.innerText;
    },
}

const LogLevel = {
    console: 0x1,
    file: 0x2,
    div: 0x4,
    other: 0x8
};

var logger = {

    logs: [],

    init: function (lv = 0) {
        this.level = lv;
        if (this.level & LogLevel.div) {
            debuger.init();
        }
        return this;
    },

    set log(log) {
        let ts = performance.now();
        this.logs.push(`${ts}: ${log}`);
        if (this.level & LogLevel.console) {
            console.log(`${ts}: ${log}`);
        }
        if (this.level & LogLevel.div) {
            debuger.dispInfo(log, ts);
        }
        if (this.level & LogLevel.file) {
            //write to log file
        }
        if (this.level & LogLevel.other) {
            //do sth...
        }
    },

    get log() {
        return this.logs;
    },

    // getlog(idx){
    //     idx = parseInt(idx);
    //     if(!this.logs){
    //         return [];
    //     }
    //     if(!idx || idx<0 || idx >= this.logs.length){
    //         return false;
    //     }
    //     return this.logs[idx];
    // },
};


var jspsych = {
    expRootElem: {},
    expElems: [],
    showIdx: 0,
    hideIdx: 1,
    expItemDOMs: [],
    hasChange: false,

    kb_press: false,

    get lastDOM() {
        if (this.expItemDOMs.length > 0) {
            return this.expItemDOMs[this.expItemDOMs.length - 1];
        } else {
            return {};
        }
    },

    init: function ({ bgColor = 'rgb(200,200,200)',
        elemID = 'exp',
        elemStyle = { width: '800px', height: '600px', border: '1px solid #000', },
        loglv = 0,
        debug = true, } = {}) {

        if (debug) {
            loglv = loglv | LogLevel.div;
        }

        logger.init(loglv);

        logger.log = 'init starting...';
        document.body.style.backgroundColor = bgColor;
        this.expRootElem = document.getElementById(elemID);
        for (let k in elemStyle) {
            this.expRootElem.style[k] = elemStyle[k];
        }

        for (let idx = 0; idx < 2; idx++) {
            this.expElems[idx] = document.createElement('div');
            this.expElems[idx].classList.add("exp-container");
            this.expRootElem.appendChild(this.expElems[idx]);
        }

        this.currShowedElemID = 0;
        logger.log = ('init completed.');
    },

    waitMiSec: function (ms = 0) {
        logger.log = (`wait ${ms} ms`);
        // let ts = performance.now();
        return new Promise(resolve => {
            setTimeout((ts) => {
                resolve({ e: false, s: ts, dur: (performance.now() - ts) });
            }, ms, performance.now()); //performance.now() 返回的是 setTimeout 开始运行的时间
        });
    },

    waitKB: function () {
        logger.log = (`wait key press...`);
        let ts = performance.now();
        return new Promise(resolve => {
            window.addEventListener(
                'keypress',
                (ev) => {
                    resolve({ e: ev, s: ts, dur: (performance.now() - ts) });
                },
                { once: true });
        });

    },

    waitClick: function (objs = []) {
        logger.log = (`wait click`);
        if (!objs) {
            let ts = performance.now();
            return new Promise(resolve => {
                document.addEventListener(
                    'click',
                    (ev) => {
                        resolve({ e: ev, s: ts, dur: (performance.now() - ts) });
                    },
                    { once: true });
            });
        } else {
            var promiseAll = objs.map(function (obj, idx) {
                return new Promise(function (resolve, reject) {
                    obj.addEventListener(
                        'click',
                        (ev) => {
                            resolve({ e: ev, s: ts, dur: (performance.now() - ts), idx: idx });
                        },
                        { once: true });
                });
            });
            return Promise.race(promiseAll);
        }
    },

    waitKBMiSec: function (ms = 0) {
        logger.log = (`wait key press and ${ms} ms`);
        let ms_p = this.waitMiSec(ms);
        let kb_p = this.waitKB()
        return Promise.race([ms_p, kb_p])
    },

    waitKBMiSecsA: function (ms = 0) {
        logger.log = (`wait key press and ${ms} ms`);
        let ms_p = this.waitMiSec(ms);
        let kb_p = this.waitKB()
        return Promise.all([ms_p, kb_p])
    },

    flip: function ({ ts = performance.now(), cls = true } = {}) {
        let self = this;
        return new Promise((resolve) => {
            setTimeout(() => {
                [self.showIdx, self.hideIdx] = [self.hideIdx, self.showIdx];
                // move hide and show to render 
                // self.expElems[self.hideIdx].style.display = 'none';
                // self.expElems[self.showIdx].style.display = 'block';

                if (cls) {
                    self.cleanScreen(self.hideIdx);
                }
                logger.log = (`flip to ${self.showIdx}`);
                self.hasChange = true;
                resolve();
            }, 0);
        });
    },

    render: function ({ ts = performance.now(), cls = true } = {}) {
        let self = this;
        return new Promise((resolve) => {
            setTimeout(() => {
                if (self.hasChange) {
                    logger.log = (`render screen ${self.showIdx}`);
                    self.expElems[self.hideIdx].style.display = 'none';
                    self.expElems[self.showIdx].style.display = 'block';
                    self.hasChange = false;

                    // window.requestAnimationFrame(jspsych.render);
                }
                resolve();
            }, 0);
        });
    },

    fillText: function ({ content = 'this is a text', x = 0, y = 0, w = -1, h = -1, wrapper = 'div', styles = {}, class_ = [] } = {}) {
        let textObj = this.createDOMObj(wrapper, x, y, w, h, styles);
        this.expItemDOMs.push(textObj);
        textObj.innerHTML = content;
        for (let cl of class_) {
            textObj.classList.add(cl);
        }
        this.addItemToDOM(textObj);
        return textObj;
    },

    fillImg: function ({ url = '', x = 0, y = 0, w = -1, h = -1, alt = 'image', styles = {}, class_ = [] } = {}) {
        let imgObj = this.createDOMObj('img', x, y, w, h, styles);
        imgObj.alt = alt;
        this.expItemDOMs.push(imgObj);
        imgObj.src = url;
        for (let cl of class_) {
            imgObj.classList.add(cl);
        }
        this.addItemToDOM(imgObj);
        return imgObj;
    },

    fillCircle: function ({ x = 0, y = 0, w = 50, h = 50, bgColor = 'red', styles = {} } = {}) {
        let circleObj = this.createDOMObj('div', x, y, w, h, styles);
        circleObj.classList.add('circle');
        circleObj.style.backgroundColor = bgColor;
        this.expItemDOMs.push(circleObj);
        this.addItemToDOM(circleObj);
        return circleObj;
    },

    fillRectangle: function ({ x = 0, y = 0, w = 80, h = 50, bgColor = 'red', styles = {} } = {}) {
        let rectObj = this.createDOMObj('div', x, y, w, h, styles);
        rectObj.classList.add('rectangle');
        rectObj.style.backgroundColor = bgColor;
        this.expItemDOMs.push(rectObj);
        this.addItemToDOM(rectObj);
        return rectObj;
    },

    playSound: function ({ start = 0, during = 1, freq = 440, gain = 0.5, oscType = 'sine' } = {}) {
        // 参考：https://cloud.tencent.com/developer/ask/65582
        let context = new (window.AudioContext || window.webkitAudioContext)();
        let osc = context.createOscillator();  // instantiate an oscillator

        osc.type = oscType; // this is the default - also square, sawtooth, triangle
        osc.frequency.value = freq; // Hz

        // 调整音量
        let vol = context.createGain();
        // from 0 to 1, 1 full volume, 0 is muted
        vol.gain.value = gain;

        osc.connect(vol); // connect osc to vol
        osc.connect(context.destination); // connect it to the destination

        osc.start(context.currentTime + start); // start the oscillator
        osc.stop(context.currentTime + during); // stop seconds after the current time
    },

    putObjToCenter: function (obj) {
        let _rw = parseInt(this.expRootElem.style.width),
            _rh = parseInt(this.expRootElem.style.height),
            _ow = parseInt(obj.style.width) || obj.width || obj.naturalWidth || obj.offsetWidth,
            _oh = parseInt(obj.style.height) || obj.height || obj.naturalHeight || obj.offsetHeight;

        let _top = (_rh - _oh) / 2,
            _left = (_rw - _ow) / 2;

        obj.style.top = _top + 'px';
        obj.style.left = _left + 'px';
        this.hasChange = true;
    },

    rotateObj: function (obj, r) {
        // https://blog.csdn.net/y396397735/article/details/80343931
        let _css = `rotate(${r}deg)`;
        obj.style.webkitTransform = _css;   /* Safari 和 Chrome */
        obj.style.mozTransform = _css;      /* Firefox */
        obj.style.msTransform = _css;       /* IE 9 */
        obj.style.oTransform = _css;        /* Opera */
        obj.style.transform = _css;
        this.hasChange = true;
    },

    //清空一个元素，即删除一个元素的所有子元素
    removeAllChild: function (obj) {
        //当div下还存在子节点时 循环继续
        while (obj.hasChildNodes()) {
            obj.removeChild(obj.firstChild);
        }
    },

    cleanScreen: function (clsIdx, ts = performance.now()) {
        if (clsIdx === undefined) {
            clsIdx = this.showIdx;
        } else if (clsIdx < 0 || clsIdx >= this.expElems.length) {
            clsIdx = this.showIdx;
        }
        logger.log = (`clear screen ${clsIdx}`);
        this.removeAllChild(this.expElems[clsIdx]);
        this.hasChange = true;
    },

    cleanScnAndDOM: function () {
        let childNode = this.expItemDOMs.shift()
        while (childNode) {
            this.expRootElem.removeChild(childNode);
            childNode = this.expItemDOMs.shift();
        }
        this.hasChange = true;
    },

    addItemToDOM: function (obj) {
        this.expElems[this.hideIdx].appendChild(obj);
        this.hasChange = true;
    },

    createDOMObj: function (el, x, y, w, h, styles) {
        let htmlObj = document.createElement(el);
        htmlObj.classList.add("exp-item");
        // htmlObj.style.position = 'relative';

        htmlObj.style.left = x + 'px';
        htmlObj.style.top = y + 'px';

        if (w != -1) {
            htmlObj.style.width = w + 'px';
        }
        if (h != -1) {
            htmlObj.style.height = h + 'px';
        }
        for (let k in styles) {
            htmlObj.style[k] = styles[k];
        }
        return htmlObj;
    }
};


// 判断是否按键并延迟设定的时间
async function waitKBAndDelayMs(ms = 0, key_codes = ['Space', 'Enter']) {
    let ts = performance.now();
    let dur = 0;
    let kb = await jspsych.waitKBMiSec(ms);
    dur += kb.dur;
    if (dur < ms) {
        await jspsych.waitMiSec(ms - dur);
    }
    if (kb.e && !key_codes.includes(kb.e.code)) {
        kb.e = false;
    }
    return { e: kb.e, s: ts, dur: dur }
}


// 判断在给定时间内是否按键、是否符合给定组合，
async function waitKBAndMs(ms = 0, key_codes = ['Space', 'Enter']) {
    let ts = performance.now();
    let dur = 1;
    let kb = await jspsych.waitKBMiSec(ms);
    while (kb.e && !key_codes.includes(kb.e.code) && (dur += kb.dur) < ms) {
        kb = await jspsych.waitKBMiSec(ms - dur);
    }
    if (kb.e && !key_codes.includes(kb.e.code)) {
        kb.e = false;
    }
    return { e: kb.e, s: ts, dur: performance.now()-ts }
}


///////////////////////////////////////////////////////////////
// 判断按键是否符合
// kb = await jspsych.waitKB();
// while (!['Space', 'KeyF'].includes(kb.e.code)) {
//     console.log(kb);
//     kb = await jspsych.waitKB();
// }