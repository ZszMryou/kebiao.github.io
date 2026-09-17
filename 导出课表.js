/*
 * 教务系统课表导出脚本
 * ============================================
 * 用法:
 * 1. 在浏览器打开教务系统课表页面(个人课表查询)
 * 2. 按 F12 打开开发者工具,切到 Console(控制台)
 * 3. 把本文件全部内容粘贴进去,按回车
 * 4. 会自动下载「课表.txt」文件,包含全部课程数据
 *
 * 说明:
 * - 该脚本调用教务系统课表 API,获取的是【全部】课程数据
 *   (网页表格只显示当前周,但 API 返回所有周次的数据)
 * - 下载的 txt 是「网页表格格式」,可直接用课表.html 导入
 * ============================================
 */

(function () {
  // 从页面读取当前学年学期
  function getXnxq() {
    var xnm = (document.getElementById('xnm') || {}).value;
    var xqm = (document.getElementById('xqm') || {}).value;
    if (!xnm || !xqm) {
      // 兜底: 从 URL 或页面文本推断
      var m = document.body.innerText.match(/(\d{4})-(\d{4})学年第(\d)学期/);
      if (m) { xnm = m[1]; xqm = m[3] === '1' ? '3' : (m[3] === '2' ? '12' : '16'); }
    }
    return { xnm: xnm || '2026', xqm: xqm || '3' };
  }

  function fetchKb() {
    var xnxq = getXnxq();
    var body = 'xnm=' + xnxq.xnm + '&xqm=' + xnxq.xqm + '&kzlx=ck&xsdm=&kclbdm=&kclxdm=';
    return fetch('/jwglxt/kbcx/xskbcx_cxXsgrkb.html?gnmkdm=N2151', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body
    }).then(function (r) { return r.json(); });
  }

  function buildGrid(data) {
    var kbList = data.kbList || [];
    var xsxx = data.xsxx || {};
    var lines = [];
    lines.push('# 课表文件 - 网页表格格式');
    lines.push('# ' + (xsxx.XNMC || '') + '学年第' + (xsxx.XQMMC || '') + '学期 ' +
      (xsxx.XM || '') + ' ' + (xsxx.XH || '') + ' ' + (xsxx.ZYMC || ''));
    lines.push('节次\t星期一\t星期二\t星期三\t星期四\t星期五\t星期六\t星期日');
    for (var p = 1; p <= 10; p++) {
      var row = [String(p)];
      for (var d = 1; d <= 7; d++) {
        var cs = kbList.filter(function (k) {
          var jc = (k.jcor || '').split('-');
          var s = parseInt(jc[0]);
          return parseInt(k.xqj) === d && s === p;
        });
        row.push(cs.map(function (k) {
          return (k.kcmc || '') + ' (' + (k.jcor || '') + '节)' + (k.zcd || '') + ' ' +
            (k.xqmc || '') + (k.cdmc || '') + ' ' + (k.xm || '');
        }).join('|'));
      }
      lines.push(row.join('\t'));
    }
    return { text: lines.join('\n'), count: kbList.length };
  }

  function download(text, filename) {
    var blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  fetchKb().then(function (data) {
    var kbList = data.kbList || [];
    if (kbList.length === 0) {
      console.warn('未获取到课程数据,请确认已登录且当前学年学期正确');
      return;
    }
    var grid = buildGrid(data);
    download(grid.text, '课表.txt');
    console.log('已导出 ' + grid.count + ' 门课程 → 课表.txt');
    console.log('提示: 用「课表.html」导入该文件即可查看');
  }).catch(function (e) {
    console.error('导出失败:', e);
    console.error('请确认当前页面是教务系统课表页面,且已登录');
  });
})();