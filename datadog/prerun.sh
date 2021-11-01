#!/usr/bin/env bash

# Disable the Datadog Agent based on dyno type
if [ "$DYNOTYPE" == "run" ] ||
   [ "$DYNOTYPE" == "scheduler" ] ||
   [ "$DYNOTYPE" == "release" ] ||
   [[ "$DYNOTYPE" == crontogo* ]];
then
  DISABLE_DATADOG_AGENT="true"
fi
