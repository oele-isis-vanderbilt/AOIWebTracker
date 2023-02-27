// Third-party
import mitt, { Emitter } from 'mitt'

export interface IElementConfiguration {
  searchBy: 'id' | 'tag' | 'class'
  searchName: string
  recursiveSearch?: boolean
  saveChildren?: boolean
  saveWords?: boolean
  saveWordContainers?: boolean
}

const configurationDefaults: IElementConfiguration = {
  searchBy: 'id',
  searchName: '',
  recursiveSearch: false,
  saveChildren: false,
  saveWords: false,
  saveWordContainers: false
}

export interface ITagColorMap {
  DEFAULT: string
  DIV: string
  IMG: string
  TEXT: string
}

interface IOptions {
  emitter: Emitter<any>
  drawCanvas: boolean
  tagColorMap: ITagColorMap
  toTrackElements: Array<IElementConfiguration>
  timeSpacing: number
}

const defaultOptions = {
  emitter: mitt<any>(), 
  drawCanvas: false,
  tagColorMap: {
    DEFAULT: "rgba(255,0,0,0.1)",
    DIV: "rgba(0,255,0,0.1)",
    IMG: "rgba(0,0,255,0.1)",
    TEXT: "rgba(0,0,255,0.5)"
  },
  toTrackElements: [], 
  timeSpacing: 200
} as IOptions

interface ConciseDOMRect{
  x: string
  y: string
  w: string
  h: string
}

interface IWordRectData {
  rectData: ConciseDOMRect
  text: string
}

interface IAOIDatabase {
  meta: string[]
  tagName: string[]
  uuid: string[]
  x: string[]
  y: string[]
  w: string[]
  h: string[]
}

export default class AOIWebTracker {
  options: IOptions
  canvas: HTMLCanvasElement
  canvasContext: CanvasRenderingContext2D | null
  tagWordCheck: Array<string>
  aoiDatabase: IAOIDatabase
  aoiCounter: number
  isTracking: boolean

  constructor() {
  
    // Initial values of state variables
    this.options = defaultOptions
    this.aoiDatabase = {
      meta: [],
      tagName: [],
      uuid: [],
      x: [],
      y: [],
      w: [],
      h: [],
    }
    this.aoiCounter = 0
    
    // Set that the canvas covers the entire page so we can draw anywhere
    this.canvas = document.createElement('canvas')
    this.canvas.style.width = '100vw'
    this.canvas.style.height = '100vh'
    this.canvas.width = window.innerWidth
    this.canvas.height = window.innerHeight
    this.canvas.style.position = 'fixed'
    this.canvas.style.left = '0'
    this.canvas.style.top = '0'
    this.canvas.style.zIndex='1000000'
    this.canvas.style.pointerEvents='none'

    // Get the context
    this.canvasContext = this.canvas.getContext('2d')
    
    // Appending the canvas to the document
    document.body.appendChild(this.canvas)

    // List of tags to look and check for words
    this.tagWordCheck = ['P', 'A', 'H1', 'H2', 'H3', 'H4', 'H5', 'SPAN', 'LI', 'BUTTON']
    this.isTracking = false
  }
    
    // Install required for Vue Plugin
  install(options: IOptions) {

    // Process the configuration options
    for (let i = 0; i < options.toTrackElements.length; i++){
      options.toTrackElements[i] = {...configurationDefaults, ...options.toTrackElements[i]}
    }

    // Saving input parameters
    this.options = {...defaultOptions, ...options}

    // Adding the event listener to trigger a screenshot
    window.addEventListener("load", () => {this.captureAOI()})
    window.addEventListener("resize", () => {this.captureAOI()})
    document.addEventListener("scroll", () => {this.captureAOI()})
    document.addEventListener("click", () => {this.captureAOI()})

    // Reference: https://stackoverflow.com/questions/19840907/draw-rectangle-over-html-with-javascript
  }

  configureCanvas() {
    
    // Clear the canvas
    if (this.canvasContext instanceof CanvasRenderingContext2D){
      this.canvasContext.clearRect(0, 0, this.canvas.width, this.canvas.height)
    }
    
    // If vertical scrollbar is visible, shift the canvas' width and height
    // Reference: https://stackoverflow.com/a/11226327/13231446
    if (document.body.offsetHeight > window.innerHeight) {
      this.canvas.width = window.innerWidth - 13
    }
    else {
      this.canvas.width = window.innerWidth
    }

    if (document.body.scrollWidth > document.body.clientWidth) {
      this.canvas.height = window.innerHeight - 15
    }
    else {
      this.canvas.height = window.innerHeight
    }

  }

