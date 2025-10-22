
export function space(phrase){
    let wordNum = []
    for (let i=0; i<phrase.length; i++) {
        if (phrase[i] == ' ') {
            // console.log("empty")
            wordNum.push(phrase[i])
            
        } else {
            // console.log("not empty")
        }
    }
    // console.log(wordNum.length+1)
    return wordNum.length+1
}
