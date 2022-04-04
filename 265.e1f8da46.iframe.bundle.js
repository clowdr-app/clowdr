/*! For license information please see 265.e1f8da46.iframe.bundle.js.LICENSE.txt */
"use strict";(self.webpackChunk_midspace_frontend=self.webpackChunk_midspace_frontend||[]).push([[265],{"./src/aspects/Conference/Manage/DashboardPage.tsx":(__unused_webpack_module,__webpack_exports__,__webpack_require__)=>{__webpack_require__.d(__webpack_exports__,{Y:()=>DashboardPage});__webpack_require__("../node_modules/.pnpm/core-js@3.21.0/node_modules/core-js/modules/es.array.includes.js"),__webpack_require__("../node_modules/.pnpm/core-js@3.21.0/node_modules/core-js/modules/es.string.includes.js");var chakra_ui_color_mode_esm=__webpack_require__("../node_modules/.pnpm/@chakra-ui+color-mode@1.4.3_react@17.0.2/node_modules/@chakra-ui/color-mode/dist/chakra-ui-color-mode.esm.js"),chakra_ui_layout_esm=__webpack_require__("../node_modules/.pnpm/@chakra-ui+layout@1.7.4_d5de66fc214059f645050e36d066c00a/node_modules/@chakra-ui/layout/dist/chakra-ui-layout.esm.js"),react=__webpack_require__("../node_modules/.pnpm/react@17.0.2/node_modules/react/index.js"),useTitle=__webpack_require__("./src/aspects/Hooks/useTitle.tsx"),useConference=__webpack_require__("./src/aspects/Conference/useConference.tsx"),chakra_ui_breadcrumb_esm=(__webpack_require__("../node_modules/.pnpm/core-js@3.21.0/node_modules/core-js/modules/es.array.find.js"),__webpack_require__("../node_modules/.pnpm/core-js@3.21.0/node_modules/core-js/modules/es.array.map.js"),__webpack_require__("../node_modules/.pnpm/@chakra-ui+breadcrumb@1.3.4_d5de66fc214059f645050e36d066c00a/node_modules/@chakra-ui/breadcrumb/dist/chakra-ui-breadcrumb.esm.js")),react_router_dom=__webpack_require__("../node_modules/.pnpm/react-router-dom@5.3.0_react@17.0.2/node_modules/react-router-dom/esm/react-router-dom.js"),es=__webpack_require__("../node_modules/.pnpm/use-react-router-breadcrumbs@2.0.2_react-router@5.2.1+react@17.0.2/node_modules/use-react-router-breadcrumbs/dist/es/index.js"),AuthParameters=__webpack_require__("./src/aspects/GQL/AuthParameters.tsx"),jsx_runtime=__webpack_require__("../node_modules/.pnpm/react@17.0.2/node_modules/react/jsx-runtime.js");function Breadcrumbs(){var conference=(0,useConference.fk)(),subconferenceId=(0,AuthParameters.h)().subconferenceId,confTitle=(0,react.useMemo)((function(){var _ref,_conference$subconfer;return null!==(_ref=subconferenceId?null===(_conference$subconfer=conference.subconferences.find((function(x){return x.id===subconferenceId})))||void 0===_conference$subconfer?void 0:_conference$subconfer.shortName:void 0)&&void 0!==_ref?_ref:conference.shortName}),[conference.shortName,conference.subconferences,subconferenceId]),routes=(0,react.useMemo)((function(){return[{path:"/conference/:slug/manage",breadcrumb:"Manage "+confTitle},{path:"/c/:slug/manage",breadcrumb:"Manage "+confTitle},{path:"/conference/:slug/manage/export/youtube",breadcrumb:"YouTube"},{path:"/c/:slug/manage/export/youtube",breadcrumb:"YouTube"},{path:"/conference/:slug/manage/export/download-videos",breadcrumb:"Download videos"},{path:"/c/:slug/manage/export/download-videos",breadcrumb:"Download videos"}]}),[confTitle]),breadcrumbs=(0,es.Z)(routes,{excludePaths:["/","/conference","/c","/conference/:slug","/c/:slug"]});return(0,jsx_runtime.jsx)(chakra_ui_breadcrumb_esm.aG,{separator:">",children:breadcrumbs.map((function(breadcrumb){return(0,jsx_runtime.jsx)(chakra_ui_breadcrumb_esm.gN,{isCurrentPage:breadcrumb.key===breadcrumb.location.key,children:(0,jsx_runtime.jsx)(chakra_ui_breadcrumb_esm.At,{as:react_router_dom.rU,to:breadcrumb.key,children:breadcrumb.breadcrumb})},breadcrumb.key)}))})}function DashboardHeaderControls(_ref){var children=_ref.children;return children?(0,jsx_runtime.jsx)(chakra_ui_layout_esm.Ug,{spacing:4,mb:4,children}):(0,jsx_runtime.jsx)(jsx_runtime.Fragment,{})}Breadcrumbs.displayName="Breadcrumbs";try{DashboardHeaderControls.displayName="DashboardHeaderControls",DashboardHeaderControls.__docgenInfo={description:"",displayName:"DashboardHeaderControls",props:{}},"undefined"!=typeof STORYBOOK_REACT_CLASSES&&(STORYBOOK_REACT_CLASSES["src/aspects/Conference/Manage/DashboardHeaderControls.tsx#DashboardHeaderControls"]={docgenInfo:DashboardHeaderControls.__docgenInfo,name:"DashboardHeaderControls",path:"src/aspects/Conference/Manage/DashboardHeaderControls.tsx#DashboardHeaderControls"})}catch(__react_docgen_typescript_loader_error){}var SubconferenceSelector=__webpack_require__("./src/aspects/Conference/Manage/Subconferences/SubconferenceSelector.tsx");function DashboardPage(_ref){var title=_ref.title,children=_ref.children,controls=_ref.controls,_ref$stickyHeader=_ref.stickyHeader,stickyHeader=void 0===_ref$stickyHeader||_ref$stickyHeader,_ref$autoOverflow=_ref.autoOverflow,autoOverflow=void 0===_ref$autoOverflow||_ref$autoOverflow,conference=(0,useConference.fk)(),grayBg=(0,chakra_ui_color_mode_esm.ff)("gray.50","gray.900"),grayBorder=(0,chakra_ui_color_mode_esm.ff)("gray.300","gray.600"),titleEl=(0,useTitle.Z)(title.includes(conference.shortName)?title:title+" - "+conference.shortName);return(0,jsx_runtime.jsxs)(chakra_ui_layout_esm.kC,{flexDir:"column",w:{base:"100%",xl:"80%"},px:[2,2,4],children:[titleEl,(0,jsx_runtime.jsxs)(chakra_ui_layout_esm.xu,{position:stickyHeader?"sticky":void 0,top:0,left:0,zIndex:1e5,bgColor:grayBg,pt:4,borderBottom:"1px solid",borderBottomColor:grayBorder,children:[(0,jsx_runtime.jsx)(Breadcrumbs,{}),(0,jsx_runtime.jsxs)(chakra_ui_layout_esm.Ug,{children:[(0,jsx_runtime.jsx)(chakra_ui_layout_esm.X6,{id:"page-heading",as:"h1",size:"xl",textAlign:"left",mt:4,mb:4,children:title}),(0,jsx_runtime.jsx)(chakra_ui_layout_esm.LZ,{}),(0,jsx_runtime.jsx)(SubconferenceSelector.B,{})]}),(0,jsx_runtime.jsx)(DashboardHeaderControls,{children:controls})]}),(0,jsx_runtime.jsx)(chakra_ui_layout_esm.kC,{flexDir:"column",mt:4,w:"100%",overflow:autoOverflow?"auto":void 0,children})]})}DashboardPage.displayName="DashboardPage";try{DashboardPage.displayName="DashboardPage",DashboardPage.__docgenInfo={description:"",displayName:"DashboardPage",props:{title:{defaultValue:null,description:"",name:"title",required:!0,type:{name:"string"}},stickyHeader:{defaultValue:{value:"true"},description:"",name:"stickyHeader",required:!1,type:{name:"boolean"}},autoOverflow:{defaultValue:{value:"true"},description:"",name:"autoOverflow",required:!1,type:{name:"boolean"}},controls:{defaultValue:null,description:"",name:"controls",required:!1,type:{name:"ReactChild[]"}}}},"undefined"!=typeof STORYBOOK_REACT_CLASSES&&(STORYBOOK_REACT_CLASSES["src/aspects/Conference/Manage/DashboardPage.tsx#DashboardPage"]={docgenInfo:DashboardPage.__docgenInfo,name:"DashboardPage",path:"src/aspects/Conference/Manage/DashboardPage.tsx#DashboardPage"})}catch(__react_docgen_typescript_loader_error){}},"./src/aspects/Conference/Manage/Theme/ManageTheme.tsx":(__unused_webpack_module,__webpack_exports__,__webpack_require__)=>{__webpack_require__.r(__webpack_exports__),__webpack_require__.d(__webpack_exports__,{default:()=>ManageShuffle});__webpack_require__("../node_modules/.pnpm/core-js@3.21.0/node_modules/core-js/modules/es.array.slice.js"),__webpack_require__("../node_modules/.pnpm/core-js@3.21.0/node_modules/core-js/modules/es.array.is-array.js"),__webpack_require__("../node_modules/.pnpm/core-js@3.21.0/node_modules/core-js/modules/es.symbol.js"),__webpack_require__("../node_modules/.pnpm/core-js@3.21.0/node_modules/core-js/modules/es.symbol.description.js"),__webpack_require__("../node_modules/.pnpm/core-js@3.21.0/node_modules/core-js/modules/es.symbol.iterator.js"),__webpack_require__("../node_modules/.pnpm/core-js@3.21.0/node_modules/core-js/modules/es.string.iterator.js"),__webpack_require__("../node_modules/.pnpm/core-js@3.21.0/node_modules/core-js/modules/es.array.iterator.js"),__webpack_require__("../node_modules/.pnpm/core-js@3.21.0/node_modules/core-js/modules/web.dom-collections.iterator.js"),__webpack_require__("../node_modules/.pnpm/core-js@3.21.0/node_modules/core-js/modules/es.function.name.js"),__webpack_require__("../node_modules/.pnpm/core-js@3.21.0/node_modules/core-js/modules/es.array.from.js"),__webpack_require__("../node_modules/.pnpm/core-js@3.21.0/node_modules/core-js/modules/es.object.to-string.js"),__webpack_require__("../node_modules/.pnpm/core-js@3.21.0/node_modules/core-js/modules/es.regexp.to-string.js"),__webpack_require__("../node_modules/.pnpm/core-js@3.21.0/node_modules/core-js/modules/es.date.to-string.js"),__webpack_require__("../node_modules/.pnpm/core-js@3.21.0/node_modules/core-js/modules/web.timers.js");var _templateObject,_chakra_ui_react__WEBPACK_IMPORTED_MODULE_23__=__webpack_require__("../node_modules/.pnpm/@chakra-ui+layout@1.7.4_d5de66fc214059f645050e36d066c00a/node_modules/@chakra-ui/layout/dist/chakra-ui-layout.esm.js"),_chakra_ui_react__WEBPACK_IMPORTED_MODULE_24__=__webpack_require__("../node_modules/.pnpm/@chakra-ui+alert@1.3.5_d5de66fc214059f645050e36d066c00a/node_modules/@chakra-ui/alert/dist/chakra-ui-alert.esm.js"),_chakra_ui_react__WEBPACK_IMPORTED_MODULE_25__=__webpack_require__("../node_modules/.pnpm/@chakra-ui+form-control@1.5.6_d5de66fc214059f645050e36d066c00a/node_modules/@chakra-ui/form-control/dist/chakra-ui-form-control.esm.js"),_chakra_ui_react__WEBPACK_IMPORTED_MODULE_26__=__webpack_require__("../node_modules/.pnpm/@chakra-ui+textarea@1.2.6_d5de66fc214059f645050e36d066c00a/node_modules/@chakra-ui/textarea/dist/chakra-ui-textarea.esm.js"),_chakra_ui_react__WEBPACK_IMPORTED_MODULE_27__=__webpack_require__("../node_modules/.pnpm/@chakra-ui+button@1.5.5_d5de66fc214059f645050e36d066c00a/node_modules/@chakra-ui/button/dist/chakra-ui-button.esm.js"),_midspace_shared_types_auth__WEBPACK_IMPORTED_MODULE_14__=__webpack_require__("../packages/shared/shared-types/build/esm/auth.js"),react__WEBPACK_IMPORTED_MODULE_15__=__webpack_require__("../node_modules/.pnpm/react@17.0.2/node_modules/react/index.js"),urql__WEBPACK_IMPORTED_MODULE_22__=__webpack_require__("../node_modules/.pnpm/@urql+core@2.4.1_graphql@15.7.2/node_modules/@urql/core/dist/urql-core.mjs"),_generated_graphql__WEBPACK_IMPORTED_MODULE_16__=__webpack_require__("./src/generated/graphql.tsx"),_Chakra_ChakraCustomProvider__WEBPACK_IMPORTED_MODULE_17__=__webpack_require__("./src/aspects/Chakra/ChakraCustomProvider.tsx"),_Chakra_Colors_ComponentMap__WEBPACK_IMPORTED_MODULE_18__=__webpack_require__("./src/aspects/Chakra/Colors/ComponentMap.ts"),_useConference__WEBPACK_IMPORTED_MODULE_19__=__webpack_require__("./src/aspects/Conference/useConference.tsx"),_DashboardPage__WEBPACK_IMPORTED_MODULE_20__=__webpack_require__("./src/aspects/Conference/Manage/DashboardPage.tsx"),react_jsx_runtime__WEBPACK_IMPORTED_MODULE_21__=__webpack_require__("../node_modules/.pnpm/react@17.0.2/node_modules/react/jsx-runtime.js");function _slicedToArray(arr,i){return function _arrayWithHoles(arr){if(Array.isArray(arr))return arr}(arr)||function _iterableToArrayLimit(arr,i){var _i=null==arr?null:"undefined"!=typeof Symbol&&arr[Symbol.iterator]||arr["@@iterator"];if(null==_i)return;var _s,_e,_arr=[],_n=!0,_d=!1;try{for(_i=_i.call(arr);!(_n=(_s=_i.next()).done)&&(_arr.push(_s.value),!i||_arr.length!==i);_n=!0);}catch(err){_d=!0,_e=err}finally{try{_n||null==_i.return||_i.return()}finally{if(_d)throw _e}}return _arr}(arr,i)||function _unsupportedIterableToArray(o,minLen){if(!o)return;if("string"==typeof o)return _arrayLikeToArray(o,minLen);var n=Object.prototype.toString.call(o).slice(8,-1);"Object"===n&&o.constructor&&(n=o.constructor.name);if("Map"===n||"Set"===n)return Array.from(o);if("Arguments"===n||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n))return _arrayLikeToArray(o,minLen)}(arr,i)||function _nonIterableRest(){throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}()}function _arrayLikeToArray(arr,len){(null==len||len>arr.length)&&(len=arr.length);for(var i=0,arr2=new Array(len);i<len;i++)arr2[i]=arr[i];return arr2}function ManageShuffle(){var conference=(0,_useConference__WEBPACK_IMPORTED_MODULE_19__.fk)(),_useConferenceTheme=(0,_Chakra_ChakraCustomProvider__WEBPACK_IMPORTED_MODULE_17__.hL)(),theme=_useConferenceTheme.theme,setTheme=_useConferenceTheme.setTheme,_useState2=_slicedToArray((0,react__WEBPACK_IMPORTED_MODULE_15__.useState)(null),2),error=_useState2[0],setError=_useState2[1],_useState4=_slicedToArray((0,react__WEBPACK_IMPORTED_MODULE_15__.useState)(null),2),value=_useState4[0],setValue=_useState4[1];(0,react__WEBPACK_IMPORTED_MODULE_15__.useEffect)((function(){theme&&!value&&setValue(JSON.stringify(null!=theme?theme:_Chakra_Colors_ComponentMap__WEBPACK_IMPORTED_MODULE_18__.Z,null,4))}),[theme,value]);var applyTheme=(0,react__WEBPACK_IMPORTED_MODULE_15__.useCallback)((function(){if(value)try{setError(null);var parsedValue=JSON.parse(value);return setTheme(parsedValue),parsedValue}catch(e){setError(e.toString())}}),[setTheme,value]);(0,react__WEBPACK_IMPORTED_MODULE_15__.useEffect)((function(){setError(null);var id=setTimeout((function(){applyTheme()}),5e3);return function(){clearTimeout(id)}}),[applyTheme]);var _useUpsertConferenceT2=_slicedToArray((0,_generated_graphql__WEBPACK_IMPORTED_MODULE_16__.TuP)(),2),saveThemeResponse=_useUpsertConferenceT2[0],saveTheme=_useUpsertConferenceT2[1];return(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_21__.jsx)(_DashboardPage__WEBPACK_IMPORTED_MODULE_20__.Y,{title:"Theme",children:(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_21__.jsxs)(_chakra_ui_react__WEBPACK_IMPORTED_MODULE_23__.gC,{alignItems:"left",children:[(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_21__.jsx)(_chakra_ui_react__WEBPACK_IMPORTED_MODULE_23__.xv,{children:"After saving your changes, please refresh the page and navigate around the attendee pages to confirm the theme is okay."}),saveThemeResponse.error?(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_21__.jsxs)(_chakra_ui_react__WEBPACK_IMPORTED_MODULE_24__.bZ,{status:"error",flexDir:"column",alignItems:"flex-start",children:[(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_21__.jsx)(_chakra_ui_react__WEBPACK_IMPORTED_MODULE_24__.Cd,{children:"Error saving theme"}),(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_21__.jsx)(_chakra_ui_react__WEBPACK_IMPORTED_MODULE_24__.X,{children:saveThemeResponse.error.message})]}):void 0,error?(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_21__.jsxs)(_chakra_ui_react__WEBPACK_IMPORTED_MODULE_24__.bZ,{status:"error",flexDir:"column",alignItems:"flex-start",children:[(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_21__.jsx)(_chakra_ui_react__WEBPACK_IMPORTED_MODULE_24__.Cd,{children:"Theme invalid"}),(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_21__.jsx)(_chakra_ui_react__WEBPACK_IMPORTED_MODULE_24__.X,{children:error})]}):void 0,(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_21__.jsxs)(_chakra_ui_react__WEBPACK_IMPORTED_MODULE_25__.NI,{children:[(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_21__.jsx)(_chakra_ui_react__WEBPACK_IMPORTED_MODULE_25__.lX,{children:"Theme"}),(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_21__.jsx)(_chakra_ui_react__WEBPACK_IMPORTED_MODULE_25__.Q6,{my:2,children:"A preview of your theme will be applied 5s after you stop typing."}),(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_21__.jsx)(_chakra_ui_react__WEBPACK_IMPORTED_MODULE_25__.Q6,{my:2,children:"The theme is described as a JSON object. Please follow the existing pattern to modify your theme. In future we will be offering an easier to use graphical editor."}),(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_21__.jsx)(_chakra_ui_react__WEBPACK_IMPORTED_MODULE_26__.g,{minH:"70vh",value:null!=value?value:JSON.stringify(_Chakra_Colors_ComponentMap__WEBPACK_IMPORTED_MODULE_18__.Z,null,4),onChange:function onChange(ev){setValue(ev.target.value)}})]}),(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_21__.jsxs)(_chakra_ui_react__WEBPACK_IMPORTED_MODULE_27__.hE,{children:[(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_21__.jsx)(_chakra_ui_react__WEBPACK_IMPORTED_MODULE_27__.zx,{colorScheme:"DestructiveActionButton",isDisabled:saveThemeResponse.fetching,onClick:function onClick(){var _headers;setValue(JSON.stringify(null!=theme?theme:_Chakra_Colors_ComponentMap__WEBPACK_IMPORTED_MODULE_18__.Z,null,4)),saveTheme({conferenceId:conference.id,value:null!=theme?theme:_Chakra_Colors_ComponentMap__WEBPACK_IMPORTED_MODULE_18__.Z},{fetchOptions:{headers:(_headers={},_headers[_midspace_shared_types_auth__WEBPACK_IMPORTED_MODULE_14__.k.Role]=_midspace_shared_types_auth__WEBPACK_IMPORTED_MODULE_14__.Z.ConferenceOrganizer,_headers)}})},children:"Reset to original"}),(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_21__.jsx)(_chakra_ui_react__WEBPACK_IMPORTED_MODULE_27__.zx,{colorScheme:"DestructiveActionButton",isDisabled:saveThemeResponse.fetching,onClick:function onClick(){var _headers2;setValue(JSON.stringify(_Chakra_Colors_ComponentMap__WEBPACK_IMPORTED_MODULE_18__.Z,null,4)),saveTheme({conferenceId:conference.id,value:_Chakra_Colors_ComponentMap__WEBPACK_IMPORTED_MODULE_18__.Z},{fetchOptions:{headers:(_headers2={},_headers2[_midspace_shared_types_auth__WEBPACK_IMPORTED_MODULE_14__.k.Role]=_midspace_shared_types_auth__WEBPACK_IMPORTED_MODULE_14__.Z.ConferenceOrganizer,_headers2)}})},children:"Reset to default"}),(0,react_jsx_runtime__WEBPACK_IMPORTED_MODULE_21__.jsx)(_chakra_ui_react__WEBPACK_IMPORTED_MODULE_27__.zx,{colorScheme:"ConfirmButton",isLoading:saveThemeResponse.fetching,onClick:function onClick(){var _headers3,value=applyTheme();value&&saveTheme({conferenceId:conference.id,value},{fetchOptions:{headers:(_headers3={},_headers3[_midspace_shared_types_auth__WEBPACK_IMPORTED_MODULE_14__.k.Role]=_midspace_shared_types_auth__WEBPACK_IMPORTED_MODULE_14__.Z.ConferenceOrganizer,_headers3)}})},children:"Save"})]})]})})}(0,urql__WEBPACK_IMPORTED_MODULE_22__.Ps)(_templateObject||(_templateObject=function _taggedTemplateLiteralLoose(strings,raw){return raw||(raw=strings.slice(0)),strings.raw=raw,strings}(["\n    mutation UpsertConferenceTheme($conferenceId: uuid!, $value: jsonb!) {\n        insert_conference_Configuration_one(\n            object: { conferenceId: $conferenceId, key: THEME_COMPONENT_COLORS, value: $value }\n            on_conflict: { constraint: Configuration_pkey, update_columns: [value] }\n        ) {\n            conferenceId\n            key\n            value\n        }\n    }\n"]))),ManageShuffle.displayName="ManageShuffle"},"../node_modules/.pnpm/use-react-router-breadcrumbs@2.0.2_react-router@5.2.1+react@17.0.2/node_modules/use-react-router-breadcrumbs/dist/es/index.js":(__unused_webpack_module,__webpack_exports__,__webpack_require__)=>{__webpack_require__.d(__webpack_exports__,{Z:()=>__WEBPACK_DEFAULT_EXPORT__});var _babel_runtime_helpers_toConsumableArray__WEBPACK_IMPORTED_MODULE_2__=__webpack_require__("../node_modules/.pnpm/@babel+runtime@7.15.4/node_modules/@babel/runtime/helpers/esm/toConsumableArray.js"),react__WEBPACK_IMPORTED_MODULE_0__=__webpack_require__("../node_modules/.pnpm/react@17.0.2/node_modules/react/index.js"),react_router__WEBPACK_IMPORTED_MODULE_1__=__webpack_require__("../node_modules/.pnpm/react-router@5.2.1_react@17.0.2/node_modules/react-router/esm/react-router.js");var DEFAULT_MATCH_OPTIONS={exact:!0},humanize=function humanize(str){return str.replace(/^[\s_]+|[\s_]+$/g,"").replace(/[_\s]+/g," ").replace(/^[a-z]/,(function(m){return m.toUpperCase()}))},render=function render(_ref){var Breadcrumb=_ref.breadcrumb,match=_ref.match,location=_ref.location,props=_ref.props,componentProps=Object.assign({match,location,key:match.url},props||{});return Object.assign(Object.assign({},componentProps),{breadcrumb:"string"==typeof Breadcrumb?(0,react__WEBPACK_IMPORTED_MODULE_0__.createElement)("span",{key:componentProps.key},Breadcrumb):react__WEBPACK_IMPORTED_MODULE_0__.createElement(Breadcrumb,Object.assign({},componentProps))})},getBreadcrumbMatch=function getBreadcrumbMatch(_ref3){var breadcrumb,currentSection=_ref3.currentSection,disableDefaults=_ref3.disableDefaults,excludePaths=_ref3.excludePaths,location=_ref3.location,pathSection=_ref3.pathSection,routes=_ref3.routes;return excludePaths&&excludePaths.some((function getIsPathExcluded(path){return null!=(0,react_router__WEBPACK_IMPORTED_MODULE_1__.LX)(pathSection,{path,exact:!0,strict:!1})}))?"NO_BREADCRUMB":(routes.some((function(_a){var userProvidedBreadcrumb=_a.breadcrumb,matchOptions=_a.matchOptions,path=_a.path,rest=function __rest(s,e){var t={};for(var p in s)Object.prototype.hasOwnProperty.call(s,p)&&e.indexOf(p)<0&&(t[p]=s[p]);if(null!=s&&"function"==typeof Object.getOwnPropertySymbols){var i=0;for(p=Object.getOwnPropertySymbols(s);i<p.length;i++)e.indexOf(p[i])<0&&Object.prototype.propertyIsEnumerable.call(s,p[i])&&(t[p[i]]=s[p[i]])}return t}(_a,["breadcrumb","matchOptions","path"]);if(!path)throw new Error("useBreadcrumbs: `path` must be provided in every route object");var match=(0,react_router__WEBPACK_IMPORTED_MODULE_1__.LX)(pathSection,Object.assign(Object.assign({},matchOptions||DEFAULT_MATCH_OPTIONS),{path}));return match&&null===userProvidedBreadcrumb||!match&&matchOptions?(breadcrumb="NO_BREADCRUMB",!0):!!match&&(!userProvidedBreadcrumb&&disableDefaults?(breadcrumb="NO_BREADCRUMB",!0):(breadcrumb=render(Object.assign({breadcrumb:userProvidedBreadcrumb||humanize(currentSection),match,location},rest)),!0))})),breadcrumb||(disableDefaults?"NO_BREADCRUMB":function getDefaultBreadcrumb(_ref2){var currentSection=_ref2.currentSection,location=_ref2.location,pathSection=_ref2.pathSection,match=(0,react_router__WEBPACK_IMPORTED_MODULE_1__.LX)(pathSection,Object.assign(Object.assign({},DEFAULT_MATCH_OPTIONS),{path:pathSection}))||{url:"not-found"};return render({breadcrumb:humanize(currentSection),match,location})}({pathSection,currentSection:"/"===pathSection?"Home":currentSection,location})))},flattenRoutes=function flattenRoutes(routes){return routes.reduce((function(arr,route){return route.routes?arr.concat([route].concat((0,_babel_runtime_helpers_toConsumableArray__WEBPACK_IMPORTED_MODULE_2__.Z)(flattenRoutes(route.routes)))):arr.concat(route)}),[])};const __WEBPACK_DEFAULT_EXPORT__=function useReactRouterBreadcrumbs(routes,options){return function getBreadcrumbs(_ref4){var routes=_ref4.routes,location=_ref4.location,_ref4$options=_ref4.options,options=void 0===_ref4$options?{}:_ref4$options,matches=[];return location.pathname.split("?")[0].split("/").reduce((function(previousSection,currentSection,index){var pathSection=currentSection?"".concat(previousSection,"/").concat(currentSection):"/";if("/"===pathSection&&0!==index)return"";var breadcrumb=getBreadcrumbMatch(Object.assign({currentSection,location,pathSection,routes},options));return"NO_BREADCRUMB"!==breadcrumb&&matches.push(breadcrumb),"/"===pathSection?"":pathSection}),""),matches}({routes:flattenRoutes(routes||[]),location:(0,react_router__WEBPACK_IMPORTED_MODULE_1__.TH)(),options})}},"../node_modules/.pnpm/@babel+runtime@7.15.4/node_modules/@babel/runtime/helpers/esm/toConsumableArray.js":(__unused_webpack___webpack_module__,__webpack_exports__,__webpack_require__)=>{function _arrayLikeToArray(arr,len){(null==len||len>arr.length)&&(len=arr.length);for(var i=0,arr2=new Array(len);i<len;i++)arr2[i]=arr[i];return arr2}function _toConsumableArray(arr){return function _arrayWithoutHoles(arr){if(Array.isArray(arr))return _arrayLikeToArray(arr)}(arr)||function _iterableToArray(iter){if("undefined"!=typeof Symbol&&null!=iter[Symbol.iterator]||null!=iter["@@iterator"])return Array.from(iter)}(arr)||function _unsupportedIterableToArray(o,minLen){if(o){if("string"==typeof o)return _arrayLikeToArray(o,minLen);var n=Object.prototype.toString.call(o).slice(8,-1);return"Object"===n&&o.constructor&&(n=o.constructor.name),"Map"===n||"Set"===n?Array.from(o):"Arguments"===n||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)?_arrayLikeToArray(o,minLen):void 0}}(arr)||function _nonIterableSpread(){throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}()}__webpack_require__.d(__webpack_exports__,{Z:()=>_toConsumableArray})}}]);