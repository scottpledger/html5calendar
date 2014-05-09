

$.widget("custom.html5calendar",{
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
		'type':'agenda'
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
		this.innerElement.append(this.hour_rows);
		this.innerElement.append(this.view_container);
		this.view_container.append(this.weeks_list);
		this.eventData=this.element.find('[data-calendar-events]');
		this.today.startOf('day');
		this.element.find('[data-calendar-action]').on('click',function(){
			self.element.html5calendar($(this).attr('data-calendar-action'));
		});
		this._parse_events();
		this.innerElement.removeClass('agenda basic month')
			.addClass(this.options.type);
		this.element.removeClass('ht5c-agenda ht5c-basic ht5c-month')
				.addClass('ht5c-'+this.options.type);
		this.relayout();

		
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
			mCurDate=moment(this.today).day(this.options.firstDayOfWeek),
			hourBegin = moment.duration(this.options.dayBegin),
			hourEnd = moment.duration(this.options.dayEnd),
			maxHeight = hourEnd.subtract(hourBegin).asHours();
			
		this.innerElement
			.removeClass('days-1 days-2 days-3 days-4 days-5 days-6 days-7')
			.addClass('days-'+this.options.daysPerWeek);
		this.eventData.children('li').each(function(i,el){
			var $el=$(el),
				startStr = $el.data('calendar-event-start'),
				endStr = $el.data('calendar-event-end'),
				mStart = moment(startStr),
				mEnd   = moment(endStr),
				mRange = moment.range(mStart,mEnd),
				chunks = mRange.chunk('intoDays'),topOffset,i,$nel,nRange;

			$el.find('[data-calendar-event-receive="timeSpan"]')
			    .html(mRange.format());

			$el.addClass('ht5c-event');

			for(i in chunks){
				nRange = chunks[i];
				mStart = nRange.start;
				mEnd = nRange.end;
				$nel = $el.clone();
				$nel.appendTo(self._get_day(mStart));
				//$nel.replaceTag('<dd>', true);
				
				topOffset = mStart.diff(moment(mStart).startOf('day'),'hours',true)-hourBegin.asHours();
				if(topOffset<0){
					topOffset=0;
					mStart.startOf('day').add(hourBegin);
				}
				$nel.data('css',{
					'top':(topOffset)+'em',
					'height':Math.min(maxHeight,mEnd.diff(mStart,'hours',true))+'em'
				});
			};
		});
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

		for(k in week.days){
			if(k>dayLabel){
				week.days[k].parent().before(day_li);
				return day;
			}
		}

		week.append(day_li);

		return day;
	},
	_layout_hour_rows:function(){
		var t0 = moment().startOf('day').add(moment.duration(this.options.dayBegin)),
			dt = moment.duration(this.options.slotDuration),
			tM = moment(t0).startOf('day').add(moment.duration(this.options.dayEnd)),
			prev='',
			p=dt.asHours(),
			n=0;
		
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
			
			t0.add(dt);
			n++;
		}
		
		this.innerElement.css('height',(0.5+n*p)+'em');
	},
	_layout_days:function(){
		var self=this,
			tBegin = moment(this.currentDate);

		var t0 = moment(tBegin),
		    dt = moment.duration(1,"day"),
		    n=0;
		
		for(n=0;n<this.options.daysPerWeek;n++){
			this._get_day(t0);
			t0=moment(t0).add(1,"days");
		}
	},
	_layout_weeks:function(){
		this.currentDate.startOf('week').add(this.options.firstDayOfWeek,'day');
		this._layout_days();
		
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
		this.innerElement.css('height',(n)+'em');
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
		}
		if(this.options.type=='basic'){
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
		}
		if(this.options.type=='month'){
			this.element.find('[data-calender-receive="currentDate"]')
			.html(tBegin.format(this.options.monthLabel));
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

