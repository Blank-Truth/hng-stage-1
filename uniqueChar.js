// const value = "still"
// function unique(phrase){
//     let char = []
//     for (let i=0; i<phrase.length; i++) {
//         char.push(phrase[i])
//     }
//     console.log(char)
//     f
// }

// unique(value)

export function uniqueCharCount(str) {
  return new Set(str.toLowerCase()).size;
}
