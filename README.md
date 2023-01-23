# AOIWebTracker
![npm](https://img.shields.io/npm/v/aoiwebtracker)
![license](https://img.shields.io/github/license/oele-isis-vanderbilt/AOIWebTracker)

Automatic Areas-of-Interest (AOI) Tracker for Web Applications, down to the word level!

![AOIWebTracker Demo](https://user-images.githubusercontent.com/40870026/214149541-997e9243-042b-4e65-a9f5-c458cd104d4a.gif)


## Features
* Automatic Tracking of Areas-of-Interest
* Tracking of elements based on ID, tag, or class
* Recursive AOI searching and tracking
* Word-level AOI tracking

## Compatibility
This package is only compatible with Vue (only tested on Vue 3). The plugin only relies on the ``document`` API, therefore it should be universal.

## Installation
As of now, the package is only available via ``npm``. Use the following command:

```bash
npm install aoiwebtracker
```

## Usage

To use the plugin, you are required to install it during the mounting of app. Here is an example:

```vue3
import { createApp } from 'vue'
import App from '@/App.vue'
import { AOIWebTracker } from 'aoiwebtracker'

// Create application
const app = createApp(App)

// Install plugin
app.use(AOIWebTracker)
    .mount('#app')
```

During the installation of the plugin, there are parameters that can be set for specifying the search criteria, debugging tools, and default configuration.

| parameter name  | type                         | accepted or example values                              | description                                                          |
|-----------------|------------------------------|---------------------------------------------------------|----------------------------------------------------------------------|
| drawCanvas      | boolean                      | true or false                                           | Enable the overlay canvas to display the tracked AOI (for debugging) |
| toTrackElements | Array of search Objects      | [{tag: string, recursive: boolean, wordLevel: boolean}] | Array of searching criteria                                          |
| tagColorMap     | Object with String to String | {DEFAULT: "rgba(255,0,0,1)", TEXT: "rgba(0,0,255,1)"}   | Default colors of types of elements in overlay canvas                |

## Example

TODO