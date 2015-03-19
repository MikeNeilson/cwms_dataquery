#!/usr/local/bin/python
#hydro_lib hydroJSON webservice library
#Internal version of hydrolib which points to CWMS
#5 Mar 2015
#Please annotate changes in changelog.md

import sys,os,time,datetime,json,atexit,wslib, hashlib
from copy import deepcopy

defaultUnits =   {}

#---------------------------------------------------------------
#Schema Definition in SQLITE3 database
#---------------------------------------------------------------

#Schema definition  mapping from pisces schema to the results of CWMS Location view in sqlite3 database
schemas =  {"seriescatalog": [["name","Cwms_Ts_Id"],
 ["siteid","Location_Id"],
 ["timeinterval","Interval_Id"],
 ["parameter","Base_Parameter_Id"],
 ["duration","Duration_Id"],
 ["tablename","CWMS_TS_ID"],
 ["provider","DB_Office_Id"],
 ["enabled","Ts_Active_Flag"]],
 "seriesproperties": ["id","seriesid","name", "value"],
 "sitecatalog":[["siteid","Location_Id"],
  ["description","Public_Name"],
  ["state","State_Initial"],
  ["latitude","Latitude"],
  ["longitude","Longitude"],
  ["elevation","Elevation"],
  ["timezone", "Time_Zone_Name"],
  ["horizontal_datum","Horizontal_Datum"],
  ["vertical_datum","Vertical_Datum"],
  ["active_flag","Loc_Active_Flag"],
  ["responsibility","Bounding_Office_Id"]]
}


#---------------------------------------------------------------
#Site metadata 
#---------------------------------------------------------------
site_template =  {
  "name": "",
  "responsibility": "",
  "coordinates": {
    "latitude": 0.0,
    "longitude": 0.0,
    "datum": ""
  },
  "HUC": "",
  "elevation": {
    "value": 0.0,
    "accuracy": 0.0,
    "datum": "string",
    "method": "string (full explanation)"
  },
  "timezone": "US/Pacific",
  "tz_offset": "-08:00", 
  "time_format": "%Y-%m-%dT%H:%M:%S%z",
  "active_flag": "T",
  "location_type": "",
  "timeseries": {}
}

def new_site(s, time_format = "%Y-%m-%dT%H:%M:%S%z"):
  '''This method fills out a site template
     input: rec object mapped to the sitecatalog table in the sqlite3 database
            time_format = strftime for ISO 8601
     output: nested dictionary
  '''
  def conv (s):
    try:
      return float(s)
    except:
      return 0.0
  output = deepcopy(site_template)
  output ["name"] = s["description"]
  output ["responsibility"] = s["responsibility"]
  output ["coordinates"]["latitude"] = conv(s["latitude"])
  output ["coordinates"]["longitude"] = conv(s["longitude"])
  output ["coordinates"]["datum"] =  s["horizontal_datum"]
  output ["elevation"]["value"] = conv(s["elevation"])
  output ["elevation"]["accuracy"] = conv(s["vertical_accuracy"])
  output ["elevation"]["datum"] = s["vertical_datum"]
  output ["elevation"]["method"] = s["elevation_method"]
  output ["timezone"] = s["timezone"]
  output ["tz_offset"] = s["tz_offset"]
  output ["time_format"] = time_format
  output ["active_flag"] = s["active_flag"]
  output ["location_type"] = s["type"]
  return output 
    

#--------------------------------------------------------------
#Template for timeseries data and metadata
#---------------------------------------------------------------

timeseries_template = {
  "values": [],
  "site_quality": [],
  "hash": "string md5", #hash of the timeseries, optional
  "quality_type": "string",
  "parameter": "",
  "duration": "", #interval over which the duration applies
  "interval": "", #nominal frequency
  "units": "",
  "count": 0, #count of values in the timeseries
  "min_value": 0.0, #a timeslice e.g. [timestamp,value]
  "max_value": 0.0, #a timeslice e.g. [timestamp,value]
  "start_timestamp": "",
  "end_timestamp":"" 
}

