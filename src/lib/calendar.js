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