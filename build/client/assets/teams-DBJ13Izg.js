import{j as e,r as x}from"./jsx-runtime-d4vcKfGz.js";import{I as w,a as h,b as m,c as f,d as i,e as t}from"./info-category-DNcmEVWn.js";import{q as p}from"./components-C5c64wmR.js";const j=({className:s=""})=>e.jsx("svg",{xmlns:"http://www.w3.org/2000/svg",viewBox:"0 0 16 16",fill:"currentColor",className:`size-4 ${s}`.trim(),children:e.jsx("path",{fillRule:"evenodd",clipRule:"evenodd",d:"M4.22 11.78a.75.75 0 0 1 0-1.06L9.44 5.5H5.75a.75.75 0 0 1 0-1.5h5.5a.75.75 0 0 1 .75.75v5.5a.75.75 0 0 1-1.5 0V6.56l-5.22 5.22a.75.75 0 0 1-1.06 0Z"})}),C=({url:s})=>{const o=s==null?void 0:s.toLowerCase().replace(/(https?)\:\/\/(www\.)?/,"").replace(/\/$/,"");return e.jsx("a",{href:s,target:"_blank",rel:"noreferrer",children:o})},v=({team:s})=>e.jsxs(h,{children:[e.jsx(m,{title:`${s.number} - ${s.name}`,secondaryContent:s.website&&e.jsx(C,{url:s.website})}),e.jsxs(f,{children:[e.jsxs(i,{children:[e.jsx(t,{label:"City",value:s.location.city}),e.jsx(t,{label:"County",value:s.location.county})]}),e.jsxs(i,{children:[e.jsx(t,{label:"Rookie Year",value:s.rookieYear}),e.jsx(t,{label:"Event Ready?",value:s.eventReady?"Yes":e.jsxs("a",{href:s.url,target:"_blank",rel:"noreferrer",children:[e.jsx("span",{children:"No - "}),e.jsxs("span",{className:"text-sm text-gray-400 hover:text-blue-600",children:["Coaches, get ready now",e.jsx(j,{className:"inline"})]})]})})]})]})]});function L(){const{teams:s}=p(),[o,c]=x.useState(""),d=s.filter(r=>r.name.toLowerCase().includes(o.toLowerCase())||r.number.toString().toLowerCase().includes(o.toLowerCase())||r.location.city.toLowerCase().includes(o.toLowerCase())||r.location.state_province.toLowerCase().includes(o.toLowerCase())).reduce((r,n)=>{var l;const a=((l=n.league)==null?void 0:l.code)||"Unknown";return r[a]||(r[a]=[]),r[a].push(n),r},{}),u=s.reduce((r,n)=>{const a=n.league;return a?{...r,[a.code]:a.name}:r},{});return e.jsxs("div",{className:"w-full md:min-w-[750px] md:max-w-prose",children:[e.jsx("div",{className:"w-full flex flex-col items-center",children:e.jsx("input",{type:"text",value:o,onChange:r=>c(r.target.value),placeholder:"Search teams...",className:"md:w-2/3 w-full p-2 mb-4 border rounded bg-white"})}),e.jsx("div",{className:"flex flex-col w-full mx-auto",children:Object.entries(d).map(([r,n])=>e.jsx(w,{header:u[r]||"Unknown",children:n.map(a=>e.jsx(v,{team:a},a.number))},r))})]})}export{L as default};
