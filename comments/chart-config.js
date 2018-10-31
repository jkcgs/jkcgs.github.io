var rand = function() {
	return Math.round(Math.random() * 100);
};

window.config = {
	type: 'line',
	data: {
		datasets: []
	},
	options: {
		responsive: true,
		title: {
			display: true,
			text: '/r/Chile comments timeline'
		},
		tooltips: {
			mode: 'index',
			intersect: false,
		},
		hover: {
			mode: 'nearest',
			intersect: true
		},
		scales: {
			xAxes: [{
				type: 'time',
				time: {
					parser: 'YYYY-MM-DD',
					round: 'day',
					min: moment().subtract(1, 'years'),
					max: moment(),
					fillGapsWithZero: true
				},
				scaleLabel: {
					display: true,
					labelString: 'Date'
				},
				minUnit: 'day'
			}],
			yAxes: [{
				scaleLabel: {
					display: true,
					labelString: 'comments'
				}
			}]
		}
	}
};

window.addEventListener('load', function() {
	var sinceInput = document.querySelector('input[type=date]');
	sinceInput.min = moment().subtract(1, 'years').format('YYYY-MM-DD');

	var fillScatteredTimeScaleDataPlugin = {
		beforeUpdate: function(c) {
			var timeAxis = c.options.scales.xAxes[0].time;
			if (!timeAxis || !timeAxis.fillGapsWithZero) return;

			for (var i=0;i<c.data.datasets.length;i++) {
				var set = c.data.datasets[i];
				var min, max, hash = {};

				for (var j=0;j<set.data.length;j++){
					var val = moment(set.data[j].x, timeAxis.parser);
					if (!min || min.diff(val)>0)
						min = val;
					if (!max || max.diff(val)<0)
						max = val;
					hash[val.format(timeAxis.parser)] = 1;
				}

				var curr = min.clone();

				for (var val = 0; val < max.diff(min, 'days'); val++){
					curr.add(1, 'd');

					var d = curr.format(timeAxis.parser);

					if (Object.keys(hash).indexOf(d) === -1) {
						set.data.push({x: curr.toDate(), y: 0});
					}
				}
				
				set.data.sort(function(a,b){
					return a.x < b.x?-1:1;
				});

				var sinceMoment = moment(sinceInput.valueAsDate);
				var since = Math.max(moment().subtract(1, 'years'), sinceMoment);
				window.config.options.scales.xAxes[0].time.min = Math.max(since, Math.max(min, sinceMoment));
			}
		}
	}

	Chart.pluginService.register(fillScatteredTimeScaleDataPlugin);

	window.lineChart = new Chart(
		document.querySelector('canvas'), window.config
	);

});
