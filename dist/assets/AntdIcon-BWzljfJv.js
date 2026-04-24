import{$ as e,D as t,Mt as n,O as r,Tt as i,X as a,an as o,rn as s,zt as c}from"./jsx-runtime-DAI2MLzz.js";var l=o(s());function u(e){return e.replace(/-(.)/g,(e,t)=>t.toUpperCase())}function d(e,t){c(e,`[@ant-design/icons] ${t}`)}function f(e){return typeof e==`object`&&typeof e.name==`string`&&typeof e.theme==`string`&&(typeof e.icon==`object`||typeof e.icon==`function`)}function p(e={}){return Object.keys(e).reduce((t,n)=>{let r=e[n];switch(n){case`class`:t.className=r,delete t.class;break;default:delete t[n],t[u(n)]=r}return t},{})}function m(e,t,n){return n?l.createElement(e.tag,{key:t,...p(e.attrs),...n},(e.children||[]).map((n,r)=>m(n,`${t}-${e.tag}-${r}`))):l.createElement(e.tag,{key:t,...p(e.attrs)},(e.children||[]).map((n,r)=>m(n,`${t}-${e.tag}-${r}`)))}function h(t){return e(t)[0]}function g(e){return e?Array.isArray(e)?e:[e]:[]}var _=`
.anticon {
  display: inline-flex;
  align-items: center;
  color: inherit;
  font-style: normal;
  line-height: 0;
  text-align: center;
  text-transform: none;
  vertical-align: -0.125em;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.anticon > * {
  line-height: 1;
}

.anticon svg {
  display: inline-block;
  vertical-align: inherit;
}

.anticon::before {
  display: none;
}

.anticon .anticon-icon {
  display: block;
}

.anticon[tabindex] {
  cursor: pointer;
}

.anticon-spin::before,
.anticon-spin {
  display: inline-block;
  -webkit-animation: loadingCircle 1s infinite linear;
  animation: loadingCircle 1s infinite linear;
}

@-webkit-keyframes loadingCircle {
  100% {
    -webkit-transform: rotate(360deg);
    transform: rotate(360deg);
  }
}

@keyframes loadingCircle {
  100% {
    -webkit-transform: rotate(360deg);
    transform: rotate(360deg);
  }
}
`,v=e=>{let{csp:n,prefixCls:a,layer:o}=(0,l.useContext)(r),s=_;a&&(s=s.replace(/anticon/g,a)),o&&(s=`@layer ${o} {\n${s}\n}`),(0,l.useEffect)(()=>{let r=e.current,a=t(r);i(s,`@ant-design-icons`,{prepend:!o,csp:n,attachTo:a})},[])},y={primaryColor:`#333`,secondaryColor:`#E6E6E6`,calculated:!1};function b({primaryColor:e,secondaryColor:t}){y.primaryColor=e,y.secondaryColor=t||h(e),y.calculated=!!t}function x(){return{...y}}var S=e=>{let{icon:t,className:n,onClick:r,style:i,primaryColor:a,secondaryColor:o,...s}=e,c=l.useRef(null),u=y;if(a&&(u={primaryColor:a,secondaryColor:o||h(a)}),v(c),d(f(t),`icon should be icon definiton, but got ${t}`),!f(t))return null;let p=t;return p&&typeof p.icon==`function`&&(p={...p,icon:p.icon(u.primaryColor,u.secondaryColor)}),m(p.icon,`svg-${p.name}`,{className:n,onClick:r,style:i,"data-icon":p.name,width:`1em`,height:`1em`,fill:`currentColor`,"aria-hidden":`true`,...s,ref:c})};S.displayName=`IconReact`,S.getTwoToneColors=x,S.setTwoToneColors=b;function C(e){let[t,n]=g(e);return S.setTwoToneColors({primaryColor:t,secondaryColor:n})}function w(){let e=S.getTwoToneColors();return e.calculated?[e.primaryColor,e.secondaryColor]:e.primaryColor}function T(){return T=Object.assign?Object.assign.bind():function(e){for(var t=1;t<arguments.length;t++){var n=arguments[t];for(var r in n)Object.prototype.hasOwnProperty.call(n,r)&&(e[r]=n[r])}return e},T.apply(this,arguments)}C(a.primary);var E=l.forwardRef((e,t)=>{let{className:i,icon:a,spin:o,rotate:s,tabIndex:c,onClick:u,twoToneColor:d,...f}=e,{prefixCls:p=`anticon`,rootClassName:m}=l.useContext(r),h=n(m,p,{[`${p}-${a.name}`]:!!a.name,[`${p}-spin`]:!!o||a.name===`loading`},i),_=c;_===void 0&&u&&(_=-1);let v=s?{msTransform:`rotate(${s}deg)`,transform:`rotate(${s}deg)`}:void 0,[y,b]=g(d);return l.createElement(`span`,T({role:`img`,"aria-label":a.name},f,{ref:t,tabIndex:_,onClick:u,className:h}),l.createElement(S,{icon:a,primaryColor:y,secondaryColor:b,style:v}))});E.getTwoToneColor=w,E.setTwoToneColor=C;export{E as t};