/*!
 * fullcalendar-rightclick v2.1
 * Docs & License: https://github.com/mherrmann/fullcalendar-rightclick
 * (c) 2015 Michael Herrmann
 */

(function($) {
	function monkeyPatchViewClass(View) {
		View = View.class || View;
		var renderFn = 'render' in View.prototype ? 'render' : 'renderSkeleton';
		var originalRender = View.prototype[renderFn];
		View.prototype[renderFn] = function() {
			originalRender.call(this);
			if (! this.el.data('fullcalendar-rightclick')) {
				this.registerRightclickListener();
				this.el.data('fullcalendar-rightclick', true);
			}
		};
		function trigger() {
			throw new Error("trigger not detected");
		}
		function oldTrigger(triggerFn) {
			return function trigger(that, jsEventName, view, dateOrEvent, jsEvent) {
				return that[triggerFn](jsEventName, view, dateOrEvent, jsEvent)
			};
		}
		if (typeof View.prototype.publiclyTrigger === 'function') {
			if (View.prototype.publiclyTrigger.toString().match(/name, thisObj/)) {
				// FullCalendar >= 3.1.0 && < 3.5.0:
				trigger = oldTrigger('publiclyTrigger');
			}
			else {
				// FullCalendar >= 3.5.0:
				trigger = function (that, jsEventName, view, dateOrEvent, jsEvent) {
					return that.publiclyTrigger(jsEventName, [ dateOrEvent, jsEvent, view ]);
				};
			}
		} else {
			// FullCalendar < 3.1.0:
			trigger = oldTrigger('trigger');
		}
		View.prototype.registerRightclickListener = function() {
			var that = this;
			// FullCalendar > 3.0.1:
			this.el.on('contextmenu', function(ev) {
				var eventElt = $(ev.target).closest('.fc-event');
				if (eventElt.length) {
					var seg = eventElt.data('fc-seg');
					var event;
					if (typeof seg.event === 'object') {
						event = seg.event;
					} else {
						event = seg.footprint.eventDef;
					}
					return trigger(that, 'eventRightclick', this, event, ev);
				} else {
					// Users of this library may add custom content inside
					// FullCalendar's DOM structure, eg. popovers. We don't want
					// to catch rightclicks on these custom elements, so we
					// check that the clicked element actually lies inside one
					// of FullCalendars default containers:
					var fcContainer = $(ev.target).closest(
						'.fc-bg, .fc-slats, .fc-content-skeleton, ' +
						'.fc-bgevent-skeleton, .fc-highlight-skeleton, .fc-widget-content'
					);
					if (fcContainer.length) {
						var cell;
						if (that.coordMap) {
							// FullCalendar < 2.5.0:
							that.coordMap.build();
							cell = that.coordMap.getCell(ev.pageX, ev.pageY);
						} else {
							// FullCalendar >= 2.5.0:
							that.prepareHits();
							var hit = that.queryHit(ev.pageX, ev.pageY);
							if (typeof that.getHitSpan === 'function') {
								// FullCalendar >= 2.5.0 && < 3.5.0:
								cell = that.getHitSpan(hit);
							} else {
								// FullCalendar >= 3.5.0:
								if (hit.row) {
									cell = hit.component.getCellRange(hit.row, hit.col);
								} else {
									var componentFootprint = hit.component.getSafeHitFootprint(hit);
									if (componentFootprint) {
										cell = that.calendar.footprintToDateProfile(componentFootprint);
									}
								}
							}
						}
						if (cell)
							return trigger(that, 'dayRightclick', null, cell.start, ev);
					}
				}
			});
		};
	}
	var fc = $.fullCalendar;
	monkeyPatchViewClass(fc.views.agenda);
	monkeyPatchViewClass(fc.views.basic);
	if(fc.views.timeline){
	monkeyPatchViewClass(fc.views.timeline);
	}
})(jQuery);
