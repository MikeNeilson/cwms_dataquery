#!/bin/bash
set -e
#Enter htdocs directory (document root)
export HTDOCS=/var/www
#Enter internal directory where you want to install
export INT_DIR=/opt/cwms_dataquery
#web product name 
export PRODUCT=query
#######
function make_dir (){
  if [ ! -d "$1" ]; then
    mkdir $1
  fi
}
######
echo "Making directories"
make_dir $HTDOCS/$PRODUCT
make_dir $HTDOCS/$PRODUCT/web_service
make_dir $HTDOCS/$PRODUCT/dataquery
make_dir $INT_DIR
######
echo "copying to internal location"
cp -R web_service $INT_DIR/
cp -R dataquery $INT_DIR/
#####
echo "linking progam into webroot"
ln -s $INT_DIR/web_service/webexec $HTDOCS/$PRODUCT/web_service/webexec
ln -s $INT_DIR/dataquery/webexec $HTDOCS/$PRODUCT/dataquery/webexec
ln -s $INT_DIR/dataquery/www $HTDOCS/$PRODUCT/dataquery/www

