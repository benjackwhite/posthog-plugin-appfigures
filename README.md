# Posthog Plugin Appfigures Sync

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) 
[![Tests](https://github.com/benjackwhite/posthog-plugin-appfigures/actions/workflows/run-tests.yml/badge.svg)](https://github.com/benjackwhite/posthog-plugin-appfigures/actions/workflows/run-tests.yml)


Posthog plugin that syncs data from Appfigures to Posthog

# Installation
1. Open PostHog.
2. Go to the Plugins page from the sidebar.
3. Head to the Advanced tab.
4. "Install from GitHub, GitLab or npm" using this repository's URL.

# Usage

The plugin will sync a range of datasets to Posthog under event names `appfigures_X`. 
* appfigures_reviews
* appfigures_ratings
* appfigures_sales
* appfigures_revenue

You can then display these from the **insights area** for KPIs of your product(s) or **trigger slack notifications custom action for new reviews** 


Metrics             |  Configuration
:-------------------------:|:-------------------------:
App Downloads by Product  |  ![Screenshot of App Downloads configuration](/docs/img/screen_app_downloads.png)
App Ratings by Product  |  ![Screenshot of App Ratings configuration](/docs/img/screen_app_ratings.png)
App Review slack webhook  |  ![Screenshot of App Reviews webhook configuration](/docs/img/screen_app_reviews.png)

### Message format for reviews action
```
*[event.properties.author]* left a review (*[event.properties.stars] stars*):  *[event.properties.title]* [event.properties.review]
```


# Contributing
## Running Unit Tests

```
yarn test
```

## Running E2E Tests

Copy `.env.example` to `.env` and include your related appfigures credentials.
These values will get picked up and automatically enable the E2E tests.