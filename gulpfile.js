var gulp = require('gulp');
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var browserSync = require('browser-sync');
var concat = require('gulp-concat');
var imagemin = require('gulp-imagemin');
var pngquant = require('imagemin-pngquant');
var del = require('del');
var cache = require('gulp-cache');
var autoprefixer = require('gulp-autoprefixer');
var cleancss      = require('gulp-clean-css');
var notify        = require("gulp-notify");
var pxtorem = require('gulp-pxtorem');
var purgecss = require('gulp-purgecss');
var rsync = require('gulp-rsync');


var path = {
    src: { //Пути откуда брать исходники
        html: 'app/*.html', //Синтаксис src/template/*.html говорит gulp что мы хотим взять все файлы с расширением .html
        js: 'app/js/app.js',//В стилях и скриптах нам понадобятся только main файлы
        css: 'app/css/styles.css',
        img: 'app/images/**/*.*', //Синтаксис img/**/*.* означает - взять все файлы всех расширений из папки и из вложенных каталогов
        fonts: 'app/fonts/**/*.*'
    }
}

gulp.task('browser-sync', function () { // Создаем таск browser-sync
    browserSync({ // Выполняем browserSync
        server: { // Определяем параметры сервера
            baseDir: 'app' // Директория для сервера - app
        },
        notify: false // Отключаем уведомления
    });
});

gulp.task('css', function () { // Создаем таск css
    return gulp.src([
        './node_modules/bootstrap/dist/css/bootstrap-reboot.css',
        './node_modules/bootstrap/dist/css/bootstrap-grid.css',
        'app/css/tip.css',
        'app/css/slick.css',
        'app/css/slick-theme.css',
        'app/css/jquery.arcticmodal-0.3.css',
        'app/css/simple.css',
        'app/css/styles.css'
    ]) // Берем источник
        .pipe(concat('styles.min.css'))
        .pipe(pxtorem({
            rootValue: 16,
            replace: false,
            propList: ['*']
        }))
        .pipe(autoprefixer({
            browsers: ['last 15 versions']
        }))
        .pipe(cleancss( {level: { 1: { specialComments: 0 } } }))
        .pipe(gulp.dest('app/css')) // Выгружаем результата в папку app/css
        .pipe(browserSync.reload( {stream: true} ))
});

gulp.task('img', function () {
    return gulp.src('app/images/**/*.*') // Берем все изображения из app
        .pipe(cache(imagemin({  // Сжимаем их с наилучшими настройками с учетом кеширования
            interlaced: true,
            progressive: true,
            svgoPlugins: [{ removeViewBox: false }],
            use: [pngquant()]
        })))
        .pipe(gulp.dest('dist/images')); // Выгружаем на продакшен
});


gulp.task('scripts', function () {
    return gulp.src([ // Берем все необходимые библиотеки
        './node_modules/jquery/dist/jquery.js',
        'app/js/tipr.js',
        'app/js/slick.js',
        'app/js/mask.js',
        'app/js/jquery.arcticmodal-0.3.min.js',
        'app/js/app.js'
        
    ])
        .pipe(concat('scripts.min.js')) // Собираем их в кучу в новом файле libs.min.js
        .pipe(uglify()) // Сжимаем JS файл
        .pipe(gulp.dest('app/js')) // Выгружаем в папку app/js
        .pipe(browserSync.reload({ stream: true }))
});

gulp.task('rsync', function() {
    return gulp.src('dist/**')
        .pipe(rsync({
            root: 'dist/',
            hostname: 'media-group.biz',
            username: 'root',
            destination: '/var/www/media-group/data/www/test1.media-group.biz',
             //include: ['../vendor','../'], // Includes files to deploy
            exclude: [], // Excludes files from deploy
            recursive: true,
            archive: true,
            silent: false,
            progress: true,
            compress: true
        },))
    //Документация: https://pinchukov.net/blog/gulp-rsync.html

});


gulp.task('watch', ['browser-sync', 'css', 'scripts'], function () {
    gulp.watch(path.src.css, ['css']); // Наблюдение за css файлами в папке css
    gulp.watch(path.src.js, ['scripts']);
    gulp.watch('app/*.html', browserSync.reload); // Наблюдение за HTML файлами в корне проекта

});

gulp.task('clean', function () {
    return del.sync('dist'); // Удаляем папку dist перед сборкой
});

gulp.task('renamehtml', () => {
    return gulp
        .src('app/index.html')
        .pipe(
            rename({
                extname: ".php"
            })
        )
        .pipe(gulp.dest('dist/'));
});



gulp.task('build', ['clean', 'css', 'scripts', 'renamehtml', 'img'], function () {

    var buildCss = gulp.src('app/css/styles.min.css')

        .pipe(gulp.dest('dist/css'));

   
    var buildJs = gulp.src('app/js/scripts.min.js') // Переносим скрипты в продакшен
        
        .pipe(gulp.dest('dist/js'));

    var buildFonts = gulp.src('app/fonts/**/*.*')

        .pipe(gulp.dest('dist/fonts'));

    // var buildHtml = gulp.src('app/index.html')
    //
    //     .pipe(gulp.dest('dist/'));

    var buildImages = gulp.src('app/images/**/*.*')

        .pipe(gulp.dest('dist/images'));

    var favImages = gulp.src('app/*.ico')

        .pipe(gulp.dest('dist/'));

    var mailMain = gulp.src('./vendor/**/*.*')

        .pipe(gulp.dest('dist/vendor/'));

    var sendit = gulp.src('sendit.php')

        .pipe(gulp.dest('dist/'));

});


gulp.task('clear', function () {
    return cache.clearAll();
});



gulp.task('default', ['watch']);