let debuger = {
    create: function () {
        this.debugDiv = document.createElement('div');
        this.debugDiv.id = 'debug';
        // this.debugDiv.classList.add('debug');
        document.body.appendChild(this.debugDiv);
        return this;
    },

    dispInfo: function (info, ts = performance.now()) {
        this.debugDiv.innerText = `${ts}: ${info}\n` + this.debugDiv.innerText;
    },
}


const debuger_handler = {
    get(target, propKey) {
        if (propKey[0] === '_') {
            throw new Error(`Invalid attempt to get private "${key}" property`);
        } if (propKey in target) {
            return target[propKey];
        } else {
            throw new ReferenceError("Prop name \"" + propKey + "\" does not exist.");
        }
    },
    set(target, propKey, value) {
        if (propKey[0] === '_') {
            throw new Error(`Invalid attempt to set private "${key}" property`);
        } else if (propKey === 'log') {
            let ts = performance.now();
            let info = `${ts}: ${value}`
            target._logs.push(info);
            console.log(info);
            console.log()
            if (!('debugDiv' in target) || isEmptyObj(target['debugDiv'])) {
                target.debugDiv = debuger.create();
            }
            target.debugDiv.dispInfo(info);
        } else {
            target[propKey] = value;
        }
    }
};


var debug_cfg = {
    bgColor: 'rgb(200,200,200)',
    elemID: 'exp',
    elemStyle: {
        width: '800px',
        height: '600px',
        border: '1px solid #000',
    },
    debug: true,
    debuger_handler: debuger_handler
};


