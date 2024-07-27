#!/bin/bash

# Check for the correct number of arguments
if [ "$#" -ne 2 ]; then
    echo "Usage: $0 <template_file> <output_file>"
    exit 1
fi

# Assign arguments to variables
TEMPLATE_FILE=$1
OUTPUT_FILE=$2

# Get the short commit hash from Git
COMMIT_SHA=$(git rev-parse --short HEAD)

# Check if the commit SHA was successfully retrieved
if [ -z "$COMMIT_SHA" ]; then
    echo "Error: Could not retrieve the Git commit SHA. Are you in a Git repository?"
    exit 1
fi

# Add a comment to the top of the output file indicating it should not be manually modified
echo "# This file is generated automatically, do not modify it by hand" > "$OUTPUT_FILE"

# Replace ${COMMIT_SHA} in the template with the actual commit SHA
# and append the processed content to the output file
sed "s/\${COMMIT_SHA}/$COMMIT_SHA/g" "$TEMPLATE_FILE" >> "$OUTPUT_FILE"

echo "Generated $OUTPUT_FILE from template $TEMPLATE_FILE with commit SHA $COMMIT_SHA"
