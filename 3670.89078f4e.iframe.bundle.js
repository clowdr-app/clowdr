(self.webpackChunk_midspace_frontend=self.webpackChunk_midspace_frontend||[]).push([[3670],{"../node_modules/.pnpm/@clowdr-app+srt-webvtt@1.1.1/node_modules/@clowdr-app/srt-webvtt/dist/index.es.js":(__unused_webpack_module,__webpack_exports__,__webpack_require__)=>{"use strict";__webpack_require__.d(__webpack_exports__,{J:()=>WebVTTConverter});class WebVTTConverter{constructor(resource){this.resource=resource}blobToBuffer(){return new Promise(((resolve,reject)=>{const reader=new FileReader;reader.addEventListener("loadend",(event=>{var _a;if(!(null===(_a=event.target)||void 0===_a?void 0:_a.result)||"string"==typeof event.target.result)return reject("Invalid loadend event");resolve(new Uint8Array(event.target.result))})),reader.addEventListener("error",(()=>reject("Error while reading the Blob object"))),reader.readAsArrayBuffer(this.resource)}))}static blobToString(blob,success,fail){const reader=new FileReader;reader.addEventListener("loadend",(event=>{var _a;if(!(null===(_a=event.target)||void 0===_a?void 0:_a.result)||"string"!=typeof event.target.result)return fail();const text=event.target.result;success(text)})),reader.addEventListener("error",(()=>fail())),reader.readAsText(blob)}static toVTT(utf8str){return utf8str.replace(/\{\\([ibu])\}/g,"</$1>").replace(/\{\\([ibu])1\}/g,"<$1>").replace(/\{([ibu])\}/g,"<$1>").replace(/\{\/([ibu])\}/g,"</$1>").replace(/(\d\d:\d\d:\d\d),(\d\d\d)/g,"$1.$2").concat("\r\n\r\n")}static toTypedArray(str){const result=[];return str.split("").forEach((each=>{result.push(parseInt(each.charCodeAt(0).toString(),16))})),Uint8Array.from(result)}getURL(){return new Promise(((resolve,reject)=>this.resource instanceof Blob?FileReader?TextDecoder?WebVTTConverter.blobToString(this.resource,(decoded=>{const text="WEBVTT FILE\r\n\r\n".concat(WebVTTConverter.toVTT(decoded)),blob=new Blob([text],{type:"text/vtt"});return this.objectURL=URL.createObjectURL(blob),resolve(this.objectURL)}),(()=>{this.blobToBuffer().then((buffer=>{const utf8str=new TextDecoder("utf-8").decode(buffer),text="WEBVTT FILE\r\n\r\n".concat(WebVTTConverter.toVTT(utf8str)),blob=new Blob([text],{type:"text/vtt"});return this.objectURL=URL.createObjectURL(blob),resolve(this.objectURL)}))})):reject("No TextDecoder constructor found"):reject("No FileReader constructor found"):reject("Expecting resource to be a Blob but something else found.")))}release(){URL.createObjectURL(this.objectURL)}}},"../node_modules/.pnpm/core-js@3.21.0/node_modules/core-js/internals/number-is-finite.js":(module,__unused_webpack_exports,__webpack_require__)=>{var globalIsFinite=__webpack_require__("../node_modules/.pnpm/core-js@3.21.0/node_modules/core-js/internals/global.js").isFinite;module.exports=Number.isFinite||function isFinite(it){return"number"==typeof it&&globalIsFinite(it)}},"../node_modules/.pnpm/core-js@3.21.0/node_modules/core-js/internals/number-parse-float.js":(module,__unused_webpack_exports,__webpack_require__)=>{var global=__webpack_require__("../node_modules/.pnpm/core-js@3.21.0/node_modules/core-js/internals/global.js"),fails=__webpack_require__("../node_modules/.pnpm/core-js@3.21.0/node_modules/core-js/internals/fails.js"),uncurryThis=__webpack_require__("../node_modules/.pnpm/core-js@3.21.0/node_modules/core-js/internals/function-uncurry-this.js"),toString=__webpack_require__("../node_modules/.pnpm/core-js@3.21.0/node_modules/core-js/internals/to-string.js"),trim=__webpack_require__("../node_modules/.pnpm/core-js@3.21.0/node_modules/core-js/internals/string-trim.js").trim,whitespaces=__webpack_require__("../node_modules/.pnpm/core-js@3.21.0/node_modules/core-js/internals/whitespaces.js"),charAt=uncurryThis("".charAt),n$ParseFloat=global.parseFloat,Symbol=global.Symbol,ITERATOR=Symbol&&Symbol.iterator,FORCED=1/n$ParseFloat(whitespaces+"-0")!=-1/0||ITERATOR&&!fails((function(){n$ParseFloat(Object(ITERATOR))}));module.exports=FORCED?function parseFloat(string){var trimmedString=trim(toString(string)),result=n$ParseFloat(trimmedString);return 0===result&&"-"==charAt(trimmedString,0)?-0:result}:n$ParseFloat},"../node_modules/.pnpm/core-js@3.21.0/node_modules/core-js/modules/es.array.every.js":(__unused_webpack_module,__unused_webpack_exports,__webpack_require__)=>{"use strict";var $=__webpack_require__("../node_modules/.pnpm/core-js@3.21.0/node_modules/core-js/internals/export.js"),$every=__webpack_require__("../node_modules/.pnpm/core-js@3.21.0/node_modules/core-js/internals/array-iteration.js").every;$({target:"Array",proto:!0,forced:!__webpack_require__("../node_modules/.pnpm/core-js@3.21.0/node_modules/core-js/internals/array-method-is-strict.js")("every")},{every:function every(callbackfn){return $every(this,callbackfn,arguments.length>1?arguments[1]:void 0)}})},"../node_modules/.pnpm/core-js@3.21.0/node_modules/core-js/modules/es.number.is-finite.js":(__unused_webpack_module,__unused_webpack_exports,__webpack_require__)=>{__webpack_require__("../node_modules/.pnpm/core-js@3.21.0/node_modules/core-js/internals/export.js")({target:"Number",stat:!0},{isFinite:__webpack_require__("../node_modules/.pnpm/core-js@3.21.0/node_modules/core-js/internals/number-is-finite.js")})},"../node_modules/.pnpm/core-js@3.21.0/node_modules/core-js/modules/es.parse-float.js":(__unused_webpack_module,__unused_webpack_exports,__webpack_require__)=>{var $=__webpack_require__("../node_modules/.pnpm/core-js@3.21.0/node_modules/core-js/internals/export.js"),$parseFloat=__webpack_require__("../node_modules/.pnpm/core-js@3.21.0/node_modules/core-js/internals/number-parse-float.js");$({global:!0,forced:parseFloat!=$parseFloat},{parseFloat:$parseFloat})},"../node_modules/.pnpm/react-async-hook@4.0.0_react@17.0.2/node_modules/react-async-hook/dist/react-async-hook.esm.js":(__unused_webpack_module,__webpack_exports__,__webpack_require__)=>{"use strict";__webpack_require__.d(__webpack_exports__,{r5:()=>useAsync});var react__WEBPACK_IMPORTED_MODULE_0__=__webpack_require__("../node_modules/.pnpm/react@17.0.2/node_modules/react/index.js");function _extends(){return _extends=Object.assign||function(target){for(var i=1;i<arguments.length;i++){var source=arguments[i];for(var key in source)Object.prototype.hasOwnProperty.call(source,key)&&(target[key]=source[key])}return target},_extends.apply(this,arguments)}"undefined"!=typeof Symbol&&(Symbol.iterator||(Symbol.iterator=Symbol("Symbol.iterator"))),"undefined"!=typeof Symbol&&(Symbol.asyncIterator||(Symbol.asyncIterator=Symbol("Symbol.asyncIterator")));var useIsomorphicLayoutEffect="undefined"!=typeof window&&void 0!==window.document&&void 0!==window.document.createElement?react__WEBPACK_IMPORTED_MODULE_0__.useLayoutEffect:react__WEBPACK_IMPORTED_MODULE_0__.useEffect,InitialAsyncState={status:"not-requested",loading:!1,result:void 0,error:void 0},InitialAsyncLoadingState={status:"loading",loading:!0,result:void 0,error:void 0},noop=function noop(){},DefaultOptions={initialState:function initialState(options){return options&&options.executeOnMount?InitialAsyncLoadingState:InitialAsyncState},executeOnMount:!0,executeOnUpdate:!0,setLoading:function defaultSetLoading(_asyncState){return InitialAsyncLoadingState},setResult:function defaultSetResult(result,_asyncState){return{status:"success",loading:!1,result,error:void 0}},setError:function defaultSetError(error,_asyncState){return{status:"error",loading:!1,result:void 0,error}},onSuccess:noop,onError:noop},useAsyncInternal=function useAsyncInternal(asyncFunction,params,options){!params&&(params=[]);var normalizedOptions=function normalizeOptions(options){return _extends({},DefaultOptions,{},options)}(options),_useState2=(0,react__WEBPACK_IMPORTED_MODULE_0__.useState)(null),currentParams=_useState2[0],setCurrentParams=_useState2[1],AsyncState=function useAsyncState(options){var _useState=(0,react__WEBPACK_IMPORTED_MODULE_0__.useState)((function(){return options.initialState(options)})),value=_useState[0],setValue=_useState[1],reset=(0,react__WEBPACK_IMPORTED_MODULE_0__.useCallback)((function(){return setValue(options.initialState(options))}),[setValue,options]),setLoading=(0,react__WEBPACK_IMPORTED_MODULE_0__.useCallback)((function(){return setValue(options.setLoading(value))}),[value,setValue]),setResult=(0,react__WEBPACK_IMPORTED_MODULE_0__.useCallback)((function(result){return setValue(options.setResult(result,value))}),[value,setValue]),setError=(0,react__WEBPACK_IMPORTED_MODULE_0__.useCallback)((function(error){return setValue(options.setError(error,value))}),[value,setValue]),merge=(0,react__WEBPACK_IMPORTED_MODULE_0__.useCallback)((function(state){return setValue(_extends({},value,{},state))}),[value,setValue]);return{value,set:setValue,merge,reset,setLoading,setResult,setError}}(normalizedOptions),isMounted=function useIsMounted(){var ref=(0,react__WEBPACK_IMPORTED_MODULE_0__.useRef)(!1);return(0,react__WEBPACK_IMPORTED_MODULE_0__.useEffect)((function(){return ref.current=!0,function(){ref.current=!1}}),[]),function(){return ref.current}}(),CurrentPromise=function useCurrentPromise(){var ref=(0,react__WEBPACK_IMPORTED_MODULE_0__.useRef)(null);return{set:function set(promise){return ref.current=promise},get:function get(){return ref.current},is:function is(promise){return ref.current===promise}}}(),shouldHandlePromise=function shouldHandlePromise(p){return isMounted()&&CurrentPromise.is(p)},getLatestExecuteAsyncOperation=function useGetter(t){var ref=(0,react__WEBPACK_IMPORTED_MODULE_0__.useRef)(t);return useIsomorphicLayoutEffect((function(){ref.current=t})),(0,react__WEBPACK_IMPORTED_MODULE_0__.useCallback)((function(){return ref.current}),[ref])}((function executeAsyncOperation(){for(var _len=arguments.length,args=new Array(_len),_key=0;_key<_len;_key++)args[_key]=arguments[_key];var promise=function(){try{return Promise.resolve(asyncFunction.apply(void 0,args))}catch(e){return Promise.reject(e)}}();return setCurrentParams(args),CurrentPromise.set(promise),AsyncState.setLoading(),promise.then((function(result){shouldHandlePromise(promise)&&AsyncState.setResult(result),normalizedOptions.onSuccess(result,{isCurrent:function isCurrent(){return CurrentPromise.is(promise)}})}),(function(error){shouldHandlePromise(promise)&&AsyncState.setError(error),normalizedOptions.onError(error,{isCurrent:function isCurrent(){return CurrentPromise.is(promise)}})})),promise})),executeAsyncOperationMemo=(0,react__WEBPACK_IMPORTED_MODULE_0__.useCallback)((function(){return getLatestExecuteAsyncOperation().apply(void 0,arguments)}),[getLatestExecuteAsyncOperation]),isMounting=!isMounted();return(0,react__WEBPACK_IMPORTED_MODULE_0__.useEffect)((function(){var execute=function execute(){return getLatestExecuteAsyncOperation().apply(void 0,params)};isMounting&&normalizedOptions.executeOnMount&&execute(),!isMounting&&normalizedOptions.executeOnUpdate&&execute()}),params),_extends({},AsyncState.value,{set:AsyncState.set,merge:AsyncState.merge,reset:AsyncState.reset,execute:executeAsyncOperationMemo,currentPromise:CurrentPromise.get(),currentParams})};function useAsync(asyncFunction,params,options){return useAsyncInternal(asyncFunction,params,options)}},"../node_modules/.pnpm/srt-validator@3.2.4/node_modules/srt-validator/dist/srtValidator.js":function(module){module.exports=function(e){var t={};function r(n){if(t[n])return t[n].exports;var o=t[n]={i:n,l:!1,exports:{}};return e[n].call(o.exports,o,o.exports,r),o.l=!0,o.exports}return r.m=e,r.c=t,r.d=function(e,t,n){r.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:n})},r.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},r.t=function(e,t){if(1&t&&(e=r(e)),8&t)return e;if(4&t&&"object"==typeof e&&e&&e.__esModule)return e;var n=Object.create(null);if(r.r(n),Object.defineProperty(n,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var o in e)r.d(n,o,function(t){return e[t]}.bind(null,o));return n},r.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return r.d(t,"a",t),t},r.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},r.p="",r(r.s=3)}([function(e,t,r){var n,o,u;o=[t],void 0===(u="function"==typeof(n=function(e){"use strict";Object.defineProperty(e,"__esModule",{value:!0}),e.ERROR_CODE=void 0,e.ERROR_CODE={PARSER_ERROR_MISSING_TEXT:"parserErrorMissingText",PARSER_ERROR_MISSING_SEQUENCE_NUMBER:"parserErrorMissingSequenceNumber",PARSER_ERROR_INVALID_SEQUENCE_NUMBER:"parserErrorInvalidSequenceNumber",PARSER_ERROR_MISSING_TIME_SPAN:"parserErrorMissingTimeSpan",PARSER_ERROR_INVALID_TIME_SPAN:"parserErrorInvalidTimeSpan",PARSER_ERROR_INVALID_TIME_STAMP:"parserErrorInvalidTimeStamp",VALIDATOR_ERROR_START_TIME:"validatorErrorStartTime",VALIDATOR_ERROR_END_TIME:"validatorErrorEndTime",VALIDATOR_ERROR_SEQUENCE_NUMBER_START:"validatorErrorSequenceNumberStart",VALIDATOR_ERROR_SEQUENCE_NUMBER_INCREMENT:"validatorErrorSequenceNumberIncrement"}})?n.apply(t,o):n)||(e.exports=u)},function(e,t,r){var n,o,u;o=[t],void 0===(u="function"==typeof(n=function(e){"use strict";Object.defineProperty(e,"__esModule",{value:!0}),e.toMS=void 0,e.toMS={hour:36e5,minute:6e4,second:1e3}})?n.apply(t,o):n)||(e.exports=u)},function(e,t,r){var n,o,u;o=[t],void 0===(u="function"==typeof(n=function(r){"use strict";function n(e,t){for(var r=0;r<t.length;r++){var n=t[r];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(e,n.key,n)}}Object.defineProperty(r,"__esModule",{value:!0}),r.default=void 0;var o=function(){function e(t){!function(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}(this,e),this.result=[],this.parsedJSON=t}return t=e,(r=[{key:"validate",value:function(){if(!this.parsedJSON.length)return this.result}},{key:"_addToResult",value:function(e){var t=e.message,r=void 0===t?"":t,n=e.lineNumber,o=e.errorCode;this.result.push({errorCode:o,message:r,lineNumber:n,validator:this._validator})}}])&&n(t.prototype,r),o&&n(t,o),e;var t,r,o}();r.default=o,e.exports=t.default})?n.apply(t,o):n)||(e.exports=u)},function(e,t,r){var n,o,u;o=[t,r(4),r(8),r(9)],void 0===(u="function"==typeof(n=function(e,t,r,n){"use strict";function o(e){return e&&e.__esModule?e:{default:e}}function u(e){return function(e){if(Array.isArray(e)){for(var t=0,r=new Array(e.length);t<e.length;t++)r[t]=e[t];return r}}(e)||function(e){if(Symbol.iterator in Object(e)||"[object Arguments]"===Object.prototype.toString.call(e))return Array.from(e)}(e)||function(){throw new TypeError("Invalid attempt to spread non-iterable instance")}()}function i(e){var o,i=[];try{o=t.default.parse(e)}catch(e){var a=e.message,c=e.lineNumber,f=e.errorCode;i.push({message:a,lineNumber:c,errorCode:f})}return i.length?i:(i.push.apply(i,u(function(e,t){return e.map((function(e){return new e(t).validate()})).reduce((function(e,t){return e.push.apply(e,u(t)),e}),[])}([n.default,r.default],o))),i.sort((function(e,t){return e.lineNumber-t.lineNumber})))}Object.defineProperty(e,"__esModule",{value:!0}),e.default=e.parser=e.validator=void 0,t=o(t),r=o(r),n=o(n);var a=i;e.validator=a;var c=t.default;e.parser=c;var f=i;e.default=f})?n.apply(t,o):n)||(e.exports=u)},function(e,t,r){var n,o,u;o=[t,r(5),r(7)],void 0===(u="function"==typeof(n=function(r,n,o){"use strict";function u(e){return e&&e.__esModule?e:{default:e}}Object.defineProperty(r,"__esModule",{value:!0}),r.default=void 0,n=u(n),o=u(o);var i={parse:n.default,serialize:o.default};r.default=i,e.exports=t.default})?n.apply(t,o):n)||(e.exports=u)},function(e,t,r){var n,o,u;o=[t,r(0),r(6),r(1)],void 0===(u="function"==typeof(n=function(e,t,r,n){"use strict";function o(e,t){return function(e){if(Array.isArray(e))return e}(e)||function(e,t){var r=[],n=!0,o=!1,u=void 0;try{for(var i,a=e[Symbol.iterator]();!(n=(i=a.next()).done)&&(r.push(i.value),!t||r.length!==t);n=!0);}catch(e){o=!0,u=e}finally{try{n||null==a.return||a.return()}finally{if(o)throw u}}return r}(e,t)||function(){throw new TypeError("Invalid attempt to destructure non-iterable instance")}()}var u;Object.defineProperty(e,"__esModule",{value:!0}),e.default=function(e){for(var n=e.trimEnd().split(i),o=[],u=0;u<n.length;u++){var a={chunkStart:u},c=f(n[u],u);u++,a.timeSpan=u;var s=l(n[u],u);u++,a.text=u;for(var p=[];n[u]&&n[u].trim();)p.push(n[u]),u++;var d=p.join("\n");if(!d)throw new r.default("Missing caption text",u,t.ERROR_CODE.PARSER_ERROR_MISSING_TEXT);a.chunkEnd=u-1,o.push({lineNumbers:a,sequenceNumber:c,time:s,text:d})}return o},e.parseTimeStamp=s,r=(u=r)&&u.__esModule?u:{default:u};var i=/\r?\n/,a=/\s$/,c=/^(\d{2}):(\d{2}):(\d{2}),(\d{3})$/;function f(e,n){if(!e)throw new r.default("Missing sequence number",n,t.ERROR_CODE.PARSER_ERROR_MISSING_SEQUENCE_NUMBER);var o=Number(e);if(!Number.isInteger(o)||a.test(e))throw new r.default("Expected Integer for sequence number: ".concat(e),n,t.ERROR_CODE.PARSER_ERROR_INVALID_SEQUENCE_NUMBER);return o}function l(e,n){if(!e)throw new r.default("Missing time span",n,t.ERROR_CODE.PARSER_ERROR_MISSING_TIME_SPAN);var i=o(e.split(" --\x3e "),2),c=i[0],f=i[1];if(!c||!f||a.test(e))throw new r.default("Invalid time span: ".concat(e),n,t.ERROR_CODE.PARSER_ERROR_INVALID_TIME_SPAN);return{start:s(c,n),end:s(f,n)}}function s(e,u){var i=c.exec(e);if(!i)throw new r.default("Invalid time stamp: ".concat(e),u,t.ERROR_CODE.PARSER_ERROR_INVALID_TIME_STAMP);var f=o(i.slice(1).map(Number),4),l=f[0],s=f[1],p=f[2],d=f[3];return l*n.toMS.hour+s*n.toMS.minute+p*n.toMS.second+d}})?n.apply(t,o):n)||(e.exports=u)},function(e,t,r){var n,o,u;o=[t],void 0===(u="function"==typeof(n=function(r){"use strict";function n(e){return(n="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e})(e)}function o(e,t){return!t||"object"!==n(t)&&"function"!=typeof t?function(e){if(void 0===e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return e}(e):t}function u(e){var t="function"==typeof Map?new Map:void 0;return(u=function(e){if(null===e||(r=e,-1===Function.toString.call(r).indexOf("[native code]")))return e;var r;if("function"!=typeof e)throw new TypeError("Super expression must either be null or a function");if(void 0!==t){if(t.has(e))return t.get(e);t.set(e,n)}function n(){return i(e,arguments,c(this).constructor)}return n.prototype=Object.create(e.prototype,{constructor:{value:n,enumerable:!1,writable:!0,configurable:!0}}),a(n,e)})(e)}function i(e,t,r){return(i=function(){if("undefined"==typeof Reflect||!Reflect.construct)return!1;if(Reflect.construct.sham)return!1;if("function"==typeof Proxy)return!0;try{return Date.prototype.toString.call(Reflect.construct(Date,[],(function(){}))),!0}catch(e){return!1}}()?Reflect.construct:function(e,t,r){var n=[null];n.push.apply(n,t);var u=new(Function.bind.apply(e,n));return r&&a(u,r.prototype),u}).apply(null,arguments)}function a(e,t){return(a=Object.setPrototypeOf||function(e,t){return e.__proto__=t,e})(e,t)}function c(e){return(c=Object.setPrototypeOf?Object.getPrototypeOf:function(e){return e.__proto__||Object.getPrototypeOf(e)})(e)}Object.defineProperty(r,"__esModule",{value:!0}),r.default=void 0;var f=function(e){function t(e,r,n){var u;return function(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}(this,t),(u=o(this,c(t).call(this,e))).lineNumber=r+1,u.errorCode=n,u}return function(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function");e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,writable:!0,configurable:!0}}),t&&a(e,t)}(t,e),t}(u(Error));r.default=f,e.exports=t.default})?n.apply(t,o):n)||(e.exports=u)},function(e,t,r){var n,o,u;o=[t,r(1)],void 0===(u="function"==typeof(n=function(r,n){"use strict";function o(e,t){return function(e){if(Array.isArray(e))return e}(e)||function(e,t){var r=[],n=!0,o=!1,u=void 0;try{for(var i,a=e[Symbol.iterator]();!(n=(i=a.next()).done)&&(r.push(i.value),!t||r.length!==t);n=!0);}catch(e){o=!0,u=e}finally{try{n||null==a.return||a.return()}finally{if(o)throw u}}return r}(e,t)||function(){throw new TypeError("Invalid attempt to destructure non-iterable instance")}()}function u(e,t,r){return t in e?Object.defineProperty(e,t,{value:r,enumerable:!0,configurable:!0,writable:!0}):e[t]=r,e}Object.defineProperty(r,"__esModule",{value:!0}),r.default=function(e){var t=arguments.length>1&&void 0!==arguments[1]?arguments[1]:"SRT",r={FILE_HEADER:"",MS_SEPERATOR:",",FORMAT_TEXT:function(e){return e},CHUNK_SEPARATOR:"".concat(i).concat(i)};switch(t.toLowerCase()){case"webvtt":r=function(e){for(var t=1;t<arguments.length;t++){var r=null!=arguments[t]?arguments[t]:{},n=Object.keys(r);"function"==typeof Object.getOwnPropertySymbols&&(n=n.concat(Object.getOwnPropertySymbols(r).filter((function(e){return Object.getOwnPropertyDescriptor(r,e).enumerable})))),n.forEach((function(t){u(e,t,r[t])}))}return e}({},r,{FILE_HEADER:"WEBVTT".concat(i).concat(i),MS_SEPERATOR:"."});break;case"srt":break;default:throw new Error("Unrecognized format: ".concat(t))}return r.FILE_HEADER+e.map((function(e){return"".concat(e.sequenceNumber,"\n").concat(function(e,t){return"".concat(a(e.start,t)," --\x3e ").concat(a(e.end,t))}(e.time,r),"\n").concat(r.FORMAT_TEXT(e.text))})).join(r.CHUNK_SEPARATOR)};var i="\n";function a(e,t){var r=e,u=e/n.toMS.hour,i=(r%=n.toMS.hour)/n.toMS.minute,a=(r%=n.toMS.minute)/n.toMS.second,c=r%=n.toMS.second,f=[2,2,2,3],l=[u,i,a,c].map((function(e,t){return"".concat(Math.floor(e)).padStart(f[t],"0")})),s=o(l,4),p=s[0],d=s[1],y=s[2],R=s[3];return"".concat(p,":").concat(d,":").concat(y).concat(t.MS_SEPERATOR).concat(R)}e.exports=t.default})?n.apply(t,o):n)||(e.exports=u)},function(e,t,r){var n,o,u;o=[t,r(2),r(0)],void 0===(u="function"==typeof(n=function(r,n,o){"use strict";function u(e){return(u="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e})(e)}function i(e,t){for(var r=0;r<t.length;r++){var n=t[r];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(e,n.key,n)}}function a(e,t){return!t||"object"!==u(t)&&"function"!=typeof t?function(e){if(void 0===e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return e}(e):t}function c(e,t,r){return(c="undefined"!=typeof Reflect&&Reflect.get?Reflect.get:function(e,t,r){var n=function(e,t){for(;!Object.prototype.hasOwnProperty.call(e,t)&&null!==(e=f(e)););return e}(e,t);if(n){var o=Object.getOwnPropertyDescriptor(n,t);return o.get?o.get.call(r):o.value}})(e,t,r||e)}function f(e){return(f=Object.setPrototypeOf?Object.getPrototypeOf:function(e){return e.__proto__||Object.getPrototypeOf(e)})(e)}function l(e,t){return(l=Object.setPrototypeOf||function(e,t){return e.__proto__=t,e})(e,t)}Object.defineProperty(r,"__esModule",{value:!0}),r.default=void 0;var s,p=function(e){function t(){var e,r;!function(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}(this,t);for(var n=arguments.length,o=new Array(n),u=0;u<n;u++)o[u]=arguments[u];return(r=a(this,(e=f(t)).call.apply(e,[this].concat(o))))._validator="CaptionTimeSpanValidator",r}return function(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function");e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,writable:!0,configurable:!0}}),t&&l(e,t)}(t,e),r=t,(n=[{key:"validate",value:function(){for(var e,r=this,n=arguments.length,u=new Array(n),i=0;i<n;i++)u[i]=arguments[i];(e=c(f(t.prototype),"validate",this)).call.apply(e,[this].concat(u));var a=0;return this.parsedJSON.map((function(e,t){var n=e.time,u=n.start,i=n.end,a=e.lineNumbers;return u>=i&&r._addToResult({errorCode:o.ERROR_CODE.VALIDATOR_ERROR_START_TIME,message:"start time should be less than end time",lineNumber:a.timeSpan+1}),{start:u,end:i,lineNumbers:a}})).map((function(e,t){var n=e.start,u=e.end,i=e.lineNumbers;0!==t?(a>n&&r._addToResult({errorCode:o.ERROR_CODE.VALIDATOR_ERROR_END_TIME,message:"start time should be less than previous end time",lineNumber:i.timeSpan+1}),a=u):a=u})),this.result}}])&&i(r.prototype,n),u&&i(r,u),t;var r,n,u}((s=n,n=s&&s.__esModule?s:{default:s}).default);r.default=p,e.exports=t.default})?n.apply(t,o):n)||(e.exports=u)},function(e,t,r){var n,o,u;o=[t,r(2),r(0)],void 0===(u="function"==typeof(n=function(r,n,o){"use strict";function u(e){return(u="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(e){return typeof e}:function(e){return e&&"function"==typeof Symbol&&e.constructor===Symbol&&e!==Symbol.prototype?"symbol":typeof e})(e)}function i(e,t){for(var r=0;r<t.length;r++){var n=t[r];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(e,n.key,n)}}function a(e,t){return!t||"object"!==u(t)&&"function"!=typeof t?function(e){if(void 0===e)throw new ReferenceError("this hasn't been initialised - super() hasn't been called");return e}(e):t}function c(e,t,r){return(c="undefined"!=typeof Reflect&&Reflect.get?Reflect.get:function(e,t,r){var n=function(e,t){for(;!Object.prototype.hasOwnProperty.call(e,t)&&null!==(e=f(e)););return e}(e,t);if(n){var o=Object.getOwnPropertyDescriptor(n,t);return o.get?o.get.call(r):o.value}})(e,t,r||e)}function f(e){return(f=Object.setPrototypeOf?Object.getPrototypeOf:function(e){return e.__proto__||Object.getPrototypeOf(e)})(e)}function l(e,t){return(l=Object.setPrototypeOf||function(e,t){return e.__proto__=t,e})(e,t)}Object.defineProperty(r,"__esModule",{value:!0}),r.default=void 0;var s,p=function(e){function t(){var e,r;!function(e,t){if(!(e instanceof t))throw new TypeError("Cannot call a class as a function")}(this,t);for(var n=arguments.length,o=new Array(n),u=0;u<n;u++)o[u]=arguments[u];return(r=a(this,(e=f(t)).call.apply(e,[this].concat(o))))._validator="LineNumberValidator",r}return function(e,t){if("function"!=typeof t&&null!==t)throw new TypeError("Super expression must either be null or a function");e.prototype=Object.create(t&&t.prototype,{constructor:{value:e,writable:!0,configurable:!0}}),t&&l(e,t)}(t,e),r=t,(n=[{key:"validate",value:function(){for(var e,r=arguments.length,n=new Array(r),u=0;u<r;u++)n[u]=arguments[u];(e=c(f(t.prototype),"validate",this)).call.apply(e,[this].concat(n)),1!==this.parsedJSON[0].sequenceNumber&&this._addToResult({errorCode:o.ERROR_CODE.VALIDATOR_ERROR_SEQUENCE_NUMBER_START,message:"number of sequence need to start with 1",lineNumber:this.parsedJSON[0].lineNumbers.chunkStart+1});for(var i=1;i<this.parsedJSON.length;i++){var a=this.parsedJSON[i],l=a.sequenceNumber,s=a.lineNumbers;l!==i+1&&this._addToResult({errorCode:o.ERROR_CODE.VALIDATOR_ERROR_SEQUENCE_NUMBER_INCREMENT,message:"number of sequence need to increment by 1",lineNumber:s.chunkStart+1})}return this.result}}])&&i(r.prototype,n),u&&i(r,u),t;var r,n,u}((s=n,n=s&&s.__esModule?s:{default:s}).default);r.default=p,e.exports=t.default})?n.apply(t,o):n)||(e.exports=u)}])}}]);