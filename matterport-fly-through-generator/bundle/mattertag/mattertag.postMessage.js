(()=>{"use strict";var e;!function(e){e.LOADED="inject.loaded",e.SETUP="inject.setup",e.RESOLVE="inject.resolve"}(e||(e={}));class t{constructor(){this.values={}}add(e,t){this.getValuesAtKey(e).push(t)}remove(e,t){const s=this.values[e];if(s){const e=s.indexOf(t);e>-1&&s.splice(e,1)}}getValuesAtKey(e){const t=this.values[e]||[];return this.values[e]=t,t}valuesPerKey(e){return this.getValuesAtKey(e).length}}class s{constructor(e,s,n){this.sourceId=e,this.targetId=s,this.target=n,this.messageHandlers=new t,this.onMessage=e=>{const{type:t,fromId:s,toId:n}=e.data;if(s!==this.targetId&&n!==this.sourceId)return;const o=this.messageHandlers.getValuesAtKey(t);for(const t of o)t(...e.data.payload)},window.addEventListener("message",this.onMessage)}updateTarget(e){this.target=e}facade(){const e=this;return new class{dispose(){e.dispose()}on(t,s){e.on(t,s)}off(t,s){e.off(t,s)}send(t,...s){e.send(t,...s)}}}dispose(){window.removeEventListener("message",this.onMessage),this.messageHandlers=new t}on(e,t){this.messageHandlers.add(e,t)}off(e,t){this.messageHandlers.remove(e,t)}send(e,...t){this.target.postMessage({toId:this.targetId,fromId:this.sourceId,type:e,payload:t},"*")}}function n(e,t,s){for(;t.childNodes.length;){const n=t.childNodes[0];if("SCRIPT"===n.nodeName){const e=document.createElement("script"),o=n;o.src?e.setAttribute("src",o.src):e.innerHTML=o.innerHTML||"",t.removeChild(n),s.push(e)}else e.append(n)}}window.addEventListener("message",(function t(o){if(o.source===window.parent&&o.data.type===e.SETUP){const a=o.data.windowPath,d=Function("return window.parent"+a)();window.removeEventListener("message",t),function(e,t){const n=new s(e.id,e.targetId,t).facade(),o=e.messageFcnMapping;window[o.send]=(e,...t)=>n.send(e,...t),window[o.on]=(e,t)=>n.on(e,t),window[o.off]=(e,t)=>n.off(e,t)}(o.data,d);const i=(new DOMParser).parseFromString(o.data.customHTML,"text/html"),r=[];n(document.head,i.head,r),n(document.body,i.body,r),function e(t){const s=t[0];s&&(s.onload=function(){t.shift(),e(t)},document.head.appendChild(s))}(r),d.postMessage({type:e.RESOLVE,fromId:o.data.id,toId:o.data.targetId},"*")}}))})();