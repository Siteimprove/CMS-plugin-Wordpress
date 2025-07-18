# Deploy to WordPress Marketplace Action

This GitHub Action deploys a WordPress plugin to the WordPress.org marketplace via SVN. It supports both test and production deployments with a single unified action.

## Usage

### In a workflow file

```yaml
- name: Deploy to WordPress Marketplace
  uses: ./.github/actions/deploy-to-wordpress
  with:
    version: '2.0.8'
    plugin-slug: 'siteimprove'
    svn-username: ${{ secrets.WP_SVN_USERNAME }}
    svn-password: ${{ secrets.WP_SVN_PASSWORD }}
    svn-url: ${{ vars.WP_SVN_URL }}
    assets-dir: 'wordpress-assets'
    dry-run: false
    test-mode: false
```

### Testing with dry-run

```yaml
- name: Test Deploy to WordPress Marketplace
  uses: ./.github/actions/deploy-to-wordpress
  with:
    version: '2.0.8-test'
    dry-run: true
    test-mode: true
```

### Required GitHub Secrets

Add these secrets to your repository:

- `WP_SVN_USERNAME`: Your WordPress.org SVN username
- `WP_SVN_PASSWORD`: Your WordPress.org SVN password
- `TEST_SVN_USERNAME`: Your test SVN username (optional, for test mode)
- `TEST_SVN_PASSWORD`: Your test SVN password (optional, for test mode)

### Required GitHub Variables

Add these variables to your repository (Settings > Secrets and variables > Actions > Variables):

- `WP_PLUGIN_SLUG`: Your WordPress.org plugin slug (default: 'siteimprove')
- `WP_SVN_URL`: Your WordPress.org SVN repository URL (default: 'https://plugins.svn.wordpress.org/siteimprove/')
- `WP_ASSETS_DIR`: Directory containing plugin assets like screenshots (default: 'wordpress-assets')

## Inputs

| Input | Description | Required | Default |
|-------|-------------|----------|---------|
| `version` | Plugin version to deploy (e.g., 2.0.8) | Yes | - |
| `plugin-slug` | WordPress.org plugin slug | Yes | 'siteimprove' |
| `svn-username` | SVN username for WordPress.org | No* | - |
| `svn-password` | SVN password for WordPress.org | No* | - |
| `svn-url` | SVN repository URL | No | 'https://plugins.svn.wordpress.org/siteimprove/' |
| `assets-dir` | Directory containing plugin assets | No | 'wordpress-assets' |
| `dry-run` | Perform a dry run without committing to SVN | No | 'false' |
| `test-mode` | Run in test mode (uses test credentials and marks commits as TEST) | No | 'false' |

*Required when not in dry-run mode

## Modes

### Production Mode
- Uses production SVN credentials
- Commits changes to WordPress.org
- Standard commit messages

### Test Mode
- Uses test SVN credentials (if provided) or default test credentials
- Marks commits with "TEST:" prefix
- Safe for testing without affecting production
- If test credentials are not set, uses default test values

### Dry Run Mode
- No SVN operations performed
- Shows what would be deployed
- Perfect for testing and validation

## What this action does

1. **Validates inputs** - Checks required parameters and credentials
2. **Prepares files** - Copies plugin files, removes development files
3. **Updates version** - Updates version number in the main plugin file
4. **Shows preview** - Displays what will be deployed
5. **SVN operations** - Checks out repository, copies files, creates tags (if not dry-run)
6. **Commits changes** - Commits all changes to SVN (if not dry-run)
7. **Cleanup** - Removes temporary files

## File Structure

The action expects your plugin files to be in the `siteimprove/` directory. If you have WordPress marketplace assets (screenshots, banner images, etc.), place them in a directory specified by the `assets-dir` input (default: `wordpress-assets/`).

## Security

- SVN credentials are stored as GitHub secrets and are never exposed in logs
- The action uses `--non-interactive` and `--trust-server-cert` flags for automated deployment
- Temporary files are cleaned up after deployment
- Test mode provides additional safety for testing

## Troubleshooting

- Ensure your SVN credentials have write access to the WordPress.org repository
- Make sure the plugin slug matches your WordPress.org plugin
- Verify that the SVN URL is correct for your plugin
- Check that all required plugin files are present in the `siteimprove/` directory
- Use dry-run mode to test without making changes
- Use test mode for safe testing with separate credentials 