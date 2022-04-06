"use strict";(self.webpackChunk_midspace_frontend=self.webpackChunk_midspace_frontend||[]).push([[4813],{"./src/aspects/Conference/Attend/Content/Element/VideoElement.tsx":(__unused_webpack_module,__webpack_exports__,__webpack_require__)=>{__webpack_require__.d(__webpack_exports__,{q:()=>VideoElement});__webpack_require__("../node_modules/.pnpm/core-js@3.21.0/node_modules/core-js/modules/es.object.assign.js"),__webpack_require__("../node_modules/.pnpm/core-js@3.21.0/node_modules/core-js/modules/es.parse-float.js"),__webpack_require__("../node_modules/.pnpm/core-js@3.21.0/node_modules/core-js/modules/es.number.is-finite.js"),__webpack_require__("../node_modules/.pnpm/core-js@3.21.0/node_modules/core-js/modules/es.number.constructor.js"),__webpack_require__("../node_modules/.pnpm/core-js@3.21.0/node_modules/core-js/modules/es.number.to-fixed.js"),__webpack_require__("../node_modules/.pnpm/core-js@3.21.0/node_modules/core-js/modules/es.array.is-array.js"),__webpack_require__("../node_modules/.pnpm/core-js@3.21.0/node_modules/core-js/modules/es.symbol.js"),__webpack_require__("../node_modules/.pnpm/core-js@3.21.0/node_modules/core-js/modules/es.symbol.description.js"),__webpack_require__("../node_modules/.pnpm/core-js@3.21.0/node_modules/core-js/modules/es.object.to-string.js"),__webpack_require__("../node_modules/.pnpm/core-js@3.21.0/node_modules/core-js/modules/es.symbol.iterator.js"),__webpack_require__("../node_modules/.pnpm/core-js@3.21.0/node_modules/core-js/modules/es.string.iterator.js"),__webpack_require__("../node_modules/.pnpm/core-js@3.21.0/node_modules/core-js/modules/es.array.iterator.js"),__webpack_require__("../node_modules/.pnpm/core-js@3.21.0/node_modules/core-js/modules/web.dom-collections.iterator.js"),__webpack_require__("../node_modules/.pnpm/core-js@3.21.0/node_modules/core-js/modules/es.array.slice.js"),__webpack_require__("../node_modules/.pnpm/core-js@3.21.0/node_modules/core-js/modules/es.function.name.js"),__webpack_require__("../node_modules/.pnpm/core-js@3.21.0/node_modules/core-js/modules/es.array.from.js");var _chakra_ui_react__WEBPACK_IMPORTED_MODULE_23__=__webpack_require__("../node_modules/.pnpm/@chakra-ui+layout@1.7.4_d5de66fc214059f645050e36d066c00a/node_modules/@chakra-ui/layout/dist/chakra-ui-layout.esm.js"),_chakra_ui_react__WEBPACK_IMPORTED_MODULE_24__=__webpack_require__("../node_modules/.pnpm/@chakra-ui+menu@1.8.6_381b254eb05ba0b21fa13fc526cde82c/node_modules/@chakra-ui/menu/dist/chakra-ui-menu.esm.js"),_chakra_ui_react__WEBPACK_IMPORTED_MODULE_25__=__webpack_require__("../node_modules/.pnpm/@chakra-ui+button@1.5.5_d5de66fc214059f645050e36d066c00a/node_modules/@chakra-ui/button/dist/chakra-ui-button.esm.js"),react__WEBPACK_IMPORTED_MODULE_16__=__webpack_require__("../node_modules/.pnpm/react@17.0.2/node_modules/react/index.js"),react_player__WEBPACK_IMPORTED_MODULE_17__=__webpack_require__("../node_modules/.pnpm/react-player@2.9.0_react@17.0.2/node_modules/react-player/lib/index.js"),_generated_graphql__WEBPACK_IMPORTED_MODULE_18__=__webpack_require__("./src/generated/graphql.tsx"),_Chakra_FAIcon__WEBPACK_IMPORTED_MODULE_19__=__webpack_require__("./src/aspects/Chakra/FAIcon.tsx"),_Realtime_Analytics_useTrackView__WEBPACK_IMPORTED_MODULE_20__=__webpack_require__("./src/aspects/Realtime/Analytics/useTrackView.tsx"),_useMediaElement__WEBPACK_IMPORTED_MODULE_21__=__webpack_require__("./src/aspects/Conference/Attend/Content/Element/useMediaElement.tsx"),react_jsx_runtime__WEBPACK_IMPORTED_MODULE_22__=__webpack_require__("../node_modules/.pnpm/react@17.0.2/node_modules/react/jsx-runtime.js");function _slicedToArray(arr,i){return function _arrayWithHoles(arr){if(Array.isArray(arr))return arr}(arr)||function _iterableToArrayLimit(arr,i){var _i=null==arr?null:"undefined"!=typeof Symbol&&arr[Symbol.iterator]||arr["@@iterator"];if(null==_i)return;var _s,_e,_arr=[],_n=!0,_d=!1;try{for(_i=_i.call(arr);!(_n=(_s=_i.next()).done)&&(_arr.push(_s.value),!i||_arr.length!==i);_n=!0);}catch(err){_d=!0,_e=err}finally{try{_n||null==_i.return||_i.return()}finally{if(_d)throw _e}}return _arr}(arr,i)||function _unsupportedIterableToArray(o,minLen){if(!o)return;if("string"==typeof o)return _arrayLikeToArray(o,minLen);var n=Object.prototype.toString.call(o).slice(8,-1);"Object"===n&&o.constructor&&(n=o.constructor.name);if("Map"===n||"Set"===n)return Array.from(o);if("Arguments"===n||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n))return _arrayLikeToArray(o,minLen)}(arr,i)||function _nonIterableRest(){throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}()}function _arrayLikeToArray(arr,len){(null==len||len>arr.length)&&(len=arr.length);for(var i=0,arr2=new Array(len);i<len;i++)arr2[i]=arr[i];return arr2}function VideoElement(_ref){var elementId=_ref.elementId,elementData=_ref.elementData,title=_ref.title,aspectRatio=_ref.aspectRatio,_onPlay=_ref.onPlay,_onPause=_ref.onPause,onFinish=_ref.onFinish,_useMediaElementUrls=(0,_useMediaElement__WEBPACK_IMPORTED_MODULE_21__.ZD)(elementData),video=_useMediaElementUrls.video,subtitles=_useMediaElementUrls.subtitles,config=(0,react__WEBPACK_IMPORTED_MODULE_16__.useMemo)((function(){if(subtitles.loading)return null;var tracks=[];if(!subtitles.error&&subtitles.url){var track={kind:"subtitles",src:subtitles.url,srcLang:"en",default:!1,label:"English"};tracks.push(track)}return{file:{tracks,hlsVersion:"1.1.3",hlsOptions:{maxBufferLength:.05,maxBufferSize:500},attributes:{preload:"metadata"}}}}),[subtitles.error,subtitles.loading,subtitles.url]),_useState2=_slicedToArray((0,react__WEBPACK_IMPORTED_MODULE_16__.useState)(!1),2),isPlaying=_useState2[0],setIsPlaying=_useState2[1],playerRef=(0,react__WEBPACK_IMPORTED_MODULE_16__.useRef)(null),_useState4=_slicedToArray((0,react__WEBPACK_IMPORTED_MODULE_16__.useState)(1),2),playbackRate=_useState4[0],setPlaybackRate=_useState4[1],innerPlayer=(0,react__WEBPACK_IMPORTED_MODULE_16__.useMemo)((function(){return video.url&&config?(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_22__.jsx)(react_player__WEBPACK_IMPORTED_MODULE_17__.Z,{url:video.url,width:"100%",controls:!0,height:"auto",onEnded:function onEnded(){setIsPlaying(!1)},onError:function onError(){setIsPlaying(!1)},onPause:function onPause(){setIsPlaying(!1),null==_onPause||_onPause()},onPlay:function onPlay(){var _playerRef$current;setIsPlaying(!0),null==_onPlay||_onPlay();var hlsPlayer=null===(_playerRef$current=playerRef.current)||void 0===_playerRef$current?void 0:_playerRef$current.getInternalPlayer("hls");hlsPlayer&&(hlsPlayer.config.maxBufferLength=30,hlsPlayer.config.maxBufferSize=6e7)},onProgress:function onProgress(_ref2){_ref2.played>=1&&(null==onFinish||onFinish())},config:Object.assign({},config),ref:playerRef,style:{borderRadius:"10px",overflow:"hidden"},playbackRate}):void 0}),[video.url,config,playbackRate,_onPause,_onPlay,onFinish]),player=(0,react__WEBPACK_IMPORTED_MODULE_16__.useMemo)((function(){return video.url&&config?(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_22__.jsxs)(_chakra_ui_react__WEBPACK_IMPORTED_MODULE_23__.gC,{w:"min(100%, 90vh * (16 / 9))",maxW:"800px",alignItems:"center",spacing:0,children:[aspectRatio?(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_22__.jsx)(_chakra_ui_react__WEBPACK_IMPORTED_MODULE_23__.oM,{ratio:16/9,w:"min(100%, 90vh * (16 / 9))",maxW:"800px",maxH:"90vh",p:2,children:innerPlayer}):innerPlayer,video.isHls?void 0:(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_22__.jsx)(_chakra_ui_react__WEBPACK_IMPORTED_MODULE_23__.kC,{borderBottomRadius:"2xl",p:1,justifyContent:"flex-end",w:"100%",children:(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_22__.jsxs)(_chakra_ui_react__WEBPACK_IMPORTED_MODULE_24__.v2,{children:[(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_22__.jsxs)(_chakra_ui_react__WEBPACK_IMPORTED_MODULE_24__.j2,{as:_chakra_ui_react__WEBPACK_IMPORTED_MODULE_25__.zx,size:"xs",children:["Speed ",(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_22__.jsx)(_Chakra_FAIcon__WEBPACK_IMPORTED_MODULE_19__.Z,{iconStyle:"s",icon:"chevron-down"})]}),(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_22__.jsx)(_chakra_ui_react__WEBPACK_IMPORTED_MODULE_24__.qy,{children:(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_22__.jsxs)(_chakra_ui_react__WEBPACK_IMPORTED_MODULE_24__.__,{onChange:function onChange(value){var v=parseFloat(value);Number.isFinite(v)?setPlaybackRate(v):setPlaybackRate(1)},type:"radio",value:playbackRate.toFixed(2),children:[(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_22__.jsx)(_chakra_ui_react__WEBPACK_IMPORTED_MODULE_24__.ii,{value:"0.50",children:"0.5x"}),(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_22__.jsx)(_chakra_ui_react__WEBPACK_IMPORTED_MODULE_24__.ii,{value:"0.75",children:"0.75x"}),(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_22__.jsx)(_chakra_ui_react__WEBPACK_IMPORTED_MODULE_24__.ii,{value:"1.00",children:"1x"}),(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_22__.jsx)(_chakra_ui_react__WEBPACK_IMPORTED_MODULE_24__.ii,{value:"1.20",children:"1.2x"}),(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_22__.jsx)(_chakra_ui_react__WEBPACK_IMPORTED_MODULE_24__.ii,{value:"1.50",children:"1.5x"}),(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_22__.jsx)(_chakra_ui_react__WEBPACK_IMPORTED_MODULE_24__.ii,{value:"2.00",children:"2x"})]})})]})})]}):void 0}),[video.url,video.isHls,config,aspectRatio,innerPlayer,playbackRate]);return(0,react__WEBPACK_IMPORTED_MODULE_16__.useEffect)((function(){if(playerRef.current){var hls=playerRef.current.getInternalPlayer("hls");hls&&(hls.subtitleDisplay=!1)}}),[]),(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_22__.jsxs)(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_22__.Fragment,{children:[title?(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_22__.jsx)(_chakra_ui_react__WEBPACK_IMPORTED_MODULE_23__.X6,{as:"h3",fontSize:"2xl",mb:2,color:"gray.50",children:title}):void 0,video.url||subtitles.loading?void 0:(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_22__.jsxs)(_chakra_ui_react__WEBPACK_IMPORTED_MODULE_23__.xv,{mb:2,children:[elementData.type===_generated_graphql__WEBPACK_IMPORTED_MODULE_18__.bK7.AudioFile?"Audio":"Video"," not yet uploaded."]}),player,elementId?(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_22__.jsx)(TrackVideoView,{elementId,isPlaying}):void 0]})}function TrackVideoView(_ref3){var elementId=_ref3.elementId,isPlaying=_ref3.isPlaying;return(0,_Realtime_Analytics_useTrackView__WEBPACK_IMPORTED_MODULE_20__.Z)(isPlaying,elementId,"Element"),(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_22__.jsx)(react_jsx_runtime__WEBPACK_IMPORTED_MODULE_22__.Fragment,{})}try{VideoElement.displayName="VideoElement",VideoElement.__docgenInfo={description:"",displayName:"VideoElement",props:{elementId:{defaultValue:null,description:"",name:"elementId",required:!1,type:{name:"string"}},elementData:{defaultValue:null,description:"",name:"elementData",required:!0,type:{name:"VideoElementBlob | AudioElementBlob"}},title:{defaultValue:null,description:"",name:"title",required:!1,type:{name:"string"}},aspectRatio:{defaultValue:null,description:"",name:"aspectRatio",required:!1,type:{name:"boolean"}},onPlay:{defaultValue:null,description:"",name:"onPlay",required:!1,type:{name:"(() => void)"}},onPause:{defaultValue:null,description:"",name:"onPause",required:!1,type:{name:"(() => void)"}},onFinish:{defaultValue:null,description:"",name:"onFinish",required:!1,type:{name:"(() => void)"}},onSeek:{defaultValue:null,description:"",name:"onSeek",required:!1,type:{name:"(() => void)"}}}},"undefined"!=typeof STORYBOOK_REACT_CLASSES&&(STORYBOOK_REACT_CLASSES["src/aspects/Conference/Attend/Content/Element/VideoElement.tsx#VideoElement"]={docgenInfo:VideoElement.__docgenInfo,name:"VideoElement",path:"src/aspects/Conference/Attend/Content/Element/VideoElement.tsx#VideoElement"})}catch(__react_docgen_typescript_loader_error){}},"./src/aspects/Conference/Attend/Content/Element/useMediaElement.tsx":(__unused_webpack_module,__webpack_exports__,__webpack_require__)=>{__webpack_require__.d(__webpack_exports__,{Bl:()=>parseMediaElement,sd:()=>parseMediaElementUrl,EY:()=>parseMediaElementSubtitlesUrl,ZD:()=>useMediaElementUrls});__webpack_require__("../node_modules/.pnpm/core-js@3.21.0/node_modules/core-js/modules/es.array.slice.js"),__webpack_require__("../node_modules/.pnpm/core-js@3.21.0/node_modules/core-js/modules/es.array.includes.js"),__webpack_require__("../node_modules/.pnpm/core-js@3.21.0/node_modules/core-js/modules/es.string.includes.js"),__webpack_require__("../node_modules/.pnpm/core-js@3.21.0/node_modules/core-js/modules/es.string.ends-with.js"),__webpack_require__("../node_modules/.pnpm/core-js@3.21.0/node_modules/core-js/modules/es.promise.js"),__webpack_require__("../node_modules/.pnpm/core-js@3.21.0/node_modules/core-js/modules/es.object.to-string.js");var _templateObject,_clowdr_app_srt_webvtt__WEBPACK_IMPORTED_MODULE_12__=__webpack_require__("../node_modules/.pnpm/@clowdr-app+srt-webvtt@1.1.1/node_modules/@clowdr-app/srt-webvtt/dist/index.es.js"),_midspace_shared_types_content__WEBPACK_IMPORTED_MODULE_6__=__webpack_require__("../packages/shared/shared-types/build/esm/content.js"),_urql_core__WEBPACK_IMPORTED_MODULE_11__=__webpack_require__("../node_modules/.pnpm/@urql+core@2.4.1_graphql@15.7.2/node_modules/@urql/core/dist/urql-core.mjs"),amazon_s3_uri__WEBPACK_IMPORTED_MODULE_7__=__webpack_require__("../node_modules/.pnpm/amazon-s3-uri@0.1.1/node_modules/amazon-s3-uri/lib/amazon-s3-uri.js"),amazon_s3_uri__WEBPACK_IMPORTED_MODULE_7___default=__webpack_require__.n(amazon_s3_uri__WEBPACK_IMPORTED_MODULE_7__),ramda__WEBPACK_IMPORTED_MODULE_8__=__webpack_require__("../node_modules/.pnpm/ramda@0.28.0/node_modules/ramda/es/index.js"),react__WEBPACK_IMPORTED_MODULE_9__=__webpack_require__("../node_modules/.pnpm/react@17.0.2/node_modules/react/index.js"),react_async_hook__WEBPACK_IMPORTED_MODULE_10__=__webpack_require__("../node_modules/.pnpm/react-async-hook@4.0.0_react@17.0.2/node_modules/react-async-hook/dist/react-async-hook.esm.js");function asyncGeneratorStep(gen,resolve,reject,_next,_throw,key,arg){try{var info=gen[key](arg),value=info.value}catch(error){return void reject(error)}info.done?resolve(value):Promise.resolve(value).then(_next,_throw)}function _asyncToGenerator(fn){return function(){var self=this,args=arguments;return new Promise((function(resolve,reject){var gen=fn.apply(self,args);function _next(value){asyncGeneratorStep(gen,resolve,reject,_next,_throw,"next",value)}function _throw(err){asyncGeneratorStep(gen,resolve,reject,_next,_throw,"throw",err)}_next(void 0)}))}}function parseMediaElement(element){var _R$last;if(!element)return{};var blob=element.data;if(![_midspace_shared_types_content__WEBPACK_IMPORTED_MODULE_6__.bK.VideoBroadcast,_midspace_shared_types_content__WEBPACK_IMPORTED_MODULE_6__.bK.VideoFile,_midspace_shared_types_content__WEBPACK_IMPORTED_MODULE_6__.bK.VideoPrepublish].includes(element.typeName)||!(0,_midspace_shared_types_content__WEBPACK_IMPORTED_MODULE_6__.Cp)(blob))return{error:new Error("Element is not of a valid type.")};var latestVersion=null===(_R$last=ramda__WEBPACK_IMPORTED_MODULE_8__.Z$Q(blob))||void 0===_R$last?void 0:_R$last.data;return latestVersion&&latestVersion.baseType===_midspace_shared_types_content__WEBPACK_IMPORTED_MODULE_6__.bN.Video?{mediaElementBlob:latestVersion}:{error:new Error("Element is not of a valid type.")}}function parseMediaElementUrl(elementData){try{var _elementData$transcod,s3Url="transcode"in elementData?null===(_elementData$transcod=elementData.transcode)||void 0===_elementData$transcod?void 0:_elementData$transcod.s3Url:void 0;if(!s3Url&&elementData.s3Url&&(s3Url=elementData.s3Url),!s3Url)return{error:new Error("No S3 URL specified.")};var _AmazonS3URI=new(amazon_s3_uri__WEBPACK_IMPORTED_MODULE_7___default())(s3Url),bucket=_AmazonS3URI.bucket,key=_AmazonS3URI.key;return bucket&&key?{url:"https://s3."+(void 0).VITE_AWS_REGION+".amazonaws.com/"+bucket+"/"+key,isHls:Boolean(key.endsWith(".m3u8"))}:{error:new Error("S3 URL could not be parsed.")}}catch(error){return{error:error instanceof Error?error:new Error("Error creating S3 URL.")}}}function parseMediaElementSubtitlesUrl(_x){return _parseMediaElementSubtitlesUrl.apply(this,arguments)}function _parseMediaElementSubtitlesUrl(){return(_parseMediaElementSubtitlesUrl=_asyncToGenerator(regeneratorRuntime.mark((function _callee2(elementData){var _elementData$subtitle,_AmazonS3URI2,bucket,key,s3Url,response,blob;return regeneratorRuntime.wrap((function _callee2$(_context2){for(;;)switch(_context2.prev=_context2.next){case 0:if(elementData.subtitles.en_US&&null!==(_elementData$subtitle=elementData.subtitles.en_US.s3Url)&&void 0!==_elementData$subtitle&&_elementData$subtitle.length){_context2.next=4;break}return _context2.abrupt("return",void 0);case 4:return _context2.prev=4,_AmazonS3URI2=new(amazon_s3_uri__WEBPACK_IMPORTED_MODULE_7___default())(elementData.subtitles.en_US.s3Url),bucket=_AmazonS3URI2.bucket,key=_AmazonS3URI2.key,s3Url="https://s3."+(void 0).VITE_AWS_REGION+".amazonaws.com/"+bucket+"/"+key,_context2.next=9,fetch(s3Url);case 9:if((response=_context2.sent).ok){_context2.next=12;break}throw new Error("Could not retrieve subtitles file: "+response.status);case 12:return _context2.next=14,response.blob();case 14:return blob=_context2.sent,_context2.next=17,new _clowdr_app_srt_webvtt__WEBPACK_IMPORTED_MODULE_12__.J(blob).getURL();case 17:return _context2.abrupt("return",_context2.sent);case 20:throw _context2.prev=20,_context2.t0=_context2.catch(4),console.error("Failure while parsing subtitle location",_context2.t0),new Error("Failure while parsing subtitle location");case 24:case"end":return _context2.stop()}}),_callee2,null,[[4,20]])})))).apply(this,arguments)}function useMediaElementUrls(elementData){var video=(0,react__WEBPACK_IMPORTED_MODULE_9__.useMemo)((function(){return parseMediaElementUrl(elementData)}),[elementData]),subtitles=(0,react_async_hook__WEBPACK_IMPORTED_MODULE_10__.r5)(_asyncToGenerator(regeneratorRuntime.mark((function _callee(){return regeneratorRuntime.wrap((function _callee$(_context){for(;;)switch(_context.prev=_context.next){case 0:return _context.abrupt("return",parseMediaElementSubtitlesUrl(elementData));case 1:case"end":return _context.stop()}}),_callee)}))),[elementData.subtitles.en_US]);return{video,subtitles:{loading:subtitles.loading,error:subtitles.error,url:subtitles.result}}}(0,_urql_core__WEBPACK_IMPORTED_MODULE_11__.Ps)(_templateObject||(_templateObject=function _taggedTemplateLiteralLoose(strings,raw){return raw||(raw=strings.slice(0)),strings.raw=raw,strings}(["\n    fragment useMediaElement_MediaElement on content_Element {\n        typeName\n        data\n    }\n"])));try{parseMediaElement.displayName="parseMediaElement",parseMediaElement.__docgenInfo={description:"",displayName:"parseMediaElement",props:{__typename:{defaultValue:null,description:"",name:"__typename",required:!1,type:{name:"enum",value:[{value:'"content_Element"'}]}},typeName:{defaultValue:null,description:"",name:"typeName",required:!0,type:{name:"enum",value:[{value:'"ABSTRACT"'},{value:'"ACTIVE_SOCIAL_ROOMS"'},{value:'"AUDIO_FILE"'},{value:'"AUDIO_LINK"'},{value:'"AUDIO_URL"'},{value:'"CONTENT_GROUP_LIST"'},{value:'"DIVIDER"'},{value:'"EXPLORE_PROGRAM_BUTTON"'},{value:'"EXPLORE_SCHEDULE_BUTTON"'},{value:'"EXTERNAL_EVENT_LINK"'},{value:'"IMAGE_FILE"'},{value:'"IMAGE_URL"'},{value:'"LINK"'},{value:'"LINK_BUTTON"'},{value:'"LIVE_PROGRAM_ROOMS"'},{value:'"PAPER_FILE"'},{value:'"PAPER_LINK"'},{value:'"PAPER_URL"'},{value:'"POSTER_FILE"'},{value:'"POSTER_URL"'},{value:'"SPONSOR_BOOTHS"'},{value:'"TEXT"'},{value:'"VIDEO_BROADCAST"'},{value:'"VIDEO_COUNTDOWN"'},{value:'"VIDEO_FILE"'},{value:'"VIDEO_FILLER"'},{value:'"VIDEO_LINK"'},{value:'"VIDEO_PREPUBLISH"'},{value:'"VIDEO_SPONSORS_FILLER"'},{value:'"VIDEO_TITLES"'},{value:'"VIDEO_URL"'},{value:'"WHOLE_SCHEDULE"'}]}},data:{defaultValue:null,description:"",name:"data",required:!0,type:{name:"any"}}}},"undefined"!=typeof STORYBOOK_REACT_CLASSES&&(STORYBOOK_REACT_CLASSES["src/aspects/Conference/Attend/Content/Element/useMediaElement.tsx#parseMediaElement"]={docgenInfo:parseMediaElement.__docgenInfo,name:"parseMediaElement",path:"src/aspects/Conference/Attend/Content/Element/useMediaElement.tsx#parseMediaElement"})}catch(__react_docgen_typescript_loader_error){}try{parseMediaElementUrl.displayName="parseMediaElementUrl",parseMediaElementUrl.__docgenInfo={description:"",displayName:"parseMediaElementUrl",props:{baseType:{defaultValue:null,description:"",name:"baseType",required:!0,type:{name:"enum",value:[{value:'"video"'},{value:'"audio"'}]}},s3Url:{defaultValue:null,description:"",name:"s3Url",required:!0,type:{name:"string"}},sourceHasEmbeddedSubtitles:{defaultValue:null,description:"",name:"sourceHasEmbeddedSubtitles",required:!1,type:{name:"boolean"}},transcode:{defaultValue:null,description:"",name:"transcode",required:!1,type:{name:"TranscodeDetails"}},subtitles:{defaultValue:null,description:"",name:"subtitles",required:!0,type:{name:"Record<string, SubtitleDetails>"}},broadcastTranscode:{defaultValue:null,description:"",name:"broadcastTranscode",required:!1,type:{name:"BroadcastTranscodeDetails"}},type:{defaultValue:null,description:"",name:"type",required:!0,type:{name:"string"}},description:{defaultValue:null,description:"",name:"description",required:!1,type:{name:"string"}}}},"undefined"!=typeof STORYBOOK_REACT_CLASSES&&(STORYBOOK_REACT_CLASSES["src/aspects/Conference/Attend/Content/Element/useMediaElement.tsx#parseMediaElementUrl"]={docgenInfo:parseMediaElementUrl.__docgenInfo,name:"parseMediaElementUrl",path:"src/aspects/Conference/Attend/Content/Element/useMediaElement.tsx#parseMediaElementUrl"})}catch(__react_docgen_typescript_loader_error){}try{parseMediaElementSubtitlesUrl.displayName="parseMediaElementSubtitlesUrl",parseMediaElementSubtitlesUrl.__docgenInfo={description:"",displayName:"parseMediaElementSubtitlesUrl",props:{baseType:{defaultValue:null,description:"",name:"baseType",required:!0,type:{name:"enum",value:[{value:'"video"'},{value:'"audio"'}]}},s3Url:{defaultValue:null,description:"",name:"s3Url",required:!0,type:{name:"string"}},sourceHasEmbeddedSubtitles:{defaultValue:null,description:"",name:"sourceHasEmbeddedSubtitles",required:!1,type:{name:"boolean"}},transcode:{defaultValue:null,description:"",name:"transcode",required:!1,type:{name:"TranscodeDetails"}},subtitles:{defaultValue:null,description:"",name:"subtitles",required:!0,type:{name:"Record<string, SubtitleDetails>"}},broadcastTranscode:{defaultValue:null,description:"",name:"broadcastTranscode",required:!1,type:{name:"BroadcastTranscodeDetails"}},type:{defaultValue:null,description:"",name:"type",required:!0,type:{name:"string"}},description:{defaultValue:null,description:"",name:"description",required:!1,type:{name:"string"}}}},"undefined"!=typeof STORYBOOK_REACT_CLASSES&&(STORYBOOK_REACT_CLASSES["src/aspects/Conference/Attend/Content/Element/useMediaElement.tsx#parseMediaElementSubtitlesUrl"]={docgenInfo:parseMediaElementSubtitlesUrl.__docgenInfo,name:"parseMediaElementSubtitlesUrl",path:"src/aspects/Conference/Attend/Content/Element/useMediaElement.tsx#parseMediaElementSubtitlesUrl"})}catch(__react_docgen_typescript_loader_error){}try{useMediaElementUrls.displayName="useMediaElementUrls",useMediaElementUrls.__docgenInfo={description:"",displayName:"useMediaElementUrls",props:{baseType:{defaultValue:null,description:"",name:"baseType",required:!0,type:{name:"enum",value:[{value:'"video"'},{value:'"audio"'}]}},s3Url:{defaultValue:null,description:"",name:"s3Url",required:!0,type:{name:"string"}},sourceHasEmbeddedSubtitles:{defaultValue:null,description:"",name:"sourceHasEmbeddedSubtitles",required:!1,type:{name:"boolean"}},transcode:{defaultValue:null,description:"",name:"transcode",required:!1,type:{name:"TranscodeDetails"}},subtitles:{defaultValue:null,description:"",name:"subtitles",required:!0,type:{name:"Record<string, SubtitleDetails>"}},broadcastTranscode:{defaultValue:null,description:"",name:"broadcastTranscode",required:!1,type:{name:"BroadcastTranscodeDetails"}},type:{defaultValue:null,description:"",name:"type",required:!0,type:{name:"string"}},description:{defaultValue:null,description:"",name:"description",required:!1,type:{name:"string"}}}},"undefined"!=typeof STORYBOOK_REACT_CLASSES&&(STORYBOOK_REACT_CLASSES["src/aspects/Conference/Attend/Content/Element/useMediaElement.tsx#useMediaElementUrls"]={docgenInfo:useMediaElementUrls.__docgenInfo,name:"useMediaElementUrls",path:"src/aspects/Conference/Attend/Content/Element/useMediaElement.tsx#useMediaElementUrls"})}catch(__react_docgen_typescript_loader_error){}},"./src/aspects/Realtime/Analytics/useTrackView.tsx":(__unused_webpack_module,__webpack_exports__,__webpack_require__)=>{__webpack_require__.d(__webpack_exports__,{Z:()=>useTrackView});__webpack_require__("../node_modules/.pnpm/core-js@3.21.0/node_modules/core-js/modules/es.date.now.js"),__webpack_require__("../node_modules/.pnpm/core-js@3.21.0/node_modules/core-js/modules/es.date.to-string.js"),__webpack_require__("../node_modules/.pnpm/core-js@3.21.0/node_modules/core-js/modules/es.array.is-array.js"),__webpack_require__("../node_modules/.pnpm/core-js@3.21.0/node_modules/core-js/modules/es.symbol.js"),__webpack_require__("../node_modules/.pnpm/core-js@3.21.0/node_modules/core-js/modules/es.symbol.description.js"),__webpack_require__("../node_modules/.pnpm/core-js@3.21.0/node_modules/core-js/modules/es.object.to-string.js"),__webpack_require__("../node_modules/.pnpm/core-js@3.21.0/node_modules/core-js/modules/es.symbol.iterator.js"),__webpack_require__("../node_modules/.pnpm/core-js@3.21.0/node_modules/core-js/modules/es.string.iterator.js"),__webpack_require__("../node_modules/.pnpm/core-js@3.21.0/node_modules/core-js/modules/es.array.iterator.js"),__webpack_require__("../node_modules/.pnpm/core-js@3.21.0/node_modules/core-js/modules/web.dom-collections.iterator.js"),__webpack_require__("../node_modules/.pnpm/core-js@3.21.0/node_modules/core-js/modules/es.array.slice.js"),__webpack_require__("../node_modules/.pnpm/core-js@3.21.0/node_modules/core-js/modules/es.function.name.js"),__webpack_require__("../node_modules/.pnpm/core-js@3.21.0/node_modules/core-js/modules/es.array.from.js");var react__WEBPACK_IMPORTED_MODULE_13__=__webpack_require__("../node_modules/.pnpm/react@17.0.2/node_modules/react/index.js"),_Hooks_usePolling__WEBPACK_IMPORTED_MODULE_14__=__webpack_require__("./src/aspects/Hooks/usePolling.ts"),_RealtimeServiceProvider__WEBPACK_IMPORTED_MODULE_15__=__webpack_require__("./src/aspects/Realtime/RealtimeServiceProvider.tsx");function _slicedToArray(arr,i){return function _arrayWithHoles(arr){if(Array.isArray(arr))return arr}(arr)||function _iterableToArrayLimit(arr,i){var _i=null==arr?null:"undefined"!=typeof Symbol&&arr[Symbol.iterator]||arr["@@iterator"];if(null==_i)return;var _s,_e,_arr=[],_n=!0,_d=!1;try{for(_i=_i.call(arr);!(_n=(_s=_i.next()).done)&&(_arr.push(_s.value),!i||_arr.length!==i);_n=!0);}catch(err){_d=!0,_e=err}finally{try{_n||null==_i.return||_i.return()}finally{if(_d)throw _e}}return _arr}(arr,i)||function _unsupportedIterableToArray(o,minLen){if(!o)return;if("string"==typeof o)return _arrayLikeToArray(o,minLen);var n=Object.prototype.toString.call(o).slice(8,-1);"Object"===n&&o.constructor&&(n=o.constructor.name);if("Map"===n||"Set"===n)return Array.from(o);if("Arguments"===n||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n))return _arrayLikeToArray(o,minLen)}(arr,i)||function _nonIterableRest(){throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}()}function _arrayLikeToArray(arr,len){(null==len||len>arr.length)&&(len=arr.length);for(var i=0,arr2=new Array(len);i<len;i++)arr2[i]=arr[i];return arr2}function useTrackView(isActive,identifier,contentType){var requiredViewTimeMs=arguments.length>3&&void 0!==arguments[3]?arguments[3]:15e3,_useState=(0,react__WEBPACK_IMPORTED_MODULE_13__.useState)(null),_useState2=_slicedToArray(_useState,2),activatedAt=_useState2[0],setActivatedAt=_useState2[1],submitted=(0,react__WEBPACK_IMPORTED_MODULE_13__.useRef)(!1);(0,react__WEBPACK_IMPORTED_MODULE_13__.useEffect)((function(){null===activatedAt&&isActive?setActivatedAt(Date.now()):null===activatedAt||isActive||setActivatedAt(null)}),[activatedAt,isActive]);var rts=(0,_RealtimeServiceProvider__WEBPACK_IMPORTED_MODULE_15__.GT)(),_useState3=(0,react__WEBPACK_IMPORTED_MODULE_13__.useState)(null),_useState4=_slicedToArray(_useState3,2),socket=_useState4[0],setSocket=_useState4[1],_useState5=(0,react__WEBPACK_IMPORTED_MODULE_13__.useState)(-1),_useState6=_slicedToArray(_useState5,2),now=_useState6[0],setNow=_useState6[1],pollF=(0,react__WEBPACK_IMPORTED_MODULE_13__.useCallback)((function(){setNow(Date.now())}),[]),polling=(0,_Hooks_usePolling__WEBPACK_IMPORTED_MODULE_14__.Z)(pollF,requiredViewTimeMs,!1);(0,react__WEBPACK_IMPORTED_MODULE_13__.useEffect)((function(){null!==activatedAt?now-activatedAt>requiredViewTimeMs&&socket&&socket.connected?(polling.stop(),submitted.current||(socket.emit("analytics.view.count",{identifier,contentType}),submitted.current=!0)):polling.isPolling||polling.start():polling.isPolling&&polling.stop()}),[activatedAt,contentType,identifier,now,polling,requiredViewTimeMs,socket]),(0,react__WEBPACK_IMPORTED_MODULE_13__.useEffect)((function(){var offSocketAvailable=rts.onSocketAvailable("useTrackView.useEffect",(function(socket){setSocket(socket)})),offSocketUnavailable=rts.onSocketUnavailable("useTrackView.useEffect",(function(socket){setSocket((function(s){return s===socket?null:s}))}));return function(){offSocketAvailable(),offSocketUnavailable()}}),[rts])}}}]);