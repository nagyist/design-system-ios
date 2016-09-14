import gulp from 'gulp';
import color from 'oneColor';
import path from 'path';
import through from "through2";
import gutil from 'gulp-util';
import read from 'read-file';
import fs from 'fs';
import format from 'gulp-json-format';
import { readTemplate, saveFile, replaceHeaderTokens, __PATHS__ } from './util.js';

const CONFIG = {
  ios_color_factory_template:'SLDSColorAliasTemplate',
  ios_color_factory:'SLDSColorAlias',
  colors_file:'aliases.json'
};

const colorsFile = path.join(__PATHS__.force_base_tokens, CONFIG.colors_file);
const templateFile = path.join(__PATHS__.ios_template, CONFIG.ios_color_factory_template);

const readColorAliases = () => {
	return through.obj(function(file, enc, cb) {
		let options = JSON.parse(file.contents.toString('utf-8'));
		let aliasesBuffer = read.sync(colorsFile);
		let colors = JSON.parse(aliasesBuffer.toString('utf-8')).aliases;
		let colorEnum = [];
		Object.keys(colors).map((name) => {
			let value = colors[name];
      let rgb = value.match(/#|hsl\(|rgb\(|rgba\(/) ? color(value).cssa() : value.match(/transparent/) ? 'rgba(0, 0, 0, 0)' : 'ALIAS_NOT_FOUND';
      let rgbArr = rgb.match(/\d+(\.\d{1,2})?/g);
      rgb = {r:rgbArr[0], g:rgbArr[1], b:rgbArr[2], a:rgbArr[3]};
      colors['SFDS_ALIAS_' + name] = rgb;
      colorEnum.push('SFDS_ALIAS_' + name);
		});
		options.colors = colors;
    options.colorEnum = colorEnum;
    file.contents = new Buffer(JSON.stringify(options), 'utf-8');
    this.push(file);
		cb();
	});
};

const replaceClassTokens = (templateName, factoryName) => {
	return through.obj(function(file, enc, cb) {
		let options = JSON.parse(file.contents.toString('utf-8'));
		let enumItemNames = options.colorEnum.map((enumName) => {
			return '@"'+enumName+'"';
		});
		let colorCases = options.colorEnum.map((name) => {
			let body = [];
			let rgb = options.colors[name];
			body.push('\tcase '+name+':{');
	    body.push('\t\t\tstatic UIColor *color = nil;');
	    body.push('\t\t\tstatic dispatch_once_t predicate = 0;');
	    body.push('\t\t\tdispatch_once(&predicate, ^{');
	    body.push('\t\t\tcolor = [UIColor colorWithRed:'+(Math.round(1000*rgb.r/255)/1000)+' green:'+(Math.round(1000*rgb.g/255)/1000)+' blue:'+(Math.round(1000*rgb.b/255)/1000)+' alpha:'+(rgb.a?rgb.a:1)+'];');
	    body.push('\t\t\t});');
	    body.push('\t\t\treturn color;');
	    body.push('\t\t\t}');
	    return body.join('\n');
		});
		let aliasColors = options.colorEnum.map((name) => {
	    let body = [];
	    let rgb = options.colors[name];
	    if (rgb) return '[UIColor colorWithRed:'+(Math.round(1000*rgb.r/255)/1000)+' green:'+(Math.round(1000*rgb.g/255)/1000)+' blue:'+(Math.round(1000*rgb.b/255)/1000)+' alpha:'+(rgb.a?rgb.a:1)+']';
	    return 'nil';
	  });
	  options.classSrc = options.template.classSrc.replace(new RegExp(templateName,"g"), factoryName)
	    .replace('/*COLOR_ENUM_STRING_VALUES*/',enumItemNames.join(',\\\n'))
	    .replace('/*ALIAS_COLORS*/',aliasColors.join(',\n'));
		file.contents = new Buffer(JSON.stringify(options), 'utf-8');
		this.push(file);
		cb();
	});
};

gulp.task('aliases', () => {
  fs.writeFile(path.join(__PATHS__.temp, 'aliases.json'), '{"tempDir":'+'"'+__PATHS__.generated+'"}');
  return gulp.src(path.join(__PATHS__.temp, 'aliases.json'))
    .pipe(readColorAliases())
    .pipe(readTemplate(templateFile + '.h', 'headerSrc'))
    .pipe(readTemplate(templateFile + '.m', 'classSrc'))
    .pipe(replaceHeaderTokens(CONFIG.ios_color_factory_template, CONFIG.ios_color_factory, 'SFDS_ALIAS_NOTFOUND,'))
    .pipe(replaceClassTokens(CONFIG.ios_color_factory_template, CONFIG.ios_color_factory))
    .pipe(saveFile(CONFIG.ios_color_factory + '.h', 'headerSrc'))
    .pipe(saveFile(CONFIG.ios_color_factory + '.m', 'classSrc'))
    .pipe(format(2))
    .pipe(gulp.dest(__PATHS__.temp));
});