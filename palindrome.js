
export function palindromeChecker(word) {
    let isPalindrome = ''
    let low = word.toLowerCase()
    for (let i = 0; i<low.length; i++) {
        if(low[i]==low[low.length-(i+1)]) {
            isPalindrome = true
        } else {
            isPalindrome = false
        }
    }
    // console.log(`Is ${low} a palindrome ? Answer = ${isPalindrome}`)
    // console.log(isPalindrome)
    return isPalindrome
}
