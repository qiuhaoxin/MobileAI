function Wave9Curve(opt){
    this.controller=opt.controller;
    this.definition=opt.definition;

    this.tick=0;
    this._respawn();
}
Wave9Curve.prototype={
	definition:[
	   {color:'171,145,255',xFlag:.08,y:.58,opacity:.9},
	   {color:'171,145,255',xFlag:.92,y:.58,opacity:.9},
       {color:'208,141,255',xFlag:.2,y:.65,opacity:.9},
       {color:'208,141,255',xFlag:.8,y:.65,opacity:.9},
       {color:'130,158,255',xFlag:.35,y:.8,opacity:.8},
       {color:'130,158,255',xFlag:.65,y:.8,opacity:.8},
       {color:'127,234,255',xFlag:.5,y:1,opacity:.5},
	],
	_respawn:function(){
       this.amplitude=0.3 + Math.random() * 0.7;
       this.seed=Math.random();
       this.openClass=2 + (Math.random() * 3)|0;
	},
	_ypos:function(i){
        var p=this.tick;
        var y=-1 * Math.abs(Math.sin(p)) * this.controller.amplitude * this.amplitude * this.definition.y * this.controller.cache.heightMax * 
               Math.pow(1 / (1 + Math.pow(this.openClass * i,2)),2);
        if(Math.abs(y)<0.001){
        	this._respawn();
        }       
        return y;
	},
	_draw:function(sign){

        var ctx=this.controller.ctx;
        if(!ctx){
        	console.log("ctx in Wave9Curve is undefined!");
        	return;
        }
        this.tick+=this.controller.speed * (1 - 0.5 * Math.sin(Math.PI));
        ctx.beginPath();
        var xBase=this.controller.cache.width2 + (-this.controller.cache.width4 + this.definition.xFlag * (this.controller.cache.width2));
        var yBase=this.controller.cache.height2;
        //console.log("xBase is "+xBase+" and yBase is "+yBase);
        var x,y;
        var xInit=null;
        for(var i=-3;i<=3;i+=0.01){
        	x=xBase + i * this.controller.cache.width4;
        	y=yBase + ((sign) || 1) * this._ypos(i); 
            xInit=xInit || x;
            //console.log("x is "+x+" and y is "+y);
            ctx.lineTo(x,y);
        }
        var height=Math.abs(this._ypos(0));

         //var gradient=ctx.createRadialGradient(xBase,yBase,height * 1.15,xBase,yBase,height * 0.3);
        // gradient.addColorStop(0,'rgba('+this.definition.color+',0.4)');
        // gradient.addColorStop(0,'rgba('+this.definition.color+',0.2)');
         //console.log("color is "+this.definition.color);
         ctx.fillStyle='rgba('+this.definition.color+','+this.definition.opacity+')';

        ctx.lineTo(xInit,yBase);
        ctx.closePath();
        ctx.fill();
	},
	draw:function(){
        this._draw(1);
        this._draw(-1);
	},

}



export default function Wave(options){
    options =options || {};
    this.phase=0;
    this.run=false;
    this.cache={};
    if(options.container==null){
    	console.log("no container defined,use body");
    	options.container=document.body;

    }
    this.style=options.style || 'ios'; 
    this.container=options.container;
    this.width=options.width || window.getComputedStyle(this.container).width.replace('px','');
    this.height=options.height || window.getComputedStyle(this.container).height.replace('px','');
    this.ratio=options.ratio || window.devicePixelRatio || 1;
    
    this.cache.width=this.width * this.ratio;
    this.cache.height=this.height * this.ratio;
    this.cache.height2=this.cache.height / 2;
    this.cache.width2=this.cache.width / 2;
    this.cache.width4=this.cache.width / 4;
    this.cache.heightMax=this.cache.height2 - 4;

    this.amplitude=(options.amplitude==undefined) ? 1 : options.amplitude;
    this.speed=(options.speed==undefined) ? 0.2 : options.speed;
    this.frequency=(options.frequency==undefined) ? 6 : options.frequency;
    this.color=this._hex2rgb(options.color || '#fff');

    this.speedInterpolationSpeed=options.speedInterpolationSpeed || 0.005;
    this.amplitudeInterpolationSpeed=options.amplitudeInterpolationSpeed || 0.05;

    this.cache.interpolation={
    	speed:this.speed,
    	amplitude:this.amplitude,
    };

    this.canvas=document.createElement('canvas');
    this.ctx=this.canvas.getContext('2d');
    this.canvas.width=this.cache.width;
    this.canvas.height=this.cache.height;

    if(options.cover){
    	this.canvas.style.width=this.canvas.style.height='100%';
    }else{
    	this.canvas.style.width=this.canvas.width / this.ratio + "px";
        this.canvas.style.height=this.canvas.height / this.ratio + "px";
    }

    this.curves=[];

    var i=0,j=0;
    for(;i<Wave9Curve.prototype.definition.length;i++){
    	for(j=0;j<1;j++){
    		this.curves.push(new Wave9Curve({
    			controller:this,
    			definition:Wave9Curve.prototype.definition[i]
    		}))
    	}
    }

    this.container.appendChild(this.canvas);
    if(options.autostart){
    	console.log("autostart");
    	this.start();
    }
}
Wave.prototype={
	_hex2rgb:function(hex){
		var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
		hex = hex.replace(shorthandRegex, function(m,r,g,b) { return r + r + g + g + b + b; });
		var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
		return result ?
		parseInt(result[1],16).toString()+','+parseInt(result[2], 16).toString()+','+parseInt(result[3], 16).toString()
		: null;
	},
	_interpolate:function(propertyStr){
        let increment = this[ propertyStr + 'InterpolationSpeed' ];

        if (Math.abs(this.cache.interpolation[propertyStr] - this[propertyStr]) <= increment) {
            this[propertyStr] = this.cache.interpolation[propertyStr];
        } else {
            if (this.cache.interpolation[propertyStr] > this[propertyStr]) {
                this[propertyStr] += increment;
            } else {
                this[propertyStr] -= increment;
            }
        }
	},
	_clear:function(){
		this.ctx.globalCompositeOperation="destination-out";
		this.ctx.fillRect(0,0,this.cache.width,this.cache.height);
		this.ctx.globalCompositeOperation="source-over";
	},
	_draw:function(){
		for(var i=0,len=this.curves.length;i<len;i++){
            this.curves[i].draw();
		}
	},
	_startDrawCycle:function(){
		//console.log("run is "+this.run);
		if(this.run==false)return;
		this._clear();
		this._interpolate('amplitude');
		this._interpolate('speed');

		this._draw();
		this.phase=(this.phase + Math.PI * this.speed) % (2 * Math.PI);

		if(window.requestAnimationFrame){
			window.requestAnimationFrame(this._startDrawCycle.bind(this));
		}else{
			setTimeout(this._startDrawCycle.bind(this),20);
		}
	},
	start:function(){
        this.phase=0;
        this.run=true;
        this._startDrawCycle();
	},
	stop:function(){
        this.phase=0;
        this.run=false;
	},
	setSpeed:function(v,increment){
        this.cache.interpolation.speed=v;
	},
	setAmplitude:function(v){
		this.cache.interpolation.amplitude=Math.max(Math.min(v,1),0);
	}
}
