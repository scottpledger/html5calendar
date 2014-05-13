var HT5CEvent;
HT5CEvent = (function(undefined){
	function HT5CEvent(el){
		var start, end;

		for(var k in HT5CEvent.defaults){
			this[k] = HT5CEvent.defaults[k];
		}

		if($.isPlainObject(el)){
			for(var k in el){
				if(k=='start'){
					start = el[k];
				} else if(k=='end'){
					end = el[k];
				} else {
					this[k]=el[k];
				}
			}
			this.element = $('<li></li>');
		} else if ($.type($(el)[0])=='object') {
			var $el = $(el),
			    attrs = $el[0].attributes,
			    attr,attrName;
			if($el.data('event')&&$el.data('event')!=null){
				return $el.data('event');
			}

			for(var k=0;k<attrs.length;k++){
				attr = attrs[k];
				if(attr.name.slice(0,HT5CEvent.attr_prefix.length)==HT5CEvent.attr_prefix){
					attrName = attr.name.slice(HT5CEvent.attr_prefix.length);
					if(attrName=='start'){
						start = attr.value;
					} else if(attrName=='end'){
						end = attr.value;
					} else {
						this[attr.name.slice(HT5CEvent.attr_prefix.length)] = attr.value;
					}
					
				}
			}

			this.element = $el;

			if($el.attr('draggable')){
				$el.attr('draggable',false);
				this.movable = true;
			} else {
				this.movable = false;
			}

			if($el.attr('resizable')){
				$el.attr('resizable',false);
				this.resizable = true;
			} else {
				this.resizable = false;
			}
		} else {
			throw new Error('Invalid Event!');
		}

		start = moment(start);
		end = moment(end);

		if(start.isValid()){
			this.start = start;
		} else {
			throw new Error('Invalid Event!');
		}

		if (end.isValid()) {
			this.end = end;
			if(this.end.isBefore(this.start)){
				throw new Error('Invalid Event!');
			}
			
		}

		if (this.allDay){
			this.start.startOf('day');
			this.end = moment(start).endOf('day');
		}

		this.range = moment.range(start,end);

		if(this.html){
			this.element.html(this.html);
		}

		if(this.resizable){
			this.element.append('<hr class="ht5c-event-resizeHandle">');
		}

		this.element.addClass('ht5c-event');
		this.element.data('event',this);

		this._segments = [];
	}

	HT5CEvent.attr_prefix = 'data-calendar-event-';

	HT5CEvent.prototype._rmSegments = function(){
		$(this._segments).each(function(i,el){
			$(el).remove();
		});
		this._segments = [];
	};

	HT5CEvent.prototype._getSegment = function(){
		var $nel = this.element.clone();
		$nel.data('event',this);
		this._segments.push($nel);
		return $nel;
	}

	HT5CEvent.prototype.makeSegments = function(on,tMin,tMax){
		this._rmSegments();
		var chunks = this.range.chunk('into'+on),
		    i,nRange,$nel,topOffset,mStart,mEnd;
		this.element.find('[data-calendar-event-receive="timeSpan"]').html(this.range.format());
		for(i in chunks){
			nRange = chunks[i];
			mStart = nRange.start;
			mEnd = nRange.end;
			$nel = this._getSegment();

			topOffset = mStart.diff(moment(mStart).startOf('day'),'hours',true);

			$nel.data('range',nRange);

			$nel.data('dimensions',{
				'top':topOffset,
				'height':mEnd.diff(mStart,'hours',true)
			});
		}

		return $(this._segments);

	};

	HT5CEvent.prototype.redraw = function(){
		this.element.find('[data-calendar-event-receive="timeSpan"]').html(this.range.format());
		$(this._segments).find('[data-calendar-event-receive="timeSpan"]').html(this.range.format());
	}

	HT5CEvent.prototype.clone = function(){
		var $nel = this.element.clone(),nev,i;
		$nel.attr('data-calendar-event-start',this.start.format());
		$nel.attr('data-calendar-event-end',this.end.format());
		$nel.attr('data-calendar-event-allDay',this.allDay);
		nev = new HT5CEvent($nel);
		for(i in this._segments){
			nev._segments.push(this._segments[i].clone());
		}
		
		return nev;
	};

	HT5CEvent.prototype.show = function(){
		$(this._segments).each(function(i,el){$(el).css('display','block')});
	};

	HT5CEvent.prototype.hide = function(){
		$(this._segments).each(function(i,el){$(el).css('display','none')});
	};

	HT5CEvent.prototype.addClass = function(){
		$.fn.addClass.apply(this.element,Array.prototype.slice.apply(arguments,[0]));
		$.fn.addClass.apply($(this._segments),Array.prototype.slice.apply(arguments,[0]));
		return this;
	};

	HT5CEvent.prototype.removeClass = function(){
		$.fn.removeClass.apply(this.element,Array.prototype.slice.apply(arguments,[0]));
		$.fn.removeClass.apply($(this._segments),Array.prototype.slice.apply(arguments,[0]));
		return this;
	};

	HT5CEvent.prototype.add = function(){
		this.start.add(arguments[0],arguments[1]);
		this.end.add(arguments[0],arguments[1]);
		this.range = moment.range(this.start,this.end);
	};

	HT5CEvent.prototype.update = function(){
		this.range = moment.range(this.start,this.end);
	};

	HT5CEvent.prototype.remove = function(){
		this.element.remove();
		$(this._segments).each(function(i,el){$(el).remove();});
	};




	HT5CEvent.defaults = {
		'allDay':false
	};

	return HT5CEvent;
})();

