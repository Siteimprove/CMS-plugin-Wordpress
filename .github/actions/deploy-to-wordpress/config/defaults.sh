#!/bin/bash

# Default Configuration for WordPress Deployment
# Essential defaults that can be overridden by environment variables

# Plugin Configuration
export DEFAULT_PLUGIN_SLUG=${DEFAULT_PLUGIN_SLUG:-"siteimprove"}
export DEFAULT_PLUGIN_DIR=${DEFAULT_PLUGIN_DIR:-"siteimprove"}
export DEFAULT_ASSETS_DIR=${DEFAULT_ASSETS_DIR:-"wordpress-assets"}

# SVN Configuration
export DEFAULT_SVN_URL=${DEFAULT_SVN_URL:-"https://plugins.svn.wordpress.org/siteimprove/"}
export DEFAULT_TEST_SVN_URL=${DEFAULT_TEST_SVN_URL:-"https://your-test-svn-repo.com/siteimprove-test/"}

# File Patterns to Exclude
export EXCLUDE_PATTERNS=(
    "*.git*"
    "node_modules"
    ".editorconfig"
    ".gitignore"
    "phpcs.xml"
    "README.md"
    ".DS_Store"
)

# Version Patterns
export VERSION_PATTERN="^[0-9]+\.[0-9]+\.[0-9]+(-[a-zA-Z0-9]+)?$"
export TEST_VERSION_SUFFIX="-test"

# Function to validate version format
validate_version() {
    local version=$1
    if [[ ! $version =~ $VERSION_PATTERN ]]; then
        echo "Invalid version format: $version"
        echo "Expected format: X.Y.Z or X.Y.Z-suffix"
        return 1
    fi
    return 0
}

# Function to check if version is test version
is_test_version() {
    local version=$1
    [[ $version == *"$TEST_VERSION_SUFFIX"* ]]
}

# Export functions
export -f validate_version is_test_version 