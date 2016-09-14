import gulp from 'gulp';
import color from 'oneColor';
import path from 'path';
import through from "through2";
import gutil from 'gulp-util';
import read from 'read-file';
import fs from 'fs';
import format from 'gulp-json-format';
import camelCase from 'camelcase';
import write from 'write';
import { readTemplate, saveFile, replaceHeaderTokens, readColors, readTokens, __PATHS__ } from './util.js';

const CONFIG = {
  ios_tokens_factory:'SLDSSizing',
  tokens_file:'sizing.json'
};

const tokensFile = path.join(__PATHS__.force_base_tokens, CONFIG.tokens_file);

export const saveHeader = (factoryName) => {
  return through.obj(function(file, enc, cb) {
    let options = JSON.parse(file.contents.toString('utf-8'));
    let fileName = path.join(options.tempDir,factoryName);
    let lines = options.tokensEnum.map((enumName) => {
      return 'static const int ' + enumName + ' = ' +options.tokens[enumName];
    });
    let src = lines.join(';\n')+';';
    options.src = src;
    write(fileName, options.src);
    this.push(file);
    cb();
  });
};

gulp.task('sizing', () => {
  fs.writeFile(path.join(__PATHS__.temp, 'sizing.json'), '{"tempDir":'+'"'+__PATHS__.generated+'"}');
  return gulp.src(path.join(__PATHS__.temp, 'sizing.json'))
    .pipe(readTokens(tokensFile))
    .pipe(saveHeader(CONFIG.ios_tokens_factory + '.h'))
    .pipe(format(2))
    .pipe(gulp.dest(__PATHS__.temp));
});