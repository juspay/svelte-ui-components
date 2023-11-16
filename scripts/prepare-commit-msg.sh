#!/bin/bash

# Adding hooks to prepare commit message.
# This hook triggers Jira input modules.
# Helps in maintaining code compatblity.

echo "Evaluating for trailing spaces"

find . -type f -name '.DS_Store' -exec rm {} +

BRANCH_NAME=$(git branch | grep '*' | sed 's/* //')

if [[ $BRANCH_NAME != *"no branch"* ]] && [[ $COMMIT_MODE != "amend" ]]; then
  exec < /dev/tty && node_modules/.bin/git-cz --hook || true
fi
