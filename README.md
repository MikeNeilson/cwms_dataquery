## Overview

CWMS Dataquery is a Single Page Application (SPA) intended to view, plot and extract hydromet data from a CWMS database.

[Working Example](http://www.nwd-wc.usace.army.mil/dd/common/dataquery/www/)

## Motivation

A short description of the motivation behind the creation and maintenance of the project. This should explain **why** the project exists.

## Installation

Running "install.sh" will install dataquery and the webservices it's built on into the directory specified by $INT_DIR. It will also link into the directory tree specified by $HTDOCS. The $HTDOCS should be where web documents are served out. This configuration allows for config files with sensitive information to be stored safely elsewhere on the file system.
__Step 1__

edit and run install.sh 

You can affect the behavior of the install script by editing the following variables:

```
#Enter htdocs directory (document root)
export HTDOCS=/var/www
#Enter internal directory where you want to install
export INT_DIR=/opt/cwms_dataquery
#web product name
export PRODUCT=query
```

__Step 2__

edit the `web_service/config/config.json` file. Enter the username and Database information.

We recommend using a read only user.

## Testing

This product has been tested on posix compliant hosts that have network access to a CWMS instance.

## Contributors

NWD RWCDS development team.

You (hopefully) - If you make any improvements, by all means initiate a pull request.

## License

Public Domain

