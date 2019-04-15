let text="Hello this is just a simple text gadfgaertadfb  taer  g adg f ert  adfg";
console.log('loaded')


function t(){
    let w = document.querySelector('#write')
    let index = 0;
    let interval = setInterval(() => {
        w.innerHTML += text[index];
        ++index;
        if (index === text.length)
            clearInterval(interval);
    }, 1);
}