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

  # Adding commit linter. Validates commit messges are according to format.
  # Runs before commit is created.
  # To try and fail VSCode and other editor commits if not properly fomratted.
  npx --no -- commitlint --edit "${1}"
fi

finish() {
  result=$?
  # Add cleanup code here
  exit ${result}
}
trap finish EXIT ERR