/**
 * The HTML5Calendar widget, using the [jQuery UI Widget Factory](http://api.jqueryui.com/jQuery.widget/)
 * @namespace jQuery.fn.html5calendar
 */
$.widget("custom.html5calendar",$.ui.mouse,{
	'options': {
		/**
		 * Earliest hour to show in the Agenda view mode.
		 * @property {moment.duration|String} dayBegin
		 */
		'dayBegin':'09:00:00',
		/**
		 * Latest hour to show in the Agenda view mode.
		 * @property {moment.duration|String} dayEnd
		 */
		'dayEnd':'21:00:00',
		/**
		 * Specifies the duration of each hour slot.
		 * @property {moment.duration|String} slotDuration
		 */
		'slotDuration':'00:30:00',
		/**
		 * Specifies the "current" date.
		 * @property {Date|moment} now
		 */
		'now':'today',
		/**
		 * Specifies currently visible date.
		 * @property {Date|moment} defaultDate
		 */
		'defaultDate':'today',
		/**
		 * Specifies number of days to be shown for each week.
		 * Must be a number 1-7.
		 * @property {Number} daysPerWeek
		 */
		'daysPerWeek':7,
		/**
		 * Specifies the first day to display for each week.
		 * This should be a number 0-6, 0 being Sunday and 6 being Saturday.
		 * @property {Number} firstDay
		 */
		'firstDay':0,
		/**
		 * Specifies format for each hour label. HTML5Calendar will not
		 * display duplicate consecutive row labels.
		 * @property {String} rowLabelFormat
		 */
		'rowLabelFormat':'h a',
		/**
		 * Specifies format for each day label.
		 * @property {String} dayLabelFormat
		 */
		'dayLabelFormat':'M/D',
		/**
		 * Specifies format for displaying the month.
		 * @property {String} monthLabel
		 */
		'monthLabel': 'MMM YYYY',
		/**
		 * Specifies view.  Can be either "agenda" or "month".
		 * @property {String} view
		 */
		'view':'month'
	},
	_create: function() {
		var self=this;
		this.element.addClass('html5calendar');
		this._get_opts_from_element();
		this.weekOffset=0;
		this.today = this._momentize_option(this.options.now);
		this.defaultDate = this._momentize_option(this.options.defaultDate);
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
			.addClass(this.options.view);
		this.element.removeClass('ht5c-agenda ht5c-basic ht5c-month')
				.addClass('ht5c-'+this.options.view);
		
		this.relayout();

		this._mouseInit();
	},
	_momentize_option:function(val){
		return val=='today'?moment():moment(val);
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
			$el.css(self.options.view=='agenda'?cssData:{
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
			tBegin = moment(this.defaultDate);

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
		this.defaultDate.startOf('week').add(this.options.firstDay,'day');
		this._layout_days();
		this.innerElement.css('height',this.innerElement.data('hours-height')+'em');

	},
	_layout_months:function(){
		var mOrig = moment(this.defaultDate),
		    mLast = moment(this.defaultDate).endOf('month'),n=1;
		this.defaultDate.startOf('month');
		
		while(this.defaultDate.isBefore(mLast)){
			this._layout_weeks();
			this.defaultDate.add(1,'week');
			n++;
		}

		this.defaultDate = mOrig;
		this.innerElement.css('height',(n-1)+'em');
	},
	_update_weeks:function(){
		var week_li;
		for(var k in this.weeks){
			week_li=this.weeks[k].parent();

			week_li.css(this.options.view=='agenda'?{
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
			
			$el.css(self.options.view=='agenda'?$el.data('css'):{
				'top':'0em','height':'auto'
			})
		});
	},
	_update_view:function(){
		var tBegin = moment(this.defaultDate);
		this._update_events();
		
		if(this.options.view=='agenda'){
			this.element.find('[data-calender-receive="defaultDate"]')
			.html(moment.range(tBegin,moment(tBegin).add(this.options.daysPerWeek,'days'))
				.format({
					'__default__':['MMM D','MMM D YYYY']
				}));

			this._layout_weeks();
			this._update_weeks();
			this.weeks_list.css({
				'top':0,
				'left': (moment(this.today).startOf('week').diff(moment(this.defaultDate).startOf('week'), 'days')*this.colWidth)+"%"
			});
		} else if(this.options.view=='basic'){
			this.element.find('[data-calender-receive="defaultDate"]')
			.html(moment.range(tBegin,moment(tBegin).add(this.options.daysPerWeek,'days'))
				.format({
					'__default__':['MMM D','MMM D YYYY']
				}));

			this._layout_weeks();
			this._update_weeks();
			this.weeks_list.css({
				'top':0,
				'left': (moment(this.today).startOf('week').diff(moment(this.defaultDate).startOf('week'), 'days')*this.colWidth)+"%"
			});
		} else if(this.options.view=='month'){
			this.element.find('[data-calender-receive="defaultDate"]')
			.html(tBegin.format(this.options.monthLabel));
			this.element.removeClass('month-1 month-2 month-3 month-4 month-5 month-6 month-7 month-8 month-9 month-10 month-11 month-12')
				.addClass('month-'+this.defaultDate.format('M'));
			this._layout_months();
			this._update_weeks();
			this.weeks_list.css({
				'left':0,
				'top': (moment(this.today).startOf('week').diff(moment(this.defaultDate).startOf('month').startOf('week'), 'weeks'))+"em"
			});
		}
	},
	_setOption: function(key,value){
		this._super( key, value );

		if(key=='view' || key=='defaultDate'){
			this.innerElement.removeClass('agenda basic month')
				.addClass(this.options.view);
			this.element.removeClass('ht5c-agenda ht5c-basic ht5c-month')
				.addClass('ht5c-'+this.options.view);
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
		this._gridSize = this.options.view=='agenda'?
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
		return this.options.view=='agenda'?((pX*24) + (pY*this.hourSize)):((pX*24) + (pY*168));
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
			defDur = this.options.view=='month'?'months':'weeks';

		if(args.length==0){
			this.defaultDate.add(1, defDur);
		} else {
			this.defaultDate.add.apply(this.defaultDate,args);
		}
		this._update_view();
	},
	prev:function(duration){
		var args = Array.prototype.slice.apply(arguments,[0]),
			defDur = this.options.view=='month'?'months':'weeks';
		if(args.length==0){
			this.defaultDate.subtract(1, defDur);
		} else {
			this.defaultDate.subtract.apply(this.defaultDate,args);
		}
		this._update_view();
	}
});


$('[data-calendar="html5"]').html5calendar();

