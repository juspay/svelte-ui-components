#!/usr/bin/env bash


set -e

# Running check and validate scripts in commits.
# Validates Typescript compilation, fomating, linting
# test cases and attempts prod build.
BRANCH_NAME=$(git branch | grep '*' | sed 's/* //')

if [[ $BRANCH_NAME != *"no branch"* ]]; then
  npm run check
  npm run format

  npm run lint
  # npm run test
  npm run build

  # Adding formatted files to git stage.
  git add $(git diff --name-only --cached --diff-filter=d | xargs)

  # Git has not written COMMIT_EDITMSG yet, particularly in a fresh worktree.
  # The commit-msg hook validates the actual message after Git creates it.
fi

finish() {
  result=$?
  # Add cleanup code here
  exit ${result}
}
trap finish EXIT ERR
