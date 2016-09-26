const gulp         = require("gulp"),
      pug          = require("gulp-pug"),
      sass         = require("gulp-sass"),
      autoprefixer = require("gulp-autoprefixer"),
      imagemin     = require("gulp-imagemin"),
      cache        = require("gulp-cache"),
      browserify   = require("gulp-browserify"),
      del          = require("del"),
      runSequence  = require("run-sequence"),
      ngrok        = require("ngrok"),
      exec         = require("child_process").exec;
      config = {
          root:   ".",
          start:  "src",
          finish: "dist",
          port:   8080
      };

gulp.task("pages", function() {
  return gulp.src(config.root+"/"+config.start+"/pages/index.pug")
             .pipe(pug())
             .pipe(gulp.dest(config.root+"/"+config.finish+"/pages"));
});

gulp.task("styles", function() {
  return gulp.src(config.root+"/"+config.start+"/styles/*.scss")
             .pipe(sass()).on("error", sass.logError)
             .pipe(autoprefixer())
             .pipe(gulp.dest(config.root+"/"+config.finish+"/styles"));
});

gulp.task("scripts", function() {
  return gulp.src(config.root+"/"+config.start+"/scripts/**/*.js")
             .pipe(browserify())
             .pipe(gulp.dest(config.root+"/"+config.finish+"/scripts"));
});

gulp.task("clean", function() {
  return del(config.root+"/"+config.finish+"/**/*", {force: true});
});

gulp.task("build", ["clean"], function() {
  runSequence(["pages", "styles", "scripts"]);
});

gulp.task("watch", ["build"], function() {
  gulp.watch(config.root+"/"+config.start+"/**/*.*", ["build"]);
});

gulp.task("server", function() {
  exec("node server", function (err, stdout, stderr) {
      console.log(stdout);
      console.log(stderr);
  });
});

gulp.task("tunnel", ["server"], function() {
  ngrok.connect(config.port, function (err, url) {
      if (err) {
          console.log(err);
          return;
      }
      console.log("Tunnel created at "+url+".");
  });
});

gulp.task("default", function() {
  runSequence("watch", "server", "tunnel");
});
