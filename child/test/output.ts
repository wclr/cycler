const out = process.argv[2]

console.log(out)
setTimeout(() => {
  console.log(out)
  setTimeout(() => {
    console.log(out)
  }, 50)
}, 50)
