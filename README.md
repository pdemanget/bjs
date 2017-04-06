bjs
===

bjs javascript framework


Installation Note
=================
init project:
adding files .bowerrc package.json bower.json

Usage
=====

starting
--------
This html page will load index.yml

    <script src="b0.js"></script>
    <script>
    b.page('index');
    </script>

Then in yml use syntax:

page syntax
-----------
    
    - h1: titre
    #comment
    - div:
      - div with subdivs
      - div:
          class: cssClass
          text: 
           - aa

    - br: 
    - button:
        onclick: b.page('page3')
        text: page3
        
The generic pattern is that we use a list, using '-' character in yml
 - then the only attribute name is the tag name, the attributes of the containing object are the XML attributes, 
 - and then the content (subtags and so on) are in the "text" attributes
 
Shortcut method: if a tag only contains text, there is no need to create an object containing text:""

bindings
--------
Display js value

    <div id="message" name="message" bvalue></div>
    or
    <bvalue name="message"/>


see the attribute name="message", it will be bound with the "message" attribute of an object with tis syntax:

    b.dataBind({message:"test"});

B methods

dataBind
pushForm
pullForm



