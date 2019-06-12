clear_node = node =>{
    while (node.firstChild){
        node.removeChild(node.firstChild);
    }
}
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
        this.writing = false;
        this.max_queue = max_queue;
        this.speed_modifier = document.querySelector('#typing_speed_control').value;
        this.cancel = false;
        this.caret ='<span class="caret">\u2588</span>';
        this.pause_length = 500;
    } // constructor end

    set typing_speed(new_val){
        this.speed_modifier = new_val;
    }

    _inner_write(text, text_speed){
        // This function actually writes to the output element defined in the constructor.
        // Check if writing flag is active. If so, cancel write
        if (this.writing){
            return
        }
        // Mark writing flag
        this.writing = true

        // Index and trail are necessary outside of setInterval scope in order to refer to them
        // on each iteration
        let index=0;
        let iteration_delay = this.speed_modifier
        clear_node(this.html_node);
        /*while(this.html_node.firstChild){
            this.html_node.removeChild(this.html_node.firstChild);
        }*/
        let output_wrapper = this.html_node;
        // Start writing to the output html element
        // The function forms a closure which is needed for the async execution
        const write_to_node = () =>{
            if (this.speed_modifier <= 0){
                this.html_node.innerHTML = text + this.caret;
                let navlinks = this.html_node.querySelectorAll('.section_navlink');
                console.log(navlinks)
                let nav_container = document.querySelector('#secondary_nav');
                clear_node(nav_container);
                for(let node of navlinks){
                    node.parentNode.removeChild(node);
                    nav_container.appendChild(node);
                }
                this.writing = false;
                return;
            }
            if (this.cancel){
                this.writing = false;
                this.cancel = false;
                if(this.queue.length > 0){
                    let next = this.queue.shift();
                    this._inner_write(next.text)
                }
                return
            }
            try{
                if (output_wrapper.lastChild.classList.contains('caret')){
                    output_wrapper.removeChild(output_wrapper.lastChild);
                }
            } catch{
                
            }
            let next_char = text[index];
            let start_index = 0;
            if (next_char === '<'){
                let block_append = false;
                let block_traverse = false;
                let old_index = index;
                // Find the end of the tag
                index = text.indexOf('>', index);
                let tag = text.substring(old_index, index+1)
                console.log(`Found tag: ${tag}`)
                console.log(output_wrapper)
                if (tag.match(/<\w+[\s\w=#_"+'.:/\-]*\/?>/)){
                    // Tag is an opening tag
                    // Check for details tag
                    if (tag.match(/<li.*>/)){
                        // If details tag is matched, find the closing tag
                        index = text.indexOf('</li>',index+1)
                        // Find the index of the last > of the tag
                        index = text.indexOf('>', index+1);
                        // Collect the entire contents of the details tag
                        tag = text.substring(old_index, index+1);
                        iteration_delay = 250;
                        block_traverse;
                        
                    /*} else if(tag.match(/<details.*>/)){
                        index = text.indexOf('</details>',index)
                        // Find the index of the last > of the tag
                        index = text.indexOf('>', index);
                        // Collect the entire contents of the details tag
                        tag = text.substring(old_index, index+1);
                        iteration_delay = 250;
                    */
                    }else if(tag.match(/<a\b.*>/)){
                        console.log('Anchor tag found')
                        let new_index = text.indexOf('</a>', index);
                        new_index = text.indexOf('>', new_index);
                        let new_tag = text.substring(old_index,new_index+1);
                        console.log('Complete tag')
                        console.log(new_tag);
                        if (new_tag.match(/class=\s?["']{1}section_navlink["']{1}/)){
                            console.log('Found navlink')
                            iteration_delay=0;
                            let nav_element = document.createRange().createContextualFragment(new_tag);
                            let nav_container = document.querySelector('#secondary_nav');
                            
                            nav_container.appendChild(nav_element);
                            block_append=true;
                            index = new_index;
                        }
                    }
                    else
                        iteration_delay = 0;
                    if (!block_append){
                        let temp = document.createRange().createContextualFragment(tag);
                        output_wrapper.appendChild(temp);
                    }
                    if(!tag.match(/<img[\D\d\s]*>/) && !block_append){
                        // Set new node as output node if it is not an image. Currently only images are
                        // supported as single tag elements
                        output_wrapper = output_wrapper.lastChild;
                    }
                        
                } else if(tag.match(/<\/\w+[\s\w=#_+"'.:/\-]*>/)){
                    //Closing tag
                    output_wrapper = output_wrapper.parentElement;
                }else if(tag.match(/<!\-\-.*\-\->/)){
                    // Matching a html comment do nothing
                } else{
                    throw('HTML tag parsing error');
                }
            }
            else{
                iteration_delay = this.speed_modifier;
                if(!output_wrapper.classList.contains('no_type')) // This if prevents the image from "blinking" because of re-rendering of the base node
                    output_wrapper.innerHTML += next_char + this.caret;
            }
            index++;
            
            if (index < text.length){
                setTimeout(write_to_node, iteration_delay);
            }
            else{
                //Insert the final caret
                let caret_element = document.createRange().createContextualFragment(this.caret);
                output_wrapper.lastChild.appendChild(caret_element);
                this.writing = false;
                return
            }
        }
        write_to_node();
    }
            
    write(text, text_speed){
        // write checks the writing flag and if something is already being written to the output
        // it stores the new write command in it's internal queue, provided it's not at capacity of course.
        // If output is currently not being written to, automatically starts writing to the output.
        let out_text = text.trim().replace(/[\n ]{1,}/g, " ");
        if (out_text[0] !== "<"){
            // Ensure that input text is wrapped in a html tag
            out_text = `<span>${out_text}</span>`
        }
        if (this.writing){
            this.cancel = true;
            this.queue.push({'text': out_text, 'text_speed': text_speed});
        }
        else 
            this._inner_write(out_text, text_speed);

    } // write method end
} // class Output definition end

const scroll_handler = event => {
    // Check for secondary navbar position
    let secondary_nav = document.querySelector('#secondary_nav');
    let navbar_pos = secondary_nav.offsetTop;
    if (window.pageYOffset >= navbar_pos ){ //&& navbar_pos.firstChild){
        secondary_nav.classList.add('sticky')
    }
    else{
        secondary_nav.classList.remove('sticky')
    }

}

// Global variables
let initial_state = true;
let output;
function write(text, text_speed=500){
    output.write(text, text_speed);
}

function assign_listeners(){
    let section_links = document.querySelectorAll('.section_select');

    section_links.forEach(element => element.addEventListener('click', event=>{
        if (output.writing){
            output.cancel = true;
        }
        // Turns of initial state animations such as blinking links
        initial_state = false;
        clear_node(document.querySelector('#secondary_nav'))
    }));
    document.querySelector('#introduction_link').addEventListener('click', event => {
        let intro = document.querySelector('#introduction');
        write(intro.innerHTML);
    });
    document.querySelector('#skills_link').addEventListener('click', event => {
        let skills_section = document.querySelector('#skills');
        write(skills_section.innerHTML);
    });

    document.querySelector('#knowledge_link').addEventListener('click', event => {
        let knowledge_section = document.querySelector('#knowledge');
        write(knowledge_section.innerHTML);
    });
    document.querySelector('#portfolio_link').addEventListener('click', event => {
        let portfolio_section = document.querySelector('#portfolio');
        let links = portfolio_section.querySelectorAll('.section_navlink');
        let navlink_container = document.querySelector('#secondary_nav');
        for (let link of links){
            link.parentNode.removeChild(link);
            navlink_container.appendChild(link)
        }
        document.querySelector('#std_out').innerHTML = portfolio_section.outerHTML;
    })
    document.querySelector('#cv_link').addEventListener('click',event => {
        let cv_section = document.querySelector('#cv');
        let output_element = document.querySelector('#std_out')
        output_element.innerHTML = '<span class="command">show CV</span>' + cv_section.outerHTML;
    });
    
    document.querySelector('#typing_speed_control').addEventListener('change', event =>{
        output.typing_speed = event.target.value;
    })

    window.addEventListener('scroll', scroll_handler);

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
    let intro = document.querySelector('#introduction');
    write(intro.innerHTML);
    
    // Temporär
    //document.querySelector('#cv_link').click();

})

