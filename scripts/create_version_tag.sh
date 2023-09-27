#!/bin/bash

echo "Fetching the latest tags from the remote repository..."
git fetch --tags

echo "Determining the latest tag, selecting only 'v.X.X.X' formatted tags..."
latest_tag=$(git tag | grep -E '^v[0-9]+\.[0-9]+\.[0-9]+$' | sort -V | tail -n 1)

if [ -z "$latest_tag" ]; then
    echo "Error: No suitable existing tags found!"
    exit 1
fi

echo "Latest tag is $latest_tag."

# Extract the major, minor, and patch versions
echo "Extracting major, minor, and patch versions from the latest tag..."
major=$(echo $latest_tag | cut -d. -f1)
minor=$(echo $latest_tag | cut -d. -f2)
patch=$(echo $latest_tag | cut -d. -f3 | cut -d- -f1) # Assuming the tag could potentially have a suffix after the patch version.

echo "Major: $major, Minor: $minor, Patch: $patch"

# Increment the patch version
echo "Incrementing the patch version..."
new_patch=$((patch + 1))

# Construct the new tag
new_tag="$major.$minor.$new_patch"
echo "The previous tag was $latest_tag and the new tag is $new_tag."

# Ask for user confirmation
read -p "Would you like to create and push the new tag? (y/n) " -n 1 -r
echo    # move to a new line
if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "Operation aborted by the user."
    exit 1
fi

# Create the new tag
echo "Creating the new tag locally..."
git tag $new_tag

# Push the new tag to GitHub
echo "Pushing the new tag to the remote repository..."
git push origin $new_tag

echo "New tag $new_tag pushed successfully!"
