const core = require('@actions/core');
const { GitHub } = require('@actions/github');
const glob = require('@actions/glob');
const mime = require('mime-types');
const fs = require('fs');

async function run() {
  try {
    // Get authenticated GitHub client (Ocktokit): https://github.com/actions/toolkit/tree/master/packages/github#usage
    const github = new GitHub(process.env.GITHUB_TOKEN);

    // Get the inputs from the workflow file: https://github.com/actions/toolkit/tree/master/packages/core#inputsoutputs
    const uploadUrl = core.getInput('upload_url', { required: true });
    const assetPath = core.getInput('asset_path', { required: true });
    const assetName = core.getInput('asset_name', { required: true });
    // const assetContentType = core.getInput('asset_content_type', { required: true });

    console.log('assetPath:', assetPath);

    // Determine content-length for header to upload asset
    const contentLength = filePath => fs.statSync(filePath).size;

    const globber = await glob.create(assetPath);
    console.log('globber:', globber);

    // Upload a release asset
    // API Documentation: https://developer.github.com/v3/repos/releases/#upload-a-release-asset
    // Octokit Documentation: https://octokit.github.io/rest.js/#octokit-routes-repos-upload-release-asset
    for await (const filePath of globber.globGenerator()) {
      const contentType = mime.lookup(file);

      // Setup headers for API call, see Octokit Documentation: https://octokit.github.io/rest.js/#octokit-routes-repos-upload-release-asset for more information

      const headers = { 'content-type': contentType, 'content-length': contentLength(filePath) };

      console.log('filePath:', filePath);
      console.log('contentType:', contentType);

      await github.repos.uploadReleaseAsset({
        url: uploadUrl,
        headers,
        name: assetName,
        file: fs.readFileSync(filePath)
      });
    }

    // Get the browser_download_url for the uploaded release asset from the response
    // const {
    //   data: { browser_download_url: browserDownloadUrl }
    // } = uploadAssetResponse;

    // Set the output variable for use by other actions: https://github.com/actions/toolkit/tree/master/packages/core#inputsoutputs
    // core.setOutput('browser_download_url', browserDownloadUrl);
  } catch (error) {
    core.setFailed(error.message);
  }
}

module.exports = run;
