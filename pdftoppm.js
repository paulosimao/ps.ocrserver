/**
 * Created by paulosimao on 11/03/16.
 */

var uuid         = require('uuid');
var p            = require('process');
var childprocess = require('child_process');
var fs           = require('fs');
function pdftoppm(path, options, cb) {
	var pre = uuid();
	console.log(pre);
	var params = [];

	for (o in options) {
		params.push('-' + o);
		if (options[o]) {
			params.push(options[o]);
		}

	}

	params.push(path);
	params.push('/tmp/' + pre);


	console.log(params);

	var p = childprocess.spawn('pdftoppm', params);
	p.on('close', (code)=> {
		if (code != 0) {
			return cb('Err:' + code);
		}

		fs.readdir('/tmp', function (err, files) {
			var retfiles = [];
			if (err) {
				return cb(err);
			}
			for (f of files) {
				if (f.startsWith(pre)) {
					retfiles.push('/tmp/' + f);
				}
			}
			cb(null, retfiles);
		})


	});

	p.stdout.on('data', (data) => {
		console.log(`stdout: ${data}`);
	});

	p.stderr.on('data', (data) => {
		console.log(`stderr: ${data}`);
	});

}

module.exports = pdftoppm;