# Testing WordPress Deployment Action

This guide covers how to test the unified WordPress deployment action safely.

## 🧪 Testing Options

### 1. **Local Testing Script (Recommended for Quick Tests)**

The fastest way to test the deployment process locally:

```bash
# Make script executable (if not already)
chmod +x scripts/test-deploy.sh

# Run with default values
./scripts/test-deploy.sh

# Run with custom values
./scripts/test-deploy.sh "2.0.9-test" "siteimprove" "wordpress-assets"

# Clean up after testing
rm -rf deploy
```

**What it does:**
- Simulates the file preparation process (dry-run mode)
- Uses the same deployment script as GitHub Actions
- Shows exactly what files would be deployed
- No network connections or external dependencies
- Creates only the `deploy/` directory (no SVN operations)

### 2. **GitHub Actions Dry Run (Recommended for CI/CD Testing)**

Use the unified action with dry-run enabled:

1. Go to **Actions** tab in your GitHub repository
2. Select **"Deploy to WordPress Marketplace"**
3. Click **"Run workflow"**
4. Set **dry-run** to `true`
5. Set **test-mode** to `true` (optional)
6. Enter test version (e.g., `2.0.8-test`)
7. Click **"Run workflow"**

**What it does:**
- Runs the actual GitHub Action
- Performs all deployment steps except SVN commit
- Shows detailed preview of what would be deployed
- Uses the same logic as production deployment

### 3. **Test SVN Repository (Recommended for Full Testing)**

Set up a test SVN repository to test the complete deployment process:

#### Option A: Use GitHub as SVN Repository
```bash
# Create a test repository on GitHub
# Then use GitHub's SVN interface
# URL: https://github.com/your-username/test-wordpress-deploy
```

#### Option B: Use a Local SVN Repository
```bash
# Install SVN locally
brew install subversion  # macOS
sudo apt-get install subversion  # Ubuntu

# Create local SVN repository
svnadmin create test-svn-repo
svn mkdir file:///path/to/test-svn-repo/trunk -m "Create trunk"
svn mkdir file:///path/to/test-svn-repo/tags -m "Create tags"
svn mkdir file:///path/to/test-svn-repo/assets -m "Create assets"
```

#### Option C: Use a Cloud SVN Service
- **Assembla**: Free SVN hosting
- **Beanstalk**: SVN hosting with free tier
- **Visual Studio Team Services**: Free SVN repositories

## 🔧 Configuration for Testing

### GitHub Secrets for Testing
Add these to your repository secrets:

```
TEST_SVN_USERNAME=your-test-username
TEST_SVN_PASSWORD=your-test-password
```

### GitHub Variables for Testing
Add these to your repository variables:

```
TEST_SVN_URL=https://your-test-svn-repo.com/siteimprove-test/
WP_PLUGIN_SLUG=siteimprove
WP_ASSETS_DIR=wordpress-assets
```

## 📋 Testing Checklist

### Before Testing
- [ ] Plugin files are in the `siteimprove/` directory
- [ ] Main plugin file (`siteimprove.php`) has correct header
- [ ] Version number is properly formatted
- [ ] Assets directory exists (if using assets)
- [ ] No sensitive data in plugin files

### During Testing
- [ ] Files are copied correctly
- [ ] Development files are removed
- [ ] Version is updated in main file
- [ ] Assets are copied (if present)
- [ ] No errors in the process

### After Testing
- [ ] Review generated files
- [ ] Check file permissions
- [ ] Verify version numbers
- [ ] Test plugin functionality
- [ ] Clean up test files

## 🚨 Common Issues and Solutions

### Issue: "Permission denied" on script
```bash
chmod +x scripts/test-deploy.sh
```

### Issue: "SVN checkout failed"
- Check SVN credentials
- Verify SVN repository URL
- Ensure repository exists and is accessible

### Issue: "Files not found"
- Run script from project root directory
- Ensure `siteimprove/` directory exists
- Check file paths in the action

## 🔄 Testing Workflow

### Recommended Testing Sequence:

1. **Local Script Test** (5 minutes)
   ```bash
   ./scripts/test-deploy.sh
   ```
   - Tests file preparation only (dry-run mode)
   - Creates `deploy/` directory with prepared files

2. **GitHub Actions Dry Run** (10 minutes)
   - Run unified action with dry-run=true
   - Review output and artifacts
   - Tests complete deployment logic without SVN operations

3. **Test SVN Repository** (30 minutes)
   - Set up test SVN repo
   - Run full deployment with test-mode=true, dry-run=false
   - Verify complete deployment process

4. **Production Deployment** (when ready)
   - Update to real SVN credentials
   - Run actual deployment with dry-run=false, test-mode=false

## 📊 What to Look For

### Successful Test Results:
- ✅ All plugin files copied
- ✅ Development files removed
- ✅ Version updated correctly
- ✅ No error messages
- ✅ Files are properly organized
- ✅ `deploy/` directory created with prepared files

### Warning Signs:
- ❌ Missing files
- ❌ Development files included
- ❌ Wrong version numbers
- ❌ Permission issues
- ❌ `deploy/` directory not created

## 🎯 Next Steps After Testing

1. **Review Results**: Check all generated files
2. **Fix Issues**: Address any problems found
3. **Update Configuration**: Set real SVN credentials
4. **Test Again**: Run with real repository
5. **Deploy**: Use for actual releases

## 🔧 Using the Unified Action

The unified action supports three modes:

### Dry Run Mode (Safe Testing)
```yaml
- name: Test Deployment
  uses: ./.github/actions/deploy-to-wordpress
  with:
    version: '2.0.8-test'
    dry-run: true
    test-mode: true
```

### Test Mode (Test Repository)
```yaml
- name: Test Deployment
  uses: ./.github/actions/deploy-to-wordpress
  with:
    version: '2.0.8-test'
    test-mode: true
    svn-url: 'https://your-test-svn-repo.com/siteimprove-test/'
```

### Production Mode (Live Deployment)
```yaml
- name: Deploy to Production
  uses: ./.github/actions/deploy-to-wordpress
  with:
    version: '2.0.8'
    dry-run: false
    test-mode: false
    svn-username: ${{ secrets.WP_SVN_USERNAME }}
    svn-password: ${{ secrets.WP_SVN_PASSWORD }}
```

This simplified approach ensures your deployment process is reliable and safe before using it for production releases. 