def new_timeseries(s, ts, conf = {}, dFamily = None ):
  '''This method fills out a site template
     input: s - rec object mapped to the seriescatalog table in the sqlite3 database
            ts - timeSeries Object   
            time_format = strftime for ISO 8601
     output: nested dictionary
  '''
  def conv (s):
    try:
      return float(s)
    except:
      return 0.0
  if len (ts.data) == 0:
    return {}
  output = deepcopy(timeseries_template)
  time_format = "%Y-%m-%dT%H:%M:%S%z"
  if "time_format" in conf:
    time_format = conf["time_format"]
  if "tz_offset" in conf:
    if conf["tz_offset"] != 0: ts = ts.timeshift(datetime.timedelta(hours=conf["tz_offset"]))
  _max = ts.data[0][1]
  _min = ts.data[0][1] 
  for slice in ts.data:
    output ["values"].append([slice[0].strftime(time_format),slice[1],slice[2]])
    if slice[1] > _max: _max = slice[1]
    if slice[1] < _min: _min = slice[1]
  output ["site_quality"] = []
  output ["sigfig"] = 3
  output ["hash"] = "TODO"
  output ["quality_type"] = "int"
  output ["parameter"] = s["parameter"]
  output ["active_flag"] = s["enabled"]
  output ["duration"] = s["duration"]
  output ["interval"] = s["interval"]
  if s["units"] == "":
    output["units"] = getDefaultUnits(s["name"],dFamily)
  else:
    output ["units"] = s["units"]
  output ["count"] = len (ts.data)
  output ["min_value"] = _min
  output ["max_value"] = _max
  output ["start_timestamp"] = output["values"][0][0]
  output ["end_timestamp"] = output["values"][-1][0]
  return output 


#--------------------------------------------------------------
#Timeseries storage
#---------------------------------------------------------------
def readTS (tsid, start_time =None, end_time=None,units="default"):
  """Reads a time series from the database
     tsid - string
     start_time - datetime
     end_time - datetime
  """
  ts = timeSeries()
  try:
    rows = ws.readTS(tsid,start_time,end_time,units) 
    for row in rows:
      if row[1] != None: ts.data.append(row)
  except Exception,e:
      status = "\nCould not read %s\n" % tsid
      status += "\n%s"+str(e)
  return ts

def writeTS (tsid,ts, replace_table = False):
  """Writes a time series from the database
     tsid - string
     replace_table - overwrites table (
     3/15/2015 - stubbed off, read only for now
  """
  return None


def makeTablename (_tsid):
  """Makes a tablename from supplied pathname"
  """
  return"TS_"+hashlib.sha1(_tsid).hexdigest().upper()



#--------------------------------------------------------------------
#Wrapper around generic ORM object to seamlessly interface with CWMS.
#--------------------------------------------------------------------

class rec: 
  def __init__ (self, d, table = "", keys = []):
    self.tablealias={"sitecatalog":"Cwms_V_Loc",
    "seriescatalog":"Cwms_V_Ts_Id2"
    } 
    self.cwms2pisces = {}
    self.pisces2cwms = {}
    self.table = table
    self.keys = keys
    for k in keys:
      self.cwms2pisces[k[1]] = k[0]
      self.pisces2cwms[k[0]] = k[1]
    self.r = rec2(d,self.tablealias[table],self.cwms2pisces.keys())

  def __getitem__ (self,key):
    try:
      return self.r[self.pisces2cwms[key]]
    except:
      return ""

  def __setitem__ (self,key,value):
    self.r[self.pisces2cwms[key]] = value

  def wrap (self,r1):
    r2 = rec([],self.table,self.keys)
    r2.r = r1
    return r2
 
  def get (self,cursor,key, value): #get one from the DB where key matches value
    return self.wrap(self.r.get(cursor,self.pisces2cwms[key], value))

  def get_many (self, cursor, key, value):
    tmp = self.r.get_many (cursor,self.pisces2cwms[key], value)
    for key in tmp:
      output[key] = self.wrap(tmp[key])
    return output

  def search (self,cursor,key, value): #
    output = {}
    tmp = self.r.search (cursor,self.pisces2cwms[key], value)
    for key in tmp:
      output[key] = self.wrap(tmp[key])
    return output
    
  def toJSON (self):
    foreign = self.r.toJSON()
    output = {}
    #map to how we expect
    for key in foreign:
      if key in self.cwms2pisces:
        output [self.cwms2pisces[key]] = foreign[key]
    return output

  def store (self, cursor): #writes self to DB
    return None

  def delete (self, cursor, key,value):
    return None

