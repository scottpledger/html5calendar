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

	function HT5Calendar(element, options) {
		this.element = $(element);
		this.options = $.extend(true,{},
			HT5Calendar.defaultOptions,
			options,
			HT5Calendar._getOptsFromElement(this.element));

		var self=this;
		this.element.addClass('html5calendar');
		this._getOptsFromElement();
		this.weekOffset=0;
		this.today = moment();
		this.defaultDate = (this.options.date=='today' ?
		                        moment():
		                        moment(this.options.defaultDate));
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
		this._initButtons();
		this._parseEvents();
		this.innerElement.removeClass('agenda basic month')
			.addClass(this.options.type);
		this.element.removeClass('ht5c-agenda ht5c-basic ht5c-month')
				.addClass('ht5c-'+this.options.type);
		
		this.render();

		this._mouseInit();
	}

	HT5Calendar.prototype._setOption = function(name, value) {

	}

	HT5Calendar.prototype._initButtons = function() {
		var self = this;
		this.element.find('[data-calendar-action]').on('click',function() {
			var $t=$(this);
			self.element.html5calendar($t.attr('data-calendar-action'));
		});
		this.element.find('[data-calendar-option]').on('click',function() {
			var $t=$(this);
			self.element.html5calendar('option',$t.attr('data-calendar-option'),$t.attr('data-calendar-optionValue'));
		});
	}

	HT5Calendar.prototype.render = function() {

	};

	HT5Calendar._getOptsFromElement = function($el) {
		var val,opts = {};
		for(var opt in HT5Calendar.defaultOptions) {
			val = $el.attr('data-calendar-'+opt.toLowerCase());
			if(val!==undefined) {
				opts[opt] = val;
			}
		}
		return opts;
	};

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
	console.log(this);
}

$('[data-calendar="html5"]').html5calendar();

;;


});