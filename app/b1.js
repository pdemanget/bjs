// nothing

b.extend=function(me,o){
	for(k in o){
		me[k]=o[k];
	}
};

b.extend(b,{
	/**
	 * push to all input of document the attribute by input name
	 * 
	 */ 
	dummy: function(o){}
});
