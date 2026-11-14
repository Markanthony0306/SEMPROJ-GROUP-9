import openCvModule from '@techstark/opencv-js'
import Jscanify from 'jscanify/client'

// Keep OpenCV's thenable default out of the lazy import's top-level namespace.
export { openCvModule }
export const scanner = new Jscanify()
