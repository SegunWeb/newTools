const gulp = require("gulp");
const sass = require("gulp-sass");
const uglify = require("gulp-uglify-es").default;
const cleanCSS = require("gulp-clean-css");
const concat = require("gulp-concat");
const merge = require("merge-stream");
const workboxBuild = require("workbox-build");

const babel = require("gulp-babel");
const autoprefixer = require("gulp-autoprefixer");

let pages = [
  {
    name: "homepage",
    scripts: [
      "./src/libs/swiper/swiper-bundle.min.js",
      "./src/libs/vanilla-masker/vanilla-masker.min.js",
      "./src/js/index.js",
      "./src/js/homepage.js",
    ],
  },
];

// let scssHeads = pages.map(({ name }) => `./src/scss/${name}/${name}-head.scss`);
let scssBodyes = pages.map(({ name }) => `./src/scss/${name}/${name}.scss`);

// Generate css
gulp.task("scss", function () {
  return gulp
      .src([...scssBodyes])
      .pipe(sass().on("error", sass.logError))
      .pipe(autoprefixer())
      .pipe(cleanCSS({ level: { 1: { specialComments: 0 } } }))
      .pipe(gulp.dest("./_site/src/css"));
});

/*
 Uglify our javascript files into one.
 Use pump to expose errors more usefully.
*/
gulp.task("js", function () {
  let tasks = pages.map(({ name, scripts }) => {
    return gulp
        .src(scripts)
        .pipe(
            babel({
              presets: ["@babel/env"],
            })
        )
        .pipe(uglify())
        .pipe(concat(`${name}.js`))
        .pipe(gulp.dest("./_site/src/js"));
  });

  return merge(tasks);
});

gulp.task("fonts", function () {
  return gulp.src("./src/fonts/*/*.*").pipe(gulp.dest("./_site/src/fonts"));
});

gulp.task("libs", function () {
  return gulp
      .src("./src/libs/lazy-load/*.js")
      .pipe(gulp.dest("./_site/src/js"));
});

gulp.task("icons", function () {
  return gulp
      .src("./src/image/**/**.*")
      .pipe(gulp.dest("./_site/src/image/"));
});

gulp.task("buildSW", () => {
  return workboxBuild.generateSW({
    globDirectory: "_site",
    globPatterns: ["**/*.{html,eot,ttf,woff,woff2,js,css}"],
    swDest: "_site/sw.js",
    runtimeCaching: [
      {
        urlPattern: /\.(?:png|jpg|jpeg|svg|webp)$/,
        handler: "CacheFirst",
        options: {
          cacheName: "images",
          expiration: {
            maxEntries: 10,
          },
        },
      },
    ],
  });
});

/*
  Watch folders for changess
*/
gulp.task("watch", function () {
  gulp.watch("./src/scss/**/*.scss", gulp.parallel("scss"));
  gulp.watch("./src/js/**/*.js", gulp.parallel("js"));
});

/*
  Let's build this sucker.
*/
gulp.task("build", gulp.parallel("scss", "fonts", "js", "libs", "icons"));