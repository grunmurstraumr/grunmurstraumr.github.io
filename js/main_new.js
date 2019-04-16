
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
        this.writing = false;
        this.max_queue = max_queue;
        this.speed_modifier = 100;
        this.cancel = false;
        this.caret = '<span class="caret">\u2588</span>';
    } // constructor end

    set typing_speed(new_val){
        this.speed_modifier = new_val;
    }
    _parse_tags(text){
        
    }
    _inner_write(text, text_speed){
        // This function actually writes to the output element defined in the constructor.
        
        // Check if writing flag is active. If so, cancel write
        if (this.writing){
            return
        }
        this.writing = true
        // Reset html to initial value, definied in html
        this.html_node.innerHTML = this.initial_value;

        // Index and trail are necessary outside of setInterval scope in order to refer to them
        // on each iteration
        let index = 0;
        let trail = "";
        let tag = "";
        let inside_tag = "";

        // Start writing to the output html element
        // The function forms a closure which is needed for the async execution
        const write_to_node = () =>{
            // Remove trailing tags and caret.
            //console.log(`Tag: ${tag}\nTrail: ${trail}\nInside: ${inside_tag}`);
            if (this.speed_modifier <= 0){
                this.html_node.innerHTML = text + this.caret;
                this.writing = false;
                return;
            }
            if (trail !== ""){
                this.html_node.innerHTML = this.html_node.innerHTML.slice(0, (this.html_node.innerHTML.length-(tag.length+inside_tag.length+trail.length+this.caret.length)));
            }
            else{
                this.html_node.innerHTML = this.html_node.innerHTML.slice(0,this.html_node.innerHTML.length-this.caret.length);
            }
            let next_char = text[index];
            // First check for special cases:
            // replace newlines with spaces  
            /*          
            if (next_char === "\n"){
                next_char = " ";
            }
            */
            console.log(`Next char is: ${next_char}`);
            //console.log(`index is : ${index}`);

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
                    
                    inside_tag ="";
                    tag += next_char;
                    trail += next_char.splice(1,0, '/');
                    let white_space_index = trail.indexOf(' ');
                    // Remove anything inside the tag trailing a space, otherwise classes end up in closing tag as well
                    if (white_space_index > 0){
                        trail = trail.splice(white_space_index, trail.length-white_space_index-1,'');
                    }
                    next_char="";
                }
                else{
                    console.log('Tag else');
                    next_char = `${tag}${inside_tag}${trail}`;
                    tag = "";
                    trail ="";
                    inside_tag ="";
                }
                //console.log(`next_char ${next_char} and trail ${trail}`)
                
            }
            // If character to be written is a space, skip one iteration and print both the space
            // and the next character. A check is made to ensure that the next character is actually valid
            else if (next_char === ' ' && text[index+1] !== undefined){
                // Since we skip an iteration we need to increment index twice, first here and second time at the end of the function
                
                while(text[index+1] === ' '){
                    ++index;
                }
                
                //++index;
                next_char += text[index]
                // This condition is special, browser may collapse the leading space if we do not do
                //this.html_node.innerHTML += ' ' + 
            }
            console.log(`Before adding inside tag: ${next_char}`)
            if (tag !== ""){
                inside_tag += next_char;
                next_char = inside_tag;
            }
            //console.log(`Output: ${tag}${next_char}${this.caret}${trail}`)
            //console.log(`Node text: \n ${this.html_node.innerHTML}`)
            console.log(`Wrote ${next_char.length} charaters`);
            console.log(next_char);
            this.html_node.innerHTML += `${tag}${next_char}${this.caret}${trail}`;
            
            ++index;

            // Check whether there are more iterations to be made, if we printed the last character
            // clear the interval, toggle css-classes, toggle writing flag and check if there is 
            // new text to be written in the queue.
            if (index >= text.length || this.cancel){
                //clearInterval(this.interval);
                this.cancel = false;
                this.writing = false;
                if (this.queue.length > 0){
                    // This is executed if text is waiting in the queue. Set a timeout for the call to
                    // _inner_write to have a delay before the next texts is written.
                    let call = this.queue.shift();
                    this._inner_write(call.text, call.text_speed);
                    return;
                }
            }
            else 
                setTimeout(write_to_node, this.speed_modifier);
        };// end function def, this.speed_modifier); // end interval
        setTimeout(write_to_node, this.speed_modifier)
    } //end method _inner_write

    write(text, text_speed){
        // write checks the writing flag and if something is already being written to the output
        // it stores the new write command in it's internal queue, provided it's not at capacity of course.
        // If output is currently not being written to, automatically starts writing to the output.
        let out_text = text.trim().replace(/[\n ]{1,}/g, " ");
        console.log(out_text);
        if (this.writing){
            this.cancel = true;
            this.queue.push({'text': out_text, 'text_speed': text_speed});
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
    output.write(text, text_speed);
}

function assign_listeners(){
    document.querySelector('#introduction_link').addEventListener('click',(event) => {
        //Check if app is in initial state, if so toggle it out of the initial state
        if (initial_state){
            initial_state = false;
            //document.querySelector('#cmd_out').classList.remove('caret_pos', 'caret_blink');
        }
        let intro = document.querySelector('#introduction');
        write(intro.innerHTML.trim());
        //tw.deleteAll(0);
        //tw.typeString(intro.innerHTML.trim().replace(/ {1,}/g, " ")).start()
    });
    document.querySelector('#b').addEventListener('click',(event) => {
        write("This is text B.<p>New paragraph</p><h1><span>And a heading!</span></h1>", 50);
    });
    document.querySelector('#c').addEventListener('click',(event) => {
        write("This is text C.");
    });
    
    document.querySelector('#typing_speed_control').addEventListener('change', event =>{
        output.typing_speed = event.target.value;
    })

}
let tw;
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
    output.write("Hej Tromb!\nKlicka på länkarna ovanför för att se min ansökan!");
    let out = document.querySelector('#std_out_wrapper');
    //console.log(out);
    //tw = new Typewriter(out,{delay: 1, cursor: '\u2588'});
})