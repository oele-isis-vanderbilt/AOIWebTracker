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
* Search via `div`, `tag`, or `class`

## Installation
As of now, the package is only available via ``npm``. Use the following command:

```bash
npm install aoiwebtracker
```

## Usage

To use the plugin, you are required to install it during the mounting of app. Here is an example:

```js
import AOIWebTracker from 'aoiwebtracker'
import mitt from 'mitt'

// Create the emitter
const emitter = mitt()

// Install plugin (provide the emitter instance from mitt)
tracker = new AOIWebTracker()
tracker.install({
    emitter: emitter,
    drawCanvas: false,
    toTrackElements: [
        {searchBy: 'id', searchName: 'example_id', recursive: true, wordLevel: true}, // search by id
        {searchBy: 'tag', searchName: 'span', recursive: true, wordLevel: false}, // search by tag
        {searchBy: 'class', searchName: 'class_name' , recursive: false, wordLevel: true} // search by class
    ],
    timeSpacing: 100
})
```

During the installation of the plugin, there are parameters that can be set for specifying the search criteria, debugging tools, and default configuration.

| parameter name  | type                         | accepted or example values                              | description                                                          |
|-----------------|------------------------------|---------------------------------------------------------|----------------------------------------------------------------------|
| emitter         | `Emitter` or `mitt()`            | mitt()                                                  | The Emitter instance that the new AOI information will be emitted to. |
| drawCanvas      | `boolean`                      | true or false                                           | Enable the overlay canvas to display the tracked AOI (for debugging) |
| toTrackElements | Array of `IElementConfiguration` | [{searchBy: 'id' | 'tag' | 'class', searchName: string, recursive: boolean, wordLevel: boolean}] | Array of searching criteria                                          |
| tagColorMap     | `ITagColorMap` | {DEFAULT: "rgba(255,0,0,1)", TEXT: "rgba(0,0,255,1)"}   | Default colors of types of elements in overlay canvas                                |
| timeSpacing     | `number`                       | 100                                                     | Delta time in milliseconds between execution of AOI collection                       |

## Example

TODO
