#!/bin/bash

# WordPress Deployment Script
# Handles deployment to WordPress.org SVN repository with support for test and dry-run modes

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Simple utility functions
print_status() {
    echo -e "${1}${2}${NC}"
}

is_dry_run() {
    [ "$DRY_RUN" = "true" ]
}

is_test_mode() {
    [ "$TEST_MODE" = "true" ]
}

# Function to validate inputs
validate_inputs() {
    if [ -z "$VERSION" ]; then
        print_status $RED "Error: VERSION is required"
        exit 1
    fi
    
    if [ -z "$PLUGIN_SLUG" ]; then
        print_status $RED "Error: PLUGIN_SLUG is required"
        exit 1
    fi
    
    # Set default test credentials if in test mode and credentials are empty
    if is_test_mode && [ -z "$SVN_USERNAME" ]; then
        print_status $YELLOW "Warning: TEST_SVN_USERNAME not set, using default test credentials"
        export SVN_USERNAME="test-user"
    fi
    
    if is_test_mode && [ -z "$SVN_PASSWORD" ]; then
        print_status $YELLOW "Warning: TEST_SVN_PASSWORD not set, using default test credentials"
        export SVN_PASSWORD="test-pass"
    fi
    
    if ! is_dry_run && [ -z "$SVN_USERNAME" ]; then
        print_status $RED "Error: SVN_USERNAME is required when not in dry-run mode"
        exit 1
    fi
    
    if ! is_dry_run && [ -z "$SVN_PASSWORD" ]; then
        print_status $RED "Error: SVN_PASSWORD is required when not in dry-run mode"
        exit 1
    fi
}

# Function to setup environment
setup_environment() {
    print_status $YELLOW "Setting up deployment environment..."
    
    # Create deployment directory
    mkdir -p deploy
    
    # Install SVN if not in dry-run mode
    if ! is_dry_run; then
        if ! command -v svn &> /dev/null; then
            print_status $YELLOW "Installing Subversion..."
            sudo apt-get update
            sudo apt-get install -y subversion
        fi
    fi
}

# Function to prepare plugin files
prepare_plugin_files() {
    print_status $YELLOW "Preparing plugin files..."
    
    # Copy plugin files to deployment directory
    print_status $YELLOW "Copying plugin files..."
    cp -r siteimprove/* deploy/
    
    # Remove development files
    print_status $YELLOW "Removing development files..."
    find deploy -name "*.git*" -delete
    find deploy -name "node_modules" -type d -exec rm -rf {} + 2>/dev/null || true
    rm -f deploy/.editorconfig deploy/.gitignore deploy/phpcs.xml deploy/README.md
    
    # Update version in main file
    print_status $YELLOW "Updating version in main plugin file..."
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s/Version:.*/Version:             $VERSION/" deploy/siteimprove.php
    else
        sed -i "s/Version:.*/Version:             $VERSION/" deploy/siteimprove.php
    fi
    
    # Validate WordPress plugin file
    if [ ! -f "deploy/siteimprove.php" ]; then
        print_status $RED "Error: Plugin file not found: deploy/siteimprove.php"
        exit 1
    fi
    
    print_status $GREEN "✅ Plugin files prepared successfully"
}

# Function to display deployment preview
show_deployment_preview() {
    print_status $BLUE "=== DEPLOYMENT PREVIEW ==="
    echo "Version: $VERSION"
    echo "Plugin Slug: $PLUGIN_SLUG"
    echo "SVN URL: $SVN_URL"
    echo "Assets Directory: $ASSETS_DIR"
    echo "Dry Run: $DRY_RUN"
    echo "Test Mode: $TEST_MODE"
    echo ""
    echo "Files to be deployed:"
    find deploy -type f | head -20
    echo "..."
    echo ""
    echo "Plugin main file content:"
    head -20 deploy/siteimprove.php
    echo ""
}

# Function to handle SVN operations
handle_svn_operations() {
    if is_dry_run; then
        print_status $YELLOW "DRY RUN: Skipping SVN operations"
        return
    fi
    
    print_status $YELLOW "Performing SVN operations..."
    
    # Checkout WordPress SVN repository
    print_status $YELLOW "Checking out SVN repository..."
    svn checkout "$SVN_URL" svn-repo --username "$SVN_USERNAME" --password "$SVN_PASSWORD" --non-interactive --trust-server-cert
    
    # Update trunk
    print_status $YELLOW "Updating SVN trunk..."
    cd svn-repo/trunk
    svn update
    cd ../..
    
    # Copy plugin files to trunk
    print_status $YELLOW "Copying plugin files to trunk..."
    rm -rf svn-repo/trunk/*
    cp -r deploy/* svn-repo/trunk/
    
    # Copy assets if they exist
    if [ -n "$ASSETS_DIR" ] && [ -d "$ASSETS_DIR" ]; then
        print_status $YELLOW "Copying assets..."
        cp -r "$ASSETS_DIR"/* svn-repo/assets/
    fi
    
    # Create version tag
    print_status $YELLOW "Creating version tag..."
    svn copy svn-repo/trunk svn-repo/tags/$VERSION -m "Tagging version $VERSION"
    
    # Add new files to SVN
    print_status $YELLOW "Adding files to SVN..."
    cd svn-repo
    svn add --force trunk/*
    svn add --force tags/$VERSION/*
    if [ -d "assets" ]; then
        svn add --force assets/* 2>/dev/null || true
    fi
    
    
    # Commit changes to SVN
    print_status $YELLOW "Committing changes to SVN..."
    local commit_message="Deploy version $VERSION"
    if is_test_mode; then
        commit_message="TEST: $commit_message"
    fi
    svn commit -m "$commit_message" --username "$SVN_USERNAME" --password "$SVN_PASSWORD" --non-interactive --trust-server-cert
    
    cd ..
}

# Function to show dry run summary
show_dry_run_summary() {
    if is_dry_run; then
        print_status $GREEN "=== DRY RUN COMPLETED ==="
        echo "✅ All deployment steps would have been successful"
        echo "📁 Files prepared for deployment: $(find deploy -type f | wc -l)"
        echo "📊 Deployment size: $(du -sh deploy 2>/dev/null | cut -f1 || echo '0B')"
        echo "🔧 Next steps:"
        echo "   1. Set dry-run: false"
        echo "   2. Update SVN credentials"
        echo "   3. Run actual deployment"
        echo ""
    fi
}

# Function to cleanup
cleanup() {
    print_status $YELLOW "Cleaning up temporary files..."
    rm -rf svn-repo deploy
}

# Function to show success message
show_success() {
    print_status $GREEN "=== DEPLOYMENT COMPLETED SUCCESSFULLY ==="
    if is_dry_run; then
        echo "🎯 Dry run completed - no changes were made"
    else
        echo "🚀 Plugin version $VERSION has been deployed to WordPress marketplace"
    fi
    echo ""
}

# Main execution
main() {
    # Validate inputs
    validate_inputs
    
    # Setup environment
    setup_environment
    
    # Prepare plugin files
    prepare_plugin_files
    
    # Show deployment preview
    show_deployment_preview
    
    # Handle SVN operations
    handle_svn_operations
    
    # Show dry run summary if applicable
    show_dry_run_summary
    
    # Show success message
    show_success
}

# Run main function
main "$@" 