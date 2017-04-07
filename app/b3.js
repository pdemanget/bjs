/**
 b3.js bjs component layer
 Licence LGPLv3 2015
 * 
 * Main function are
 * 
 * addLink() in conjonction with links
 * sfield
 * 
 d.js API:
 links: object<function()> map of onclick callback
 button: function
 sfield:
 label:
 
 pseudo-directive: 
  1. scan bind attribute: loop on DOM, add onchange  event when input/select/textarea found.
  2. scan bind value == {{}} keep variable on element when found:Algo
	when {{}} found change to dom element value
	when value found store Dom element for future change
	when change do apply
	on apply set innerHtml to value elements.
 
 */

d=new function(){
this.extend=function(me,o){
	for(k in o){
		me[k]=o[k];
	}
};
var me=this;
this.extend(this,{
	links: {},
	button: function(value,onclick){
		me.links[value]=onclick;
		return '<input type="button" class="btn" name="'+value+'" value="'+value+'"/>';
	},
	addLink: function(){
		for(link in me.links){
			console.log(link);
			document.getElementsByName(link)[0].addEventListener("click", me.links[link]);
		}
	},
	sfield: function(field, input){
		return '<div class="centered"><label>'+field+': </label>'+
				'<select name="'+input+'"> <option>Human</option><option>Computer</option></select></div>';
	},
	label: function(title, value){
		return '<div class="centered"><label>'+title+': </label>'+
				'<span>'+value+' </span></div>';
	},

	insertTag: true,
	prettyPrint: true,



}

);//eof extends
}//eof functiond

