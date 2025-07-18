#!/bin/bash

# Local WordPress Deployment Test Script
# Simple local testing using the unified deployment action

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Default values
VERSION=${1:-"2.0.8-test"}
PLUGIN_SLUG=${2:-"siteimprove"}
ASSETS_DIR=${3:-"wordpress-assets"}

echo -e "${BLUE}=== WordPress Deployment Test ===${NC}"
echo -e "Version: ${GREEN}$VERSION${NC}"
echo -e "Plugin Slug: ${GREEN}$PLUGIN_SLUG${NC}"
echo -e "Assets Directory: ${GREEN}$ASSETS_DIR${NC}"
echo ""

# Check if we're in the right directory
if [ ! -d "siteimprove" ]; then
    echo -e "${RED}Error: siteimprove directory not found. Run this script from the project root.${NC}"
    exit 1
fi

# Check if deployment script exists
if [ ! -f ".github/actions/deploy-to-wordpress/scripts/deploy.sh" ]; then
    echo -e "${RED}Error: Deployment script not found.${NC}"
    echo "Make sure you're running this from the project root."
    exit 1
fi

# Make deployment script executable
chmod +x .github/actions/deploy-to-wordpress/scripts/deploy.sh
chmod +x .github/actions/deploy-to-wordpress/config/defaults.sh

# Source configuration
source .github/actions/deploy-to-wordpress/config/defaults.sh

# Set environment variables for local testing
export VERSION="$VERSION"
export PLUGIN_SLUG="$PLUGIN_SLUG"
export SVN_USERNAME="test-user"
export SVN_PASSWORD="test-pass"
export SVN_URL="https://test-svn-repo.com/siteimprove-test/"
export ASSETS_DIR="$ASSETS_DIR"
export DRY_RUN="true"
export TEST_MODE="true"

echo -e "${YELLOW}Running deployment test...${NC}"
echo ""

# Run the deployment script
.github/actions/deploy-to-wordpress/scripts/deploy.sh

echo ""
echo -e "${GREEN}✅ Local test completed successfully!${NC}"
echo -e "${YELLOW}📁 Test files are in: deploy/ directory${NC}"
echo -e "${YELLOW}🧹 Run 'rm -rf deploy' to clean up${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "1. Review the generated files"
echo "2. Test the GitHub Action with dry-run=true"
echo "3. Test with a real SVN repository" 