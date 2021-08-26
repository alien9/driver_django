#!/bin/sh

set -e

# Perform all actions as $POSTGRES_USER
export PGUSER="$POSTGRES_USER"

# https://pgtune.leopard.in.ua/
# DB Version: 11
# OS Type: linux
# DB Type: web
# Total Memory (RAM): 4 GB
# CPUs num: 2
# Connections num: 150
# Data Storage: ssd
psql -c "CREATE EXTENSION HSTORE; CREATE EXTENSION POSTGIS;CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"
#psql -f /docker-entrypoint-initdb.d/spots.sql
