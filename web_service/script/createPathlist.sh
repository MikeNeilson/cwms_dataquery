#!/bin/sh
#
# program: createPathlist.sh
# date   : 03-15-2013
# author : Gunnar Leffler

SOURCE=/usr/dd
OFFICE=common
FN=web_service
FN_SOURCE=$SOURCE/$OFFICE/$FN
SCRIPT_NAME=createPathlist.sh
export OFFICE FN
. $SOURCE/common/lib/dd_functions.sh

#=============================================================================================
# Check if computation is activated (flag file on)
#=============================================================================================
product_status $OFFICE $FN "$SCRIPT_NAME" >/dev/null 2>/dev/null
if [ "$?" -ne "0" ]
then
  echo exit
fi


##########################################################
# Initialize 
##########################################################
LD_LIBRARY_PATH=/usr/cwms/java/jre/lib/sparc:/usr/cwms/lib:/usr/local/lib:/usr/openwin/lib:/usr/lib:/oraclebase/product/11.1_client/lib32:/oraclebase/product/11.1_client/lib32:/usr/local/lib:/usr/local/ssl/lib

ORACLE_HOME=/oraclebase/product/11.1_client

export LD_LIBRARY_PATH
export ORACLE_HOME
mynode=`hostname | cut -c1-3`

###########################################################
# create pathlist file and push to appropriate directories 
###########################################################
cd $FN_SOURCE/script

./createPathlist

#copy pathlist to various locations
cp ../www/pathnames.txt  /usr/dd/common/web_service/www/pathnames.txt
cp ../www/pathnames.txt /usr/dd/common/dbquery/www/pathnames.txt
cp ../www/pathnames.list /usr/dd/common/dbquery/www/pathnames.list
cp ../www/pathnames.txt /usr/dd/common/graph_service/www/pathnames.txt
cp ../www/pathnames.txt /usr/apps/corrections/www/pathnames.txt

#copy stations.json to various locations
cp ../www/stations.json /usr/dd/common/web_service/www/stations.json
cp ../www/stations.json /usr/dd/common/dbquery/www/stations.json
cp ../www/stations.json /usr/dd/common/graph_service/www/stations.json
cp ../www/stations.json /usr/apps/corrections/www/stations.json


