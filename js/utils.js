
function plImgCB (imgs, callback) {
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

function plImgPr (imgs) {
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

if (!Array.isArray) {
	Array.isArray = function (arg) {
		return Object.prototype.toString.call(arg) === '[object Array]'
	}
}

Math.randomInt = function (i) {
	if (isNaN(i)) {
		return false;
	}
	return Math.floor(Math.random() * i);
}

function destoryLocalStorage() {
	//localStorage.clear();
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
	var el = document;
	var cfs = el.cancelFullScreen || el.webkitCancelFullScreen ||
		el.mozCancelFullScreen || el.exitFullScreen;
	if (typeof cfs != "undefined" && cfs) {
		cfs.call(el);
	} else if (typeof window.ActiveXObject != "undefined") {
		//for IE，这里和fullScreen相同，模拟按下F11键退出全屏
		var wscript = new ActiveXObject("WScript.Shell");
		if (wscript != null) {
			wscript.SendKeys("{F11}");
		}
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

function RandomChoice(arr_len,n){
    if(arr_len<n){
        return false;
    }
    let result = [];
    let temp_arr = Array.from({ length: arr_len }, (v, i) => i);
    let rnd_idx;
    for (let i = 0; i < n; i++) {
        rnd_idx = Math.floor(Math.random() * temp_arr.length);
        result.push(temp_arr[rnd_idx]);
        temp_arr.splice(rnd_idx, 1);
    }
    return result;
}