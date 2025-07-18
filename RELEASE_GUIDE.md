# WordPress Plugin Release Guide

This guide explains how to release your WordPress plugin using different deployment modes.

## 🏷️ **Tag Patterns for Different Modes**

The release workflow automatically detects the deployment mode based on your git tag:

### **1. Dry Run Mode** (Safe Testing)
```bash
git tag v2.0.8-dry-run
git push origin v2.0.8-dry-run
```
**What happens:**
- ✅ Creates GitHub release with zip file
- ✅ Runs deployment in dry-run mode
- ✅ Shows what would be deployed
- ❌ No actual SVN operations
- ❌ No changes made to any repository

### **2. Test Mode** (Test Repository)
```bash
git tag v2.0.8-test
git push origin v2.0.8-test
```
**What happens:**
- ✅ Creates GitHub release with zip file
- ✅ Deploys to test SVN repository
- ✅ Uses test credentials
- ✅ Marks commits as "TEST:"
- ❌ No changes to production WordPress.org

### **3. Production Mode** (Live Deployment)
```bash
git tag v2.0.8
git push origin v2.0.8
```
**What happens:**
- ✅ Creates GitHub release with zip file
- ✅ Deploys to WordPress.org marketplace
- ✅ Uses production credentials
- ✅ Live deployment to users

## 🔧 **Prerequisites**

### **Required Secrets**
- `WP_SVN_USERNAME`: Your WordPress.org SVN username
- `WP_SVN_PASSWORD`: Your WordPress.org SVN password
- `TEST_SVN_USERNAME`: Your test SVN username (for test mode)
- `TEST_SVN_PASSWORD`: Your test SVN password (for test mode)

### **Required Variables**
- `WP_PLUGIN_SLUG`: Your WordPress.org plugin slug
- `WP_SVN_URL`: Your WordPress.org SVN repository URL
- `TEST_SVN_URL`: Your test SVN repository URL
- `WP_ASSETS_DIR`: Directory containing plugin assets

## 📋 **Release Process**

### **Step 1: Prepare Your Release**
1. Update version in `siteimprove/siteimprove.php`
2. Update changelog in `siteimprove/readme.txt`
3. Commit and push your changes
4. Test locally with `./scripts/test-deploy.sh`

### **Step 2: Choose Deployment Mode**

#### **For Testing (Recommended First)**
```bash
# Dry run to validate everything
git tag v2.0.8-dry-run
git push origin v2.0.8-dry-run

# Test with actual SVN operations
git tag v2.0.8-test
git push origin v2.0.8-test
```

#### **For Production**
```bash
# Live deployment to WordPress.org
git tag v2.0.8
git push origin v2.0.8
```

### **Step 3: Monitor the Workflow**
1. Go to **Actions** tab in your repository
2. Watch the workflow run
3. Check the logs for any issues
4. Verify the deployment was successful

## 🎯 **Recommended Workflow**

### **For New Versions:**
1. **Dry Run**: `v2.0.8-dry-run` - Validate files and process
2. **Test**: `v2.0.8-test` - Test with real SVN operations
3. **Production**: `v2.0.8` - Deploy to WordPress.org

### **For Minor Updates:**
1. **Test**: `v2.0.8-test` - Quick validation
2. **Production**: `v2.0.8` - Deploy to WordPress.org

## 🔍 **What to Check After Each Release**

### **Dry Run Mode:**
- ✅ Files are prepared correctly
- ✅ Version is updated
- ✅ No errors in the process
- ✅ Deployment preview looks correct

### **Test Mode:**
- ✅ Files are committed to test repository
- ✅ Tag is created in test repository
- ✅ Commit message starts with "TEST:"
- ✅ All files are present

### **Production Mode:**
- ✅ Files are committed to WordPress.org
- ✅ Tag is created on WordPress.org
- ✅ Plugin appears on WordPress.org
- ✅ Version is available for download

## 🚨 **Troubleshooting**

### **Common Issues:**

**"Workflow not triggered"**
- Ensure tag matches pattern: `v*`, `v*-test`, or `v*-dry-run`
- Check that tag was pushed to the repository

**"SVN authentication failed"**
- Verify credentials are set correctly
- Check that credentials have write access
- For test mode, ensure test repository exists

**"Files not found"**
- Ensure `siteimprove/` directory exists
- Check that main plugin file is present
- Verify file paths in the action

**"Version already exists"**
- Use a different version number
- Delete existing tag if needed
- Check WordPress.org for existing versions

## 📊 **Workflow Summary**

| Tag Pattern | Mode | SVN Operations | Credentials | Purpose |
|-------------|------|----------------|-------------|---------|
| `v2.0.8-dry-run` | Dry Run | ❌ None | Production | Validate files |
| `v2.0.8-test` | Test | ✅ Test repo | Test | Test deployment |
| `v2.0.8` | Production | ✅ WordPress.org | Production | Live release |

This approach ensures safe, controlled releases with multiple validation steps before going live. 