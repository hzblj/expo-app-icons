declare module 'jimp-compact' {
  type Pixel = {r: number; g: number; b: number; a: number}
  class Jimp {
    constructor(width: number, height: number, background: string | number)
    static MIME_PNG: string
    static read(source: string | Buffer): Promise<Jimp>
    static cssColorToHex(color: string): number
    static intToRGBA(color: number): Pixel
    bitmap: {width: number; height: number}
    composite(image: Jimp, x: number, y: number): this
    circle(): this
    getBufferAsync(mime: string): Promise<Buffer>
    getPixelColor(x: number, y: number): number
    writeAsync(path: string): Promise<this>
  }
  export default Jimp
}
