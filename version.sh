#!/bin/sh

cat package.json | jq .version | tr -d '\"'
