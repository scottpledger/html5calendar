(function(root, factory) {
		if(typeof exports === 'object') {
				module.exports = factory(require('moment'));
		}
		else if(typeof define === 'function' && define.amd) {
				define('moment-range', ['moment'], factory);
		}
		else {
				root.moment = factory(root.moment);
		}
}(this, function(moment) {

/**
 * @class DateRange
 * 
 * The DateRange class, to create ranges of dates.
 * This class was originally found at [https://github.com/gf3/moment-range],
 * but I required some extensive additions to be made to it, and lack of access to the DateRange
 * object required that I fork it.
 */
var DateRange;

//TODO: I need to translate my changes back into coffeescript for the original project.
DateRange = (function() {

	/**
	 * @constructor
	 *
	 * Creates a DateRange object.
	 * @param {Moment|Date|Object|String|Number} start Start date/time
	 * @param {Moment|Date|Object|String|Number} end   End date/time
	 */
	function DateRange(start, end) {
		this.start = moment(start);
		this.end = moment(end);
	}

	/**
	 * @method contains
	 * 
	 * Determines whether or not this DateRange contains the
	 * given date/time or timespan.
	 * @param  {Moment|DateRange|Date|Object|String|Number} other 
	 * @return {Boolean}       
	 */
	DateRange.prototype.contains = function(other) {
		if (other instanceof DateRange) {
			return this.start < other.start && this.end > other.end;
		} else {
			return (this.start <= other && other <= this.end);
		}
	};

	/**
	 * @private
	 * @method \_by\_string
	 *
	 * No idea what this does.
	 * @param  {[type]} interval  [description]
	 * @param  {[type]} hollaback [description]
	 * @return {[type]}           [description]
	 */
	DateRange.prototype._by_string = function(interval, hollaback) {
		var current, _results;
		current = moment(this.start);
		_results = [];
		while (this.contains(current)) {
			hollaback.call(this, current.clone());
			_results.push(current.add(interval, 1));
		}
		return _results;
	};

	

	/**
	 * @private
	 * @method \_by\_range
	 *
	 * Again, no idea what this does.
	 * @param  {[type]} interval  [description]
	 * @param  {[type]} hollaback [description]
	 * @return {[type]}           [description]
	 */
	DateRange.prototype._by_range = function(range_interval, hollaback) {
		var i, l, _i, _results;
		l = Math.round(this / range_interval);
		if (l === Infinity) {
			return this;
		}
		_results = [];
		for (i = _i = 0; 0 <= l ? _i <= l : _i >= l; i = 0 <= l ? ++_i : --_i) {
			_results.push(hollaback.call(this, moment(this.start.valueOf() + range_interval.valueOf() * i)));
		}
		return _results;
	};

	

	/**
	 * [overlaps description]
	 * @param  {[type]} range [description]
	 * @return {[type]}       [description]
	 */
	DateRange.prototype.overlaps = function(range) {
		return this.intersect(range) !== null;
	};

	


	DateRange.prototype.intersect = function(other) {
		var _ref, _ref1, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7;
		if (((this.start <= (_ref1 = other.start) && _ref1 < (_ref = this.end)) && _ref < other.end)) {
			return new DateRange(other.start, this.end);
		} else if (((other.start < (_ref3 = this.start) && _ref3 < (_ref2 = other.end)) && _ref2 <= this.end)) {
			return new DateRange(this.start, other.end);
		} else if (((other.start < (_ref5 = this.start) && _ref5 < (_ref4 = this.end)) && _ref4 < other.end)) {
			return this;
		} else if (((this.start <= (_ref7 = other.start) && _ref7 < (_ref6 = other.end)) && _ref6 <= this.end)) {
			return other;
		} else {
			return null;
		}
	};

	


	DateRange.prototype.subtract = function(other) {
		var _ref, _ref1, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7;
		if (this.intersect(other) === null) {
			return [this];
		} else if (((other.start <= (_ref1 = this.start) && _ref1 < (_ref = this.end)) && _ref <= other.end)) {
			return [];
		} else if (((other.start <= (_ref3 = this.start) && _ref3 < (_ref2 = other.end)) && _ref2 < this.end)) {
			return [new DateRange(other.end, this.end)];
		} else if (((this.start < (_ref5 = other.start) && _ref5 < (_ref4 = this.end)) && _ref4 <= other.end)) {
			return [new DateRange(this.start, other.start)];
		} else if (((this.start < (_ref7 = other.start) && _ref7 < (_ref6 = other.end)) && _ref6 < this.end)) {
			return [new DateRange(this.start, other.start), new DateRange(other.end, this.end)];
		}
	};

	


	DateRange.prototype.by = function(range, hollaback) {
		if (typeof range === 'string') {
			this._by_string(range, hollaback);
		} else {
			this._by_range(range, hollaback);
		}
		return this;
	};

	


	DateRange.prototype.valueOf = function() {
		return this.end - this.start;
	};

	


	DateRange.prototype.toDate = function() {
		return [this.start.toDate(), this.end.toDate()];
	};

	


	DateRange.prototype.isSame = function(other) {
		return this.start.isSame(other.start) && this.end.isSame(other.end);
	};

	DateRange.prototype._format = function(fmt){
		if(typeof fmt === "string"){
			fmt = [fmt,fmt];
		}
		return this.start.format(fmt[0]) + DateRange.separator + this.end.format(fmt[1]);
	}

	DateRange.prototype.format = function(_directives){
		var directives = _directives||DateRange.defaultDirectives,
				start=this.start, end=this.end,
				chkFmt, fmt,i,matchIf,isMatch,matchFmt;
		if(directives['__default__']===undefined){
			directives['__default__'] = DateRange.defaultFormat;
		}
		for(chkFmt in directives){
			fmt=directives[chkFmt];
			if(chkFmt=='__default__'){
				return this._format(fmt);
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
					return this._format(fmt);
				}
			}
		}
	};

	
	DateRange.prototype.chunk=function(duration, onBoundary) {
		if(duration.slice(0,4)=='into'){
			onBoundary=moment.normalizeUnits(duration.slice(4));
			duration=moment.duration(1,onBoundary);
			
		}

		var tBegin=moment(this.start),
				tEnd = moment(this.start),
				res = [];
		if(onBoundary) {
			if(moment.isDuration(onBoundary)) {
				tEnd = moment(tBegin).add(onBoundary);
			} else {
				tEnd.endOf(onBoundary);
			}
		} else {
			tEnd.add(duration);
		}

		while(tEnd.isBefore(this.end)) {
			res.push(moment.range(tBegin,tEnd));
			tBegin = moment(tEnd).add(1);
			tEnd = moment(tEnd).add(duration);
		}

		if(!tBegin.isAfter(this.end)) {
			res.push(moment.range(tBegin,this.end));
		}

		return res;

	}

	DateRange.separator = " - ";

	DateRange.defaultDirectives={
		'YY':'M/D/YY h:mm a',
		'YYYY':'M/D/YYYY h:mm a',
		'M':'M/D h:mm a',
		'D':'M/D h:mm a',
		'h!mm':'h a',
		'__default__':'h:mm a'
	};

	DateRange.defaultFormat = 'l LT';

	return DateRange;

})();

moment._range = DateRange;

/**
 * @method moment.range()
 * 
 * Produces a new DateRange object.
 * @param  {Moment|Date|Object|String|Number} start Start date/time
 * @param  {Moment|Date|Object|String|Number} end   End date/time
 * @return {DateRange}
 */
moment.range = function(start,end){
	return new DateRange(start,end);
}


/**
 * @method moment().range()
 *
 * Creates a new DateRange
 * @param  {Moment|Date|Object|String|Number} start Start date/time
 * @return {DateRange}
 */
moment.fn.range = function(start) {
	if (['year', 'month', 'week', 'day', 'hour', 'minute', 'second'].indexOf(start) > -1) {
		return new DateRange(moment(this).startOf(start), moment(this).endOf(start));
	} else {
		return new DateRange(moment(this), start);
	}
};




moment.fn.within = function(range) {
	return range.contains(this._d);
};

		return moment;
}));
