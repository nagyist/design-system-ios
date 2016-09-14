import gulp from 'gulp';
import color from 'oneColor';
import path from 'path';
import through from "through2";
import gutil from 'gulp-util';
import read from 'read-file';
import fs from 'fs';
import format from 'gulp-json-format';
import camelCase from 'camelcase';
import { readTemplate, saveFile, replaceHeaderTokens, readColors, __PATHS__ } from './util.js';

const CONFIG = {
  ios_color_factory_template:'SLDSColorBgTemplate',
  ios_color_factory:'SLDSColorBg',
  colors_file:'background.json'
};

const colorsFile = path.join(__PATHS__.force_base_tokens, CONFIG.colors_file);
const templateFile = path.join(__PATHS__.ios_template, CONFIG.ios_color_factory_template);

export const replaceClassTokens = (templateName, factoryName) => {
	return through.obj(function(file, enc, cb) {
		let options = JSON.parse(file.contents.toString('utf-8'));
		let enumItemNames = options.colorEnum.map((enamName) => {
			return '@"'+enamName+'"';
		});
	  let colorAliases = options.colorEnum.map((name) => {
	  	return options.colors[name]
	  });
		options.classSrc = options.template.classSrc.replace(new RegExp(templateName,"g"), factoryName)
		  .replace('/*COLOR_ENUM_STRING_VALUES*/',enumItemNames.join(',\\\n'))
		  .replace('/*COLOR_ALIAS_VALUES*/',colorAliases.join(',\n'));
		file.contents = new Buffer(JSON.stringify(options), 'utf-8');
    this.push(file);
		cb();
	});
};

gulp.task('background', () => {
  fs.writeFile(path.join(__PATHS__.temp, 'background.json'), '{"tempDir":'+'"'+__PATHS__.generated+'"}');
  return gulp.src(path.join(__PATHS__.temp, 'background.json'))
    .pipe(readColors(colorsFile, false))
    .pipe(readTemplate(templateFile + '.h', 'headerSrc'))
    .pipe(readTemplate(templateFile + '.m', 'classSrc'))
    .pipe(replaceHeaderTokens(CONFIG.ios_color_factory_template, CONFIG.ios_color_factory, 'SLDS_COLOR_BG_NOTFOUND,'))
    .pipe(replaceClassTokens(CONFIG.ios_color_factory_template, CONFIG.ios_color_factory))
    .pipe(saveFile(CONFIG.ios_color_factory + '.h', 'headerSrc'))
    .pipe(saveFile(CONFIG.ios_color_factory + '.m', 'classSrc'))
    .pipe(format(2))
    .pipe(gulp.dest(__PATHS__.temp));
});