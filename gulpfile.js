// include plug-ins
var gulp = require('gulp');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var del = require('del'); 
var less = require('gulp-less');
var path = require('path');


gulp.task('less', function () {
    return gulp.src('less/**/*.less')
      .pipe(less({
          paths: [path.join(__dirname, 'less', 'includes')]
      }))
      .pipe(gulp.dest('css'));
});

var config = {
    //Include all js files but exclude any min.js files
    src: ['js/*.js', '!js/**/*.min.js', '!js/3rdparty/**'],
    srcless: ['less/**/*.less' ]
}

//delete the output file(s)
gulp.task('clean',   function () {
    //del is an async function and not a gulp plugin (just standard nodejs)
    //It returns a promise, so make sure you return that from this task function
    //  so gulp knows when the delete is complete
    del(['app/all.min.js']);
    return del(['app/all.js']);
});

// Combine and minify all files from the app folder
// This tasks depends on the clean task which means gulp will ensure that the 
// Clean task is completed before running the scripts task.
gulp.task('js', ['clean'], function () {


    gulp.src(config.src) 
      .pipe(concat('all.js'))
      .pipe(gulp.dest('app/'));

    return gulp.src(config.src)
      .pipe(uglify())
      .pipe(concat('all.min.js'))
      .pipe(gulp.dest('app/'));
});
  

//Set a default tasks
gulp.task('default', ['js'], function () { });

gulp.task('watch', function () {
      gulp.watch(config.src, ['js']);
    return gulp.watch(config.srcless, ['less']);
});