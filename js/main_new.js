/*
const sleep = (sleep_time) => {
    return new Promise(resolve => setTimeout(resolve, sleep_time));
}
let std_out_lock = false;
*/


class Output{
    // This class manages writing to an html element in a typing style. A class is used in order to ensure that
    // two texts are not written to the element at the same time due to the asynchronous nature of the setInterval
    // function. This class is basically in lieu of a lock synchronisation mechanism in JS.
    constructor(node_id, max_queue=5){
        this.html_node = document.querySelector(`#${node_id}`);
        // Above may fail if html is changed so it is important that the constructor throws an error if that occurs
        if (this.html_node === undefined || this.html_node === null)
            throw(`DOM error. No node with '${node_id}' found.`)
        this.queue = []
        this.initial_value = this.html_node.innerHTML;
        this.interval;
        this.writing = false;
        this.max_queue = max_queue;
        this.speed_modifier = 100;
        // this.classes contains two types of classes. One to be used on html element when writing and the other set when
        // not writing. At least on element is necessary in the array in order to not require checks before add or removing
        // from the classlist during/after writing
        this.classes = {'active': ['caret_pos'], 'inactive':['caret_blink']};
    } // constructor end

    set typing_speed(new_val){
        this.speed_modifier = new_val;
    }
    _inner_write(text, text_speed){
        // This function actually writes to the output element defined in the constructor.
        
        //Check if app is in initial state, if so toggle it out of the initial state
        if (initial_state){
            initial_state = false;
            //document.querySelector('#cmd_out').classList.remove('caret_pos', 'caret_blink');
        }
        // Reset html to initial value, definied in html
        this.html_node.innerHTML = this.initial_value;
        // Add classes designated for the outputs activated state, i.e writing to the output element
        // and remove classes for the inactive state
        this.html_node.classList.add(this.classes.active);
        this.html_node.classList.remove(this.classes.inactive);
        this.writing = true

        // Index and trail are necessary outside of setInterval scope in order to refer to them
        // on each iteration
        let index = 0;
        let trail = "";
        let tag = "";
        let inside_tag = "";

        // Start writing to the output html elementW
        this.interval = setInterval(()=>{
            if (trail !== ""){
                this.html_node.innerHTML = this.html_node.innerHTML.slice(0, this.html_node.innerHTML.length-(tag.length+inside_tag.length+trail.length));
            }
            let next_char = text[index];
            // First check for special cases:
            // If the character is <, it is the start of a html tag. These are allowed and we must therefore
            // iterate through and collect all characters until we reach the > that closes the tag.
            if (next_char === '<'){
                do{
                    ++index
                    next_char += text[index];
                } while(text[index] != '>')
                //Check if this is a closing tag, if not we must assign corresponding closing tag as a trailing tag, otherwise
                // we weill get automatic closing of the tag.
                if(next_char[1] !== '/'){
                    console.log(`next_char ${next_char} and trail ${trail}`)
                    inside_tag ="";
                    tag += next_char;
                    trail += next_char.splice(1,0, '/');
                    next_char="";
                }
                else{
                    next_char = `${tag}${inside_tag}${trail}`;
                    tag ="";
                    trail ="";
                    inside_tag ="";
                }
                
            }
            // If character to be written is a space, skip one iteration and print both the space
            // and the next character. A check is made to ensure that the next character is actually valid
            if (text[index] === ' ' && text[index+1] !== undefined){
                // Since we skip an iteration we need to increment index twice, first here and second time at the end of the function
                ++index; 
                next_char += text[index]
                // This condition is special, browser may collapse the leading space if we do not do
                //this.html_node.innerHTML += ' ' + 
            }
            // If line breaks are present in the text to be printed, ensure that they are also written to the output with the <br> tag.
            // The browser will otherwise collapse the newline since it thinks it's unnecessary.
            else if (next_char === '\n')
                next_char += '<br/>'

            if (tag !== ""){
                inside_tag += next_char;
                next_char= inside_tag
            }
            this.html_node.innerHTML += `${tag}${next_char}${trail}`;
            
            ++index;

            // Check whether there are more iterations to be made, if we printed the last character
            // clear the interval, toggle css-classes, toggle writing flag and check if there is 
            // new text to be written in the queue.
            if(index >= text.length){
                clearInterval(this.interval);
                this.html_node.classList.remove(this.classes.active)
                this.html_node.classList.add(this.classes.inactive);
                this.writing = false;
                if (this.queue.length > 0){
                    // This is executed if text is waiting in the queue. Set a timeout for the call to
                    // _inner_write to have a delay before the next texts is written.
                    setTimeout(()=>{
                    let call = this.queue.shift();
                    this._inner_write(call.text, call.text_speed);
                }, 1000); //end timeout
                }
            }
        }, this.speed_modifier); // end interval
    } //end method _inner_write

    write(text, text_speed){
        // write checks the writing flag and if something is already being written to the output
        // it stores the new write command in it's internal queue, provided it's not at capacity of course.
        // If output is currently not being written to, automatically starts writing to the output.
        if (this.writing){
            if(this.queue.length >= this.max_queue)
                return false;
            else
                this.queue.push({'text': text, 'text_speed': text_speed});
        }
        else{
            this._inner_write(text, text_speed);
        }
    } // write method end
} // class Output definition end



// Global variables
let initial_state = true;
let output;
function write(text, text_speed=500){
    //let text= //"Hello this is just a simple text gadfgaertadfb  taer  g adg f ert  adfg";
    output.write(text, text_speed);
   /* let inner = function t(){
        document.querySelector('#cmd_out').classList.remove('caret_pos');

        let w = document.querySelector('#std_out')
        //Hold if std_out is locked

        //Acquire lock
        w.classList.add('caret_pos');
        w.innerHTML = "";
        let index = 0;
        let interval = setInterval(() => {
            w.innerHTML += text[index];
            ++index;
            if (index === text.length){
                clearInterval(interval);
                console.log(interval)
            }
        }, text_speed);
    }
    inner();*/
}

function assign_listeners(){
    document.querySelector('#a').addEventListener('click',(event) => {
        write("This is text A.\n\n\nThere should be three new lines too..");
    });
    document.querySelector('#b').addEventListener('click',(event) => {
        write("This is text B.<p>New paragraph</p><h1><span>And a heading!</span></h1>", 50);
    });
    document.querySelector('#c').addEventListener('click',(event) => {
        write("This is text C.");
    });
    
    document.querySelector('#typing_speed_control').addEventListener('change', event =>{
        output.typing_speed = event.target.value;
        document.querySelector('#typing_speed_display').innerHTML = (1000/event.target.value).toFixed(2);
    })

}

document.addEventListener('DOMContentLoaded', () =>{
    // Start executing when the DOM is fully loaded. 
    assign_listeners();    
    output = new Output('std_out');
    let sections = Array.from(document.querySelectorAll('.section_select'));
    let i = 0;
    let interval = setInterval(()=>{
    let class_name = 'highlight_selection';
        if (!initial_state){
            sections.map(element => element.classList.remove(class_name));
            clearInterval(interval);
            return;
        }
        sections[i].classList.add(class_name);
        if (i === 0){
            sections[sections.length-1].classList.remove(class_name);
        }
        else{
            sections[i-1].classList.remove(class_name);
        }

        i++;
        if (i === sections.length)
            i = 0;

    },500);
    output.write("Hej Tromb!", 250);
})