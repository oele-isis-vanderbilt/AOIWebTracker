// Third-party
import mitt, { Emitter } from 'mitt'

export interface IElementConfiguration {
  searchBy: 'id' | 'tag' | 'class'
  searchName: string
  recursive: boolean
  wordLevel: boolean
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
  timeSpacing: 100
} as IOptions

interface IWordRectData {
  rectData: DOMRect
  text: string
}

interface IResponseRectData {
  tagName: string
  elementRect: DOMRect
  childrenRectData: Array<IResponseRectData>
  wordsRectData: Array<IWordRectData>
}

export default class AOIWebTracker {
  options: IOptions
  canvas: HTMLCanvasElement
  canvasContext: CanvasRenderingContext2D | null
  tagWordCheck: Array<string>
  aoiDatabase: Array<any>
  isTracking: boolean

  constructor() {
  
    // Initial values of state variables
    this.options = defaultOptions
    
    // Set that the canvas covers the entire page so we can draw anywhere
    this.canvas = document.createElement('canvas')
    this.canvas.style.width = '100vw'
    this.canvas.style.height = '100vh'
    this.canvas.width = window.innerWidth
    this.canvas.height = window.innerHeight
    this.canvas.style.position = 'fixed'
    this.canvas.style.left = '0'
    this.canvas.style.top = '0'
    // this.canvas.margin = '0'
    // this.canvas.padding = '0'
    this.canvas.style.zIndex='1000000'
    this.canvas.style.pointerEvents='none'

    // Get the context
    this.canvasContext = this.canvas.getContext('2d')
    
    // Appending the canvas to the document
    document.body.appendChild(this.canvas)

    // List of tags to look and check for words
    this.tagWordCheck = ['P', 'A', 'H1', 'H2', 'H3', 'H4', 'H5', 'SPAN']
    this.aoiDatabase = []
    this.isTracking = false
  }
    
    // Install required for Vue Plugin
  install(options: IOptions) {

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
      this.canvasContext.fillRect(rect.x, rect.y, rect.width, rect.height)
    }
  }

  drawCanvas(elementsRectData: Array<IResponseRectData>) {

    for (let i = 0; i < elementsRectData.length; i++){
      // Extract the current level element data
      const elementRect = elementsRectData[i]

      // Obtain the color from the tags
      let color = this.options.tagColorMap.DEFAULT
      if (elementRect.tagName in this.options.tagColorMap) {
        color = this.options.tagColorMap[elementRect.tagName]
      }

      // Draw the bounding box
      this.drawBoundingBox(elementRect.elementRect, color)

      // Draw children if available
      if ("childrenRectData" in elementRect){
        this.drawCanvas(elementRect.childrenRectData)
      }

      // Draw words if available
      if ("wordsRectData" in elementRect){
        color = this.options.tagColorMap.TEXT
        for (let j = 0; j < elementRect.wordsRectData.length; j++){
          this.drawBoundingBox(elementRect.wordsRectData[j].rectData, color)
        }
      }
    }
  }

  captureAOI() {

    if (!this.isTracking) {
      this.isTracking = true
      
      // Prevent calling methods too fast (before the document is 
      // rendered correctly and fully)
      setTimeout(() => {
          
        // Track the desired elements
        for (let i = 0; i < this.options.toTrackElements.length; i++) {
          const toTrackElement = this.options.toTrackElements[i]
          this.aoiDatabase[i] = this.trackElement(toTrackElement)
        }
        
        // Reconfigure the canvas as needed
        if (this.options.drawCanvas) {
          this.configureCanvas()
          for (let i = 0; i < this.options.toTrackElements.length; i++) {
            this.drawCanvas(this.aoiDatabase[i])
          }
        }

        // Broadcast information via the Emitter
        this.options.emitter.emit('aoiwebtracker', this.aoiDatabase)
        this.isTracking = false
          
      }, this.options.timeSpacing)
      
    }
  }


  trackElement(elementConfiguration: IElementConfiguration): Array<IResponseRectData> {
      
    const elementsRects: Array<IResponseRectData> = []

    // if ("class" in elementConfiguration) {
    switch(elementConfiguration.searchBy){
      case "id": {
      
        const element = document.getElementById(elementConfiguration.searchName)
        if (element == null) {
          return elementsRects
        }
        const rectInfo = this.getRectInfo(
          element,
          elementConfiguration.recursive,
          elementConfiguration.wordLevel
        )
        elementsRects.push(rectInfo)

        break
      }

      case "tag": {

        const elements = document.getElementsByTagName(elementConfiguration.searchName)

        for (let i = 0; i < elements.length; i++) {
            
          const element = elements[i]
          const rectInfo = this.getRectInfo(
            element, 
            elementConfiguration.recursive, 
            elementConfiguration.wordLevel
          )
          elementsRects.push(rectInfo)

        }

        break
      }

      case "class": {
        const elements = document.getElementsByClassName(elementConfiguration.searchName)

        for (let i = 0; i < elements.length; i++) {
            
          const element = elements[i]
          const rectInfo = this.getRectInfo(
            element, 
            elementConfiguration.recursive, 
            elementConfiguration.wordLevel
          )
          elementsRects.push(rectInfo)

        }
      break
      }

      default: {
        console.log(elementConfiguration + " is invalid!")
      }
    }
    return elementsRects
  }


  isInViewPort(rect: DOMRect): boolean {
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) ||
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    )
  }


  getRectInfo(element: HTMLElement | Element, recursive: boolean, wordLevel: boolean): IResponseRectData {

    const responseRectData = {
      tagName: element.tagName,
      elementRect: element.getBoundingClientRect(),
      childrenRectData: [],
      wordsRectData: []
    } as IResponseRectData

    if (recursive && this.isInViewPort(responseRectData.elementRect)) {

      for (let i = 0; i < element.childElementCount; i++) {
        responseRectData.childrenRectData.push(this.getRectInfo(element.children[i], recursive, wordLevel))
      }

      if (this.tagWordCheck.includes(element.tagName)){

        // Look for word data
        let wordsRectData: Array<IWordRectData> = []
        for (let j = 0; j < element.childNodes.length; j++) {
          const node = element.childNodes[j]
          wordsRectData = wordsRectData.concat(this.wordSearching(node))
        }

        // If we found data, store it
        if (wordsRectData.length != 0) {
          responseRectData.wordsRectData = wordsRectData
        }
      }
    }

    return responseRectData
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
      wordsRectData.push({
        rectData: rect,
        text: words[j]
      })

      textStartPointer = textEndPointer + 1
    }

    return wordsRectData
  }
}
