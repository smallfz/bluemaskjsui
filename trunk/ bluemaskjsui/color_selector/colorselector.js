/*
	Color select box
	-------------------------------------------
	Copyright(c) 2010 bluemask.net
	Author: small.fz@gmail.com
*/

var ColorSelector={
	_click_handlers: [],
	ExecClickHandler: function(obj, handler_id){
		for(var i=0;i<this._click_handlers.length;i++){
			var h = this._click_handlers[i];
			if(h.id == handler_id){
				h.handler(obj);
			}
		}
	},
	isIE6: function(){
		return navigator.userAgent.match(/MSIE\s[678]/);
	},
	GetAbsPos: function(obj){
		if(!obj){ return {x:0, y:0}; }
		if(obj.offsetParent){
			var parent_pos = this.GetAbsPos(obj.offsetParent);
			return {x:obj.offsetLeft + parent_pos.x, y:obj.offsetTop + parent_pos.y};
		}else{
			return {x:obj.offsetLeft, y:obj.offsetTop};
		}
	},
	/*BaseColors:[
		{r:192, g:192, b:192}, 
		{r:255, g:0, b:0},
		{r:255, g:153, b:0},
		{r:255, g:255, b:0},
		{r:51, g:255, b:51},
		{r:0, g:204, b:204},
		{r:51, g:102, b:255},
		{r:102, g:51, b:255},
		{r:204, g:102, b:204}
	],*/
	//_deeps: [0.65, 0.6, 0.4, 0.2, 1, -0.1, -0.3, -0.5, -0.7],
	ColorTable:[],
	_ColorTableCreated:false,
	ColorMotion: function(c1, c2, count){
		if(count<1){ count=1; }
		var steps = {r:c2.r-c1.r, g:c2.g-c1.g, b:c2.b-c1.b};
		steps.r = (steps.r)/count;
		steps.g = (steps.g)/count;
		steps.b = (steps.b)/count;
		var list=[];
		for(var i=0;i<count-1;i++){
			list.push({
				r: parseInt(c1.r+steps.r*i), 
				g: parseInt(c1.g+steps.g*i), 
				b: parseInt(c1.b+steps.b*i)
			});
		}
		list.push(c2);
		return list;
	},
	AutoColorMotion: function(c, count, cuthead){
		if(count<3){ count = 3; }
		var partcount = parseInt(count/2);
		var all=[];
		var light = this.ColorMotion({r:255, g:255, b:255}, c, partcount);
		var havy = this.ColorMotion(c, {r:0, g:0, b:0}, partcount);
		havy.shift();
		all = light.concat(havy);
		if(cuthead){ all.shift(); all.pop(); }
		return all;
	},
	InitColors:function(){
		if(!this._ColorTableCreated){
			this.ColorTable=[];
			/*var deeps = this._deeps;
			for(var i=0;i<this.BaseColors.length;i++){
				bc = this.BaseColors[i];
				var row = [];
				for(var j=0;j<deeps.length;j++){
					d = deeps[j];
					if(d!=1){
						var dv = parseInt(255 * d);
						var nc = {r:bc.r+dv, g:bc.g+dv, b:bc.b+dv};
						if(nc.r>255){ nc.r=255; }else if(nc.r<0){ nc.r = 0; }
						if(nc.g>255){ nc.g=255; }else if(nc.g<0){ nc.g = 0; }
						if(nc.b>255){ nc.b=255; }else if(nc.b<0){ nc.b = 0; }
						row.push(nc);
					}else{
						row.push(bc);
					}
				}
				this.ColorTable.push(row);
			}*/
			/*var d_count = 8, step = parseInt(255/(d_count+1));
			var grayrow=[];
			for(var i=0;i<d_count-1;i++){
				grayrow.push({r:255-i*step, g:255-i*step, b:255-i*step});
			}
			grayrow.push({r:0, g:0, b:0});
			this.ColorTable.push(grayrow);*/
			var deep = 13;
			this.ColorTable.push(this.ColorMotion({r:255, g:255, b:255}, {r:0, g:0, b:0}, deep));
			this.ColorTable.push(this.AutoColorMotion({r:255, g:0, b:0}, deep+4, true));
			this.ColorTable.push(this.AutoColorMotion({r:255, g:128, b:0}, deep+4, true));
			this.ColorTable.push(this.AutoColorMotion({r:255, g:255, b:0}, deep+4, true));
			this.ColorTable.push(this.AutoColorMotion({r:128, g:255, b:0}, deep+4, true));
			this.ColorTable.push(this.AutoColorMotion({r:0, g:255, b:0}, deep+4, true));
			this.ColorTable.push(this.AutoColorMotion({r:128, g:255, b:128}, deep+4, true));			
			this.ColorTable.push(this.AutoColorMotion({r:128, g:255, b:255}, deep+4, true));
			this.ColorTable.push(this.AutoColorMotion({r:0, g:255, b:255}, deep+4, true));
			this.ColorTable.push(this.AutoColorMotion({r:0, g:128, b:255}, deep+4, true));
			this.ColorTable.push(this.AutoColorMotion({r:0, g:0, b:255}, deep+4, true));
			this.ColorTable.push(this.AutoColorMotion({r:128, g:0, b:255}, deep+4, true));
			this.ColorTable.push(this.AutoColorMotion({r:255, g:0, b:255}, deep+4, true));
			this.ColorTable.push(this.AutoColorMotion({r:255, g:128, b:255}, deep+4, true));			
			this.ColorTable.push(this.AutoColorMotion({r:255, g:0, b:128}, deep+4, true));
			this.ColorTable.push(this.AutoColorMotion({r:255, g:128, b:128}, deep+4, true));
			// this.ColorTable.push(this.ColorMotion({r:255, g:0, b:0}, {r:0, g:0, b:0}, d_count));
			// this.ColorTable.push(this.ColorMotion({r:255, g:0, b:0}, {r:255, g:255, b:255}, d_count));
			this._ColorTableCreated=true;
		}
	},
	_boxid:'bm_colortable_sel',
	IsOpen:false,
	hex: function(v){ if(v>=16){ return this.hex(parseInt(v/16))+this.hex(v%16); }else{ return '0123456789abcdef'.charAt(v); }},
	toHexUnit: function(unit){
		var s=this.hex(unit);
		// window.unit=unit;
		if(s.length==1){ s='0'+s; }
		return s;
	},
	ToHex: function(color){
		return '#'+this.toHexUnit(color.r)+this.toHexUnit(color.g)+this.toHexUnit(color.b);
	},
	OnSelect: function(color){
		/* do nothing */
	},
	CreateCell: function(tr, color, valueSetter){
		var root=this;
		var td=document.createElement("td");
		tr.appendChild(td);
		var colorcell = this.isIE6()?document.createElement("<input type=button>"):document.createElement("span");
		td.appendChild(colorcell);
		var baseStyle = "display:block; background:RGB("+color.r+", "+color.g+", "+color.b+"); color:white; ";
		baseStyle += "width:100%; height:100%; border:0px;";
		colorcell.style.cssText = baseStyle;
		colorcell.title = this.ToHex(color);
		var _onclick = function(){
			root.OnSelect.call(root, this.title);
			if(valueSetter){
				if(typeof(valueSetter)=='function'){
					valueSetter(this.title);
				}
			}
			root.Close.call(root);
		};
		if(this.isIE6()){
			var handler_id = color.r+"_"+color.g+"_"+color.b;
			var handler = {
				id: handler_id,
				handler: function(obj){
					ColorSelector.OnSelect(obj.title);
					if(valueSetter){
						if(typeof(valueSetter)=='function'){
							valueSetter(obj.title);
						}
					}
					ColorSelector.Close();
				}
			};
			this._click_handlers.push(handler);
			colorcell.setAttribute("onclick", "if(ColorSelector){ColorSelector.ExecClickHandler(this, '"+handler_id+"'); }");
		}else{
			colorcell.onclick = _onclick;
		}
	},
	OpenBox: function(obj, defaultValue, valueSetter){
		var box = document.getElementById(this._boxid);
		if(!box){
			var box=document.createElement("span");
			document.body.appendChild(box);
			box.id = this._boxid;
		}
		box.innerHTML='';
		var size = {width:180, height:220};
		var rect = this.GetAbsPos(obj);
		var cssText = "border:0px; display:block; position:absolute; ";
		cssText += "left:"+(rect.x)+"px; top:"+(rect.y-size.height)+"px;";
		cssText += "width:"+size.width+"px; height:"+size.height+"px;";
		// cssText += "background:#e0e0e0;";
		box.style.cssText = cssText;
		// var cellsize = {width:16+3, height:12+3};
		// var calsize = {width:cellsize.width*8, height:this.ColorTable.length*cellsize.height};
		this.IsOpen=true;
		var ct = this.ColorTable;
		var table=document.createElement("table");
		box.appendChild(table);
		table.setAttribute("border", 0);
		table.setAttribute("cellspacing", 0);
		table.setAttribute("cellpadding", 0);
		cssText = "border-spacing:1px; background:#e0e0e0;";
		cssText += "width:"+size.width+"px; height:"+size.height+"px;";
		cssText += "border:1px solid #e0e0e0;";
		table.style.cssText = cssText;
		for(var i=0;i<ct.length;i++){
			var tr=document.createElement("tr");
			table.appendChild(tr);
			var cr = ct[i];
			for(var j=0;j<cr.length;j++){
				var c = cr[j];
				this.CreateCell(tr, c, valueSetter);
			}
		}
		if(this.isIE6()){
			box.innerHTML+="<span></span>";
		}
	},
	Close: function(){
		var box = document.getElementById(this._boxid);
		if(box){
			box.style.cssText="display:hidden;";
			box.innerHTML='';
			this.IsOpen=false;
		}
		this._click_handlers = [];
	},
	Open: function(element, defaultValue, valueSetter){
		this.InitColors();
		this._click_handlers = [];
		if(!element){ return; }
		if(typeof(element)=='string'){
			element=document.getElementById(element);
		}
		if(!element){ return; }
		if(!defaultValue && element.value){
			defaultValue = element.value;
		}
		if(!defaultValue){ defaultValue = '#000000'; }
		var r=/^\#[a-fA-F0-9]{6}$/;
		if(!defaultValue.match(r)){
			defaultValue='#000000';
		}
		this.OpenBox(element, defaultValue, valueSetter);
	},
	Attach: function(element, defaultValueReader, valueSetter){
		if(!element){ return; }
		if(typeof(element)=='string'){
			element=document.getElementById(element);
		}
		if(!element){ return; }
		if(!defaultValueReader){
			defaultValueReader=function(){ return '#000000'; };
		}
		var root=this;
		element.onclick=function(){
			if(root.IsOpen){
				root.Close.call(root);
			}else{
				root.Open.call(root, this, defaultValueReader(), valueSetter);
			}
		};
	}
};







