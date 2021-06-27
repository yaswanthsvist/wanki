import { unzipSync } from 'fflate'
import { idb } from '@/plugins/idb.js'

export const decompressFile = async (file) => {
  if (!file) {
    throw new Error('No file defined')
  }

  const fileBuffer = await file.arrayBuffer()

  console.time('decompress')
  const decompressed = await new Promise((resolve) => {
    resolve(unzipSync(new Uint8Array(fileBuffer)))
  })
  console.timeEnd('decompress')

  console.time('parse')
  let valid = false
  const filesDecompressed = Object.keys(decompressed).map((key) => {
    let value = decompressed[key]
    let type = 'media'
    if (key === 'media') {
      type = 'mapping'
      value = JSON.parse(new TextDecoder().decode(value))
    }
    if (key === 'collection.anki2' || key === 'collection.anki21') {
      valid = true
      type = 'sql'
    }
    return { filename: key, file: value, type: type }
  })
  console.timeEnd('parse')

  if (!valid) {
    throw new Error('No valid anki file')
  }

  const mapped = {
    collection: null,
    media: {},
  }

  let files = []
  let media = []

  console.time('map')
  filesDecompressed.forEach((file) => {
    if (file.type === 'sql') {
      mapped.collection = file.file
    }

    if (file.type === 'mapping') {
      media = file.file
    }

    if (file.type === 'media') {
      files[file.filename] = file.file
    }
  })
  console.timeEnd('map')

  mapped.media = Object.values(media).map((m, index) => {
    return { name: m, file: files[index] }
  })

  return mapped
}

export const fun = async (parsedDeck) => {
  return async function play({ max = 5, start = 0, time = 600 } = {}) {
    for (let ii = 0; ii < max; ii++) {
      await new Promise((resolve) => {
        setTimeout(resolve, time)
      })
      try {
        ;(await media(parsedDeck)).play(ii + start)
      } catch (e) {
        console.error(e)
      }
    }
  }
}

export const media = async (parsedDeck) => {
  return async function play(index) {
    if (typeof index === 'string') {
      index = Object.values(parsedDeck.media).findIndex((a) => a === index)
    }

    const uint8 = parsedDeck.files[index]
    if (!uint8) {
      throw new Error(
        'Could not find media with index ' +
          index +
          ' in filelength ' +
          parsedDeck.files.length,
      )
    }

    const blob = new Blob([uint8.buffer])

    const url = await URL.createObjectURL(blob)
    const audio = new Audio()
    audio.src = url
    return audio.play()
  }
}
