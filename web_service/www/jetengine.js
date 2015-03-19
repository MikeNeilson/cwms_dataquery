/* 
  ---------------------------------------------
                \JETENGINE 2.0/
             ____\____/O\____/____
                  \__\\_//__/
  (c) 2011 Gunnar Leffler
  Get your site revvin like an F22 jet engine
  For licence info visit http://www.leftech.com
  ---------------------------------------------
*/
function jetEngine(){var that=this;}
J=new jetEngine;jetEngine.prototype.getById=function(id){return document.getElementById(id);}
jetEngine.prototype.addEvent=function(elm,evType,fn,useCapture){if(elm.addEventListener){elm.addEventListener(evType,fn,useCapture);return true;}
else if(elm.attachEvent){var r=elm.attachEvent('on'+evType,fn);return r;}
else{elm['on'+evType]=fn;}}
jetEngine.prototype.removeEvent=function(elm,type,fn){if(elm.removeEventListener)elm.removeEventListener(type,fn,false);else if(elm.detachEvent){elm.detachEvent("on"+type,obj[type+fn]);elm[type+fn]=null;elm["e"+type+fn]=null;}}
jetEngine.prototype.getElementsByClass=function(searchClass,node,tag){var classElements=new Array();if(node==null)
node=document;if(tag==null)
tag='*';var els=node.getElementsByTagName(tag);var elsLen=els.length;var pattern=new RegExp('(^|\\\\s)'+searchClass+'(\\\\s|$)');for(i=0,j=0;i<elsLen;i++){if(pattern.test(els[i].className)){classElements[j]=els[i];j++;}}
return classElements;}
jetEngine.prototype.insertAfter=function(parent,node,referenceNode){parent.insertBefore(node,referenceNode.nextSibling);}
jetEngine.prototype.et=function(){var elements=new Array();for(var i=0;i<arguments.length;i++){var element=arguments[i];if(typeof element=='string')
element=document.getElementById(element);if(arguments.length==1)
return element;elements.push(element);}
return elements;}
jetEngine.prototype.getOffset=function(el){for(var r={x:el.offsetLeft,y:el.offsetTop,el:el.offsetHeight,el:el.offsetWidth};el=el.offsetParent;r.x+=el.offsetLeft,r.y+=el.offsetTop);return r;}
jetEngine.prototype.setOffset=function(el,x,y){el.style.left=x+"px";el.style.top=y+"px";}
jetEngine.prototype.getHeight=function(el){return el.offsetHeight;}
jetEngine.prototype.getWidth=function(el){return el.offsetWidth;}
jetEngine.prototype.removeChar=function(s,c){var i;var output="";for(i=0;i<s.length;i++)
{if(s.charAt(i)!=c)output+=s.charAt(i);}
return output;}
jetEngine.prototype.currencyFormatted=function(amount){var i=parseFloat(amount);if(isNaN(i)){i=0.00;}
var minus='';if(i<0){minus='-';}
i=Math.abs(i);i=parseInt((i+.005)*100);i=i/100;s=new String(i);if(s.indexOf('.')<0){s+='.00';}
if(s.indexOf('.')==(s.length-2)){s+='0';}
s=minus+s;return s;}
jetEngine.prototype.getURLparams=function(name){name=name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");var regexS="[\\?&]"+name+"=([^&#]*)";var regex=new RegExp(regexS);var results=regex.exec(window.location.href);if(results==null)return"";else return results[1];}
jetEngine.prototype.stripAlpha=function(s){return s.replace(/[^0-9.]+/g,'');}
jetEngine.prototype.trim=function(s){return s.replace(/^\s+|\s+$/g,"");}
jetEngine.prototype.ltrim=function(s){return s.replace(/^\s+/g,"");}
jetEngine.prototype.rtrim=function(s){return s.replace(/\s+$/g,"");}
jetEngine.prototype.replaceAll=function(str,stringToFind,stringToReplace){var index=str.indexOf(stringToFind);while(index!=-1){str=str.replace(stringToFind,stringToReplace);index=str.indexOf(stringToFind);}
return str;}
jetEngine.prototype.getRandomElement=function(arr){return arr[this.getRandom(arr.length-1)];}
jetEngine.prototype.inArray=function(arr,value){var i;for(i=(arr.length-1);i>=0;i--){if(arr[i]===value)return true;}
return false;}
jetEngine.prototype.numSort=function(arr){return arr.sort(function(a,b){return a-b;});}
jetEngine.prototype.removeDuplicates=function(arr){for(i=0;i<arr.length;i++){for(j=arr.length-1;j>i;j--){if(arr[i][0]==arr[j][0]){arr.splice(j,1);}}}}
jetEngine.prototype.empty=function(){for(i=0;i<=arr.length;i++){arr.shift();}}
jetEngine.prototype.listLookup=function(arr,val){var x=0;var y=0;var i=0;var maxrows=arr.length-1;y=maxrows-1;for(i=1;i<maxrows;i++){if(arr[i+1][0]>val){y=i;i=maxrows;}}
return interpolate(arr[y][0],arr[y][1],arr[y+1][0],arr[y+1][1],val);}
jetEngine.prototype.tableLookup=function(arr,colval,rowval){var output;var x=0;var y=0;var i=0;var maxcols=arr[0].length-1;var maxrows=arr.length-1;x=maxcols-1;y=maxrows-1;for(i=1;i<maxcols;i++){if(arr[0][i+1]>colval){x=i;i=maxcols;}}
for(i=1;i<maxrows;i++){if(arr[i+1][0]>rowval){y=i;i=maxrows;}}
if((x==maxcols)||(y==maxcols)){output=arr[y][x];}else{output=Bilinear(arr[0][x],arr[y][0],arr[0][x+1],arr[y+1][0],arr[y][x],arr[y+1][x],arr[y][x+1],arr[y+1][x+1],colval,rowval);}
return(output);}
jetEngine.prototype.getRandom=function(maxNum){return Math.floor(Math.random()*(maxNum));}
jetEngine.prototype.sum=function(arr){var output=0;var i;for(i=0;i<arr.length;i++)if(!isNaN(arr[i]))output+=arr[i];return output;}
jetEngine.prototype.norm=function(arr){var output=0;var i;for(i=0;i<arr.length;i++)if(!isNaN(arr[i]))output+=arr[i]*arr[i];return Math.sqrt(output);}
jetEngine.interpolate=function(x0,y0,x1,y1,x){m=(y1-y0)/(x1-x0);return(y0+(x-x0)*m);}
jetEngine.bilinear=function(x1,y1,x2,y2,fQ11,fQ12,fQ21,fQ22,x,y){return(fQ11/((x2-x1)*(y2-y1)))*(x2-x)*(y2-y)+(fQ21/((x2-x1)*(y2-y1)))*(x-x1)*(y2-y)+(fQ12/((x2-x1)*(y2-y1)))*(x2-x)*(y-y1)+(fQ22/((x2-x1)*(y2-y1)))*(x-x1)*(y-y1)}
jetEngine.prototype.createCookie=function(name,value,days){if(days){var date=new Date();date.setTime(date.getTime()+(days*24*60*60*1000));var expires="; expires="+date.toGMTString();}
else var expires="";document.cookie=name+"="+value+expires+"; path=/";}
jetEngine.prototype.readCookie=function(name){var nameEQ=name+"=";var ca=document.cookie.split(';');for(var i=0;i<ca.length;i++){var c=ca[i];while(c.charAt(0)==' ')c=c.substring(1,c.length);if(c.indexOf(nameEQ)==0)return c.substring(nameEQ.length,c.length);}
return null;}
jetEngine.prototype.eraseCookie=function(name){createCookie(name,"",-1);}
jetEngine.prototype.goSecure=function(){if((location.protocol=="http:")||(location.protocol=="http"))
{window.location.href="https://"+location.hostname+location.pathname;}}
jetEngine.setOpacity=function(element,value){element.style.opacity=value/100;element.style.filter='alpha(opacity='+value+')';}
jetEngine.prototype.setTimer=function(code,delay){return window.window.setTimeout(code,delay);}
jetEngine.mouseCoords=function(ev){if(ev.pageX||ev.pageY){return{x:ev.pageX,y:ev.pageY};}
return{x:ev.clientX-document.body.scrollLeft-document.body.clientLeft,y:ev.clientY-document.body.scrollTop-document.body.clientTop};}
jetEngine.prototype.getMouseOffset=function(target,ev){ev=ev||window.event;var docPos=this.getOffest(target);var mousePos=this.mouseCoords(ev);return{x:mousePos.x-docPos.x,y:mousePos.y-docPos.y};}
jetEngine.prototype.toggle=function(id){var el=this.getById(id);if(el.style.display!='none'){el.style.display='none';}
else{el.style.display='';}}
jetEngine.prototype.blindDown=function(id,height,speed){var sp;if(!speed){sp=3;}else sp=speed;var curHeight=this.stripAlpha(this.getById(id).style.height);var t=5;for(i=curHeight;i<=height;i++){t+=sp;this.setTimer("document.getElementById('"+id+"').style.height='"+i+"px'",t);}}
jetEngine.prototype.blindUp=function(id,height,speed){var sp;if(!speed){sp=3;}else sp=speed;var curHeight=this.stripAlpha(this.getById(id).style.height);if(height>curHeight)return;var t=5;for(i=curHeight;i>=height;i--){t+=sp;this.setTimer("document.getElementById('"+id+"').style.height='"+i+"px'",t);}}
jetEngine.prototype.scrollDivLeft=function(id,step){for(i=0;i<step;i++){this.setTimer("document.getElementById('"+id+"').scrollLeft-=1;",i*2);}}
jetEngine.prototype.scrollDivRight=function(id,step){for(i=0;i<step;i++){this.setTimer("document.getElementById('"+id+"').scrollLeft+=1;",i*2);}}
jetEngine.hScrollTo=function(id,pos){clearTimeout(ts);var step=(pos-document.getElementById(id).scrollLeft);var step2=step/15;if(Math.abs(step)>3){document.getElementById(id).scrollLeft+=parseInt(step2);this.setTimer("jetEngine.hScrollTo('"+id+"',"+pos+")",5);}else{document.getElementById(id).scrollLeft=pos;}}
jetEngine.prototype.fadeOut=function(id){for(i=100;i>=0;i-=2)
this.setTimer('jetEngine.setOpacity(document.getElementById("'+id+'"),'+i+')',500-i*5);}
jetEngine.prototype.fadeIn=function(id){for(i=100;i>=0;i-=2)
this.setTimer('jetEngine.setOpacity(document.getElementById("'+id+'"),'+i+')',i*5);}
function ajaxObject(url,callbackFunction){var that=this;this.updating=false;this.abort=function(){if(that.updating){that.updating=false;that.AJAX.abort();that.AJAX=null;}}
this.update=function(passData,postMethod){if(that.updating){return false;}
that.AJAX=null;if(window.XMLHttpRequest){that.AJAX=new XMLHttpRequest();if(that.AJAX.overrideMimeType)that.AJAX.overrideMimeType('text/plain');}else{that.AJAX=new ActiveXObject("Microsoft.XMLHTTP");}
if(that.AJAX==null){return false;}else{that.AJAX.onreadystatechange=function(){if(that.AJAX.readyState==4){that.updating=false;that.callback(that.AJAX.responseText,that.AJAX.status);that.AJAX=null;}}
that.updating=new Date();if(/post/i.test(postMethod)){var uri=urlCall;that.AJAX.open("POST",uri,true);that.AJAX.setRequestHeader("Content-type","application/x-www-form-urlencoded");that.AJAX.setRequestHeader("Content-Length",passData.length);that.AJAX.send(passData);}else{var uri=urlCall;that.AJAX.open("GET",uri,true);that.AJAX.send(null);}
return true;}}
var urlCall=url;this.callback=callbackFunction||function(){};}
