(function () {

  "use strict";


  const C = window.MICWANNA_CONFIG || {};



  /* =====================================================
     工具
  ===================================================== */

  function escapeHTML(value) {

    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  }


  function padNumber(number) {

    return String(number).padStart(3, "0");

  }



  /* =====================================================
     联赛倒计时
  ===================================================== */

  function updateLeagueDays() {

    const element =
      document.getElementById("leagueDays");

    if (!element) {
      return;
    }


    const now = new Date();

    let target =
      new Date(
        now.getFullYear(),
        4,
        10,
        0,
        0,
        0
      );


    /*
     * 如果今年 5 月 10 日已经过去，
     * 就计算下一年的 5 月 10 日。
     */
    if (now.getTime() >= target.getTime()) {

      target =
        new Date(
          now.getFullYear() + 1,
          4,
          10,
          0,
          0,
          0
        );

    }


    const milliseconds =
      target.getTime() - now.getTime();


    const days =
      Math.ceil(
        milliseconds / 86400000
      );


    element.textContent = days;

  }


  updateLeagueDays();

  setInterval(
    updateLeagueDays,
    60 * 1000
  );



  /* =====================================================
     海报轮播
  ===================================================== */

  const posterContainer =
    document.getElementById(
      "posterContainer"
    );

  const posterDots =
    document.getElementById(
      "posterDots"
    );

  const posterPrev =
    document.getElementById(
      "posterPrev"
    );

  const posterNext =
    document.getElementById(
      "posterNext"
    );


  let posters = [];

  let currentPoster = 0;

  let posterTimer = null;



  function renderPoster() {

    if (!posters.length) {

      posterContainer.innerHTML = `
        <div class="poster-empty">
          暂无海报
        </div>
      `;

      posterDots.innerHTML = "";

      return;

    }


    posterContainer.innerHTML = "";

    posterDots.innerHTML = "";


    posters.forEach(function (src, index) {

      const img =
        document.createElement("img");

      img.src = src;

      img.alt =
        "micwanna 海报 " +
        (index + 1);

      img.className =
        "poster-image" +
        (index === 0 ? " active" : "");

      posterContainer.appendChild(img);


      const dot =
        document.createElement("button");

      dot.type = "button";

      dot.className =
        "poster-dot" +
        (index === 0 ? " active" : "");

      dot.setAttribute(
        "aria-label",
        "切换到第 " +
        (index + 1) +
        " 张海报"
      );


      dot.addEventListener(
        "click",
        function () {

          showPoster(index);

          restartPosterTimer();

        }
      );


      posterDots.appendChild(dot);

    });

  }



  function showPoster(index) {

    if (!posters.length) {
      return;
    }


    currentPoster =
      (index + posters.length) %
      posters.length;


    const images =
      posterContainer.querySelectorAll(
        ".poster-image"
      );


    const dots =
      posterDots.querySelectorAll(
        ".poster-dot"
      );


    images.forEach(
      function (image, i) {

        image.classList.toggle(
          "active",
          i === currentPoster
        );

      }
    );


    dots.forEach(
      function (dot, i) {

        dot.classList.toggle(
          "active",
          i === currentPoster
        );

      }
    );

  }



  function nextPoster() {

    showPoster(
      currentPoster + 1
    );

  }



  function previousPoster() {

    showPoster(
      currentPoster - 1
    );

  }



  function restartPosterTimer() {

    if (posterTimer) {

      clearInterval(
        posterTimer
      );

    }


    if (posters.length > 1) {

      posterTimer =
        setInterval(
          nextPoster,
          C.poster.interval || 5000
        );

    }

  }



  if (posterPrev) {

    posterPrev.addEventListener(
      "click",
      function () {

        previousPoster();

        restartPosterTimer();

      }
    );

  }


  if (posterNext) {

    posterNext.addEventListener(
      "click",
      function () {

        nextPoster();

        restartPosterTimer();

      }
    );

  }



  /*
   * 自动扫描：
   *
   * 001.jpg
   * 002.jpg
   * 003.jpg
   * ...
   *
   * 中间即使有缺号也没关系。
   */
  function loadPosters() {

    const folder =
      C.poster.folder || "images/";

    const extension =
      C.poster.extension || ".jpg";

    const start =
      C.poster.start || 1;

    const max =
      C.poster.max || 200;


    const promises = [];


    for (
      let number = start;
      number <= max;
      number++
    ) {

      const src =
        folder +
        padNumber(number) +
        extension;


      promises.push(

        new Promise(
          function (resolve) {

            const image =
              new Image();


            image.onload =
              function () {

                resolve(src);

              };


            image.onerror =
              function () {

                resolve(null);

              };


            image.src = src;

          }
        )

      );

    }


    Promise.all(promises)
      .then(function (results) {

        posters =
          results.filter(Boolean);


        renderPoster();

        restartPosterTimer();

      });

  }


  loadPosters();



  /* =====================================================
     项目
  ===================================================== */

  function renderProjects() {

    const container =
      document.getElementById(
        "projectsGrid"
      );


    if (!container) {
      return;
    }


    const works =
      Array.isArray(C.works)
        ? C.works
        : [];


    container.innerHTML =
      works.map(function (work) {

        const name =
          escapeHTML(
            work.name || "未命名项目"
          );


        const logo =
          escapeHTML(
            work.logo || ""
          );


        const url =
          escapeHTML(
            work.url || "#"
          );


        return `

          <a
            class="project-card"
            href="${url}"
            target="_blank"
            rel="noopener noreferrer"
          >

            <img
              class="project-logo"
              src="${logo}"
              alt="${name}"
              loading="lazy"
            >

            <div class="project-name">
              ${name}
            </div>

            <div class="project-link-label">
              VIEW PROJECT →
            </div>

          </a>

        `;

      }).join("");

  }


  renderProjects();



  /* =====================================================
     Markdown
  ===================================================== */

  function inlineMarkdown(text) {

    let result =
      escapeHTML(text);


    /*
     * 行内代码
     */
    result =
      result.replace(
        /`([^`]+)`/g,
        "<code>$1</code>"
      );


    /*
     * 粗体
     */
    result =
      result.replace(
        /\*\*([^*]+)\*\*/g,
        "<strong>$1</strong>"
      );


    /*
     * 斜体
     */
    result =
      result.replace(
        /(^|[^*])\*([^*]+)\*/g,
        "$1<em>$2</em>"
      );


    /*
     * Markdown 链接
     */
    result =
      result.replace(
        /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g,
        '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
      );


    return result;

  }



  function markdownToHTML(markdown) {

    const lines =
      markdown
        .replace(/\r\n/g, "\n")
        .split("\n");


    const html = [];

    let inList = false;


    function closeList() {

      if (inList) {

        html.push("</ul>");

        inList = false;

      }

    }


    lines.forEach(function (line) {

      const trimmed =
        line.trim();


      /*
       * 空行
       */
      if (!trimmed) {

        closeList();

        return;

      }


      /*
       * 标题
       */
      const heading =
        trimmed.match(
          /^(#{1,6})\s+(.+)$/
        );


      if (heading) {

        closeList();

        const level =
          heading[1].length;


        html.push(
          "<h" +
          level +
          ">" +
          inlineMarkdown(
            heading[2]
          ) +
          "</h" +
          level +
          ">"
        );

        return;

      }


      /*
       * 无序列表
       */
      const list =
        trimmed.match(
          /^[-*]\s+(.+)$/
        );


      if (list) {

        if (!inList) {

          html.push("<ul>");

          inList = true;

        }


        html.push(
          "<li>" +
          inlineMarkdown(
            list[1]
          ) +
          "</li>"
        );


        return;

      }


      /*
       * 引用
       */
      if (trimmed.startsWith(">")) {

        closeList();

        html.push(
          "<blockquote>" +
          inlineMarkdown(
            trimmed.slice(1).trim()
          ) +
          "</blockquote>"
        );

        return;

      }


      /*
       * 普通段落
       */
      closeList();

      html.push(
        "<p>" +
        inlineMarkdown(trimmed) +
        "</p>"
      );

    });


    closeList();


    return html.join("");

  }



  async function loadAnnouncement() {

    const container =
      document.getElementById(
        "announcementContent"
      );


    if (!container) {
      return;
    }


    try {

      const response =
        await fetch(
          "an.md",
          {
            cache: "no-cache"
          }
        );


      if (!response.ok) {
        throw new Error(
          "无法读取 an.md"
        );
      }


      const markdown =
        await response.text();


      container.innerHTML =
        markdownToHTML(
          markdown
        );

    } catch (error) {

      container.innerHTML = `
        <p>
          暂时无法读取公告。
        </p>
      `;

      console.error(error);

    }

  }


  loadAnnouncement();



  /* =====================================================
     GitHub 代码量
  ===================================================== */

  async function fetchAllRepositories() {

    const owner =
      C.owner || "GumingDilian-hub";


    const repositories = [];


    /*
     * 每页最多 100 个仓库。
     */
    for (
      let page = 1;
      page <= 5;
      page++
    ) {

      const url =
        "https://api.github.com/users/" +
        encodeURIComponent(owner) +
        "/repos?per_page=100&page=" +
        page +
        "&type=owner";


      const response =
        await fetch(url);


      if (!response.ok) {

        throw new Error(
          "GitHub API 请求失败"
        );

      }


      const data =
        await response.json();


      if (!Array.isArray(data)) {
        break;
      }


      repositories.push(
        ...data
      );


      if (data.length < 100) {
        break;
      }

    }


    /*
     * Fork 项目不计入本站原创代码量。
     */
    return repositories.filter(
      function (repo) {

        return !repo.fork;

      }
    );

  }



  async function calculateCodeAmount() {

    const amountElement =
      document.getElementById(
        "codeAmount"
      );


    const descriptionElement =
      document.getElementById(
        "codeDescription"
      );


    if (!amountElement) {
      return;
    }


    try {

      const repositories =
        await fetchAllRepositories();


      let totalBytes = 0;


      /*
       * 查询每个仓库的 Languages API。
       */
      const languageRequests =
        repositories.map(
          async function (repo) {

            if (!repo.languages_url) {
              return {};
            }


            const response =
              await fetch(
                repo.languages_url
              );


            if (!response.ok) {
              return {};
            }


            return response.json();

          }
        );


      const languages =
        await Promise.all(
          languageRequests
        );


      languages.forEach(
        function (languageData) {

          Object.values(
            languageData
          ).forEach(
            function (bytes) {

              totalBytes +=
                Number(bytes) || 0;

            }
          );

        }
      );


      amountElement.textContent =
        formatBytes(
          totalBytes
        );


      if (descriptionElement) {

        descriptionElement.textContent =
          "GitHub Languages API · " +
          repositories.length +
          " 个原创仓库";

      }

    } catch (error) {

      amountElement.textContent =
        "—";


      if (descriptionElement) {

        descriptionElement.textContent =
          "GitHub API 暂时无法访问";

      }


      console.error(error);

    }

  }



  function formatBytes(bytes) {

    if (!bytes) {
      return "0 B";
    }


    const units = [
      "B",
      "KB",
      "MB",
      "GB",
      "TB"
    ];


    let index = 0;

    let value = bytes;


    while (
      value >= 1024 &&
      index < units.length - 1
    ) {

      value /= 1024;

      index++;

    }


    if (index === 0) {

      return (
        Math.round(value) +
        " " +
        units[index]
      );

    }


    return (
      value.toFixed(1) +
      " " +
      units[index]
    );

  }


  calculateCodeAmount();


})();
