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
import { readTemplate, saveFile, replaceHeaderTokens, readColors, __PATHS__ } from './util.js';

const CONFIG = {
  ios_tokens_factory:'SLDSLineHeight',
  tokens_file:'font.json'
};

const tokensFile = path.join(__PATHS__.force_base_tokens, CONFIG.tokens_file);

const cap = (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

export const readTokens = (tokensFile, category) => {
  return through.obj(function(file, enc, cb) {
    let options = JSON.parse(file.contents.toString('utf-8'));
    let tokensBuffer = read.sync(tokensFile);
    let tokens = JSON.parse(tokensBuffer.toString('utf-8')).props;
    let tokensEnum = [];
    Object.keys(tokens).map((name) => {
        let token = tokens[name];
        if (token && token.category && token.category === category && token.value){
          let tokenName = name;
          let tokenValue = 0;
          if(token.value.indexOf('rem')>0){
            tokenValue = Math.round(14*parseFloat(token.value.replace('rem','')));
          }
          else{
            tokenName += '_MULTIPLE';
            tokenValue = token.value;
          }
          let enumName = 'SLDS'+cap(camelCase(tokenName));
          tokens[enumName] = tokenValue;
          tokensEnum.push(enumName);
        }
      });
    options.tokens = tokens;
    options.tokensEnum = tokensEnum;
    file.contents = new Buffer(JSON.stringify(options), 'utf-8');
    this.push(file);
    cb();
  });
};

export const saveHeader = (factoryName) => {
  return through.obj(function(file, enc, cb) {
    let options = JSON.parse(file.contents.toString('utf-8'));
    let fileName = path.join(options.tempDir,factoryName);
    let lines = options.tokensEnum.map((enumName) => {
      return 'static const float ' + enumName + ' = ' +options.tokens[enumName];
    });
    let src = lines.join(';\n')+';';
    options.src = src;
    write(fileName, options.src);
    this.push(file);
    cb();
  });
};

gulp.task('line-height', () => {
  fs.writeFile(path.join(__PATHS__.temp, 'line-height.json'), '{"tempDir":'+'"'+__PATHS__.generated+'"}');
  return gulp.src(path.join(__PATHS__.temp, 'line-height.json'))
    .pipe(readTokens(tokensFile, 'line-height'))
    .pipe(saveHeader(CONFIG.ios_tokens_factory + '.h'))
    .pipe(format(2))
    .pipe(gulp.dest(__PATHS__.temp));
});