var jspsych = {
    expRootElem: {},    // 实验的根容器
    expElems: [],       // 存放实验内容的容器，有两个，一个保存准备的内容，一个是当前显示的内容
    showIdx: 0,         // 当前显示的实验内容所在容器（expElems）的索引值
    hideIdx: 1,         // 当前隐藏的实验内容所在容器（expElems）的索引值
    expItemDOMs: [],    // 实际的实验的内容
    hasChange: false,   // 容器内容是否有变化，用来判断是否需要重新绘图

    kb_press: false,

    _logger: {
        _logs: [],
        debugDiv: {},

        set log(log) {
            let ts = performance.now();
            this.logs.push(`${ts}: ${log}`);
            console.log(`${ts}: ${log}`);
        },

        get log() {
            return this._logs.length === 0 ? false : this._logs[this._logs.length - 1];
        },

        get logs() {
            return this._logs;
        }
    },

    // 返回最后添加的实验条目
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
        debug = false,
        debuger_handler = {}} = {}) {

        if (debug) {
            this.logger = new Proxy(this._logger, debuger_handler);
        }else{
            this.logger = this._logger;
        }


        this.logger.log = 'init starting...';
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
        this.logger.log = ('init completed.');
    },

    waitMiSec: function (ms = 0) {
        this.logger.log = (`wait ${ms} ms`);
        // let ts = performance.now();
        return new Promise(resolve => {
            setTimeout((ts) => {
                resolve({ e: false, s: ts, dur: (performance.now() - ts) });
            }, ms, performance.now()); //performance.now() 返回的是 setTimeout 开始运行的时间
        });
    },

    waitKB: function () {
        this.logger.log = (`wait key press...`);
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

    waitClick: function (objs = false) {
        this.logger.log = (`wait click`);
        let ts = performance.now();
        if (!objs) {
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
        this.logger.log = (`wait key press and ${ms} ms`);
        let ms_p = this.waitMiSec(ms);
        let kb_p = this.waitKB()
        return Promise.race([ms_p, kb_p])
    },

    waitKBMiSecsA: function (ms = 0) {
        this.logger.log = (`wait key press and ${ms} ms`);
        let ms_p = this.waitMiSec(ms);
        let kb_p = this.waitKB()
        return Promise.all([ms_p, kb_p])
    },

    flip: function ({ ts = performance.now(), cls = true } = {}) {
        let self = this;
        return new Promise((resolve) => {
            // setTimeout(() => {
            [self.showIdx, self.hideIdx] = [self.hideIdx, self.showIdx];
            // move hide and show to render 
            // self.expElems[self.hideIdx].style.display = 'none';
            // self.expElems[self.showIdx].style.display = 'block';

            if (cls) {
                self.cleanScreen(self.hideIdx);
            }
            // this.logger.log = (`flip to ${self.showIdx}`);
            self.hasChange = true;
            resolve();
            // }, 0);
        });
    },

    render: function ({ ts = performance.now(), cls = true } = {}) {
        let self = this;
        return new Promise((resolve) => {
            // setTimeout(()=>{}, 0) 运行速度比 requestAnimationFrame 快
            // 刷新率60Hz时，每16.67 大约运行2次

            // setTimeout(() => {
            //     if (self.hasChange) {
            //         // this.logger.log = (`render screen ${self.showIdx}`);
            //         self.expElems[self.hideIdx].style.display = 'none';
            //         self.expElems[self.showIdx].style.display = 'block';
            //         self.hasChange = false;
            //     }
            //     resolve();
            // }, 0);

            if (self.hasChange) {
                // this.logger.log = (`render screen ${self.showIdx}`);
                self.expElems[self.hideIdx].style.display = 'none';
                self.expElems[self.showIdx].style.display = 'block';
                self.hasChange = false;
            }
            window.requestAnimationFrame(resolve);
        });
    },

    fillText: function ({ content = 'this is a text', x = 0, y = 0, w = -1, h = -1, wrapper = 'div', styles = {}, class_ = [] } = {}, use_curr_elm = false) {
        let textObj = this.createDOMObj(wrapper, x, y, w, h, styles);
        this.expItemDOMs.push(textObj);
        textObj.innerHTML = content;
        for (let cl of class_) {
            textObj.classList.add(cl);
        }
        this.addItemToDOM(textObj, use_curr_elm);
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

    fillButton: function ({ text = '按钮', x = 0, y = 0, w = 100, h = 50, styles = {}, class_ = [] } = {}) {
        let btnObj = this.createDOMObj('button', x, y, w, h, styles);
        btnObj.innerText = text;
        this.expItemDOMs.push(btnObj);
        for (let cl of class_) {
            btnObj.classList.add(cl);
        }
        this.addItemToDOM(btnObj);
        return btnObj;
    },

    fillInput: function ({ tp = 'text', x = 0, y = 0, w = 100, h = 20, attrs = {}, styles = {}, class_ = [] } = {}) {
        let inputObj = this.createDOMObj('input', x, y, w, h, styles);
        inputObj.type = tp;
        for (let prop of Object.keys(attrs)) {
            inputObj.setAttribute(prop, attrs[prop]);
        }
        this.expItemDOMs.push(inputObj);
        for (let cl of class_) {
            inputObj.classList.add(cl);
        }
        this.addItemToDOM(inputObj);
        return inputObj;
    },

    fillRange: function ({ val = 5, min = 1, max = 9, step = 'any', x = 0, y = 0, w = 100, h = 20, styles = {}, class_ = [] } = {}) {
        let attrs = { value: val, min: min, max: max, step: step };
        let rangeObj = this.fillInput({ tp: 'range', x: x, y: y, w: w, h: h, attrs: attrs, styles: styles, class_: class_ });
        return rangeObj;
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

    moveObj: function (obj, { x = false, y = false } = {}) {
        if (x !== false) {
            obj.style.left = x + 'px';
        }
        if (y !== false) {
            obj.style.top = y + 'px';
        }
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
        this.logger.log = (`clear screen ${clsIdx}`);
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

    addItemToDOM: function (obj, use_curr_elm = false) {
        if (!use_curr_elm) {
            this.expElems[this.hideIdx].appendChild(obj);
        } else {
            this.expElems[this.showIdx].appendChild(obj);
        }
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
    },

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
    return { e: kb.e, s: ts, dur: performance.now() - ts }
}


///////////////////////////////////////////////////////////////
// 判断按键是否符合
// kb = await jspsych.waitKB();
// while (!['Space', 'KeyF'].includes(kb.e.code)) {
//     console.log(kb);
//     kb = await jspsych.waitKB();
// }