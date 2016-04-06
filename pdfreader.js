/**
 * Created by paulosimao on 12/03/16.
 */

var pdftoppm     = require('./pdftoppm');
var fs           = require('fs');
var async        = require('async');
var childprocess = require('child_process');
var events       = require('events');

function pdfreader() {
	this.emitter = new events();
}

pdfreader.prototype.gettext = function (path, options, cb) {

	var self = this;

	function processfiles(files, cb) {
		var pages  = [];
		var pageno = 0;

		self.emitter.emit('job-start', files);

		async.eachSeries(files, (f, acb)=> {

			var start = new Date().getTime();
			self.emitter.emit('page-start', {pageno: pageno, fname: f});


			var buffer  = '';
			var berr    = '';
			var iserror = false;

			var p = childprocess.spawn('tesseract', [f, 'stdout', '-l', options.lang]);

			p.stdout.on('data', (d)=> {
				buffer = buffer + d.toString();
			});
			p.stderr.on('data', (d)=> {
				//iserror;
				//console.error(d);
				buffer = buffer + d.toString();
			});

			p.on('close', (code)=> {
				if (code != 0) {
					return acb('Err:' + code + ' - ' + berr);
				}
				pageno++;
				var end = new Date().getTime();
				self.emitter.emit('page-end', {pageno: pageno, time: end - start, fname: f, content: buffer});
				pages.push(buffer);
				acb();
			});

		}, (err)=> {
			if (err)return cb(err);
			cb(null, pages);
			self.emitter.emit('job-end', err);
		});
	}

	pdftoppm(path, {tiff: ''}, (err, files)=> {
			if (err) return cb(err, null);
			processfiles(files, cb);

		}
	);


}

module.exports = pdfreader;