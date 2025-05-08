#!/bin/bash

KEY_FILE=./ssl/studio-app.snapchat.com.key
CRT_FILE=./ssl/studio-app.snapchat.com.crt

if [[ ! -f "$KEY_FILE" || ! -f "$CRT_FILE" ]]; then
   openssl req -x509 -nodes -days 3650 \
      -subj "/C=CA/ST=QC/O=Snap Inc./CN=studio-app.snapchat.com" \
      -addext "subjectAltName=DNS:*.snapchat.com" \
      -newkey rsa:2048 -keyout "$KEY_FILE" -out "$CRT_FILE"
else
   echo "SSL certificate already exists."
fi
