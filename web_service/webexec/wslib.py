#!/usr/local/bin/python
#Web Service Database Interface Library
#14 Feb 2012
#Author: Gunnar Leffler
#Updates:
#21 Jun 2012 - Added Timeseries object for presentation layer computations
#17 Nov 2014 - Added configuration file for portablility 

import sys,os,time,datetime,json
import cx_Oracle
import dateutil.parser as dateparser
from copy import deepcopy

class ddWebService:
  def __init__ (self):
    #initialize with Default Configuration
    self.status = "OK"
    self.configuration = self.getDefaultConfiguration()
    #Database Cursors
    self.dbconn = None

  #This method connects to the database
  def connect(self):
    try :
      self.dbconn = cx_Oracle.Connection(user=self.configuration["dbuser"], password=self.configuration["dbpassword"], dsn=self.configuration["dbname"])
      if not self.dbconn :
        self.status = "\nCould not connect to %s\n" % self.configuration["dbname"]
        self.status += "\n%s"
    except Exception,e:
        self.status = "\nCould not connect to %s\n" % self.configuration["dbname"]
        self.status += "\n%s"+str(e)

  #this updates configuration settings from a ddWebSvcConfig object
  def updateConfig(self,config):
    for key in config.settings:
      self.configuration[key] = config.settings[key]
    if self.configuration["dbname"] == "detect":
      self.configuration["dbname"] = self.getDBname()

  #This method disconnects from the database
  def disconnect(self):
    self.dbconn.close()

  #This method sets up the default configuration
  def getDefaultConfiguration (self):
    conf = {}
    conf ["timeFormat"] = "%d-%b-%Y %H%M" #Time format
    conf ["timezone"] = "PST"
    conf ["dbuser"] = ""
    conf ["midnight"] = False
    conf ["dbpassword"] = ""
    conf ["dbname"] = self.getDBname()
    conf ["office"] = "NWDP"
    conf ["defaultUnits"] = {
    "%": "%",
    "airtemp": "F",
    "area": "ft2",
    "area-basin": "mi2",
    "area-impacted": "acre",
    "area-reservoir": "acre",
    "area-surface": "acre",
    "ati-cold": "degF-day",
    "ati-melt": "degF-day",
    "code": "n/a",
    "coeff": "n/a",
    "cold content": "in",
    "conc": "ppm",
    "conc-salinity": "g/l",
    "cond": "umho/cm",
    "count": "unit",
    "currency": "$",
    "density": "lbs/ft3",
    "depth": "ft",
    "depth-swe": "in",
    "dir": "deg",
    "dist": "mi",
    "elev": "ft",
    "energy": "MWh",
    "evap": "in",
    "evaprate": "in/day",
    "fish": "unit",
    "flow": "kcfs",
    "frost": "in",
    "growthrate": "in/day",
    "head": "ft",
    "interception": "in",
    "irrad": "langley/min",
    "liquid water": "in",
    "lwass": "in",
    "opening": "ft",
    "ph": "su",
    "power": "MW",
    "precip": "in",
    "pres": "mm-hg",
    "rad": "langley",
    "ratio": "n/a",
    "speed": "mph",
    "spinrate": "rpm",
    "stage": "ft",
    "stor": "kaf",
    "swe": "in",
    "temp": "F",
    "thick": "in",
    "timing": "sec",
    "travel": "mi",
    "turb": "jtu",
    "turbf": "fnu",
    "turbj": "jtu",
    "turbn": "ntu",
    "volt": "volt",
    "volume": "kaf"
    }
    return conf

  #Determine which database to connect to
  #Currently this determines the local DB based on the domain name
  #TODO: Add functionality to fail over to another database
  def getDBname (self):
    return os.uname()[1].upper()[0:3] #determine which database to connect to

  #takes a pathname data dictionary compliant pathname and returns default units
  def getDefaultUnits (self,tsid):
    try:
      tsid = tsid.lower()
      tokens = tsid.split(".")
      #check to see if full Parameter is in default units and return
      param = tokens[1]
      if param in self.configuration["defaultUnits"]:
        return self.configuration["defaultUnits"][param]
      #check to see if parameter is in default units and return
      param = tokens[1].split("-")[0]
      if param in self.configuration["defaultUnits"]:
        return self.configuration["defaultUnits"][param]
    except:
      pass
    #Default to database default
    return ""

  #A roll your own strftime implementation that allows dates before 1900
  #Based on the matplotlib version
  def strftime(self, dt, fmt, usemidnight = False):

    def _findall(text, substr):
      # Also finds overlaps
      sites = []
      i = 0
      while 1:
        j = text.find(substr, i)
        if j == -1:
          break
        sites.append(j)
        i=j+1
      return sites
    #fmt = self.illegal_s.sub(r"\1", fmt)
    domidnight = False
    if dt.hour == 0 and dt.minute == 0 and usemidnight != False:
      domidnight = True
    fmt = fmt.replace("%s", "s")
    if dt.year > 1900:
      if domidnight == True:
        dt2 = dt - datetime.timedelta(days=1)
        return dt2.strftime(fmt).replace("00:00","24:00").replace("0000","2400")
      return dt.strftime(fmt)
    year = dt.year
    # For every non-leap year century, advance by
    # 6 years to get into the 28-year repeat cycle
    delta = 2000 - year
    off = 6*(delta // 100 + delta // 400)
    year = year + off

    # Move to around the year 2000
    year = year + ((2000 - year)//28)*28
    timetuple = dt.timetuple()
    s1 = time.strftime(fmt, (year,) + timetuple[1:])
    sites1 = _findall(s1, str(year))

    s2 = time.strftime(fmt, (year+28,) + timetuple[1:])
    sites2 = _findall(s2, str(year+28))

    sites = []
    for site in sites1:
      if site in sites2:
        sites.append(site)
    s = s1
    syear = "%4d" % (dt.year,)
    for site in sites:
      s = s[:site] + syear + s[site+4:]
    return s

  #Reads a time series from the database#
  #tsid       - string
  #start_time - datetime
  #end_time   - datetime
  #in_units   - string
  def readTS (self, tsid, start_time, end_time, units):
    timefmt = self.configuration["timeFormat"]
    timezone = self.configuration["timezone"]
    office = self.configuration["office"]
    try:
      crsr = self.dbconn.cursor()
      # retrieve the time series data #
      ts_cur = self.dbconn.cursor()
      if units.lower() == "default":
        units = self.getDefaultUnits(tsid)
      crsr.execute('''
          begin
          cwms_ts.retrieve_ts(
                P_AT_TSV_RC =>:ts_cur,
                P_CWMS_TS_ID =>:tsid,
                P_UNITS =>:units,
                P_START_TIME =>to_date(:start_time, 'dd-mon-yyyy hh24mi'),
                P_END_TIME =>to_date(:end_time,   'dd-mon-yyyy hh24mi'),
                P_TIME_ZONE =>:timezone,
                P_OFFICE_ID =>:office);
          end;''', [ts_cur, tsid, units, self.strftime(start_time,timefmt), self.strftime(end_time,timefmt), timezone, office])
      records = ts_cur.fetchall()
      ts_cur.close()
      crsr.close()
    except Exception, e:
      self.status = "\nCould not retrieve "+tsid
      self.status += "\n%s" % str(e)
      return[]
    return records

#==========================================================
  def readTSJSON (self, tsid, start_time, end_time, units):
    timefmt = self.configuration["timeFormat"]
    timezone = self.configuration["timeZone"]
    office = self.configuration["office"]
    try:
      crsr = self.dbconn.cursor()
      # retrieve the time series data #
      ts_cur = self.dbconn.cursor()
      if units.lower() == "default":
        units = self.getDefaultUnits(tsid)
      crsr.execute('''
          begin
          cwms_ts.retrieve_ts(
                P_AT_TSV_RC =>:ts_cur,
                P_CWMS_TS_ID =>:tsid,
                P_UNITS =>:units,
                P_START_TIME =>to_date(:start_time, 'dd-mon-yyyy hh24mi'),
                P_END_TIME =>to_date(:end_time,   'dd-mon-yyyy hh24mi'),
                P_TIME_ZONE =>:timezone,
                P_OFFICE_ID =>:office);
          end;''', [ts_cur, tsid, units, self.strftime(start_time,timefmt), self.strftime(end_time,timefmt), timezone, office])
      # records = ts_cur.fetchall()

      records = [ dict(line) for line in [zip([ column[0] for column in ts_cur.description], row) for row in ts_cur.fetchall()] ]

      ts_cur.close()
      crsr.close()
    except Exception, e:
      self.status = "\nCould not retrieve "+tsid
      self.status += "\n%s" % str(e)
      return[]
    return records
#==========================================================


class ddWebServiceConfig:
  def __init__ (self):
    #initialize with Default Configuration
    self.status = "OK"
    self.settings = self.getDefaultSettings()
    self.units = {}
 
  def __getitem__ (self,key):
    if key in self.settings: return self.settings[key]
    return None

  #This method sets up the default configuration
  def getDefaultSettings (self):
    conf = {}
    #initialize time parameters
    conf ["timeformat"] = "%d-%b-%Y %H%M" #Time format
    conf ["timezone"] = "PST"
    conf ["lookback"] = "7"
    conf ["midnight"] = False
    conf ["lookforward"] = "0"
    conf ["delimiter"] = "|"
    conf ["id"]= []
    conf ["end"] = datetime.datetime.now()+datetime.timedelta(days=int(conf["lookforward"]))
    conf ["start"] = datetime.datetime.now()-datetime.timedelta(days=int(conf["lookback"]))
    return conf

  def loadConfig (self,path):
    conf = json.loads(open(path,"r").read())
    for key in conf:
      self.settings[key] = conf[key]
    if "defaultUnits" in self.settings:
      self.units = conf["defaultUnits"]
      if "default" in self.settings["defaultUnits"]:
        self.settings["defaultUnits"] = self.settings["defaultUnits"]["default"]

  #This method parses passed CGI parameters
  def parseParameters (self, params):
    def parseTime (val):
      ts = timeSeries()
      try:
        return datetime.timedelta(days=int(val))
      except:
        return ts.parseTimedelta(val)
      return datetime.timedelta(days=7)

    p = {}
    #lowercase dictionary keys
    for key in params:
      p[key.lower()] = params[key]
    if "timeformat" in p:
      self.settings ["timeformat"] = p["timeformat"].value
    if "delimiter" in p:
      self.settings ["delimiter"] = p["delimiter"].value
    if "lookback" in p:
      self.settings ["lookback"] = p["lookback"].value
      self.settings ["start"] = datetime.datetime.now()-parseTime(p["lookback"].value)
    if "backward" in p:
      self.settings ["backward"] = p["backward"].value
      self.settings ["start"] = datetime.datetime.now()-parseTime(p["backward"].value)
    if "lookforward" in p:
      self.settings ["lookforward"] = p["lookforward"].value
      self.settings ["end"] = datetime.datetime.now()+parseTime(p["lookforward"].value)
    if "forward" in p:
      self.settings ["forward"] = p["forward"].value
      self.settings ["end"] = datetime.datetime.now()+parseTime(p["forward"].value)
    if "end" in p:
      self.settings ["end"] = dateparser.parse(p["end"].value,fuzzy=True)
    if "start" in p:
      self.settings ["start"] = dateparser.parse(p["start"].value,fuzzy=True)
    if "enddate" in p:
      self.settings ["end"] = dateparser.parse(p["enddate"].value,fuzzy=True)
    if "startdate" in p:
      self.settings ["start"] = dateparser.parse(p["startdate"].value,fuzzy=True)
    if "id" in p:
      self.settings ["id"] = self.parseId(p["id"].value,self.settings["delimiter"])
    if "timezone" in p:
      self.settings ["timezone"] = p["timezone"].value
    if "snap" in p:
      self.settings ["snap"] = p["snap"].value
    if "hardsnap" in p:
      self.settings ["hardsnap"] = p["hardsnap"].value
    if "timeshift" in p:
      self.settings ["timeshift"] = p["timeshift"].value
    if "systdgfilter" in p:
      self.settings ["systdgfilter"] = p["systdgfilter"].value
    if "interpolate" in p:
      self.settings ["interpolate"] = p["interpolate"].value
    if "average" in p:
      self.settings ["average"] = p["average"].value
    if "maximum" in p:
      self.settings ["maximum"] = p["maximum"].value
    if "minimum" in p:
      self.settings ["minimum"] = p["minimum"].value
    if "filename" in p:
      self.settings ["filename"] = p["filename"].value
    if "midnight" in p:
      self.settings ["midnight"] = p["midnight"].value
    else:
      self.settings ["midnight"] = False

  #Parses ID string, returns a list of [tsid,units]
  def parseId (self,idStr,delimiter):
    output = []
    tokens = idStr.split(delimiter)
    for token in tokens:
      ts = token.split(":")
      if len(ts) > 1:
        output.append([ts[0],ts[1].split("=")[-1]])
      else:
        output.append([ts[0],"default"])
    return output


class timeSeries:
  #"overloaded" timeSeries constructor
  def __init__ (self, data = None):
    self.status = "OK"
    #Data is an array of arrays with the following structure [datetime,float value, float quality]
    self.data = []
    if data != None:
      #set internal data memebr to data and filter out blanks
      for line in data:
        if line != []:
          if line[1] != None:
            self.data.append(line)

  #Equivalent to toString()
  def __str__ (self):
    output = ""
    for line in self.data:
      try:
        output += "%s\t%.2f\t%.2f\n" % (line[0].strftime("%d-%b-%Y %H%M"),line[1],line[2])
      except:
        output += "%s\t\t\n" % line[0].strftime("%d-%b-%Y %H%M")
    return output

  #gets status message of object and resets it to "OK"
  def getStatus(self):
    s = self.status
    self.status = "OK"
    return s

  def insert (self, datestamp, value, quality=0):
    '''Inserts a timestamp, value and quality into the timseries.
       this module assumes that datetimes are in acending order, as such please use this method when adding data'''
    l = len(self.data)
    #print datestamp
    if l == 0:
      self.data.append([datestamp, value, quality])
      return
    if datestamp > self.data[-1][0]:
      self.data.append([datestamp, value, quality])
      return
    for i in xrange(l):
      if datestamp == self.data[i][0]:
        self.data[i] = [datestamp, value, quality]
        return
      elif datestamp < self.data[i][0]:
        self.data.insert(i,[datestamp, value, quality])
        return
    self.data.append([datestamp, value, quality])

  #returns a valuea at a given timestamp
  #returns None type if not found
  def findValue(self,timestamp):
    for line in self.data:
      if line[0] == timestamp:
        return line [1]
    return None

  #interpolate values
  def interpolateValue(self, x0, y0, x1, y1, x):
    m = (y1 - y0) / (x1 - x0)
    output = y0 + (x - x0) * m
    return output

  #interpolates timeseries based on a given interval of type timedelta
  #returns a timeseries object
  def interpolate(self,interval):
    _data = []
    try:
      for i in xrange(0,len(self.data)-1):
        startTime = self.data[i][0]
        deltaT = (self.data[i+1][0] - startTime)
        steps = int(deltaT.total_seconds()/interval.total_seconds())
        quality = self.data[i][2]
        for j in xrange(0,steps):
          value = self.interpolateValue(0,self.data[i][1],deltaT.total_seconds(),self.data[i+1][1],j*interval.total_seconds())
          _data.append([startTime+(interval*j),value,quality])
    except Exception,e:
      self.status = str(e)
    return timeSeries(_data)

  #averages timeseries based on a given interval of type timedelta
  #returns a timeseries object
  def average(self,interval):
    _data = []
    if self.data == []:
      return timeSeries()
    try:
      i = 0
      count = len(self.data)
      endTime = self.data[i][0]
      while i < count:
        startTime = endTime
        endTime = startTime + interval
        quality = self.data[i][2]
        n = 0
        sum = 0
        while self.data[i][0] < endTime:
          sum += self.data[i][1]
          n += 1
          i += 1
          if i >= count:
            break
        if n != 0:
          _data.append([endTime,sum/n,quality])
    except Exception,e:
      self.status = str(e)
    return timeSeries(_data)

  #averages timeseries based on a given interval of type timedelta
  #returns a timeseries object
  def rollingaverage(self,interval):
    _data = []
    if self.data == []:
      return timeSeries()
    try:
      i = 0
      count = len(self.data)
      while i < count:
        startTime = self.data[i][0]
        endTime = startTime + interval
        if endTime > self.data[-1][0]:
          break
        quality = self.data[i][2]
        n = 0
        sum = 0
        while self.data[i+n][0] <= endTime:
          sum += self.data[i+n][1]
          n += 1
          if i+n >= count:
            break
        if n != 0:
          _data.append([endTime,sum/n,quality])
        i+=1
    except Exception,e:
      self.status = str(e)
    return timeSeries(_data)


  #Calculates the percentage of two timeseries
  #numerator : self
  #denominator : denom
  #returns a timeseries object of percentages
  def percent(self,denom):
    _data = []
    denom_data = {}
    try:
      #turn denominator data into a dictionary and filter out zeros (no division by 0 allowed!)
      for line in denom.data:
        if line[1] != 0:
          denom_data[line[0]] = line
      for line in self.data:
        key = line[0]
        if key in denom_data:
          _data.append([line[0],100*float(line[1]/denom_data[key][1]),line[2]])
    except Exception,e:
      self.status = str(e)
      return timeSeries()
    return timeSeries(_data)

  #Shifts each timestamp a given time interval
  #tdelta: timedelta to shift
  #returns a timeseries object
  def timeshift(self,tdelta):
    _data = []
    if self.data == []:
      return timeSeries()
    try:
      for line in self.data:
        _data.append([line[0]+tdelta,line[1],line[2]])
    except Exception,e:
      self.status = str(e)
      print e
      return timeSeries()
    return timeSeries(_data)

  def findClosestIndex(self, key):
    '''  returns the index of a given timestamp
    returns closest index if not found'''
    imin = 0
    imax = len(self.data) -1
    while (imax > imin):
      imid = imin + ((imax - imin) / 2)
      if(self.data[imid][0] == key):
        return imid
      elif (self.data[imid][0] < key):
        imin = imid + 1 #change min index to search upper subarray
      else:
        imax = imid - 1; #change max index to search lower subarray
    return imid # Key not found

  def snap2(self,interval,buffer,starttime = None):
    ''' Snaps a timeseries
        interval: interval at which time series is snapped
        buffer : lookahead and lookback
        returns a snapped timeseries '''
    _data = []
    if self.data == []:
      return timeSeries()
    try:
      if buffer > interval/2:
        buffer = interval/2
      #setup the initial start time
      endtime = self.data[-1][0]+buffer
      if starttime != None:
        t = starttime
      else:
        t = self.data[0][0]
      pos = 0
      while t <= endtime:
        tlist = []
        pos = self.findClosestIndex(t)
        if self.data[pos][0] >= t-buffer and self.data[pos][0] <= t+buffer:
          a = pos -2
          b = pos +2
          if a < 0: a = 0
          if b > len(self.data)-1:b=len(self.data)-1
          tlist = self.data[a:b]
        if len (tlist) > 0:
          tline = tlist[0]
          for line in tlist:
            curdiff = abs(tline[0] - t).seconds
            newdiff = abs(line[0] - t).seconds
            if (curdiff > newdiff):
              tline = line
          _data.append([t,tline[1],tline[2]])
        t += interval
    except Exception,e:
      self.status = str(e)
      return timeSeries()
    return timeSeries(_data)


  def snap(self,interval,buffer,starttime = None):
    ''' Snaps a timeseries (old slow version)
        interval: interval at which time series is snapped
        buffer : lookahead and lookback
        returns a snapped timeseries '''
    _data = []
    if self.data == []:
      return timeSeries()
    try:
      if buffer > interval/2:
        buffer = interval/2
      #setup the initial start time
      endtime = self.data[-1][0]
      if starttime != None:
        t = starttime
      else:
        t = self.data[0][0]
      while t <= endtime:
        tlist = []
        for line in self.data:
          if line[0] >= t - buffer:
            if line[0] <= t+ buffer:
              tlist.append(line)
            else:
              break
        if len(tlist) > 0:
          tline = tlist[0]
          for line in tlist:
            curdiff = abs(tline[0] - t).seconds
            newdiff = abs(line[0] - t).seconds
            if (curdiff > newdiff):
              tline = line
          _data.append([t,tline[1],tline[2]])
        t += interval
    except Exception,e:
      self.status = str(e)
      return timeSeries()
    return timeSeries(_data)


  #Performs an operation on self
  #op: lambda function to perform eg lambda x,y: x+y
  #operand: could be a timeseries or a float
  #returns a timeseries object
  def operation(self,op,operand):
    _data = []
    if self.data == []:
      return timeSeries()
    try:
      if type (operand) is float:
        for line in self.data:
          _data.append([line[0],op(line[1],operand),line[2]])
      else:
        for line in self.data:
          val = operand.findValue(line[0])
          if val != None:
            _data.append([line[0],op(line[1],val),line[2]])
    except Exception,e:
      self.status = str(e)
      print e
      return timeSeries()
    return timeSeries(_data)

  #returns a max or a min based for a given interval
  #basse
  #returns a timeseries object
  def maxmin(self,interval,cmp):
    _data = []
    if self.data == []:
      return timeSeries()
    try:
      i = 0
      count = len(self.data)
      endTime = self.data[i][0]
      while i < count:
        startTime = endTime
        endTime = startTime + interval
        quality = self.data[i][2]
        probe = self.data[i][1]
        while self.data[i][0] < endTime:
          if cmp (self.data[i][1],probe):
            probe = self.data[i][1]
          i += 1
          if i >= count:
            break
        _data.append([endTime,probe,quality])
    except Exception,e:
      self.status = str(e)
    return timeSeries(_data)

  #This takes a relative time and turns it into a timedelta
  #eg input 7d6h9m
  def parseTimedelta (self, input):
    input = input.lower()
    output = datetime.timedelta(seconds = 0)
    t = ""
    try:
      for c in input:
        if c =="Y":
          output += datetime.timedelta(days=float(t)*365)
          t = ""
        elif c =="w":
          output += datetime.timedelta(days=float(t)*7)
          t = ""
        elif c =="d":
          output += datetime.timedelta(days=float(t))
          days = 0
          t = ""
        elif c =="h":
          output += datetime.timedelta(hours=float(t))
          t = ""
        elif c =="m":
          output += datetime.timedelta(minutes=float(t))
          t = ""
        else:
          if c != " ":
            t += c
    except:
      self.status = "Could not parse"+input+" into a time interval"
    return output



