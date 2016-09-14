/*
 Copyright (c) 2015, salesforce.com, inc. All rights reserved.
 Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:
 Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
 Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.
 Neither the name of salesforce.com, inc. nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.
 THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
import gulp from 'gulp';
import color from 'oneColor';
import path from 'path';
import through from "through2";
import gutil from 'gulp-util';
import read from 'read-file';
import fs from 'fs';
import format from 'gulp-json-format';
import camelCase from 'camelcase';
import { readTemplate, saveFile, readColors, __PATHS__ } from './util.js';

var CONFIG = {
  ios_font_size_factory_template:'SLDSFontSzTemplate',
  ios_font_size_factory:'SLDSFontSz',
  ios_font_factory_template:'SLDSFontTemplate',
  ios_font_factory:'SLDSFont',
  fonts_file:'font.json'
};

const fontsFile = path.join(__PATHS__.force_base_tokens, CONFIG.fonts_file);
const fontSizeTemplateFile = path.join(__PATHS__.ios_template, CONFIG.ios_font_size_factory_template);
const fontTemplateFile = path.join(__PATHS__.ios_template, CONFIG.ios_font_factory_template);

const cap = (str) => {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export const readFonts = () => {
  return through.obj(function(file, enc, cb) {
    let options = JSON.parse(file.contents.toString('utf-8'));
    let fontSizes = {};
    let fontSizeEnum = [];
    let fontNames = {};
    let fontNameEnum = [];
    let fontsBuffer = read.sync(fontsFile);
    let fonts = JSON.parse(fontsBuffer.toString('utf-8')).props;
    Object.keys(fonts).map((name) => {
      let font = fonts[name];
      if (font.type === 'size'){
        let size = parseFloat(font.value.replace('rem',''))*16;
        let sizeEnumName = 'SLDS'+cap(camelCase(name))
        fontSizes[sizeEnumName] = size;
        fontSizeEnum.push(sizeEnumName);
      } else if (font.type === 'font' && font.deprecated){
        let fontName = font.value.split(',')[0].replace(/'/g,'');
        fontNames['SFDS_'+name] = fontName;
        fontNameEnum.push('SFDS_'+name);
      }
    });
    options.fontSizes = fontSizes;
    options.fontSizeEnum = fontSizeEnum;
    options.fontNames = fontNames;
    options.fontNameEnum = fontNameEnum;
    file.contents = new Buffer(JSON.stringify(options), 'utf-8');
    this.push(file);
    cb();
  });
};

export const replaceFontSizeHeaderTokens = (templateName, factoryName) => {
  return through.obj(function(file, enc, cb) {
    let options = JSON.parse(file.contents.toString('utf-8'));
    options.fontSizeHeaderSrc = options.template.fontSizeHeaderSrc.replace(new RegExp(templateName, "g"), factoryName)
        .replace('SFDS_FONT_SIZE_NOTFOUND,','')
        .replace('/*SFDS_FONT_ENUM_VALUES*/',options.fontSizeEnum.join(',\n\t'));
    file.contents = new Buffer(JSON.stringify(options), 'utf-8');
    this.push(file);
    cb();
  });
};

export const replaceFontHeaderTokens = (templateName, factoryName) => {
  return through.obj(function(file, enc, cb) {
    let options = JSON.parse(file.contents.toString('utf-8'));
    options.fontHeaderSrc = options.template.fontHeaderSrc.replace(new RegExp(templateName, "g"), factoryName)
        .replace('/*FONT_FAMILY_ENUM_VALUES*/',options.fontNameEnum.join(',\n\t'));
    file.contents = new Buffer(JSON.stringify(options), 'utf-8');
    this.push(file);
    cb();
  });
};

export const replaceFontSizeClassTokens = (templateName, factoryName) => {
  return through.obj(function(file, enc, cb) {
    let options = JSON.parse(file.contents.toString('utf-8'));
    const fontSizeCases = options.fontSizeEnum.map((name) => {
      let body = [];
      let size = options.fontSizes[name];
      body.push('\tcase '+name+':');
        body.push('\t\t\treturn '+size+';');
      return body.join('\n');
    });
    options.fontSizeClassSrc = options.template.fontSizeClassSrc.replace(new RegExp(templateName,"g"), factoryName)
      .replace('/*SFDS_FONT_SIZE_CASES*/',fontSizeCases.join('\n'));
    file.contents = new Buffer(JSON.stringify(options), 'utf-8');
    this.push(file);
    cb();
  });
};

