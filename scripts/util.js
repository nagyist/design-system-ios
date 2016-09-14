import gulp from 'gulp';
import path from 'path';
import through from "through2";
import write from 'write';
import read from 'read-file';
import camelCase from 'camelcase';

const root = path.resolve(__dirname, '../');

export const __PATHS__ = {
  design_tokens : path.join(root,'git_modules','design-tokens','tokens'),
  icons : path.join(root,'node_modules','@salesforce-ux','icons','dist','salesforce-lightning-design-system-icons'),
  force_base_tokens : path.join(root,'git_modules','design-tokens','tokens','force-base'),
  generated : path.join(root,'SalesforceDesignSystem','Generated'),
  ios_template : path.join(root,'SalesforceDesignSystem','Templates'),
  font_file : 'SalesforceDesignSystemIconsUtility.ttf',
  bundle : path.join(root,'SalesforceDesignSystemResources'),
  css_dist : path.join(root,'_dist_css'),
  temp : path.join(root,'temp')
};

const cap = (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

export const readColors = (colorsFile, scrapeColor, formatEnumName) => {
	return through.obj(function(file, enc, cb) {
		let options = JSON.parse(file.contents.toString('utf-8'));
		let colorsBuffer = read.sync(colorsFile);
		let colors = JSON.parse(colorsBuffer.toString('utf-8')).props;
		let colorEnum = [];
		Object.keys(colors).map((name) => {
			var color = colors[name];
			if ((color.category && color.category.indexOf('color') > -1) || !scrapeColor) {
      	let alias = colors[name].value.match(/{!/) ? 'SFDS_ALIAS_'+colors[name].value.replace('{!','').replace('}','') : 'ALIAS_NOT_FOUND';
      	let enumName = formatEnumName ? formatEnumName(name) : 'SLDS'+cap(camelCase(name));
      	colors[enumName] = alias;
      	colorEnum.push(enumName);
      }
		})
		options.colors = colors;
    options.colorEnum = colorEnum;
    file.contents = new Buffer(JSON.stringify(options), 'utf-8');
    this.push(file);
		cb();
	});
};

export const readTokens = (tokensFile) => {
  return through.obj(function(file, enc, cb) {
    let options = JSON.parse(file.contents.toString('utf-8'));
    let tokensBuffer = read.sync(tokensFile);
    let tokens = JSON.parse(tokensBuffer.toString('utf-8')).props;
    let tokensEnum = [];
    Object.keys(tokens).map((name) => {
        let token = tokens[name];
        if (token && token.value){
          let tokenName = name;
          let tokenValue = Math.round(14*parseFloat(token.value.replace('rem','')));
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

export const readTemplate = (templateFilePath, src) => {
	return through.obj(function(file, enc, cb) {
		let options = JSON.parse(file.contents.toString('utf-8'));
		let templateFileContents = read.sync(templateFilePath).toString();
		if (!options.template) options.template = {};
		options.template[src] = templateFileContents;
		file.contents = new Buffer(JSON.stringify(options), 'utf-8');
    this.push(file);
    cb();
	});
};

export const saveFile = (factoryName, src) => {
	return through.obj(function(file, enc, cb) {
		let options = JSON.parse(file.contents.toString('utf-8'));
		let fileName = path.join(options.tempDir,factoryName);
		write(fileName, options[src]);
		this.push(file);
		cb();
	});
};

export const replaceHeaderTokens = (templateName, factoryName, replacement) => {
	return through.obj(function(file, enc, cb) {
		let options = JSON.parse(file.contents.toString('utf-8'));
		options.headerSrc = options.template.headerSrc.replace(new RegExp(templateName, "g"), factoryName)
		    .replace(replacement,'')
		    .replace('/*COLOR_ENUM_VALUES*/',options.colorEnum.join(',\n\t'));
		file.contents = new Buffer(JSON.stringify(options), 'utf-8');
		this.push(file);
		cb();
	});
};