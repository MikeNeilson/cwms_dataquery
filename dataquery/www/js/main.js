/*---------------------------------------------------------
  __ \          |                                               
  |   |   _` |  __|   _` |   _` |  |   |   _ \   __|  |   |     
  |   |  (   |  |    (   |  (   |  |   |   __/  |     |   |     
 ____/  \__,_| \__| \__,_| \__, | \__,_| \___| _|    \__, |     
                               _|                    ____/  
  v2.0: main.js                                 
---------------------------------------------------------*/

if (!window.console) {var console = {};}
if (!console.log) {console.log = function() {};}

var dataquery = function() {
    //-----Settings
    this.navbarToggle = true;
    this.plotToggle = true;
    this.tableToggle = true;
    this.advancedToggle = false;
    this.webServicePath = "../../web_service/webexec/getjson";
    this.htmlServicePath = "../../web_service/webexec/html";
    this.csvServicePath = "../../web_service/webexec/ecsv";
    this.loadingHTML = '<img src = "img/loading.gif" style = "display: block;margin-left: auto;margin-right: auto">';
    //-----Validated input
    this.lookback = 7;
    this.startdate = "";
    this.lookforward = 0;
    this.enddate = "";
    this.status = "OK";
    //-----Data
    this.data = {}; //hydroJSON object for data currently being used
    this.catalog = {}; //hydroJSON object for catalog currently being used
    this.timeseriesList = []; //list of timeseries
};

