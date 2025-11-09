const filePath = process.argv[2]
const fun = process.argv[3]
const args = process.argv[4] ? JSON.parse(process.argv[4]) : []
const callback = process.argv[5] === 'callback'

import(filePath).then(async (m) => {
  if (callback) {
    await m[fun](...args, (msg: any) => {
      process.send!(msg)
    })
  } else {
    const result = await m[fun](...args)
    process.send!(result)
  }
})