#---------------------------------------------------------------
#Generic database record object that can map to any table.
# Basically a dependency free ORM.
#---------------------------------------------------------------

class rec2:
  def __init__ (self, d, table = "", keys = []):
    self.keys = keys
    self.data =  {}
    self.table = table
    for k in self.keys: # initialize data
      self.data[k] = ""
    if type (d) == dict:
      for k in self.keys:
        if k in d: self.data[k] = d[k]
    elif type (d) == list or type (d) == tuple:
      i = 0
      while i < len(d) and i < len (self.keys):
        self.data[self.keys[i]] = d[i]
        i+= 1

  def __getitem__ (self,key):
    return self.data.get(key, " ")

  def __setitem__ (self,key,value):
    self.data[key] = value

  def tableColumns(self): #makes table columns
    return ", ".join(self.keys)

  def placeHolders (self):
    return "("+", ".join("?"*len(self.keys))+")"

  def get (self,cursor,key, value): #get one from the DB where key matches value
    q = (value,)
    cursor.execute("select "+self.tableColumns()+" from "+self.table+" where "+key+" = '"+value+"'")
    rows = cursor.fetchone()
    return rec2(rows, table = self.table, keys = self.keys )

  def get_many (self, cursor, key, value):
    q = (value,)
    cursor.execute("select "+self.tableColumns()+" from "+self.table+" where UPPER("+key+") like UPPER('"+value+")'")
    rows = cursor.fetchall()
    output = {}
    for line in rows:
      t = rec2(line, table = self.table, keys = self.keys )
      output [t[key]] = t
    return output

  def search (self,cursor,key, value): #
    '''returns a dict of objects from the DB where key is like value, Empty dict if not found'''
    cursor.execute("select "+self.tableColumns()+" from "+self.table+" where UPPER("+key+") like UPPER('"+value+"')")
    rows = cursor.fetchall()
    output = {}
    for row in rows:
      output[row[self.keys.index(key)]] = rec2(row, table = self.table, keys = self.keys)
    return output

  def toList (self):
    output = []
    for k in self.keys: output.append(self.data[k])
    return output

  def toJSON (self):
    return json.dumps(self.data)

  def store (self, cursor): #writes self to DB
    cursor.execute ("insert or replace into "+self.table+" ("+self.tableColumns()+") values "+self.placeHolders(),self.toList())

  def delete (self, cursor, key,value):
    q = (value,)
    cursor.execute("delete from "+self.table+" where "+key+" = ?",q)

def getDefaultUnits (tsid,dFamily):
  '''
  This method returns default display units for a given pathname.
  input:
    tsid - CWMS pathname
    dFamily - Class of display units, defaults
  '''
  if not dFamily in defaultUnits:
    dFamily = "default"
  try:
    tsid = tsid.lower()
    tokens = tsid.split(".")
    #check to see if full Parameter is in default units and return
    param = tokens[1]
    if param in defaultUnits[dFamily]:
      return defaultUnits[dFamily][param]
    #check to see if parameter is in default units and return
    param = tokens[1].split("-")[0]
    if param in defaultUnits[dFamily]:
      return defaultUnits[dFamily][param]
  except:
    print defaultUnits
    pass
  #Default to database default
  return ""



def connect():
  global dbconn
  global cur
  global defaultUnits
  global status
  try :
    config.loadConfig("../config/config.json")
    ws.updateConfig(config)
    defaultUnits = config.units
    ws.connect()
    dbconn = ws.dbconn
    cur = dbconn.cursor()
    if not dbconn :
      status = "\nCould not connect to database\n" 
      status += "\n%s"
  except Exception,e:
    status = "\nCould not connect to \n"
    status += "\n%s"+str(e)
  
#---setup database connection
ws = wslib.ddWebService()
config = wslib.ddWebServiceConfig()
timeSeries = wslib.timeSeries

dbconn = None
cur = None
status = "OK"
connect()
