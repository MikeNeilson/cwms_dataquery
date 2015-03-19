#!/usr/local/bin/python
#Web Service Wrapper for graphing service
#20 Jun 2011
#Author: Gunnar Leffler

import sys,os,time,datetime
import cx_Oracle
sys.path.append("/usr/dd/common/web_service/webexec")
import cgi,wslib,atexit
import cgitb;cgitb.enable()

ws = wslib.ddWebService()
config = wslib.ddWebServiceConfig()

def getData (tsid, start_time, end_time, in_units):
  return ws.readTS (tsid, start_time, end_time, in_units)

def readTS (tsid, start_time, end_time, in_units):
  vals= ws.readTS (tsid, start_time, end_time, in_units)
  i = 0
  while i < len(vals):
    if vals[i][1] == None:
      vals.pop(i)
    else:
      i += 1
  if ws.status != "OK":
    raise Exception(ws.status)
  return vals
  
def readTSJSON (tsid, start_time, end_time, in_units):
  val= ws.readTSJSON (tsid, start_time, end_time, in_units)
  if ws.status != "OK":
    raise Exception(ws.status)
  return val
  
config.loadConfig("../config/config.json")
ws.updateConfig(config)
ws.connect()
if ws.status != "OK":
  raise Exception(ws.status)
atexit.register(ws.disconnect)
