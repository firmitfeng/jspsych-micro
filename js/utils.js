
function plImgCB(imgs, callback) {
	var promiseAll = imgs.map(function (item, index) {
		return new Promise(function (resolve, reject) {
			var img = new Image();
			img.onload = function () {
				img.onload = null;
				resolve(img);
			};
			img.error = function () {
				reject('图片加载失败');
			};
			img.src = item;
		});
	});
	// return Promise.all(promiseAll);
	Promise.all(promiseAll).then(
		callback,
		function (err) {
			console.log(err);
		}
	);
}

function plImgPr(imgs) {
	var promiseAll = imgs.map(function (item, index) {
		return new Promise(function (resolve, reject) {
			var img = new Image();
			img.onload = function () {
				img.onload = null;
				resolve('done');
			};
			img.error = function () {
				reject(false);
			};
			img.src = item;
		});
	});
	return Promise.all(promiseAll);
}

// Fisher–Yates shuffle 
Array.prototype.shuffle = function () {
	var input = this;
	for (var i = input.length - 1; i >= 0; i--) {
		var randomIndex = Math.floor(Math.random() * (i + 1));
		var itemAtIndex = input[randomIndex];
		input[randomIndex] = input[i];
		input[i] = itemAtIndex;
	}
	return input;
}

// 判断是否为数组
if (!Array.isArray) {
	Array.isArray = function (arg) {
		return Object.prototype.toString.call(arg) === '[object Array]'
	}
}

// 判断对象为空
function isEmptyObject(e) {  
    for (let t in e)  
        return !1;
    return !0;
}  
// var arr = []
// arr[-1] = ''
// isEmptyObject(arr);

function isEmptyObj(e){
	if (Object.keys(e).length === 0) {
		return !false
	}
	return !true
}

Math.randomInt = function (i) {
	if (isNaN(i)) {
		return false;
	}
	return Math.floor(Math.random() * i);
}

function RandomChoice(arr_len, n) {
	if (arr_len < n) {
		return false;
	}
	let result = [];
	let temp_arr = Array.from({ length: arr_len }, (v, i) => i);
	temp_arr.shuffle();
	let rnd_idx;
	for (let i = 0; i < n; i++) {
		rnd_idx = Math.floor(Math.random() * temp_arr.length);
		result.push(temp_arr[rnd_idx]);
		temp_arr.splice(rnd_idx, 1);
	}
	return result;
}

function destoryLocalStorage() {
	localStorage.clear();
};

function fullScreen() {
	var el = document.documentElement;
	var rfs = el.requestFullScreen || el.webkitRequestFullScreen ||
		el.mozRequestFullScreen || el.msRequestFullScreen;
	if (typeof rfs != "undefined" && rfs) {
		rfs.call(el);
	} else if (typeof window.ActiveXObject != "undefined") {
		//for IE，这里其实就是模拟了按下键盘的F11，使浏览器全屏
		var wscript = new ActiveXObject("WScript.Shell");
		if (wscript != null) {
			wscript.SendKeys("{F11}");
		}
	}
}

function exitFullScreen() {
	if (document.exitFullscreen) {
		document.exitFullscreen();
	} else if (document.msExitFullscreen) {
		document.msExitFullscreen();
	} else if (document.mozCancelFullScreen) {
		document.mozCancelFullScreen();
	} else if (document.webkitExitFullscreen) {
		document.webkitExitFullscreen();
	}
}

// 工具函数，结果下载
function download(filename, text) {
	let pom = document.createElement('a');
	pom.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
	pom.setAttribute('download', filename);

	if (document.createEvent) {
		let event = document.createEvent('MouseEvents');
		event.initEvent('click', true, true);
		pom.dispatchEvent(event);
	}
	else {
		pom.click();
	}
};

// 下面的例子则是利用get拦截，实现一个生成各种 DOM 节点的通用函数dom。
// https://es6.ruanyifeng.com/#docs/proxy
const dom = new Proxy({}, {
	get(target, property) {
		return function (attrs = {}, ...children) {
			const el = document.createElement(property);
			for (let prop of Object.keys(attrs)) {
				el.setAttribute(prop, attrs[prop]);
			}
			for (let child of children) {
				if (typeof child === 'string') {
					child = document.createTextNode(child);
				}
				el.appendChild(child);
			}
			return el;
		}
	}
});
// 使用
// const el = dom.div({},
// 	'Hello, my name is ',
// 	dom.a({ href: '//example.com' }, 'Mark'),
// 	'. I like:',
// 	dom.ul({},
// 		dom.li({}, 'The web'),
// 		dom.li({}, 'Food'),
// 		dom.li({}, '…actually that\'s it')
// 	)
// );
// document.body.appendChild(el);