  drawBoundingBox(rect: DOMRect, color: string) {

    // Draw the bounding box on the html
    if (this.canvasContext instanceof CanvasRenderingContext2D){
      this.canvasContext.fillStyle = color
      this.canvasContext.fillRect(
        rect.x*0.995, 
        rect.y, 
        rect.width*0.95, 
        rect.height
      )
    }
  }

  drawCanvas() {

    for (let i = 0; i < this.aoiDatabase.meta.length; i++){
      // Extract the current level element data
      const entryRect = new DOMRect(
        Number(this.aoiDatabase.x[i]),
        Number(this.aoiDatabase.y[i]),
        Number(this.aoiDatabase.w[i]),
        Number(this.aoiDatabase.h[i])
      )
      const entryTag = this.aoiDatabase.tagName[i]

      // Obtain the color from the tags
      let color = this.options.tagColorMap.DEFAULT
      if (entryTag in this.options.tagColorMap) {
        color = this.options.tagColorMap[entryTag]
      }

      // Draw the bounding box
      this.drawBoundingBox(entryRect, color)
    }
  }

  captureAOI() {

    if (!this.isTracking) {
      this.isTracking = true

      // Reset the database
      this.aoiDatabase = {
        meta: [],
        tagName: [],
        uuid: [],
        x: [],
        y: [],
        w: [],
        h: [],
      }
      this.aoiCounter = 0
      
      // Prevent calling methods too fast (before the document is 
      // rendered correctly and fully)
      setTimeout(() => {
          
        // Track the desired elements
        for (let i = 0; i < this.options.toTrackElements.length; i++) {
          const toTrackElement = this.options.toTrackElements[i]
          this.trackElement(toTrackElement)
        }
        
        // Reconfigure the canvas as needed
        if (this.options.drawCanvas) {
          this.configureCanvas()
          this.drawCanvas()
        }

        // Broadcast information via the Emitter
        this.options.emitter.emit('aoiwebtracker', this.aoiDatabase)
        this.isTracking = false
          
      }, this.options.timeSpacing)
      
    }
  }


  trackElement(elementConfiguration: IElementConfiguration) {
      
    switch(elementConfiguration.searchBy){
      case "id": {
      
        const element = document.getElementById(elementConfiguration.searchName)
        if (element == null) {
          break
        }
        this.processElement(
          element,
          elementConfiguration,
          this.aoiCounter
        )

        break
      }

      case "tag": {

        const elements = document.getElementsByTagName(elementConfiguration.searchName)

        for (let i = 0; i < elements.length; i++) {
            
          const element = elements[i]
          this.processElement(
            element, 
            elementConfiguration,
            this.aoiCounter
          )

        }

        break
      }

      case "class": {
        const elements = document.getElementsByClassName(elementConfiguration.searchName)

        for (let i = 0; i < elements.length; i++) {
            
          const element = elements[i]
          this.processElement(
            element, 
            elementConfiguration,
            this.aoiCounter
          )

        }
      break
      }

      default: {
        console.log(elementConfiguration + " is invalid!")
      }
    }
  }


