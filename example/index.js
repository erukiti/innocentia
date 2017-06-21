const Hoge = require('./typescript').default
const fuga = require('./javascript')

const hoge = new Hoge()
const hp = fuga(hoge)
document.getElementById('root').innerHTML = `<span>${hp}</span>`