dataquery.prototype = {

    initialize: function() {},

    /**
     * method either shows or hides plot in the display
     */

    togglePlot: function() {
        //console.log(this.plotToggle);
        if (this.plotToggle == true) {
            this.plotToggle = false;
            $("#btn_plot").text("Plot Off");
            $("#plotArea").hide()
        } else {
            this.plotToggle = true;
            $("#btn_plot").text("Plot On");
            $("#plotArea").show()
        }
    },

    /**
     * method either shows or hides data table in the display
     */

    toggleTable: function() {
        console.log(this.tableToggle);
        if (this.tableToggle == true) {
            this.tableToggle = false;
            $("#tableArea").hide()
        } else {
            this.tableToggle = true;
            $("#tableArea").show()
        }
    },

    /**
     * method either shows or hides advanced options
     */

    toggleAdvanced: function() {
        if (this.advancedToggle == true) {
            this.advancedToggle = false;
            $("#advancedArea").hide()
        } else {
            this.advancedToggle = true;
            $("#advancedArea").show()
        }
    },


   /*
   ** Returns a date from a given offset and optional time.
   ** If time is not provided, defaults to datetime.now()
   ** Human: Mike
   */

    offsetToDate: function( offset, direction ) {
      var ret = moment();
      var sign = 1;
      if( offset[0] == '-' ) sign = -1;
      if( direction =='backward' ) sign = -sign;
      mods = offset.match( /\d+\w/g );
      for( var item in mods ) {
        mods[item].split( /(\d+)(\w)/ );
        count = RegExp.$1;
        unit = RegExp.$2;
        ret = ret.add( count * sign, unit );
      }
      return ret.format( "MM/DD/YYYY HHmm" );
    },

   /*
   ** Returns an offset from current time to a given time 
   ** Human: Mike
   */

    dateToOffset: function( date, direction ) {
      var target = moment( date, "MM/DD/YYYY hhmm" );
      var diff = target.unix() - moment().unix();
      var ret = "";
      if (direction == "backward") diff = -diff;
      if( diff < 0 ) {
        ret += "-";
        diff *= -1;
      }
      var d = moment.duration( diff, 'seconds' );
      //if( v = d.as( 'y' ) | 0 ) { ret += v + 'y'; d.subtract( v, 'y' ); }
      //if( v = d.as( 'M' ) | 0 ) { ret += v + 'M'; d.subtract( v, 'M' ); }
      if( v = d.as( 'w' ) | 0 ) { ret += v + 'w'; d.subtract( v, 'w' ); }
      if( v = d.as( 'd' ) | 0 ) { ret += v + 'd'; d.subtract( v, 'd' ); }
      if( v = d.as( 'h' ) | 0 ) { ret += v + 'h'; d.subtract( v, 'h' ); }
      if( v = d.as( 'm' ) | 0 ) { ret += v + 'm'; }
      return ret;
    },

    /**
     * method will reset the interface by:
     *  clearing plot
     *  cleaning list of timeseries
     *  clearing timeseries selection area
     *  clearing data table
     * human: Nick
     * --- 12/29/2014
     */

    clear: function() {
        document.getElementById("plotArea").innerHTML = " ";
        document.getElementById("tableArea").innerHTML = " ";
        document.getElementById("timeseriesList").innerHTML = " ";
        document.getElementById("lookback").value = "7d";
        document.getElementById("lookforward").value = " ";
        document.getElementById("startdate").value = " ";
        document.getElementById("enddate").value = " ";
    },

    /*
     *  draw a new plot in the #plotArea based on the timeseries in this.data
     *  human: Mike
     */

    drawPlot: function() {

        //console.log("Drawing plot for " + JSON.stringify(this.data));

        var options = {
            canvas: true,
            lines: {
                show: true
            },
            points: {
                show: false
            },
            xaxis: {
                mode: "time",
                timeformat: "%m/%d %H:%M",
                timezone: "browser",
                font: {
                    size: 14,
                    color: "#000"
                }
            },
            yaxes: [],
            legend: {
                sorted: true
            },
            selection: {
                mode: "xy"
            }
        };

        var data = [];
        var plot;

        for (var station in this.data) {
            for (var ts_id in this.data[station].timeseries) {
                if (!this.data[station].timeseries[ts_id].values) {
                    continue;
                }
                var units = this.data[station]["timeseries"][ts_id].units;
                var ts = {
                        "label": ts_id + "(" + units + ")"
                    }
                    // Check for known axis, else create a new one
                for (var i = 0; i < options.yaxes.length; i++) {
                    if (options.yaxes[i].axisLabel == units) {
                        ts.yaxis = i + 1;
                        continue;
                    }
                }
                if (!ts.yaxis) {
                    var yaxis = {
                        axisLabel: units
                    };
                    if (options.yaxes.length % 2) {
                        yaxis.position = "right";
                    }
                    options.yaxes.push(yaxis);
                    ts.yaxis = options.yaxes.length;
                }
                ts.data = this.data[station].timeseries[ts_id].values;
                for (var i = 0; i < ts.data.length; i++) {
                    ts.data[i].pop(); // remove quality flag
                    ts.data[i][0] = (new Date(ts.data[i][0])).getTime();
                }
                data.push(ts);
            }
        }
        plot = $.plot("#plotArea", data, options);

        $("#plotArea").bind(
            "plotselected",
            function(event, ranges) {
                var opts = {};
                for (var range in ranges) {
                    opts[range] = {
                        min: ranges[range].from,
                        max: ranges[range].to
                    };
                }
                plot =
                    $.plot("#plotArea", data, $.extend(true, {}, options, opts));
            }
        );

        $("#reset").click(
            function() {
                plot = $.plot("#plotArea", data, options);
            }
        );
    },

    /**
     * method downloads current query as CSV
     * human: Gunnar
     */

    exportCSV: function() {
        var ids = [];
        for (var sta in this.data) {
            for (var tsid in this.data[sta]["timeseries"]) {
                ids.push(tsid + ":units=" + this.data[sta]["timeseries"][tsid]["units"])
            }
        }
        var inputs = this.validateInput();
        var inputlist = {
            "backward": "lookback",
            "forward": "lookforward",
            "startdate": "startdate",
            "enddate": "enddate"
        };
        var payload = {
            "id": ids.join("|"),
            "headers": "true",
            "filename": "dataquery.csv"
        };
        for (var key in inputs) {
            if (key in inputlist) {
                payload[inputlist[key]] = inputs[key];
            }
        }

        window.open(this.csvServicePath + "?" + $.param(payload), '_newtab');
    },

    /**
     * method downloads current query as JSON
     * human: Gunnar
     */

    exportJSON: function() {
        var payload = {};
        payload = this.validateInput();
        if (!payload) {
            window.alert(this.status);
            return false;
        }

        payload["query"] = JSON.stringify(this.timeseriesList);
        window.open(this.webServicePath + "?" + $.param(payload), '_newtab');
    },

   /**
     * method downloads current query as JSON
     * human: Gunnar
     */

    makeLink: function() {
        var payload = {};
        payload = this.validateInput();
        if (!payload) {
            window.alert(this.status);
            return false;
        }
        payload ["timeseriesList"] = this.timeseriesList;
        var linkURL = window.location.href.split("?")[0];
        linkURL += "?s="+btoa(JSON.stringify(payload));
        window.location.href = linkURL;
    },



    /**
     * method will go to the webservice and populate a table in #tableArea based on the timeseries in this.data
     * human: Gunnar
     */

    drawTable: function() {
        var ids = [];
        for (var sta in this.data) {
            for (var tsid in this.data[sta]["timeseries"]) {
                ids.push(tsid + ":units=" + this.data[sta]["timeseries"][tsid]["units"]);
            }
        }
        var inputs = this.validateInput();
        console.log(inputs);
        var inputlist = {
            "backward": "lookback",
            "forward": "lookforward",
            "startdate": "startdate",
            "enddate": "enddate"
        };
        var payload = {
            "id": ids.join("|"),
            "headers": "true",
        };
        //console.log(JSON.stringify(inputs));
        for (var key in inputs) {
            if (key in inputlist) {
                payload[inputlist[key]] = inputs[key];
            }
        }
        $("#tableArea").html(this.loadingHTML);
        $.get(this.htmlServicePath, payload).done(function(txt) {
            $("#tableArea").html(txt.replace('="ws"', '="table table-striped"'));
        });
    },

    /**
     *  method will draw a new plot in the #plotArea based on the timeseries in this.data
     *  human: Gunnar
     */

    drawTimeseriesList: function() {
        var template = '<div class="btn-group"><button type="button" class="btn btn-danger"  onclick = "DQ.removeTs(IDX);"><span class="glyphicon glyphicon-remove-circle"></span></button><button type="button" class="btn btn-primary">TSID</button></div>';
        var output = "";
        for (var i = 0; i < this.timeseriesList.length; i++) {
            output += template.replace("TSID", this.timeseriesList[i]).replace("IDX", i + "");
        }
        $("#timeseriesList").html(output);
    },


    /**
     * method is a callback to refresh display after data is loaded.
     * human: Gunnar
     */

    refreshCallback: function(that) {},

    /** 
     * method queries hydroJSON webservice and populate timeseries selection pane
     * human: Gunnar
     */

    query: function(keywords) {
        var params = {
            "tscatalog": "[\"" + keywords + "\"]"
        }
        $("#timeseriesSelect").html(this.loadingHTML);
        $.get(this.webServicePath, params).done(function(response) {
            //console.log(response);
            var catalog = jQuery.parseJSON(response);
            var output = '<div class="btn-group-vertical" role="group">';
            for (var sta in catalog) {
                output += '<div class="btn-group" role="group"><button type="button" class="btn btn-default dropdown-toggle" data-toggle="dropdown"  style="margin-bottom:4px;white-space: normal;">';
                output += catalog[sta]["name"] + ' (' + sta + ')</button>';
                output += '<ul class="dropdown-menu" role="menu">';
                for (var ts in catalog[sta]["timeseries"]) {
                    output += '<li><a onclick = "DQ.addTs(this.innerHTML);">' + ts + '</a></li>';
                }
                output += '</ul></div>';
            }
            output += '</div>';
            $("#timeseriesSelect").html(output);
        });
        this.toggleNavbar();
    },

    /** 
     * method queries hydroJSON webservice and stores the response in this.data
     * human: Gunnar
     */

    loadData: function() {
        var payload = {};
        payload = this.validateInput();
        //console.log(payload);
        if (!payload) {
            window.alert(this.status);
            return false;
        }

        payload["query"] = JSON.stringify(this.timeseriesList);
        console.log("Payload: " + JSON.stringify(payload));
        var that = this;
        $.get(this.webServicePath, payload,function(response) {
            that.data = JSON.parse(response);
            //console.log(JSON.stringify(response));
            that.drawPlot();
            that.drawTable();
        });
    },

    /* method will query hydroJSON webservice and add a TS to the timeseries list, table and plot
     * human: Gunnar
     */
    addTs: function(tsid) {
        this.timeseriesList.push(tsid);
        this.drawTimeseriesList();
        this.loadData();
    },

    /**
     * method will remove TS from the timeseries list, table and plot
     * human: Gunnar
     */
    removeTs: function(tsidx) {
        this.timeseriesList.splice(parseInt(tsidx), 1);
        //console.log(this.timeseriesList);
        this.drawTimeseriesList();
        this.loadData();

    },

    /**
     *method will attempt to populate internal variables with validated input.
     * returns a JSON object with properites e.g. {"backward":"7d", "forward":"1d"}
     * blank input should be ommited from JSON object
     * returns false if unsuccessful
     * human: Nick
     * 01-11-2015
     * 01-28-2015: added isValidLook()
     */
    validateInput: function() {
        //var output = '{ "backward" :$("#lookback").val() }'; //Stub for validateInput
        var output = {};
        var datePat = /^([0-9]{2})\/([0-9]{2})\/([0-9]{4})$/;

        //var lb = document.getElementById("lookback").getAttribute("placeholder");
        var lb = document.getElementById("lookback").value;
        var lf = document.getElementById("lookforward").value;
        var sd0 = document.getElementById("startdate").value;
        var ed0 = document.getElementById("enddate").value;
        var sd = sd0.substring(0,10);
        var ed = ed0.substring(0,10);
        //window.alert('lookback = ' + lb);
        //window.alert('lookforward = ' + lf);
        //window.alert('startdate = ' + sd0);
        //window.alert('enddate = ' + ed0);
        //window.alert('startdate = ' + sd);
        //window.alert('enddate = ' + ed);
        if (lb != "" && !isNaN(lb)) {
	   lb = lb+"d";
	   document.getElementById("lookback").value = lb;
	}
        if (lf != "" && !isNaN(lf)) {
	   lf = lf+"d";
	   document.getElementById("lookforward").value = lf;
	}
        if (lb != "") output["backward"] = lb;
        if (lf != "") output["forward"] = lf;
        if (sd != "") output["startdate"] = sd;
        if (ed != "") output["enddate"] = ed;
    
	this.status = "OK";

        /*   -Commented out 1/12/2015, should be able to parse 7d12h15m type values
             if (lb!="" && isNaN(lb)) {
             this.status = "Error! Lookback must be a valid number.";
             document.getElementById("lookback").focus();
             return false;
           }
           else if (lf!="" && isNaN(lf)) {
             this.status = "Error! Lookforward must be a valid number.";
             document.getElementById("lookforward").focus();
             return false;
           }
           else */

        if (lb=="" && lf=="" && sd=="" && ed=="") {
            this.status = "Error! Please enter Time Window.";
            //output["backward"] = this.status;
            //alert(this.status);
            document.getElementById("lookback").focus();
            return false;
        }

        if (lb!="") {
            if (this.isValidLook("Lookback",lb)!="OK") {
                //output["backward"] = this.isValidLook("Lookback",lb);
                this.status = this.isValidLook("Lookback",lb);
                //alert(this.isValidLook("Lookback",lb));
                document.getElementById("lookback").focus();
                return false;
            }
        }
        if (lf!="") {
            if (this.isValidLook("Lookforward",lf) != "OK") {
                //output["forward"] = this.isValidLook("Lookforward",lf);
                this.status = this.isValidLook("Lookforward",lf);
                //alert(this.isValidLook("Lookforward",lf));
                document.getElementById("lookforward").focus();
                return false;
            }
        }

        if (lb == "" && lf == "" && sd != "" && ed != "" && sd > ed) {
            this.status = "Error! Start Date must be before End Date.";
            //output["startdate"] = this.status;
            //alert(this.status);
            document.getElementById("startdate").focus();
            return false;
        }
        if (lb == "" && lf == "" && sd == "" && ed != "") {
            this.status = "Error! Please enter Starts Date.";
            //output["startdate"] = this.status;
            //alert(this.status);
            document.getElementById("startdate").focus();
            return false;
        }

        if (lb == "" && sd != "") {
            if (this.isValidDate(sd) != "") {
                //output["startdate"] = this.isValidDate(sd);
                this.status = this.isValidDate(sd);
                //alert(this.isValidDate(sd));
                document.getElementById("startdate").focus();
                return false;
            }
        } else if (lf == "" && ed != "") {
            if (this.isValidDate(ed) != "") {
                //output["enddate"] = this.isValidDate(ed);
                this.status = this.isValidDate(ed);
                //alert(this.isValidDate(ed));
                document.getElementById("enddate").focus();
                return false;
            }
        } 

        return output;
    },

isValidLook: function(type,str) {
    var status = "OK";
    // remove all "+" in str
    str = str.replace(/\+/g, '');

    var wpos=str.indexOf("w")
    var dpos=str.indexOf("d")
    var hpos=str.indexOf("h")
    var mpos=str.indexOf("m")

    var wvalue=str.substring(0,wpos)
    var dvalue=str.substring(wpos+1,dpos)
    
    var hvalue=str.substring(dpos+1,hpos)
    if (dpos==-1) hvalue=str.substring(wpos+1,hpos)
    
    var mvalue=str.substring(hpos+1,mpos)
    if (hpos==-1) 
    {
        if (dpos==-1) mvalue=str.substring(wpos+1,mpos)
        else mvalue=str.substring(dpos+1,mpos)
    }

    var pattern_w = /^-?\d{1,4}w$/i;  
    var pattern_wd = /^-?\d{1,4}w-?\d{1,3}d$/i; 
    var pattern_wh = /^-?\d{1,4}w-?\d{1,2}h$/i; 
    var pattern_wm = /^-?\d{1,4}w-?\d{1,2}m$/i; 
    var pattern_wdh = /^-?\d{1,4}w-?\d{1,3}d-?\d{1,2}h$/i; 
    var pattern_wdm = /^-?\d{1,4}w-?\d{1,3}d-?\d{1,2}m$/i; 
    var pattern_whm = /^-?\d{1,4}w-?\d{1,2}h-?\d{1,2}m$/i; 
    var pattern_wdhm = /^-?\d{1,4}w-?\d{1,3}d-?\d{1,2}h-?\d{1,2}m$/i; 
    var pattern_d = /^-?\d{1,3}d$/i; 
    var pattern_dh = /^-?\d{1,3}d-?\d{1,2}h$/i; 
    var pattern_dm = /^-?\d{1,3}d-?\d{1,2}m$/i; 
    var pattern_dhm = /^-?\d{1,3}d-?\d{1,2}h-?\d{1,2}m$/i; 
    var pattern_h = /^-?\d{1,2}h$/i; 
    var pattern_hm = /^-?\d{1,2}h-?\d{1,2}m$/i; 
    var pattern_m = /^-?\d{1,2}m$/i; 
    
    if(str.match(pattern_w) 
      || str.match(pattern_wd)
      || str.match(pattern_wh)
      || str.match(pattern_wm)   
      || str.match(pattern_wdh)
      || str.match(pattern_wdm)
      || str.match(pattern_whm)
      || str.match(pattern_wdhm)
      || str.match(pattern_d)
      || str.match(pattern_dh)
      || str.match(pattern_dm)
      || str.match(pattern_dhm)
      || str.match(pattern_h)
      || str.match(pattern_hm)
      || str.match(pattern_m))
    {  
        //if (dvalue!="") 
        //{
        //    if (dvalue>364) status="Day value must be less than 365!";   
        //}
        if (hvalue!="") 
        {
            if (hvalue>23) status="Hour value must be less than 24!";   
        }
        if (mvalue!="") 
        {
            if (mvalue>59) status="Minute value must be less than 60!";   
        }
    }  
    else  
    {   
        status=type + " must be in the formate of \"[1-9999]w[?-????]d[1-23]h[1-59]m\"!";   
    }  
    
    return status;
},


    isValidDate: function(dateStr) {
        var msg = "";
        // Checks for the following valid date formats:
        // MM/DD/YYYY   

        // To require a 4 digit year entry, use this line instead:
        var datePat = /^([0-9]{2})\/([0-9]{2})\/([0-9]{4})$/;

        var matchArray = dateStr.match(datePat); // is the format ok?
        if (matchArray == null) {
            msg = "Date is not in a valid format.";
            return msg;
        }

        month = matchArray[1]; // parse date into variables
        day = matchArray[2];
        year = matchArray[3];

        if (month < 1 || month > 12) { // check month range
            msg = "Month must be between 1 and 12.";
            return msg;
        }

        if (day < 1 || day > 31) {
            msg = "Day must be between 1 and 31.";
            return msg;
        }

        if ((month == 4 || month == 6 || month == 9 || month == 11) && day == 31) {
            msg = "Month " + month + " doesn't have 31 days!";
            return msg;
        }
        if (month == 2) { // check for february 29th
            var isleap = (year % 4 == 0 && (year % 100 != 0 || year % 400 == 0));
            if (day > 29 || (day == 29 && !isleap)) {
                msg = "February " + year + " doesn't have " + day + " days!";
                return msg;
            }
        }

        return msg; // date is valid
    },


    /**
     *method hides splash page and reveals the app
     */
    toggleNavbar: function() {
        if (this.navbarToggle) {
            $(".container-full").fadeOut();
            $('.navbar').delay(50).fadeIn();
            this.navbarToggle = false;
        } else if (1 == 2) {
            $('.navbar').fadeOut();
            $(".container-full").delay(50).fadeIn();
        }

    },


    /**
     *method hides splash page and reveals the
     */
    complain: function(errorMessage) {
        alert(errorMessage);
    }

};


