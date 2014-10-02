/*!
 * HTML5Calendar v0.0.1-alpha1
 * Docs & License: https://github.com/scottpledger/html5calendar
 * (c) 2014 Scott Pledger
 */

(function(factory) {
	if (typeof define === 'function' && define.amd) {
		define([ 'jquery', 'moment' ], factory);
	}
	else {
		factory(jQuery, moment);
	}
})(function($, moment) {
;;
var HT5Calendar;
HT5Calendar = (function(undefined) {
	
	function _getOptsFromElement($el) {
		var val,opts = {};
		for(var opt in HT5Calendar.defaultOptions) {
			val = $el.attr('data-calendar-'+opt.toLowerCase());
			if(val!==undefined) {
				opts[opt] = val;
			}
		}
		return opts;
	}
	
	function momentizeOpt(val) {
		return val=='today' ? moment(): moment(val);
	}

	function HT5Calendar(element, options) {
		this.element = $(element);
		this.options = $.extend(true,{},
			HT5Calendar.defaultOptions,
			options,
			_getOptsFromElement(this.element));

		var self=this;
		this.element.addClass('html5calendar');

		this.weekOffset=0;
		this.today = momentizeOpt(this.options.now);
		this.defaultDate = momentizeOpt(this.options.defaultDate);
		this.innerElement = this.element.find('.ht5c-inner');
		if(this.innerElement.length===0) {
			this.innerElement = $('<div class="ht5c-inner"></div>');
			this.element.append(this.innerElement);
		}
		
		this.viewContainer=$('<div class="ht5c-view"></div>');
		this.weeksList=$('<ul class="ht5c-weeks"></ul>');
		
		this.hourRows=$('<ul class="ht5c-hours"><li></li></ul>');
		this.days={};
		this.weeks={};
		this.colWidth=100/this.options.daysPerWeek;
		this.hourHeight=0;
		this.innerElement.append(this.hourRows);
		this.innerElement.append(this.viewContainer);
		this.viewContainer.append(this.weeksList);
		this.eventData=this.element.find('[data-calendar-events]');
		this.today.startOf('day');
		private._initButtons(this);
		private._parseEvents(this);
		this.innerElement.removeClass('agenda basic month')
			.addClass(this.options.type);
		this.element.removeClass('ht5c-agenda ht5c-basic ht5c-month')
				.addClass('ht5c-'+this.options.type);
		
		this.render();

		//private._mouseInit(this);
	}

	var public = {
		render: function() {
			private._layoutHourRows(this);
			private._updateView(this);
		},
		next: function(duration) {
			var args = Array.prototype.slice.apply(arguments,[0]),
				defDur = this.options.view=='month' ? 'months': 'weeks';

			if(args.length===0) {
				this.defaultDate.add(1, defDur);
			} else {
				this.defaultDate.add.apply(this.defaultDate,args);
			}
			private._updateView(this);
		},
		prev: function(duration) {
			var args = Array.prototype.slice.apply(arguments,[0]),
				defDur = this.options.view=='month' ? 'months': 'weeks';
			if(args.length===0) {
				this.defaultDate.subtract(1, defDur);
			} else {
				this.defaultDate.subtract.apply(this.defaultDate,args);
			}
			private._updateView(this);
		}
	};
	
	var private = {
		_initButtons: function(t) {
			var self = t;
			t.element.find('[data-calendar-action]').on('click',function() {
				var $t=$(this);
				self.element.html5calendar($t.attr('data-calendar-action'));
			});
			t.element.find('[data-calendar-option]').on('click',function() {
				var $t=$(this);
				self.element.html5calendar('option',$t.attr('data-calendar-option'),$t.attr('data-calendar-optionValue'));
			});
		},
		_parseEvents: function(t) {
			var self=t,
				hourBegin = moment.duration(t.options.dayBegin),
				hourEnd = moment.duration(t.options.dayEnd),
				maxHeight = hourEnd.subtract(hourBegin).asHours();
			t._hourBegin = hourBegin;
			t._hourEnd = hourEnd;
			t._maxHeight = maxHeight;
			t.innerElement
				.removeClass('days-1 days-2 days-3 days-4 days-5 days-6 days-7')
				.addClass('days-'+t.options.daysPerWeek);
			t.eventData.children('li').each(function(i,el) {
				var ev = new HT5CEvent(el);
				private._placeEvent(self,ev);
			});
		},
		_placeEvent: function(t,ev) {
			var $segs = ev.makeSegments('days'), self=t;

			$segs.each(function(i,el) {
				var $el = $(el), dims,top,height,cssData;
				$el.appendTo(private._getDay(self,$el.data('range').start));
				dims = $el.data('dimensions');
				top = dims.top-self._hourBegin.asHours();
				height = dims.height;
				if(top<0) {
					top =0;
					height += top;
				}
				height = Math.min(self._maxHeight,height);
				cssData = {
					top: top+'em',
					height: height+'em'
				};
				$el.data('css',cssData);
				$el.css(self.options.view=='agenda' ? cssData: {
					top: '0em',
					height: 'auto'
				});
			});

			ev.redraw();
		},
		_getWeek: function(t,mDay) {

			mDay=moment(mDay).startOf('week');
			var weekLabel = mDay.format("YYYYww");

			if(t.weeks[weekLabel]!==undefined) {
				return t.weeks[weekLabel];
			}

			var	week = $('<ul data-calendar-weekLabel="'+weekLabel+'" class="ht5c-days"></ul>'),
				weekLi = $('<li class="ht5c-week"></li>'), k;

			t.weeks[weekLabel]=week;

			week.data('date',mDay);
			weekLi.data('diff',mDay.diff(moment(t.today).startOf('week'),'weeks',true));

			weekLi.append(week);

			private._populateWeek(t,week,mDay);

			for(k in t.weeks) {
				if(k>weekLabel) {
					t.weeks[k].parent().before(weekLi);
					return week;
				}
			}

			t.weeksList.append(weekLi);

			return week;
		},
		_populateWeek: function(t,week,mD) {
			var mDay = moment(mD),k;

			for(k=0; k < t.options.daysPerWeek; k++) {
				week.append(private._makeDay(t,mDay));
				mDay.add(1,'days');
			}
		},
		_makeDay: function(t,mD) {
			var mDay = moment(mD),
				fullDayLabel = mDay.format('YYYYDDDD'),
					dayLabel = dayLabel = mDay.format(t.options.dayLabelFormat),
					day = $('<ul data-calendar-dayLabel="'+dayLabel+'" class="ht5c-events"></ul>'),
					dayLi = $('<li class="ht5c-day year-'+mDay.format('YYYY')+' month-'+mDay.format('M')+' day-'+mDay.format('D')+'"><time>'+dayLabel+'</time></li>');
			dayLi.append(day);
			t.days[fullDayLabel] = day;
			return dayLi;
		},
		_getDay: function(t,mD) {
			var mDay=moment(mD).startOf('day');
			var fullDayLabel=mDay.format('YYYYDDDD'),
				week=private._getWeek(t,mDay);

			if(t.days[fullDayLabel]!==undefined) {
				return t.days[fullDayLabel];
			}

			var	dayLi = private._makeDay(t,mDay);
			week.append(dayLi);

			for(k in week.days) {
				if(k>dayLabel) {
					week.days[k].parent().before(dayLi);
				}
			}

			return t.days[fullDayLabel];
		},
		_layoutHourRows: function(t) {
			var t0 = moment(t.today).startOf('day').add(moment.duration(t.options.dayBegin)),
				dt = moment.duration(t.options.slotDuration),
				tM = moment(t0).startOf('day').add(moment.duration(t.options.dayEnd)),
				prev='',
				p=dt.asHours(),
				n=0;
			t.hourSize = p;

			while(t0.isBefore(tM) && n<100) {
				var $li=$('<li class="ht5c-hour"></li>'),
						label='<time>'+t0.format(t.options.rowLabelFormat)+'</time>';
				if(label!=prev) {
					$li.append(label);
				}
				prev=label;
				t.hourRows.append($li);
				$li.css({
					top: n*p+'em',
					height: p+'em',
					'line-height': p+'em'
				});

				t.hourHeight = $li.height();

				t0.add(dt);
				n++;
			}

			t.innerElement.data('hours-height',(0.5+n*p));
		},
		_layoutDays: function(t) {
			var self=t,
				tBegin = moment(t.defaultDate);

			var t0 = moment(tBegin),
				dt = moment.duration(1,"day"),
				n=0,$el;

			for(n=0;n<t.options.daysPerWeek;n++) {
				$el = private._getDay(t,t0);
				t.dayHeight = $el.parent('li').height();
				t0=moment(t0).add(1,"days");
			}
		},
		_layoutWeeks: function(t) {
			t.defaultDate.startOf('week').add(t.options.firstDay,'day');
			private._layoutDays(t);
			t.innerElement.css('height',t.innerElement.data('hours-height')+'em');

		},
		_layoutMonths: function(t) {
			var mOrig = moment(t.defaultDate),
				mLast = moment(t.defaultDate).endOf('month'),n=1;
			t.defaultDate.startOf('month');

			while(t.defaultDate.isBefore(mLast)) {
				private._layoutWeeks(t);
				t.defaultDate.add(1,'week');
				n++;
			}

			t.defaultDate = mOrig;
			t.innerElement.css('height',(n-1)+'em');
		},
		_updateWeeks: function(t) {
			var weekLi;
			for(var k in t.weeks) {
				weekLi=t.weeks[k].parent();

				weekLi.css(t.options.view=='agenda' ? {
					left: (weekLi.data('diff')*100)+"%",
					top: 0
				}: {
					left: 0,
					top: (weekLi.data('diff'))+'em'
				});
			}
		},
		_updateEvents: function(t) {
			var self=t;
			t.innerElement.find('li.ht5c-event').each(function(i,el) {
				var $el=$(el);

				$el.css(self.options.view=='agenda' ? $el.data('css'): {
					top: '0em',height: 'auto'
				})
			});
		},
		_updateView: function(t) {
			var tBegin = moment(t.defaultDate);
			private._updateEvents(t);

			if(t.options.view=='agenda') {
				t.element.find('[data-calender-receive="defaultDate"]')
				.html(moment.range(tBegin.startOf('week'),moment(tBegin).add(t.options.daysPerWeek-1,'days'))
					.format({
						__default__: ['MMM D','MMM D YYYY']
					}));

				private._layoutWeeks(t);
				private._updateWeeks(t);
				t.weeksList.css({
					top: 0,
					left: (moment(t.today).startOf('week').diff(moment(t.defaultDate).startOf('week'), 'days')*t.colWidth)+"%"
				});
			} else if(t.options.view=='basic') {
				t.element.find('[data-calender-receive="defaultDate"]')
				.html(moment.range(tBegin,moment(tBegin).add(t.options.daysPerWeek,'days'))
					.format({
						__default__: ['MMM D','MMM D YYYY']
					}));

				private._layoutWeeks(t);
				private._updateWeeks(t);
				t.weeksList.css({
					top: 0,
					left: (moment(t.today).startOf('week').diff(moment(t.defaultDate).startOf('week'), 'days')*t.colWidth)+"%"
				});
			} else if(t.options.view=='month') {
				t.element.find('[data-calender-receive="defaultDate"]')
				.html(tBegin.format(t.options.monthLabel));
				t.element.removeClass('month-1 month-2 month-3 month-4 month-5 month-6 month-7 month-8 month-9 month-10 month-11 month-12')
					.addClass('month-'+t.defaultDate.format('M'));
				private._layoutMonths(t);
				private._updateWeeks(t);
				t.weeksList.css({
					left: 0,
					top: (moment(t.today).startOf('week').diff(moment(t.defaultDate).startOf('month').startOf('week'), 'weeks'))+"em"
				});
			}
		}
	};
	
	$.extend(HT5Calendar.prototype,public);

	HT5Calendar.defaultOptions = {
		defaultTimedEventDuration: '02:00:00',
		defaultAllDayEventDuration: { days: 1 },
		forceEventDuration: false,
		nextDayThreshold: '05:00:00', // 9am

		// display
		view: 'month',
		eventSources: ['[data-calendar-events]'],
		
		weekends: true,

		// event ajax
		lazyFetching: true,
		startParam: 'start',
		endParam: 'end',
		timezoneParam: 'timezone',

		//allDayDefault: undefined,

		// time formats
		titleFormat: {
			month: 'MMMM YYYY',
			week: 'll',
			day: 'LL'
		},
		columnFormat: {
			month: 'ddd',
			week: 'ddd M/D',
			day: 'dddd'
		},
		timeFormat: {
			'default': 'h:mm a'
		},

		// locale
		isRTL: false,

		selectable: false,
		unselectAuto: true,

		dropAccept: '*',

		handleWindowResize: true
	};

	// Screw the globabl namespace, I'm debugging!
	window.HT5Calendar = HT5Calendar;

	return HT5Calendar;
})();
;;
/**
 * @ngdoc interface
 * @name HT5CEvent
 * 
 * An Event wrapper for HTML5Calendar
 */
var HT5CEvent;
HT5CEvent = (function(undefined) {
	/**
	 * @constructor
	 * 
	 * Creates a new HT5CEvent object.
	 * @param {DOMElement|Object} el 
	 */
	function HT5CEvent(el) {
		var start, end,k;

		for(k in HT5CEvent.defaults) {
			this[k] = HT5CEvent.defaults[k];
		}

		if($.isPlainObject(el)) {
			for(k in el) {
				if(k=='start') {
					start = el[k];
				} else if(k=='end') {
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
			if($el.data('event')&&$el.data('event')!=null) {
				return $el.data('event');
			}

			for(var k=0;k<attrs.length;k++) {
				attr = attrs[k];
				if(attr.name.slice(0,HT5CEvent.attrPrefix.length)==HT5CEvent.attrPrefix) {
					attrName = attr.name.slice(HT5CEvent.attrPrefix.length);
					if(attrName=='start') {
						start = attr.value;
					} else if(attrName=='end') {
						end = attr.value;
					} else {
						this[attr.name.slice(HT5CEvent.attrPrefix.length)] = attr.value;
					}
					
				}
			}

			this.element = $el;

			if($el.attr('draggable')) {
				$el.attr('draggable',false);
				this.movable = true;
			} else {
				this.movable = false;
			}

			if($el.attr('resizable')) {
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

		if(start.isValid()) {
			this.start = start;
		} else {
			throw new Error('Invalid Event!');
		}

		if (end.isValid()) {
			this.end = end;
			if(this.end.isBefore(this.start)) {
				throw new Error('Invalid Event!');
			}
			
		}

		if (this.allDay) {
			this.start.startOf('day');
			this.end = moment(start).endOf('day');
		}

		if(this.html) {
			this.element.html(this.html);
		}

		if(this.resizable) {
			this.element.append('<hr class="ht5c-event-resizeHandle">');
		}

		this.element.addClass('ht5c-event');
		this.element.data('event',this);

		this._segments = [];
	}
	HT5CEvent.prototype = moment.range(0,1);
	HT5CEvent.prototype.constructor = HT5CEvent;

	HT5CEvent.attrPrefix = 'data-calendar-event-';

	/**
	 * Removes all segments associated with this event from the
	 * DOM.
	 *
	 * @private
	 * @method _rmSegments
	 */
	HT5CEvent.prototype._rmSegments = function() {
		$(this._segments).each(function(i,el) {
			$(el).remove();
		});
		this._segments = [];
	};

	/**
	 *
	 * Gets a new segment to be inserted later into the DOM.
	 * Caches the segment for later removal.
	 * @private
	 * @method _getSegment
	 * @return {$(DOMElement)}
	 */
	HT5CEvent.prototype._getSegment = function() {
		var $nel = this.element.clone();
		$nel.data('event',this);
		this._segments.push($nel);
		return $nel;
	}

	/**
	 *
	 * Chunks the event into segments.
	 * @method makeSegments
	 * @param  {moment.unit} on   Chunk into 
	 * @param  {(moment.duration|Number)} tMin Beginning of each day
	 * @param  {(moment.duration|Number)} tMax End of each day
	 * @return {$([DOMElement])}      A jQuery-wrapped list of segment elements.
	 */
	HT5CEvent.prototype.makeSegments = function(on,tMin,tMax) {
		this._rmSegments();
		var chunks = this.chunk('into'+on),
		    i,nRange,$nel,topOffset,mStart,mEnd;
		this.element.find('[data-calendar-event-receive="timeSpan"]').html(this.format());
		for(i in chunks) {
			nRange = chunks[i];
			mStart = nRange.start;
			mEnd = nRange.end;
			$nel = this._getSegment();

			topOffset = mStart.diff(moment(mStart).startOf('day'),'hours',true);

			$nel.data('range',nRange);

			$nel.data('dimensions',{
				top: topOffset,
				height: mEnd.diff(mStart,'hours',true)
			});
		}

		return $(this._segments);

	};

	/**
	 * Updates contents of malleable child tags.
	 * @method redraw
	 */
	HT5CEvent.prototype.redraw = function() {
		this.element.find('[data-calendar-event-receive="timeSpan"]').html(this.format());
		$(this._segments).find('[data-calendar-event-receive="timeSpan"]').html(this.format());
	}

	/**
	 * Creates a deep-copy duplicate of this event.
	 * @method clone
	 * @return {HT5CEvent} Clone of this event.
	 */
	HT5CEvent.prototype.clone = function() {
		var $nel = this.element.clone(),nev,i;
		$nel.attr('data-calendar-event-start',this.start.format());
		$nel.attr('data-calendar-event-end',this.end.format());
		$nel.attr('data-calendar-event-allDay',this.allDay);
		nev = new HT5CEvent($nel);
		for(i in this._segments) {
			nev._segments.push(this._segments[i].clone());
		}
		
		return nev;
	};

	/**
	 * Displays this event and all segments associated with it.
	 * @method show
	 */
	HT5CEvent.prototype.show = function() {
		$(this._segments).each(function(i,el) {$(el).css('display','block')});
	};

	/**
	 * Hides this event and all segments associated with it.
	 * @method hide
	 */
	HT5CEvent.prototype.hide = function() {
		$(this._segments).each(function(i,el) {$(el).css('display','none')});
	};

	/**
	 * Adds a class/classes to all segments associated with this event.
	 * See [jQuery.addClass](http: //api.jquery.com/addclass/) for usage.
	 * @method addClass
	 */
	HT5CEvent.prototype.addClass = function() {
		$.fn.addClass.apply(this.element,Array.prototype.slice.apply(arguments,[0]));
		$.fn.addClass.apply($(this._segments),Array.prototype.slice.apply(arguments,[0]));
		return this;
	};

	/**
	 * Removes a class/classes from all segments associated with this event.
	 * See [jQuery.removeClass](http: //api.jquery.com/removeclass/) for usage.
	 * @method removeClass
	 */
	HT5CEvent.prototype.removeClass = function() {
		$.fn.removeClass.apply(this.element,Array.prototype.slice.apply(arguments,[0]));
		$.fn.removeClass.apply($(this._segments),Array.prototype.slice.apply(arguments,[0]));
		return this;
	};

	/**
	 * Adds the given amount of time to both the start and end of this event.
	 * See [moment.fn.add](http: //momentjs.com/docs/#/manipulating/add/) for usage.
	 * @method add
	 */
	HT5CEvent.prototype.add = function() {
		this.start.add(arguments[0],arguments[1]);
		this.end.add(arguments[0],arguments[1]);
	};

	/**
	 * Updates the event's range.
	 * @method update
	 */
	HT5CEvent.prototype.update = function() {
		
	};

	/**
	 * Removes all DOM Elements associated to this event from the DOM tree.
	 * @method remove
	 */
	HT5CEvent.prototype.remove = function() {
		this.element.remove();
		$(this._segments).each(function(i,el) {$(el).remove();});
	};




	HT5CEvent.defaults = {
		allDay: false
	};

	return HT5CEvent;
})();
;;
/**
 * @ngdoc directive
 * @name jQuery.html5calendar
 * 
 * The HTML5Calendar widget, using the [jQuery UI Widget Factory](http: //api.jqueryui.com/jQuery.widget/)
 */
$.fn.html5calendar= function() {
	var opts=arguments[0];
	if(this.length==1){
		if(!this.data('html5calendar')){
			this.data('html5calendar',new HT5Calendar(this,opts));
		}
		return this.data('html5calendar');
	} else {
		this.each(function(i,el) {
			$(this).html5calendar(opts);
		})
	}
}

$('[data-calendar="html5"]').html5calendar();

;;


});