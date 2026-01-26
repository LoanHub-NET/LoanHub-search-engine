#!/bin/sh
set -e

: "${API_UPSTREAM:=http://api:8080}"

envsubst '$API_UPSTREAM' \
  < /etc/nginx/templates/default.conf.template \
  > /etc/nginx/conf.d/default.conf
