#!/bin/sh

CURR_DIR=`pwd`
DATA_DIR=${CURR_DIR}/data

if [ ! -d ${DATA_DIR} ]; then
	mkdir ${DATA_DIR}
fi

mongod --dbpath ${DATA_DIR}