  isInViewPort(rect: DOMRect): boolean {
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) ||
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    )
  }


  processElement(element: HTMLElement | Element, configuration: IElementConfiguration, parentUuid: number) {

    // Determine if we need to save this element information
    let saveElementData = false
    
    if (configuration.saveChildren){
      saveElementData = true
    }
    else{
      switch(configuration.searchBy) {
        case "id": {
          if (element.id == configuration.searchName) {
            saveElementData = true 
          }
          break
        }
        case "class": {
          if (element.className == configuration.searchName){
            saveElementData = true
          }
          break
        }
        case "tag": {
          if (element.tagName == configuration.searchName) {
            saveElementData = true
          }
          break
        }
        default: {
          console.log(configuration + " is invalid!")
          return
        }
      }
    }
   
    // Get element rect, we will needed it regardless if we record the element
    const rect = element.getBoundingClientRect()
    let elementUuid = 0

    if (saveElementData) {
      // Get element information
      const conciseRect: ConciseDOMRect = {
        x: rect.x.toFixed(3),
        y: rect.y.toFixed(3),
        w: rect.width.toFixed(3),
        h: rect.height.toFixed(3)
      }
      elementUuid = this.aoiCounter
      this.aoiCounter += 1

      // Make an entry to the database ()
      this.aoiDatabase.meta.push('' + element.id + "," + element.className) 
      this.aoiDatabase.tagName.push(element.tagName)
      this.aoiDatabase.uuid.push(elementUuid.toString())
      this.aoiDatabase.x.push(conciseRect.x)
      this.aoiDatabase.y.push(conciseRect.y)
      this.aoiDatabase.w.push(conciseRect.w)
      this.aoiDatabase.h.push(conciseRect.h)

    } else {
      elementUuid = parentUuid
    }

    if (configuration.recursiveSearch && this.isInViewPort(rect)) {

      for (let i = 0; i < element.childElementCount; i++) {
        this.processElement(element.children[i], configuration, elementUuid)
      }

      if (this.tagWordCheck.includes(element.tagName)){

        // Look for word data
        let wordsRectData: Array<IWordRectData> = []
        for (let j = 0; j < element.childNodes.length; j++) {
          const node = element.childNodes[j]
          wordsRectData = wordsRectData.concat(this.wordSearching(node))
        }

        // If requested the containers, this could override the save criteria
        if (wordsRectData.length != 0 && configuration.saveWordContainers && !saveElementData) {
          
          // Get element information
          const conciseRect: ConciseDOMRect = {
            x: rect.x.toFixed(3),
            y: rect.y.toFixed(3),
            w: rect.width.toFixed(3),
            h: rect.height.toFixed(3)
          }
          elementUuid = this.aoiCounter
          this.aoiCounter += 1

          // Make an entry to the database ()
          this.aoiDatabase.meta.push('' + element.id + "," + element.className) 
          this.aoiDatabase.tagName.push(element.tagName)
          this.aoiDatabase.uuid.push(elementUuid.toString())
          this.aoiDatabase.x.push(conciseRect.x)
          this.aoiDatabase.y.push(conciseRect.y)
          this.aoiDatabase.w.push(conciseRect.w)
          this.aoiDatabase.h.push(conciseRect.h)

          // Marking that the words use this as the parent
          parentUuid = elementUuid
        }

        // If we found data, store it
        if (wordsRectData.length != 0 && configuration.saveWords) {
          for (let k = 0; k < wordsRectData.length; k++) {
 
            // Make word uuid
            const wordUuid = this.aoiCounter
            this.aoiCounter += 1

            // Make concise Rect information
            const conciseRect: ConciseDOMRect = wordsRectData[k].rectData

            // Make an entry to the database ()
            this.aoiDatabase.meta.push(wordsRectData[k].text) 
            this.aoiDatabase.tagName.push('TEXT')
            this.aoiDatabase.uuid.push(wordUuid.toString())
            this.aoiDatabase.x.push(conciseRect.x)
            this.aoiDatabase.y.push(conciseRect.y)
            this.aoiDatabase.w.push(conciseRect.w)
            this.aoiDatabase.h.push(conciseRect.h)
          }
        }
      }
    }
  }


  wordSearching(node: Node): Array<IWordRectData> {

    // Create Range object to find individual words
    const range = new Range()
    const wordsRectData: Array<IWordRectData> = []
    let nodeText: string | null = ''

    // Extract the text
    if (node.nodeName == "#text"){
      nodeText = node.nodeValue
    }
        
    // If empty, return immediately
    if (nodeText == '' || nodeText == null){
        return wordsRectData
    }
     
    const words = nodeText.split(" ")

    // For all text within the node, construct a range
    let textStartPointer = 0
    let textEndPointer = 0
    for (let j = 0; j < words.length; j++){

      // Select the word's range
      textEndPointer = textStartPointer + words[j].length
      range.setStart(node, textStartPointer)
      range.setEnd(node, textEndPointer)

      // Get word data and store
      const rect = range.getBoundingClientRect()
      const conciseRect: ConciseDOMRect = {
        x: rect.x.toFixed(3),
        y: rect.y.toFixed(3),
        w: rect.width.toFixed(3),
        h: rect.height.toFixed(3)
      }
      wordsRectData.push({
        rectData: conciseRect,
        text: words[j]
      })

      textStartPointer = textEndPointer + 1
    }

    return wordsRectData
  }
}
