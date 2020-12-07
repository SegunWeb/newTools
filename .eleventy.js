const htmlmin = require("html-minifier");
const svgContents = require("eleventy-plugin-svg-contents");
const Image = require("@11ty/eleventy-img");
const sharp = require("sharp");
const pluginInlineCss = require("@navillus/eleventy-plugin-inline-css");

module.exports = function (eleventyConfig) {
  const outputFormat = ["webp", "png"];

  const imageOptions = {
    widths: [null],
    formats: outputFormat,
    urlPath: "/src/image/",
    outputDir: "./_site/src/image/",
  };

  eleventyConfig.addTransform("htmlmin", function (content, outputPath) {
    if (outputPath.endsWith(".html")) {
      let minified = htmlmin.minify(content, {
        useShortDoctype: true,
        removeComments: true,
        collapseWhitespace: true,
      });
      return minified;
    }

    return content;
  });

  // eleventyConfig.addPlugin(pluginInlineCss, {
  //   input: "_site/src",
  //   selector: 'link[rel="stylesheet"][data-inline]',
  //   cleanCss: false,
  // });

  eleventyConfig.addShortcode("myImage", async function (src, alt) {
    if (!alt) {
      throw new Error(`Missing \`alt\` on myImage from: ${src}`);
    }

    let stats = await Image(src, {
      ...imageOptions,
      widths: [null],
    });

    let lowestSrc = stats["png"][0];
    let sizes = "100vw";

    const placeholder = await sharp(stats["webp"][0].outputPath)
      .resize({ fit: sharp.fit.inside })
      .blur()
      .toBuffer();

    const base64Placeholder = `data:image/png;base64,${placeholder.toString(
      "base64"
    )}`;

    const source = Object.values(stats)
      .map((imageFormat) => {
        return `<source type="image/${
          imageFormat[0].format
        }" data-srcset="${imageFormat
          .map((entry) => `${entry.url} ${entry.width}w`)
          .join(", ")}" sizes="${sizes}">`;
      })
      .join("\n");

    const img = `<img
      class="lazyload"
      alt="${alt}"
      src="${base64Placeholder}"
      data-src="${lowestSrc.url}"
      width="${lowestSrc.width}"
      height="${lowestSrc.height}">`;

    return `<picture> ${source} ${img} </picture>`;
  });

  eleventyConfig.addShortcode("myBackground", async function (
    className,
    desktopSrc,
    mobileSrc
  ) {
    let desktopStats,
      mobileStats,
      bgset = "";

    let format = "jpg";

    if (mobileSrc) {
      mobileStats = await Image(mobileSrc, {
        ...imageOptions,
        formats: [format],
      });
      bgset += mobileStats[format][0].url;
    }

    if (desktopSrc) {
      desktopStats = await Image(desktopSrc, {
        ...imageOptions,
        formats: [format],
      });
      if (bgset !== "") {
        bgset += ` [--medium] | ${desktopStats[format][0].url}`;
      } else {
        bgset += desktopStats[format][0].url;
      }
    }

    return `
      class="${className} lazyload"
      data-bgset="${bgset}"
      data-sizes="auto"
    `;
  });

  eleventyConfig.addShortcode("includeScript", async function (src) {
    return `
    <script>
      window.addEventListener('load', function(){
        let script=document.createElement('script');
        script.src="${src}";
        document.body.appendChild(script);

   
      });
    </script>
    `;
  });
  eleventyConfig.addShortcode("lazyScript", function () {
    return `
      <script async src="/src/js/lazy-load.js"></script>
    `;
  });

  eleventyConfig.addPlugin(svgContents);
};