export const replaceFontClassTokens = (templateName, factoryName) => {
  return through.obj(function(file, enc, cb) {
    let options = JSON.parse(file.contents.toString('utf-8'));

    const regularFontSizeCases = options.fontSizeEnum.map(function(name){
      let lines = [];
      lines.push('\t\tcase '+name+':{');
      lines.push('\t\t\tstatic dispatch_once_t predicate = 0;');
      lines.push('\t\t\tstatic UIFont* font;');
      lines.push('\t\t\tdispatch_once(&predicate, ^{');
      lines.push('\t\t\t\tfont = [UIFont fontWithName:bodyFontName size:[SLDSFontSz sldsFontSize:'+name+']];');
      lines.push('\t\t\t});');
      lines.push('\t\t\treturn font;');
      lines.push('\t\t}');
      return lines.join('\n');
    });

    const strongFontSizeCases = options.fontSizeEnum.map(function(name){
      let lines = [];
      lines.push('\t\tcase '+name+':{');
      lines.push('\t\t\tstatic dispatch_once_t predicate = 0;');
      lines.push('\t\t\tstatic UIFont* font;');
      lines.push('\t\t\tdispatch_once(&predicate, ^{');
      lines.push('\t\t\t\tfont = [UIFont fontWithName:strongFontName size:[SLDSFontSz sldsFontSize:'+name+']];');
      lines.push('\t\t\t});');
      lines.push('\t\t\treturn font;');
      lines.push('\t\t}');
      return lines.join('\n');
    });

    const lightFontSizeCases = options.fontSizeEnum.map(function(name){
      let lines = [];
      lines.push('\t\tcase '+name+':{');
      lines.push('\t\t\tstatic dispatch_once_t predicate = 0;');
      lines.push('\t\t\tstatic UIFont* font;');
      lines.push('\t\t\tdispatch_once(&predicate, ^{');
      lines.push('\t\t\t\tfont = [UIFont fontWithName:lightFontName size:[SLDSFontSz sldsFontSize:'+name+']];');
      lines.push('\t\t\t});');
      lines.push('\t\t\treturn font;');
      lines.push('\t\t}');
      return lines.join('\n');
    });
    options.fontClassSrc = options.template.fontClassSrc.replace(new RegExp(templateName,"g"), factoryName)
      .replace('/*FONT_REGULAR_SIZES*/',regularFontSizeCases.join('\n'))
      .replace('/*FONT_STRONG_SIZES*/',strongFontSizeCases.join('\n'))
      .replace('/*FONT_LIGHT_SIZES*/',lightFontSizeCases.join('\n'));
    file.contents = new Buffer(JSON.stringify(options), 'utf-8');
    this.push(file);
    cb();
  });
};

gulp.task('fonts', () => {
  fs.writeFile(path.join(__PATHS__.temp, 'fonts.json'), '{"tempDir":'+'"'+__PATHS__.generated+'"}');
  return gulp.src(path.join(__PATHS__.temp, 'fonts.json'))
    .pipe(readFonts())
    .pipe(readTemplate(fontSizeTemplateFile + '.h', 'fontSizeHeaderSrc'))
    .pipe(readTemplate(fontSizeTemplateFile + '.m', 'fontSizeClassSrc'))
    .pipe(readTemplate(fontTemplateFile + '.h', 'fontHeaderSrc'))
    .pipe(readTemplate(fontTemplateFile + '.m', 'fontClassSrc'))
    .pipe(replaceFontSizeHeaderTokens(CONFIG.ios_font_size_factory_template, CONFIG.ios_font_size_factory))
    .pipe(replaceFontHeaderTokens(CONFIG.ios_font_factory_template, CONFIG.ios_font_factory))
    .pipe(replaceFontSizeClassTokens(CONFIG.ios_font_size_factory_template, CONFIG.ios_font_factory))
    .pipe(replaceFontClassTokens(CONFIG.ios_font_size_factory_template, CONFIG.ios_font_factory))
    .pipe(saveFile(CONFIG.ios_font_size_factory + '.h', 'fontSizeHeaderSrc'))
    .pipe(saveFile(CONFIG.ios_font_size_factory + '.m', 'fontSizeClassSrc'))
    .pipe(saveFile(CONFIG.ios_font_factory + '.h', 'fontHeaderSrc'))
    .pipe(saveFile(CONFIG.ios_font_factory + '.m', 'fontClassSrc'))
    .pipe(format(2))
    .pipe(gulp.dest(__PATHS__.temp));
});