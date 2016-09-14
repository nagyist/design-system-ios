import gulp from 'gulp';
import iconfont from 'gulp-iconfont';
import svgmin from 'gulp-svgmin';
import consolidate from 'gulp-consolidate';
import fontplugin from '../build/icon-fonts/fontplugin';
import gulpFilter from 'gulp-filter';
import runSequence from 'run-sequence';
import { __PATHS__ } from './util.js';

const ttfFilter = gulpFilter('**/*.ttf');
const opts = [
    {
      removeViewBox:true,
      convertShapeToPath:true
    },
    {
      fontplugin:fontplugin
    },
    {
      transformsWithOnePath:{}
    },
    {
      cleanupNumericValues: {
          floatPrecision: 3
      }
    }
  ]

gulp.task('generate:fonts:utility', () => {
    return gulp.src([__PATHS__.icons+'/utility/*.svg'])
      .pipe(svgmin({
          plugins: opts
        }))
      .pipe(iconfont({
        fontName: 'SalesforceDesignSystemIconsUtility',
      }))
      .on('glyphs', (glyphs, options) => {
        gulp.src('./build/icon-fonts/templates/SalesforceDesignSystemIconsUtility.css')
          .pipe(consolidate('lodash', {
            glyphs: glyphs,
            fontName: 'SalesforceDesignSystemIconsUtility',
            fontPath: '',
            className: 's'
          }))
          .pipe(gulp.dest('_dist_css/'));

      })
      .pipe(ttfFilter)
      .pipe(gulp.dest('SalesforceDesignSystem.bundle/'));
});

gulp.task('generate:fonts:action', () => {
    return gulp.src([__PATHS__.icons+'/action/*.svg'])
        .pipe(svgmin({
            plugins: opts
        }))
    .pipe(iconfont({
      fontName: 'SalesforceDesignSystemIconsAction', 
    }))
    .on('glyphs', (glyphs, options) => {
      gulp.src('./build/icon-fonts/templates/SalesforceDesignSystemIconsAction.css')
        .pipe(consolidate('lodash', {
          glyphs: glyphs,
          fontName: 'SalesforceDesignSystemIconsAction',
          fontPath: '',
          className: 's'
        }))
        .pipe(gulp.dest('_dist_css/'));

    })
    .pipe(ttfFilter)
    .pipe(gulp.dest('SalesforceDesignSystem.bundle/'));
});

gulp.task('generate:fonts:custom', () => {
    return gulp.src([__PATHS__.icons+'/custom/*.svg'])
        .pipe(svgmin({
            plugins: opts
        }))
    .pipe(iconfont({
      fontName: 'SalesforceDesignSystemIconsCustom', 
    }))
    .on('glyphs', (glyphs, options) => {
      gulp.src('./build/icon-fonts/templates/SalesforceDesignSystemIconsCustom.css')
        .pipe(consolidate('lodash', {
          glyphs: glyphs,
          fontName: 'SalesforceDesignSystemIconsCustom',
          fontPath: '',
          className: 's'
        }))
        .pipe(gulp.dest('_dist_css/'));

    })
    .pipe(ttfFilter)
    .pipe(gulp.dest('SalesforceDesignSystem.bundle/'));
});

gulp.task('generate:fonts:standard', () => {
    return gulp.src([__PATHS__.icons+'/standard/*.svg'])
        .pipe(svgmin({
            plugins: opts
        }))
    .pipe(iconfont({
      fontName: 'SalesforceDesignSystemIconsStandard', 
    }))
    .on('glyphs', (glyphs, options) => {
      gulp.src('./build/icon-fonts/templates/SalesforceDesignSystemIconsStandard.css')
        .pipe(consolidate('lodash', {
          glyphs: glyphs,
          fontName: 'SalesforceDesignSystemIconsStandard',
          fontPath: '',
          className: 's'
        }))
        .pipe(gulp.dest('_dist_css/'));

    })
    .pipe(ttfFilter)
    .pipe(gulp.dest('SalesforceDesignSystem.bundle/'));
});


gulp.task('generate:fonts', (callback) => {
  runSequence(['generate:fonts:utility', 'generate:fonts:action', 'generate:fonts:custom', 'generate:fonts:standard'], callback);
});
