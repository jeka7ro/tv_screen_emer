#!/bin/bash
# Descarcă și configurează MongoDB local pentru macOS ARM64. Rulează o singură dată.

set -e
cd "$(dirname "$0")"
mkdir -p .mongodb-local/data .mongodb-local/bin
echo "Descarc MongoDB..."
curl -sL -o .mongodb-local/mongo.tgz "https://fastdl.mongodb.org/osx/mongodb-macos-arm64-8.2.3.tgz"
tar -xzf .mongodb-local/mongo.tgz -C .mongodb-local
DIR=$(find .mongodb-local -maxdepth 1 -type d -name "mongodb-macos-*" | head -1)
cp "$DIR/bin/"* .mongodb-local/bin/
chmod +x .mongodb-local/bin/mongod
rm -rf .mongodb-local/mongo.tgz "$DIR"
echo "MongoDB local instalat în .mongodb-local/"
