
moment.formatRangeSeparator = " - ";

if(!(moment.formatRangeDirectives)){
	moment.formatRangeDirectives={
		'YY':'M/D/YY h:mm a',
		'YYYY':'M/D/YYYY h:mm a',
		'M':'M/D h:mm a',
		'D':'M/D h:mm a',
		'!h!mm':'h a',
		'__default__':'h:mm a'
	};
}

if(!(moment.formatRange && typeof moment.formatRange==='function')){
	moment.formatRange = function(_start,_end){
		var start=moment(_start),
		    end=moment(_end), chkFmt, fmt,i,matchIf,isMatch,matchFmt;
		for(chkFmt in moment.formatRangeDirectives){
			fmt=moment.formatRangeDirectives[chkFmt];
			if(chkFmt=='__default__'){
				return start.format(fmt)+moment.formatRangeSeparator+end.format(fmt);
			} else {
				chkFmt = chkFmt.split('!');
				isMatch=true;
				matchIf=false;
				for(i in chkFmt){
					matchFmt=chkFmt[i];
					isMatch = isMatch && ((start.format(matchFmt)==end.format(matchFmt))==matchIf);
					matchIf=!matchIf;
				}
				if(isMatch){
					return start.format(fmt)+moment.formatRangeSeparator+end.format(fmt);
				}
			}
		}
	}
}

console.log(moment.formatRange('2014-04-30 09:00:00','2014-04-30 15:00:00'));

$.widget("custom.html5calendar",{
	'options': {
		'dayBegin':'09:00:00',
		'dayEnd':'21:00:00',
		'slotDuration':'00:30:00',
		'currentDate':'today',
		'daysPerWeek':7,
		'firstDayOfWeek':0, //Sunday
		'rowLabelFormat':'h a',
		'colLabelFormat':'M/D',
		'type':'agenda'
	},
	_create: function() {
		var self=this;
		this.element.addClass('html5calendar');
		this._get_opts_from_element();
		this.weekOffset=0;
		this.relativeTo=moment();
		this.currentDate = (this.options.currentDate=='today'?moment():moment(this.options.currentDate));
		this.relativeDate = moment(this.currentDate);// The primary view date.
		this.innerElement = this.element.find('.inner');
		if(this.innerElement.length===0){
			this.innerElement = $('<div class="inner"></div>');
			this.element.append(this.innerElement);
		}
		this.innerElement.addClass(this.options.type);
		this.view_container=$('<div class="view"></div>');
		this.days_list=$('<ul class="days"></ul>');
		this.days={};
		this.rows=$('<ul class="rows"></ul>');
		this.colWidth=100/this.options.daysPerWeek;
		this.innerElement.append(this.rows);
		this.innerElement.append(this.view_container);
		this.view_container.append(this.days_list);
		this.eventData=this.element.find('[data-calendar-events]');
		this.currentDate.startOf('day');
		this.element.find('[data-calendar-action]').on('click',function(){
			self.element.html5calendar($(this).prop('data-calendar-action'));
		});
		this._parse_events();
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
	_get_day_col:function(mDay){
		mDay=moment(mDay).startOf('day');
		var dayLabel = moment(mDay).format(this.options.colLabelFormat);
		if(this.days[dayLabel]!==undefined){
			return this.days[dayLabel];
		}
		var	day = $('<ul data-calendar-dayLabel="'+dayLabel+'"></ul>'),
			day_li = $('<li><div class="dayLabel"><time>'+dayLabel+'</time></div></li>');
		this.days[dayLabel]=day;
		day_li.append(day);
		this.days_list.append(day_li);
		
		day_li.css({
			'left':(this.colWidth*mDay.diff(this.currentDate,'days'))+'%'
		});
		
		return day;
	},
	_layout_rows:function(){
		var t0 = moment().startOf('day').add(moment.duration(this.options.dayBegin)),
			dt = moment.duration(this.options.slotDuration),
			tM = moment().startOf('day').add(moment.duration(this.options.dayEnd)),
			prev='',
			p=dt.asHours(),
			n=0;
		
		while(t0.isBefore(tM) && n<100){
			var $li=$('<li class="r"></li>'),
					label='<small>'+t0.format(this.options.rowLabelFormat)+'</small>';
			if(label!=prev){
				$li.append(label);
			}
			prev=label;
			this.rows.append($li);
			$li.css({
				'top':n*p+'em',
				'height':p+'em',
				'line-height':p+'em'
			});
			
			t0.add(dt);
			n++;
		}
		
		this.innerElement.css('height',(0.5+n*p)+'em')
	},
	_layout_days:function(){
		var t0 = moment(this.relativeDate).startOf('week'),
			dt = moment.duration(1,"day"),
			n=0;
		t0.subtract(dt);
		for(n=-1;n<=this.options.daysPerWeek;n++){
			this._get_day_col(t0);
			t0.add(dt);
		}
		this.days_list.css({
			'left': (this.currentDate.diff(this.relativeDate, 'days')*this.colWidth)+"%"
		});
	},
	_parse_events:function(){
		var self=this,
			mCurDate=moment(this.currentDate).day(this.options.firstDayOfWeek);
			
		this.innerElement
			.removeClass('days-1 days-2 days-3 days-4 days-5 days-6 days-7')
			.addClass('days-'+this.options.daysPerWeek);
		this.eventData.children('li').each(function(i,el){
			var $el=$(el),
				mStart = moment($el.data('calendar-event-start')),
				mEnd   = moment($el.data('calendar-event-end')),
				topOffset=0;
			
			$el.css({
				'top':(100*topOffset)+'%',
				'height':(mEnd.diff(mStart,'hours',true))+'em'
			});

			$el.find('[data-calendar-event-receive="timeSpan"]')
			    .html(moment.formatRange(mStart,mEnd));
			
			$el.appendTo(self._get_day_col(mStart));
		});
	},
	relayout: function() {
		this._layout_rows();
		this._layout_days();
	},
	next:function(){
		this.relativeDate.add(this.options.daysPerWeek, "days");
		
		this._layout_days();
	},
	prev:function(){
		this.relativeDate.subtract(this.options.daysPerWeek, "days");
		
		this._layout_days();
	}
});
$('[data-calendar="html5"]').html5calendar();
