/* 
This plugin works in by obtaining all the Nodes.

References: 
https://vuejs.org/guide/reusability/plugins.html
https://snipcart.com/blog/vue-js-plugin
https://github.com/snipcart/vue-comments-overlay
*/

// import { AOIDatabase } from "./AOIDatabase.js"

const defaultOptions = {
    drawCanvas: false,
    tagColorMap: {
        DEFAULT: "rgba(255,0,0,1)",
        DIV: "rgba(0,255,0,1)",
        IMG: "rgba(0,0,255,1)",
        TEXT: "rgba(0,0,255,1)"
    },
    toTrackElements: [
        // {tag: 'div', class: 'v-sidebar-menu vsm_collapsed', recursive: false, wordLevel: false},
        // {tag: 'div', id: 'scr-main-div', recursive: true, wordLevel: true},
        // {tag: 'span', recursive: true, wordLevel: true}
    ]
}

export const AOIWebTracker = {
    
    // Install required for Vue Plugin
    install: (Vue, options) => {

        // Saving input parameters
        AOIWebTracker.Vue = Vue;
        AOIWebTracker.options = {...defaultOptions, ...options};

        // Adding the event listener to trigger a screenshot
        window.addEventListener("load", AOIWebTracker.captureAOI);
        window.addEventListener("resize", AOIWebTracker.captureAOI);
        document.addEventListener("scroll", AOIWebTracker.captureAOI);
        document.addEventListener("click", AOIWebTracker.captureAOI);
    
        // Reference: https://stackoverflow.com/questions/19840907/draw-rectangle-over-html-with-javascript
        const canvas = document.createElement('canvas');

        // Set that the canvas covers the entire page so we can draw anywhere
        canvas.style.width = '100vw';
        canvas.style.height = '100vh';
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        canvas.style.position = 'fixed';
        canvas.style.left = 0;
        canvas.style.top = 0;
        canvas.margin = 0;
        canvas.padding = 0;
        canvas.style.zIndex=1000000;
        canvas.style.pointerEvents='none'

        // Storing the canvas in the Plugin
        AOIWebTracker.canvas = canvas
        
        // Appending the canvas to the document
        document.body.appendChild(AOIWebTracker.canvas);

        // List of tags to look and check for words
        const tagWordCheck = ['P', 'A', 'H1', 'H2', 'H3', 'H4', 'H5', 'SPAN'];
        AOIWebTracker.tagWordCheck = tagWordCheck;

        // Creating highlighting dictionary
        // const aoiDatabase = new AOIDatabase();
        const aoiDatabase = [];
        AOIWebTracker.aoiDatabase = aoiDatabase;
        
        // Track when capturing data
        const isTracking = false;
        AOIWebTracker.isTracking = isTracking;
    },

    configureCanvas: () => {
        
        // Clear the canvas
        const context = AOIWebTracker.canvas.getContext('2d');
        context.clearRect(0, 0, AOIWebTracker.canvas.width, AOIWebTracker.canvas.height);
        
        // If vertical scrollbar is visible, shift the canvas' width and height
        // Reference: https://stackoverflow.com/a/11226327/13231446
        if (document.body.offsetHeight > window.innerHeight) {
            AOIWebTracker.canvas.width = window.innerWidth - 13;
        }
        else {
            AOIWebTracker.canvas.width = window.innerWidth;
        }

        if (document.body.scrollWidth > document.body.clientWidth) {
            AOIWebTracker.canvas.height = window.innerHeight - 15;
        }
        else {
            AOIWebTracker.canvas.height = window.innerHeight;
        }

    },
    
    drawBoundingBox: (rect, color) => {

        // Draw the bounding box on the html
        const context = AOIWebTracker.canvas.getContext('2d');
        context.fillStyle = color;
        context.fillRect(rect.x, rect.y, rect.width, rect.height);
    },

    drawCanvas: (elementsRectData) => {

        for (let i = 0; i < elementsRectData.length; i++){
            // Extract the current level element data
            const elementRect = elementsRectData[i];

            // Obtain the color from the tags
            let color = AOIWebTracker.options.tagColorMap.DEFAULT;
            if (elementRect.tagName in AOIWebTracker.options.tagColorMap) {
                color = AOIWebTracker.options.tagColorMap[elementRect.tagName];
            }

            // Draw the bounding box
            AOIWebTracker.drawBoundingBox(elementRect.elementRect, color);

            // Draw children if available
            if ("childrenRectData" in elementRect){
                AOIWebTracker.drawCanvas(elementRect.childrenRectData);
            }

            // Draw words if available
            if ("wordsRectData" in elementRect){
                color = AOIWebTracker.options.tagColorMap["TEXT"];
                for (let j = 0; j < elementRect.wordsRectData.length; j++){
                    AOIWebTracker.drawBoundingBox(elementRect.wordsRectData[j].rectData, color);
                }
            }
        }
    },


    captureAOI: () => {

        if (!AOIWebTracker.isTracking) {
            AOIWebTracker.isTracking = true;
            
            // Prevent calling methods too fast (before the document is 
            // rendered correctly and fully)
            setTimeout(() => {
                
                // Track the desired elements
                for (let i = 0; i < AOIWebTracker.options.toTrackElements.length; i++) {
                    const toTrackElement = AOIWebTracker.options.toTrackElements[i];
                    AOIWebTracker.aoiDatabase[i] = AOIWebTracker.trackElement(toTrackElement);
                }
                
                // Reconfigure the canvas as needed
                if (AOIWebTracker.options.drawCanvas) {
                    AOIWebTracker.configureCanvas();
                    for (let i = 0; i < AOIWebTracker.options.toTrackElements.length; i++) {
                        AOIWebTracker.drawCanvas(AOIWebTracker.aoiDatabase[i]);
                    }
                }
                
            }, 100);
            
            AOIWebTracker.isTracking = false;
        }
    },


    trackElement: (elementConfiguration) => {
        
        const elementsRects = [];

        if ("class" in elementConfiguration) {

            const elements = document.getElementsByClassName(elementConfiguration.class);

            for (let i = 0; i < elements.length; i++) {
                
                const element = elements[i];
                const rectInfo = AOIWebTracker.getRectInfo(
                    element, 
                    elementConfiguration.recursive, 
                    elementConfiguration.wordLevel
                );
                elementsRects.push(rectInfo);

            }
        }
        else if ("id" in elementConfiguration ) { // by "id"
            const element = document.getElementById(elementConfiguration.id);
            const rectInfo = AOIWebTracker.getRectInfo(
                element,
                elementConfiguration.recursive,
                elementConfiguration.wordLevel
            );
            elementsRects.push(rectInfo);

        } 
        else { // by just the tag
            const elements = document.getElementsByTagName(elementConfiguration.tag);

            for (let i = 0; i < elements.length; i++) {
                
                const element = elements[i];
                const rectInfo = AOIWebTracker.getRectInfo(
                    element, 
                    elementConfiguration.recursive, 
                    elementConfiguration.wordLevel
                );
                elementsRects.push(rectInfo);

            }

        }

        return elementsRects;
    },


    isInViewPort: (rect) => {
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
    },


    getRectInfo: (element, recursive, wordLevel) => {

        const responseRectData = {
            tagName: element.tagName,
            elementRect: element.getBoundingClientRect()
        };

        if (recursive && AOIWebTracker.isInViewPort(responseRectData.elementRect)) {

            const childrenRectData = [];
            
            for (let i = 0; i < element.childElementCount; i++) {
                const childrenRect = AOIWebTracker.getRectInfo(element.children[i], recursive, wordLevel);
                childrenRectData.push(childrenRect);
            }

            if (AOIWebTracker.tagWordCheck.includes(element.tagName)){

                // Look for word data
                let wordsRectData = [];
                for (let j = 0; j < element.childNodes.length; j++) {
                    const node = element.childNodes[j];
                    wordsRectData = wordsRectData.concat(AOIWebTracker.wordSearching(node));
                }

                // If we found data, store it
                if (wordsRectData.length != 0) {
                    responseRectData.wordsRectData = wordsRectData;
                }
            }

            responseRectData.childrenRectData = childrenRectData;
        }

        return responseRectData;
    },


    wordSearching: (node) => {

        // Create Range object to find individual words
        const range = new Range();
        const wordsRectData = [];
        let nodeText = '';

        // Extract the text
        if (node.nodeName == "#text"){
            nodeText = node.wholeText;
        }
            
        // If empty, return immediately
        if (nodeText == ''){
            return [];
        }

        if (node.nodeName == '#text'){     
         
            const words = nodeText.split(" ");

            // For all text within the node, construct a range
            let textStartPointer = 0;
            let textEndPointer = 0;
            for (let j = 0; j < words.length; j++){

                // Storage container for per-word data
                const wordRectData = {};

                // Select the word's range
                textEndPointer = textStartPointer + words[j].length;
                range.setStart(node, textStartPointer);
                range.setEnd(node, textEndPointer);

                // Get word data and store
                const rect = range.getBoundingClientRect();
                wordRectData.rectData = rect;
                wordRectData.text = words[j];
                wordsRectData.push(wordRectData);

                textStartPointer = textEndPointer + 1;

            }
        }

        return wordsRectData;
    },
}
