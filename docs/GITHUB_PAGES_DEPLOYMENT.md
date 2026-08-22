# GitHub Pages Deployment Notes

The companion site is deployed from `website/` by `.github/workflows/dataforge-pages.yml`. The workflow builds the Vite application with a GitHub Pages subpath base, uploads `website/dist/public`, and deploys through the `github-pages` environment.

GitHub Pages requires the repository Pages setting to use **GitHub Actions** for this workflow. GitHub documents that Pages sites are externally available even when source repositories are private if the account plan allows private-repository Pages. The initial private-repository configuration returned a plan restriction, so the repository owner selected public visibility before Pages enablement.

The expected project URL is `https://adhimiw.github.io/dataforge/` after the deployment run succeeds.

## References

[1] [Configuring a publishing source for GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)

[2] [GitHub Pages REST API](https://docs.github.com/en/rest/pages/pages)
