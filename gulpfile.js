const {src, dest,　watch, parallel, series} = require('gulp');
const babel = require('gulp-babel');
const eslint = require('gulp-eslint');
const terser = require('gulp-terser');
const rename = require('gulp-rename');
const cleanCss = require('gulp-clean-css');

const buildJs = () => src('./src/**/*.js')
  .pipe(eslint())
  .pipe(eslint.failOnError())
  .pipe(babel())
  .pipe(dest('./dist/'));

const watchJs = () => watch('./src/**/*.js', buildJs);

const minifyJs = () => src(['./dist/**/*.js', '!./dist/**/*.min.js'])
  .pipe(eslint())
  .pipe(eslint.failOnError())
  .pipe(terser({
    mangle: false,
  }))
  .pipe(rename({extname: '.min.js'}))
  .pipe(dest('./dist/'));

const buildCss = () => src('./src/**/*.css')
  .pipe(dest('./dist/'));

const watchCss = () => watch('./src/**/*.css', buildCss);

const minifyCss = () => src(['./dist/**/*.css', '!./dist/**/*.min.css'])
  .pipe(rename({extname: '.min.css'}))
  .pipe(cleanCss())
  .pipe(dest('./dist/'));

module.exports = {
  buildJs,
  buildCss,
  build: parallel(buildJs, buildCss),
  watchJs,
  watchCss,
  watch: parallel(watchJs, watchCss),
  minifyJs,
  minifyCss,
  minify: parallel(minifyCss, minifyJs),
  default: series(parallel(buildJs, buildCss), parallel(minifyCss, minifyJs)),
};
