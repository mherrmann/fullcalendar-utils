/*!
 * fullcalendar-rightclick v1.3
 * Docs & License: https://github.com/mherrmann/fullcalendar-rightclick
 * (c) 2015 Michael Herrmann
 */

(function($) {
	function monkeyPatchViewClass(View) {
		View = View.class || View;
		var renderFn = 'render' in View.prototype ? 'render' : 'renderDates';
		var originalRender = View.prototype[renderFn];
		var classes = new Array();
		var daySelector = "";
		
		for (idx = 1; idx < arguments.length; idx++) {
		    classes.push('.fc-widget-content ' + arguments[idx]);
		}
		daySelector = classes.join();

		View.prototype[renderFn] = function() {
			originalRender.call(this);
			this.registerDayRightclickListener();
			this.registerEventRightclickListener();
		};
		View.prototype.registerDayRightclickListener = function() {
		    var that = this;

		    this.el.off('contextmenu', daySelector);
		    this.el.on('contextmenu', daySelector,
				function(ev) {
					that.coordMap.build();
					var cell = that.coordMap.getCell(ev.pageX, ev.pageY);
					if (cell)
						return that.trigger(
							'dayRightclick', null, cell.start, ev
						);
				}
			);
		};
		View.prototype.registerEventRightclickListener = function() {
		    var that = this;

		    this.el.off('contextmenu', '.fc-event-container > *');
			this.el.on('contextmenu', '.fc-event-container > *', function(ev) {
				var seg = $(this).data('fc-seg');
				return that.trigger('eventRightclick', this, seg.event, ev);
			});
		}
	}
	var fc = $.fullCalendar;
	monkeyPatchViewClass(fc.views.agenda, '.fc-slats', '.fc-content-skeleton', '.fc-bg');
	monkeyPatchViewClass(fc.views.basic, '.fc-content-skeleton', '.fc-bg');
})(jQuery);
