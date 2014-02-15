/**
ccd3

Copyright (c) 2014 Masafumi.OSOGOE

This software is released under the MIT License.
http://opensource.org/licenses/mit-license.php
*/

// for JSHint
/* global d3 */
/* exported ccd3 */

/* ================================================================== */
/*  ccd3 definition                                                   */
/* ================================================================== */
var ccd3 = function(){
	"use strict";
	
	var ccd3 = {
		version: "0.9.2"
	};
	
	/* ------------------------------------------------------------------ */
	/*  ccd3.functions                                                    */
	/* ------------------------------------------------------------------ */

	ccd3.get_instance = function(t){
		if(typeof t === "string"){
			// by div id
			return ccd3.instances[t];
		}else{
			// by DOM element
			return ccd3.instances[d3.select(t.farthestViewportElement).attr("id")];
		}
	};
	ccd3.instances = {};
	
	
	/* ------------------------------------------------------------------ */
	/*  ccd3.Charts                                                       */
	/* ------------------------------------------------------------------ */

	ccd3.Chart = function(div_id,dataset){
		this.div_id = div_id;
		ccd3.instances["svg_"+div_id] = this;
		
		// ccd3.Parts holder
		this.series_container = {};
		this.title = {};
		this.xLabel = {};
		this.yLabel = {};
		this.xAxis = {};
		this.yAxis = {};
		this.zAxis = {};
		this.rAxis = {};
		this.aAxis = {};
		this.legend = { show:true };
		this.tooltip = { show:true };
		this.zoom = { use:true };
		this.series = [];
		this.series_options = {};
		for (var key in ccd3.Parts.Series.type_info()) {
			this.series_options[key] = {};
		}
		
		// ccd3.DatasetManager holder
		this.dataset_manager = {};
		
		// ccd3.Chart options
		this.initialized = false;
		this.color_palette = undefined;
		this.height = 320;
		this.width = 480;
		this.chart_pattern = undefined;
		this.direction = undefined;
		this.show_values = "onzoom"; // always, onzoom
		this.zoomed = false;
		this.default_series_type = "scatter";
		this.stack_type = "zero"; // use as args of stack.offset
		
		// ccd3.DatasetLoader
		this.loader = new ccd3.DatasetLoader(this);
		
		if(dataset!==undefined){
			this.dataset = dataset;
		}
		
	};
	
	ccd3.Chart.prototype.load = function(params){
		this.loader.load(params);
	};

	ccd3.Chart.prototype.setup_options = function(options){
		return ccd3.Util.merge(this,options);
	};
	
	ccd3.Chart.prototype.render = function(cond){
		if(cond === undefined){ cond = {}; }
		
		if(!this.initialized){
			this.init();
		}
		
		this.dataset_manager.update_stack_values(this.direction,this.stack_type);
		
		if(this.chart_pattern === "xy"){
			if(!cond.dont_reset_domain){
				this.xAxis.reset_domain();
				this.yAxis.reset_domain();
			}
			this.xAxis.reset_range(this.inner_width);
			this.yAxis.reset_range(this.inner_height);
			this.xAxis.render();
			this.yAxis.render();
			
			var right_margin = 10;
			this.inner_width = this.width - this.yLabel.sizeof("width") - this.yAxis.sizeof("label_width") - right_margin;
			
			// call after fixed inner_width
			this.legend.render(this.inner_width);
			this.legend.arrange(
				this.yAxis.sizeof("label_width") + this.yLabel.sizeof("width"),
				this.title.sizeof("height")
			);
			
			this.inner_height = this.height - this.title.sizeof("height") - this.legend.sizeof("height") - 
				this.xAxis.sizeof("label_height") - this.xLabel.sizeof("height");
			
			this.xAxis.arrange(
				this.yLabel.sizeof("width") + this.yAxis.sizeof("label_width"), 
				this.height - this.xAxis.sizeof("label_height") - this.xLabel.sizeof("height")
			);
			this.yAxis.arrange(
				this.yLabel.sizeof("width") + this.yAxis.sizeof("label_width"), 
				this.title.sizeof("height") + this.legend.sizeof("height")
			);
			
			this.series_container.render(this.inner_width,this.inner_height);
			this.series_container.arrange(
				this.yLabel.sizeof("width") + this.yAxis.sizeof("label_width"), 
				this.title.sizeof("height") + this.legend.sizeof("height")
			);
			
			// must call after series_container setup
			if(!(this.zoom instanceof ccd3.Parts)){
				if(this.zoom.use && !(this.xAxis.scale_type === "ordinal" || this.yAxis.scale_type === "ordinal")){
					this.zoom = new ccd3.Parts.Zoom(this,this.zoom);
				}
			}
			
			this.xAxis.reset_range(this.inner_width);
			this.yAxis.reset_range(this.inner_height);
			this.yAxis.render();
			this.xAxis.render();
		
		}else if(this.chart_pattern === "ra"){
			var legend_width = Math.min(this.height,this.width);
			this.legend.render(legend_width);
			
			this.inner_width = this.width;
			this.inner_height = this.height - this.title.sizeof("height") - this.legend.sizeof("height");
			var radius = Math.min(this.inner_height,this.inner_width)/2*0.9;
			if(this.inner_height > this.inner_width){
				this.title.arrange(this.width/2, (this.inner_height-radius*2)/2 + this.title.sizeof("height")/2);
				this.legend.arrange(0, (this.inner_height-radius*2)/2 + this.title.sizeof("height"));
			}else{
				this.legend.arrange((this.width - legend_width)/2,this.title.sizeof("height"));
			}
			
			if(!cond.dont_reset_domain){
				this.rAxis.reset_domain();
				this.aAxis.reset_domain();
			}
			this.rAxis.reset_range(radius);
			this.aAxis.reset_range(radius);
			this.rAxis.render();
			this.aAxis.render();
			
			this.series_container.render(this.inner_width,this.inner_height);
			this.series_container.arrange(
				0,
				this.title.sizeof("height") + this.legend.sizeof("height")
			);
			this.rAxis.arrange(
				this.inner_width/2,
				this.inner_height/2 + this.title.sizeof("height") + this.legend.sizeof("height")
			);
			this.aAxis.arrange(
				this.inner_width/2,
				this.inner_height/2 + this.title.sizeof("height") + this.legend.sizeof("height")
			);

		}else if(this.chart_pattern === "r"){
			this.inner_width = this.width;
			this.inner_height = this.height - this.title.sizeof("height");
			this.series_container.render(this.inner_width,this.inner_height);
			this.series_container.arrange(
				0,
				this.title.sizeof("height")
			);
		}
		
		this.render_series();
	};
	
	ccd3.Chart.prototype.init = function(cond){
		if(!this.color_palette){
			// this.color_palette = d3.scale.category10().range();
			// http://flatuicolors.com/
			this.color_palette = ["#3498db","#e74c3c","#2ecc71","#f1c40f","#e67e22","#1abc9c",
				"#2980b9","#c0392b","#27ae60","#f39c12","#d35400","#16a085"];
		}
			
		if(!(this.dataset_manager instanceof ccd3.DatasetManager)){
			this.dataset_manager = new ccd3.DatasetManager(this);
		}
		this.dataset = this.dataset_manager.setup(this.dataset);
		// must execute before execute this.init_parts()
		this.setup_options(this.dataset_manager.options_from_dataset());
		this.chart_pattern = this.dataset_manager.detect_chart_pattern();
		
		if(this.svg===undefined){
			this.svg = d3.select("#"+this.div_id)
				.append("svg")
				.attr("id","svg_"+this.div_id)
				.attr("class","ccd3")
				.attr("width",this.width)
				.attr("height",this.height)
				;
		}
		this.inner_width = this.width;
		this.inner_height = this.height;
		
		this.init_parts();
		
		this.title.render();
		this.title.arrange(this.width/2,this.title.height/2);
		
		if(this.chart_pattern === "xy"){
			this.xLabel.render();
			this.yLabel.render();
			this.xLabel.arrange(this.width/2,this.height - this.xLabel.height/2);
			this.yLabel.arrange(this.yLabel.width/2,this.height/2);
			
			// calc_min_step return undefined if series has only one data.
			this.xAxis.scale_type = this.dataset_manager.detect_scale_type(function(d){return d.x;});
			this.xAxis.min_step = this.dataset_manager.calc_min_step(function(d){return d.x;}) || 2.0;
			this.yAxis.scale_type = this.dataset_manager.detect_scale_type(function(d){return d.y;});
			this.yAxis.min_step = this.dataset_manager.calc_min_step(function(d){return d.y;}) || 2.0;
			
			var series_directive = this.dataset_manager.has_directive_series_type();
			if(!series_directive && this.yAxis.scale_type === "linear" && this.xAxis.scale_type === "linear"){
				this.direction = null;
			}else if(this.yAxis.scale_type === "ordinal" || this.yAxis.scale_type === "date"){
				this.direction = "y";
			}else{
				this.direction = "x";
			}
			
			this.xAxis.init_scale();
			this.yAxis.init_scale();
		}else if(this.chart_pattern === "ra"){
			this.rAxis.init_scale();
			this.aAxis.init_scale();
		}
		// switch false if you want to re-render labels
		this.initialized = true;
	};
	
	ccd3.Chart.prototype.init_parts = function(){
		if(!(this.series_container instanceof ccd3.Parts)){
			this.series_container = new ccd3.Parts.SeriesContainer(this,this.series_container);
		}
		
		if(!(this.tooltip instanceof ccd3.Parts)){
			if(this.tooltip.show){
				this.tooltip = new ccd3.Parts.Tooltip(this,this.tooltip);
			}else{
				this.tooltip.add_listener = function(){};
			}
		}
		
		if(!(this.title instanceof ccd3.Parts)){
			if(this.title.text===undefined){
				this.title = new ccd3.Parts(this,this.title);
			}else{
				this.title = new ccd3.Parts.Label.Title(this,this.title);
			}
		}
		
		if(this.chart_pattern === "xy"){
			if(!(this.xLabel instanceof ccd3.Parts)){
				if(this.xLabel.text===undefined){
					this.xLabel = new ccd3.Parts(this,this.xLabel);
				}else{
					this.xLabel = new ccd3.Parts.Label.xLabel(this,this.xLabel);
				}
			}
			if(!(this.yLabel instanceof ccd3.Parts)){
				if(this.yLabel.text===undefined){
					this.yLabel = new ccd3.Parts(this,this.yLabel);
				}else{
					this.yLabel = new ccd3.Parts.Label.yLabel(this,this.yLabel);
				}
			}
			if(!(this.xAxis instanceof ccd3.Parts)){
				this.xAxis = new ccd3.Parts.Axis.xAxis(this,this.xAxis);
			}
			if(!(this.yAxis instanceof ccd3.Parts)){
				this.yAxis = new ccd3.Parts.Axis.yAxis(this,this.yAxis);
			}
			if(!(this.lgend instanceof ccd3.Parts)){
				if(this.legend.show){
					this.legend = new ccd3.Parts.Legend(this,this.legend);
				}else{
					this.legend = new ccd3.Parts(this,this.legend);
				}
			}
		}else if(this.chart_pattern === "ra"){
			if(!(this.rAxis instanceof ccd3.Parts)){
				this.rAxis = new ccd3.Parts.rAxis(this,this.rAxis);
			}
			if(!(this.aAxis instanceof ccd3.Parts)){
				this.aAxis = new ccd3.Parts.aAxis(this,this.aAxis);
			}
			if(!(this.lgend instanceof ccd3.Parts)){
				if(this.legend.show){
					this.legend = new ccd3.Parts.Legend(this,this.legend);
				}else{
					this.legend = new ccd3.Parts(this,this.legend);
				}
			}
		}
	};
	
	ccd3.Chart.prototype.render_series = function(){
		var dataset = this.dataset;
		var num,i;
		var dataset_num,series_num;
		var type_info = ccd3.Parts.Series.type_info();
		
		dataset_num = this.dataset.length;
		series_num = this.series.length;
		num = Math.max(dataset_num, series_num);
		for(i=0;i<num;i++){
			if(i<dataset_num){
				if(!(this.series[i] instanceof ccd3.Parts.Series)){
					// create ccd3.Parts.Series
					this.series[i] = new (type_info[dataset[i].series_type].obj)(this,this.series_options[dataset[i].series_type]);
				}
				this.series[i].init_svg(this.dataset[i]);
			}else{
				this.series[i].destroy();
			}
		}
		this.series.length = dataset_num; // cut down unnecessary series
		this.series_container.svg.selectAll(".ccd3_series").sort(); // sorting layer
		
		// bar series
		var bar_cnt = 0;
		for(i=0;i<dataset_num;i++){
			if(dataset[i].series_type==="bar" && dataset[i].visible){
				bar_cnt++;
			}
		}
		var bar_pos = 0;
		for(i=0;i<dataset_num;i++){
			if(dataset[i].series_type==="bar"){
				this.series[i].render(bar_cnt,bar_pos);
				if(dataset[i].visible){ bar_pos++;}
			}
		}
		
		// not bar series
		for(i=0;i<dataset_num;i++){
			if(dataset[i].series_type!=="bar"){
				this.series[i].render();
			}
		}
	};
	
	ccd3.Chart.prototype.destroy = function(){
		d3.select("#"+this.div_id)
			.selectAll("*").remove();
		d3.select("#tooltip_"+this.div_id).remove();
	};

	ccd3.Chart.prototype._color = function(i){
		return this.color_palette[i%this.color_palette.length];
	};
	
	/* ------------------------------------------------------------------ */
	/*  ccd3.Parts                                                        */
	/* ------------------------------------------------------------------ */

	ccd3.Parts = function(chart,options){
		this.init(chart,options);
	};
	ccd3.Parts.prototype.get_defaults = function(){ return {}; };
	ccd3.Parts.prototype.init = function(chart,options){
		var prop;
		var defaults = this.get_defaults();
		
		this.chart = chart;
		// copy properties to this
		for(prop in options){
			if(options.hasOwnProperty(prop)){
				this[prop] = options[prop];
			}
		}
		// copy default-properties
		for(prop in defaults){
			if(!this.hasOwnProperty(prop)){
				this[prop] = defaults[prop];
			}
		}
	};
	ccd3.Parts.prototype.render = function(){};
	ccd3.Parts.prototype.sizeof = function(prop){
		if(isNaN(this[prop])){
			return 0;
		}else{
			return this[prop];
		}
	};
	ccd3.Parts.prototype.arrange = function(x,y){
		if(this.svg){
			this.svg.attr("transform", "translate(" + x + "," + y + ")");
		}
	};
	
	/* ------------------------------------------------------------------ */
	/*  ccd3.Parts.SeriesContainer                                        */
	/* ------------------------------------------------------------------ */

	ccd3.Parts.SeriesContainer = function(){ ccd3.Parts.apply(this,arguments); };
	ccd3.Parts.SeriesContainer.prototype = new ccd3.Parts();
	ccd3.Parts.SeriesContainer.prototype.get_defaults = function(){
		return {
			height: 0,
			width: 0
		};
	};
	ccd3.Parts.SeriesContainer.prototype.render = function(width,height){
		this.width = width;
		this.height = height;
		
		if(!this.svg){
			this.svg = this.chart.svg
				.append("g")
				.attr("class","ccd3_series_container")
				.attr("clip-path","url(#"+this.chart.div_id+"_clip)")
				;
			
			// clip path
			this.clip_path = this.chart.svg
				.append("defs")
				.append("clipPath")
				.attr("id", this.chart.div_id+"_clip")
				;
			this.clip_path.append("rect");
		}
		this.svg
			.attr("width",this.width)
			.attr("height",this.height)
			;
		this.clip_path
			.select("rect")
			.attr("width",this.width)
			.attr("height",this.height)
			;
	};


	/* ------------------------------------------------------------------ */
	/*  ccd3.Parts.Label                                                  */
	/* ------------------------------------------------------------------ */

	ccd3.Parts.Label = function(){ ccd3.Parts.apply(this,arguments); };
	ccd3.Parts.Label.prototype = new ccd3.Parts();
	ccd3.Parts.Label.prototype.get_defaults = function(){
		return {
			class_name: "ccd3_label",
			text: null,
			text_anchor: "middle",
			rotate: 0,
			font_size: 18,
			margin_top: 5,
			margin_bottom: 5,
			margin_right: 5,
			margin_left: 5,
			text_height: 0,
			text_width: 0,
			height: 0,
			width: 0
		};
	};
	ccd3.Parts.Label.prototype.render = function(){
		if(this.svg === undefined){
			this.svg = this.chart.svg.append("g");
			this.svg
				.attr("class",this.class_name)
				.append("text")
				.attr("text-anchor",this.text_anchor);
		}
		this.svg.select("text")
			.text(this.text)
			.attr("font-size",this.font_size)
			.attr("transform","rotate("+this.rotate+")");
		
		this.text_height = this.svg[0][0].getBBox().height;
		this.text_width = this.svg[0][0].getBBox().width;
		this.height = this.text_height + this.margin_bottom + this.margin_top;
		this.width = this.text_width + this.margin_right + this.margin_left;
	};
	
	/* ------------------------------------------------------------------ */
	/*  ccd3.Parts.Label.Title                                            */
	/* ------------------------------------------------------------------ */
	
	ccd3.Parts.Label.Title = function(){ ccd3.Parts.Label.apply(this,arguments); };
	ccd3.Parts.Label.Title.prototype = new ccd3.Parts.Label();
	ccd3.Parts.Label.Title.prototype.get_defaults = function(){
		return {
			class_name: "ccd3_title",
			font_size: 18
		};
	};
	
	/* ------------------------------------------------------------------ */
	/*  ccd3.Parts.Label.xLabel                                           */
	/* ------------------------------------------------------------------ */
	
	ccd3.Parts.Label.xLabel = function(){ ccd3.Parts.Label.apply(this,arguments); };
	ccd3.Parts.Label.xLabel.prototype = new ccd3.Parts.Label();
	ccd3.Parts.Label.xLabel.prototype.get_defaults = function(){
		return {
			class_name: "ccd3_xLabel",
			font_size: 10,
			margin_top: 20
		};
	};
	
	/* ------------------------------------------------------------------ */
	/*  ccd3.Parts.Label.yLabel                                           */
	/* ------------------------------------------------------------------ */
	
	ccd3.Parts.Label.yLabel = function(){ ccd3.Parts.Label.apply(this,arguments); };
	ccd3.Parts.Label.yLabel.prototype = new ccd3.Parts.Label();
	ccd3.Parts.Label.yLabel.prototype.get_defaults = function(){
		return {
			class_name: "ccd3_yLabel",
			font_size: 10,
			margin_right: 20,
			rotate: 90
		};
	};

	/* ------------------------------------------------------------------ */
	/*  ccd3.Parts.Legend                                                 */
	/* ------------------------------------------------------------------ */

	ccd3.Parts.Legend = function(){ ccd3.Parts.apply(this,arguments); };
	ccd3.Parts.Legend.prototype = new ccd3.Parts();
	ccd3.Parts.Legend.prototype.get_defaults = function(){
		return {
			show: true,
			font_size: 10,
			margin_top: 3,
			margin_bottom: 3,
			margin_left: 5,
			margin_right: 5,
			legend_height: 0,
			height: 0
		};
	};
	ccd3.Parts.Legend.prototype.render = function(width){
		var dataset = this.chart.dataset;
		var that = this;
		this.width = width;
		
		var data = [];
		for(var i=0,length=dataset.length;i<length;i++){
			data.push(dataset[i].series_num);
		}
		
		if(this.svg===undefined){
			this.svg = this.chart.svg.append("g").attr("class","ccd3_legend");
		}
		
		var items = this.svg.select(".legend_items");
		if(items.empty()){
			items = this.svg.append("g").attr("class","legend_items");
		}
		
		// data join
		var item = items.selectAll("g").data(data);
		
		// enter
		item.enter().append("g")
			.attr("class","legend_item")
			.attr("id",function(d){ return "legend_item_"+d; })
			.attr("cursor","pointer")
			.on("click",function(){
				var series_num = d3.select(this).data();
				that.toggle_series(series_num);
			})
			.on("mouseover",function(){
				var series_num = d3.select(this).data();
				that.chart.series[series_num].highlight(true);
			})
			.on("mouseout",function(){
				var series_num = d3.select(this).data();
				that.chart.series[series_num].highlight(false);
			})
			.call(function(s){
				s.append("rect")
				.attr("height","0.6em")
				.attr("width","0.6em")
				.attr("fill",function(d){ return that.chart._color(d); })
				.attr("y","0.2em")
				.attr("x","0.0em")
				.attr("font-size",this.font_size)
				;
			})
			.call(function(s){
				s
				.append("text")
				.text(function(d,i){ return dataset[i].name; })
				.attr("y","0.8em")
				.attr("x","0.8em")
				.attr("font-size",this.font_size)
				;
			})
			;
		// update
		item.select("rect")
			.attr("visibility",function(d,i){
				return (dataset[i].visible)? "visible" : "hidden";
			});
		
		var x_pos = 0;
		var y_pos = 0;
		var x_pos_max = width;
		item.attr("transform",function(){
				var this_height = this.getBBox().height;
				var prev_width = (this.previousSibling)? this.previousSibling.getBBox().width:0;
				if(x_pos + (prev_width + that.margin_right)*2 < x_pos_max){
					x_pos += prev_width + that.margin_right;
				}else{
					x_pos = that.margin_right;
					y_pos += this_height;
				}
				return "translate(" + x_pos + ","+ y_pos + ")";
			});
		
		// exit
		item.exit().remove();
		
		this.legend_height = this.svg[0][0].getBBox().height;
		this.height = this.legend_height + this.margin_top + this.margin_bottom;
		
	};
	ccd3.Parts.Legend.prototype.toggle_series = function(series_num){
		var dataset = this.chart.dataset;
		dataset[series_num].visible = !dataset[series_num].visible;
		
		// reset zoomed
		this.chart.svg.selectAll(".ccd3_brush_reset_button").remove();
		this.chart.zoomed = false;
		
		this.chart.render();
	};
	
	/* ------------------------------------------------------------------ */
	/*  ccd3.Parts.Tooltip                                                */
	/* ------------------------------------------------------------------ */

	ccd3.Parts.Tooltip = function(){ 
		ccd3.Parts.apply(this,arguments);
		this.render();
	};
	ccd3.Parts.Tooltip.prototype = new ccd3.Parts();
	ccd3.Parts.Tooltip.prototype.get_defaults = function(){
		return {
			show: true,
			font_size: 10,
			xFormat: undefined,
			yFormat: undefined,
			zFormat: undefined,
			rFormat: undefined,
			aFormat: undefined
		};
	};
	ccd3.Parts.Tooltip.prototype.render = function(){
		if(this.div!==undefined) return;
		var that = this;
		
		//this.tooltip.div = d3.select("#"+this.div_id)
		this.div = d3.select("body")
			.append("div")
			.attr("id", "tooltip_"+this.chart.div_id)
			.attr("class", "ccd3_tooltip")
			.style("opacity", 0);
		this.svg = this.div;
		
		if(this.font_size){
			this.div.style("font-size",this.font_size+"px");
		}
	};
	ccd3.Parts.Tooltip.prototype.add_listener = function(e,instance){
		var that = instance;
		e.on("mouseover.tooltip",function(d){
			var series_num = d3.select(this.parentNode).data()[0] % 1000; // magic number 1000
			that.div
				.html(that.chart.series[series_num].tooltip_html(d))
				.style("display",null)
				.transition().duration(300)
				.style("opacity", 0.8)
				;
		});
		e.on("mouseout.tooltip",function(){
			ccd3.get_instance(this).tooltip.div
				//.transition().duration(300)
				.style("opacity", 0)
				.style("display","none")
				;
		});
		e.on("mousemove.tooltip",function(){
			ccd3.get_instance(this).tooltip.div
				.style("top", (d3.event.pageY-10)+"px")
				.style("left",(d3.event.pageX+10)+"px")
				;
		});
	};

	
	/* ------------------------------------------------------------------ */
	/*  ccd3.Parts.Axis                                                   */
	/* ------------------------------------------------------------------ */

	ccd3.Parts.Axis = function(){ ccd3.Parts.apply(this,arguments); };
	ccd3.Parts.Axis.prototype = new ccd3.Parts();
	ccd3.Parts.Axis.prototype.get_defaults = function(){
		return {
			svg: null,
			axis: undefined, // d3.svg.axis instance
			scale: undefined, // d3.scale instance
			scale_type: null,
			min_step: null,
			range_max: 0,
			range_min: 0,
			domain_max: undefined,
			domain_min: undefined,
			domain_margin: 0.1,
			domain_margin_type: undefined, // switch using domain_margin or min_step
			band_padding: 0.2, // also ref from Series.Bar/StackedBar
			format: undefined,
			show_label: true,
			tick_num: undefined,
			tick_padding: 5,
			tick_values: undefined, // use if scale_type == "date"
			font_size: 10,
			label_width: 0,
			label_height: 0,
			margin_top: 3,
			margin_bottom: 3,
			margin_right: 3,
			margin_left: 3
		};
	};
	ccd3.Parts.Axis.prototype.render = function(){};
	ccd3.Parts.Axis.prototype.init_format = function(){
		if(this.format === undefined){
			if(this.scale_type === "date"){
				this.format = ccd3.Util.default_date_format;
			}else if(this.scale_type === "linear"){
				this.format = ccd3.Util.default_numeric_format;
			}else if(this.scale_type === "ordinal"){
				this.format = function(d){ return d; };
			}else{
				throw new Error("Invalid scale_type");
			}
		}
	};
	ccd3.Parts.Axis.prototype.init_scale = function(){
		if(!(this.scale)){
			switch(this.scale_type){
				case "date": this.scale = d3.time.scale(); break;
				case "linear": this.scale = d3.scale.linear(); break;
				case "ordinal": this.scale = d3.scale.ordinal(); break;
				default:break;
			}
		}
		this.init_format();
	};
	ccd3.Parts.Axis.prototype.reset_range = function(range_max){
		this.range_max = range_max;
		if(this.scale_type === "ordinal"){
			this.scale.rangeRoundBands([this.range_min, this.range_max], this.band_padding);
			this.tick_values = undefined;
		}else if(this.scale_type === "date"){
			this.scale.range([this.range_min, this.range_max]);
			
			// not to show same tick_label twice, force tickValues by Axis.format
			var cur_ticks = this.scale.ticks();
			var new_ticks = [];
			/*
			if(cur_ticks.length>=2 && this.format(cur_ticks[0]) != this.format(cur_ticks[1])){
				new_ticks.push(cur_ticks[0]);
			}
			*/
			var prev=cur_ticks[0];
			for(var i=1,len=cur_ticks.length;i<len;i++){
				if(this.format(prev)!=this.format(cur_ticks[i])){
					new_ticks.push(cur_ticks[i]);
				}
				prev = cur_ticks[i];
			}
			this.tick_values = new_ticks;
		}else{
			this.scale.range([this.range_min, this.range_max]);
			this.tick_values = undefined;
		}
	};
	ccd3.Parts.Axis.prototype.reset_domain = function(){
		var domain = [],min,max,func;
		var direction = this.direction;
		
		if(this.scale_type === "ordinal"){
			func = function(d){ return d[direction]; };
			for(var i=0,len=this.chart.dataset.length;i<len;i++){
				if(this.chart.dataset[i].visible){
					domain = domain.concat(this.chart.dataset[i].values.map(func));
				}
			}
		}else{
			if(direction === "x"){
				if(this.scale_type === "date"){
					func = function(d){ return d.x; };
				}else{
					func = function(d){ return d.x + ((d.x0===undefined)? 0:d.x0); };
				}
			}else if(direction === "y"){
				if(this.scale_type === "date"){
					func = function(d){ return d.y; };
				}else{
					func = function(d){ return d.y + ((d.y0===undefined)? 0:d.y0); };
				}
			}
			min = this.chart.dataset_manager.get_min(func);
			max = this.chart.dataset_manager.get_max(func);
			
			if(min === undefined || max === undefined){
				min = undefined;
				max = undefined;
			}else if(this.direction !== this.chart.direction && this.domain_margin_type !== "grid"){
				if(min > 0 && min - (max-min)*this.domain_margin < 0){
					min = 0;
				}else{
					min = min - (max-min)*this.domain_margin;
				}
				if(max < 0 && max + (max-min)*this.domain_margin > 0){
					max = 0;
				}else{
					max = max + (max-min)*this.domain_margin;
				}
			}else{
				if(this.scale_type === "date"){
					min = new Date(min.getTime() - this.min_step/2);
					max = new Date(max.getTime() + this.min_step/2);
				}else if(this.scale_type === "linear"){
					min = min - this.min_step/2;
					max = max + this.min_step/2;
				}
			}
			if(this.domain_min !== undefined){ min = this.domain_min; }
			if(this.domain_max !== undefined){ max = this.domain_max; }
			
			if(direction === "x" || this.chart.direction === "y"){
				domain = [min, max];
			}else{
				domain = [max, min];
			}
		}
		this.scale.domain(domain);
	};
	
	/* ------------------------------------------------------------------ */
	/*  ccd3.Parts.Axis.xAxis                                             */
	/* ------------------------------------------------------------------ */
	
	ccd3.Parts.Axis.xAxis = function(){ ccd3.Parts.Axis.apply(this,arguments); };
	ccd3.Parts.Axis.xAxis.prototype = new ccd3.Parts.Axis();
	ccd3.Parts.Axis.xAxis.prototype.get_defaults = function(){
		return {
			direction: "x"
		};
	};
	ccd3.Parts.Axis.xAxis.prototype.render = function(){
		var that = this;
		var width = this.chart.inner_width;
		var height = this.chart.inner_height;
		var format;
		
		if(!this.svg){
			this.svg = this.chart.svg.append("g").attr("class","ccd3_xAxis");
		}

		if(this.show_label){
			format = this.format;
		}else{
			format = function(){ return ""; };
		}
		this.axis = d3.svg.axis()
			.scale(this.scale)
			.tickSize(-1*height)
			.orient("bottom")
			.tickFormat(format)
			;
		if(this.tick_values){
			this.axis.tickValues(this.tick_values);
		}else if(this.tick_num){
			this.axis.ticks(this.tick_num);
		}
		this.svg
			.call(this.axis)
			.selectAll(".tick text")
				.style("text-anchor", "end")
				.attr("class","ccd3_x_tick_label")
				.attr("font-size",this.font_size)
				.attr("transform", function(){
					return "translate(" + this.getBBox().height*-0.5 + "," + that.tick_padding+")rotate(-90)";
				})
			;
		
		this.text_height = d3.max(this.svg.selectAll(".ccd3_x_tick_label")[0].map(function(e){ 
			return e.getBBox().width;
		}));
		this.label_height = this.text_height + this.margin_top + this.margin_bottom;
	};
	
	/* ------------------------------------------------------------------ */
	/*  ccd3.Parts.Axis.yAxis                                             */
	/* ------------------------------------------------------------------ */
	
	ccd3.Parts.Axis.yAxis = function(){ ccd3.Parts.Axis.apply(this,arguments); };
	ccd3.Parts.Axis.yAxis.prototype = new ccd3.Parts.Axis();
	ccd3.Parts.Axis.yAxis.prototype.get_defaults = function(){
		return {
			direction: "y"
		};
	};
	ccd3.Parts.Axis.yAxis.prototype.render = function(){
		var width = this.chart.inner_width;
		var height = this.chart.inner_height;
		var format;
		
		if(!this.svg){
			this.svg = this.chart.svg.append("g").attr("class","ccd3_yAxis");
		}
		
		if(this.show_label){
			format = this.format;
		}else{
			format = function(){ return ""; };
		}
		this.axis = d3.svg.axis()
			.scale(this.scale)
			.tickSize(-1*width)
			.tickPadding(this.tick_padding)
			.orient("left")
			.tickFormat(format)
			;
		if(this.tick_values){
			this.axis.tickValues(this.tick_values);
		}else if(this.tick_num){
			this.axis.ticks(this.tick_num);
		}
		this.svg
			.call(this.axis)
			.selectAll(".tick text")
				.attr("class","ccd3_y_tick_label")
				.attr("font-size",this.font_size)
			;
		
		this.text_width = d3.max(this.svg.selectAll(".ccd3_y_tick_label")[0].map(function(e){ 
			return e.getBBox().width;
		}));
		this.label_width = this.text_width + this.margin_right + this.margin_left;
	};
	
	/* ------------------------------------------------------------------ */
	/*  ccd3.Parts.rAxis r=radius                                         */
	/* ------------------------------------------------------------------ */
	
	ccd3.Parts.rAxis = function(){ ccd3.Parts.apply(this,arguments); };
	ccd3.Parts.rAxis.prototype = new ccd3.Parts();
	ccd3.Parts.rAxis.prototype.get_defaults = function(){
		return {
			radius: undefined,
			scale: undefined,
			format: undefined,
			font_size: 10
		};
	};
	ccd3.Parts.rAxis.prototype.render = function(){
		var that = this;
		
		this.init_scale();
		this.reset_domain();
		
		if(!this.svg){
			this.svg = this.chart.svg.append("g").attr("class","ccd3_rAxis");
		}
		
		var ticks = this.svg.selectAll(".ccd3_rAxis_ticks").data(that.scale.ticks(3));
		// enter
		ticks.enter()
			.append("g")
			.attr("class","ccd3_rAxis_ticks")
			.call(function(e){
				e.append("circle")
				.attr("fill","none")
				.attr("stroke","lightgray")
				.attr("stroke-width",1)
				;
			})
			.call(function(e){
				e.append("text")
				.attr("text-anchor","middle")
				.attr("font-size",this.font_size)
				;
			})
			;
		// update
		ticks
			.call(function(e){
				e.select("circle")
				.attr("r",function(d){ return that.scale(d); })
				;
			})
			.call(function(e){
				e.select("text")
				.text(function(d){ return that.format(d); })
				.attr("y",function(d){ return -1.0 * that.scale(d); })
				;
			})
			;
		// exit
		ticks.exit().remove();

	};
	ccd3.Parts.rAxis.prototype.init_format = function(){
		if(this.format===undefined){
			this.format = ccd3.Util.default_numeric_format;
		}
	};
	ccd3.Parts.rAxis.prototype.init_scale = function(){
		if(!(this.scale)){
			this.scale = d3.scale.linear();
		}
		this.init_format();
	};
	ccd3.Parts.rAxis.prototype.reset_range = function(radius){
		this.radius = radius;
		this.scale.range([0,this.radius*0.8]); // TODO
	};
	ccd3.Parts.rAxis.prototype.reset_domain = function(){
		var func = function(d){ return d.y; };
		//var min = this.chart.dataset_manager.get_min(func);
		var max = this.chart.dataset_manager.get_max(func);
		this.scale.domain([0,max]);
	};
	
	/* ------------------------------------------------------------------ */
	/*  ccd3.Parts.aAxis a=angle                                          */
	/* ------------------------------------------------------------------ */
	
	ccd3.Parts.aAxis = function(){ ccd3.Parts.apply(this,arguments); };
	ccd3.Parts.aAxis.prototype = new ccd3.Parts();
	ccd3.Parts.aAxis.prototype.get_defaults = function(){
		return {
			radius: undefined,
			scale: undefined,
			format: undefined,
			font_size: 10
		};
	};
	ccd3.Parts.aAxis.prototype.render = function(){
		var that = this;
		
		this.init_scale();
		this.reset_domain();
		
		if(!this.svg){
			this.svg = this.chart.svg.append("g").attr("class","ccd3_aAxis");
		}
		
		var ticks = this.svg.selectAll(".ccd3_aAxis_ticks").data(this.scale.domain());
		// enter
		ticks.enter()
			.append("g")
			.attr("class","ccd3_aAxis_ticks")
			.call(function(e){
				e.append("line")
				.attr("x1",0)
				.attr("y1",0)
				.attr("stroke","lightgray")
				.attr("stroke-width",1)
				;
			})
			.call(function(e){
				e.append("text")
				.attr("text-anchor","middle")
				.attr("font-size",this.font_size)
				;
			})
			;
		// update
		ticks
			.call(function(e){
				e.select("line")
				.attr("x2",function(d){ return that.radius*Math.sin(that.scale(d)); })
				.attr("y2",function(d){ return that.radius*Math.cos(that.scale(d))*-1.0; })
				;
			})
			.call(function(e){
				e.select("text")
				.text(function(d){ return that.format(d); })
				.attr("transform",function(d){
					var x=that.radius*Math.sin(that.scale(d));
					var y=that.radius*Math.cos(that.scale(d))*-1.0;
					var w=this.getBBox().width;
					if(x+w/2 > that.chart.inner_width/2){ // not to overflow
						x = that.chart.inner_width/2 - w/2;
					}else if(x-w/2 < that.chart.inner_width/2*-1){
						x = that.chart.inner_width/2*-1 + w/2;
					}
					return "translate("+x+","+y+")";
				})
				;
			})
			;
		// exit
		ticks.exit().remove();
		
	};
	ccd3.Parts.aAxis.prototype.init_format = function(){
		if(this.format===undefined){
			this.format = function(d){ return d; };
		}
	};
	ccd3.Parts.aAxis.prototype.init_scale = function(){
		if(!(this.scale)){
			this.scale = d3.scale.ordinal().rangePoints([0,Math.PI*2],1);
		}
		this.init_format();
	};
	ccd3.Parts.aAxis.prototype.reset_range = function(radius){
		this.radius = radius;
	};
	ccd3.Parts.aAxis.prototype.reset_domain = function(){
		var domain = [];
		var func = function(d){ return d.x; };
		for(var i=0,len=this.chart.dataset.length;i<len;i++){
			if(this.chart.dataset[i].visible){
				domain = domain.concat(this.chart.dataset[i].values.map(func));
			}
		}
		this.scale.domain(domain);
	};

	/* ------------------------------------------------------------------ */
	/*  ccd3.Parts.Zoom                                                   */
	/* ------------------------------------------------------------------ */

	ccd3.Parts.Zoom = function(){
		ccd3.Parts.apply(this,arguments); 
		this.render();
	};
	ccd3.Parts.Zoom.prototype = new ccd3.Parts();
	ccd3.Parts.Zoom.prototype.get_defaults = function(){
		return {
			use: true
		};
	};
	ccd3.Parts.Zoom.prototype.render = function(){
		if(this.svg!==undefined) return;
		var that = this;
		
		this.brush = d3.svg.brush()
			.x(this.chart.xAxis.scale)
			.y(this.chart.yAxis.scale)
			.on("brushend",function(){
				that.zoom(); 
			})
			;
		
		this.svg = this.chart.series_container.svg
			.append("g")
			.attr("class","ccd3_brush")
			.call(this.brush)
			;
	};
	ccd3.Parts.Zoom.prototype.zoom = function(){
		if(this.brush.empty()) return;
		var that = this;
		var c = this.chart;
		var b = this.brush.extent();
		c.zoomed = true;
		
		c.xAxis.scale.domain([b[0][0],b[1][0]]); 
		if(c.direction === "y"){
			c.yAxis.scale.domain([b[0][1],b[1][1]]);
		}else{
			c.yAxis.scale.domain([b[1][1],b[0][1]]);
		}
		c.render({dont_reset_domain:true});
		
		this.brush.clear();
		c.svg.selectAll(".ccd3_brush").call(this.brush);
		c.series_container.svg
			.append("g")
			.attr("cursor","pointer")
			.attr("transform","translate(" + (this.chart.inner_width) + ",0)")
			.attr("class","ccd3_brush_reset_button")
			.call(function(e){
				e
				.append("rect")
				.attr("height","1.6em")
				.attr("width","7em")
				.attr("y","0.3em")
				.attr("x","-7.25em")
				.attr("rx",5).attr("ry",5)
				;
			})
			.call(function(e){
				e
				.append("text")
				.text("clear zoom")
				.attr("y","1.5em")
				.attr("x","-6.5em")
				;
			})
			.on("click",function(){
				that.reset_zoom();
			})
			;
	};
	ccd3.Parts.Zoom.prototype.reset_zoom = function(){
		var c = this.chart;
		c.zoomed = false;
		c.render();
		c.series_container.svg.selectAll(".ccd3_brush_reset_button").remove();
	};
	
	/* ------------------------------------------------------------------ */
	/*  ccd3.Parts.Series                                                 */
	/* ------------------------------------------------------------------ */

	ccd3.Parts.Series = function(){ ccd3.Parts.apply(this,arguments); };
	ccd3.Parts.Series.type_info = function(){
		return {
			heatmap:	{ obj:ccd3.Parts.Series.Heatmap,	zindex:1, is_single_series:true },
			bar:		{ obj:ccd3.Parts.Series.Bar,		zindex:2 },
			stackedbar:	{ obj:ccd3.Parts.Series.StackedBar,	zindex:3 },
			bubble:		{ obj:ccd3.Parts.Series.Bubble,		zindex:4 },
			line:		{ obj:ccd3.Parts.Series.Line,		zindex:5 },
			scatter:	{ obj:ccd3.Parts.Series.Scatter,	zindex:6 },
			pie:		{ obj:ccd3.Parts.Series.Pie,		zindex:0, is_single_series:true },
			radar:		{ obj:ccd3.Parts.Series.Radar,		zindex:0 },
		};
	};
	ccd3.Parts.Series.prototype = new ccd3.Parts();
	ccd3.Parts.Series.prototype.get_defaults = function(){
		return {
			class_name: "ccd3_series",
			series: undefined,
			data: undefined,
			show_values: false,
			color: null,
			font_size: 10
		};
	};
	ccd3.Parts.Series.prototype.render = function(){};
	ccd3.Parts.Series.prototype.init_svg = function(series){
		this.series = series;
		if(!(this.svg)){
			var info = ccd3.Parts.Series.type_info();
			this.svg = this.chart.series_container.svg
				.append("g")
				.attr("id","series_"+series.series_num)
				.attr("class","series")
				.attr("series_num",series.series_num)
				.attr("series_name",series.name)
				.attr("class",this.class_name)
				.attr("series_type",series.series_type)
				.datum(info[series.series_type].zindex * 1000 + series.series_num) // magic number 1000
				;
		}
	};
	ccd3.Parts.Series.prototype.destroy = function(){
		this.svg.remove();
	};
	ccd3.Parts.Series.prototype.exit = function(s){
		s
			.exit()
			.transition().duration(500)
			.ease("linear")
			.style("opacity",0)	
			.remove()
			;
	};
	ccd3.Parts.Series.prototype.get_data = function(){
		if(this.series.visible){
			return this.series.values;
		}else{
			return [];
		}
	};
	ccd3.Parts.Series.prototype.text_visibility = function(){
		if(this.show_values || this.chart.show_values === "always" || 
			(this.chart.zoomed && this.chart.show_values === "onzoom") ){
			return true;
		}else{
			return false;
		}
	};
	ccd3.Parts.Series.prototype.highlight = function(){};
	ccd3.Parts.Series.prototype.tooltip_html = function(d){
		var xFormat = this.chart.tooltip.xFormat || this.chart.xAxis.format;
		var yFormat = this.chart.tooltip.yFormat || this.chart.yAxis.format;
		var html = "";
		html += "<b>" + this.series.name + "</b>";
		html += "<br>x: " + xFormat(d.x);
		html += "<br>y: " + yFormat(d.y);
		return html;
	};
	
	/* ------------------------------------------------------------------ */
	/*  ccd3.Parts.Series.Scatter                                         */
	/* ------------------------------------------------------------------ */

	ccd3.Parts.Series.Scatter = function(){ ccd3.Parts.Series.apply(this,arguments); };
	ccd3.Parts.Series.Scatter.prototype = new ccd3.Parts.Series();
	ccd3.Parts.Series.Scatter.prototype.get_defaults = function(){
		return {
			point_radius: 3,
			point_radius_highlight: 5
		};
	};
	ccd3.Parts.Series.Scatter.prototype.render = function(){
		var that = this;
		var i = this.series.series_num;
		var text_visibility = this.text_visibility();
		var xScale = this.chart.xAxis.scale;	
		var yScale = this.chart.yAxis.scale;
		var xAxis = this.chart.xAxis;	
		var yAxis = this.chart.yAxis;	
		var yFormat = this.chart.yAxis.format;
		this.color = this.chart._color(i);
		
		// data join
		var circles = this.svg.selectAll(".ccd3_circle_g").data(that.get_data());
		
		// enter
		circles
			.enter()
			.append("g")
			.attr("class","ccd3_circle_g")
			.style("opacity",0)
			.call(function(e){
				e.append("circle").attr("fill",that.color).attr("r",that.point_radius);
			})
			.call(function(e){
				e
				.append("text")
				.attr("text-anchor","middle")
				.attr("y","-0.5em")
				.text(function(d){
					return yFormat(d.y);
				})
				;
			})
			.on("mouseover", function(){
				d3.select(this).select("circle").attr("r",that.point_radius_highlight);
			})
			.on("mouseout", function(){
				d3.select(this).select("circle").attr("r",that.point_radius);
			})
			.call(that.chart.tooltip.add_listener,that.chart.tooltip)
			;
		
		// update
		circles
			.transition().duration(500)
			.attr("transform",function(d){
				var x,y;
				if(xAxis.scale_type==="ordinal"){
					x = xScale(d.x) + xScale.rangeBand()/2;
				}else{
					x = xScale(d.x);
				}
				if(yAxis.scale_type==="ordinal"){
					y = yScale(d.y) + yScale.rangeBand()/2;
				}else{
					y = yScale(d.y);
				}
				return "translate("+x+","+y+")";
			})
			.style("opacity",1)
			.call(function(e){
				e
				.select("text")
				.style("display",function(){ return (text_visibility)? null:"none"; })
				.attr("font-size",that.font_size);
			})
			;

		// exit
		circles.call(this.exit);

	};
	ccd3.Parts.Series.Scatter.prototype.highlight = function(onoff){
		if(onoff){
			this.svg.selectAll(".ccd3_circle_g circle")
				.attr("r",this.point_radius_highlight);
		}else{
			this.svg.selectAll(".ccd3_circle_g circle")
				.attr("r",this.point_radius);
		}
	};
	
	/* ------------------------------------------------------------------ */
	/*  ccd3.Parts.Series.Bar                                             */
	/* ------------------------------------------------------------------ */

	ccd3.Parts.Series.Bar = function(){ ccd3.Parts.Series.apply(this,arguments); };
	ccd3.Parts.Series.Bar.prototype = new ccd3.Parts.Series();
	ccd3.Parts.Series.Bar.prototype.get_defaults = function(){
		return {
			opacity: 0.7
		};
	};
	ccd3.Parts.Series.Bar.prototype.render = function(bar_cnt,bar_pos){
		var that = this;
		var i = this.series.series_num;
		var text_visibility = this.text_visibility();
		var wScale,hScale,format,hAxis,wAxis,width;
		var xy_func, width_func, height_func, value_func, text_xy_func;
		var band_padding;
		this.color = this.chart._color(i);
		
		if(this.chart.direction === "x"){
			wScale = this.chart.xAxis.scale;	
			hScale = this.chart.yAxis.scale;
			wAxis = this.chart.xAxis;
			hAxis = this.chart.yAxis;
			format = this.chart.yAxis.format;
			band_padding = this.chart.xAxis.band_padding;
		}else{
			wScale = this.chart.yAxis.scale;	
			hScale = this.chart.xAxis.scale;
			wAxis = this.chart.yAxis;
			hAxis = this.chart.xAxis;
			format = this.chart.xAxis.format;
			band_padding = this.chart.yAxis.band_padding;
		}
		
		if(wAxis.scale_type === "ordinal"){
			width = wScale.rangeBand();
		}else{
			width = Math.abs(wScale(wAxis.min_step) - wScale(0));
		}
		var width2 = width*(1.0-band_padding)/bar_cnt;
		
		if(this.chart.direction === "x"){
			value_func = function(d){ return d.y; };
			width_func = function(){ return width2; };
			height_func = function(d){ return Math.abs(hScale(0) - hScale(d.y)); };
			xy_func = function(d){
				var x = wScale(d.x) + width2*bar_pos + width*band_padding/2;
				if(wAxis.scale_type !== "ordinal"){
					x -= width/2;
				}
				var y = Math.min(hScale(0),hScale(d.y));
				return "translate("+x+","+y+")";
			};
			text_xy_func = function(){
				var x = width2/2 - this.getBBox().height/2;
				var y = this.getBBox().height/2;
				return "translate("+x+","+y+") rotate(90)";
			};
		}else{
			value_func = function(d){ return d.x; };
			width_func = function(d){ return Math.abs(hScale(0) - hScale(d.x)); };
			height_func = function(){ return width2; };
			xy_func = function(d){
				var y = wScale(d.y) + width2*bar_pos + width*band_padding/2;
				if(wAxis.scale_type !== "ordinal"){
					y -= width/2;
				}
				var x = Math.min(hScale(0),hScale(d.x));
				return "translate("+x+","+y+")";
			};
			text_xy_func = function(d){
				var y = width2/2 + this.getBBox().height/2;
				var x = hScale(d.x) - this.getBBox().width;
				return "translate("+x+","+y+")";
			};
		}
		
		// data join
		var bars = this.svg.selectAll(".ccd3_bar_g").data(that.get_data());
		
		// enter
		bars
			.enter()
			.append("g")
			.attr("class","ccd3_bar_g")
			.style("opacity",0)
			.call(function(e){
				e.append("rect").attr("fill",that.color);
			})
			.call(function(e){
				e
				.append("text")
				.text(function(d){
					return format(value_func(d));
				})
				;
			})
			.on("mouseover", function(){
				d3.select(this).style("opacity",1);
			})
			.on("mouseout", function(){
				d3.select(this).style("opacity",that.opacity);
			})
			.call(that.chart.tooltip.add_listener,that.chart.tooltip)
			;
		
		// update
		bars
			.transition().duration(500)
			.attr("transform",xy_func)
			.style("opacity",that.opacity)
			.call(function(e){
				e
				.select("rect")
				.attr("width",width_func)
				.attr("height",height_func)
				;
			})
			.call(function(e){
				e
				.select("text")
				.attr("visibility",function(){ return (text_visibility)? "visible":"hidden"; })
				.attr("transform",text_xy_func)
				.attr("font-size",that.font_size);
			})
			;
	
		// exit
		bars.call(this.exit);
	};
	ccd3.Parts.Series.Bar.prototype.highlight = function(onoff){
		if(onoff){
			this.svg.selectAll(".ccd3_bar_g")
				.style("opacity",1);
		}else{
			this.svg.selectAll(".ccd3_bar_g")
				.style("opacity",this.opacity);
		}
	};

	/* ------------------------------------------------------------------ */
	/*  ccd3.Parts.Series.StackedBar                                      */
	/* ------------------------------------------------------------------ */

	ccd3.Parts.Series.StackedBar = function(){ ccd3.Parts.Series.apply(this,arguments); };
	ccd3.Parts.Series.StackedBar.prototype = new ccd3.Parts.Series();
	ccd3.Parts.Series.StackedBar.prototype.get_defaults = function(){
		return {
			opacity: 0.7
		};
	};
	ccd3.Parts.Series.StackedBar.prototype.render = function(){
		var that = this;
		var i = this.series.series_num;
		var text_visibility = this.text_visibility();
		var wScale,hScale,format,hAxis,wAxis,width;
		var xy_func, width_func, height_func, value_func, text_xy_func;
		var band_padding;
		this.color = this.chart._color(i);
		
		if(this.chart.direction === "x"){
			wScale = this.chart.xAxis.scale;	
			hScale = this.chart.yAxis.scale;
			wAxis = this.chart.xAxis;
			hAxis = this.chart.yAxis;
			format = this.chart.yAxis.format;
			band_padding = this.chart.xAxis.band_padding;
		}else{
			wScale = this.chart.yAxis.scale;	
			hScale = this.chart.xAxis.scale;
			wAxis = this.chart.yAxis;
			hAxis = this.chart.xAxis;
			format = this.chart.xAxis.format;
			band_padding = this.chart.yAxis.band_padding;
		}

		if(wAxis.scale_type === "ordinal"){
			width = wScale.rangeBand();
		}else{
			width = Math.abs(wScale(wAxis.min_step) - wScale(0));
		}
		var width2 = width*(1.0-band_padding);
		
		if(this.chart.direction === "x"){
			value_func = function(d){ return d.y; };
			width_func = function(){ return width2; };
			height_func = function(d){ return Math.abs(hScale(d.y0) - hScale(d.y+d.y0)); };
			xy_func = function(d){
				var x = wScale(d.x) + width*band_padding/2;
				if(wAxis.scale_type !== "ordinal"){
					x -= width/2;
				}
				var y = Math.min(hScale(d.y0),hScale(d.y+d.y0));
				return "translate("+x+","+y+")";
			};
			text_xy_func = function(){
				var x = width2/2 - this.getBBox().height/2;
				var y = this.getBBox().height/2;
				return "translate("+x+","+y+") rotate(90)";
			};
		}else{
			value_func = function(d){ return d.x; };
			width_func = function(d){ return Math.abs(hScale(d.x0) - hScale(d.x+d.x0)); };
			height_func = function(){ return width2; };
			xy_func = function(d){
				var y = wScale(d.y) + width*band_padding/2;
				if(wAxis.scale_type !== "ordinal"){
					y -= width/2;
				}
				var x = Math.min(hScale(d.x0),hScale(d.x+d.x0));
				return "translate("+x+","+y+")";
			};
			text_xy_func = function(d){
				var y = width2/2 + this.getBBox().height/2;
				var x = (hScale(d.x+d.x0) - hScale(d.x0)) - this.getBBox().width - 5;
				return "translate("+x+","+y+")";
			};
		}
		
		// data join
		var bars = this.svg.selectAll(".ccd3_bar_g").data(that.get_data());
		
		// enter
		bars
			.enter()
			.append("g")
			.attr("class","ccd3_bar_g")
			.style("opacity",0)
			.call(function(e){
				e.append("rect").attr("fill",that.color);
			})
			.call(function(e){
				e
				.append("text")
				.text(function(d){
					return format(value_func(d));
				})
				.attr("transform","rotate(90)")
				;
			})
			.on("mouseover", function(){
				d3.select(this).style("opacity",1);
			})
			.on("mouseout", function(){
				d3.select(this).style("opacity",that.opacity);
			})
			.call(that.chart.tooltip.add_listener,that.chart.tooltip)
			;
		
		// update
		bars
			.transition().duration(500)
			.attr("transform",xy_func)
			.style("opacity",that.opacity)
			.call(function(e){
				e
				.select("rect")
				.attr("width",width_func)
				.attr("height",height_func)
				;
			})
			.call(function(e){
				e
				.select("text")
				.attr("visibility",function(){ return (text_visibility)? "visible":"hidden"; })
				.attr("transform",text_xy_func)
				.attr("font-size",that.font_size)
				;
			})
			;

		// exit
		bars.call(this.exit);

	};
	ccd3.Parts.Series.StackedBar.prototype.highlight = function(onoff){
		if(onoff){
			this.svg.selectAll(".ccd3_bar_g")
				.style("opacity",1);
		}else{
			this.svg.selectAll(".ccd3_bar_g")
				.style("opacity",this.opacity);
		}
	};
	
	/* ------------------------------------------------------------------ */
	/*  ccd3.Parts.Series.Line                                            */
	/* ------------------------------------------------------------------ */

	ccd3.Parts.Series.Line = function(){ ccd3.Parts.Series.apply(this,arguments); };
	ccd3.Parts.Series.Line.prototype = new ccd3.Parts.Series();
	ccd3.Parts.Series.Line.prototype.get_defaults = function(){
		return {
			opacity: 0.7,
			line_width: 1,
			line_width_highlight: 3,
			point_radius: 3,
			point_radius_highlight: 5
		};
	};
	ccd3.Parts.Series.Line.prototype.render = function(){
		var that = this;
		var i = this.series.series_num;
		var text_visibility = this.text_visibility();
		var xScale = this.chart.xAxis.scale;	
		var yScale = this.chart.yAxis.scale;
		var yFormat = this.chart.yAxis.format;
		this.color = this.chart._color(i);
		
		/* line path */
		// render line first not to prevent tooltip mouseover
		// data join
		var data = (this.series.visible)? [0] : [];
		var path_def = d3.svg.line()
			.x(function(d){ return xScale(d.x); })
			.y(function(d){ return yScale(d.y); })
			.interpolate("linear")
			;
		var path = this.svg.selectAll("path").data(data);
		// enter
		path
			.enter()
			.append("path")
			.attr("class","series_path")
			.attr("stroke",that.color)
			.attr("stroke-width",that.line_width)
			.attr("fill","none")
			.style("opacity",0)	
			;
		// update
		path
			.transition().duration(500)
			.attr("d",path_def(that.get_data()))
			.style("opacity",that.opacity)
			;
		// exit
		path.call(this.exit);
		
		/* point */
		// data join
		var circles = this.svg.selectAll(".ccd3_circle_g").data(that.get_data());
		
		// enter
		circles
			.enter()
			.append("g")
			.attr("class","ccd3_circle_g")
			.style("opacity",0)
			.call(function(e){
				e.append("circle").attr("fill",that.color).attr("r",that.point_radius);
			})
			.call(function(e){
				e
				.append("text")
				.attr("text-anchor","middle")
				.attr("y","-0.5em")
				.text(function(d){
					return yFormat(d.y);
				})
				;
			})
			.on("mouseover", function(){
				d3.select(this).select("circle").attr("r",that.point_radius_highlight);
				d3.select(this.parentNode).select(".series_path")
					.attr("stroke-width",that.line_width_highlight)
					;
			})
			.on("mouseout", function(){
				d3.select(this).select("circle").attr("r",that.point_radius);
				d3.select(this.parentNode).select(".series_path")
					.attr("stroke-width",that.line_width)
					;
			})
			.call(that.chart.tooltip.add_listener,that.chart.tooltip)
			;
		
		// update
		circles
			.transition().duration(500)
			.attr("transform",function(d){
				return "translate("+xScale(d.x)+","+yScale(d.y)+")";
			})
			.style("opacity",1)
			.call(function(e){
				e
				.select("text")
				.style("display",function(){ return (text_visibility)? null:"none"; })
				.attr("font-size",that.font_size)
				;
			})
			;

		
		// exit
		circles.call(this.exit);
	};
	ccd3.Parts.Series.Line.prototype.highlight = function(onoff){
		if(onoff){
			this.svg.selectAll(".ccd3_circle_g circle")
				.attr("r",this.point_radius_highlight);
			this.svg.selectAll(".series_path")
				.attr("stroke-width",this.line_width_highlight);
		}else{
			this.svg.selectAll(".ccd3_circle_g circle")
				.attr("r",this.point_radius);
			this.svg.selectAll(".series_path")
				.attr("stroke-width",this.line_width);
		}
	};

	/* ------------------------------------------------------------------ */
	/*  ccd3.Parts.Series.Bubble                                          */
	/* ------------------------------------------------------------------ */

	ccd3.Parts.Series.Bubble = function(){ ccd3.Parts.Series.apply(this,arguments); };
	ccd3.Parts.Series.Bubble.prototype = new ccd3.Parts.Series();
	ccd3.Parts.Series.Bubble.prototype.get_defaults = function(){
		return {
			opacity: 0.7,
			max_radius: 10,
			min_radius: 3,
			zFormat: ccd3.Util.default_numeric_format
		};
	};
	ccd3.Parts.Series.Bubble.prototype.render = function(){
		var that = this;
		var i = this.series.series_num;
		var text_visibility = this.text_visibility();
		var xScale = this.chart.xAxis.scale;	
		var yScale = this.chart.yAxis.scale;
		var xAxis = this.chart.xAxis;	
		var yAxis = this.chart.yAxis;	
		this.color = this.chart._color(i);
		
		if(this.zScale===undefined){
			var zMax = this.chart.dataset_manager.get_max(function(d){return d.z;});
			var zMin = this.chart.dataset_manager.get_min(function(d){return d.z;});
			this.zScale = d3.scale.linear()
				.range([this.min_radius,this.max_radius]).domain([zMin,zMax]);
		}
		var zScale = this.zScale;
		
		// data join
		// http://bl.ocks.org/mbostock/3808218
		var circles = this.svg.selectAll(".ccd3_bubble_g").data(that.get_data());
		
		// enter
		circles
			.enter()
			.append("g")
			.attr("class","ccd3_bubble_g")
			.style("opacity",0)
			.call(function(e){
				e.append("circle").attr("fill",that.color).attr("r",0);
			})
			.call(function(e){
				e
				.append("text")
				.attr("text-anchor","middle")
				.attr("y","0.4em")
				.text(function(d){
					return that.zFormat(d.z);
				})
				;
			})
			.on("mouseover", function(){
				d3.select(this).style("opacity",1);
			})
			.on("mouseout", function(){
				d3.select(this).style("opacity",that.opacity);
			})
			.call(that.chart.tooltip.add_listener,that.chart.tooltip)
			;
		
		// update
		circles
			.transition().duration(500)
			.attr("transform",function(d){
				var x,y;
				if(xAxis.scale_type==="ordinal"){
					x = xScale(d.x) + xScale.rangeBand()/2;
				}else{
					x = xScale(d.x);
				}
				if(yAxis.scale_type==="ordinal"){
					y = yScale(d.y) + yScale.rangeBand()/2;
				}else{
					y = yScale(d.y);
				}
				return "translate("+x+","+y+")";
			})
			.style("opacity",that.opacity)
			.call(function(e){
				e
				.select("circle")
				.attr("r",function(d){ return zScale(d.z); })
				;
			})
			.call(function(e){
				e
				.select("text")
				.attr("visibility",function(){ return (text_visibility)? "visible":"hidden"; })
				.attr("font-size",that.font_size)
				;
			})
			;
	
		// exit
		circles.call(this.exit);
	};
	ccd3.Parts.Series.Bubble.prototype.highlight = function(onoff){
		if(onoff){
			this.svg.selectAll(".ccd3_bubble_g")
				.style("opacity",1);
		}else{
			this.svg.selectAll(".ccd3_bubble_g")
				.style("opacity",this.opacity);
		}
	};
	ccd3.Parts.Series.Bubble.prototype.tooltip_html = function(d){
		var xFormat = this.chart.tooltip.xFormat || this.chart.xAxis.format;
		var yFormat = this.chart.tooltip.yFormat || this.chart.yAxis.format;
		var zFormat = this.chart.tooltip.zFormat || this.zFormat;
		var html = "";
		html += "<b>" + this.series.name + "</b>";
		html += "<br>x: " + xFormat(d.x);
		html += "<br>y: " + yFormat(d.y);
		html += "<br>z: " + zFormat(d.z);
		return html;
	};
	
	/* ------------------------------------------------------------------ */
	/*  ccd3.Parts.Series.Heatmap                                         */
	/* ------------------------------------------------------------------ */

	ccd3.Parts.Series.Heatmap = function(){ ccd3.Parts.Series.apply(this,arguments); };
	ccd3.Parts.Series.Heatmap.prototype = new ccd3.Parts.Series();
	ccd3.Parts.Series.Heatmap.prototype.get_defaults = function(){
		return {
			low_color: "red",
			high_color: "green",
			zFormat: ccd3.Util.default_numeric_format
		};
	};
	ccd3.Parts.Series.Heatmap.prototype.render = function(){
		var that = this;
		var i = this.series.series_num;
		var text_visibility = this.text_visibility();
		var xScale = this.chart.xAxis.scale;
		var yScale = this.chart.yAxis.scale;
		var xAxis = this.chart.xAxis;
		var yAxis = this.chart.yAxis;
		var width,height;
		this.color = this.chart._color(i);
		var xy_func, text_xy_func;
		
		if(xAxis.scale_type === "ordinal"){
			width = xScale.rangeBand();
		}else{
			width = Math.abs(xScale(xAxis.min_step) - xScale(0));
		}
		if(yAxis.scale_type === "ordinal"){
			height = yScale.rangeBand();
		}else{
			height = Math.abs(yScale(yAxis.min_step) - yScale(0));
		}
		// overloap rect not to make gap
		width += 1;
		height += 1;
		
		// cScale = color Scale
		if(this.cScale === undefined){
			var zMax = this.chart.dataset_manager.get_max(function(d){return d.z;});
			var zMin = this.chart.dataset_manager.get_min(function(d){return d.z;});
			// interpolate pattern http://bl.ocks.org/mbostock/3014589
			this.cScale = d3.scale.linear()
				.range([this.low_color, this.high_color]).domain([zMin,zMax])
				.interpolate(d3.interpolateHsl);
		}
		var cScale = this.cScale;
		
		xy_func = function(d){
			var x = xScale(d.x);
			if(xAxis.scale_type !== "ordinal"){
				x -= width/2;
			}
			var y = yScale(d.y);
			if(yAxis.scale_type !== "ordinal"){
				y -= height/2;
			}
			return "translate("+x+","+y+")";
		};
		text_xy_func = function(d){
			var x=width/2;
			var y=height/2 + this.getBBox().height/2;
			return "translate("+x+","+y+")";
		};
		
		// data join
		var rects = this.svg.selectAll(".ccd3_rect_g").data(that.get_data());
		
		// enter
		rects
			.enter()
			.append("g")
			.attr("class","ccd3_rect_g")
			.style("opacity",0)
			.call(function(e){
				e.append("rect").attr("fill",function(d){ return that.cScale(d.z); });
			})
			.call(function(e){
				e
				.append("text")
				.attr("text-anchor","middle")
				.text(function(d){
					return that.zFormat(d.z);
				})
				;
			})
			.call(that.chart.tooltip.add_listener,that.chart.tooltip)
			;
		
		// update
		rects
			.transition().duration(500)
			.style("opacity",that.opacity)
			.attr("transform",xy_func)
			.call(function(e){
				e
				.select("rect")
				.attr("width",width)
				.attr("height",height)
				;
			})
			.call(function(e){
				e
				.select("text")
				.attr("visibility",function(){ return (text_visibility)? "visible":"hidden"; })
				.attr("font-size",that.font_size)
				.attr("transform",text_xy_func);
			})
			;
	
		// exit
		rects.call(this.exit);

	};
	ccd3.Parts.Series.Heatmap.prototype.tooltip_html = function(d){
		var xFormat = this.chart.tooltip.xFormat || this.chart.xAxis.format;
		var yFormat = this.chart.tooltip.yFormat || this.chart.yAxis.format;
		var zFormat = this.chart.tooltip.zFormat || this.zFormat;
		var html = "";
		html += "x: " + xFormat(d.x);
		html += "<br>y: " + yFormat(d.y);
		html += "<br>z: " + zFormat(d.z);
		return html;
	};
	
	/* ------------------------------------------------------------------ */
	/*  ccd3.Parts.Series.Pie                                             */
	/* ------------------------------------------------------------------ */

	ccd3.Parts.Series.Pie = function(){ ccd3.Parts.Series.apply(this,arguments); };
	ccd3.Parts.Series.Pie.prototype = new ccd3.Parts.Series();
	ccd3.Parts.Series.Pie.prototype.get_defaults = function(){
		return {
			inner_radius: 0.0,
			radius_nofocus: 0.95,
			opacity: 0.7,
			yFormat: undefined,
			pFormat: ccd3.Util.default_percent_format
		};
	};
	ccd3.Parts.Series.Pie.prototype.render = function(){
		var that = this;
		var radius = Math.min(this.chart.inner_height,this.chart.inner_width)/2;
		var arc = d3.svg.arc().outerRadius(radius*this.radius_nofocus).innerRadius(radius*this.inner_radius);
		
		if(this.yFormat===undefined){
			this.yFormat = ccd3.Util.default_numeric_format;
		}
		
		var pie = d3.layout.pie().sort(null)
			.value(function(d) { return d.y; });
		
		this.svg.attr("transform", function(){
			return "translate("+(that.chart.inner_width/2)+","+(that.chart.inner_height/2)+")"; 
		});
		
		// data join
		var pie_data = pie(this.get_data());
		var arcs = this.svg.selectAll(".ccd3_arc_g").data(pie_data);
		
		// enter
		arcs.enter()
			.append("g")
			.attr("class","ccd3_arc_g")
			.style("opacity",this.opacity)
			.on("mouseover", function(){
				d3.select(this)
					.style("opacity",1)
					.select("path")
					.attr("d",function(d,i){
						arc.outerRadius(radius);
						return arc(d);
					});
			})
			.on("mouseout", function(){
				d3.select(this)
					.style("opacity",that.opacity)
					.select("path")
					.attr("d",function(d,i){
						arc.outerRadius(radius*that.radius_nofocus);
						return arc(d);
					});
			})
			.call(that.chart.tooltip.add_listener,that.chart.tooltip)
			.call(function(e){
				e.append("path")
				.style("fill",function(d,i){ return that.chart._color(i); });
			})
			.call(function(e){
				e.append("text")
				.attr("dy", ".35em")
				.style("text-anchor", "middle")
				.call(function(e){
					e.append("tspan")
					.attr("class","label_x")
					.attr("y","-1em")
					;
				})
				.call(function(e){
					e.append("tspan")
					.attr("class","label_p")
					.attr("dy","1em")
					.attr("x",0)
					;
				})
				.call(function(e){
					e.append("tspan")
					.attr("class","label_y")
					.attr("dy","1em")
					.attr("x",0)
					;
				});
			});
		
		// update
		arcs
			.transition().duration(500)
			.call(function(e){
				e.select("path")
				.attr("d",arc);
			})
			.call(function(e){
				e.select("text")
				.attr("transform", function(d) { return "translate(" + arc.centroid(d) + ")"; })
				.call(function(e){
					e.select("tspan.label_x")
					.text(function(d){ return d.data.x; })
					;
				})
				.call(function(e){
					e.select("tspan.label_p")
					.text(function(d){ return that.pFormat(that.calc_percent(d)); })
					;
				})
				.call(function(e){
					e.select("tspan.label_y")
					.text(function(d){ return that.yFormat(d.data.y); })
					;
				});
			});
		
		// exit
		arcs.call(this.exit);
	};
	ccd3.Parts.Series.Pie.prototype.calc_percent = function(d){
		return (d.endAngle - d.startAngle) / (Math.PI * 2.0);
	};
	ccd3.Parts.Series.Pie.prototype.tooltip_html = function(d){
		var yFormat = this.chart.tooltip.yFormat || this.yFormat;
		var html = "";
		html += "<b>" + d.data.x + "</b>";
		html += "<br>%: " + this.pFormat(this.calc_percent(d));
		html += "<br>value: " + yFormat(d.data.y);
		return html;
	};
	
	/* ------------------------------------------------------------------ */
	/*  ccd3.Parts.Series.Radar                                           */
	/* ------------------------------------------------------------------ */
	
	ccd3.Parts.Series.Radar = function(){ ccd3.Parts.Series.apply(this,arguments); };
	ccd3.Parts.Series.Radar.prototype = new ccd3.Parts.Series();
	ccd3.Parts.Series.Radar.prototype.get_defaults = function(){
		return {
			point_radius: 5,
			point_radius_highlight: 8
		};
	};
	ccd3.Parts.Series.Radar.prototype.render = function(){
		var that = this;
		var data = this.get_data();
		var rScale = this.chart.rAxis.scale;
		var aScale = this.chart.aAxis.scale;
		var i = this.series.series_num;
		this.color = this.chart._color(i);
		
		var trans_xy = function(d){
			return [
				Math.sin(aScale(d.x))*rScale(d.y),
				Math.cos(aScale(d.x))*rScale(d.y) * -1.0];
		};
		
		this.svg.attr("transform", function(){
			return "translate("+(that.chart.inner_width/2)+","+(that.chart.inner_height/2)+")"; 
		});
		
		/* polygon */
		var poly_data = (this.series.visible)? [0] : [];
		var poly = this.svg.selectAll(".ccd3_poly").data(poly_data);
		// enter
		poly.enter()
			.append("polygon")
			.attr("class","ccd3_poly")
			.attr("stroke",that.color)
			.attr("stroke-width",2)
			.attr("fill",that.color)
			.attr("fill-opacity",0.1)
			.on("mouseover", function(){
				d3.select(this).style("fill-opacity",0.5);
			})
			.on("mouseout", function(){
				d3.select(this).style("fill-opacity",0.1);
			})
			;
		// update
		poly
			.transition().duration(500)
			.attr("points",function(d){
				var str="",xy;
				for(var i=0,len=data.length;i<len;i++){
					xy = trans_xy(data[i]);
					str += xy[0] + "," + xy[1] + " ";
				}
				return str;
			})
			;
		// exit
		poly.call(this.exit);
		
		
		/* points */
		// data join
		var points = this.svg.selectAll(".ccd3_points_g").data(data);
		// enter
		points.enter()
			.append("g")
			.call(that.chart.tooltip.add_listener,that.chart.tooltip)
			.attr("class","ccd3_points_g")
			.call(function(e){
				e.append("circle").attr("fill",that.color).attr("r",that.point_radius);
			})
			.on("mouseover", function(){
				d3.select(this).select("circle").attr("r",that.point_radius_highlight);
			})
			.on("mouseout", function(){
				d3.select(this).select("circle").attr("r",that.point_radius);
			})
			;
		// update
		points
			.transition().duration(500)
			.attr("transform",function(d){
				var xy = trans_xy(d);
				return "translate("+xy[0]+","+xy[1]+")";
			})
			;
		
		// exit
		points.call(this.exit);
		
	};
	ccd3.Parts.Series.Radar.prototype.highlight = function(onoff){
		if(onoff){
			this.svg.selectAll(".ccd3_poly")
				.style("fill-opacity",0.5);
		}else{
			this.svg.selectAll(".ccd3_poly")
				.style("fill-opacity",0.1);
		}
	};
	ccd3.Parts.Series.Radar.prototype.tooltip_html = function(d){
		var aFormat = this.chart.tooltip.aFormat || this.chart.aAxis.format;
		var rFormat = this.chart.tooltip.rFormat || this.chart.rAxis.format;
		var html = "";
		html += "<b>" + this.series.name + "</b>";
		html += "<br>x: " + aFormat(d.x);
		html += "<br>y: " + rFormat(d.y);
		return html;
	};
	
	/* ------------------------------------------------------------------ */
	/*  ccd3.DatasetManager                                               */
	/* ------------------------------------------------------------------ */

	ccd3.DatasetManager = function(chart){
		this.chart = chart;
	};
	ccd3.DatasetManager.prototype.setup = function(dataset){
		var i,len;
		var type_info = ccd3.Parts.Series.type_info();
		
		// deep copy dataset
		this.dataset = ccd3.Util.copy(dataset);
		this.dataset_original = ccd3.Util.copy(dataset);
		dataset = this.dataset;
		
		// set default properties
		for(i=0,len=dataset.length;i<len;i++){
			dataset[i].series_num = i;
			if(dataset[i].series_type === undefined){
				dataset[i].series_type = this.chart.default_series_type;
			}
			if(dataset[i].name === undefined){
				dataset[i].name = "series"+(i+1);
			}
			if(dataset[i].visible === undefined){
				dataset[i].visible = true;
			}
			if(dataset[i].color !== undefined){
				this.chart.color_palette[i] = dataset[i].color;
			}
		}
		
		// check dataset
		var st_ar = []; // st = series_type
		for(i=0,len=dataset.length;i<len;i++){
			if(dataset[i].series_type !== undefined && !(type_info.hasOwnProperty(dataset[i].series_type))){
				throw new Error("invalid series_type");
			}
			st_ar.push(dataset[i].series_type);
		}
		for (var key in type_info) {
			if(type_info.hasOwnProperty(key)){
				if(type_info[key].is_single_series && st_ar.indexOf(key)>=0 && st_ar.length>1){
					throw new Error("If you use '"+key+"' series_type, you must set only one series in dataset.");
				}
			}
		}
		
		if(st_ar.indexOf("bar")>=0 && st_ar.indexOf("stackedbar")>=0){
			throw new Error("You can't use 'bar' and 'stackedbar' series_type at the same time.");
		}
		
		return dataset;
	};
	ccd3.DatasetManager.prototype.detect_chart_pattern = function(){
		if(this.dataset[0].series_type === "pie"){
			return "r";
		}else if(this.dataset[0].series_type === "radar"){
			return "ra";
		}
		return "xy";
	};
	ccd3.DatasetManager.prototype.options_from_dataset = function(){
		var options = {};
		
		if(this.dataset[0].series_type === "heatmap"){
			options = {
				legend: { show: false },
				xAxis: { band_padding: 0, domain_margin_type: "grid" },
				yAxis: { band_padding: 0, domain_margin_type: "grid" }
			};
		}
		
		return options;
	};
	ccd3.DatasetManager.prototype.has_directive_series_type = function(){
		var directives = ["bar","stackedbar","line"];
		for(var i=0,len=this.dataset.length;i<len;i++){
			if(directives.indexOf(this.dataset[i]) >= 0){
				return true;
			}
		}
		return false;
	};
	ccd3.DatasetManager.prototype.detect_scale_type = function(func){
		var sample = func.call(this,this.dataset[0].values[0]);
		if(sample instanceof Date){
			return "date";
		}else if(typeof sample === "number"){
			return "linear";
		}else if(typeof sample === "string"){
			return "ordinal";
		}else{
			return null;
		}
	};
	ccd3.DatasetManager.prototype.calc_min_step = function(func){
		var dataset = this.dataset;
		var min,step;
		var sort_func = function(a,b){ return b-a; };
		for(var i=0;i<dataset.length;i++){
			var ar = [];
			for(var j=0;j<dataset[i].values.length;j++){
				ar.push(func.call(this,dataset[i].values[j]));
			}
			ar.sort(sort_func);
			for(var k=1;k<ar.length;k++){
				if(ar[k]===ar[k-1]){ continue; }
				step = Math.abs(ar[k] - ar[k-1]);
				if(min===undefined){
					min = step;
				}else{
					min = (min > step)? step : min;
				}
			}
		}
		return min; // return undefined if series has only one data
	};
	ccd3.DatasetManager.prototype.update_stack_values = function(direction,stack_type){
		var dataset = this.dataset;
		var dataset_stackedbar = [];
		if(!stack_type){ stack_type = "zero"; }
		
		for(var i=0;i<dataset.length;i++){
			if(dataset[i].series_type==="stackedbar" && dataset[i].visible){
				dataset_stackedbar.push(dataset[i]);
			}
		}
		if(dataset_stackedbar.length>0){
			var stack;
			
			if(direction === "x"){
				stack = d3.layout.stack()
					.offset(stack_type)
					.values(function(d){ return d.values; });
				stack(dataset_stackedbar);
			}
			if(direction === "y"){
				stack = d3.layout.stack()
					.offset(stack_type)
					.values(function(d){ return d.values; })
					.x(function(d){ return d.y; })
					.y(function(d){ return d.x; })
					.out(function(d,x0,x){ d.x0=x0; d.x=x; })
					;
				stack(dataset_stackedbar);
			}
		}
	};
	ccd3.DatasetManager.prototype.get_max = function(func){
		return d3.max(this.dataset.map(function(d){ 
			if(d.visible){
				return d3.max(d.values,function(d2){ return func(d2); });
			}else{
				return null;
			}
		}));
	};
	ccd3.DatasetManager.prototype.get_min = function(func){
		return d3.min(this.dataset.map(function(d){ 
			if(d.visible){
				return d3.min(d.values,function(d2){ return func(d2); });
			}else{
				return null;
			}
		}));
	};
	
	/* ------------------------------------------------------------------ */
	/*  ccd3.DatasetLoader                                                */
	/* ------------------------------------------------------------------ */

	ccd3.DatasetLoader = function(chart){
		this.chart = chart;
		this.source = undefined; // function or base_url
		this.params = undefined; // arguments for function or url get-params(js obj)
		this.before_filter = undefined;
		this.after_filter = undefined;
	};
	ccd3.DatasetLoader.prototype.load = function(params){
		if(typeof this.source === "function"){
			// load data by javascript-function
			var p = ccd3.Util.merge(this.params, params);
			if(this.before_filter){
				p = this.before_filter.apply(this,[p]);
			}
			var dataset = this.source.apply(this,[p]);
			if(this.after_filter){
				dataset = this.after_filter.apply(this,[dataset]);
			}
			this.chart.dataset = dataset;
			this.chart.initialized = false;
			this.chart.render();
		}else if(typeof this.source === "string"){
			var url;
			// load data by url
			params = ccd3.Util.merge(this.params, params);
			var setup_params = function(base_url,params){
				var str = "";
				for(var key in params){
					if(str!==""){ str += "&"; }
					str += key + "=" + params[key];
				}
				return base_url + "?" + str;
			};
			if(this.before_filter){
				url = this.before_filter.apply(this,[this.source, params, setup_params]);
			}else{
				url = setup_params(this.source, params);
			}
			d3.json(url,function(dataset){
				if(this.after_filter){
					dataset = this.after_filter.apply(this,[dataset]);
				}
				this.chart.dataset = dataset;
				this.chart.initialized = false;
				this.chart.render();
			}.bind(this));
		}
	};

	/* ------------------------------------------------------------------ */
	/*  ccd3.Util                                                         */
	/* ------------------------------------------------------------------ */
	ccd3.Util = {};
	/**
	* merge object(overwrite properties)
	* thanks to https://gist.github.com/ww24/2181560
	*/
	ccd3.Util.merge = function(a,b){
		for (var key in b) {
			if (b.hasOwnProperty(key)) {
				a[key] = (key in a) ? 
					((typeof a[key] === "object" && typeof b[key] === "object") ?
						ccd3.Util.merge(a[key], b[key]) : b[key]) : b[key];
			}
		}
		return a;
	};
	ccd3.Util.copy = function(obj){
		// deep copy dataset and so on.
		if (null === obj || undefined === obj || "object" != typeof obj) return obj;
		var copy;
		
		if (obj instanceof Date) {
			copy = new Date();
			copy.setTime(obj.getTime());
			return copy;
		}
		if (obj instanceof Array) {
			copy = [];
			for (var i = 0, len = obj.length; i < len; i++) {
				copy[i] = ccd3.Util.copy(obj[i]);
			}
			return copy;
		}
		if (obj instanceof Object) {
			copy = {};
			for (var attr in obj) {
				if (obj.hasOwnProperty(attr)) copy[attr] = ccd3.Util.copy(obj[attr]);
			}
			return copy;
		}
		
		throw new Error("Unable to copy obj! Its type isn't supported.");
	};
	ccd3.Util.default_numeric_format = function(d){
		// ref https://github.com/mbostock/d3/wiki/Formatting 
		return d3.format(",.2s")(d); // 120k
		// return d3.format(",.0f")(d); // 123,456
		// return d3.format(",.2f")(d); // 123,456.78
		// return d3.format(",.3r")(d); // 123,000 or 0.0123
	};
	ccd3.Util.default_date_format = function(d){
		// ref https://github.com/mbostock/d3/wiki/Time-Formatting
		return d3.time.format("%m/%d")(d);
	};
	ccd3.Util.default_percent_format = function(d){
		return d3.format(",.1%")(d);
	};
	ccd3.Util.swap_dataset_xy = function(dataset){
		var tmp;
		for(var i=0,len=dataset.length;i<len;i++){
			for(var j=0,len2=dataset[i].values.length;j<len2;j++){
				tmp = dataset[i].values[j].x;
				dataset[i].values[j].x = dataset[i].values[j].y;
				dataset[i].values[j].y = tmp;
			}
		}
		return dataset;
	};
	
	return ccd3;
}();