var DQ = new dataquery();

/**
 * Initialize method is called after document.onready event is fired
 *  things that go here will setup plots etc.
 */

function init() {

    //bind enter to toggle search button
    $('#query1').keypress(function (e) {
    if (e.which == 13) {
       DQ.query($( '#query1').val());          
       return false;
       }
    });
   $('#query2').keypress(function (e) {
    if (e.which == 13) {
       DQ.query($( '#query2').val());
       return false;
       }
    });

    //initialize calendars
    $(function () {
     $('#startdate_input').datetimepicker({format:"MM/DD/YYYY HH00"}).on("dp.change",function(){
      var dt = DQ.dateToOffset($("#startdate").val(),"backward");
      $("#lookback").val(dt);
      });
    });
    $(function () {
     $('#enddate_input').datetimepicker({format:"MM/DD/YYYY HH00"}).on("dp.change",function(){
      var dt = DQ.dateToOffset($("#enddate").val(), "forward");
      $("#lookforward").val(dt);
      });
    });
    //link dates and lookforward/back
    $("#lookback").change(function(){
      var dt = DQ.offsetToDate( $("#lookback").val(), "backward" );
      $("#startdate").val(dt);
    });
    $("#lookforward").change(function(){
      var dt = DQ.offsetToDate( $("#lookforward").val(), "forward" );
      $("#enddate").val(dt);
    });
    //size plot area
    $("#plotArea").css("min-height", function() {
        return $(window).height() / 2;
    });
    //size table area
    $("#tableArea").css("min-height", function() {
        return $(window).height() / 3;
    });
    $("#tableArea").css("max-height", function() {
        return $(window).height() / 3;
    });

    //initialize Water Year Select
    for (var yr = new Date().getFullYear(); yr >= 1900; yr--) {
      $('#WYselect').append('<option value="'+yr+'">'+yr+'</option>');
    }
    
    $("#WYselect").change(function(){
      var dt = $("#WYselect").val();
      $("#startdate").val("10/01/"+parseInt(dt-1)+" 0000");
      $("#enddate").val("10/1/"+dt+" 0000");
      $("#lookback").val("");
      $("#lookforward").val("");
    });

    // hide advanced options first
    $("#advancedArea").hide();
 
    //initialize tooltips
    $(function () {
      $('[data-toggle="tooltip"]').tooltip()
    })

    // hide .navbar first
    $(".navbar").hide();
    // fade in .navbar
    $(function() {
        $(window).scroll(function() {
            // set distance user needs to scroll before we fadeIn navbar
            if ($(this).scrollTop() > 50) {
                DQ.toggleNavbar();
            }
        });
    });
    //handle URL parameters
    var uv = $.getUrlVars();
    if ("s" in uv){ 
      var s = JSON.parse(atob(uv["s"]));
      console.log (s);
      for (var key in s){
        if (key == "timeseriesList") DQ.timeseriesList = s[key];
        else $("#"+key).val(s[key]);
      }
      DQ.loadData();
    }
    if ("k" in uv){
      var k = unescape(uv["k"]);
      DQ.query(k.replace(/\+/g," "));
    }
}

/**
 * Addon to JQuery that reads url parameters into an associative array.
 */

$.extend({
    getUrlVars: function() {
        var vars = [],
            hash;
        var hashes = window.location.href.slice(window.location.href.indexOf('?') + 1).split('&');
        for (var i = 0; i < hashes.length; i++) {
            hash = hashes[i].split('=');
            vars.push(hash[0]);
            vars[hash[0]] = hash[1];
        }
        return vars;
    },
    getUrlVar: function(name) {
        return $.getUrlVars()[name];
    }
});
