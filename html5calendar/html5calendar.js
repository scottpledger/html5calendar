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
/**
 * An Event wrapper for HTML5Calendar
 * @class HT5CEvent
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
 * @ngdoc function
 * @name jQuery.html5calendar
 * 
 * The HTML5Calendar widget, using the [jQuery UI Widget Factory](http: //api.jqueryui.com/jQuery.widget/)
 */
$.widget("custom.html5calendar",$.ui.mouse,{
	options: {
		/**
		 * Earliest hour to show in the Agenda view mode.
		 * @property {moment.duration|String} dayBegin
		 */
		dayBegin: '09:00:00',
		/**
		 * Latest hour to show in the Agenda view mode.
		 * @property {moment.duration|String} dayEnd
		 */
		dayEnd: '21:00:00',
		/**
		 * Specifies the duration of each hour slot.
		 * @property {moment.duration|String} slotDuration
		 */
		slotDuration: '00:30:00',
		/**
		 * Specifies the "current" date.
		 * @property {Date|moment} now
		 */
		now: 'today',
		/**
		 * Specifies currently visible date.
		 * @property {Date|moment} defaultDate
		 */
		defaultDate: 'today',
		/**
		 * Specifies number of days to be shown for each week.
		 * Must be a number 1-7.
		 * @property {Number} daysPerWeek
		 */
		daysPerWeek: 7,
		/**
		 * Specifies the first day to display for each week.
		 * This should be a number 0-6, 0 being Sunday and 6 being Saturday.
		 * @property {Number} firstDay
		 */
		firstDay: 0,
		/**
		 * Specifies format for each hour label. HTML5Calendar will not
		 * display duplicate consecutive row labels.
		 * @property {String} rowLabelFormat
		 */
		rowLabelFormat: 'h a',
		/**
		 * Specifies format for each day label.
		 * @property {String} dayLabelFormat
		 */
		dayLabelFormat: 'M/D',
		/**
		 * Specifies format for displaying the month.
		 * @property {String} monthLabel
		 */
		monthLabel: 'MMM YYYY',
		/**
		 * Specifies view.  Can be either "agenda" or "month".
		 * @property {String} view
		 */
		view: 'month'
	},
	_create: function() {
		var self=this;
		this.element.addClass('html5calendar');
		this._getOptionsFromElement();
		this.weekOffset=0;
		this.today = this._momentizeOption(this.options.now);
		this.defaultDate = this._momentizeOption(this.options.defaultDate);
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
		this.element.find('[data-calendar-action]').on('click',function() {
			var $t=$(this);
			self.element.html5calendar($t.attr('data-calendar-action'));
		});
		this.element.find('[data-calendar-option]').on('click',function() {
			var $t=$(this);
			self.element.html5calendar('option',$t.attr('data-calendar-option'),$t.attr('data-calendar-optionValue'));
		});
		this._parseEvents();
		this.innerElement.removeClass('agenda basic month')
			.addClass(this.options.view);
		this.element.removeClass('ht5c-agenda ht5c-basic ht5c-month')
				.addClass('ht5c-'+this.options.view);

		this.relayout();

		this._mouseInit();
	},
	_momentizeOption: function(val) {
		return val=='today' ? moment(): moment(val);
	},
	_getOptionsFromElement: function() {
		var val;
		for(var i in this.options) {
			val = this.element.attr('data-calendar-'+i.toLowerCase());
			if(val!==undefined) {
				this.options[i] = val;
			}
		}
	},
	_parseEvents: function() {
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
		this.eventData.children('li').each(function(i,el) {
			var ev = new HT5CEvent(el);
			self._placeEvent(ev);
		});
	},
	_placeEvent: function(ev) {
		var $segs = ev.makeSegments('days'), self=this;

		$segs.each(function(i,el) {
			var $el = $(el), dims,top,height,cssData;
			$el.appendTo(self._getDay($el.data('range').start));
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
	_getWeek: function(mDay) {

		mDay=moment(mDay).startOf('week');
		var weekLabel = mDay.format("YYYYww");

		if(this.weeks[weekLabel]!==undefined) {
			return this.weeks[weekLabel];
		}

		var	week = $('<ul data-calendar-weekLabel="'+weekLabel+'" class="ht5c-days"></ul>'),
			weekLi = $('<li class="ht5c-week"></li>'), k;

		this.weeks[weekLabel]=week;

		week.data('date',mDay);
		weekLi.data('diff',mDay.diff(moment(this.today).startOf('week'),'weeks',true));

		weekLi.append(week);

		this._populateWeek(week,mDay);

		for(k in this.weeks) {
			if(k>weekLabel) {
				this.weeks[k].parent().before(weekLi);
				return week;
			}
		}

		this.weeksList.append(weekLi);

		return week;
	},
	_populateWeek: function(week,mD) {
		var mDay = moment(mD),k;

		for(k=0; k < this.options.daysPerWeek; k++) {
			week.append(this._makeDay(mDay));
			mDay.add(1,'days');
		}
	},
	_makeDay: function(mD) {
		var mDay = moment(mD),
			fullDayLabel = mDay.format('YYYYDDDD'),
				dayLabel = dayLabel = mDay.format(this.options.dayLabelFormat),
				day = $('<ul data-calendar-dayLabel="'+dayLabel+'" class="ht5c-events"></ul>'),
				dayLi = $('<li class="ht5c-day year-'+mDay.format('YYYY')+' month-'+mDay.format('M')+' day-'+mDay.format('D')+'"><time>'+dayLabel+'</time></li>');
		dayLi.append(day);
		this.days[fullDayLabel] = day;
		return dayLi;
	},
	_getDay: function(mD) {
		var mDay=moment(mD).startOf('day');
		var fullDayLabel=mDay.format('YYYYDDDD'),
			week=this._getWeek(mDay);

		if(this.days[fullDayLabel]!==undefined) {
			return this.days[fullDayLabel];
		}

		var	dayLi = this._makeDay(mDay);
		week.append(dayLi);

		for(k in week.days) {
			if(k>dayLabel) {
				week.days[k].parent().before(dayLi);
			}
		}

		return day;
	},
	_layoutHourRows: function() {
		var t0 = moment(this.today).startOf('day').add(moment.duration(this.options.dayBegin)),
			dt = moment.duration(this.options.slotDuration),
			tM = moment(t0).startOf('day').add(moment.duration(this.options.dayEnd)),
			prev='',
			p=dt.asHours(),
			n=0;
		this.hourSize = p;
		
		while(t0.isBefore(tM) && n<100) {
			var $li=$('<li class="ht5c-hour"></li>'),
					label='<time>'+t0.format(this.options.rowLabelFormat)+'</time>';
			if(label!=prev) {
				$li.append(label);
			}
			prev=label;
			this.hourRows.append($li);
			$li.css({
				top: n*p+'em',
				height: p+'em',
				'line-height': p+'em'
			});

			this.hourHeight = $li.height();

			t0.add(dt);
			n++;
		}
		
		this.innerElement.data('hours-height',(0.5+n*p));
	},
	_layoutDays: function() {
		var self=this,
			tBegin = moment(this.defaultDate);

		var t0 = moment(tBegin),
		    dt = moment.duration(1,"day"),
		    n=0,$el;

		for(n=0;n<this.options.daysPerWeek;n++) {
			$el = this._getDay(t0);
			this.dayHeight = $el.parent('li').height();
			t0=moment(t0).add(1,"days");
		}
	},
	_layoutWeeks: function() {
		this.defaultDate.startOf('week').add(this.options.firstDay,'day');
		this._layoutDays();
		this.innerElement.css('height',this.innerElement.data('hours-height')+'em');

	},
	_layoutMonths: function() {
		var mOrig = moment(this.defaultDate),
		    mLast = moment(this.defaultDate).endOf('month'),n=1;
		this.defaultDate.startOf('month');

		while(this.defaultDate.isBefore(mLast)) {
			this._layoutWeeks();
			this.defaultDate.add(1,'week');
			n++;
		}

		this.defaultDate = mOrig;
		this.innerElement.css('height',(n-1)+'em');
	},
	_updateWeeks: function() {
		var weekLi;
		for(var k in this.weeks) {
			weekLi=this.weeks[k].parent();

			weekLi.css(this.options.view=='agenda' ? {
				left: (weekLi.data('diff')*100)+"%",
				top: 0
			}: {
				left: 0,
				top: (weekLi.data('diff'))+'em'
			});
		}
	},
	_updateEvents: function() {
		var self=this;
		this.innerElement.find('li.ht5c-event').each(function(i,el) {
			var $el=$(el);

			$el.css(self.options.view=='agenda' ? $el.data('css'): {
				top: '0em',height: 'auto'
			})
		});
	},
	_updateView: function() {
		var tBegin = moment(this.defaultDate);
		this._updateEvents();

		if(this.options.view=='agenda') {
			this.element.find('[data-calender-receive="defaultDate"]')
			.html(moment.range(tBegin.startOf('week'),moment(tBegin).add(this.options.daysPerWeek-1,'days'))
				.format({
					__default__: ['MMM D','MMM D YYYY']
				}));

			this._layoutWeeks();
			this._updateWeeks();
			this.weeksList.css({
				top: 0,
				left: (moment(this.today).startOf('week').diff(moment(this.defaultDate).startOf('week'), 'days')*this.colWidth)+"%"
			});
		} else if(this.options.view=='basic') {
			this.element.find('[data-calender-receive="defaultDate"]')
			.html(moment.range(tBegin,moment(tBegin).add(this.options.daysPerWeek,'days'))
				.format({
					__default__: ['MMM D','MMM D YYYY']
				}));

			this._layoutWeeks();
			this._updateWeeks();
			this.weeksList.css({
				top: 0,
				left: (moment(this.today).startOf('week').diff(moment(this.defaultDate).startOf('week'), 'days')*this.colWidth)+"%"
			});
		} else if(this.options.view=='month') {
			this.element.find('[data-calender-receive="defaultDate"]')
			.html(tBegin.format(this.options.monthLabel));
			this.element.removeClass('month-1 month-2 month-3 month-4 month-5 month-6 month-7 month-8 month-9 month-10 month-11 month-12')
				.addClass('month-'+this.defaultDate.format('M'));
			this._layoutMonths();
			this._updateWeeks();
			this.weeksList.css({
				left: 0,
				top: (moment(this.today).startOf('week').diff(moment(this.defaultDate).startOf('month').startOf('week'), 'weeks'))+"em"
			});
		}
	},
	_setOption: function(key,value) {
		this._super(key, value);

		if(key=='view' || key=='defaultDate') {
			this.innerElement.removeClass('agenda basic month')
				.addClass(this.options.view);
			this.element.removeClass('ht5c-agenda ht5c-basic ht5c-month')
				.addClass('ht5c-'+this.options.view);
			this._updateView();
		}
	},
	_getMouseTargetEvent: function(event) {
		var $t = $(event.target);
		if($t.is('.ht5c-event')) {
			return $t.data('event');
		} else {
			$t = $t.parents('.ht5c-event');
			if($t.length==1) {
				return $t.data('event');
			}
		}
		return (function(u) {return u;})();
	},
	_getMouseTarget: function(event) {
		var $t = $(event.target);
		if($t.is('.ht5c-event') && $t.data('event').movable) {
			return $t;
		}else if($t.is('.ht5c-event-resizeHandle')) {
			return $t;
		} else {
			$t=$t.parents('.ht5c-event');
			if($t.length==1) {
				return $t;
			}
		}
		return $([]);
	},
	_mouseCapture: function(event) {
		var ev = this._getMouseTargetEvent(event);
		if(this._mouseAction) {
			return false;
		}

		if(ev!==undefined && (ev.movable || ev.resizable)) {
			var $t = this._getMouseTarget(event);
			this._mouseType = 'move';
			if($t.is('.ht5c-event-resizeHandle') && ev.resizable) {
				this._mouseType = 'resize';
			}
			this.hourHeight = this.element.find('.ht5c-hour').first().height();
			this.dayHeight = this.element.find('.ht5c-day').first().height();
			return true;
		}
		return false;
	},
	_mouseStart: function(event) {
		var gridX = this.viewContainer.width()/this.options.daysPerWeek;
		this._mouseAction = true;
		this._handle= this._getMouseTarget(event);
		this._event = this._getMouseTargetEvent(event);

		this._clone = this._event.clone();
		this._clone.addClass('ht5c-event-placeholder ht5c-event-clone').removeClass('ht5c-event');

		this._placeEvent(this._clone);
		this._gridSize = this.options.view=='agenda' ?

		                   [gridX,this.hourHeight]:

		                   [gridX,this.dayHeight];
		this._factors = this.options.view =='agenda' ? [24,this.hourSize]: [24,168];
		this._initX    = event.clientX;
		this._initY    = event.clientY;
		this._change=0;
		this._event.hide();
	},
	_mouseGetChange: function(event) {
		var dX  = event.clientX-this._initX,
		    dY  = event.clientY-this._initY,
		    pX  = Math.round(dX/this._gridSize[0])*this._factors[0],
		    pY  = Math.round(dY/this._gridSize[1])*this._factors[1];
		return (pX + pY);
	},
	_mouseDrag: function(event) {
		var delta = this._mouseGetChange(event);
		this._clone.start = moment(this._event.start);
		this._clone.end = moment(this._event.end);
		if(this._mouseType=='move') {
			this._clone.add(delta,'hours');
		} else {
			this._clone.end.add(delta,'hours');
			if(this._clone.end.isBefore(this._clone.start)) {
				this._clone.end = moment(this._clone.start).add(this.hourSize,'hours');
			}
			this._clone.update();
		}

		this._placeEvent(this._clone);
	},
	_mouseStop: function(event) {
		var delta = this._mouseGetChange(event);

		if(this._mouseType=='move') {
			this._event.add(delta,'hours');
		} else {
			this._event.end.add(delta,'hours');
			if(this._event.end.isBefore(this._event.start)) {
				this._event.end = moment(this._event.start).add(this.hourSize,'hours');
			}
			this._event.update();
		}
		this._event.show();
		this._placeEvent(this._event);
		this._clone.remove();
		this._clone = null;
		this._event = null;
		this._mouseAction = false;
	},
	relayout: function() {
		this._layoutHourRows();
		this._updateView();
	},
	next: function(duration) {
		var args = Array.prototype.slice.apply(arguments,[0]),
			defDur = this.options.view=='month' ? 'months': 'weeks';

		if(args.length===0) {
			this.defaultDate.add(1, defDur);
		} else {
			this.defaultDate.add.apply(this.defaultDate,args);
		}
		this._updateView();
	},
	prev: function(duration) {
		var args = Array.prototype.slice.apply(arguments,[0]),
			defDur = this.options.view=='month' ? 'months': 'weeks';
		if(args.length===0) {
			this.defaultDate.subtract(1, defDur);
		} else {
			this.defaultDate.subtract.apply(this.defaultDate,args);
		}
		this._updateView();
	}
});

$('[data-calendar="html5"]').html5calendar();

;;


});