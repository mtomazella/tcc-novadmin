#!/bin/bash
set -e

BASE_DIR="/home/gamaserver/nova/prod"
WEB_DIR="$BASE_DIR/web"
API_DIR="$BASE_DIR/api"

if [ -f "$WEB_DIR/running_a" ]; then
    echo "Starting web A..."
    cd "$WEB_DIR/a"
    docker compose up -d
elif [ -f "$WEB_DIR/running_b" ]; then
    echo "Starting web B..."
    cd "$WEB_DIR/b"
    docker compose up -d
else
    echo "No marker file found in $WEB_DIR"
fi

if [ -f "$API_DIR/running_a" ]; then
    echo "Starting api A..."
    cd "$API_DIR/a"
    docker compose up -d
elif [ -f "$API_DIR/running_b" ]; then
    echo "Starting api B..."
    cd "$API_DIR/b"
    docker compose up -d
else
    echo "No marker file found in $API_DIR"
fi