$.widget("custom.html5calendar",$.ui.mouse,{
	'options': {
		'dayBegin':'09:00:00',
		'dayEnd':'21:00:00',
		'slotDuration':'00:30:00',
		'currentDate':'today',
		'daysPerWeek':7,
		'firstDayOfWeek':0, //Sunday
		'rowLabelFormat':'h a',
		'dayLabelFormat':'M/D',
		'monthLabel': 'MMM YYYY',
		'type':'agenda',
		'eventRangeFormat':undefined
	},
	_create: function() {
		var self=this;
		this.element.addClass('html5calendar');
		this._get_opts_from_element();
		this.weekOffset=0;
		this.today = moment();
		this.currentDate = (this.options.currentDate=='today'?moment():moment(this.options.currentDate));
		this.innerElement = this.element.find('.ht5c-inner');
		if(this.innerElement.length===0){
			this.innerElement = $('<div class="ht5c-inner"></div>');
			this.element.append(this.innerElement);
		}
		
		this.view_container=$('<div class="ht5c-view"></div>');
		this.weeks_list=$('<ul class="ht5c-weeks"></ul>');
		
		this.hour_rows=$('<ul class="ht5c-hours"><li></li></ul>');
		this.days={};
		this.weeks={};
		this.colWidth=100/this.options.daysPerWeek;
		this.hourHeight=0;
		this.innerElement.append(this.hour_rows);
		this.innerElement.append(this.view_container);
		this.view_container.append(this.weeks_list);
		this.eventData=this.element.find('[data-calendar-events]');
		this.today.startOf('day');
		this.element.find('[data-calendar-action]').on('click',function(){
			var $t=$(this);
			self.element.html5calendar($t.attr('data-calendar-action'));
		});
		this.element.find('[data-calendar-option]').on('click',function(){
			var $t=$(this);
			self.element.html5calendar('option',$t.attr('data-calendar-option'),$t.attr('data-calendar-optionValue'));
		});
		this._parse_events();
		this.innerElement.removeClass('agenda basic month')
			.addClass(this.options.type);
		this.element.removeClass('ht5c-agenda ht5c-basic ht5c-month')
				.addClass('ht5c-'+this.options.type);
		
		this.relayout();

		this._mouseInit();
	},
	_get_opts_from_element:function(){
		var val;
		for(var i in this.options){
			val = this.element.attr('data-calendar-'+i.toLowerCase());
			if(val!==undefined){
				this.options[i] = val;
			}
		}
	},
	_parse_events:function(){
		var self=this,
			hourBegin = moment.duration(this.options.dayBegin),
			hourEnd = moment.duration(this.options.dayEnd),
			maxHeight = hourEnd.subtract(hourBegin).asHours();
		this._hourBegin = hourBegin;
		this._hourEnd = hourEnd;
		this._maxHeight = maxHeight;
		this.innerElement
			.removeClass('days-1 days-2 days-3 days-4 days-5 days-6 days-7')
			.addClass('days-'+this.options.daysPerWeek);
		this.eventData.children('li').each(function(i,el){
			var ev = new HT5CEvent(el);
			self._place_event(ev);
		});
	},
	_place_event:function(ev){
		var $segs = ev.makeSegments('days'), self=this;

		$segs.each(function(i,el){
			var $el = $(el), dims,top,height,cssData;
			$el.appendTo(self._get_day($el.data('range').start));
			dims = $el.data('dimensions');
			top = dims.top-self._hourBegin.asHours();
			height = dims.height;
			if(top<0){
				top =0;
				height += top;
			}
			height = Math.min(self._maxHeight,height);
			cssData = {
				'top': top+'em', 'height':height+'em'
			};
			$el.data('css',cssData);
			$el.css(self.options.type=='agenda'?cssData:{
				'top':'0em','height':'auto'
			});
		});
		
		ev.redraw();
	},
	_get_week:function(mDay){
		
		mDay=moment(mDay).startOf('week');
		var weekLabel = mDay.format("YYYYww");
		
		if(this.weeks[weekLabel]!==undefined){
			return this.weeks[weekLabel];
		}

		var	week = $('<ul data-calendar-weekLabel="'+weekLabel+'" class="ht5c-days"></ul>'),
			week_li = $('<li class="ht5c-week"></li>'), k;
		
		this.weeks[weekLabel]=week;

		week.data('date',mDay);
		week_li.data('diff',mDay.diff(moment(this.today).startOf('week'),'weeks',true));
		
		week_li.append(week);

		this._populate_week(week,mDay);

		for(k in this.weeks){
			if(k>weekLabel){
				this.weeks[k].parent().before(week_li);
				return week;
			}
		}
		
		this.weeks_list.append(week_li);
		
		return week;
	},
	_populate_week:function(week,mD){
		var mDay = moment(mD),k;

		for(k=0; k < this.options.daysPerWeek; k++){
			week.append(this._make_day(mDay));
			mDay.add(1,'days');
		}
	},
	_make_day:function(mD){
		var mDay = moment(mD),
			fullDayLabel = mDay.format('YYYYDDDD'),
				dayLabel = dayLabel = mDay.format(this.options.dayLabelFormat),
				day = $('<ul data-calendar-dayLabel="'+dayLabel+'" class="ht5c-events"></ul>'),
				day_li = $('<li class="ht5c-day year-'+mDay.format('YYYY')+' month-'+mDay.format('M')+' day-'+mDay.format('D')+'"><time>'+dayLabel+'</time></li>');
		day_li.append(day);
		this.days[fullDayLabel] = day;
		return day_li;
	},
	_get_day:function(mD){
		var mDay=moment(mD).startOf('day');
		var fullDayLabel=mDay.format('YYYYDDDD'),
			week=this._get_week(mDay);
		
		if(this.days[fullDayLabel]!==undefined){
			return this.days[fullDayLabel];
		}

		var	day_li = this._make_day(mDay);
		week.append(day_li);

		for(k in week.days){
			if(k>dayLabel){
				week.days[k].parent().before(day_li);
			}
		}

		return day;
	},
	_layout_hour_rows:function(){
		var t0 = moment().startOf('day').add(moment.duration(this.options.dayBegin)),
			dt = moment.duration(this.options.slotDuration),
			tM = moment(t0).startOf('day').add(moment.duration(this.options.dayEnd)),
			prev='',
			p=dt.asHours(),
			n=0;
		this.hourSize = p;
		while(t0.isBefore(tM) && n<100){
			var $li=$('<li class="ht5c-hour"></li>'),
					label='<time>'+t0.format(this.options.rowLabelFormat)+'</time>';
			if(label!=prev){
				$li.append(label);
			}
			prev=label;
			this.hour_rows.append($li);
			$li.css({
				'top':n*p+'em',
				'height':p+'em',
				'line-height':p+'em'
			});

			this.hourHeight = $li.height();
			
			t0.add(dt);
			n++;
		}
		this.innerElement.data('hours-height',(0.5+n*p));
	},
	_layout_days:function(){
		var self=this,
			tBegin = moment(this.currentDate);

		var t0 = moment(tBegin),
		    dt = moment.duration(1,"day"),
		    n=0,$el;
		
		for(n=0;n<this.options.daysPerWeek;n++){
			$el = this._get_day(t0);
			this.dayHeight = $el.parent('li').height();
			t0=moment(t0).add(1,"days");
		}
	},
	_layout_weeks:function(){
		this.currentDate.startOf('week').add(this.options.firstDayOfWeek,'day');
		this._layout_days();
		this.innerElement.css('height',this.innerElement.data('hours-height')+'em');

	},
	_layout_months:function(){
		var mOrig = moment(this.currentDate),
		    mLast = moment(this.currentDate).endOf('month'),n=1;
		this.currentDate.startOf('month');
		
		while(this.currentDate.isBefore(mLast)){
			this._layout_weeks();
			this.currentDate.add(1,'week');
			n++;
		}

		this.currentDate = mOrig;
		this.innerElement.css('height',(n-1)+'em');
	},
	_update_weeks:function(){
		var week_li;
		for(var k in this.weeks){
			week_li=this.weeks[k].parent();

			week_li.css(this.options.type=='agenda'?{
				'left':(week_li.data('diff')*100)+"%",'top':0
			}:{
				'top':(week_li.data('diff'))+'em','left':0
			});
		}
	},
	_update_events:function(){
		var self=this;
		this.innerElement.find('li.ht5c-event').each(function(i,el){
			var $el=$(el);
			
			$el.css(self.options.type=='agenda'?$el.data('css'):{
				'top':'0em','height':'auto'
			})
		});
	},
	_update_view:function(){
		var tBegin = moment(this.currentDate);
		this._update_events();
		
		if(this.options.type=='agenda'){
			this.element.find('[data-calender-receive="currentDate"]')
			.html(moment.range(tBegin,moment(tBegin).add(this.options.daysPerWeek,'days'))
				.format({
					'__default__':['MMM D','MMM D YYYY']
				}));

			this._layout_weeks();
			this._update_weeks();
			this.weeks_list.css({
				'top':0,
				'left': (moment(this.today).startOf('week').diff(moment(this.currentDate).startOf('week'), 'days')*this.colWidth)+"%"
			});
		} else if(this.options.type=='basic'){
			this.element.find('[data-calender-receive="currentDate"]')
			.html(moment.range(tBegin,moment(tBegin).add(this.options.daysPerWeek,'days'))
				.format({
					'__default__':['MMM D','MMM D YYYY']
				}));

			this._layout_weeks();
			this._update_weeks();
			this.weeks_list.css({
				'top':0,
				'left': (moment(this.today).startOf('week').diff(moment(this.currentDate).startOf('week'), 'days')*this.colWidth)+"%"
			});
		} else if(this.options.type=='month'){
			this.element.find('[data-calender-receive="currentDate"]')
			.html(tBegin.format(this.options.monthLabel));
			this.element.removeClass('month-1 month-2 month-3 month-4 month-5 month-6 month-7 month-8 month-9 month-10 month-11 month-12')
				.addClass('month-'+this.currentDate.format('M'));
			this._layout_months();
			this._update_weeks();
			this.weeks_list.css({
				'left':0,
				'top': (moment(this.today).startOf('week').diff(moment(this.currentDate).startOf('month').startOf('week'), 'weeks'))+"em"
			});
		}
	},
	_setOption: function(key,value){
		this._super( key, value );

		if(key=='type' || key=='currentDate'){
			this.innerElement.removeClass('agenda basic month')
				.addClass(this.options.type);
			this.element.removeClass('ht5c-agenda ht5c-basic ht5c-month')
				.addClass('ht5c-'+this.options.type);
			this._update_view();
		}
	},
	_getMouseTargetEvent:function(event){
		var $t = $(event.target);
		if($t.is('.ht5c-event')){
			return $t.data('event');
		} else {
			$t = $t.parents('.ht5c-event');
			if($t.length==1){
				return $t.data('event');
			}
		}
		return (function(u){return u;})();
	},
	_getMouseTarget:function(event){
		var $t = $(event.target);
		if($t.is('.ht5c-event') && $t.data('event').movable){
			return $t;
		}else if( $t.is('.ht5c-event-resizeHandle') ) {
			return $t;
		} else {
			$t=$t.parents('.ht5c-event');
			if($t.length==1){
				return $t;
			}
		}
		return $([]);
	},
	_mouseCapture:function(event){
		var ev = this._getMouseTargetEvent(event);
		if(this._mouseAction){
			return false;
		}
		
		if(ev!==undefined &&( ev.movable || ev.resizable)){
			var $t = this._getMouseTarget(event);
			this._mouseType = 'move';
			if($t.is('.ht5c-event-resizeHandle') && ev.resizable){
				this._mouseType = 'resize';
			}

			return true;
		}
		return false;
	},
	_mouseStart:function(event){
		this._mouseAction = true;
		this._handle= this._getMouseTarget(event);
		this._event = this._getMouseTargetEvent(event);
		
		this._clone = this._event.clone();
		this._clone.addClass('ht5c-event-placeholder ht5c-event-clone').removeClass('ht5c-event');

		this._place_event(this._clone);
		this._gridSize = this.options.type=='agenda'?
		                   [this.view_container.width()/this.options.daysPerWeek,this.hourHeight]:
		                   [this.view_container.width()/this.options.daysPerWeek,this.dayHeight];
		this._initX    = event.clientX;
		this._initY    = event.clientY;
		this._change=0;
		this._event.hide();
	},
	_mouseGetChange:function(event){
		var dX  = event.clientX-this._initX,
		    dY  = event.clientY-this._initY,
		    pX  = Math.round(dX/this._gridSize[0]),
		    pY  = Math.round(dY/this._gridSize[1]);
		return this.options.type=='agenda'?((pX*24) + (pY*this.hourSize)):((pX*24) + (pY*168));
	},
	_mouseDrag:function(event){
		var delta = this._mouseGetChange(event);
		this._clone.start = moment(this._event.start);
		this._clone.end = moment(this._event.end);
		if(this._mouseType=='move'){
			this._clone.add(delta,'hours');
		} else {
			this._clone.end.add(delta,'hours');
			if(this._clone.end.isBefore(this._clone.start)){
				this._clone.end = moment(this._clone.start).add(this.hourSize,'hours');
			}
			this._clone.update();
		}
		
		this._place_event(this._clone);
	},
	_mouseStop:function(event){
		var delta = this._mouseGetChange(event);
		
		if(this._mouseType=='move'){
			this._event.add(delta,'hours');
		} else {
			this._event.end.add(delta,'hours');
			if(this._event.end.isBefore(this._event.start)){
				this._event.end = moment(this._event.start).add(this.hourSize,'hours');
			}
			this._event.update();
		}
		this._event.show();
		this._place_event(this._event);
		this._clone.remove();
		this._clone = null;
		this._event = null;
		this._mouseAction = false;

	},
	relayout: function() {
		this._layout_hour_rows();
		this._update_view();
	},
	next:function(duration){
		var args = Array.prototype.slice.apply(arguments,[0]),
			defDur = this.options.type=='month'?'months':'weeks';

		if(args.length==0){
			this.currentDate.add(1, defDur);
		} else {
			this.currentDate.add.apply(this.currentDate,args);
		}
		this._update_view();
	},
	prev:function(duration){
		var args = Array.prototype.slice.apply(arguments,[0]),
			defDur = this.options.type=='month'?'months':'weeks';
		if(args.length==0){
			this.currentDate.subtract(1, defDur);
		} else {
			this.currentDate.subtract.apply(this.currentDate,args);
		}
		this._update_view();
	}
});
$('[data-calendar="html5"]').html5calendar();
setTimeout(function(){
//	$('[data-calendar="html5"]').html5calendar('next',1,'year');
},500)

