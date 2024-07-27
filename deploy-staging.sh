#!/bin/sh

docker stack deploy -c base.yml -c staging.yml -c env.yml flfirst-site --with-registry-auth --detach=false
