var colours = ['red', '#131369', '#136913', '#691369', '#696913'];
var posts = {};
var ready = false;
var ready_count = 0;
var ready_total = 0;
var loading = document.querySelector('span');

function getUrl(user, after) {
	var base = 'https://www.reddit.com/user/';
	base += user + '.json?limit=100';
	if (after) base += ('&after=' + after);
	return base;
}

function loadInput() {
	var input = document.querySelector('input');
	if (!ready || input.value === '') {
		return;
	}

	loading.style.display = 'inline';
	load(input.value.split(',').map(i => i.trim()));
}

function load(users) {
	ready = false;
	ready_count = 0;
	ready_total = users.length;
	window.config.data.datasets = [];
	for (var user of users) {
		loader(user);
	}
}

function loader(user, after) {
	if (!posts[user]) posts[user] = [];

	after = after || '';
	var url = getUrl(user, after);

	(new Promise(function (resolve, reject) {
		if (posts[user].length && !after) {
			resolve([user, posts[user]]);
		} else {
			console.log('Loading:', url);
			return axios.get(url).then(function(response) {
				var d = response.data.data;
				posts[user] = posts[user].concat(
					d.children.filter(
						u => u.kind === 't1' && u.data.subreddit == 'chile'
					).map(
						u => u.data
					)
				);

				if (d.after !== null) {
					loader(user, d.after);
				} else {
					resolve([user, posts[user]]);
				}
			}).catch(reject);
		}
	}))
	.then(function(resp) {
		process(resp[0], resp[1]);
	})
	.catch(function(e) {
		console.error(e);
		ready_count += 1;
		if (ready_count === ready_total) {
			ready = true;
			alert('One or more comment pages could not be retrieved');
		}
	});
}

function process(user, ps) {
	var data = ps.map(
		i => moment(new Date(parseInt(i.created_utc) * 1000)).format('YYYY-MM-DD')
	).reduce((p, i) => {
		if (Object.keys(p).indexOf(i) == -1) {
			p[i] = 1;
		} else {
			p[i]++;
		}

		return p;
	}, {});

	data = Object.keys(data).map(k => { return { x: moment(k, 'YYYY-MM-DD').toDate(), y: data[k] }; });

	var l = window.config.data.datasets.length;
	var colour = l >= colours.length ? randColour() : colours[window.config.data.datasets.length];
	window.config.data.datasets.push({
		label: user,
		backgroundColor: colour,
		borderColor: colour,
		data: data,
		fill: false
	});

	ready_count += 1;
	if (ready_count == ready_total) {
		window.lineChart.update();
		ready = true;
		loading.style.display = 'none';
	}
}

function randColour() {
	var r = Math.floor(Math.random() * 255);
	var g = Math.floor(Math.random() * 255);
	var b = Math.floor(Math.random() * 255);
	return '#' + r.toString(16) + g.toString(16) + b.toString(16);
}

window.addEventListener('load', function() {
	ready = true;

	tagsInput(document.querySelector('input[type=tags]'));
});