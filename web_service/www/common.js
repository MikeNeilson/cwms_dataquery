/*-------------------------------------------

  Common

  --------------------------------------------*/


var incr = 0;

var resultText = new Array();

var metadata = new Array();

var webSvcBase = "http://XXX-wmlocal2.XXX.usace.army.mil/common/web_service/webexec/";

function localizeURL()
{
 var serverLoc=document.URL.substring(7,10);
 webSvcBase = J.replaceAll(webSvcBase,"XXX",serverLoc);
}


function pleaseWait(id)
{
    J.getById(id).innerHTML = '<div  style = "width:400px;padding:20"><center><img src = "searching.gif"><h3> one moment.....</h3></center></div>';
}

function clear()
{
   J.getById('results').innerHTML = " ";
   J.getById('data').innerHTML = " ";
}

function searchDB()
{
  pleaseWait('results');
  if (J.getById("genSearch").value.length < 2){
    J.getById('results').innerHTML = '<div  style = "width:400px;padding:20">Please enter more information.</div>';
    return;
  } else
  {
    J.getById('results').innerHTML = searchPathnames(J.getById("genSearch").value, lookback).join("");
  }
}

function displayData (pathname,units)
{
  var format = J.getById("formatSelect").value;
  var lookback = J.getById("lookback").value;
  var myUrl = webSvcBase+format+"?id="+pathname+":units="+units;
  myUrl += "&lookback="+lookback;
  myUrl += "&timeformat=%d-%b-%Y %H:%M"
  J.getById('data').innerHTML = '<a href = "'+myUrl+'">'+myUrl+'</a>';
}

function searchPathnames(searchStr,lookback)
{
  var count = 0;
  var srch = J.trim(searchStr);
  srch = srch.toUpperCase();
  srch = srch.split(" ");
  resultText = [];
  var keyCount = srch.length;
  for (i = 0; i < metadata.length;i++)
  {
    count = 0;
    var upcaseMetadata = metadata[i][0].toUpperCase();
    for (j = 0; j < srch.length; j++)
     if (upcaseMetadata.indexOf(srch[j]) !=-1){
      count++;
     }
    if (count >= keyCount){
     resultText[i]= ['<div class = "selection" onmouseover = "this.style.backgroundColor=\'#CCC\'" onmouseout = "this.style.backgroundColor=\'transparent\'" onclick = "displayData(\'',metadata[i][0],'\',\'',metadata[i][1],'\');">',metadata[i][0],'</div>'].join("");
    } 
  }
  return resultText;
}



function initialize()
{
 localizeURL();
 J.addEvent(J.getById("genSearch"),'keyup',function(event){
  if(event.keyCode == 13) J.getById("searchButton").click();
 });
  var aj = new ajaxObject ('pathnames.txt')
  aj.callback = function (responseText) {
    var TA = responseText.split("\n"); //Temporary Array
    var SA = new Array(); //Array With Cleaned Up Text
    var count = 0;
    var i;
    for (i = 0; i < TA.length; i++) //remove short lines w/no info
    {
      if (TA[i].length > 10)
      {
        SA[count] = TA[i].split("\t");
        count++;
      }
    }
    metadata = SA;
  }
  aj.update();
}

/*-------------------------------------------
  Utilities
  --------------------------------------------*/

function formatTimeNumber (n)
{
  output = n+"";
  if (n <= 9)
  {
    output = "0"+output;
  }
  return output;
}

