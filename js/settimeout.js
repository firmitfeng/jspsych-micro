(function() {
    // 参考： https://dbaron.org/log/20100309-faster-timeouts
    
    var zeroTimeoutFuncStack = [];
    var zeroTimeoutMsg = "zero-timeout-message";
    
    var TimeoutFuncStack = [];
    var TimeoutMsg = "timeout-message";

    function setTimeout(fn, ms, ...args) {
        let ts = performance.now();
        TimeoutFuncStack.push({funcName:fn, args: args});
        while(performance.now() -ts < ms){
        }
        window.postMessage(TimeoutMsg, "*");
    }

    function handleTimeoutMsg(event) {
        if (event.source == window && event.data == TimeoutMsg) {
            event.stopPropagation();
            if (TimeoutFuncStack.length > 0) {
                var func = TimeoutFuncStack.shift();
                func['funcName'](...func['args']);
            }
        }
    }

    window.addEventListener("message", handleTimeoutMsg, true);
    // window.setTimeout = setTimeout;
    

    function setZeroTimeout(fn, ...args) {
        let ts = performance.now();
        zeroTimeoutFuncStack.push({funcName:fn, args: args});

        window.postMessage(zeroTimeoutMsg, "*");
    }

    function handleZeroTimeoutMsg(event) {
        if (event.source == window && event.data == zeroTimeoutMsg) {
            event.stopPropagation();
            if (zeroTimeoutFuncStack.length > 0) {
                var func = zeroTimeoutFuncStack.shift();
                func['funcName'](...func['args']);
            }
        }
    }

    window.addEventListener("message", handleZeroTimeoutMsg, true);
    window.setZeroTimeout = setZeroTimeout;

})();