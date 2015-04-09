(function($) {
"use strict";

var TYPEDATE_FORMAT = 'YYYY-MM-DD';

function Datepicker(element, options) {
    var self = this,
        $element = $(element),
        defaults = {
            dateformat: 'DD.MM.YYYY',
            placeholder: $element.attr('placeholder') || '',
            theme: 'basic',
        };

    self.options = $.extend({}, defaults, options);
    self.$element = $element;
    self.value = $element.val();
    self.init();
}
/**
 * Initializes the datepicker.
 */
Datepicker.prototype.init = function() {
    var self = this;

    self.$picker = $('<div></div>')
    .hide()
    .addClass("picker")

    //high level events
    .on('_render.datepicker', function() {
        self.$picker
        .trigger('_reposition')
        .html("<div class='header'><div class='prev'>&lt;</div><div class='next'>&gt;</div><span class='month'>" + self.displayed.format('MMMM YYYY') + "</span></div><div class='calendar'>" + self.month_table(self.displayed, self.value) + '</div>');
    })
    .on('_reposition.datepicker', function() {
        var pos = self.$input.offset();
        pos.top += self.$input.outerHeight();
        self.$picker
        .offset(pos);
    })

    //user interaction
    .on('click.datepicker', '.month', function(e) {
        self.displayed = moment().date(1);
        self.$picker.trigger('_render');
    })
    .on('click.datepicker', '.prev', function() {
        self.displayed.subtract(1, 'month');
        self.$picker.trigger('_render');
    })
    .on('click.datepicker', '.next', function() {
        self.displayed.add(1, 'month');
        self.$picker.trigger('_render');
    })
    .on('click.datepicker', '.day:not(.invalid)', function(e) {
        var picked = moment($(e.target).attr('data-date'));

        self.value = picked;
        self.$input.val(picked.format(self.options.dateformat));
        self.$element.val(self.format_value(picked));
        
        self.$element
        .trigger('change', self.value)
        .trigger('hidedatepicker');
    })
    .on('click.datepicker', function(e) {
        e.stopPropagation(); //prevent event bubbling
    });


    self.$input = $('<input type="text"/>')
    .attr('class', self.$element.attr('class'))
    .addClass("input")
    .attr('placeholder', self.options.placeholder)
    .on('click.datepicker datepicker.datepicker', function(e) {
        if (e.type == 'click' && self.$picker.is(':visible')) {
            self.$element.trigger('hidedatepicker');
        } else {
            $('.hasDatepicker').not(self.$element).trigger('hidedatepicker');
            self.$element.trigger('showdatepicker');
        }
        return false;
    });


    self.$container = $('<div class="datepicker"></div>')
    .addClass(self.options.theme)
    .append(self.$input)
    .append(self.$picker);


    self.$element
    .attr('readonly', 'readonly')
    .addClass('hasDatepicker')
    .on('showdatepicker.datepicker', function(e) {
        self.displayed = (self.value || moment()).clone().date(1);
        self.$picker.show().trigger('_render');

        //global events
        $(document)
        .on('wheel.datepicker', function() {
            self.$picker.trigger('_reposition');
        })
        .on('click.datepicker', function(e) {
            self.$element.trigger('hidedatepicker');
        });
    })
    .on('hidedatepicker.datepicker', function() {
        self.displayed = null;
        self.$picker.hide();

        //global events
        $(document).off('.datepicker');
    })
    .on('change.datepicker', function(e, internal) {
        var parsed = moment(self.parse_value(this));
        if (!internal && parsed.isValid()) {
            self.value = parsed;
            self.$input.val(parsed.format(self.options.dateformat));
        }
    })
    .hide()
    .after(self.$container);
};
/**
 * Parses the current value of the input element.
 */
Datepicker.prototype.parse_value = function() {
    var self = this,
        format = self.$element.is('[type="date"]') ? TYPEDATE_FORMAT : self.options.dateformat;
    return moment(self.$element.val(), format);
};
/**
 * Formats the specified value for the input element.
 */
Datepicker.prototype.format_value = function(value) {
    var self = this,
        format = self.$element.is('[type="date"]') ? TYPEDATE_FORMAT : self.options.dateformat;
    return moment(value).format(format);
};
/**
 * Returns day of the week with monday = 0, sunday = 6
 */
Datepicker.prototype.weekday = function(date) {
    return (moment(date).day() + 6) % 7;
};
/**
 * Generates an array of weeks, each containing the dates of the weekdays.
 */
Datepicker.prototype.month_array = function(date) {
    var self = this,
        week = [],
        weeks = [week],
        first = moment(date).date(1),
        current = first,
        i;
    for (i=0; i<self.weekday(first); i++) {
        week.push(null); //fill up week before first of month
    }
    for (i=0; i<first.daysInMonth(); i++) {
        current = first.clone().add(i, 'days');
        if (self.weekday(current) == 0 && week.length > 0) {
            week = [];
            weeks.push(week);
        }
        week.push(current);
    }
    for (i=self.weekday(current)+1; i<7; i++) {
        week.push(null); //fill up week after last of month
    }
    return weeks;
};
/**
 * Generates the html structure for the calendar.
 */
Datepicker.prototype.month_table = function(displayed, value) {
    var self = this,
        today = moment(),
        wd = moment.weekdaysMin(),
        t = ['<table><tr><th>', wd[1], '</th><th>', wd[2], '</th><th>', wd[3], '</th><th>', wd[4], '</th><th>', wd[5], '</th><th>', wd[6], '</th><th>', wd[0], '</th></tr>'];
    $.each(self.month_array(displayed), function(ix, week) {
        t.push('<tr>');
        $.each(week, function(ix, day) {
            var label = day ? day.format('D') : '',
                title = day ? day.format(self.options.dateformat) : '',
                repr = day ? day.format() : '',
                classes = [];
            if (day) {
                classes.push('day');
                if (day.isSame(today, 'day')) classes.push('today');
                if (day.isSame(value, 'day')) classes.push('current');
                if (self.options.is_invalid_date && self.options.is_invalid_date(day)) classes.push('invalid');
            }
            t.push("<td class='" + classes.join(' ') + "' data-date='" + repr + "' title='" + title + "'>" + label + "</td>");
        });
        t.push('</tr>');
    });
    t.push('</table>');
    return t.join('');
};


/**
 * Plugin/directive registration
 */

$.fn.datepicker = function(options) {
    return this.each(function(ix, el) {
        new Datepicker(el, options);
    });
};


if (typeof angular != 'undefined') {
    angular.module('datepicker', [])
    .directive('datepicker', [function(utils) {
        return {
            restrict: 'A',
            require: '?ngModel',
            link: function(scope, element, attrs, ngModel) {
                var defaults = {
                        vspace: 0,
                        dateformat: 'DD.MM.YYYY',
                        is_invalid_date: null
                    },
                    options = angular.extend({}, defaults, scope.$eval(attrs.datepicker) || {}),
                    picker;

                if (!ngModel) {
                    return;
                }

                picker = new Datepicker(element, options);

                ngModel.$render = function() {
                    element.val(ngModel.$viewValue).trigger('change');
                };
            }
        }
    }]);
}

}(jQuery));