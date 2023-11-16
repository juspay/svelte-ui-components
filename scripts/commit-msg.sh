#!/usr/bin/env bash

set -e

# Adding commit linter. Validates commit messges are according to format.
# Runs when commit message is created.
# TODO: need to verify
BRANCH_NAME=$(git branch | grep '*' | sed 's/* //')

if [[ $BRANCH_NAME != *"no branch"* ]]; then
  npx --no -- commitlint --edit "${1}"
fi

finish() {
  result=$?
  # Add cleanup code here
  exit ${result}
}
trap finish EXIT ERR